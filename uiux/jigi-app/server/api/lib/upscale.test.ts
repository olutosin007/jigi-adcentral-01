import { describe, expect, it } from 'vitest'
import {
  buildUpscaledAssetInsert,
  checkUpscalable,
  replicateOutputToUrl,
  validateUpscaleRequest,
  type SourceImageAsset,
} from './upscale.js'

const ID = '550e8400-e29b-41d4-a716-446655440000'

const source: SourceImageAsset = {
  id: ID,
  campaign_id: 'camp-1',
  type: 'image',
  version: 2,
  created_by: 'creator-1',
  content: {
    url: 'https://cdn/original.png',
    prompt_used: 'Hero can',
    image_tier: 'refine',
    image_provider: 'kling',
    estimated_cost_usd: 0.028,
  },
}

describe('validateUpscaleRequest', () => {
  it.each([
    [undefined, /UUID/],
    [{}, /UUID/],
    [{ asset_id: 'not-a-uuid' }, /UUID/],
    [{ asset_id: ID, scale: 3 }, /2 or 4/],
    [{ asset_id: ID, scale: '2' }, /2 or 4/],
  ])('rejects %j', (body, message) => {
    const result = validateUpscaleRequest(body as never)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(message)
  })

  it('defaults scale to 2', () => {
    expect(validateUpscaleRequest({ asset_id: ID })).toEqual({ ok: true, assetId: ID, scale: 2 })
    expect(validateUpscaleRequest({ asset_id: ID, scale: 4 })).toEqual({ ok: true, assetId: ID, scale: 4 })
  })
})

describe('checkUpscalable', () => {
  it('accepts an image with a URL', () => {
    expect(checkUpscalable(source)).toBeNull()
  })

  it('rejects non-images, missing URLs and already-upscaled versions', () => {
    expect(checkUpscalable({ ...source, type: 'copy' })).toMatch(/Only image/)
    expect(checkUpscalable({ ...source, content: {} })).toMatch(/no URL/)
    expect(checkUpscalable({ ...source, content: { url: 'x', upscaled_from: 'y' } })).toMatch(/already/)
  })
})

describe('buildUpscaledAssetInsert', () => {
  const row = buildUpscaledAssetInsert({
    source,
    userId: 'user-9',
    url: 'https://cdn/up.png',
    scale: 2,
    model: 'nightmareai/real-esrgan',
  })

  it('creates a new draft version linked to the source', () => {
    expect(row).toMatchObject({
      campaign_id: 'camp-1',
      created_by: 'user-9',
      type: 'image',
      status: 'draft',
      parent_asset_id: ID,
      version: 3,
    })
  })

  it('keeps prompt lineage and records upscale metadata and cost', () => {
    expect(row.content).toMatchObject({
      url: 'https://cdn/up.png',
      prompt_used: 'Hero can',
      image_provider: 'kling',
      upscaled_from: ID,
      upscale_scale: 2,
      upscale_model: 'nightmareai/real-esrgan',
      image_tier: 'final',
      image_resolution: '2K',
      estimated_cost_usd: 0.002,
    })
  })

  it('never copies review state from the source', () => {
    for (const key of ['review_notes', 'validation_scores', 'submission_note', 'id']) {
      expect(row).not.toHaveProperty(key)
    }
  })

  it('treats a null source version as v1', () => {
    expect(buildUpscaledAssetInsert({ source: { ...source, version: null }, userId: 'u', url: 'x', scale: 4, model: 'm' }).version).toBe(2)
  })
})

describe('replicateOutputToUrl', () => {
  it('handles strings, arrays and FileOutput-like objects', () => {
    expect(replicateOutputToUrl('https://a')).toBe('https://a')
    expect(replicateOutputToUrl(['https://b'])).toBe('https://b')
    expect(replicateOutputToUrl({ url: () => new URL('https://c/x.png') })).toBe('https://c/x.png')
    expect(replicateOutputToUrl([])).toBeNull()
    expect(replicateOutputToUrl(null)).toBeNull()
  })
})
