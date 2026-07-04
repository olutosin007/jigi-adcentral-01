import { generateText, generateImage as generateImageApi } from '@/lib/api-client'
import { buildConceptPrompt, buildCopyPrompt, buildCompliancePrompt, buildImagePrompt, buildCopyAnchorPromptBlock } from './prompts'
import { assemblePrompt } from '@/lib/prompt-assembly'
import { buildAssetLineage } from '@/lib/cco'
import { isConceptOutputSchema, normalizeConceptToDisplay, validateConcept } from '@/lib/concept-enforcement'
import {
  coerceValidationWarnings,
  mergeCopyValidationWarnings,
  normalizeCopyToDisplay,
  validateCopy,
} from '@/lib/copy-enforcement'
import { validateImage } from '@/lib/image-enforcement'
import { getCopyPromptBudget } from '@/lib/channel-constraints'
import type {
  GenerationRequest,
  GenerationResult,
  ConceptResult,
  CopyResult,
  ImageResult,
  CopyImageAnchor,
  ComplianceResult,
  BrandConstraints,
  BrandIncludeFlags,
  CampaignBrief,
  FallbackContext,
} from './types'

interface ConceptContextInput {
  theme: string
  headlines: string[]
  visual_direction: string
}

function extractColours(colours: unknown): { primary?: string; secondary?: string; accent?: string } {
  if (!colours) return {}
  if (Array.isArray(colours)) {
    const primary = (colours as { role?: string; hex?: string }[]).find(c => c.role === 'primary')?.hex
    const secondary = (colours as { role?: string; hex?: string }[]).find(c => c.role === 'secondary')?.hex
    const accent = (colours as { role?: string; hex?: string }[]).find(c => c.role === 'accent')?.hex
    return { primary, secondary, accent }
  }
  if (typeof colours === 'object' && colours !== null) {
    const obj = colours as Record<string, string | undefined>
    return {
      primary: obj.primary ?? obj.Primary,
      secondary: obj.secondary ?? obj.Secondary,
      accent: obj.accent ?? obj.Accent,
    }
  }
  return {}
}

function convertBrandToApiFormat(brand: BrandConstraints) {
  const { primary: primaryColour, secondary: secondaryColour, accent: accentColour } = extractColours(brand.identity?.colours)

  return {
    name: brand.name || '',
    voice: brand.voice ? {
      tone: brand.voice.tone,
      preferred_words: brand.voice.preferred_words,
      avoided_words: brand.voice.avoided_words,
    } : undefined,
    identity: {
      colours: {
        primary: primaryColour,
        secondary: secondaryColour,
        accent: accentColour,
      },
    },
  }
}

export class AIOrchestrator {
  async generateConcepts(
    brand: BrandConstraints | undefined,
    brief: CampaignBrief,
    fallback?: FallbackContext,
    _userId?: string,
    brandId?: string,
    campaignId?: string
  ): Promise<GenerationResult> {
    const generationMode = brand ? 'brand_grounded' : 'idea_first'

    try {
      let prompt: string
      let promptHash: string | undefined
      let lineage: { cco_version?: number; bio_version?: number; generation_timestamp?: string } | undefined

      const assembled =
        campaignId && brandId
          ? await assemblePrompt({ campaignId, brandId, track: 'concept' })
          : null

      if (assembled?.prompt) {
        prompt = assembled.prompt
        promptHash = assembled.hash
        lineage =
          assembled.cco_version != null
            ? buildAssetLineage(assembled.cco_version)
            : undefined
      } else {
        prompt = buildConceptPrompt(brand, brief, fallback)
      }

      let response = await generateText({
        type: 'concept',
        campaign_id: campaignId || '',
        brand_id: brandId,
        prompt,
        brand_context: brand ? convertBrandToApiFormat(brand) : undefined,
        seed_idea: fallback?.seed_idea,
        prompt_hash: promptHash,
        use_prompt_as_system: !!assembled?.prompt,
      })

      let rawConcepts = ((response.content as { concepts?: Record<string, unknown>[] }).concepts || []).slice(0, 2)
      const usingAssembledPrompt = !!assembled?.prompt
      const allValidSchema = rawConcepts.length > 0 && rawConcepts.every((r) => isConceptOutputSchema(r))

      if (usingAssembledPrompt && !allValidSchema) {
        response = await generateText({
          type: 'concept',
          campaign_id: campaignId || '',
          brand_id: brandId,
          prompt,
          brand_context: brand ? convertBrandToApiFormat(brand) : undefined,
          seed_idea: fallback?.seed_idea,
          prompt_hash: promptHash,
          use_prompt_as_system: true,
        })
        rawConcepts = ((response.content as { concepts?: Record<string, unknown>[] }).concepts || []).slice(0, 2)
      }
      const cco = assembled?.cco
      const validationContext = cco
        ? {
            keyMessage: cco.strategic_context?.key_message,
            selectedChannels: cco.channel_constraints?.map((c) => c.channel_id),
            psychographicTraits: cco.audience_context?.psychographic_traits,
          }
        : brand
          ? {
              // Brand-grounded (no CCO): the enriched prompt now emits alignment
              // fields, so run validation to surface low-alignment / missing links.
              keyMessage: brief.requirements?.trim() || brief.objective,
              selectedChannels: brief.channels,
            }
          : undefined

      const schemaMismatch =
        usingAssembledPrompt && rawConcepts.length > 0 && !rawConcepts.every((r) => isConceptOutputSchema(r))
      const schemaWarning = schemaMismatch
        ? 'Concept response did not match expected schema; some fields may be missing.'
        : undefined

      const concepts: ConceptResult[] = rawConcepts.map((raw) => {
        const normalized = normalizeConceptToDisplay(raw as Record<string, unknown>)
        const validation = validationContext ? validateConcept(normalized, validationContext) : { valid: true, warnings: [] }
        const warnings = [
          ...(schemaWarning ? [schemaWarning] : []),
          ...(validation.warnings ?? []),
        ].filter(Boolean)
        return {
          ...normalized,
          validation_warnings: warnings.length > 0 ? warnings : undefined,
        } as ConceptResult
      })

      return {
        type: 'concept',
        data: concepts,
        metadata: {
          model: response.model,
          latency_ms: response.latency_ms,
          generation_mode: generationMode,
          prompt_hash: promptHash,
          lineage,
          saved_assets: response.saved_assets,
        },
      }
    } catch (error) {
      throw error
    }
  }

  async generateCopy(
    brand: BrandConstraints | undefined,
    brief: CampaignBrief,
    format: string = 'social_post',
    fallback?: FallbackContext,
    _userId?: string,
    brandId?: string,
    campaignId?: string,
    conceptContext?: ConceptContextInput
  ): Promise<GenerationResult> {
    const generationMode = brand ? 'brand_grounded' : 'idea_first'

    try {
      const channelId = brief.channels?.[0] ?? format
      const copyBudget = getCopyPromptBudget(channelId)
      let prompt: string
      let promptHash: string | undefined
      let lineage: { cco_version?: number; bio_version?: number; generation_timestamp?: string } | undefined

      const assembled =
        campaignId && brandId
          ? await assemblePrompt({ campaignId, brandId, track: 'copy', channelId })
          : null

      if (assembled?.prompt) {
        prompt = assembled.prompt
        promptHash = assembled.hash
        lineage =
          assembled.cco_version != null
            ? buildAssetLineage(assembled.cco_version)
            : undefined
      } else {
        prompt = buildCopyPrompt(brand, brief, format, fallback, copyBudget)
      }

      const response = await generateText({
        type: 'copy',
        campaign_id: campaignId || '',
        brand_id: brandId,
        prompt,
        brand_context: brand ? convertBrandToApiFormat(brand) : undefined,
        seed_idea: fallback?.seed_idea,
        concept_context: conceptContext,
        prompt_hash: promptHash,
        use_prompt_as_system: !!assembled?.prompt,
      })

      const copyContent = response.content as { variations?: Record<string, unknown>[]; variants?: Record<string, unknown>[] }
      const rawVariants = (copyContent.variations || copyContent.variants || []).slice(0, 2)
      const cco = assembled?.cco
      const channelConstraint = cco?.channel_constraints?.find((c) => c.channel_id === channelId)
      const validationContext = cco
        ? {
            maxChars: channelConstraint?.copy_limits?.max_chars ?? copyBudget?.primaryMax,
            parsedRequirements: cco.hard_constraints?.parsed_requirements,
            parsedExclusions: cco.hard_constraints?.parsed_exclusions,
            legalDisclaimers: cco.hard_constraints?.legal_disclaimers,
          }
        : { maxChars: copyBudget?.primaryMax }

      const variants: CopyResult[] = rawVariants.map((raw) => {
        const normalized = normalizeCopyToDisplay(raw)
        const aiWarnings = coerceValidationWarnings(raw.validation_warnings)
        const forRules = { ...normalized, validation_warnings: undefined }
        const validation = validationContext
          ? validateCopy(forRules, validationContext)
          : validateCopy(forRules, {})
        const merged = mergeCopyValidationWarnings(aiWarnings, validation.warnings)
        return {
          ...normalized,
          validation_warnings: merged.length > 0 ? merged : undefined,
          truncation_suggestion: validation.truncation_suggestion,
          exclusions_violated: validation.exclusions_violated,
        } as CopyResult
      })

      return {
        type: 'copy',
        data: variants,
        metadata: {
          model: response.model,
          latency_ms: response.latency_ms,
          generation_mode: generationMode,
          prompt_hash: promptHash,
          lineage,
        },
      }
    } catch (error) {
      throw error
    }
  }

  async generateImage(
    brand: BrandConstraints | undefined,
    description: string,
    fallback?: FallbackContext,
    _userId?: string,
    brandId?: string,
    campaignId?: string,
    imageTier: 'draft' | 'refine' | 'final' = 'draft',
    conceptId?: string,
    brandInclude?: BrandIncludeFlags,
    channelId?: string,
    copyAnchor?: CopyImageAnchor
  ): Promise<GenerationResult> {
    const generationMode = brand ? 'brand_grounded' : 'idea_first'

    try {
      let prompt: string
      let promptHash: string | undefined
      let lineage: { cco_version?: number; bio_version?: number; generation_timestamp?: string } | undefined

      const copyBlockRaw = copyAnchor ? buildCopyAnchorPromptBlock(copyAnchor) : ''
      const copyBlockSuffix = copyBlockRaw ? `\n\n${copyBlockRaw}` : ''

      const assembled =
        campaignId && brandId
          ? await assemblePrompt({ campaignId, brandId, track: 'image', channelId: channelId ?? undefined })
          : null

      if (assembled?.prompt) {
        prompt =
          assembled.prompt +
          copyBlockSuffix +
          '\n\nUSER VISUAL DIRECTION:\n' +
          description
        promptHash = assembled.hash
        lineage =
          assembled.cco_version != null
            ? buildAssetLineage(assembled.cco_version)
            : undefined
      } else {
        const composedDescription = copyBlockRaw
          ? `${copyBlockRaw}\n\nUSER VISUAL DIRECTION:\n${description}`
          : description
        prompt = buildImagePrompt(brand, composedDescription, fallback, brandInclude)
      }

      const brandContext = brand ? (() => {
        const { primary: primaryColour, secondary: secondaryColour, accent: accentColour } = extractColours(brand.identity?.colours)

        const identity: {
          colours?: { primary?: string; secondary?: string; accent?: string }
          logo_url?: string
        } = {}
        if (brandInclude?.colours !== false) {
          identity.colours = {
            primary: primaryColour,
            secondary: secondaryColour,
            accent: accentColour,
          }
        }
        if (brandInclude?.logo !== false && brand.identity?.logo_url) {
          identity.logo_url = brand.identity.logo_url
        }

        const result: {
          name: string
          voice?: { tone?: string[] }
          identity: typeof identity
        } = {
          name: brand.name || '',
          identity,
        }
        if (brandInclude?.tone !== false && brand.voice?.tone?.length) {
          result.voice = { tone: brand.voice.tone }
        }
        return result
      })() : undefined

      const response = await generateImageApi({
        prompt,
        campaign_id: campaignId || '',
        brand_id: brandId,
        concept_id: conceptId,
        image_tier: imageTier,
        brand_context: brandContext,
        prompt_hash: promptHash,
        lineage,
        ...(copyAnchor?.copy_asset_id && { copy_asset_id: copyAnchor.copy_asset_id }),
        ...(copyAnchor?.headline?.trim() && { copy_headline_anchor: copyAnchor.headline.trim() }),
        ...(copyAnchor?.key_message?.trim() && { copy_key_message: copyAnchor.key_message.trim() }),
        ...(copyAnchor?.body_snippet?.trim() && { copy_body_snippet: copyAnchor.body_snippet.trim() }),
      })

      const brandColours =
        brand?.identity?.colours?.map((c) => c.hex).filter((h): h is string => !!h) ?? []
      const channelConstraint = assembled?.cco?.channel_constraints?.find(
        (c) => c.channel_id === (channelId ?? '')
      )
      const expectedDimensions = channelConstraint?.image_dimensions
        ? {
            width: channelConstraint.image_dimensions.width,
            height: channelConstraint.image_dimensions.height,
          }
        : undefined

      let validationResult: Awaited<ReturnType<typeof validateImage>> | null = null
      try {
        validationResult = await validateImage(response.image_url, {
          expectedDimensions,
          brandColours: brandColours.length > 0 ? brandColours : undefined,
        })
      } catch {
        // Validation failed (e.g. CORS); continue without
      }

      const imageData: ImageResult = {
        url: response.image_url,
        prompt_used: prompt,
        model: response.model,
        image_provider: response.image_provider,
        image_tier: response.image_tier,
        routing_reason: response.routing_reason,
        cost_bucket: response.cost_bucket,
        provider_model: response.model,
        channel: channelId,
        dimensions: expectedDimensions,
        ...(copyAnchor?.copy_asset_id && { copy_asset_id: copyAnchor.copy_asset_id }),
        ...(copyAnchor?.headline?.trim() && { copy_headline_anchor: copyAnchor.headline.trim() }),
        ...(copyAnchor?.key_message?.trim() && { copy_key_message: copyAnchor.key_message.trim() }),
        ...(validationResult && {
          colour_compliance: validationResult.colour_compliance,
          composition_check: validationResult.composition_check,
          validation_warnings:
            validationResult.warnings.length > 0 ? validationResult.warnings : undefined,
          safe_zones_violated: validationResult.safe_zones_violated,
        }),
      }

      return {
        type: 'image',
        data: [imageData],
        metadata: {
          model: response.model,
          latency_ms: response.latency_ms,
          generation_mode: generationMode,
          image_provider: response.image_provider,
          image_tier: response.image_tier,
          routing_reason: response.routing_reason,
          cost_bucket: response.cost_bucket,
          prompt_hash: promptHash,
          lineage,
          asset: response.asset,
        },
      }
    } catch (error) {
      throw error
    }
  }

  async checkCompliance(
    content: string,
    brand: BrandConstraints,
    campaignId?: string
  ): Promise<ComplianceResult> {
    try {
      const prompt = buildCompliancePrompt(content, brand)

      const response = await generateText({
        type: 'compliance',
        campaign_id: campaignId || '',
        prompt,
        brand_context: convertBrandToApiFormat(brand),
      })

      const result = response.content as unknown as ComplianceResult
      
      if (typeof result?.passed !== 'boolean' || !Array.isArray(result?.checks)) {
        return {
          passed: false,
          checks: [
            {
              name: 'Parse error',
              status: 'fail',
              message: 'Could not parse compliance check response.',
            },
          ],
        }
      }

      return result
    } catch (error) {
      console.error('Compliance check failed:', error)
      return {
        passed: false,
        checks: [
          {
            name: 'System error',
            status: 'fail',
            message: 'Could not perform compliance check due to system error.',
          },
        ],
      }
    }
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    switch (request.type) {
      case 'concept':
        return this.generateConcepts(
          request.brand,
          request.brief,
          request.fallback_context
        )
      case 'copy':
        return this.generateCopy(
          request.brand,
          request.brief,
          request.brief.channels?.[0] || 'social_post',
          request.fallback_context
        )
      case 'image':
        return this.generateImage(
          request.brand,
          request.brief.objective || request.fallback_context?.seed_idea || '',
          request.fallback_context
        )
      default:
        throw new Error(`Unknown generation type: ${request.type}`)
    }
  }
}

export const aiOrchestrator = new AIOrchestrator()
