import { describe, expect, it } from 'vitest'
import { countRounds, diffContentFields, nextRound, previousRoundSnapshot, roundLabel } from './rounds'

const h = (to_status: string, created_at: string, content_snapshot?: Record<string, unknown>) => ({
  to_status,
  created_at,
  content_snapshot,
})

describe('rounds', () => {
  it('counts client sends, ignoring internal checks', () => {
    const history = [
      h('agency_review', '2026-10-01'),
      h('submitted', '2026-10-02'),
      h('changes_requested', '2026-10-03'),
      h('submitted', '2026-10-04'),
    ]
    expect(countRounds(history, 'submitted')).toBe(2)
    expect(nextRound(history)).toBe(3)
    expect(roundLabel(2)).toBe('Round 2')
  })

  it('treats legacy client-facing assets without history as round 1', () => {
    expect(countRounds([], 'submitted')).toBe(1)
    expect(countRounds([], 'draft')).toBe(0)
  })

  it('returns the previous round snapshot regardless of order', () => {
    const history = [h('submitted', '2026-10-04', { headline: 'B' }), h('submitted', '2026-10-02', { headline: 'A' })]
    expect(previousRoundSnapshot(history)).toEqual({ headline: 'A' })
    expect(previousRoundSnapshot([history[0]])).toBeNull()
  })

  it('diffs copy fields, changed first, skipping internals', () => {
    const rows = diffContentFields(
      { headline: 'Old', body: 'Same', prompt: 'x', image_url: 'u1' },
      { headline: 'New', body: 'Same', prompt: 'y', image_url: 'u2', cta: 'Buy' }
    )
    expect(rows.map((r) => r.key)).toEqual(['headline', 'cta', 'body'])
    expect(rows[0]).toMatchObject({ before: 'Old', after: 'New', changed: true })
    expect(rows[2].changed).toBe(false)
  })
})
