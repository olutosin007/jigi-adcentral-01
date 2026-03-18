/**
 * Token Budget & Truncation
 * PRD: 05-prd-ctxt-prompt-assembly
 * Never truncate key_message, parsed_requirements, parsed_exclusions.
 * Truncate reference_asset descriptions first, then format_rules.
 */

import type { CampaignContextObject, ChannelConstraint, ReferenceAsset } from '@/lib/cco'

/** ~4 chars per token; 8K tokens ≈ 32K chars */
const CHARS_PER_TOKEN = 4
const MAX_TOKENS = 8000
const MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export interface TruncationResult {
  cco: CampaignContextObject
  truncated: boolean
  truncatedSections: string[]
}

/**
 * Truncate CCO fields to stay within token budget.
 * Order: reference_assets descriptions first, then format_rules per channel.
 * Never truncate: key_message, parsed_requirements, parsed_exclusions.
 */
export function truncateCCOForBudget(
  cco: CampaignContextObject,
  reservedChars: number = 0
): TruncationResult {
  const budget = MAX_CHARS - reservedChars
  const truncatedSections: string[] = []

  // Estimate length of non-truncatable content (rough)
  const keyMessageLen = (cco.strategic_context?.key_message ?? '').length
  const reqLen = (cco.hard_constraints?.parsed_requirements ?? []).join(' ').length
  const exclLen = (cco.hard_constraints?.parsed_exclusions ?? []).join(' ').length
  const reserved = keyMessageLen + reqLen + exclLen
  const truncatableBudget = budget - reserved

  if (truncatableBudget <= 0) {
    return { cco, truncated: false, truncatedSections }
  }

  const ccoCopy = JSON.parse(JSON.stringify(cco)) as CampaignContextObject

  // 1. Truncate reference_asset descriptions
  if (ccoCopy.reference_assets?.length) {
    for (const asset of ccoCopy.reference_assets as ReferenceAsset[]) {
      const desc = asset.description ?? ''
      const maxDescLen = 200
      if (desc.length > maxDescLen) {
        asset.description = desc.slice(0, maxDescLen) + '…'
        truncatedSections.push('reference_assets.description')
      }
    }
  }

  // 2. Truncate format_rules per channel
  if (ccoCopy.channel_constraints?.length) {
    for (const ch of ccoCopy.channel_constraints as ChannelConstraint[]) {
      const rules = ch.format_rules ?? []
      if (rules.length > 5) {
        ch.format_rules = rules.slice(0, 5)
        truncatedSections.push(`channel_constraints[${ch.channel_id}].format_rules`)
      }
      for (let i = 0; i < (ch.format_rules?.length ?? 0); i++) {
        const r = ch.format_rules![i]
        if (r.length > 150) {
          ch.format_rules![i] = r.slice(0, 150) + '…'
          truncatedSections.push(`channel_constraints[${ch.channel_id}].format_rules[${i}]`)
        }
      }
    }
  }

  return {
    cco: ccoCopy,
    truncated: truncatedSections.length > 0,
    truncatedSections,
  }
}
