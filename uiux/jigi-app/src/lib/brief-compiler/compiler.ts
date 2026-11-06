/**
 * Brief Compiler — Transforms Campaign Brief into Campaign Context Object (CCO)
 * PRD: 04-prd-ctxt-brief-compiler
 */

import { supabase } from '@/lib/supabase'
import type {
  CampaignContextObject,
  StrategicContext,
  AudienceContext,
  ToneProfile,
  HardConstraints,
  ReferenceAsset,
} from '@/lib/cco'
import type { CampaignBrief, BriefReferenceAsset } from '@/store/campaignStore'
import { getChannelConstraints } from '@/lib/channel-constraints'
import { persistCCO } from '@/lib/cco'
import {
  parseGoalType,
  parseEmotionalRegister,
  parseDemographicCues,
  parsePsychographicTraits,
  parseLanguageRegister,
  parseCulturalContext,
  parseRequirements,
  parseExclusions,
} from './parsers'
import { REFERENCE_ASSET_CLASSIFICATION } from '@/lib/cco'

// ─── BIO Stub ───────────────────────────────────────────────────────────────

interface BioStub {
  base_tone: string[]
  value_propositions?: string[]
  legal_disclaimers?: string[]
}

async function fetchBioStub(brandId: string): Promise<BioStub | null> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('voice, strategy')
      .eq('id', brandId)
      .single()

    if (error || !data) return null

    const voice = data.voice as { tone?: string[] } | null
    const strategy = data.strategy as { differentiators?: string[] } | null

    return {
      base_tone: voice?.tone ?? [],
      value_propositions: strategy?.differentiators,
      legal_disclaimers: [],
    }
  } catch {
    return null
  }
}

// ─── Vocabulary Guidance ───────────────────────────────────────────────────

function generateVocabularyGuidance(effectiveTone: string[]): string {
  if (effectiveTone.length === 0) {
    return 'Use clear, professional language. Avoid jargon unless the audience expects it.'
  }

  const parts: string[] = []
  const lower = effectiveTone.map((t) => t.toLowerCase())

  if (lower.some((t) => ['playful', 'fun', 'lighthearted'].includes(t))) {
    parts.push('Use energetic, conversational language. Contractions allowed.')
  }
  if (lower.some((t) => ['professional', 'polished', 'sophisticated'].includes(t))) {
    parts.push('Maintain a polished, professional tone. Avoid casual slang.')
  }
  if (lower.some((t) => ['bold', 'confident'].includes(t))) {
    parts.push('Use assertive, confident phrasing. Short, punchy sentences work well.')
  }
  if (lower.some((t) => ['warm', 'friendly', 'approachable'].includes(t))) {
    parts.push('Be warm and approachable. Use inclusive language.')
  }
  if (lower.some((t) => ['aspirational', 'luxury'].includes(t))) {
    parts.push('Evoke aspiration and premium quality. Avoid discount-focused language.')
  }

  if (parts.length === 0) {
    parts.push(`Reflect tones: ${effectiveTone.join(', ')}.`)
  }
  parts.push('Avoid corporate jargon unless the audience expects it.')

  return parts.join(' ')
}

// ─── Reference Asset Processing ─────────────────────────────────────────────

function processReferenceAsset(asset: BriefReferenceAsset): ReferenceAsset {
  const assetId = crypto.randomUUID()
  const filename = asset.filename ?? asset.file_url.split('/').pop() ?? 'reference'

  // MVP: Infer from filename; full implementation would use vision model
  const classificationMap: Record<string, (typeof REFERENCE_ASSET_CLASSIFICATION)[number]> = {
    mood: 'mood_board',
    board: 'mood_board',
    competitor: 'competitor_example',
    reference: 'style_reference',
    avoid: 'negative_reference',
    previous: 'previous_campaign',
  }
  let detectedClassification: (typeof REFERENCE_ASSET_CLASSIFICATION)[number] = 'style_reference'
  const lowerName = filename.toLowerCase()
  for (const [key, value] of Object.entries(classificationMap)) {
    if (lowerName.includes(key)) {
      detectedClassification = value
      break
    }
  }

  const description = `Reference asset: ${filename}. Use as visual/tonal inspiration for concept and image generation.`

  return {
    asset_id: assetId,
    file_url: asset.file_url,
    classification: detectedClassification,
    applicable_tracks: ['concept', 'image'],
    description,
  }
}

// ─── Main Compiler ──────────────────────────────────────────────────────────

export interface CompileBriefInput {
  campaignId: string
  brandId: string | null
  brief: CampaignBrief
}

export interface CompileBriefResult {
  success: boolean
  cco?: CampaignContextObject
  error?: string
}

export function hasCompilableBrief(brief: CampaignBrief | undefined): boolean {
  if (!brief) return false
  return Boolean(
    brief.key_message?.trim() ||
      brief.objective?.trim() ||
      brief.audience?.trim() ||
      (brief.channels?.length ?? 0) > 0
  )
}

/**
 * Compile Campaign Brief into CCO and persist.
 * Called when user saves the brief.
 */
export async function compileBriefToCCO(input: CompileBriefInput): Promise<CompileBriefResult> {
  const { campaignId, brandId, brief } = input

  try {
    const bio = brandId ? await fetchBioStub(brandId) : null

    // Strategic context
    const objectiveRaw = brief.objective ?? ''
    const keyMessage = brief.key_message ?? ''
    const strategicContext: StrategicContext = {
      objective_raw: objectiveRaw,
      goal_type: parseGoalType(objectiveRaw),
      emotional_register: parseEmotionalRegister(objectiveRaw),
      key_message: keyMessage,
      value_prop_alignment: bio?.value_propositions?.[0],
    }

    // Audience context
    const audienceRaw = brief.audience ?? ''
    const audienceContext: AudienceContext = {
      audience_raw: audienceRaw,
      demographic_cues: parseDemographicCues(audienceRaw),
      psychographic_traits: parsePsychographicTraits(audienceRaw),
      language_register: parseLanguageRegister(audienceRaw),
      cultural_context: parseCulturalContext(audienceRaw),
    }

    // Channel constraints
    const channelConstraints = getChannelConstraints(brief.channels ?? [])

    // Tone profile
    const baseTone = bio?.base_tone ?? []
    const campaignModifiers = brief.tone_override ?? []
    const effectiveTone = [...new Set([...baseTone, ...campaignModifiers])]
    const toneProfile: ToneProfile = {
      base_tone: baseTone,
      campaign_modifiers: campaignModifiers,
      effective_tone: effectiveTone,
      vocabulary_guidance: generateVocabularyGuidance(effectiveTone),
    }

    // Hard constraints
    const requirementsRaw = brief.requirements ?? ''
    const exclusionsRaw = brief.exclusions ?? ''
    const hardConstraints: HardConstraints = {
      requirements_raw: requirementsRaw,
      exclusions_raw: exclusionsRaw,
      parsed_requirements: parseRequirements(requirementsRaw),
      parsed_exclusions: parseExclusions(exclusionsRaw),
      legal_disclaimers: bio?.legal_disclaimers ?? [],
    }

    // Reference assets
    const referenceAssets: ReferenceAsset[] = (brief.reference_assets ?? []).map(
      (a) => processReferenceAsset(a)
    )

    const ccoPayload = {
      strategic_context: strategicContext,
      audience_context: audienceContext,
      channel_constraints: channelConstraints,
      tone_profile: toneProfile,
      hard_constraints: hardConstraints,
      reference_assets: referenceAssets,
    }

    return await persistCCO(campaignId, brandId, ccoPayload)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Brief compilation failed'
    return { success: false, error: message }
  }
}
