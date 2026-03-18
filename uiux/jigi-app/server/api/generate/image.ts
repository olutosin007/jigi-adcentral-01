import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, getAuthenticatedUser } from '../lib/supabase.js'
import { generateImageWithReplicateModel } from '../lib/replicate.js'
import { generateImageWithGoogleImagen } from '../lib/google-imagen.js'
import { generateImageWithAzure } from '../lib/azure-image.js'
import { generateImageWithFoundryFlux } from '../lib/azure-foundry-flux.js'
import {
  buildRouteChain,
  getImageRoutingCaps,
  getImageRoutingProviderMode,
  hasAzureImageConfig,
  hasFoundryFluxConfig,
  isRetryableProviderError,
  resolveRoute,
  type ImageRoutingMetadata,
  type ImageTier,
  type ResolvedRoute,
} from '../lib/image-routing.js'
import { ensureDatabaseContract } from '../lib/schema-contract.js'

type LegacyImageQuality = 'draft' | 'standard' | 'high'
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4'

interface GenerateImageRequest {
  prompt: string
  campaign_id: string
  brand_id?: string
  concept_id?: string
  aspect_ratio?: AspectRatio
  image_tier?: ImageTier
  quality?: LegacyImageQuality
  brand_context?: {
    name: string
    voice?: { tone?: string[] }
    identity?: {
      colours?: { primary?: string; secondary?: string; accent?: string }
      logo_url?: string
    }
  }
  lineage?: {
    cco_version?: number
    bio_version?: number
    generation_timestamp?: string
  }
  prompt_hash?: string
}

interface ProviderExecutionResult {
  imageBuffer: ArrayBuffer
  contentType: string
  modelUsed: string
  revisedPrompt?: string
}

interface QuotaState {
  tierCount: number
  userCount: number
  campaignCount: number
  paidCount: number
}

function mapLegacyQualityToTier(quality?: LegacyImageQuality): ImageTier {
  if (quality === 'high') return 'final'
  if (quality === 'standard') return 'refine'
  return 'draft'
}

function isLikelyQuotaError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return (
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('resource exhausted') ||
    message.includes('429')
  )
}

function getUtcDayStartIso(date = new Date()): string {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  ).toISOString()
}

function inferExtension(contentType: string): string {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  return 'png'
}

async function loadQuotaState(params: {
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>
  campaignId: string
  userId: string
  imageTier: ImageTier
}): Promise<QuotaState> {
  const { supabaseAdmin, campaignId, userId, imageTier } = params
  const dayStart = getUtcDayStartIso()

  const [tierResult, userResult, campaignResult, paidResult] = await Promise.all([
    supabaseAdmin
      .from('image_routing_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success')
      .eq('image_tier', imageTier)
      .gte('created_at', dayStart),
    supabaseAdmin
      .from('image_routing_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success')
      .eq('user_id', userId)
      .gte('created_at', dayStart),
    supabaseAdmin
      .from('image_routing_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success')
      .eq('campaign_id', campaignId)
      .gte('created_at', dayStart),
    supabaseAdmin
      .from('image_routing_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'success')
      .eq('cost_bucket', 'paid_fallback')
      .gte('created_at', dayStart),
  ])

  return {
    tierCount: tierResult.count || 0,
    userCount: userResult.count || 0,
    campaignCount: campaignResult.count || 0,
    paidCount: paidResult.count || 0,
  }
}

async function executeProvider(
  route: ResolvedRoute,
  prompt: string,
  aspectRatio: AspectRatio
): Promise<ProviderExecutionResult> {
  if (route.provider === 'google_imagen') {
    const generated = await generateImageWithGoogleImagen({
      prompt,
      model: route.model,
      aspectRatio,
    })
    return {
      imageBuffer: generated.buffer,
      contentType: generated.contentType,
      modelUsed: generated.model,
      revisedPrompt: generated.revisedPrompt,
    }
  }

  if (route.provider === 'replicate') {
    const imageUrls = await generateImageWithReplicateModel(route.model, {
      prompt,
      aspect_ratio: aspectRatio,
      num_outputs: 1,
      output_format: 'webp',
      output_quality: route.image_tier === 'final' ? 95 : route.image_tier === 'refine' ? 90 : 82,
    })
    const imageUrl = imageUrls[0]
    if (!imageUrl) {
      throw new Error('Replicate did not return an image URL')
    }
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch Replicate generated image')
    }
    return {
      imageBuffer: await imageResponse.arrayBuffer(),
      contentType: imageResponse.headers.get('content-type') || 'image/webp',
      modelUsed: route.model,
    }
  }

  if (route.provider === 'azure_foundry') {
    const generated = await generateImageWithFoundryFlux({
      prompt,
      aspectRatio,
    })
    return {
      imageBuffer: generated.buffer,
      contentType: generated.contentType,
      modelUsed: generated.model,
    }
  }

  const generated = await generateImageWithAzure({
    prompt,
    aspectRatio,
    deployment: route.model,
  })
  const imageResponse = await fetch(generated.imageUrl)
  if (!imageResponse.ok) {
    throw new Error('Failed to fetch Azure generated image')
  }
  return {
    imageBuffer: await imageResponse.arrayBuffer(),
    contentType: imageResponse.headers.get('content-type') || 'image/png',
    modelUsed: generated.model,
    revisedPrompt: generated.revisedPrompt,
  }
}

function enhancePromptWithBrand(
  prompt: string,
  _brandContext?: GenerateImageRequest['brand_context']
): string {
  // Client builds the full prompt with brand elements (colours, tone, logo, text)
  // per brandInclude flags. We only add a generic suffix here to avoid duplication.
  return `${prompt.trim()}. High quality, professional, clean design.`
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user, error: authError } = await getAuthenticatedUser(
    req.headers.authorization as string
  )

  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  const body = req.body as GenerateImageRequest

  if (!body.prompt || !body.campaign_id) {
    return res.status(400).json({
      error: 'Missing required fields: prompt, campaign_id',
    })
  }

  const startTime = Date.now()
  const imageTier = body.image_tier || mapLegacyQualityToTier(body.quality)
  const aspectRatio = body.aspect_ratio || '1:1'
  const supabaseAdmin = getSupabaseAdmin()
  const routingCaps = getImageRoutingCaps()
  const routingMode = getImageRoutingProviderMode()

  try {
    await ensureDatabaseContract(supabaseAdmin)

    if (
      routingMode === 'azure_only' &&
      !hasFoundryFluxConfig() &&
      !hasAzureImageConfig()
    ) {
      return res.status(500).json({
        error:
          'IMAGE_ROUTING_PROVIDER_MODE is azure_only but no image provider configured. Set AZURE_FOUNDRY_FLUX_ENDPOINT and AZURE_FOUNDRY_FLUX_API_KEY, or AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.',
      })
    }

    const enhancedPrompt = enhancePromptWithBrand(body.prompt, body.brand_context)
    const quotaState = await loadQuotaState({
      supabaseAdmin,
      campaignId: body.campaign_id,
      userId: user.id,
      imageTier,
    })

    if (quotaState.userCount >= routingCaps.perUserDailyCap) {
      await supabaseAdmin.from('image_routing_events').insert({
        user_id: user.id,
        brand_id: body.brand_id || null,
        campaign_id: body.campaign_id,
        image_provider: null,
        provider_model: null,
        image_tier: imageTier,
        routing_reason: 'quota_exhausted',
        cost_bucket: null,
        route_attempt: 0,
        status: 'error',
        error_message: 'Per-user daily image cap reached',
      })
      return res.status(429).json({
        error: 'Daily image limit reached for this user. Try again after UTC midnight.',
        code: 'IMAGE_QUOTA_LOCKED',
      })
    }

    if (quotaState.campaignCount >= routingCaps.perCampaignDailyCap) {
      await supabaseAdmin.from('image_routing_events').insert({
        user_id: user.id,
        brand_id: body.brand_id || null,
        campaign_id: body.campaign_id,
        image_provider: null,
        provider_model: null,
        image_tier: imageTier,
        routing_reason: 'quota_exhausted',
        cost_bucket: null,
        route_attempt: 0,
        status: 'error',
        error_message: 'Per-campaign daily image cap reached',
      })
      return res.status(429).json({
        error: 'Daily image limit reached for this campaign. Try again after UTC midnight.',
        code: 'IMAGE_QUOTA_LOCKED',
      })
    }

    let freeLaneExhausted = quotaState.tierCount >= routingCaps.tierDailyCaps[imageTier]
    const paidFallbackBlocked = quotaState.paidCount >= routingCaps.globalPaidDailyCap
    const routeChain = buildRouteChain(imageTier)

    if (!routeChain.length) {
      throw new Error('No image providers configured. Add Google and/or fallback provider credentials.')
    }

    let providerResult: ProviderExecutionResult | null = null
    let selectedRoute: ImageRoutingMetadata | null = null
    const routeErrors: string[] = []

    for (let routeAttempt = 0; routeAttempt < routeChain.length; routeAttempt++) {
      const route = resolveRoute(routeChain, {
        tier: imageTier,
        quotaExhaustedFreeLane: freeLaneExhausted,
        paidFallbackBlocked,
        attempt: routeAttempt,
      })
      if (!route) continue

      try {
        providerResult = await executeProvider(route, enhancedPrompt, aspectRatio)
        selectedRoute = route
        break
      } catch (firstError) {
        const retryable = isRetryableProviderError(firstError)
        if (retryable) {
          try {
            const retryRoute = {
              ...route,
              routing_reason: 'retry' as const,
              route_attempt: route.route_attempt + 1,
            }
            providerResult = await executeProvider(retryRoute, enhancedPrompt, aspectRatio)
            selectedRoute = retryRoute
            break
          } catch (retryError) {
            routeErrors.push(`${route.provider}: ${retryError instanceof Error ? retryError.message : 'Unknown retry error'}`)
            if (route.costBucket === 'free' && isLikelyQuotaError(retryError)) {
              freeLaneExhausted = true
            }
            continue
          }
        }

        routeErrors.push(`${route.provider}: ${firstError instanceof Error ? firstError.message : 'Unknown provider error'}`)
        if (route.costBucket === 'free' && isLikelyQuotaError(firstError)) {
          freeLaneExhausted = true
        }
      }
    }

    if (!providerResult || !selectedRoute) {
      if (freeLaneExhausted && paidFallbackBlocked) {
        await supabaseAdmin.from('image_routing_events').insert({
          user_id: user.id,
          brand_id: body.brand_id || null,
          campaign_id: body.campaign_id,
          image_provider: null,
          provider_model: null,
          image_tier: imageTier,
          routing_reason: 'budget_guard',
          cost_bucket: null,
          route_attempt: 0,
          status: 'error',
          error_message: 'Free lane exhausted and paid fallback blocked by daily cap',
        })
        return res.status(429).json({
          error:
            'Free tier is exhausted and paid fallback budget is locked for today. Try again after UTC midnight.',
          code: 'IMAGE_QUOTA_LOCKED',
        })
      }

      throw new Error(
        `Image generation failed across all routes. ${routeErrors.join(' | ')}`
      )
    }

    const extension = inferExtension(providerResult.contentType)
    const filename = `${body.campaign_id}/${Date.now()}.${extension}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('generated-images')
      .upload(filename, providerResult.imageBuffer, {
        contentType: providerResult.contentType,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('generated-images')
      .getPublicUrl(filename)

    const assetInsert: Record<string, unknown> = {
      campaign_id: body.campaign_id,
      created_by: user.id,
      type: 'image',
      generation_mode: body.brand_id ? 'brand_grounded' : 'idea_first',
      content: {
        url: publicUrl,
        prompt_used: body.prompt,
        enhanced_prompt: enhancedPrompt,
        model: providerResult.modelUsed,
        concept_id: body.concept_id,
        aspect_ratio: aspectRatio,
        revised_prompt: providerResult.revisedPrompt,
        image_provider: selectedRoute.image_provider,
        image_tier: selectedRoute.image_tier,
        routing_reason: selectedRoute.routing_reason,
        cost_bucket: selectedRoute.cost_bucket,
        provider_model: selectedRoute.provider_model,
        route_attempt: selectedRoute.route_attempt,
      },
      status: 'draft',
    }
    if (body.lineage?.cco_version != null) assetInsert.cco_version = body.lineage.cco_version
    if (body.lineage?.bio_version != null) assetInsert.bio_version = body.lineage.bio_version
    if (body.lineage?.generation_timestamp != null)
      assetInsert.generation_timestamp = body.lineage.generation_timestamp
    if (body.prompt_hash != null)
      assetInsert.validation_scores = { prompt_hash: body.prompt_hash }

    const { data: asset, error: assetError } = await supabaseAdmin
      .from('creative_assets')
      .insert(assetInsert)
      .select()
      .single()

    if (assetError) {
      throw new Error(`Asset save failed: ${assetError.message}`)
    }

    const latencyMs = Date.now() - startTime

    await supabaseAdmin.from('generation_log').insert({
      user_id: user.id,
      brand_id: body.brand_id || null,
      campaign_id: body.campaign_id,
      type: 'image',
      model: providerResult.modelUsed,
      generation_mode: body.brand_id ? 'brand_grounded' : 'idea_first',
      image_provider: selectedRoute.image_provider,
      image_tier: selectedRoute.image_tier,
      routing_reason: selectedRoute.routing_reason,
      cost_bucket: selectedRoute.cost_bucket,
      status: 'success',
      latency_ms: latencyMs,
      prompt_hash: body.prompt_hash || null,
    })

    await supabaseAdmin.from('image_routing_events').insert({
      user_id: user.id,
      brand_id: body.brand_id || null,
      campaign_id: body.campaign_id,
      image_provider: selectedRoute.image_provider,
      provider_model: selectedRoute.provider_model,
      image_tier: selectedRoute.image_tier,
      routing_reason: selectedRoute.routing_reason,
      cost_bucket: selectedRoute.cost_bucket,
      route_attempt: selectedRoute.route_attempt,
      status: 'success',
    })

    return res.json({
      asset,
      image_url: publicUrl,
      model: providerResult.modelUsed,
      image_provider: selectedRoute.image_provider,
      image_tier: imageTier,
      routing_reason: selectedRoute.routing_reason,
      cost_bucket: selectedRoute.cost_bucket,
      latency_ms: latencyMs,
    })
  } catch (error) {
    const latencyMs = Date.now() - startTime

    await supabaseAdmin.from('generation_log').insert({
      user_id: user.id,
      brand_id: body.brand_id || null,
      campaign_id: body.campaign_id,
      type: 'image',
      model: 'image-routing-failed',
      generation_mode: body.brand_id ? 'brand_grounded' : 'idea_first',
      image_provider: null,
      image_tier: imageTier,
      routing_reason: 'default',
      cost_bucket: null,
      status: 'error',
      latency_ms: latencyMs,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      prompt_hash: body.prompt_hash || null,
    })

    await supabaseAdmin.from('image_routing_events').insert({
      user_id: user.id,
      brand_id: body.brand_id || null,
      campaign_id: body.campaign_id,
      image_provider: null,
      provider_model: null,
      image_tier: imageTier,
      routing_reason: 'default',
      cost_bucket: null,
      route_attempt: 0,
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    })

    console.error('Image generation error:', error)

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Image generation failed',
    })
  }
}

