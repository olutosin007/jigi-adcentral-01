import { describe, expect, it } from 'vitest'
import { campaignContextObjectSchema } from './schema'

const baseCCO = {
  campaign_id: '11111111-1111-4111-8111-111111111111',
  brand_id: null as string | null,
  compiled_at: '2026-07-05T12:00:00.000Z',
  version: 1,
  strategic_context: {
    objective_raw: 'Launch summer refresh',
    key_message: 'Stay refreshed all summer',
    emotional_register: [],
  },
  audience_context: {
    audience_raw: 'Young professionals 25-35',
    psychographic_traits: [],
    cultural_context: [],
  },
  channel_constraints: [{ channel_id: 'instagram_post', format_rules: [] }],
  tone_profile: {
    base_tone: [],
    campaign_modifiers: ['playful'],
    effective_tone: ['playful'],
    vocabulary_guidance: 'Use energetic language.',
  },
  hard_constraints: {
    parsed_requirements: [],
    parsed_exclusions: [],
    legal_disclaimers: [],
  },
  reference_assets: [],
}

describe('campaignContextObjectSchema', () => {
  it('C1: accepts brand_id null for CCO-lite', () => {
    const result = campaignContextObjectSchema.safeParse(baseCCO)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.brand_id).toBeNull()
    }
  })

  it('C2: still accepts brand_id uuid for brand-first campaigns', () => {
    const result = campaignContextObjectSchema.safeParse({
      ...baseCCO,
      brand_id: '22222222-2222-4222-8222-222222222222',
    })
    expect(result.success).toBe(true)
  })
})
