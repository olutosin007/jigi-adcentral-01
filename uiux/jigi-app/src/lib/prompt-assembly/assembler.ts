/**
 * Prompt Assembly Service — Main entry
 * PRD: 05-prd-ctxt-prompt-assembly
 */

import { supabase } from '@/lib/supabase'
import { fetchCCO } from '@/lib/cco'
import { buildBioFromBrand } from './bio-builder'
import { substitutePlaceholders } from './substitution'
import { getTemplate } from './templates'
import { truncateCCOForBudget, estimateTokenCount } from './truncation'
import type { AssemblePromptInput, AssemblePromptResult, BioContext, TrackType } from './types'

async function fetchBrand(brandId: string) {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, identity, voice, strategy')
    .eq('id', brandId)
    .single()
  if (error || !data) return null
  return data
}

async function computePromptHash(prompt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(prompt)
  const buf = await crypto.subtle.digest('SHA-256', data)
  const arr = Array.from(new Uint8Array(buf))
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Assemble the system prompt for a generation call.
 * Fetches BIO (from brand) and CCO (from campaign), substitutes placeholders, enforces token budget.
 */
export async function assemblePrompt(
  input: AssemblePromptInput
): Promise<AssemblePromptResult | null> {
  const { campaignId, brandId, track, channelId } = input

  const ccoResult = await fetchCCO(campaignId)
  if (!ccoResult.success || !ccoResult.cco) {
    return null
  }

  const brand = brandId ? await fetchBrand(brandId) : null
  const bio: BioContext | null = buildBioFromBrand(brand)
  const { cco, truncated, truncatedSections } = truncateCCOForBudget(ccoResult.cco)

  if (truncated && truncatedSections.length > 0) {
    console.warn('[PromptAssembly] CCO truncated for token budget:', {
      campaignId,
      track,
      truncatedSections,
    })
  }

  const template = getTemplate(track as TrackType)
  const prompt = substitutePlaceholders(template, bio, cco, channelId)

  const hash = await computePromptHash(prompt)
  const tokenEstimate = estimateTokenCount(prompt)

  return {
    prompt,
    hash,
    truncated: truncated || tokenEstimate > 8000,
    cco_version: cco.version,
    cco,
  }
}
