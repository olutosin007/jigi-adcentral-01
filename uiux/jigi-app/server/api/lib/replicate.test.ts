import { describe, expect, it, vi } from 'vitest'
import { predictionTarget, replicateOutputUrls, runReplicatePrediction } from './replicate.js'

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
