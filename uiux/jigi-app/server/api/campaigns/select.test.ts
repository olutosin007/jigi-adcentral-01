import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const CAMPAIGN_ID = '550e8400-e29b-41d4-a716-446655440000'
export const CONCEPT_ID = '660e8400-e29b-41d4-a716-446655440001'
export const COPY_ID = '770e8400-e29b-41d4-a716-446655440002'
export const OTHER_CAMPAIGN_ID = '880e8400-e29b-41d4-a716-446655440003'
export const IMAGE_ID = '990e8400-e29b-41d4-a716-446655440004'
export const WRONG_COPY_ID = 'aa0e8400-e29b-41d4-a716-446655440005'
export const BRAND_ID = 'bb0e8400-e29b-41d4-a716-446655440006'
export const USER_ID = 'cc0e8400-e29b-41d4-a716-446655440007'
export const ORG_ID = 'dd0e8400-e29b-41d4-a716-446655440008'

const {
  mockGetUser,
  mockCampaignState,
  mockAgencyAccess,
  mockAssets,
  initialCampaign,
} = vi.hoisted(() => {
  const campaignId = '550e8400-e29b-41d4-a716-446655440000'
  const conceptId = '660e8400-e29b-41d4-a716-446655440001'
  const copyId = '770e8400-e29b-41d4-a716-446655440002'
  const otherCampaignId = '880e8400-e29b-41d4-a716-446655440003'
  const imageId = '990e8400-e29b-41d4-a716-446655440004'
  const wrongCopyId = 'aa0e8400-e29b-41d4-a716-446655440005'
  const brandId = 'bb0e8400-e29b-41d4-a716-446655440006'
  const userId = 'cc0e8400-e29b-41d4-a716-446655440007'

  const campaign = {
    id: campaignId,
    brand_id: brandId,
    created_by: userId,
    selected_concept_asset_id: null as string | null,
    selected_copy_asset_id: null as string | null,
  }

  const assets: Record<
    string,
    { id: string; campaign_id: string; type: string; parent_asset_id: string | null }
  > = {
    [conceptId]: { id: conceptId, campaign_id: campaignId, type: 'concept', parent_asset_id: null },
    [copyId]: { id: copyId, campaign_id: campaignId, type: 'copy', parent_asset_id: conceptId },
    [wrongCopyId]: {
      id: wrongCopyId,
      campaign_id: campaignId,
      type: 'copy',
      parent_asset_id: '00000000-0000-4000-8000-000000000099',
    },
    [imageId]: { id: imageId, campaign_id: campaignId, type: 'image', parent_asset_id: conceptId },
    '00000000-0000-4000-8000-000000000099': {
      id: '00000000-0000-4000-8000-000000000099',
      campaign_id: otherCampaignId,
      type: 'concept',
      parent_asset_id: null,
    },
  }

  return {
    mockGetUser: vi.fn(),
    mockCampaignState: { campaign },
    mockAgencyAccess: { value: null as { brand_id: string } | null },
    mockAssets: assets,
    initialCampaign: campaign,
  }
})

function createMockRes(): VercelResponse & { _status: number; _json: unknown } {
  const res = {
    _status: 200,
    _json: null as unknown,
    status(code: number) {
      res._status = code
      return res
    },
    json(body: unknown) {
      res._json = body
      return res
    },
  } as VercelResponse & { _status: number; _json: unknown }
  return res
}

function req(partial: Partial<VercelRequest> & { body?: unknown }): VercelRequest {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer fake' },
    body: {},
    ...partial,
  } as VercelRequest
}

vi.mock('../lib/supabase.js', () => ({
  getAuthenticatedUser: (auth?: string) => mockGetUser(auth),
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'campaigns') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { ...mockCampaignState.campaign }, error: null }),
            }),
          }),
          update: (payload: Record<string, unknown>) => ({
            eq: () => ({
              select: () => ({
                single: () => {
                  mockCampaignState.campaign = {
                    ...mockCampaignState.campaign,
                    ...payload,
                  } as typeof mockCampaignState.campaign
                  return Promise.resolve({
                    data: { ...mockCampaignState.campaign, name: 'Campaign' },
                    error: null,
                  })
                },
              }),
            }),
          }),
        }
      }
      if (table === 'creative_assets') {
        return {
          select: () => ({
            eq: (_col: string, assetId: string) => ({
              single: () => {
                const asset = mockAssets[assetId]
                if (!asset) {
                  return Promise.resolve({ data: null, error: { message: 'Not found' } })
                }
                return Promise.resolve({ data: asset, error: null })
              },
            }),
          }),
        }
      }
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { organisation_id: ORG_ID }, error: null }),
            }),
          }),
        }
      }
      if (table === 'brands') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { organisation_id: ORG_ID }, error: null }),
            }),
          }),
        }
      }
      if (table === 'agency_brand_access') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: mockAgencyAccess.value, error: null }),
                }),
              }),
            }),
          }),
        }
      }
      return {}
    },
  }),
}))

describe('POST /api/campaigns/select', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ user: { id: USER_ID }, error: null })
    mockCampaignState.campaign = {
      ...initialCampaign,
      selected_concept_asset_id: null,
      selected_copy_asset_id: null,
    }
    mockAgencyAccess.value = null
  })

  it('returns 405 for GET', async () => {
    const handler = (await import('./select.js')).default
    const res = createMockRes()
    await handler(req({ method: 'GET' }), res)
    expect(res._status).toBe(405)
  })

  it('S1: sets valid concept selection', async () => {
    const handler = (await import('./select.js')).default
    const res = createMockRes()
    await handler(
      req({
        body: { campaign_id: CAMPAIGN_ID, selection: 'concept', asset_id: CONCEPT_ID },
      }),
      res
    )
    expect(res._status).toBe(200)
    const body = res._json as { campaign?: { selected_concept_asset_id?: string } }
    expect(body.campaign?.selected_concept_asset_id).toBe(CONCEPT_ID)
  })

  it('S2: rejects copy with wrong parent_asset_id', async () => {
    mockCampaignState.campaign.selected_concept_asset_id = CONCEPT_ID
    const handler = (await import('./select.js')).default
    const res = createMockRes()
    await handler(
      req({
        body: { campaign_id: CAMPAIGN_ID, selection: 'copy', asset_id: WRONG_COPY_ID },
      }),
      res
    )
    expect(res._status).toBe(400)
    expect(String((res._json as { error?: string }).error)).toMatch(/selected concept/i)
  })

  it('S3: rejects asset from another campaign', async () => {
    const handler = (await import('./select.js')).default
    const res = createMockRes()
    await handler(
      req({
        body: {
          campaign_id: CAMPAIGN_ID,
          selection: 'concept',
          asset_id: '00000000-0000-4000-8000-000000000099',
        },
      }),
      res
    )
    expect(res._status).toBe(400)
    expect(String((res._json as { error?: string }).error)).toMatch(/campaign/i)
  })

  it('S4: rejects concept selection with image type', async () => {
    const handler = (await import('./select.js')).default
    const res = createMockRes()
    await handler(
      req({
        body: { campaign_id: CAMPAIGN_ID, selection: 'concept', asset_id: IMAGE_ID },
      }),
      res
    )
    expect(res._status).toBe(400)
    expect(String((res._json as { error?: string }).error)).toMatch(/concept/i)
  })

  it('S7: allows agency user on connected brand', async () => {
    mockAgencyAccess.value = { brand_id: BRAND_ID }
    const handler = (await import('./select.js')).default
    const res = createMockRes()
    await handler(
      req({
        body: { campaign_id: CAMPAIGN_ID, selection: 'concept', asset_id: CONCEPT_ID },
      }),
      res
    )
    expect(res._status).toBe(200)
  })

  it('S8: allows idea-first creator', async () => {
    mockCampaignState.campaign = {
      id: CAMPAIGN_ID,
      brand_id: null,
      created_by: USER_ID,
      selected_concept_asset_id: null,
      selected_copy_asset_id: null,
    }
    const handler = (await import('./select.js')).default
    const res = createMockRes()
    await handler(
      req({
        body: { campaign_id: CAMPAIGN_ID, selection: 'concept', asset_id: CONCEPT_ID },
      }),
      res
    )
    expect(res._status).toBe(200)
  })

  it('clears copy selection when concept clears', async () => {
    mockCampaignState.campaign = {
      ...initialCampaign,
      selected_concept_asset_id: CONCEPT_ID,
      selected_copy_asset_id: COPY_ID,
    }
    const handler = (await import('./select.js')).default
    const res = createMockRes()
    await handler(
      req({
        body: { campaign_id: CAMPAIGN_ID, selection: 'concept', asset_id: null },
      }),
      res
    )
    expect(res._status).toBe(200)
    const body = res._json as {
      campaign?: { selected_concept_asset_id?: null; selected_copy_asset_id?: null }
    }
    expect(body.campaign?.selected_concept_asset_id).toBeNull()
    expect(body.campaign?.selected_copy_asset_id).toBeNull()
  })
})
