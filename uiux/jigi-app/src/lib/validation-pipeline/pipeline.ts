/**
 * Validation Pipeline — PRD 09
 * Unified post-generation validation layer. Runs independently of generation.
 * Same pipeline for generated and imported assets.
 */

import { supabase } from '@/lib/supabase'
import { validateImportedConcept } from '@/lib/concept-enforcement'
import { validateImportedCopy } from '@/lib/copy-enforcement'
import { validateImportedImage } from '@/lib/image-enforcement'
import type {
  ValidationPipelineInput,
  ValidationPipelineResult,
  AssetType,
} from './types'

/**
 * Validate a single asset. Fetches asset if not provided.
 * Returns standardized result and persists to asset.
 */
export async function validateAsset(
  input: ValidationPipelineInput
): Promise<ValidationPipelineResult> {
  let asset = input.asset
  if (!asset) {
    const { data, error } = await supabase
      .from('creative_assets')
      .select('id, type, content')
      .eq('id', input.assetId)
      .eq('campaign_id', input.campaignId)
      .single()
    if (error || !data) {
      throw new Error(`Asset not found: ${input.assetId}`)
    }
    asset = {
      id: data.id,
      type: data.type as AssetType,
      content: (data.content as Record<string, unknown>) ?? {},
    }
  }

  const content = asset.content as Record<string, unknown>
  const result = await runValidation(asset.type, content, input.campaignId)

  const pipelineResult: ValidationPipelineResult = {
    assetId: asset.id,
    assetType: asset.type,
    valid: result.valid,
    blocking: result.blocking,
    warnings: result.warnings,
    scores: result.scores,
    checklists: result.checklists,
    suggestions: result.suggestions,
    normalizedContent: result.normalizedContent,
  }

  await persistValidationResult(input.assetId, pipelineResult)

  return pipelineResult
}

async function runValidation(
  type: AssetType,
  content: Record<string, unknown>,
  campaignId: string
): Promise<{
  valid: boolean
  blocking: boolean
  warnings: string[]
  scores: ValidationPipelineResult['scores']
  checklists: ValidationPipelineResult['checklists']
  suggestions?: string[]
  normalizedContent?: Record<string, unknown>
}> {
  if (type === 'concept') {
    const { normalized, validation } = await validateImportedConcept(
      content,
      campaignId
    )
    return {
      valid: validation.valid,
      blocking: false,
      warnings: validation.warnings,
      scores: {
        brand_alignment: normalized.brand_alignment_score,
      },
      checklists: {},
      normalizedContent: normalized as unknown as Record<string, unknown>,
    }
  }

  if (type === 'copy') {
    const { normalized, validation } = await validateImportedCopy(
      content,
      campaignId
    )
    return {
      valid: validation.valid,
      blocking: validation.exclusions_violated,
      warnings: validation.warnings,
      scores: {
        brand_voice: normalized.brand_voice_score,
        tone_adherence: normalized.tone_adherence,
      },
      checklists: {
        mandatory_inclusions: normalized.mandatory_inclusions_check,
        exclusions: normalized.exclusions_check?.map((e) => ({
          item: e.exclusion,
          violated: e.violated,
        })),
      },
      suggestions: normalized.truncation_suggestion
        ? [normalized.truncation_suggestion]
        : undefined,
      normalizedContent: normalized as unknown as Record<string, unknown>,
    }
  }

  if (type === 'image') {
    const { normalized, validation } = await validateImportedImage(
      content as { url: string; [k: string]: unknown },
      campaignId
    )
    return {
      valid: validation.valid,
      blocking: validation.safe_zones_violated,
      warnings: validation.warnings,
      scores: {
        colour_compliance: normalized.colour_compliance?.bio_palette_match,
      },
      checklists: {
        composition: normalized.composition_check,
        exclusions: normalized.exclusions_check?.map((e) => ({
          item: e.exclusion,
          violated: e.violated,
        })),
      },
      normalizedContent: normalized as unknown as Record<string, unknown>,
    }
  }

  throw new Error(`Unknown asset type: ${type}`)
}

async function persistValidationResult(
  assetId: string,
  result: ValidationPipelineResult
): Promise<void> {
  const updates: Record<string, unknown> = {
    validation_scores: {
      valid: result.valid,
      blocking: result.blocking,
      scores: result.scores,
      checklists: result.checklists,
      validated_at: new Date().toISOString(),
    },
  }

  if (result.normalizedContent) {
    updates.content = result.normalizedContent
  }

  // PRD 10: Clear drift status when asset passes re-validation
  if (result.valid && !result.blocking) {
    updates.drift_status = 'none'
  }

  await supabase
    .from('creative_assets')
    .update(updates)
    .eq('id', assetId)
}
