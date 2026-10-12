import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const ASSET_ID = '550e8400-e29b-41d4-a716-446655440000'

const { mockGetUser, mockRunReplicate, tables, inserts } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockRunReplicate: vi.fn(),
  tables: {} as Record<string, { data: unknown; error: unknown; count?: number }>,
  inserts: [] as Array<{ table: string; row: Record<string, unknown> }>,
}))

function builder(table: string) {
  const b: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve(tables[table] ?? { data: null, error: null, count: 0 }).then(resolve),
  }
  for (const m of ['select', 'eq', 'gte', 'single', 'maybeSingle']) b[m] = () => b
  b.insert = (row: Record<string, unknown>) => {
    inserts.push({ table, row })
    if (table === 'creative_assets') tables.creative_assets = { data: { id: 'new-asset', ...row }, error: null }
    return b
  }
  return b
}

vi.mock('./lib/supabase.js', () => ({
  getAuthenticatedUser: (auth?: string) => mockGetUser(auth),
  getSupabaseAdmin: () => ({
    from: (table: string) => builder(table),
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://storage/up.png' } }),
      }),
    },
  }),
}))

vi.mock('./lib/replicate.js', () => ({
  runReplicateModel: (...args: unknown[]) => mockRunReplicate(...args),
}))

vi.mock('./lib/env.js', () => ({
  getServerEnv: () => undefined,
  getNumberEnv: (_k: string, fallback: number) => fallback,
  getBooleanEnv: (_k: string, fallback = false) => fallback,
}))

function res() {
  const r = {
    _status: 200,
    _json: null as unknown,
    status(code: number) {
      r._status = code
      return r
    },
    json(body: unknown) {
      r._json = body
      return r
    },
  }
  return r as unknown as VercelResponse & { _status: number; _json: Record<string, unknown> }
}

const request = (body: unknown, method = 'POST') =>
  ({ method, headers: { authorization: 'Bearer t' }, body }) as VercelRequest

const ownedImage = {
  id: ASSET_ID,
  campaign_id: 'camp-1',
  type: 'image',
  version: 1,
  created_by: 'user-1',
  content: { url: 'https://cdn/orig.png', prompt_used: 'p' },
  campaigns: { created_by: 'someone', brand_id: 'brand-1', brands: { organisation_id: 'org-brand' } },
}

beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k]
  inserts.length = 0
  mockGetUser.mockResolvedValue({ user: { id: 'user-1' }, error: null })
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('img', { status: 200, headers: { 'content-type': 'image/png' } }))
  )
})

afterEach(() => vi.unstubAllGlobals())

const load = async () => (await import('./generate/upscale.js')).default

describe('POST /api/generate/upscale', () => {
  it('405 for GET', async () => {
    const r = res()
    await (await load())(request({}, 'GET'), r)
    expect(r._status).toBe(405)
  })

  it('401 without a user', async () => {
    mockGetUser.mockResolvedValueOnce({ user: null, error: 'Unauthorized' })
    const r = res()
    await (await load())(request({ asset_id: ASSET_ID }), r)
    expect(r._status).toBe(401)
  })

  it('400 for an invalid body', async () => {
    const r = res()
    await (await load())(request({ asset_id: 'nope' }), r)
    expect(r._status).toBe(400)
  })

  it('404 when the asset is missing', async () => {
    tables.creative_assets = { data: null, error: { message: 'not found' } }
    const r = res()
    await (await load())(request({ asset_id: ASSET_ID }), r)
    expect(r._status).toBe(404)
  })

  it('403 when the user has no relationship to the asset', async () => {
    tables.creative_assets = { data: { ...ownedImage, created_by: 'other' }, error: null }
    tables.users = { data: { organisation_id: 'org-elsewhere' }, error: null }
    tables.agency_brand_access = { data: null, error: null }
    const r = res()
    await (await load())(request({ asset_id: ASSET_ID }), r)
    expect(r._status).toBe(403)
    expect(mockRunReplicate).not.toHaveBeenCalled()
  })

  it('400 for an already-upscaled image', async () => {
    tables.creative_assets = { data: { ...ownedImage, content: { url: 'x', upscaled_from: 'y' } }, error: null }
    const r = res()
    await (await load())(request({ asset_id: ASSET_ID }), r)
    expect(r._status).toBe(400)
  })

  it('429 when the per-user daily cap is reached', async () => {
    tables.creative_assets = { data: ownedImage, error: null }
    tables.image_routing_events = { data: null, error: null, count: 24 }
    const r = res()
    await (await load())(request({ asset_id: ASSET_ID }), r)
    expect(r._status).toBe(429)
  })

  it('creates a v2 child asset and logs a success event', async () => {
    tables.creative_assets = { data: ownedImage, error: null }
    mockRunReplicate.mockResolvedValueOnce('https://replicate/out.png')
    const r = res()
    await (await load())(request({ asset_id: ASSET_ID, scale: 2 }), r)

    expect(r._status).toBe(200)
    expect(mockRunReplicate).toHaveBeenCalledWith('nightmareai/real-esrgan', {
      image: 'https://cdn/orig.png',
      scale: 2,
    })
    const assetRow = inserts.find((i) => i.table === 'creative_assets')!.row
    expect(assetRow).toMatchObject({ parent_asset_id: ASSET_ID, version: 2, status: 'draft' })
    expect(inserts.find((i) => i.table === 'image_routing_events')!.row).toMatchObject({
      status: 'success',
      image_provider: 'replicate',
      image_tier: 'final',
    })
    expect(r._json).toMatchObject({ image_url: 'https://storage/up.png', estimated_cost_usd: 0.002 })
  })

  it('500 and an error event when the upscaler fails', async () => {
    tables.creative_assets = { data: ownedImage, error: null }
    mockRunReplicate.mockRejectedValueOnce(new Error('model offline'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = res()
    await (await load())(request({ asset_id: ASSET_ID }), r)
    expect(r._status).toBe(500)
    expect(inserts.find((i) => i.table === 'image_routing_events')!.row).toMatchObject({
      status: 'error',
      error_message: 'model offline',
    })
  })
})
