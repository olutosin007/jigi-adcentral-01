/**
 * Copy Validation Rules — PRD 07; Sprint 5 — CCO/rule pass (compose with AI warnings via mergeCopyValidationWarnings).
 */

import { countCopyDisplayChars, type CopyDisplayFormat, type ExclusionCheck, type InclusionCheck } from './schema'

export interface CopyValidationResult {
  valid: boolean
  warnings: string[]
  truncation_suggestion?: string
  exclusions_violated: boolean
}

/** Merge model + rule warnings without duplicates (AI first, then rules). */
export function mergeCopyValidationWarnings(ai: string[], rules: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const w of [...ai, ...rules]) {
    const t = w.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(w)
  }
  return out
}

/**
 * Validate copy against CCO rules (and model flags on the normalized row).
 */
export function validateCopy(
  copy: CopyDisplayFormat,
  context: {
    maxChars?: number
    parsedRequirements?: string[]
    parsedExclusions?: string[]
    legalDisclaimers?: string[]
  }
): CopyValidationResult {
  const warnings: string[] = []
  let truncation_suggestion: string | undefined
  let exclusions_violated = copy.exclusions_violated === true

  const charCount = copy.character_count ?? countCopyDisplayChars(copy)
  if (context.maxChars != null && charCount > context.maxChars) {
    const over = charCount - context.maxChars
    warnings.push(`Character count (${charCount}) exceeds channel limit (${context.maxChars}) by ${over} characters`)
    truncation_suggestion = `Consider trimming by ~${over} characters to meet the ${context.maxChars} limit.`
  }

  if (copy.exclusions_check?.length) {
    const violated = copy.exclusions_check.filter((c: ExclusionCheck) => c.violated)
    if (violated.length > 0) {
      exclusions_violated = true
      warnings.push(
        `Exclusions violated: ${violated.map((v) => v.exclusion).join(', ')}. Approval blocked.`
      )
    }
  } else if (context.parsedExclusions?.length) {
    const body = (copy.headline + ' ' + copy.body + ' ' + copy.cta).toLowerCase()
    for (const exc of context.parsedExclusions) {
      if (exc.length > 2 && body.includes(exc.toLowerCase())) {
        exclusions_violated = true
        warnings.push(`Excluded phrase found: "${exc}". Approval blocked.`)
      }
    }
  }

  if (copy.mandatory_inclusions_check?.length) {
    const missing = copy.mandatory_inclusions_check.filter((c: InclusionCheck) => !c.present)
    if (missing.length > 0) {
      warnings.push(
        `Mandatory inclusions missing: ${missing.map((m) => m.requirement).join(', ')}`
      )
    }
  } else if (context.parsedRequirements?.length) {
    const body = (copy.headline + ' ' + copy.body + ' ' + copy.cta).toLowerCase()
    for (const req of context.parsedRequirements) {
      if (req.length > 2 && !body.includes(req.toLowerCase())) {
        warnings.push(`Required inclusion may be missing: "${req}"`)
      }
    }
  }

  if (context.legalDisclaimers?.length && !copy.legal_disclaimers_appended) {
    warnings.push('Legal disclaimers may be required but were not appended.')
  }

  if (copy.tone_adherence != null && copy.tone_adherence < 40) {
    warnings.push(
      `Tone adherence estimate is low (${copy.tone_adherence}/100). Review for brand fit.`
    )
  }

  return {
    valid: !exclusions_violated,
    warnings,
    truncation_suggestion,
    exclusions_violated,
  }
}
