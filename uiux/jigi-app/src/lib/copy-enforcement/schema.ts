/**
 * Copy Output Schema — PRD 07
 * From Jigi_Campaign_Context_Object_Spec §4.3
 */

/** Single inclusion/exclusion check item */
export interface InclusionCheck {
  requirement: string
  present: boolean
}

export interface ExclusionCheck {
  exclusion: string
  violated: boolean
}

/** Raw copy from AI (full schema) */
export interface CopyOutputSchema {
  copy_id: string
  channel: string
  deliverable_type: string
  content: { headline: string; body: string; cta: string }
  character_count: number
  tone_adherence: number
  key_message_delivery: string
  mandatory_inclusions_check: InclusionCheck[]
  exclusions_check: ExclusionCheck[]
  legal_disclaimers_appended: boolean
}

/** Legacy/display format (backward compatible with UI) */
export interface CopyDisplayFormat {
  headline: string
  body: string
  cta: string
  /** PRD 07: New schema fields */
  copy_id?: string
  channel?: string
  deliverable_type?: string
  character_count?: number
  tone_adherence?: number
  key_message_delivery?: string
  mandatory_inclusions_check?: InclusionCheck[]
  exclusions_check?: ExclusionCheck[]
  legal_disclaimers_appended?: boolean
  /** Validation */
  validation_warnings?: string[]
  truncation_suggestion?: string
  exclusions_violated?: boolean
  brand_voice_score?: number
  brand_tune_suggestion?: string
}

const REQUIRED_OUTPUT_FIELDS: (keyof CopyOutputSchema)[] = [
  'copy_id',
  'channel',
  'deliverable_type',
  'content',
  'character_count',
  'tone_adherence',
  'key_message_delivery',
  'mandatory_inclusions_check',
  'exclusions_check',
  'legal_disclaimers_appended',
]

export function isCopyOutputSchema(obj: unknown): obj is CopyOutputSchema {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  for (const field of REQUIRED_OUTPUT_FIELDS) {
    if (o[field] === undefined) return false
  }
  const content = o.content
  if (!content || typeof content !== 'object') return false
  const c = content as Record<string, unknown>
  if (typeof c.headline !== 'string' || typeof c.body !== 'string' || typeof c.cta !== 'string') return false
  if (typeof o.character_count !== 'number') return false
  if (!Array.isArray(o.mandatory_inclusions_check) || !Array.isArray(o.exclusions_check)) return false
  return true
}

function countChars(headline: string, body: string, cta: string): number {
  return (headline + body + cta).length
}

/**
 * Normalize API response to CopyDisplayFormat.
 * Handles both new schema and legacy (headline, body, cta only).
 */
export function normalizeCopyToDisplay(raw: Record<string, unknown>): CopyDisplayFormat {
  if (isCopyOutputSchema(raw)) {
    const c = raw.content
    return {
      headline: c.headline,
      body: c.body,
      cta: c.cta,
      copy_id: raw.copy_id,
      channel: raw.channel,
      deliverable_type: raw.deliverable_type,
      character_count: raw.character_count,
      tone_adherence: raw.tone_adherence,
      key_message_delivery: raw.key_message_delivery,
      mandatory_inclusions_check: raw.mandatory_inclusions_check,
      exclusions_check: raw.exclusions_check,
      legal_disclaimers_appended: raw.legal_disclaimers_appended,
    }
  }
  // Legacy format
  const headline = (raw.headline as string) ?? ''
  const body = (raw.body as string) ?? ''
  const cta = (raw.cta as string) ?? ''
  return {
    headline,
    body,
    cta,
    character_count: countChars(headline, body, cta),
  }
}
