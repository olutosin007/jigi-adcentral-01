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
  /** p2 — copy suite / agency-shaped variant */
  variant_label?: string
  variant_intent?: string
  cta_alternates?: string[]
  primary_text?: string
  subject_line?: string
  preview_text?: string
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

function coerceString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function coerceStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

/** Warnings emitted by the model (or stored on asset JSON) before pipeline rules run. */
export function coerceValidationWarnings(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
}

function coerceInclusions(arr: unknown): InclusionCheck[] {
  if (!Array.isArray(arr)) return []
  return arr.map((item) => {
    if (!item || typeof item !== 'object')
      return { requirement: '', present: false }
    const o = item as Record<string, unknown>
    return {
      requirement: coerceString(o.requirement ?? o.name),
      present: Boolean(o.present),
    }
  })
}

function coerceExclusions(arr: unknown): ExclusionCheck[] {
  if (!Array.isArray(arr)) return []
  return arr.map((item) => {
    if (!item || typeof item !== 'object')
      return { exclusion: '', violated: false }
    const o = item as Record<string, unknown>
    return {
      exclusion: coerceString(o.exclusion ?? o.term),
      violated: Boolean(o.violated),
    }
  })
}

/** Character count for limits: core fields plus suite extras when present. */
export function countCopyDisplayChars(c: CopyDisplayFormat): number {
  let n = countChars(c.headline, c.body, c.cta)
  if (c.primary_text) n += c.primary_text.length
  if (c.subject_line) n += c.subject_line.length
  if (c.preview_text) n += c.preview_text.length
  if (c.cta_alternates?.length) n += c.cta_alternates.join('\n').length
  if (c.key_message_delivery) n += c.key_message_delivery.length
  return n
}

function normalizeToneAdherence(v: unknown): number | undefined {
  if (typeof v !== 'number' || Number.isNaN(v)) return undefined
  if (v >= 0 && v <= 1) return Math.round(v * 100)
  return Math.round(v)
}

function normalizeRichCopyVariation(
  raw: Record<string, unknown>,
  contentObj: Record<string, unknown> | null
): CopyDisplayFormat {
  const headline = coerceString(contentObj?.headline ?? raw.headline)
  const body = coerceString(contentObj?.body ?? raw.body)
  const cta = coerceString(contentObj?.cta ?? raw.cta)
  const cta_alternates = coerceStringArray(contentObj?.cta_alternates ?? raw.cta_alternates)
  const primary_text = coerceString(contentObj?.primary_text ?? raw.primary_text)
  const subject_line = coerceString(contentObj?.subject_line ?? raw.subject_line)
  const preview_text = coerceString(contentObj?.preview_text ?? raw.preview_text)
  const channel = coerceString(raw.channel ?? raw.channel_id)
  const deliverable_type = coerceString(raw.deliverable_type)
  const variant_label = coerceString(raw.variant_label)
  const variant_intent = coerceString(raw.variant_intent)
  const copy_id = coerceString(raw.copy_id) || undefined
  const key_message_delivery =
    coerceString(raw.key_message_delivery ?? raw.key_message) || undefined
  const tone_adherence = normalizeToneAdherence(raw.tone_adherence)
  const mandatory_inclusions_check = coerceInclusions(
    raw.mandatory_inclusions_check ?? raw.mandatory_inclusions
  )
  const exclusions_check = coerceExclusions(raw.exclusions_check ?? raw.exclusions)
  const legal =
    raw.legal_disclaimers_appended === true || raw.legal_disclaimers_appended === 'true'

  const validation_warnings_raw = coerceValidationWarnings(raw.validation_warnings)
  const exclusions_violated_flag =
    raw.exclusions_violated === true || raw.exclusions_violated === 'true' ? true : undefined

  const base: CopyDisplayFormat = {
    headline,
    body,
    cta,
    copy_id,
    channel: channel || undefined,
    deliverable_type: deliverable_type || undefined,
    tone_adherence,
    key_message_delivery,
    mandatory_inclusions_check,
    exclusions_check,
    legal_disclaimers_appended: legal,
    variant_label: variant_label || undefined,
    variant_intent: variant_intent || undefined,
    cta_alternates: cta_alternates.length ? cta_alternates : undefined,
    primary_text: primary_text || undefined,
    subject_line: subject_line || undefined,
    preview_text: preview_text || undefined,
    ...(validation_warnings_raw.length ? { validation_warnings: validation_warnings_raw } : {}),
    ...(exclusions_violated_flag !== undefined ? { exclusions_violated: exclusions_violated_flag } : {}),
  }

  const computed =
    typeof raw.character_count === 'number' && !Number.isNaN(raw.character_count)
      ? raw.character_count
      : countCopyDisplayChars(base)

  return { ...base, character_count: computed }
}

/**
 * Normalize API response to CopyDisplayFormat.
 * Handles full CopyOutputSchema, p2 rich variations (nested `content` + suite fields), and legacy flat rows.
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

  const contentObj =
    raw.content && typeof raw.content === 'object' && raw.content !== null
      ? (raw.content as Record<string, unknown>)
      : null

  const hasNestedStrings =
    !!contentObj &&
    (typeof contentObj.headline === 'string' ||
      typeof contentObj.body === 'string' ||
      typeof contentObj.cta === 'string')

  const hasSuiteSignals =
    raw.channel_id != null ||
    raw.channel != null ||
    raw.deliverable_type != null ||
    raw.variant_label != null ||
    raw.variant_intent != null ||
    raw.key_message != null ||
    raw.key_message_delivery != null ||
    Array.isArray(raw.mandatory_inclusions_check) ||
    Array.isArray(raw.exclusions_check) ||
    raw.legal_disclaimers_appended != null

  const hasTopLevelLegacy =
    typeof raw.headline === 'string' ||
    typeof raw.body === 'string' ||
    typeof raw.cta === 'string'

  if (hasNestedStrings || (hasSuiteSignals && !hasTopLevelLegacy)) {
    return normalizeRichCopyVariation(raw, contentObj)
  }

  if (hasSuiteSignals && hasTopLevelLegacy) {
    return normalizeRichCopyVariation(raw, contentObj)
  }

  // Legacy flat { headline, body, cta }
  const headline = coerceString(raw.headline)
  const body = coerceString(raw.body)
  const cta = coerceString(raw.cta)
  const validation_warnings = coerceValidationWarnings(raw.validation_warnings)
  const exclusions_violated_legacy =
    raw.exclusions_violated === true || raw.exclusions_violated === 'true' ? true : undefined
  return {
    headline,
    body,
    cta,
    character_count: countChars(headline, body, cta),
    ...(validation_warnings.length ? { validation_warnings } : {}),
    ...(exclusions_violated_legacy !== undefined ? { exclusions_violated: exclusions_violated_legacy } : {}),
  }
}
