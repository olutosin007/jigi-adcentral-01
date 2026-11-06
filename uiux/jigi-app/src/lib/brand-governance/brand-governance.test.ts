import { describe, expect, it } from 'vitest'
import {
  buildBrandGuardianPayload,
  buildBrandGuardianSummary,
  guardianSeverityFromItems,
  mergeBrandGuardianIntoContent,
  runVoiceKeywordAudit,
  softGateForSubmit,
} from './index'

describe('Brand Guardian voice keywords', () => {
  it('fails on avoided words and warns when preferred words are missing', () => {
    const items = runVoiceKeywordAudit({
      text: 'A cheap promo for the weekend',
      preferredWords: ['craft', 'quality'],
      avoidedWords: ['cheap'],
    })
    expect(items.some((i) => i.status === 'fail' && /cheap/i.test(i.label))).toBe(true)
    expect(items.some((i) => /Preferred/i.test(i.label) && i.status === 'warn')).toBe(true)
  })

  it('passes when preferred words appear and avoided words do not', () => {
    const items = runVoiceKeywordAudit({
      text: 'Craft and quality in every pour',
      preferredWords: ['craft', 'quality'],
      avoidedWords: ['cheap'],
    })
    expect(guardianSeverityFromItems(items)).toBe('ok')
  })
})

describe('persist helpers', () => {
  it('merges brand_guardian into content', () => {
    const payload = buildBrandGuardianPayload({
      content: { headline: 'A cheap promo', body: 'Sale' },
      preferredWords: ['craft'],
      avoidedWords: ['cheap'],
    })
    expect(payload.severity).toBe('fail')
    const merged = mergeBrandGuardianIntoContent({ url: 'https://x' }, payload)
    expect(merged.url).toBe('https://x')
    expect((merged.brand_guardian as { severity: string }).severity).toBe('fail')
  })
})

describe('soft gate', () => {
  it('requires confirm on fail, toast on warn, nothing on ok', () => {
    expect(softGateForSubmit('fail').needsConfirm).toBe(true)
    expect(softGateForSubmit('warn').toast).toBe('warn')
    expect(softGateForSubmit('ok').needsConfirm).toBe(false)
  })

  it('summarises counts', () => {
    const summary = buildBrandGuardianSummary([
      { label: 'a', status: 'fail' },
      { label: 'b', status: 'warn' },
      { label: 'c', status: 'pass' },
    ])
    expect(summary).toEqual({ severity: 'fail', failCount: 1, warnCount: 1 })
  })
})
