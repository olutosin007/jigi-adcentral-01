/**
 * Imported Concept Validation — PRD 06 Sprint 5
 * Run same validation pass on user-imported concepts (not AI-generated).
 * Produce brand_alignment_score and brand_alignment_rationale when missing.
 */

import { fetchCCO } from '@/lib/cco'
import { normalizeConceptToDisplay, type ConceptDisplayFormat } from './schema'
import { validateConcept } from './validation'

export interface ValidateImportedConceptResult {
  normalized: ConceptDisplayFormat
  validation: { valid: boolean; warnings: string[] }
}

/**
 * Derive brand_alignment_score (0–100) from validation warnings for imported concepts.
 * PRD 06: "Produce brand_alignment_score and brand_alignment_rationale" for imported concepts.
 */
function deriveImportedConceptScore(warnings: string[]): { score: number; rationale: string } {
  let score = 100
  if (warnings.some((w) => w.includes('key_message_link is empty'))) score -= 40
  else if (warnings.some((w) => w.includes('key_message_link may not'))) score -= 20
  if (warnings.some((w) => w.includes('format_suitability'))) score -= 20
  if (warnings.some((w) => w.includes('strategic_insight'))) score -= 10
  if (warnings.some((w) => w.includes('brand_alignment_score'))) score = Math.min(score, 59)
  score = Math.max(0, Math.min(100, score))
  const rationale =
    warnings.length > 0
      ? `Imported concept; score derived from validation. Issues: ${warnings.join(' ')}`
      : 'Imported concept; passes all validation checks.'
  return { score, rationale }
}

/**
 * Validate an imported concept against campaign CCO.
 * Call when displaying or saving an uploaded/imported concept.
 * Produces brand_alignment_score and brand_alignment_rationale when concept lacks them.
 */
export async function validateImportedConcept(
  conceptContent: Record<string, unknown>,
  campaignId: string
): Promise<ValidateImportedConceptResult> {
  const normalized = normalizeConceptToDisplay(conceptContent)

  const { success, cco } = await fetchCCO(campaignId)
  const validationContext =
    success && cco
      ? {
          keyMessage: cco.strategic_context?.key_message,
          selectedChannels: cco.channel_constraints?.map((c) => c.channel_id),
          psychographicTraits: cco.audience_context?.psychographic_traits,
        }
      : undefined

  const validation = validationContext ? validateConcept(normalized, validationContext) : { valid: true, warnings: [] }

  const needsDerivedScore =
    typeof normalized.brand_alignment_score !== 'number' && (validationContext != null || validation.warnings.length > 0)

  const out: ConceptDisplayFormat = {
    ...normalized,
    validation_warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
  }
  if (needsDerivedScore) {
    const { score, rationale } = deriveImportedConceptScore(validation.warnings)
    out.brand_alignment_score = score
    out.brand_alignment_rationale = rationale
  }

  return {
    normalized: out,
    validation,
  }
}
