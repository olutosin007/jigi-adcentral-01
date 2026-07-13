/**
 * Composite image description builder — P5 Sprint 1
 * Prefills Images-stage prompts from concept + copy + brief campaign state.
 */

import type { CampaignBrief, ConceptResult, CopyResult } from '@/lib/ai'

export interface CompositeImageInput {
  brief?: CampaignBrief | null
  seedIdea?: string | null
  concept?: Pick<ConceptResult, 'theme' | 'visual_direction'> | null
  copy?: Pick<CopyResult, 'headline' | 'key_message_delivery' | 'body' | 'variant_label'> | null
  /** When set, takes priority for subject/action (user typed override). */
  userOverride?: string | null
}

export interface CompositeSourcesLabel {
  /** e.g. "Built from: Sunrise Energy + Variant A" or "Built from: brief only" */
  label: string
  hasConcept: boolean
  hasCopy: boolean
}

/**
 * Build a narrative image description from campaign selections.
 * User override wins for subject; otherwise stacks visual direction, copy mood, brief, seed.
 */
export function buildCompositeImageDescription(input: CompositeImageInput): string {
  const override = input.userOverride?.trim()
  if (override) return override

  const parts: string[] = []

  const visual = input.concept?.visual_direction?.trim()
  if (visual) {
    parts.push(visual)
  }

  const headline = input.copy?.headline?.trim()
  const keyMsg = input.copy?.key_message_delivery?.trim()
  const bodySnippet = input.copy?.body?.trim()
  if (headline || keyMsg || bodySnippet) {
    const moodBits: string[] = []
    if (headline) moodBits.push(`headline mood: "${headline}"`)
    if (keyMsg) moodBits.push(`key message: ${keyMsg}`)
    if (bodySnippet) moodBits.push(`supporting mood: ${bodySnippet.slice(0, 160)}`)
    parts.push(`Messaging mood for the scene (${moodBits.join('; ')})`)
  }

  const briefKey = input.brief?.key_message?.trim()
  const objective = input.brief?.objective?.trim()
  if (briefKey) parts.push(`Campaign key message: ${briefKey}`)
  if (objective && objective !== briefKey) parts.push(`Campaign objective: ${objective}`)

  const seed = input.seedIdea?.trim()
  if (seed && !visual && !objective) {
    parts.push(`Seed idea: ${seed}`)
  } else if (seed && !parts.some((p) => p.includes(seed))) {
    // Keep seed as light context when idea-first and little else is set
    if (!visual && !headline) parts.push(`Seed idea: ${seed}`)
  }

  if (parts.length === 0) {
    return 'Professional advertising key art, on-brief and campaign-ready'
  }

  return parts.join('\n\n')
}

/** Human-readable badge for what fed the composite. */
export function describeCompositeSources(input: CompositeImageInput): CompositeSourcesLabel {
  const theme = input.concept?.theme?.trim()
  const hasConcept = !!theme || !!input.concept?.visual_direction?.trim()
  const copyLabel =
    input.copy?.variant_label?.trim() ||
    (input.copy?.headline?.trim() ? input.copy.headline.trim().slice(0, 40) : '')
  const hasCopy = !!copyLabel || !!input.copy?.key_message_delivery?.trim()

  if (hasConcept && hasCopy) {
    return {
      label: `Built from: ${theme || 'Concept'} + ${copyLabel || 'Copy'}`,
      hasConcept: true,
      hasCopy: true,
    }
  }
  if (hasConcept) {
    return {
      label: `Built from: ${theme || 'Concept'}`,
      hasConcept: true,
      hasCopy: false,
    }
  }
  if (hasCopy) {
    return {
      label: `Built from: ${copyLabel || 'Copy'}`,
      hasConcept: false,
      hasCopy: true,
    }
  }
  return {
    label: 'Built from: brief only',
    hasConcept: false,
    hasCopy: false,
  }
}
