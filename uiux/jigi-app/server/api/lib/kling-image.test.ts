import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const env: Record<string, string | undefined> = {}
vi.mock('./env.js', () => ({
  getServerEnv: (key: string) => env[key],
  getNumberEnv: (_key: string, fallback: number) => fallback,
}))

import {
  buildKlingImageRequest,
  generateImageWithKling,
  getKlingAuthHeader,
  hasKlingConfig,
  signKlingJwt,
} from './kling-image.js'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

beforeEach(() => {
  for (const key of Object.keys(env)) delete env[key]
})

describe('Kling auth', () => {
  it('prefers KLING_API_KEY', () => {
    env.KLING_API_KEY = 'k-123'
    env.KLING_ACCESS_KEY = 'ak'
    env.KLING_SECRET_KEY = 'sk'
    expect(getKlingAuthHeader()).toBe('Bearer k-123')
    expect(hasKlingConfig()).toBe(true)
  })

  it('signs a valid HS256 JWT from access/secret keys', () => {
    const token = signKlingJwt('ak', 'sk', 1_000_000)
    const [header, payload, signature] = token.split('.')
    expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(JSON.parse(Buffer.from(payload, 'base64url').toString())).toEqual({
      iss: 'ak',
      exp: 1_001_800,
      nbf: 999_995,
    })
    const expected = createHmac('sha256', 'sk').update(`${header}.${payload}`).digest('base64url')
    expect(signature).toBe(expected)
  })

  it('reports missing config and throws a helpful error', () => {
    env.KLING_ACCESS_KEY = 'ak'
    expect(hasKlingConfig()).toBe(false)
    expect(() => getKlingAuthHeader()).toThrow(/KLING_API_KEY/)
  })
})

describe('buildKlingImageRequest', () => {
  it('maps unsupported aspect ratios to the nearest supported one', () => {
    expect(buildKlingImageRequest({ prompt: 'p', model: 'kling-v3', aspectRatio: '4:5' }).aspect_ratio).toBe('3:4')
    expect(buildKlingImageRequest({ prompt: 'p', model: 'kling-v3', aspectRatio: '9:16' }).aspect_ratio).toBe('9:16')
    expect(buildKlingImageRequest({ prompt: 'p', model: 'kling-v3', aspectRatio: '7:3' }).aspect_ratio).toBe('1:1')
  })

  it('requests 2k only for models that support it', () => {
    expect(buildKlingImageRequest({ prompt: 'p', model: 'kling-v3', aspectRatio: '1:1', resolution: '2K' })).toMatchObject({ resolution: '2k' })
    expect(buildKlingImageRequest({ prompt: 'p', model: 'kling-v2-1', aspectRatio: '1:1', resolution: '2K' })).not.toHaveProperty('resolution')
  })

  it('truncates prompts to the 2500-char API limit', () => {
    const body = buildKlingImageRequest({ prompt: 'x'.repeat(3000), model: 'kling-v3', aspectRatio: '1:1' })
    expect(body.prompt).toHaveLength(2500)
    expect(body).toMatchObject({ model_name: 'kling-v3', n: 1 })
  })
})

describe('generateImageWithKling', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    env.KLING_API_KEY = 'k-123'
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('creates a task, polls until succeed, and downloads the image', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ code: 0, data: { task_id: 't1', task_status: 'submitted' } }))
      .mockResolvedValueOnce(json({ code: 0, data: { task_id: 't1', task_status: 'processing' } }))
      .mockResolvedValueOnce(
        json({ code: 0, data: { task_id: 't1', task_status: 'succeed', task_result: { images: [{ url: 'https://cdn/x.png' }] } } })
      )
      .mockResolvedValueOnce(new Response('img', { status: 200, headers: { 'content-type': 'image/png' } }))

    const result = await generateImageWithKling({
      prompt: 'p',
      model: 'kling-v3',
      aspectRatio: '1:1',
      pollIntervalMs: 0,
      timeoutMs: 1000,
    })

    const [createUrl, createInit] = fetchMock.mock.calls[0]
    expect(createUrl).toBe('https://api-singapore.klingai.com/v1/images/generations')
    expect(createInit.headers.Authorization).toBe('Bearer k-123')
    expect(fetchMock.mock.calls[1][0]).toBe('https://api-singapore.klingai.com/v1/images/generations/t1')
    expect(fetchMock.mock.calls[3][0]).toBe('https://cdn/x.png')
    expect(Buffer.from(result.buffer).toString()).toBe('img')
    expect(result.model).toBe('kling-v3')
  })

  it('surfaces the task failure reason', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ code: 0, data: { task_id: 't2' } }))
      .mockResolvedValueOnce(json({ code: 0, data: { task_status: 'failed', task_status_msg: 'risk control' } }))
    await expect(
      generateImageWithKling({ prompt: 'p', model: 'kling-v3', aspectRatio: '1:1', pollIntervalMs: 0, timeoutMs: 1000 })
    ).rejects.toThrow(/risk control/)
  })

  it('throws on non-zero envelope codes', async () => {
    fetchMock.mockResolvedValueOnce(json({ code: 1102, message: 'balance not enough' }))
    await expect(
      generateImageWithKling({ prompt: 'p', model: 'kling-v3', aspectRatio: '1:1', pollIntervalMs: 0 })
    ).rejects.toThrow(/1102 - balance not enough/)
  })

  it('gives up after the timeout with a non-retryable message', async () => {
    fetchMock.mockImplementation(async () => json({ code: 0, data: { task_id: 't3', task_status: 'processing' } }))
    const error = await generateImageWithKling({
      prompt: 'p',
      model: 'kling-v3',
      aspectRatio: '1:1',
      pollIntervalMs: 5,
      timeoutMs: 20,
    }).catch((e: Error) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toMatch(/did not finish within 20ms/)
    expect((error as Error).message.toLowerCase()).not.toContain('timeout')
  })
})
