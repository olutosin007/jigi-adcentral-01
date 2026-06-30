import type { BrandConstraints, BrandIncludeFlags, CampaignBrief, FallbackContext } from './types'

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
  const channels = brief.channels?.join(', ') || 'social media'

  return `You are a senior creative strategist generating advertising campaign concepts.

BRAND CONSTRAINTS (follow exactly):
- Brand name: ${brand.name}
- Colours: ${colorsJson}
- Tone of voice: ${toneList}
${preferredWords ? `- Language to use: ${preferredWords}` : ''}
${avoidedWords ? `- Language to avoid: ${avoidedWords}` : ''}
${brand.strategy?.positioning ? `- Brand positioning: ${brand.strategy.positioning}` : ''}

BRIEF:
- Campaign objective: ${brief.objective || 'Not specified'}
- Target audience: ${brief.audience || 'Not specified'}
- Channels: ${channels}
${brief.requirements ? `- Specific requirements: ${brief.requirements}` : ''}

TASK:
Generate 2 distinct campaign concept directions. For each concept, provide:
1. Theme/Big Idea (2-4 words)
2. 3 headline variants
3. Visual direction description (2-3 sentences)
4. Brief rationale (1 sentence)

Each concept must:
- Align with the brand tone exactly
- Use preferred language, avoid listed words
- Be distinct from the other concepts
- Be executable across the listed channels

Return valid JSON in this exact format:
{
  "concepts": [
    {
      "theme": "Theme Name",
      "headlines": ["Headline 1", "Headline 2", "Headline 3"],
      "visual_direction": "Description of visuals...",
      "rationale": "Why this concept works..."
    }
  ]
}`
}

function buildIdeaFirstConceptPrompt(brief: CampaignBrief, fallback?: FallbackContext): string {
  const channels = brief.channels?.join(', ') || 'social media'
  const seedIdea = fallback?.seed_idea || brief.objective || ''
  const styleHints = fallback?.style_hints?.join(', ') || ''

  return `You are a senior creative strategist generating advertising campaign concepts.

STARTING POINT:
- Core idea: ${seedIdea}
${brief.audience || fallback?.audience ? `- Target audience: ${brief.audience || fallback?.audience}` : ''}
${styleHints ? `- Style hints: ${styleHints}` : ''}

BRIEF:
- Campaign objective: ${brief.objective || seedIdea}
- Target audience: ${brief.audience || fallback?.audience || 'General audience'}
- Channels: ${channels}
${brief.requirements ? `- Specific requirements: ${brief.requirements}` : ''}

TASK:
Generate 2 distinct campaign concept directions based on the core idea. For each concept, provide:
1. Theme/Big Idea (2-4 words)
2. 3 headline variants
3. Visual direction description (2-3 sentences)
4. Brief rationale (1 sentence)

Each concept must:
- Build on the core idea creatively
- Be distinct from the other concepts
- Be executable across the listed channels
- Feel modern and engaging

Return valid JSON in this exact format:
{
  "concepts": [
    {
      "theme": "Theme Name",
      "headlines": ["Headline 1", "Headline 2", "Headline 3"],
      "visual_direction": "Description of visuals...",
      "rationale": "Why this concept works..."
    }
  ]
}`
}

export function buildCopyPrompt(
  brand: BrandConstraints | undefined,
  brief: CampaignBrief,
  format: string = 'social_post',
  fallback?: FallbackContext
): string {
  if (brand) {
    return buildBrandGroundedCopyPrompt(brand, brief, format)
  }
  return buildIdeaFirstCopyPrompt(brief, format, fallback)
}

function buildBrandGroundedCopyPrompt(
  brand: BrandConstraints,
  brief: CampaignBrief,
  format: string
): string {
  const toneList = brand.voice.tone?.join(', ') || 'professional'
  const preferredWords = brand.voice.preferred_words?.join(', ') || ''
  const avoidedWords = brand.voice.avoided_words?.join(', ') || ''
  const sampleVoice = brand.voice.samples?.[0] || ''

  return `You are an expert copywriter creating advertising copy for a brand.

BRAND VOICE:
- Tone: ${toneList}
${preferredWords ? `- Use these words/phrases: ${preferredWords}` : ''}
${avoidedWords ? `- Never use: ${avoidedWords}` : ''}
${sampleVoice ? `- Style reference: ${sampleVoice}` : ''}

BRIEF:
- Objective: ${brief.objective || 'Not specified'}
- Audience: ${brief.audience || 'Not specified'}
- Format: ${format}

Generate 2 copy variants. Each should include:
- Headline (attention-grabbing, on-brand)
- Body copy (2-3 sentences)
- Call to action

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
  fallback?: FallbackContext
): string {
  const seedIdea = fallback?.seed_idea || brief.objective || ''

  return `You are an expert copywriter creating advertising copy.

STARTING POINT:
- Core idea: ${seedIdea}
${brief.audience || fallback?.audience ? `- Target audience: ${brief.audience || fallback?.audience}` : ''}

BRIEF:
- Objective: ${brief.objective || seedIdea}
- Audience: ${brief.audience || fallback?.audience || 'General audience'}
- Format: ${format}

Generate 2 copy variants. Each should include:
- Headline (attention-grabbing, modern)
- Body copy (2-3 sentences)
- Call to action

The copy should feel fresh, engaging, and build on the core idea.

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
    guidance.push('Modern and clean aesthetic')

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
