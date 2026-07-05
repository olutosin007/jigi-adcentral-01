/**
 * Sanity tests for POST /api/generate/text and /api/generate/image handlers.
 * Uses mocks (no Azure call); use `pnpm sanity:api` for live localhost checks.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

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
    headers: {},
    body: {},
    ...partial,
  } as VercelRequest
}

const {
  mockGetUser,
  mockInsert,
  mockCreateChatCompletion,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
  mockCreateChatCompletion: vi.fn(),
}))

vi.mock('./lib/supabase.js', () => ({
  getAuthenticatedUser: (auth?: string) => mockGetUser(auth),
  getSupabaseAdmin: () => ({
    from: () => ({
      insert: mockInsert,
      select: () => ({
        eq: () => ({
          gte: () => Promise.resolve({ count: 0, error: null }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/img.png' } }),
      }),
    },
  }),
}))

vi.mock('./lib/schema-contract.js', () => ({
  ensureDatabaseContract: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./lib/copy-prompt-revision.js', () => ({
  COPY_PROMPT_REVISION: 'test-copy-rev',
}))

vi.mock('./lib/llm.js', () => ({
  createChatCompletion: (args: unknown) => mockCreateChatCompletion(args),
  getLlmModelName: () => 'test-model',
}))

vi.mock('./lib/replicate.js', () => ({
  generateImageWithReplicateModel: vi.fn(),
}))

vi.mock('./lib/google-imagen.js', () => ({
  generateImageWithGoogleImagen: vi.fn(),
}))

vi.mock('./lib/azure-image.js', () => ({
  generateImageWithAzure: vi.fn(),
}))

vi.mock('./lib/azure-foundry-flux.js', () => ({
  generateImageWithFoundryFlux: vi.fn(),
}))

vi.mock('./lib/image-routing.js', () => ({
  buildRouteChain: vi.fn(() => []),
  getImageRoutingCaps: vi.fn(() => ({
    tierDailyCaps: { draft: 300, refine: 120, final: 40 },
    perUserDailyCap: 24,
    perCampaignDailyCap: 18,
    globalPaidDailyCap: 12,
  })),
  getImageRoutingProviderMode: vi.fn(() => 'hybrid'),
  hasAzureImageConfig: vi.fn(() => false),
  hasFoundryFluxConfig: vi.fn(() => false),
  isRetryableProviderError: vi.fn(() => false),
  resolveRoute: vi.fn(),
}))

describe('POST /api/generate/text (handler)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ user: { id: 'user-1' }, error: null })
    mockCreateChatCompletion.mockResolvedValue({
      content: JSON.stringify({
        concepts: [
          {
            theme: 'Test theme',
            headlines: ['H1', 'H2', 'H3'],
            visual_direction: 'Bold visuals',
            rationale: 'Fits brief',
          },
        ],
      }),
      usage: { prompt_tokens: 10, completion_tokens: 20 },
      model: 'test-model',
    })
  })

  it('returns 405 for GET', async () => {
    const textHandler = (await import('./generate/text.js')).default
    const res = createMockRes()
    await textHandler(req({ method: 'GET' }), res)
    expect(res._status).toBe(405)
    expect((res._json as { error?: string }).error).toMatch(/method not allowed/i)
  })

  it('returns 401 without a valid user', async () => {
    mockGetUser.mockResolvedValueOnce({ user: null, error: 'Unauthorized' })
    const textHandler = (await import('./generate/text.js')).default
    const res = createMockRes()
    await textHandler(
      req({
        headers: { authorization: '' },
        body: { type: 'concept', campaign_id: 'c1', prompt: 'x'.repeat(20) },
      }),
      res
    )
    expect(res._status).toBe(401)
    expect((res._json as { error?: string }).error).toBeTruthy()
  })

  it('returns 400 when type, campaign_id, or prompt is missing', async () => {
    const textHandler = (await import('./generate/text.js')).default
    const res = createMockRes()
    await textHandler(
      req({
        headers: { authorization: 'Bearer fake' },
        body: { type: 'concept', campaign_id: 'c1' },
      }),
      res
    )
    expect(res._status).toBe(400)
    expect(String((res._json as { error?: string }).error)).toMatch(/missing required/i)
  })

  it('returns 400 for invalid type', async () => {
    const textHandler = (await import('./generate/text.js')).default
    const res = createMockRes()
    await textHandler(
      req({
        headers: { authorization: 'Bearer fake' },
        body: { type: 'invalid_type', campaign_id: 'c1', prompt: 'y'.repeat(15) },
      }),
      res
    )
    expect(res._status).toBe(400)
    expect(String((res._json as { error?: string }).error)).toMatch(/invalid type/i)
  })

  it('returns 200 and parsed concepts on success', async () => {
    const textHandler = (await import('./generate/text.js')).default
    const res = createMockRes()
    await textHandler(
      req({
        headers: { authorization: 'Bearer fake' },
        body: {
          type: 'concept',
          campaign_id: '550e8400-e29b-41d4-a716-446655440000',
          prompt: 'Generate two concepts for summer sale',
        },
      }),
      res
    )
    expect(res._status).toBe(200)
    const body = res._json as { content?: { concepts?: unknown[] }; type?: string }
    expect(body.type).toBe('concept')
    expect(Array.isArray(body.content?.concepts)).toBe(true)
    expect(mockInsert).toHaveBeenCalled()
    const insertArg = mockInsert.mock.calls[0][0] as Record<string, unknown>
    expect(insertArg.status).toBe('success')
    expect(insertArg.copy_prompt_revision).toBeNull()
  })

  it('logs copy_prompt_revision for copy type on success', async () => {
    mockCreateChatCompletion.mockResolvedValueOnce({
      content: JSON.stringify({
        variations: [
          {
            variant_label: 'A',
            variant_intent: 'Proof',
            channel: 'meta_feed',
            deliverable_type: 'social_feed',
            key_message_delivery: 'KM',
            content: { headline: 'h', body: 'b', cta: 'c' },
            character_count: 10,
            tone_adherence: 80,
            mandatory_inclusions_check: [],
            exclusions_check: [],
            legal_disclaimers_appended: false,
            copy_id: '',
          },
        ],
      }),
      usage: { prompt_tokens: 5, completion_tokens: 15 },
      model: 'test-model',
    })
    const textHandler = (await import('./generate/text.js')).default
    const res = createMockRes()
    await textHandler(
      req({
        headers: { authorization: 'Bearer fake' },
        body: {
          type: 'copy',
          campaign_id: '550e8400-e29b-41d4-a716-446655440000',
          prompt: 'You are the copy system prompt',
          use_prompt_as_system: true,
        },
      }),
      res
    )
    expect(res._status).toBe(200)
    const insertArg = mockInsert.mock.calls[0][0] as Record<string, unknown>
    expect(insertArg.type).toBe('copy')
    expect(insertArg.copy_prompt_revision).toBe('test-copy-rev')
  })
})

describe('POST /api/generate/image (handler)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ user: { id: 'user-1' }, error: null })
  })

  it('returns 401 without a valid user', async () => {
    mockGetUser.mockResolvedValueOnce({ user: null, error: 'Unauthorized' })
    const imageHandler = (await import('./generate/image.js')).default
    const res = createMockRes()
    await imageHandler(
      req({
        headers: {},
        body: { prompt: 'A nice ad', campaign_id: 'c1' },
      }),
      res
    )
    expect(res._status).toBe(401)
  })

  it('returns 400 when prompt or campaign_id is missing', async () => {
    const imageHandler = (await import('./generate/image.js')).default
    const res = createMockRes()
    await imageHandler(
      req({
        headers: { authorization: 'Bearer x' },
        body: { prompt: '', campaign_id: '' },
      }),
      res
    )
    expect(res._status).toBe(400)
    expect(String((res._json as { error?: string }).error)).toMatch(/missing required/i)
  })
})
