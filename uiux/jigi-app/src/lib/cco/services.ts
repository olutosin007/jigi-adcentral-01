/**
 * Campaign Context Object (CCO) — Persist & Fetch Services
 * PRD: 01-prd-ctxt-cco-schema
 * PRD 10: Drift detection on brief save
 */

import { supabase } from '@/lib/supabase'
import {
  type CampaignContextObject,
  campaignContextObjectSchema,
  type AssetLineage,
} from './schema'
import { diffCCO, flagDriftAssets } from '@/lib/drift-detection'

// ─── Persist CCO ───────────────────────────────────────────────────────────

/**
 * Persist CCO for a campaign. Called by Brief Compiler on brief save.
 * Increments cco_version if a previous CCO exists.
 */
export async function persistCCO(
  campaignId: string,
  brandId: string | null,
  cco: Omit<CampaignContextObject, 'campaign_id' | 'brand_id' | 'compiled_at' | 'version'>
): Promise<{ success: boolean; cco?: CampaignContextObject; error?: string }> {
  try {
    // Fetch current version
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('cco_version, campaign_context')
      .eq('id', campaignId)
      .single()

    if (fetchError) throw fetchError

    const prevVersion = (campaign?.cco_version as number) ?? 0
    const nextVersion = prevVersion + 1

    const fullCCO: CampaignContextObject = {
      ...cco,
      campaign_id: campaignId,
      brand_id: brandId,
      compiled_at: new Date().toISOString(),
      version: nextVersion,
    }

    const parsed = campaignContextObjectSchema.safeParse(fullCCO)
    if (!parsed.success) {
      return {
        success: false,
        error: `CCO validation failed: ${parsed.error.message}`,
      }
    }

    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        campaign_context: parsed.data,
        cco_version: nextVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)

    if (updateError) throw updateError

    const prevCCO = campaign?.campaign_context
      ? campaignContextObjectSchema.safeParse(campaign.campaign_context).success
        ? (campaign.campaign_context as CampaignContextObject)
        : null
      : null
    const diffResult = diffCCO(parsed.data, prevCCO)
    if (diffResult.impact !== 'none') {
      await flagDriftAssets(campaignId, nextVersion, diffResult).catch((e) =>
        console.warn('Drift flagging failed:', e)
      )
    }

    return { success: true, cco: parsed.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to persist CCO'
    return { success: false, error: message }
  }
}

// ─── Fetch CCO ─────────────────────────────────────────────────────────────

/**
 * Fetch the latest CCO for a campaign by campaign_id.
 */
export async function fetchCCO(
  campaignId: string
): Promise<{ success: boolean; cco?: CampaignContextObject; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('campaign_context')
      .eq('id', campaignId)
      .single()

    if (error) throw error
    if (!data?.campaign_context) {
      return { success: false, error: 'No CCO found for this campaign' }
    }

    const parsed = campaignContextObjectSchema.safeParse(data.campaign_context)
    if (!parsed.success) {
      return {
        success: false,
        error: `CCO validation failed: ${parsed.error.message}`,
      }
    }

    return { success: true, cco: parsed.data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch CCO'
    return { success: false, error: message }
  }
}

/**
 * Fetch CCO version only (lightweight, for drift checks).
 */
export async function fetchCCOVersion(
  campaignId: string
): Promise<{ success: boolean; version?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('cco_version')
      .eq('id', campaignId)
      .single()

    if (error) throw error
    const version = data?.cco_version as number | undefined
    return { success: true, version: version ?? undefined }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch CCO version'
    return { success: false, error: message }
  }
}

// ─── Asset Lineage Helpers ──────────────────────────────────────────────────

/**
 * Build asset lineage payload for creative_assets insert/update.
 */
export function buildAssetLineage(
  ccoVersion: number,
  options?: { bioVersion?: number; validationScores?: Record<string, unknown> }
): Partial<{
  cco_version: number
  bio_version: number
  generation_timestamp: string
  validation_scores: Record<string, unknown>
}> {
  const lineage: AssetLineage = {
    cco_version: ccoVersion,
    bio_version: options?.bioVersion,
    generation_timestamp: new Date().toISOString(),
    validation_scores: options?.validationScores,
  }
  return {
    cco_version: lineage.cco_version,
    bio_version: lineage.bio_version,
    generation_timestamp: lineage.generation_timestamp,
    validation_scores: lineage.validation_scores ?? {},
  }
}
