/**
 * Drift Detection — PRD 10
 * CCO diff and impact classification.
 */

export type CCOImpact = 'high' | 'low' | 'none'

export interface CCODiffResult {
  impact: CCOImpact
  changedFields: string[]
  affectedTracks: ('concept' | 'copy' | 'image')[]
}

export const HIGH_IMPACT_FIELDS = [
  'strategic_context.key_message',
  'audience_context.audience_raw',
  'channel_constraints',
  'tone_profile.effective_tone',
] as const

export const LOW_IMPACT_FIELDS = [
  'hard_constraints.parsed_requirements',
  'hard_constraints.parsed_exclusions',
  'reference_assets',
] as const
