/**
 * CCO Diff — PRD 10 Sprint 2
 * Compare new CCO vs previous; classify impact.
 */

import type { CampaignContextObject } from '@/lib/cco'
import type { CCODiffResult, CCOImpact } from './types'

function getNested(obj: unknown, path: string): unknown {
  if (obj == null) return undefined
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Diff new CCO against previous. Classify impact.
 */
export function diffCCO(
  newCCO: CampaignContextObject,
  previousCCO: CampaignContextObject | null
): CCODiffResult {
  const changedFields: string[] = []

  if (!previousCCO) {
    return { impact: 'none', changedFields: [], affectedTracks: [] }
  }

  const pathsToCheck = [
    'strategic_context.key_message',
    'audience_context.audience_raw',
    'strategic_context.objective_raw',
    'audience_context.psychographic_traits',
    'tone_profile.effective_tone',
    'hard_constraints.parsed_requirements',
    'hard_constraints.parsed_exclusions',
    'reference_assets',
  ]

  const channelPaths = ['channel_constraints']
  for (const path of channelPaths) {
    const prev = getNested(previousCCO, path)
    const next = getNested(newCCO, path)
    if (!jsonEqual(prev, next)) changedFields.push(path)
  }

  for (const path of pathsToCheck) {
    const prev = getNested(previousCCO, path)
    const next = getNested(newCCO, path)
    if (!jsonEqual(prev, next)) changedFields.push(path)
  }

  let impact: CCOImpact = 'none'
  const affectedTracks: ('concept' | 'copy' | 'image')[] = []

  const hasHighImpact =
    changedFields.some((f) => f.includes('key_message')) ||
    changedFields.some((f) => f.includes('audience_raw')) ||
    changedFields.some((f) => f.includes('channel_constraints')) ||
    changedFields.some((f) => f.includes('effective_tone'))

  if (hasHighImpact) {
    impact = 'high'
    affectedTracks.push('concept', 'copy', 'image')
  } else if (changedFields.length > 0) {
    impact = 'low'
    if (
      changedFields.some((f) => f.includes('parsed_exclusions')) ||
      changedFields.some((f) => f.includes('parsed_requirements'))
    ) {
      affectedTracks.push('copy', 'image')
    }
    if (changedFields.some((f) => f.includes('reference_assets'))) {
      if (!affectedTracks.includes('concept')) affectedTracks.push('concept')
      if (!affectedTracks.includes('image')) affectedTracks.push('image')
    }
    if (changedFields.some((f) => f.includes('psychographic_traits'))) {
      if (!affectedTracks.includes('concept')) affectedTracks.push('concept')
    }
  }

  return { impact, changedFields, affectedTracks }
}
