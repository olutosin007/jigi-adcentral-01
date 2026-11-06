/**
 * Brand Guardian façade — evolves OnBrandCheck / checklist / compliance.
 * Does not replace Decide panels; soft-gates submit only.
 */
import {
  buildBrandChecklist,
  type BrandCheckItem,
  type BrandCheckItemStatus,
  type ChecklistSource,
} from '../handoff'

export type { BrandCheckItem, BrandCheckItemStatus, ChecklistSource }
export { buildBrandChecklist }

export type GuardianSeverity = 'ok' | 'warn' | 'fail'

export interface VoiceKeywordInput {
  text: string
  preferredWords?: string[] | null
  avoidedWords?: string[] | null
}

/** Keyword voice audit — no LLM (BRAND_AUDIT_LLM default false). */
export function runVoiceKeywordAudit(input: VoiceKeywordInput): BrandCheckItem[] {
  const text = input.text.toLowerCase()
  const items: BrandCheckItem[] = []
  const avoided = (input.avoidedWords ?? []).map((w) => w.trim()).filter(Boolean)
  const preferred = (input.preferredWords ?? []).map((w) => w.trim()).filter(Boolean)

  for (const word of avoided) {
    const hit = text.includes(word.toLowerCase())
    items.push({
      label: hit ? `Avoided word “${word}”` : `Clear of “${word}”`,
      status: hit ? 'fail' : 'pass',
      detail: hit ? 'Appears in the copy' : undefined,
    })
  }

  if (preferred.length > 0) {
    const hits = preferred.filter((w) => text.includes(w.toLowerCase()))
    const ratio = hits.length / preferred.length
    items.push({
      label:
        hits.length === 0
          ? 'Preferred brand words missing'
          : `Preferred words · ${hits.length}/${preferred.length}`,
      status: ratio >= 0.34 ? 'pass' : hits.length > 0 ? 'warn' : 'warn',
      detail: hits.length ? hits.slice(0, 4).join(', ') : 'None of the preferred words appear',
    })
  }

  return items
}

/** Worst status across checklist items. */
export function guardianSeverityFromItems(items: BrandCheckItem[]): GuardianSeverity {
  if (items.some((i) => i.status === 'fail')) return 'fail'
  if (items.some((i) => i.status === 'warn')) return 'warn'
  return 'ok'
}

/** Soft-gate decision for submit UI — never blocks the API. */
export function softGateForSubmit(severity: GuardianSeverity): {
  needsConfirm: boolean
  toast?: 'warn'
  message?: string
} {
  if (severity === 'fail') {
    return {
      needsConfirm: true,
      message: 'Brand Guardian found issues. Send anyway? The client will still see the checks.',
    }
  }
  if (severity === 'warn') {
    return {
      needsConfirm: false,
      toast: 'warn',
      message: 'Brand Guardian has warnings — you can still send.',
    }
  }
  return { needsConfirm: false }
}

/** Pull copy-like strings from asset content for keyword voice audit. */
export function extractAuditText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const c = content as Record<string, unknown>
  const keys = [
    'headline',
    'body',
    'copy',
    'text',
    'caption',
    'theme',
    'key_message',
    'prompt_used',
    'copy_headline_anchor',
    'copy_key_message',
    'copy_body_snippet',
  ]
  const parts: string[] = []
  for (const key of keys) {
    const v = c[key]
    if (typeof v === 'string' && v.trim()) parts.push(v)
  }
  return parts.join('\n')
}

export interface BrandGuardianPayload {
  at: string
  items: BrandCheckItem[]
  severity: GuardianSeverity
}

/** Build persistable Brand Guardian summary (voice keywords; colour already in content/scores). */
export function buildBrandGuardianPayload(input: {
  content: unknown
  preferredWords?: string[] | null
  avoidedWords?: string[] | null
  at?: string
}): BrandGuardianPayload {
  const items = runVoiceKeywordAudit({
    text: extractAuditText(input.content),
    preferredWords: input.preferredWords,
    avoidedWords: input.avoidedWords,
  })
  return {
    at: input.at ?? new Date().toISOString(),
    items,
    severity: guardianSeverityFromItems(items),
  }
}

/** Merge guardian into content object without dropping other fields. */
export function mergeBrandGuardianIntoContent(
  content: unknown,
  guardian: BrandGuardianPayload
): Record<string, unknown> {
  const base =
    content && typeof content === 'object' && !Array.isArray(content)
      ? { ...(content as Record<string, unknown>) }
      : {}
  return { ...base, brand_guardian: guardian }
}

/** Build checklist including optional Brand Guardian voice/colour summary on content. */
export function runBrandAudit(source: ChecklistSource): BrandCheckItem[] {
  return buildBrandChecklist(source)
}

export function buildBrandGuardianSummary(items: BrandCheckItem[]): {
  severity: GuardianSeverity
  failCount: number
  warnCount: number
} {
  return {
    severity: guardianSeverityFromItems(items),
    failCount: items.filter((i) => i.status === 'fail').length,
    warnCount: items.filter((i) => i.status === 'warn').length,
  }
}
