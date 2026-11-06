/**
 * Concept Output Schema — PRD 06
 * From Jigi_Campaign_Context_Object_Spec §4.2.1
 */

/** Raw concept from AI (full schema) */
export interface ConceptOutputSchema {
  concept_name: string
  strategic_insight: string
  creative_territory: string
  headline_direction: string
  format_suitability: string[]
  key_message_link: string
  brand_alignment_score: number
  brand_alignment_rationale: string
}

/** Legacy/display format (backward compatible with UI) */
export interface ConceptDisplayFormat {
  theme: string
  headlines: string[]
  visual_direction: string
  rationale: string
  /** New fields from PRD 06 */
  concept_name?: string
  strategic_insight?: string
  creative_territory?: string
  headline_direction?: string
  format_suitability?: string[]
  key_message_link?: string
  brand_alignment_score?: number
  brand_alignment_rationale?: string
  /** Validation warnings */
  validation_warnings?: string[]
}

const REQUIRED_FIELDS: (keyof ConceptOutputSchema)[] = [
  'concept_name',
  'strategic_insight',
  'creative_territory',
  'headline_direction',
  'format_suitability',
  'key_message_link',
  'brand_alignment_score',
  'brand_alignment_rationale',
]

export function isConceptOutputSchema(obj: unknown): obj is ConceptOutputSchema {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  for (const field of REQUIRED_FIELDS) {
    if (o[field] === undefined) return false
  }
  if (!Array.isArray(o.format_suitability)) return false
  if (typeof o.brand_alignment_score !== 'number') return false
  return true
}

/**
 * Normalize API response to ConceptDisplayFormat.
 * Handles both new schema (concept_name, etc.) and legacy (theme, headlines, etc.)
 */
export function normalizeConceptToDisplay(raw: Record<string, unknown>): ConceptDisplayFormat {
  if (isConceptOutputSchema(raw)) {
    // Prefer richer display fields when the model supplies them (hybrid schema:
    // full PRD-06 fields + display headlines/visual_direction). Falls back to the
    // canonical PRD-06 mapping when they're absent (e.g. the CCO template path).
    const richHeadlines =
      Array.isArray(raw.headlines) && raw.headlines.length > 0
        ? (raw.headlines as string[])
        : [raw.headline_direction]
    const richVisual =
      typeof raw.visual_direction === 'string' && raw.visual_direction.trim()
        ? raw.visual_direction
        : raw.creative_territory
    const richRationale =
      typeof raw.rationale === 'string' && raw.rationale.trim()
        ? (raw.rationale as string)
        : `${raw.strategic_insight}\n\nKey message link: ${raw.key_message_link}`
    return {
      theme: (typeof raw.theme === 'string' && raw.theme.trim() ? (raw.theme as string) : raw.concept_name),
      headlines: richHeadlines,
      visual_direction: richVisual,
      rationale: richRationale,
      concept_name: raw.concept_name,
      strategic_insight: raw.strategic_insight,
      creative_territory: raw.creative_territory,
      headline_direction: raw.headline_direction,
      format_suitability: raw.format_suitability,
      key_message_link: raw.key_message_link,
      brand_alignment_score: raw.brand_alignment_score,
      brand_alignment_rationale: raw.brand_alignment_rationale,
    }
  }
  // Legacy / idea-first display schema — derive key_message_link when the model omits it
  const rationale = (raw.rationale as string) ?? ''
  const explicitLink =
    typeof raw.key_message_link === 'string' && raw.key_message_link.trim()
      ? raw.key_message_link.trim()
      : undefined
  const keyMessageLink = explicitLink || (rationale.trim() ? rationale.trim() : undefined)

  return {
    theme: (raw.theme as string) ?? '',
    headlines: Array.isArray(raw.headlines) ? (raw.headlines as string[]) : [],
    visual_direction: (raw.visual_direction as string) ?? '',
    rationale,
    key_message_link: keyMessageLink,
  }
}
