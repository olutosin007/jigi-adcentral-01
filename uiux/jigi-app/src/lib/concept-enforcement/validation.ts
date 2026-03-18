/**
 * Concept Validation Rules — PRD 06 Sprint 3
 * key_message_link, format_suitability, strategic_insight, brand_alignment_score
 */

import type { ConceptDisplayFormat } from './schema'

export interface ConceptValidationResult {
  valid: boolean
  warnings: string[]
}

/**
 * Validate concept against CCO rules.
 * - key_message_link must not be empty and reference key_message
 * - format_suitability must include at least one selected channel
 * - strategic_insight should reference psychographic traits
 * - brand_alignment_score < 60 triggers warning
 */
export function validateConcept(
  concept: ConceptDisplayFormat,
  context: {
    keyMessage?: string
    selectedChannels?: string[]
    psychographicTraits?: string[]
  }
): ConceptValidationResult {
  const warnings: string[] = []

  if (!concept.key_message_link?.trim()) {
    warnings.push('key_message_link is empty; concept must explicitly state how it delivers the key message')
  } else if (context.keyMessage && !concept.key_message_link.toLowerCase().includes(context.keyMessage.toLowerCase().slice(0, 20))) {
    const keyWords = context.keyMessage.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 3)
    const hasRef = keyWords.some((w) => concept.key_message_link!.toLowerCase().includes(w))
    if (!hasRef) {
      warnings.push('key_message_link may not semantically reference the key message')
    }
  }

  if (concept.format_suitability?.length && context.selectedChannels?.length) {
    const overlap = concept.format_suitability.filter((c) =>
      context.selectedChannels!.some((s) => s.toLowerCase() === c.toLowerCase())
    )
    if (overlap.length === 0) {
      warnings.push(
        `format_suitability (${concept.format_suitability.join(', ')}) should include at least one selected channel (${context.selectedChannels!.join(', ')})`
      )
    }
  }

  if (concept.strategic_insight && context.psychographicTraits?.length) {
    const insightLower = concept.strategic_insight.toLowerCase()
    const hasTrait = context.psychographicTraits.some((t) =>
      insightLower.includes(t.toLowerCase())
    )
    if (!hasTrait) {
      warnings.push(
        'strategic_insight should reference at least one psychographic trait from the audience'
      )
    }
  }

  const score = concept.brand_alignment_score
  if (typeof score === 'number' && score < 60) {
    warnings.push(`brand_alignment_score is ${score} (below 60); review for brand alignment`)
  }

  const hasEmptyKeyMessageLink = warnings.some((w) => w.includes('key_message_link is empty'))
  return {
    valid: !hasEmptyKeyMessageLink,
    warnings,
  }
}
