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
  mockGenerateGemini,
  mockBuildRouteChain,
  mockResolveRoute,
  mockReplicateGenerate,
  mockAzureGenerate,
} = vi.hoisted(() => ({
  mockReplicateGenerate: vi.fn(),
  mockAzureGenerate: vi.fn(),
  mockGetUser: vi.fn(),
  mockInsert: vi.fn(),
  mockCreateChatCompletion: vi.fn(),
  mockGenerateGemini: vi.fn(),
  mockBuildRouteChain: vi.fn(() => [] as unknown[]),
  mockResolveRoute: vi.fn(),
}))

/** Chainable Supabase query stub: every builder method returns itself; awaiting resolves a result. */
function queryBuilder(table: string) {
  const result = { data: table === 'creative_assets' ? { id: 'asset-1' } : null, error: null, count: 0 }
  const builder: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
  for (const method of ['select', 'eq', 'is', 'gte', 'update', 'single', 'maybeSingle', 'limit', 'order']) {
    builder[method] = () => builder
  }
  builder.insert = (row: unknown) => {
    mockInsert(row, table)
    return builder
  }
  return builder
}

vi.mock('./lib/supabase.js', () => ({
  getAuthenticatedUser: (auth?: string) => mockGetUser(auth),
  getSupabaseAdmin: () => ({
    from: (table: string) => queryBuilder(table),
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
  generateImageWithReplicate: (...args: unknown[]) => mockReplicateGenerate(...args),
  replicateImageContentType: () => 'image/webp',
}))

vi.mock('./lib/fal.js', () => ({
  generateImageWithFal: vi.fn(),
  falImageContentType: () => 'image/png',
  hasFalConfig: () => false,
}))

vi.mock('./lib/google-gemini-image.js', () => ({
  generateImageWithGemini: (args: unknown) => mockGenerateGemini(args),
}))

vi.mock('./lib/kling-image.js', () => ({
  generateImageWithKling: vi.fn(),
}))

vi.mock('./lib/azure-image.js', () => ({
  generateImageWithAzure: (...args: unknown[]) => mockAzureGenerate(...args),
}))

vi.mock('./lib/azure-foundry-flux.js', () => ({
  generateImageWithFoundryFlux: vi.fn(),
}))

vi.mock('./lib/image-routing.js', async (importOriginal) => ({
  summarizeProviderError: (await importOriginal<typeof import('./lib/image-routing.js')>()).summarizeProviderError,
  buildRouteChain: (tier: string) => mockBuildRouteChain(tier),
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
  resolveRoute: (...args: unknown[]) => mockResolveRoute(...args),
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

  it('routes to Nano Banana and stores cost, resolution and aspect ratio on the asset', async () => {
    const route = {
      provider: 'google_gemini',
      model: 'gemini-nano-banana-2.1',
      costBucket: 'free',
      resolution: '2K',
      image_provider: 'google_gemini',
      image_tier: 'final',
      routing_reason: 'default',
      cost_bucket: 'free',
      provider_model: 'gemini-nano-banana-2.1',
      route_attempt: 1,
    }
    mockBuildRouteChain.mockReturnValueOnce([route])
    mockResolveRoute.mockReturnValueOnce(route)
    mockGenerateGemini.mockResolvedValueOnce({
      buffer: new ArrayBuffer(4),
      contentType: 'image/png',
      model: 'gemini-nano-banana-2.1',
    })

    const imageHandler = (await import('./generate/image.js')).default
    const res = createMockRes()
    await imageHandler(
      req({
        headers: { authorization: 'Bearer x' },
        body: { prompt: 'Hero shot', campaign_id: 'c1', image_tier: 'final', aspect_ratio: '4:5' },
      }),
      res
    )

    expect(res._status).toBe(200)
    expect(mockGenerateGemini).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-nano-banana-2.1', aspectRatio: '4:5', resolution: '2K' })
    )
    const assetRow = mockInsert.mock.calls.find(([, table]) => table === 'creative_assets')?.[0] as {
      content: Record<string, unknown>
    }
    expect(assetRow.content).toMatchObject({
      image_provider: 'google_gemini',
      image_resolution: '2K',
      aspect_ratio: '4:5',
      estimated_cost_usd: 0.0504,
    })
    expect((res._json as { estimated_cost_usd?: number }).estimated_cost_usd).toBe(0.0504)
  })

  it('falls back to 1:1 for an unsupported aspect ratio', async () => {
    const route = {
      provider: 'google_gemini',
      model: 'gemini-3.1-flash-lite-image',
      costBucket: 'free',
      resolution: '1K',
      image_provider: 'google_gemini',
      image_tier: 'draft',
      routing_reason: 'default',
      cost_bucket: 'free',
      provider_model: 'gemini-3.1-flash-lite-image',
      route_attempt: 1,
    }
    mockBuildRouteChain.mockReturnValueOnce([route])
    mockResolveRoute.mockReturnValueOnce(route)
    mockGenerateGemini.mockResolvedValueOnce({ buffer: new ArrayBuffer(1), contentType: 'image/png', model: route.model })

    const imageHandler = (await import('./generate/image.js')).default
    const res = createMockRes()
    await imageHandler(
      req({ headers: { authorization: 'Bearer x' }, body: { prompt: 'p', campaign_id: 'c1', aspect_ratio: '7:3' } }),
      res
    )
    expect(res._status).toBe(200)
    expect(mockGenerateGemini).toHaveBeenCalledWith(expect.objectContaining({ aspectRatio: '1:1' }))
  })

  it('one provider quota failure skips only that lane (no lane-wide lockout to paid fallback)', async () => {
    const actual = await vi.importActual<typeof import('./lib/image-routing.js')>('./lib/image-routing.js')
    const chain = [
      { provider: 'google_gemini', model: 'gemini-3.1-flash-lite-image', costBucket: 'free', resolution: '1K' },
      { provider: 'replicate', model: 'black-forest-labs/flux-schnell', costBucket: 'free', resolution: '1K' },
      { provider: 'azure_openai', model: 'gpt-image-1.5', costBucket: 'paid_fallback', resolution: '1K' },
    ]
    mockBuildRouteChain.mockReturnValueOnce(chain)
    mockResolveRoute.mockImplementation((...args: unknown[]) =>
      (actual.resolveRoute as (...a: unknown[]) => unknown)(...args)
    )
    mockGenerateGemini.mockRejectedValueOnce(
      new Error(
        'Google Gemini image API error: 429 - { "error": { "message": "You exceeded your current quota. Quota exceeded for metric: generate_content_free_tier_requests, limit: 0", "status": "RESOURCE_EXHAUSTED" } }'
      )
    )
    mockReplicateGenerate.mockResolvedValueOnce(['https://replicate.test/out.webp'])
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/webp' } })
    )

    const imageHandler = (await import('./generate/image.js')).default
    const res = createMockRes()
    await imageHandler(
      req({ headers: { authorization: 'Bearer x' }, body: { prompt: 'p', campaign_id: 'c1', image_tier: 'draft' } }),
      res
    )

    expect(res._status).toBe(200)
    expect(mockGenerateGemini).toHaveBeenCalledTimes(1)
    expect(mockReplicateGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'black-forest-labs/flux-schnell', tier: 'draft', aspectRatio: '1:1' })
    )
    expect(mockAzureGenerate).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
    mockResolveRoute.mockReset()
  })

  it('returns one readable line per failed lane instead of raw provider JSON', async () => {
    const actual = await vi.importActual<typeof import('./lib/image-routing.js')>('./lib/image-routing.js')
    const chain = [
      { provider: 'google_gemini', model: 'gemini-3.1-flash-lite-image', costBucket: 'free', resolution: '1K' },
      { provider: 'replicate', model: 'black-forest-labs/flux-schnell', costBucket: 'free', resolution: '1K' },
    ]
    mockBuildRouteChain.mockReturnValueOnce(chain)
    mockResolveRoute.mockImplementation((...args: unknown[]) =>
      (actual.resolveRoute as (...a: unknown[]) => unknown)(...args)
    )
    mockGenerateGemini.mockRejectedValueOnce(
      new Error('Google Gemini image API error: 429 - { "error": { "message": "You exceeded your current quota ... generate_content_free_tier_requests, limit: 0" } }')
    )
    mockReplicateGenerate.mockRejectedValueOnce(new Error('Replicate black-forest-labs/flux-schnell failed: NSFW content detected'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const imageHandler = (await import('./generate/image.js')).default
    const res = createMockRes()
    await imageHandler(
      req({ headers: { authorization: 'Bearer x' }, body: { prompt: 'p', campaign_id: 'c1', image_tier: 'draft' } }),
      res
    )

    const error = String((res._json as { error?: string }).error)
    expect(res._status).toBe(500)
    expect(error).toContain('google_gemini: quota exhausted — this API key is on the free tier')
    expect(error).toContain('replicate: Replicate black-forest-labs/flux-schnell failed: NSFW content detected')
    expect(error).not.toContain('{')
    errorSpy.mockRestore()
    mockResolveRoute.mockReset()
  })
})
