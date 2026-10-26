import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./env.js', () => ({
  getServerEnv: (key: string, _required = true) => (key === 'FAL_KEY' ? 'test-key' : undefined),
}))

import {
  buildFalImageInput,
  falImageContentType,
  falImageFamily,
  falOutputUrls,
  fluxImageSize,
  type FalImageAspect,
} from './fal.js'

const ASPECTS: FalImageAspect[] = ['1:1', '4:5', '16:9', '9:16', '4:3', '3:4']

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fal image input builder', () => {
  it('classifies model families', () => {
    expect(falImageFamily('fal-ai/flux/schnell')).toBe('flux')
    expect(falImageFamily('fal-ai/bytedance/seedream/v4/text-to-image')).toBe('seedream')
    expect(falImageFamily('fal-ai/nano-banana')).toBe('nano_banana')
  })

  it('accepts every app aspect for each family (schema drift guard)', () => {
    for (const aspect of ASPECTS) {
      expect(buildFalImageInput({ model: 'fal-ai/flux/schnell', prompt: 'x', aspectRatio: aspect, tier: 'draft' }).prompt).toBe('x')
      expect(buildFalImageInput({ model: 'fal-ai/bytedance/seedream/v4/text-to-image', prompt: 'x', aspectRatio: aspect, tier: 'refine' }).aspect_ratio).toBeTruthy()
      expect(buildFalImageInput({ model: 'fal-ai/nano-banana', prompt: 'x', aspectRatio: aspect, tier: 'final' }).aspect_ratio).toBe(aspect)
    }
  })

  it('maps Flux aspects to named sizes', () => {
    expect(fluxImageSize('1:1')).toBe('square_hd')
    expect(fluxImageSize('16:9')).toBe('landscape_16_9')
    expect(fluxImageSize('4:5')).toBe('portrait_16_9')
  })

  it('maps Seedream 4:5 to 3:4', () => {
    const input = buildFalImageInput({
      model: 'fal-ai/bytedance/seedream/v4/text-to-image',
      prompt: 'linen',
      aspectRatio: '4:5',
      tier: 'refine',
    })
    expect(input.aspect_ratio).toBe('3:4')
  })
})

describe('fal output helpers', () => {
  it('extracts urls from images[] and image.url', () => {
    expect(falOutputUrls({ images: [{ url: 'https://cdn.example/a.png' }] })).toEqual(['https://cdn.example/a.png'])
    expect(falOutputUrls({ image: { url: 'https://cdn.example/b.jpg' } })).toEqual(['https://cdn.example/b.jpg'])
  })

  it('infers content type from header or extension', () => {
    expect(falImageContentType('image/webp', 'https://x')).toBe('image/webp')
    expect(falImageContentType('application/octet-stream', 'https://x/a.jpg')).toBe('image/jpeg')
    expect(falImageContentType(null, 'https://x/a.png')).toBe('image/png')
  })
})
