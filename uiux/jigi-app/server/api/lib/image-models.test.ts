import { describe, expect, it, vi } from 'vitest'
import {
  IMAGE_MODELS,
  RETIRED_IMAGE_MODELS,
  estimateImageCostUsd,
  findRetiredModelOverrides,
  isModelRetired,
  isModelRetiringWithin,
  pickModel,
} from './image-models.js'
import {
  DEFAULT_GEMINI_MODEL_BY_TIER,
  DEFAULT_KLING_MODEL_BY_TIER,
  DEFAULT_REPLICATE_MODEL_BY_TIER,
} from './image-routing.js'

const ALL_DEFAULTS = [
  ...Object.values(DEFAULT_GEMINI_MODEL_BY_TIER),
  ...Object.values(DEFAULT_KLING_MODEL_BY_TIER),
  ...Object.values(DEFAULT_REPLICATE_MODEL_BY_TIER),
]

describe('image model registry (drift guard)', () => {
  it('no default model is retired or retiring within 30 days (real clock)', () => {
    const atRisk = ALL_DEFAULTS.filter((id) => isModelRetiringWithin(id, 30))
    expect(atRisk).toEqual([])
  })

  it('every default model has a registry entry with a positive 1K price', () => {
    for (const id of ALL_DEFAULTS) {
      expect(IMAGE_MODELS[id], id).toBeDefined()
      expect(IMAGE_MODELS[id].usdPerImage['1K'], id).toBeGreaterThan(0)
    }
  })

  it('registry ids match their keys and are never in the retired list', () => {
    for (const [key, spec] of Object.entries(IMAGE_MODELS)) {
      expect(spec.id).toBe(key)
      expect(RETIRED_IMAGE_MODELS[key]).toBeUndefined()
    }
  })

  it('retired dates are valid ISO dates', () => {
    for (const date of Object.values(RETIRED_IMAGE_MODELS)) {
      expect(Number.isNaN(Date.parse(date))).toBe(false)
    }
  })
})

describe('isModelRetired', () => {
  it('is true on and after the retirement date, false before', () => {
    expect(isModelRetired('imagen-4.0-generate-001', new Date('2026-08-16T23:59:59Z'))).toBe(false)
    expect(isModelRetired('imagen-4.0-generate-001', new Date('2026-08-17T00:00:00Z'))).toBe(true)
    expect(isModelRetired('kling-v3', new Date('2030-01-01'))).toBe(false)
  })
})

describe('pickModel', () => {
  const now = new Date('2026-10-12T12:00:00Z')

  it('uses the fallback when env is empty', () => {
    expect(pickModel({ envKey: 'X', envValue: undefined, fallback: 'kling-v3', now })).toBe('kling-v3')
    expect(pickModel({ envKey: 'X', envValue: '  ', fallback: 'kling-v3', now })).toBe('kling-v3')
  })

  it('honours a live override', () => {
    expect(pickModel({ envKey: 'X', envValue: 'kling-v2-1', fallback: 'kling-v3', now })).toBe('kling-v2-1')
  })

  it('ignores a retired override (stale .env.local) and warns once per key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const args = {
      envKey: 'GOOGLE_IMAGEN_MODEL_DRAFT_TEST',
      envValue: 'imagen-4.0-fast-generate-001',
      fallback: 'gemini-3.1-flash-lite-image',
      now,
    }
    expect(pickModel(args)).toBe('gemini-3.1-flash-lite-image')
    expect(pickModel(args)).toBe('gemini-3.1-flash-lite-image')
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})

describe('findRetiredModelOverrides', () => {
  it('lists only *_MODEL* keys that point at retired models', () => {
    const found = findRetiredModelOverrides(
      {
        GOOGLE_IMAGEN_MODEL_FINAL: 'imagen-4.0-ultra-generate-001',
        KLING_IMAGE_MODEL_REFINE: 'kling-v3',
        SOME_OTHER: 'imagen-4.0-generate-001',
      },
      new Date('2026-10-12')
    )
    expect(found).toEqual(['GOOGLE_IMAGEN_MODEL_FINAL=imagen-4.0-ultra-generate-001'])
  })
})

describe('estimateImageCostUsd', () => {
  it('prices by resolution and falls back to the 1K price', () => {
    expect(estimateImageCostUsd('gemini-nano-banana-2.1', '2K')).toBe(0.0504)
    expect(estimateImageCostUsd('gemini-3.1-flash-lite-image', '2K')).toBe(0.0336)
    expect(estimateImageCostUsd('unknown-model')).toBeNull()
  })
})
