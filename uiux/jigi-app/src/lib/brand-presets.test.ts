import { describe, expect, it } from 'vitest'
import {
  PRESET_NAME_MAX,
  PRESET_STYLE_MAX,
  applyPresetToPrompt,
  extractPresetStyle,
  stripPresetStyle,
  validatePresetInput,
  type PresetInput,
} from './brand-presets'

const valid: PresetInput = {
  name: 'Sunlit linen',
  style_prompt: 'soft morning light, linen textures, muted warm palette',
  image_tier: 'refine',
  aspect_ratio: '4:5',
}

describe('validatePresetInput', () => {
  it('accepts and trims a valid preset', () => {
    const result = validatePresetInput({ ...valid, name: '  Sunlit linen  ' })
    expect(result).toEqual({ ok: true, value: valid })
  })

  it('rejects empty and overlong names', () => {
    const empty = validatePresetInput({ ...valid, name: '   ' })
    const long = validatePresetInput({ ...valid, name: 'x'.repeat(PRESET_NAME_MAX + 1) })
    expect(empty.ok).toBe(false)
    expect(long.ok).toBe(false)
    expect(validatePresetInput({ ...valid, name: 'x'.repeat(PRESET_NAME_MAX) }).ok).toBe(true)
  })

  it('rejects empty and overlong style prompts', () => {
    expect(validatePresetInput({ ...valid, style_prompt: '' }).ok).toBe(false)
    expect(validatePresetInput({ ...valid, style_prompt: 'x'.repeat(PRESET_STYLE_MAX + 1) }).ok).toBe(false)
  })

  it('rejects unknown tiers and aspect ratios', () => {
    const result = validatePresetInput({
      ...valid,
      image_tier: 'ultra' as PresetInput['image_tier'],
      aspect_ratio: '3:2' as PresetInput['aspect_ratio'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.image_tier).toBeDefined()
      expect(result.errors.aspect_ratio).toBeDefined()
    }
  })
})

describe('applyPresetToPrompt', () => {
  const preset = { style_prompt: 'linen textures' }

  it('appends style to an existing prompt', () => {
    expect(applyPresetToPrompt('Bottle on a table', preset)).toBe('Bottle on a table\n\nStyle: linen textures')
  })

  it('is idempotent', () => {
    const once = applyPresetToPrompt('Bottle on a table', preset)
    expect(applyPresetToPrompt(once, preset)).toBe(once)
  })

  it('replaces a previously applied preset instead of stacking', () => {
    const first = applyPresetToPrompt('Bottle', preset)
    const second = applyPresetToPrompt(first, { style_prompt: 'neon noir' })
    expect(second).toBe('Bottle\n\nStyle: neon noir')
  })

  it('handles an empty prompt and trims whitespace', () => {
    expect(applyPresetToPrompt('   ', { style_prompt: '  linen  ' })).toBe('Style: linen')
    expect(applyPresetToPrompt(applyPresetToPrompt('', preset), preset)).toBe('Style: linen textures')
  })
})

describe('stripPresetStyle / extractPresetStyle', () => {
  it('round-trips the applied style', () => {
    const prompt = applyPresetToPrompt('Bottle', { style_prompt: 'linen' })
    expect(stripPresetStyle(prompt)).toBe('Bottle')
    expect(extractPresetStyle(prompt)).toBe('linen')
  })

  it('treats an un-styled prompt as the style itself when saving', () => {
    expect(extractPresetStyle('  warm film grain  ')).toBe('warm film grain')
  })
})
