/**
 * Channel Constraints Lookup Service
 * PRD: 03-prd-ctxt-channel-library
 */

import type { ChannelConstraint } from '@/lib/cco'
import { CHANNEL_CONSTRAINTS_LIBRARY } from './config'

/**
 * Fetch channel constraints for the given channel IDs.
 * Returns an array of ChannelConstraint objects for CCO.channel_constraints.
 * Unknown channel IDs fall back to "other" constraints.
 */
export function getChannelConstraints(channelIds: string[]): ChannelConstraint[] {
  const seen = new Set<string>()
  const result: ChannelConstraint[] = []

  for (const channelId of channelIds) {
    if (!channelId || seen.has(channelId)) continue
    seen.add(channelId)

    const config = CHANNEL_CONSTRAINTS_LIBRARY[channelId] ?? CHANNEL_CONSTRAINTS_LIBRARY.other
    result.push({
      channel_id: channelId,
      ...config,
    })
  }

  return result
}

/**
 * Get constraints for a single channel.
 */
export function getChannelConstraint(channelId: string): ChannelConstraint {
  const config = CHANNEL_CONSTRAINTS_LIBRARY[channelId] ?? CHANNEL_CONSTRAINTS_LIBRARY.other
  return {
    channel_id: channelId,
    ...config,
  }
}

/**
 * Check if a channel ID has defined constraints in the library.
 */
export function hasChannelConstraints(channelId: string): boolean {
  return channelId in CHANNEL_CONSTRAINTS_LIBRARY && channelId !== 'other'
}

/**
 * Practical copy budget used to constrain copy GENERATION (not just UI hints).
 *
 * Unlike `getPrimaryCopyBudgetChars` (which returns the broadest platform
 * maximum, e.g. 63k for Facebook), this returns the tightest *practical*
 * on-asset budget so generated ad copy stays punchy and within the visible
 * area. Feeds the copy prompt's LENGTH LIMITS block + copy validation.
 */
export interface CopyPromptBudget {
  /** Combined headline + body + CTA target. */
  primaryMax: number
  headlineMax?: number
  ctaMax?: number
  /** Channel id if known in the library, otherwise 'default'. */
  source: string
}

const DEFAULT_PRIMARY_MAX = 150

export function getCopyPromptBudget(channelId: string | undefined): CopyPromptBudget | undefined {
  if (!channelId?.trim()) return undefined
  const { copy_limits: cl } = getChannelConstraint(channelId)
  const limits = (cl ?? {}) as Record<string, unknown>
  const num = (k: string): number | undefined =>
    typeof limits[k] === 'number' && !Number.isNaN(limits[k] as number) ? (limits[k] as number) : undefined

  // Tightest "visible / on-asset" limit wins as the practical body budget.
  const tightCandidates = [
    num('overlay_max'),
    num('visible_chars'),
    num('primary_max'),
    num('body_max'),
    num('optimal_chars'),
  ].filter((n): n is number => typeof n === 'number')

  const headlineMax = num('headline_max') ?? num('subject_max')
  const ctaMax = num('cta_max') ?? num('description_max')

  let primaryMax: number
  if (tightCandidates.length) {
    primaryMax = Math.min(...tightCandidates)
  } else {
    // No practical key — fall back to a genuine hard max (e.g. Twitter 280),
    // or a sensible social default when the channel is unknown.
    primaryMax = num('max_chars') ?? DEFAULT_PRIMARY_MAX
  }

  return {
    primaryMax,
    headlineMax,
    ctaMax,
    source: hasChannelConstraints(channelId) ? channelId : 'default',
  }
}

/**
 * Single number for UI “channel guide” character budget (read-only hint).
 * Picks the broadest applicable limit from the channel library.
 */
export function getPrimaryCopyBudgetChars(channelId: string | undefined): number | undefined {
  if (!channelId?.trim()) return undefined
  const { copy_limits: cl } = getChannelConstraint(channelId)
  if (!cl || typeof cl !== 'object') return undefined
  const limits = cl as Record<string, unknown>
  const nums = [
    limits.max_chars,
    limits.caption_max,
    limits.body_max,
    limits.primary_max,
    limits.description_max,
    limits.optimal_chars,
  ].filter((n): n is number => typeof n === 'number' && !Number.isNaN(n))
  if (!nums.length) return undefined
  return Math.max(...nums)
}
