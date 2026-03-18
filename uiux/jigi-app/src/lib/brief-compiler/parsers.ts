/**
 * Brief Compiler — Rule-based parsers for objective, audience, requirements, exclusions
 * PRD: 04-prd-ctxt-brief-compiler
 * Uses keyword matching for MVP; can be replaced with AI classification later.
 */

import type { GoalType, LanguageRegister } from '@/lib/cco'

const GOAL_KEYWORDS: Record<GoalType, string[]> = {
  awareness: ['awareness', 'aware', 'visibility', 'discover', 'introduce', 'launch', 'announce'],
  engagement: ['engage', 'engagement', 'interact', 'community', 'followers', 'likes', 'shares'],
  conversion: ['convert', 'conversion', 'sales', 'purchase', 'buy', 'sign up', 'subscribe', 'lead'],
  retention: ['retain', 'retention', 'loyalty', 'repeat', 'returning', 'churn'],
  launch: ['launch', 'launching', 'introduce', 'announce', 'release', 'new product'],
  event: ['event', 'webinar', 'conference', 'promotion', 'campaign', 'seasonal'],
}

const EMOTIONAL_KEYWORDS: Record<string, string[]> = {
  excitement: ['excitement', 'excited', 'thrilling', 'energetic', 'dynamic'],
  discovery: ['discovery', 'discover', 'explore', 'new', 'fresh', 'innovative'],
  aspiration: ['aspiration', 'aspirational', 'dream', 'inspire', 'ambition'],
  trust: ['trust', 'trusted', 'reliable', 'credible', 'confidence'],
  warmth: ['warm', 'warmth', 'friendly', 'approachable', 'welcoming'],
  urgency: ['urgent', 'urgency', 'limited', 'now', 'hurry', 'deadline'],
  playfulness: ['playful', 'fun', 'lighthearted', 'humour', 'humor'],
  professionalism: ['professional', 'polished', 'sophisticated', 'premium'],
}

const LANGUAGE_KEYWORDS: Record<LanguageRegister, string[]> = {
  formal: ['professional', 'corporate', 'executive', 'formal', 'business', 'enterprise'],
  conversational: ['conversational', 'friendly', 'casual', 'approachable', 'relatable'],
  'slang-friendly': ['young', 'gen z', 'millennial', 'trendy', 'street', 'urban'],
  technical: ['technical', 'B2B', 'developer', 'engineer', 'specialist', 'expert'],
}

/**
 * Classify objective text into goal_type.
 */
export function parseGoalType(objective: string): GoalType | undefined {
  if (!objective?.trim()) return undefined
  const lower = objective.toLowerCase()

  for (const [goal, keywords] of Object.entries(GOAL_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      return goal as GoalType
    }
  }
  return 'awareness' // default
}

/**
 * Extract emotional_register from objective text.
 */
export function parseEmotionalRegister(objective: string): string[] {
  if (!objective?.trim()) return []
  const lower = objective.toLowerCase()
  const found: string[] = []

  for (const [emotion, keywords] of Object.entries(EMOTIONAL_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k)) && !found.includes(emotion)) {
      found.push(emotion)
    }
  }
  return found.slice(0, 3) // max 3
}

/**
 * Parse audience text into demographic cues (simple extraction).
 */
export function parseDemographicCues(audience: string): {
  age_range?: string
  location?: string
  profession?: string
} {
  if (!audience?.trim()) return {}
  const cues: { age_range?: string; location?: string; profession?: string } = {}

  // Age patterns: "25-34", "young professionals", "millennials", "18-24"
  const ageMatch = audience.match(/\b(\d{2}-\d{2})\b|(young|millennial|gen\s*z|gen\s*y|older|senior|teen)/i)
  if (ageMatch) {
    cues.age_range = ageMatch[0]
  }

  // Location: "in Nigeria", "Lagos", "urban", "rural"
  const locMatch = audience.match(/(?:in|from|based in)\s+([A-Za-z\s]+?)(?:\s|,|\.|$)|(urban|rural|global|local)/i)
  if (locMatch) {
    cues.location = locMatch[1]?.trim() || locMatch[0]
  }

  // Profession: "professionals", "entrepreneurs", "marketers"
  const profMatch = audience.match(/(professionals?|entrepreneurs?|marketers?|creators?|businesses?|consumers?|buyers?)/i)
  if (profMatch) {
    cues.profession = profMatch[1]
  }

  return cues
}

/**
 * Extract psychographic traits from audience text.
 */
export function parsePsychographicTraits(audience: string): string[] {
  if (!audience?.trim()) return []
  const traits: string[] = []
  const lower = audience.toLowerCase()

  const traitKeywords: Record<string, string[]> = {
    aspirational: ['aspirational', 'ambitious', 'goal-oriented', 'success-driven'],
    creative: ['creative', 'innovative', 'artistic', 'design-conscious'],
    'price-sensitive': ['price-sensitive', 'value-conscious', 'budget', 'affordable'],
    'quality-focused': ['quality', 'premium', 'luxury', 'discerning'],
    'tech-savvy': ['tech-savvy', 'digital', 'online', 'connected'],
    'time-poor': ['busy', 'time-poor', 'on-the-go', 'convenience'],
  }

  for (const [trait, keywords] of Object.entries(traitKeywords)) {
    if (keywords.some((k) => lower.includes(k)) && !traits.includes(trait)) {
      traits.push(trait)
    }
  }
  return traits.slice(0, 4)
}

/**
 * Infer language_register from audience text.
 */
export function parseLanguageRegister(audience: string): LanguageRegister | undefined {
  if (!audience?.trim()) return undefined
  const lower = audience.toLowerCase()

  for (const [register, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      return register as LanguageRegister
    }
  }
  return 'conversational' // default
}

/**
 * Extract cultural context hints.
 */
export function parseCulturalContext(audience: string): string[] {
  if (!audience?.trim()) return []
  const hints: string[] = []
  const lower = audience.toLowerCase()

  if (lower.match(/(local|localised|localized|regional|market-specific)/)) {
    hints.push('Local market considerations')
  }
  if (lower.match(/(multicultural|diverse|inclusive)/)) {
    hints.push('Multicultural audience')
  }
  if (lower.match(/(sensitive|careful|avoid)/)) {
    hints.push('Cultural sensitivities to consider')
  }
  return hints
}

/**
 * Parse requirements text into structured list (split by newlines, bullets, semicolons).
 */
export function parseRequirements(raw: string): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[\n;•\-–—]|(?:\d+\.)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
}

/**
 * Parse exclusions text into structured list.
 */
export function parseExclusions(raw: string): string[] {
  return parseRequirements(raw)
}
