import { beforeEach, describe, expect, it, vi } from 'vitest'

const env: Record<string, string | undefined> = {}
vi.mock('./env.js', () => ({
  getServerEnv: (key: string) => env[key],
  getNumberEnv: (_key: string, fallback: number) => fallback,
  getBooleanEnv: (key: string, fallback = false) =>
    env[key] === undefined ? fallback : env[key] === 'true',
}))

import { IMAGE_MODELS } from './image-models.js'
import {
  buildRouteChain,
  isRetryableProviderError,
  resolveRoute,
  summarizeProviderError,
  type ImageTier,
} from './image-routing.js'

const ALL_CREDS = {
  GOOGLE_AI_API_KEY: 'g',
  KLING_API_KEY: 'k',
  REPLICATE_API_TOKEN: 'r',
  AZURE_FOUNDRY_FLUX_ENDPOINT: 'https://foundry',
  AZURE_FOUNDRY_FLUX_API_KEY: 'f',
  AZURE_OPENAI_ENDPOINT: 'https://azure',
  AZURE_OPENAI_API_KEY: 'a',
  IMAGE_ROUTING_ENABLE_PAID_FALLBACK: 'true',
}

function setEnv(values: Record<string, string>) {
  for (const key of Object.keys(env)) delete env[key]
  Object.assign(env, values)
}

const chainIds = (tier: ImageTier) => buildRouteChain(tier).map((c) => `${c.provider}:${c.model}`)

beforeEach(() => setEnv({}))

describe('buildRouteChain — lineup contract (README "Model lineup")', () => {
  it('draft: Kling 2.1 → Nano Banana Lite → Foundry → Replicate schnell → Azure', () => {
    setEnv(ALL_CREDS)
    expect(chainIds('draft')).toEqual([
      'kling:kling-v2-1',
      'google_gemini:gemini-3.1-flash-lite-image',
      'azure_foundry:flux-2-flex',
      'replicate:black-forest-labs/flux-schnell',
      'azure_openai:gpt-image-1-mini',
    ])
  })

  it('refine: Kling 3.0 → Nano Banana 2.1 → Foundry → Replicate Seedream 4 → Azure', () => {
    setEnv(ALL_CREDS)
    expect(chainIds('refine')).toEqual([
      'kling:kling-v3',
      'google_gemini:gemini-nano-banana-2.1',
      'azure_foundry:flux-2-flex',
      'replicate:bytedance/seedream-4',
      'azure_openai:gpt-image-1-mini',
    ])
  })

  it('final: Nano Banana 2.1 @2K leads, Kling 3.0 @2K second', () => {
    setEnv(ALL_CREDS)
    const chain = buildRouteChain('final')
    expect(chain.slice(0, 2).map((c) => [c.provider, c.model, c.resolution])).toEqual([
      ['google_gemini', 'gemini-nano-banana-2.1', '2K'],
      ['kling', 'kling-v3', '2K'],
    ])
  })

  it('Replicate-only account: Schnell drafts, Seedream refines, Nano Banana finals', () => {
    setEnv({ REPLICATE_API_TOKEN: 'r' })
    expect(chainIds('draft')).toEqual(['replicate:black-forest-labs/flux-schnell'])
    expect(chainIds('refine')).toEqual(['replicate:bytedance/seedream-4'])
    expect(chainIds('final')).toEqual(['replicate:google/nano-banana'])
    expect(buildRouteChain('refine')[0].resolution).toBe('2K')
    expect(buildRouteChain('final')[0].resolution).toBe('1K')
  })

  it('every routed model (except azure deployments) has a priced registry entry', () => {
    setEnv(ALL_CREDS)
    for (const tier of ['draft', 'refine', 'final'] as const) {
      for (const candidate of buildRouteChain(tier)) {
        expect(IMAGE_MODELS[candidate.model], `${tier} ${candidate.model}`).toBeDefined()
      }
    }
  })

  it('never routes to google_imagen', () => {
    setEnv(ALL_CREDS)
    for (const tier of ['draft', 'refine', 'final'] as const) {
      expect(buildRouteChain(tier).some((c) => c.provider === 'google_imagen')).toBe(false)
    }
  })
})

describe('buildRouteChain — credentials and overrides', () => {
  it('Google key only: every tier routes to Nano Banana', () => {
    setEnv({ GOOGLE_AI_API_KEY: 'g' })
    expect(chainIds('draft')).toEqual(['google_gemini:gemini-3.1-flash-lite-image'])
    expect(chainIds('refine')).toEqual(['google_gemini:gemini-nano-banana-2.1'])
    expect(chainIds('final')).toEqual(['google_gemini:gemini-nano-banana-2.1'])
  })

  it('Kling via access/secret pair counts as configured', () => {
    setEnv({ KLING_ACCESS_KEY: 'ak', KLING_SECRET_KEY: 'sk' })
    expect(chainIds('refine')).toEqual(['kling:kling-v3'])
  })

  it('ignores retired legacy GOOGLE_IMAGEN_MODEL_* overrides', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    setEnv({ GOOGLE_AI_API_KEY: 'g', GOOGLE_IMAGEN_MODEL_FINAL: 'imagen-4.0-ultra-generate-001' })
    expect(chainIds('final')).toEqual(['google_gemini:gemini-nano-banana-2.1'])
  })

  it('honours live GOOGLE_IMAGE_MODEL_* over legacy keys', () => {
    setEnv({
      GOOGLE_AI_API_KEY: 'g',
      GOOGLE_IMAGE_MODEL_DRAFT: 'gemini-nano-banana-2.1',
      GOOGLE_IMAGEN_MODEL_DRAFT: 'imagen-4.0-fast-generate-001',
    })
    expect(chainIds('draft')).toEqual(['google_gemini:gemini-nano-banana-2.1'])
  })

  it('Azure paid fallback only when enabled', () => {
    setEnv({ AZURE_OPENAI_ENDPOINT: 'https://azure', AZURE_OPENAI_API_KEY: 'a' })
    expect(chainIds('draft')).toEqual([])
  })

  it('azure_only mode prefers Foundry and skips Kling/Google', () => {
    setEnv({ ...ALL_CREDS, IMAGE_ROUTING_PROVIDER_MODE: 'azure_only' })
    expect(chainIds('refine')).toEqual(['azure_foundry:flux-2-flex'])
  })
})

describe('resolveRoute', () => {
  it('carries resolution and skips primary lanes when exhausted', () => {
    setEnv(ALL_CREDS)
    const chain = buildRouteChain('final')
    const route = resolveRoute(chain, { tier: 'final', attempt: 0 })
    expect(route).toMatchObject({ provider: 'google_gemini', resolution: '2K', route_attempt: 1 })

    const exhausted = resolveRoute(chain, { tier: 'final', attempt: 0, quotaExhaustedFreeLane: true })
    expect(exhausted).toMatchObject({ provider: 'azure_openai', routing_reason: 'quota_exhausted' })
  })
})

const GEMINI_FREE_TIER_429 =
  'Google Gemini image API error: 429 - { "error": { "code": 429, "message": "You exceeded your current quota, please check your plan and billing details. * Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-3.1-flash-lite-image", "status": "RESOURCE_EXHAUSTED" } }'

describe('provider error handling', () => {
  it('does not retry hard quota errors, but still retries transient ones', () => {
    expect(isRetryableProviderError(new Error(GEMINI_FREE_TIER_429))).toBe(false)
    expect(isRetryableProviderError(new Error('503 temporarily unavailable'))).toBe(true)
    expect(isRetryableProviderError(new Error('429 rate limit, retry in 2s'))).toBe(true)
  })

  it('summarises a Gemini free-tier quota error into an actionable line', () => {
    const summary = summarizeProviderError(GEMINI_FREE_TIER_429)
    expect(summary).toMatch(/free tier.*Enable billing/)
    expect(summary).not.toContain('{')
  })

  it('summarises rate limits and credential failures', () => {
    expect(summarizeProviderError('429 Too Many Requests')).toBe('rate limited — try again shortly.')
    expect(summarizeProviderError('Kling API 401 Unauthorized')).toBe('credentials rejected — check the API key.')
  })

  it('strips trailing JSON and truncates long messages', () => {
    expect(summarizeProviderError('Upstream error 500 - {"detail":"boom"}')).toBe('Upstream error 500')
    const long = summarizeProviderError('x'.repeat(400))
    expect(long.length).toBeLessThanOrEqual(160)
    expect(long.endsWith('…')).toBe(true)
  })
})
