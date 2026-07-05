import type { BrandConstraints, BrandIncludeFlags, CampaignBrief, FallbackContext } from './types'

/** Selected concept fields injected into copy generation prompts. */
export interface ConceptContextForPrompt {
  theme: string
  headlines?: string[]
  visual_direction?: string
  key_message_link?: string
}

export function buildConceptContextPromptBlock(
  concept: ConceptContextForPrompt,
  keyMessage?: string
): string {
  const headlines = concept.headlines ?? []
  const lines = [
    'SELECTED CONCEPT CONTEXT (copy must align with this direction):',
    `- Theme: ${concept.theme}`,
  ]
  if (headlines.length) lines.push(`- Headlines: ${headlines.join(', ')}`)
  if (concept.visual_direction?.trim()) {
    lines.push(`- Visual direction: ${concept.visual_direction.trim()}`)
  }
  if (concept.key_message_link?.trim()) {
    lines.push(`- Key message link: ${concept.key_message_link.trim()}`)
  }
  if (keyMessage?.trim()) {
    lines.push(`- Campaign key message to deliver: ${keyMessage.trim()}`)
  }
  return `\n\n${lines.join('\n')}`
}

export function buildConceptPrompt(
  brand: BrandConstraints | undefined,
  brief: CampaignBrief,
  fallback?: FallbackContext
): string {
  if (brand) {
    return buildBrandGroundedConceptPrompt(brand, brief)
  }
  return buildIdeaFirstConceptPrompt(brief, fallback)
}

function buildBrandGroundedConceptPrompt(brand: BrandConstraints, brief: CampaignBrief): string {
  const colorsJson = JSON.stringify(brand.identity.colours || [])
  const toneList = brand.voice.tone?.join(', ') || 'professional'
  const preferredWords = brand.voice.preferred_words?.join(', ') || ''
  const avoidedWords = brand.voice.avoided_words?.join(', ') || ''
  const differentiators = brand.strategy?.differentiators?.join('; ') || ''
  const channels = brief.channels?.join(', ') || 'social media'
  const keyMessage =
    brief.key_message?.trim() || brief.objective?.trim() || 'the campaign objective'

  return `You are a senior creative strategist generating advertising campaign concepts.

BRAND CONSTRAINTS (follow exactly):
- Brand name: ${brand.name}
- Colours: ${colorsJson}
- Tone of voice: ${toneList}
${preferredWords ? `- Language to use: ${preferredWords}` : ''}
${avoidedWords ? `- Language to avoid: ${avoidedWords}` : ''}
${brand.strategy?.positioning ? `- Brand positioning: ${brand.strategy.positioning}` : ''}
${differentiators ? `- Brand differentiators: ${differentiators}` : ''}

BRIEF:
- Campaign objective: ${brief.objective || 'Not specified'}
- Target audience: ${brief.audience || 'Not specified'}
- Channels: ${channels}
- Key message to deliver: ${keyMessage}
${brief.requirements ? `- Specific requirements: ${brief.requirements}` : ''}

TASK:
Generate 2 distinct campaign concept directions. Each must serve the key message, link to
the brand positioning/differentiators, align with the brand tone exactly, use preferred
language, avoid listed words, be distinct, and be executable across the listed channels.

Score brand alignment honestly on a 0-100 scale; flag tensions, do not inflate the score.

Return valid JSON in this exact format (all fields required):
{
  "concepts": [
    {
      "concept_name": "Memorable concept name (2-4 words)",
      "theme": "Same as concept_name or a short big-idea phrase",
      "strategic_insight": "The human/audience truth this connects to",
      "creative_territory": "The emotional and visual world this concept lives in",
      "headline_direction": "The lead headline / tagline direction",
      "headlines": ["Headline 1", "Headline 2", "Headline 3"],
      "visual_direction": "2-3 sentence art-direction description for image generation",
      "format_suitability": ["${brief.channels?.[0] || 'social_post'}"],
      "key_message_link": "Explicit statement of how this concept delivers the key message",
      "brand_alignment_score": 0,
      "brand_alignment_rationale": "Why this score; note any tensions with brand guidelines",
      "rationale": "One-sentence summary of why this concept works"
    }
  ]
}`
}

function buildIdeaFirstConceptPrompt(brief: CampaignBrief, fallback?: FallbackContext): string {
  const channels = brief.channels?.join(', ') || 'social media'
  const seedIdea = fallback?.seed_idea || brief.objective || ''
  const styleHints = fallback?.style_hints?.join(', ') || ''
  const keyMessage = brief.key_message?.trim() || brief.objective?.trim() || seedIdea

  return `You are a senior creative strategist generating advertising campaign concepts.

STARTING POINT:
- Core idea: ${seedIdea}
${brief.audience || fallback?.audience ? `- Target audience: ${brief.audience || fallback?.audience}` : ''}
${styleHints ? `- Style hints: ${styleHints}` : ''}

BRIEF:
- Campaign objective: ${brief.objective || seedIdea}
- Target audience: ${brief.audience || fallback?.audience || 'General audience'}
- Channels: ${channels}
- Key message: ${keyMessage}
${brief.requirements ? `- Specific requirements: ${brief.requirements}` : ''}

TASK:
Generate 2 distinct campaign concept directions based on the core idea. For each concept, provide:
1. Theme/Big Idea (2-4 words)
2. 3 headline variants
3. Visual direction description (2-3 sentences)
4. key_message_link — explicit statement of how this concept delivers the key message
5. Brief rationale (1 sentence)

Each concept must:
- Build on the core idea creatively
- Be distinct from the other concepts
- Be executable across the listed channels
- Feel modern and engaging
- Serve the key message via key_message_link

Return valid JSON in this exact format:
{
  "concepts": [
    {
      "theme": "Theme Name",
      "headlines": ["Headline 1", "Headline 2", "Headline 3"],
      "visual_direction": "Description of visuals...",
      "key_message_link": "How this concept delivers the key message",
      "rationale": "Why this concept works..."
    }
  ]
}`
}

/**
 * Practical character budget for copy generation, resolved per channel.
 * `primaryMax` is the combined headline + body + CTA budget the model must
 * stay within; the per-field caps are optional refinements.
 */
export interface CopyLengthBudget {
  primaryMax?: number
  headlineMax?: number
  ctaMax?: number
}

function buildLengthLimitsBlock(budget?: CopyLengthBudget): string {
  if (!budget) return ''
  const lines: string[] = []
  if (budget.headlineMax) lines.push(`- Headline: max ${budget.headlineMax} characters`)
  if (budget.primaryMax)
    lines.push(`- Headline + body + CTA combined: max ${budget.primaryMax} characters`)
  if (budget.ctaMax) lines.push(`- Call to action: max ${budget.ctaMax} characters`)
  if (!lines.length) return ''
  return `

LENGTH LIMITS (must obey — count characters, do not exceed):
${lines.join('\n')}`
}

export function buildCopyPrompt(
  brand: BrandConstraints | undefined,
  brief: CampaignBrief,
  format: string = 'social_post',
  fallback?: FallbackContext,
  budget?: CopyLengthBudget,
  conceptContext?: ConceptContextForPrompt
): string {
  const keyMessage = brief.key_message?.trim() || brief.objective?.trim()
  const conceptBlock = conceptContext
    ? buildConceptContextPromptBlock(conceptContext, keyMessage)
    : ''

  if (brand) {
    return buildBrandGroundedCopyPrompt(brand, brief, format, budget) + conceptBlock
  }
  return buildIdeaFirstCopyPrompt(brief, format, fallback, budget) + conceptBlock
}

function buildBrandGroundedCopyPrompt(
  brand: BrandConstraints,
  brief: CampaignBrief,
  format: string,
  budget?: CopyLengthBudget
): string {
  const toneList = brand.voice.tone?.join(', ') || 'professional'
  const preferredWords = brand.voice.preferred_words?.join(', ') || ''
  const avoidedWords = brand.voice.avoided_words?.join(', ') || ''
  const sampleVoice = brand.voice.samples?.[0] || ''
  const keyMessage = brief.key_message?.trim() || brief.objective?.trim() || 'Not specified'

  return `You are an expert copywriter creating advertising copy for a brand.

BRAND VOICE:
- Tone: ${toneList}
${preferredWords ? `- Use these words/phrases: ${preferredWords}` : ''}
${avoidedWords ? `- Never use: ${avoidedWords}` : ''}
${sampleVoice ? `- Style reference: ${sampleVoice}` : ''}

BRIEF:
- Objective: ${brief.objective || 'Not specified'}
- Audience: ${brief.audience || 'Not specified'}
- Key message: ${keyMessage}
- Format: ${format}
${buildLengthLimitsBlock(budget)}

Generate 2 copy variants. Each should include:
- Headline (attention-grabbing, on-brand)
- Body copy (2-3 sentences)
- Call to action

Keep every variant within the length limits above.

Return valid JSON:
{
  "variants": [
    {
      "headline": "...",
      "body": "...",
      "cta": "..."
    }
  ]
}`
}

function buildIdeaFirstCopyPrompt(
  brief: CampaignBrief,
  format: string,
  fallback?: FallbackContext,
  budget?: CopyLengthBudget
): string {
  const seedIdea = fallback?.seed_idea || brief.objective || ''
  const keyMessage = brief.key_message?.trim() || brief.objective?.trim() || seedIdea

  return `You are an expert copywriter creating advertising copy.

STARTING POINT:
- Core idea: ${seedIdea}
${brief.audience || fallback?.audience ? `- Target audience: ${brief.audience || fallback?.audience}` : ''}

BRIEF:
- Objective: ${brief.objective || seedIdea}
- Audience: ${brief.audience || fallback?.audience || 'General audience'}
- Key message: ${keyMessage}
- Format: ${format}
${buildLengthLimitsBlock(budget)}

Generate 2 copy variants. Each should include:
- Headline (attention-grabbing, modern)
- Body copy (2-3 sentences)
- Call to action

The copy should feel fresh, engaging, and build on the core idea.
Keep every variant within the length limits above.

Return valid JSON:
{
  "variants": [
    {
      "headline": "...",
      "body": "...",
      "cta": "..."
    }
  ]
}`
}

export function buildCompliancePrompt(
  content: string,
  brand: BrandConstraints
): string {
  const avoidedWords = brand.voice.avoided_words?.join(', ') || ''
  const preferredWords = brand.voice.preferred_words?.join(', ') || ''
  const toneList = brand.voice.tone?.join(', ') || ''

  return `You are a brand compliance checker. Analyze the following content against brand guidelines.

BRAND GUIDELINES:
- Brand name: ${brand.name}
- Required tone: ${toneList}
${preferredWords ? `- Preferred language: ${preferredWords}` : ''}
${avoidedWords ? `- Forbidden language: ${avoidedWords}` : ''}

CONTENT TO CHECK:
${content}

TASK:
Perform the following compliance checks:
1. Tone alignment - Does the content match the required tone?
2. Language check - Does it use preferred words and avoid forbidden ones?
3. Brand consistency - Is it appropriate for the brand?

Return valid JSON:
{
  "passed": true/false,
  "checks": [
    {
      "name": "Check name",
      "status": "pass" | "fail" | "warning",
      "message": "Explanation"
    }
  ]
}`
}

/**
 * Inserts copy-variant messaging before the visual direction so image models align with the line.
 */
export function buildCopyAnchorPromptBlock(anchor: {
  headline?: string
  key_message?: string
  body_snippet?: string
}): string {
  const h = anchor.headline?.trim()
  const k = anchor.key_message?.trim()
  const b = anchor.body_snippet?.trim()
  if (!h && !k && !b) return ''
  const lines = [
    'MESSAGING ANCHOR (embody the mood, story, and promise of this copy in the scene; do not render long readable ad typography in-frame unless the user asks for visible text):',
  ]
  if (h) lines.push(`- Headline / hook: ${h}`)
  if (k) lines.push(`- Key message: ${k}`)
  if (b) lines.push(`- Supporting copy (suggest mood and subject only): ${b}`)
  return lines.join('\n')
}

export function buildImagePrompt(
  brand: BrandConstraints | undefined,
  description: string,
  fallback?: FallbackContext,
  brandInclude?: BrandIncludeFlags
): string {
  if (brand) {
    const guidance: string[] = []
    const visualStyle = brand.identity?.visual_style?.trim()
    if (visualStyle) {
      guidance.push(`Brand visual style: ${visualStyle}`)
    }
    if (brandInclude?.colours !== false) {
      const colors = brand.identity.colours?.map(c => c.hex).join(', ') || ''
      if (colors) guidance.push(`Color palette: ${colors}`)
    }
    if (brandInclude?.tone !== false) {
      const tone = brand.voice.tone?.join(', ') || ''
      if (tone) guidance.push(`Brand tone: ${tone}`)
    }
    if (brandInclude?.logo && brand.identity?.logo_url) {
      guidance.push('Include brand logo placement or logo-style elements in the design')
    }
    if (brandInclude?.text) {
      const preferred = brand.voice.preferred_words?.join(', ')
      const avoided = brand.voice.avoided_words?.join(', ')
      if (preferred) guidance.push(`Use words like: ${preferred}`)
      if (avoided) guidance.push(`Avoid words like: ${avoided}`)
    }
    guidance.push('Professional quality, advertising-ready')
    // Only impose a generic look when the brand has NOT specified its own visual
    // style — a hardcoded aesthetic fights brands whose identity is not "modern".
    if (!visualStyle) {
      guidance.push('Clean, modern aesthetic')
    }

    return `${description}

Style guidance:
- ${guidance.join('\n- ')}`
  }

  const styleHints = fallback?.style_hints?.join(', ') || 'modern, clean'

  return `${description}

Style guidance:
- Visual style: ${styleHints}
- Professional quality, advertising-ready
- Modern and engaging aesthetic`
}
