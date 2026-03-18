import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCampaignStore } from './campaignStore'
import type { Campaign } from './campaignStore'

const mockCampaign: Campaign = {
  id: 'camp-1',
  brand_id: 'brand-1',
  created_by: 'user-1',
  name: 'Test Campaign',
  brief: { objective: 'Test', audience: 'Youth', channels: ['instagram_post'] },
  journey_mode: 'brand_first',
  generation_mode: 'brand_grounded',
  status: 'draft',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockCampaign, error: null }),
    })),
  },
}))

describe('campaignStore', () => {
  beforeEach(() => {
    useCampaignStore.setState({
      campaigns: [],
      currentCampaign: null,
      assets: [],
      isLoading: false,
      error: null,
    })
  })

  describe('setCurrentCampaign', () => {
    it('sets current campaign', () => {
      useCampaignStore.getState().setCurrentCampaign(mockCampaign)
      expect(useCampaignStore.getState().currentCampaign).toEqual(mockCampaign)
    })

    it('clears current campaign when null', () => {
      useCampaignStore.getState().setCurrentCampaign(mockCampaign)
      useCampaignStore.getState().setCurrentCampaign(null)
      expect(useCampaignStore.getState().currentCampaign).toBeNull()
    })
  })

  describe('clearError', () => {
    it('clears error state', () => {
      useCampaignStore.setState({ error: 'Some error' })
      useCampaignStore.getState().clearError()
      expect(useCampaignStore.getState().error).toBeNull()
    })
  })

  describe('constants', () => {
    it('CHANNEL_OPTIONS has expected structure', async () => {
      const { CHANNEL_OPTIONS } = await import('./campaignStore')
      expect(CHANNEL_OPTIONS.length).toBeGreaterThan(0)
      expect(CHANNEL_OPTIONS[0]).toHaveProperty('value')
      expect(CHANNEL_OPTIONS[0]).toHaveProperty('label')
    })

    it('CAMPAIGN_STATUS_OPTIONS has expected structure', async () => {
      const { CAMPAIGN_STATUS_OPTIONS } = await import('./campaignStore')
      expect(CAMPAIGN_STATUS_OPTIONS).toContainEqual(
        expect.objectContaining({ value: 'draft', label: 'Draft' })
      )
    })
  })
})
