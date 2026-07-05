import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CampaignContextObject } from '@/lib/cco'

const fetchCCOMock = vi.fn()
const fetchBrandMock = vi.fn()

vi.mock('@/lib/cco', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/cco')>()
  return {
    ...mod,
    fetchCCO: (...args: unknown[]) => fetchCCOMock(...args),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: (...args: unknown[]) => fetchBrandMock(...args),
    })),
  },
}))

import { assemblePrompt } from './assembler'

const ccoLite: CampaignContextObject = {
  campaign_id: '66666666-6666-4666-8666-666666666666',
  brand_id: null,
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

describe('assemblePrompt', () => {
  beforeEach(() => {
    fetchCCOMock.mockReset()
    fetchBrandMock.mockReset()
    fetchCCOMock.mockResolvedValue({ success: true, cco: ccoLite })
  })

  it('C5: assembles concept prompt without brandId (CCO-lite)', async () => {
    const result = await assemblePrompt({
      campaignId: ccoLite.campaign_id,
      track: 'concept',
    })

    expect(result).not.toBeNull()
    expect(result?.prompt).toContain('Stay refreshed all summer')
    expect(result?.prompt).toContain('playful')
    expect(result?.cco_version).toBe(1)
    expect(fetchBrandMock).not.toHaveBeenCalled()
  })

  it('returns null when no CCO exists', async () => {
    fetchCCOMock.mockResolvedValue({ success: false, error: 'No CCO' })

    const result = await assemblePrompt({
      campaignId: '77777777-7777-4777-8777-777777777777',
      track: 'concept',
    })

    expect(result).toBeNull()
  })

  it('H6: assembles copy prompt with selected concept context', async () => {
    const result = await assemblePrompt({
      campaignId: ccoLite.campaign_id,
      track: 'copy',
      channelId: 'instagram_post',
      conceptContext: {
        theme: 'Golden Hour',
        headlines: ['Chase the light'],
        visual_direction: 'Warm sunset lifestyle photography',
      },
    })

    expect(result).not.toBeNull()
    expect(result?.prompt).toContain('SELECTED CONCEPT CONTEXT')
    expect(result?.prompt).toContain('Golden Hour')
    expect(result?.prompt).toContain('Stay refreshed all summer')
  })
})
