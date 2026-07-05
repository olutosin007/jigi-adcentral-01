import { describe, expect, it } from 'vitest'
import { mergeCopyValidationWarnings, validateCopy } from './validation'
import type { CopyDisplayFormat } from './schema'

describe('mergeCopyValidationWarnings', () => {
  it('dedupes identical strings', () => {
    expect(mergeCopyValidationWarnings(['a'], ['a', 'b'])).toEqual(['a', 'b'])
  })

  it('preserves order (AI first)', () => {
    expect(mergeCopyValidationWarnings(['x'], ['y'])).toEqual(['x', 'y'])
  })
})

describe('validateCopy', () => {
  const base: CopyDisplayFormat = {
    headline: 'h',
    body: 'b',
    cta: 'c',
    character_count: 3,
  }

  it('flags character count over max', () => {
    const r = validateCopy({ ...base, character_count: 120 }, { maxChars: 100 })
    expect(r.warnings.some((w) => w.includes('exceeds channel limit'))).toBe(true)
    expect(r.truncation_suggestion).toBeTruthy()
  })

  it('inherits exclusions_violated from model flag without checklist', () => {
    const r = validateCopy({ ...base, exclusions_violated: true }, {})
    expect(r.exclusions_violated).toBe(true)
    expect(r.valid).toBe(false)
  })

  it('adds tone warning when adherence is low', () => {
    const r = validateCopy({ ...base, tone_adherence: 30 }, {})
    expect(r.warnings.some((w) => w.includes('Tone adherence'))).toBe(true)
  })

  it('uses exclusions_check rows', () => {
    const r = validateCopy(
      {
        ...base,
        exclusions_check: [{ exclusion: 'bad', violated: true }],
      },
      {}
    )
    expect(r.exclusions_violated).toBe(true)
    expect(r.warnings.some((w) => w.includes('bad'))).toBe(true)
  })
})
