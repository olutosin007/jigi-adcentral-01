import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./env.js', () => ({
  getServerEnv: (key: string) => (key === 'GOOGLE_AI_API_KEY' ? 'g-key' : undefined),
}))

import {
  buildGeminiImageRequest,
  extractGeminiImage,
  generateImageWithGemini,
} from './google-gemini-image.js'

describe('buildGeminiImageRequest', () => {
  it('requests IMAGE output with aspect ratio and size', () => {
    const body = buildGeminiImageRequest({
      prompt: 'A can on a beach',
      model: 'gemini-nano-banana-2.1',
      aspectRatio: '4:5',
      resolution: '2K',
    })
    expect(body).toEqual({
      contents: [{ role: 'user', parts: [{ text: 'A can on a beach' }] }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '4:5', imageSize: '2K' },
      },
    })
  })

  it('forces 1K for Flash Lite Image', () => {
    const body = buildGeminiImageRequest({
      prompt: 'x',
      model: 'gemini-3.1-flash-lite-image',
      aspectRatio: '1:1',
      resolution: '2K',
    })
    expect(body.generationConfig.imageConfig.imageSize).toBe('1K')
  })
})

describe('extractGeminiImage', () => {
  it('reads camelCase and snake_case inline data, skipping text parts', () => {
    expect(
      extractGeminiImage({
        candidates: [{ content: { parts: [{ text: 'hi' }, { inlineData: { mimeType: 'image/jpeg', data: 'AAA' } }] } }],
      })
    ).toEqual({ base64: 'AAA', mimeType: 'image/jpeg' })
    expect(
      extractGeminiImage({ candidates: [{ content: { parts: [{ inline_data: { data: 'BBB' } }] } }] })
    ).toEqual({ base64: 'BBB', mimeType: 'image/png' })
  })

  it('returns null when no image part exists', () => {
    expect(extractGeminiImage({ candidates: [] })).toBeNull()
    expect(extractGeminiImage(null)).toBeNull()
  })
})

describe('generateImageWithGemini', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('posts to generateContent with the API key header and decodes the image', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from('png!').toString('base64') } }] } }],
        }),
        { status: 200 }
      )
    )
    const result = await generateImageWithGemini({
      prompt: 'p',
      model: 'gemini-nano-banana-2.1',
      aspectRatio: '1:1',
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-nano-banana-2.1:generateContent'
    )
    expect(init.headers['x-goog-api-key']).toBe('g-key')
    expect(Buffer.from(result.buffer).toString()).toBe('png!')
    expect(result.contentType).toBe('image/png')
  })

  it('throws with status and body on HTTP error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('quota', { status: 429 }))
    await expect(
      generateImageWithGemini({ prompt: 'p', model: 'gemini-nano-banana-2.1', aspectRatio: '1:1' })
    ).rejects.toThrow(/429 - quota/)
  })

  it('throws a clear error when the response has no image (blocked prompt)', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [] }), { status: 200 }))
    await expect(
      generateImageWithGemini({ prompt: 'p', model: 'gemini-nano-banana-2.1', aspectRatio: '1:1' })
    ).rejects.toThrow(/no image/)
  })
})
