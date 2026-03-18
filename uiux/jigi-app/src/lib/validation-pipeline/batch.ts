/**
 * Validation Pipeline — PRD 09 Sprint 5
 * Batch validation for multiple assets (e.g. drift re-validation).
 */

import { supabase } from '@/lib/supabase'
import { validateAsset } from './pipeline'
import type { ValidationPipelineResult } from './types'

export interface BatchValidationResult {
  results: ValidationPipelineResult[]
  errors: Array<{ assetId: string; error: string }>
}

/**
 * Validate multiple assets. Runs validation in parallel (with concurrency limit).
 * Useful for drift re-validation when CCO/BIO changes.
 */
export async function validateAssets(
  assetIds: string[],
  campaignId: string
): Promise<BatchValidationResult> {
  const results: ValidationPipelineResult[] = []
  const errors: Array<{ assetId: string; error: string }> = []

  const { data: assets } = await supabase
    .from('creative_assets')
    .select('id, type, content')
    .eq('campaign_id', campaignId)
    .in('id', assetIds)

  const toValidate = assets ?? []
  const CONCURRENCY = 3
  for (let i = 0; i < toValidate.length; i += CONCURRENCY) {
    const batch = toValidate.slice(i, i + CONCURRENCY)
    const settled = await Promise.allSettled(
      batch.map((a) =>
        validateAsset({
          assetId: a.id,
          campaignId,
          asset: {
            id: a.id,
            type: a.type as 'concept' | 'copy' | 'image',
            content: (a.content as Record<string, unknown>) ?? {},
          },
        })
      )
    )
    for (let j = 0; j < settled.length; j++) {
      const s = settled[j]
      const asset = batch[j]
      if (s.status === 'fulfilled') {
        results.push(s.value)
      } else {
        errors.push({
          assetId: asset.id,
          error: s.reason?.message ?? 'Validation failed',
        })
      }
    }
  }

  return { results, errors }
}
