/**
 * BIO Builder — Maps Brand DB row to BioContext for prompt assembly
 * PRD: 05-prd-ctxt-prompt-assembly
 */

import type { BioContext } from './types'

/** Extracts primary/secondary/accent from colours in either array or object format */
function extractColours(colours: unknown): { primary?: string; secondary?: string; accent?: string } {
  if (!colours) return {}
  if (Array.isArray(colours)) {
    const primary = (colours as { role?: string; hex?: string }[]).find(c => c.role === 'primary')?.hex
    const secondary = (colours as { role?: string; hex?: string }[]).find(c => c.role === 'secondary')?.hex
    const accent = (colours as { role?: string; hex?: string }[]).find(c => c.role === 'accent')?.hex
    return { primary, secondary, accent }
  }
  if (typeof colours === 'object' && colours !== null) {
    const obj = colours as Record<string, string | undefined>
    return {
      primary: obj.primary ?? obj.Primary,
      secondary: obj.secondary ?? obj.Secondary,
      accent: obj.accent ?? obj.Accent,
    }
  }
  return {}
}

interface BrandDbRow {
  id?: string
  name?: string
  identity?: {
    colours?: Array<{ hex?: string; role?: string }> | { primary?: string; secondary?: string; accent?: string }
    fonts?: { heading?: string; body?: string }
    logo_url?: string
  }
  voice?: {
    tone?: string[]
    preferred_words?: string[]
    avoided_words?: string[]
    samples?: string[]
  }
  strategy?: {
    positioning?: string
    differentiators?: string[]
  }
}

/**
 * Build BioContext from a brand database row.
 * Maps voice, strategy, identity into the BIO format expected by templates.
 */
export function buildBioFromBrand(brand: BrandDbRow | null): BioContext | null {
  if (!brand) return null

  const voice = brand.voice
  const strategy = brand.strategy
  const identity = brand.identity

  const { primary: primaryColour, secondary: secondaryColour } = extractColours(identity?.colours)

  const voiceDescriptors = voice?.tone?.join(', ') ?? ''
  const valuePropositions = strategy?.differentiators?.join('; ') ?? strategy?.positioning ?? ''
  const messagingArchitecture = strategy?.positioning ?? ''
  const approvedVocabulary = voice?.preferred_words?.join(', ') ?? ''
  const bannedPhrases = voice?.avoided_words?.join(', ') ?? ''

  const fonts = identity?.fonts
  const typography = fonts
    ? `Heading: ${fonts.heading ?? 'N/A'}, Body: ${fonts.body ?? 'N/A'}`
    : undefined

  return {
    voice_descriptors: voiceDescriptors || undefined,
    value_propositions: valuePropositions || undefined,
    messaging_architecture: messagingArchitecture || undefined,
    approved_vocabulary: approvedVocabulary || undefined,
    banned_phrases: bannedPhrases || undefined,
    visual_identity: {
      colours: {
        primary: primaryColour,
        secondary: secondaryColour,
      },
      typography,
      photography_style: undefined,
      illustration_style: undefined,
      logo_rules: identity?.logo_url ? 'Include brand logo placement where appropriate' : undefined,
    },
  }
}
