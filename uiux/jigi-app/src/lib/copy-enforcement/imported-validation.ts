/**
 * Imported Copy Validation — PRD 07 Sprint 5
 * Brand-voice similarity score; below 50 triggers brand-tune suggestion.
 */

import { fetchCCO } from '@/lib/cco'
import { buildBioFromBrand } from '@/lib/prompt-assembly/bio-builder'
import { supabase } from '@/lib/supabase'
import { normalizeCopyToDisplay, type CopyDisplayFormat } from './schema'
import { validateCopy } from './validation'

export interface ValidateImportedCopyResult {
  normalized: CopyDisplayFormat
  validation: { valid: boolean; warnings: string[]; exclusions_violated: boolean }
}

/**
 * Compute brand-voice similarity score (0–100) for imported copy.
 * Compares against BIO voice_descriptors, approved_vocabulary, banned_phrases.
 */
function computeBrandVoiceScore(
  copyText: string,
  voiceDescriptors?: string,
  approvedVocabulary?: string,
  bannedPhrases?: string
): { score: number; suggestion?: string } {
  let score = 100
  const text = copyText.toLowerCase()
  const suggestions: string[] = []

  if (bannedPhrases) {
    const banned = bannedPhrases.split(/[,;]/).map((p) => p.trim().toLowerCase()).filter(Boolean)
    for (const phrase of banned) {
      if (phrase.length > 2 && text.includes(phrase)) {
        score -= 25
        suggestions.push(`Remove banned phrase: "${phrase}"`)
      }
    }
  }

  if (approvedVocabulary && approvedVocabulary.trim()) {
    const approved = approvedVocabulary.split(/[,;]/).map((p) => p.trim().toLowerCase()).filter((p) => p.length > 3)
    const hasApproved = approved.some((w) => text.includes(w))
    if (approved.length > 0 && !hasApproved) {
      score -= 15
      suggestions.push('Consider using approved vocabulary from brand guidelines')
    }
  }

  if (voiceDescriptors && voiceDescriptors.trim()) {
    const toneWords = voiceDescriptors.toLowerCase().split(/[,;]/).map((p) => p.trim()).filter((p) => p.length > 2)
    const matchCount = toneWords.filter((w) => text.includes(w)).length
    if (toneWords.length > 0 && matchCount === 0) {
      score -= 10
      suggestions.push('Copy may not align with brand tone; review voice descriptors')
    }
  }

  score = Math.max(0, Math.min(100, score))
  const suggestion = suggestions.length > 0 ? suggestions.join('. ') : undefined
  return { score, suggestion }
}

/**
 * Validate an imported copy against campaign CCO.
 * Produces brand_voice_score and brand_tune_suggestion when score < 50.
 */
export async function validateImportedCopy(
  copyContent: Record<string, unknown>,
  campaignId: string
): Promise<ValidateImportedCopyResult> {
  const normalized = normalizeCopyToDisplay(copyContent)
  const copyText = `${normalized.headline} ${normalized.body} ${normalized.cta}`.trim()

  const { success, cco } = await fetchCCO(campaignId)
  const channelId = (normalized.channel as string) ?? cco?.channel_constraints?.[0]?.channel_id
  const channelConstraint = cco?.channel_constraints?.find((c) => c.channel_id === channelId)
  const maxChars = channelConstraint?.copy_limits?.max_chars

  const validationContext =
    success && cco
      ? {
          maxChars,
          parsedRequirements: cco.hard_constraints?.parsed_requirements,
          parsedExclusions: cco.hard_constraints?.parsed_exclusions,
          legalDisclaimers: cco.hard_constraints?.legal_disclaimers,
        }
      : undefined

  const validation = validationContext ? validateCopy(normalized, validationContext) : validateCopy(normalized, {})

  const out: CopyDisplayFormat = {
    ...normalized,
    validation_warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
    truncation_suggestion: validation.truncation_suggestion,
    exclusions_violated: validation.exclusions_violated,
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('brand_id')
    .eq('id', campaignId)
    .single()

  if (campaign?.brand_id) {
    const { data: brand } = await supabase
      .from('brands')
      .select('voice, strategy, identity')
      .eq('id', campaign.brand_id)
      .single()

    const bio = buildBioFromBrand(brand)
    const { score, suggestion } = computeBrandVoiceScore(
      copyText,
      bio?.voice_descriptors,
      bio?.approved_vocabulary,
      bio?.banned_phrases
    )
    out.brand_voice_score = score
    if (score < 50 && suggestion) {
      out.brand_tune_suggestion = suggestion
    }
  }

  return {
    normalized: out,
    validation: {
      valid: validation.valid,
      warnings: validation.warnings,
      exclusions_violated: validation.exclusions_violated,
    },
  }
}
