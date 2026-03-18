/**
 * Drift Flagging — PRD 10 Sprint 3
 * Flag assets when CCO version changed.
 */

import { supabase } from '@/lib/supabase'
import type { CCODiffResult } from './types'

/**
 * Flag assets for campaign when CCO was updated.
 * High-impact: all assets with cco_version < newVersion → review_required
 * Low-impact: only assets in affected tracks
 */
export async function flagDriftAssets(
  campaignId: string,
  newVersion: number,
  diffResult: CCODiffResult
): Promise<{ updated: number }> {
  if (diffResult.impact === 'none') return { updated: 0 }

  const { data: assets, error } = await supabase
    .from('creative_assets')
    .select('id, type, cco_version')
    .eq('campaign_id', campaignId)
    .lt('cco_version', newVersion)

  if (error) throw error
  if (!assets?.length) return { updated: 0 }

  let toFlag: string[] = assets.map((a) => a.id)
  if (diffResult.impact === 'low' && diffResult.affectedTracks.length > 0) {
    toFlag = assets
      .filter((a) => diffResult.affectedTracks.includes(a.type as 'concept' | 'copy' | 'image'))
      .map((a) => a.id)
  }

  if (toFlag.length === 0) return { updated: 0 }

  const { error: updateError } = await supabase
    .from('creative_assets')
    .update({ drift_status: 'review_required' })
    .in('id', toFlag)

  if (updateError) throw updateError
  return { updated: toFlag.length }
}
