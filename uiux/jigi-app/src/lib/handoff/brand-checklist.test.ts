import { describe, it, expect } from 'vitest'
import { buildBrandChecklist } from './brand-checklist'

describe('buildBrandChecklist', () => {
  it('returns nothing for unchecked assets', () => {
    expect(buildBrandChecklist({})).toEqual([])
  })

  it('maps compliance checks, scores, exclusions and drift; fails first', () => {
    const items = buildBrandChecklist({
      drift_status: 'review_required',
      compliance_check: {
        checks: [
          { name: 'tone_of_voice', status: 'pass', message: 'Warm and direct' },
          { name: 'banned_words', status: 'fail', message: 'Uses "cheap"' },
          { name: 'length', status: 'warning', message: 'Long for Instagram' },
        ],
      },
      validation_scores: {
        valid: false,
        scores: { colour_compliance: 0.82, junk: 'x', huge: 900 },
        checklists: { exclusions: [{ item: 'competitor logos', violated: false }] },
      },
      content: { brand_alignment_score: 35 },
    })
    expect(items[0].status).toBe('fail')
    expect(items.map((i) => i.label)).toEqual(
      expect.arrayContaining([
        'Brief changed since this was made',
        'Tone of voice',
        'Banned words',
        'Length',
        'Colour compliance · 82%',
        'Avoids “competitor logos”',
        'Brand alignment · 35%',
      ])
    )
    expect(items.find((i) => i.label === 'Length')?.status).toBe('warn')
    expect(items.some((i) => i.label.startsWith('Huge'))).toBe(false)
  })

  it('caps the list length', () => {
    const checks = Array.from({ length: 20 }, (_, i) => ({ name: `c${i}`, status: 'pass' }))
    expect(buildBrandChecklist({ compliance_check: { checks } })).toHaveLength(8)
  })
})
