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
