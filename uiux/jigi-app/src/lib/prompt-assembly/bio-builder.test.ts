import { describe, expect, it } from 'vitest'
import { buildBioFromBrand } from './bio-builder'
import { substitutePlaceholders } from './substitution'
import { CONCEPT_TEMPLATE, IMAGE_TEMPLATE } from './templates'
import type { CampaignContextObject } from '@/lib/cco'

const mockCco: CampaignContextObject = {
  campaign_id: '11111111-1111-4111-8111-111111111111',
  brand_id: '22222222-2222-4222-8222-222222222222',
  compiled_at: '2026-07-05T12:00:00.000Z',
  version: 1,
  strategic_context: {
    objective_raw: 'Launch summer refresh',
    key_message: 'Stay refreshed',
    emotional_register: [],
  },
  audience_context: {
    audience_raw: 'Young professionals',
    psychographic_traits: [],
    cultural_context: [],
  },
  channel_constraints: [
    {
      channel_id: 'instagram_post',
      format_rules: [],
      image_dimensions: { width: 1080, height: 1080 },
    },
  ],
  tone_profile: {
    base_tone: [],
    campaign_modifiers: [],
    effective_tone: ['Bold'],
    vocabulary_guidance: '',
  },
  hard_constraints: {
    parsed_requirements: [],
    parsed_exclusions: [],
    legal_disclaimers: [],
  },
  reference_assets: [],
}

describe('buildBioFromBrand', () => {
  it('F1: includes visual_style in assembled image prompt', () => {
    const style = 'Warm lifestyle photography with natural light and diverse casting'
    const bio = buildBioFromBrand({
      identity: { visual_style: style },
    })

    expect(bio?.visual_identity?.visual_style).toBe(style)
    expect(bio?.visual_identity?.photography_style).toBe(style)

    const prompt = substitutePlaceholders(IMAGE_TEMPLATE, bio, mockCco, 'instagram_post')
    expect(prompt).toContain(style)
  })

  it('F2: includes differentiators in assembled concept prompt', () => {
    const bio = buildBioFromBrand({
      strategy: {
        positioning: 'The refreshment choice for joy',
        differentiators: ['Secret formula', 'Iconic contour bottle'],
      },
    })

    expect(bio?.value_propositions).toContain('Secret formula')
    expect(bio?.messaging_architecture).toBe('The refreshment choice for joy')

    const prompt = substitutePlaceholders(CONCEPT_TEMPLATE, bio, mockCco)
    expect(prompt).toContain('Secret formula')
    expect(prompt).toContain('Iconic contour bottle')
    expect(prompt).toContain('The refreshment choice for joy')
  })
})
