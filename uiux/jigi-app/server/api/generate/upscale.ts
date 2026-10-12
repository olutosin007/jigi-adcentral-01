import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAuthenticatedUser, getSupabaseAdmin } from '../lib/supabase.js'
import { runReplicateModel } from '../lib/replicate.js'
import { getImageRoutingCaps } from '../lib/image-routing.js'
import {
  buildUpscaledAssetInsert,
  checkUpscalable,
  getUpscaleModel,
  replicateOutputToUrl,
  validateUpscaleRequest,
  type SourceImageAsset,
} from '../lib/upscale.js'

function utcDayStartIso(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString()
}

function extensionFor(contentType: string): string {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  if (contentType.includes('webp')) return 'webp'
  return 'png'
}

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>

/** Creator of the asset or campaign, a member of the brand's org, or an agency with active access. */
async function canAccessAsset(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
  asset: SourceImageAsset & { campaigns?: unknown }
): Promise<boolean> {
  const campaign = asset.campaigns as {
    created_by?: string | null
    brand_id?: string | null
    brands?: { organisation_id?: string | null } | null
  } | null
  if (asset.created_by === userId || campaign?.created_by === userId) return true

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organisation_id')
    .eq('id', userId)
    .single()
  const userOrgId = (profile as { organisation_id?: string } | null)?.organisation_id
  if (!userOrgId || !campaign?.brand_id) return false
  if (campaign.brands?.organisation_id === userOrgId) return true

  const { data: agencyAccess } = await supabaseAdmin
    .from('agency_brand_access')
    .select('brand_id')
    .eq('agency_organisation_id', userOrgId)
    .eq('status', 'active')
    .eq('brand_id', campaign.brand_id)
    .maybeSingle()
  return Boolean(agencyAccess)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user, error: authError } = await getAuthenticatedUser(req.headers.authorization as string)
  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  const validation = validateUpscaleRequest(req.body)
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const startTime = Date.now()
  const model = getUpscaleModel()

  const { data: source, error: fetchError } = await supabaseAdmin
    .from('creative_assets')
    .select('id, campaign_id, type, version, content, created_by, campaigns ( created_by, brand_id, brands ( organisation_id ) )')
    .eq('id', validation.assetId)
    .single()

  if (fetchError || !source) {
    return res.status(404).json({ error: 'Asset not found' })
  }

  const asset = source as SourceImageAsset & { campaigns?: unknown }
  if (!(await canAccessAsset(supabaseAdmin, user.id, asset))) {
    return res.status(403).json({ error: 'You do not have access to this asset' })
  }

  const notUpscalable = checkUpscalable(asset)
  if (notUpscalable) {
    return res.status(400).json({ error: notUpscalable })
  }

  const { count: userCount } = await supabaseAdmin
    .from('image_routing_events')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'success')
    .eq('user_id', user.id)
    .gte('created_at', utcDayStartIso())
  if ((userCount ?? 0) >= getImageRoutingCaps().perUserDailyCap) {
    return res.status(429).json({
      error: 'Daily image limit reached for this user. Try again after UTC midnight.',
      code: 'IMAGE_QUOTA_LOCKED',
    })
  }

  const routingEvent = {
    user_id: user.id,
    campaign_id: asset.campaign_id,
    image_provider: 'replicate',
    provider_model: model,
    image_tier: 'final',
    routing_reason: 'default',
    cost_bucket: 'free',
    route_attempt: 1,
  }

  try {
    const output = await runReplicateModel(model, {
      image: asset.content?.url,
      scale: validation.scale,
    })
    const upscaledUrl = replicateOutputToUrl(output)
    if (!upscaledUrl) throw new Error('Upscaler returned no image')

    const imageResponse = await fetch(upscaledUrl)
    if (!imageResponse.ok) throw new Error('Failed to fetch upscaled image')
    const contentType = imageResponse.headers.get('content-type') || 'image/png'
    const filename = `${asset.campaign_id}/${Date.now()}-upscaled.${extensionFor(contentType)}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('generated-images')
      .upload(filename, await imageResponse.arrayBuffer(), { contentType, upsert: false })
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('generated-images').getPublicUrl(filename)

    const insert = buildUpscaledAssetInsert({
      source: asset,
      userId: user.id,
      url: publicUrl,
      scale: validation.scale,
      model,
    })
    const { data: created, error: insertError } = await supabaseAdmin
      .from('creative_assets')
      .insert(insert)
      .select()
      .single()
    if (insertError) throw new Error(`Asset save failed: ${insertError.message}`)

    await supabaseAdmin.from('image_routing_events').insert({ ...routingEvent, status: 'success' })
    await supabaseAdmin.from('generation_log').insert({
      user_id: user.id,
      campaign_id: asset.campaign_id,
      type: 'image',
      model,
      image_provider: 'replicate',
      image_tier: 'final',
      routing_reason: 'default',
      cost_bucket: 'free',
      status: 'success',
      latency_ms: Date.now() - startTime,
    })

    return res.json({
      asset: created,
      image_url: publicUrl,
      model,
      estimated_cost_usd: (insert.content as { estimated_cost_usd: number | null }).estimated_cost_usd,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upscale failed'
    await supabaseAdmin
      .from('image_routing_events')
      .insert({ ...routingEvent, status: 'error', error_message: message })
    console.error('Upscale error:', error)
    return res.status(500).json({ error: message })
  }
}
