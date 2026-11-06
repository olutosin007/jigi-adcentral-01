import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CampaignBrief } from '@/store/campaignStore'

const persistCCOMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { voice: { tone: ['professional'] }, strategy: { differentiators: ['Quality'] } },
        error: null,
      }),
    })),
  },
}))

vi.mock('@/lib/cco', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/cco')>()
  return {
    ...mod,
    persistCCO: (...args: unknown[]) => persistCCOMock(...args),
  }
})

import { compileBriefToCCO, hasCompilableBrief } from './compiler'

const ideaFirstBrief: CampaignBrief = {
  objective: 'Launch summer refresh campaign for sunscreen',
  audience: 'Young professionals aged 25 to 35',
  channels: ['instagram_post'],
  key_message: 'Stay refreshed all summer long',
  tone_override: ['playful', 'bold'],
}

describe('hasCompilableBrief', () => {
  it('returns false for empty brief', () => {
    expect(hasCompilableBrief(undefined)).toBe(false)
    expect(hasCompilableBrief({})).toBe(false)
  })

  it('returns true when key fields exist', () => {
    expect(hasCompilableBrief({ key_message: 'Hello world' })).toBe(true)
    expect(hasCompilableBrief({ channels: ['instagram_post'] })).toBe(true)
  })
})

describe('compileBriefToCCO', () => {
  beforeEach(() => {
    persistCCOMock.mockReset()
    persistCCOMock.mockResolvedValue({ success: true })
  })

  it('C3: CCO-lite uses tone_override only when brandId is null', async () => {
    await compileBriefToCCO({
      campaignId: '33333333-3333-4333-8333-333333333333',
      brandId: null,
      brief: ideaFirstBrief,
    })

    expect(persistCCOMock).toHaveBeenCalledOnce()
    const [, brandId, payload] = persistCCOMock.mock.calls[0]
    expect(brandId).toBeNull()
    expect(payload.tone_profile.base_tone).toEqual([])
    expect(payload.tone_profile.campaign_modifiers).toEqual(['playful', 'bold'])
    expect(payload.tone_profile.effective_tone).toEqual(['playful', 'bold'])
    expect(payload.strategic_context.key_message).toBe('Stay refreshed all summer long')
    expect(payload.strategic_context.value_prop_alignment).toBeUndefined()
  })

  it('C4: brand-first merges BIO tone with campaign modifiers', async () => {
    await compileBriefToCCO({
      campaignId: '44444444-4444-4444-8444-444444444444',
      brandId: '55555555-5555-4555-8555-555555555555',
      brief: { ...ideaFirstBrief, tone_override: ['bold'] },
    })

    expect(persistCCOMock).toHaveBeenCalledOnce()
    const [, brandId, payload] = persistCCOMock.mock.calls[0]
    expect(brandId).toBe('55555555-5555-4555-8555-555555555555')
    expect(payload.tone_profile.base_tone).toEqual(['professional'])
    expect(payload.tone_profile.effective_tone).toEqual(['professional', 'bold'])
    expect(payload.strategic_context.value_prop_alignment).toBe('Quality')
  })
})
