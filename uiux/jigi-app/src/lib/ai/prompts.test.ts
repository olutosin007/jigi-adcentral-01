import { describe, expect, it } from 'vitest'
import { buildCopyPrompt, buildConceptPrompt, buildImagePrompt } from './prompts'
import { DEFAULT_BRAND_INCLUDE } from './types'
import type { BrandConstraints, CampaignBrief } from './types'

const brand: BrandConstraints = {
  name: 'Acme',
  identity: { colours: [{ hex: '#F40009', role: 'primary' }], fonts: { heading: 'Inter', body: 'Inter' } },
  voice: { tone: ['bold'], preferred_words: ['fresh'], avoided_words: ['cheap'] },
}

const brief: CampaignBrief = {
  objective: 'Launch',
  audience: 'Everyone',
  channels: ['instagram_story'],
}

describe('buildCopyPrompt length limits', () => {
  it('omits the LENGTH LIMITS block when no budget is provided', () => {
    const prompt = buildCopyPrompt(brand, brief, 'social_post')
    expect(prompt).not.toContain('LENGTH LIMITS')
  })

  it('injects the combined character budget when provided (brand-grounded)', () => {
    const prompt = buildCopyPrompt(brand, brief, 'social_post', undefined, { primaryMax: 125 })
    expect(prompt).toContain('LENGTH LIMITS')
    expect(prompt).toContain('max 125 characters')
    expect(prompt).toContain('within the length limits')
  })

  it('injects per-field caps and the combined budget', () => {
    const prompt = buildCopyPrompt(brand, brief, 'social_post', undefined, {
      primaryMax: 125,
      headlineMax: 40,
      ctaMax: 25,
    })
    expect(prompt).toContain('Headline: max 40 characters')
    expect(prompt).toContain('Call to action: max 25 characters')
  })

  it('injects the budget on the idea-first path (no brand)', () => {
    const prompt = buildCopyPrompt(undefined, brief, 'social_post', { seed_idea: 'a fresh idea' }, {
      primaryMax: 100,
    })
    expect(prompt).toContain('LENGTH LIMITS')
    expect(prompt).toContain('max 100 characters')
  })
})

describe('buildConceptPrompt brand-grounded schema (PRD-06)', () => {
  const strategyBrand: BrandConstraints = {
    ...brand,
    strategy: { positioning: 'The bold choice', differentiators: ['secret formula', 'iconic bottle'] },
  }

  it('requests the alignment-scoring fields so validators can score', () => {
    const prompt = buildConceptPrompt(strategyBrand, brief)
    expect(prompt).toContain('brand_alignment_score')
    expect(prompt).toContain('brand_alignment_rationale')
    expect(prompt).toContain('key_message_link')
    expect(prompt).toContain('strategic_insight')
  })

  it('still requests display headlines + a visual direction for image generation', () => {
    const prompt = buildConceptPrompt(strategyBrand, brief)
    expect(prompt).toContain('"headlines"')
    expect(prompt).toContain('visual_direction')
  })

  it('includes brand differentiators (previously dropped)', () => {
    const prompt = buildConceptPrompt(strategyBrand, brief)
    expect(prompt).toContain('secret formula')
    expect(prompt).toContain('iconic bottle')
  })
})

describe('buildImagePrompt visual style (Fix #3)', () => {
  const styledBrand: BrandConstraints = {
    ...brand,
    identity: {
      ...brand.identity,
      visual_style: 'Warm hand-painted market aesthetic, rustic and earthy',
    },
  }

  it('injects the brand visual style when provided', () => {
    const prompt = buildImagePrompt(styledBrand, 'A jar on a table', undefined, DEFAULT_BRAND_INCLUDE)
    expect(prompt).toContain('Brand visual style: Warm hand-painted market aesthetic, rustic and earthy')
  })

  it('does NOT force a generic aesthetic when the brand defines its own style', () => {
    const prompt = buildImagePrompt(styledBrand, 'A jar on a table', undefined, DEFAULT_BRAND_INCLUDE)
    expect(prompt).not.toContain('Clean, modern aesthetic')
  })

  it('falls back to a generic aesthetic only when no visual style is set', () => {
    const prompt = buildImagePrompt(brand, 'A jar on a table', undefined, DEFAULT_BRAND_INCLUDE)
    expect(prompt).not.toContain('Brand visual style:')
    expect(prompt).toContain('Clean, modern aesthetic')
  })
})
