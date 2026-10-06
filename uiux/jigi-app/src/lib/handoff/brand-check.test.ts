import { describe, it, expect } from 'vitest'
import { summarizeBrandCheck, canRunBrandCheck } from './brand-check'

const checked = (v: Record<string, unknown>) => ({ validation_scores: v, drift_status: null })

describe('summarizeBrandCheck', () => {
  it('reports unchecked when no validation has run', () => {
    expect(summarizeBrandCheck({ validation_scores: null }, 'complete').state).toBe('unchecked')
  })

  it('only claims on-brand with a complete kit', () => {
    const complete = summarizeBrandCheck(checked({ valid: true, blocking: false }), 'complete')
    expect(complete).toMatchObject({ state: 'clear', label: 'Looks on-brand', guidanceOnly: false })

    const partial = summarizeBrandCheck(checked({ valid: true, blocking: false }), 'partial')
    expect(partial).toMatchObject({ state: 'clear', label: 'No issues found', guidanceOnly: true })
    expect(partial.label).not.toMatch(/on-brand/i)
  })

  it('flags blocking and attention states', () => {
    expect(summarizeBrandCheck(checked({ valid: false, blocking: true }), 'complete').state).toBe('blocking')
    expect(summarizeBrandCheck(checked({ valid: false, blocking: false }), 'complete').state).toBe('attention')
    expect(
      summarizeBrandCheck(
        { validation_scores: { valid: true, blocking: false }, drift_status: 'review_required' },
        'complete'
      ).state
    ).toBe('attention')
  })

  it('ignores malformed validation payloads', () => {
    expect(summarizeBrandCheck(checked({ foo: 1 }), 'complete').state).toBe('unchecked')
  })

  it('requires a brand to run checks', () => {
    expect(canRunBrandCheck('none')).toBe(false)
    expect(canRunBrandCheck('starter')).toBe(true)
  })
})
