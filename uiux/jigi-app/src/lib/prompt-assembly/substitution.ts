/**
 * Placeholder Substitution Engine
 * PRD: 05-prd-ctxt-prompt-assembly
 * Replaces {bio.*}, {cco.*}, {cco.channel_constraints[channel].*} with live values.
 */

import type { BioContext } from './types'
import type { CampaignContextObject, ChannelConstraint, ReferenceAsset } from '@/lib/cco'

const PLACEHOLDER_REGEX = /\{([^}]+)\}/g

/** Format reference_assets for prompt injection */
function formatReferenceAssets(assets: ReferenceAsset[] | undefined): string {
  if (!assets?.length) return 'None provided.'
  return assets
    .map((a) => `- ${a.classification}: ${a.description ?? a.file_url}`)
    .join('\n  ')
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (obj == null) return undefined
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function formatValue(val: unknown): string {
  if (val === undefined || val === null) return ''
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

/**
 * Resolve a placeholder path against bio or cco.
 * Handles cco.channel_constraints[channelId].* for channel-specific substitution.
 */
function resolvePlaceholder(
  path: string,
  bio: BioContext | null,
  cco: CampaignContextObject | null,
  channelId?: string
): string {
  if (path.startsWith('bio.')) {
    const subPath = path.slice(4)
    const val = getNestedValue(bio, subPath)
    return formatValue(val)
  }

  if (path.startsWith('cco.')) {
    const subPath = path.slice(4)

    // Handle cco.channel_constraints[channel] or cco.channel_constraints[channel_id].field
    const channelMatch = subPath.match(/^channel_constraints\[([^\]]+)\]\.?(.*)$/)
    if (channelMatch && cco?.channel_constraints) {
      let [, chanKey, fieldPath] = channelMatch
      if (chanKey === 'channel_id' || chanKey === 'channel') {
        chanKey = channelId ?? chanKey
      }
      const constraint = cco.channel_constraints.find(
        (c: ChannelConstraint) => c.channel_id === chanKey
      )
      if (!constraint) return ''
      const val = fieldPath ? getNestedValue(constraint, fieldPath) : constraint
      return formatValue(val)
    }

    // Handle cco.channel_constraints[].channel_id (list all channels)
    if (subPath === 'channel_constraints[].channel_id' && cco?.channel_constraints) {
      return cco.channel_constraints.map((c) => c.channel_id).join(', ')
    }

    // Special format for reference_assets
    if (subPath === 'reference_assets' && cco?.reference_assets) {
      return formatReferenceAssets(cco.reference_assets)
    }

    const val = getNestedValue(cco, subPath)
    return formatValue(val)
  }

  if (path === 'channel_id' && channelId) {
    return channelId
  }

  return ''
}

/**
 * Substitute all placeholders in a template string.
 */
export function substitutePlaceholders(
  template: string,
  bio: BioContext | null,
  cco: CampaignContextObject | null,
  channelId?: string
): string {
  return template.replace(PLACEHOLDER_REGEX, (_, path: string) => {
    const trimmed = path.trim()
    return resolvePlaceholder(trimmed, bio, cco, channelId)
  })
}
