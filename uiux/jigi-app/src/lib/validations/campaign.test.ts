import { describe, it, expect } from 'vitest'
import {
  campaignBriefSchema,
  ideaFirstBriefSchema,
  createCampaignSchema,
  updateCampaignSchema,
  fullBriefSchema,
} from './campaign'

describe('campaign validations', () => {
  describe('campaignBriefSchema', () => {
    it('validates valid brief', () => {
      const valid = {
        objective: 'Launch summer campaign',
        audience: 'Young professionals 25-35',
        channels: ['instagram_post'],
        requirements: 'Bold colors',
      }
      expect(campaignBriefSchema.parse(valid)).toEqual(valid)
    })

    it('rejects objective shorter than 10 chars', () => {
      expect(() =>
        campaignBriefSchema.parse({
          objective: 'Short',
          audience: 'Young professionals 25-35',
          channels: ['instagram_post'],
        })
      ).toThrow()
    })

    it('rejects empty channels', () => {
      expect(() =>
        campaignBriefSchema.parse({
          objective: 'Launch summer campaign',
          audience: 'Young professionals 25-35',
          channels: [],
        })
      ).toThrow()
    })
  })

  describe('ideaFirstBriefSchema', () => {
    it('validates valid idea-first brief', () => {
      const valid = {
        seed_idea: 'A beach vacation vibe for sunscreen',
        audience: 'Families',
        channels: ['facebook_post'],
      }
      expect(ideaFirstBriefSchema.parse(valid)).toEqual(valid)
    })

    it('rejects seed_idea shorter than 10 chars', () => {
      expect(() =>
        ideaFirstBriefSchema.parse({
          seed_idea: 'Short',
          channels: ['instagram_post'],
        })
      ).toThrow()
    })
  })

  describe('createCampaignSchema', () => {
    it('validates valid create payload', () => {
      const valid = {
        name: 'Summer Campaign',
        brand_id: '550e8400-e29b-41d4-a716-446655440000',
        journey_mode: 'brand_first' as const,
        brief: {
          objective: 'Launch summer campaign',
          audience: 'Young professionals 25-35',
          channels: ['instagram_post'],
        },
      }
      expect(createCampaignSchema.parse(valid)).toEqual(valid)
    })

    it('rejects name shorter than 3 chars', () => {
      expect(() =>
        createCampaignSchema.parse({
          name: 'AB',
          journey_mode: 'brand_first',
        })
      ).toThrow()
    })

    it('rejects invalid brand_id uuid', () => {
      expect(() =>
        createCampaignSchema.parse({
          name: 'Campaign',
          brand_id: 'not-a-uuid',
          journey_mode: 'brand_first',
        })
      ).toThrow()
    })
  })

  describe('updateCampaignSchema', () => {
    it('validates valid update payload', () => {
      const valid = { name: 'Updated Name', status: 'active' as const }
      expect(updateCampaignSchema.parse(valid)).toEqual(valid)
    })

    it('rejects invalid status', () => {
      expect(() =>
        updateCampaignSchema.parse({ status: 'invalid_status' })
      ).toThrow()
    })
  })

  describe('fullBriefSchema', () => {
    it('validates valid full brief', () => {
      const valid = {
        name: 'Campaign',
        objective: 'Launch summer campaign',
        audience: 'Young professionals',
        channels: ['instagram_post'],
      }
      expect(fullBriefSchema.parse(valid)).toEqual(valid)
    })
  })
})
