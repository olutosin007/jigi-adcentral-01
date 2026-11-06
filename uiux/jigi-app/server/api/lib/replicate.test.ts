import { describe, expect, it, vi } from 'vitest'
import {
  buildReplicateImageInput,
  predictionTarget,
  replicateImageContentType,
  replicateImageFamily,
  replicateOutputUrls,
  runReplicatePrediction,
} from './replicate.js'

vi.mock('./env.js', () => ({ getServerEnv: () => 'test-token' }))

function fakeClient(statuses: Array<{ status: string; output?: unknown; error?: unknown }>) {
  let i = 0
  return {
    predictions: {
      create: vi.fn(async () => ({ id: 'p1', ...statuses[0] })),
      get: vi.fn(async () => ({ id: 'p1', ...statuses[Math.min(++i, statuses.length - 1)] })),
    },
    models: { get: vi.fn(async () => ({ latest_version: { id: 'v123' } })) },
  }
}

describe('runReplicatePrediction', () => {
  it('polls until succeeded and returns output (regression: run() resolved null)', async () => {
    const client = fakeClient([{ status: 'starting' }, { status: 'processing' }, { status: 'succeeded', output: ['https://x/1.webp'] }])
    const output = await runReplicatePrediction('black-forest-labs/flux-schnell', { prompt: 'p' }, { client, intervalMs: 1 })
    expect(output).toEqual(['https://x/1.webp'])
    expect(client.predictions.create).toHaveBeenCalledWith({ model: 'black-forest-labs/flux-schnell', input: { prompt: 'p' } })
    expect(client.predictions.get).toHaveBeenCalledTimes(2)
  })

  it('throws with the provider reason when the prediction fails', async () => {
    const client = fakeClient([{ status: 'failed', error: 'NSFW content detected' }])
    await expect(
      runReplicatePrediction('owner/model', {}, { client, intervalMs: 1 })
    ).rejects.toThrow('Replicate owner/model failed: NSFW content detected')
  })

  it('gives up at the deadline without the word "timeout" (router moves to the next lane, no retry)', async () => {
    const client = fakeClient([{ status: 'processing' }])
    const error = await runReplicatePrediction('owner/model', {}, { client, intervalMs: 1, timeoutMs: 5 }).catch((e) => e)
    expect(String(error.message)).toMatch(/did not finish within 5ms/)
    expect(String(error.message)).not.toMatch(/timeout/i)
  })

  it('resolves the latest version for community models the model endpoint rejects', async () => {
    const client = fakeClient([{ status: 'succeeded', output: 'https://x/up.png' }])
    client.predictions.create
      .mockRejectedValueOnce(Object.assign(new Error('Request failed: 404 Not Found'), { response: { status: 404 } }))
    const output = await runReplicatePrediction('nightmareai/real-esrgan', { scale: 2 }, { client, intervalMs: 1 })
    expect(output).toBe('https://x/up.png')
    expect(client.models.get).toHaveBeenCalledWith('nightmareai', 'real-esrgan')
    expect(client.predictions.create).toHaveBeenLastCalledWith({ version: 'v123', input: { scale: 2 } })
  })

  it('does not swallow non-404 create errors', async () => {
    const client = fakeClient([{ status: 'succeeded' }])
    client.predictions.create.mockRejectedValueOnce(new Error('402 Payment Required'))
    await expect(runReplicatePrediction('owner/model', {}, { client })).rejects.toThrow('402')
    expect(client.models.get).not.toHaveBeenCalled()
  })
})

describe('predictionTarget', () => {
  it('splits pinned versions', () => {
    expect(predictionTarget('owner/name')).toEqual({ model: 'owner/name' })
    expect(predictionTarget('owner/name:abc')).toEqual({ version: 'abc' })
  })
})

describe('replicateOutputUrls', () => {
  it('normalises strings, arrays, FileOutput-like objects and null', () => {
    expect(replicateOutputUrls('https://a')).toEqual(['https://a'])
    expect(replicateOutputUrls(['https://a', 'https://b'])).toEqual(['https://a', 'https://b'])
    expect(replicateOutputUrls([{ url: () => new URL('https://c/x.png') }])).toEqual(['https://c/x.png'])
    expect(replicateOutputUrls(null)).toEqual([])
    expect(replicateOutputUrls(undefined)).toEqual([])
  })
})

/** Enums copied from each model's live OpenAPI schema (Oct 2026). Update both if a model changes. */
const SCHEMA_ASPECTS = {
  nano_banana: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'],
  seedream: ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'],
  flux: ['1:1', '16:9', '21:9', '3:2', '2:3', '4:5', '5:4', '3:4', '4:3', '9:16', '9:21'],
} as const
const APP_ASPECTS = ['1:1', '4:5', '16:9', '9:16', '4:3', '3:4'] as const
const MODELS = {
  nano_banana: 'google/nano-banana',
  seedream: 'bytedance/seedream-4',
  flux: 'black-forest-labs/flux-schnell',
} as const

describe('buildReplicateImageInput', () => {
  it('drift: every app aspect maps to a value each model schema accepts', () => {
    for (const [family, model] of Object.entries(MODELS) as [keyof typeof MODELS, string][]) {
      for (const aspectRatio of APP_ASPECTS) {
        const input = buildReplicateImageInput({ model, prompt: 'p', aspectRatio, tier: 'draft' })
        expect(SCHEMA_ASPECTS[family], `${model} ${aspectRatio}`).toContain(input.aspect_ratio)
      }
    }
  })

  it('nano banana: explicit aspect (default would match a missing input image) and a supported format', () => {
    expect(buildReplicateImageInput({ model: MODELS.nano_banana, prompt: 'p', aspectRatio: '4:5', tier: 'final' })).toEqual({
      prompt: 'p',
      aspect_ratio: '4:5',
      output_format: 'png',
    })
  })

  it('seedream: 4:5 → 3:4, 2K, single image, prompt not rewritten', () => {
    expect(buildReplicateImageInput({ model: MODELS.seedream, prompt: 'p', aspectRatio: '4:5', tier: 'refine' })).toEqual({
      prompt: 'p',
      aspect_ratio: '3:4',
      size: '2K',
      max_images: 1,
      enhance_prompt: false,
    })
  })

  it('flux: native aspect, quality by tier', () => {
    const input = buildReplicateImageInput({ model: MODELS.flux, prompt: 'p', aspectRatio: '4:5', tier: 'final' })
    expect(input).toMatchObject({ aspect_ratio: '4:5', num_outputs: 1, output_format: 'webp', output_quality: 95 })
  })

  it('classifies model families, including pinned versions', () => {
    expect(replicateImageFamily('google/nano-banana-pro')).toBe('nano_banana')
    expect(replicateImageFamily('bytedance/seedream-4.5')).toBe('seedream')
    expect(replicateImageFamily('black-forest-labs/flux-dev:abc')).toBe('flux')
  })
})

describe('replicateImageContentType', () => {
  it('prefers an image/* header, else the URL extension, else png', () => {
    expect(replicateImageContentType('image/webp; charset=binary', 'https://x/a.png')).toBe('image/webp')
    expect(replicateImageContentType('application/octet-stream', 'https://x/a.jpg?sig=1')).toBe('image/jpeg')
    expect(replicateImageContentType(null, 'https://x/a')).toBe('image/png')
  })
})
