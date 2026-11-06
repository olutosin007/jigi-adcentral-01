import { describe, expect, it } from 'vitest'
import { hoursCandidateToDecision, medianHoursCandidateToDecision } from './decision-latency'

describe('decision latency stub', () => {
  it('measures hours from submitted to approved', () => {
    const hours = hoursCandidateToDecision([
      { to_status: 'draft', created_at: '2026-10-01T10:00:00.000Z' },
      { to_status: 'submitted', created_at: '2026-10-01T12:00:00.000Z' },
      { to_status: 'approved', created_at: '2026-10-01T18:00:00.000Z' },
    ])
    expect(hours).toBe(6)
  })

  it('returns null when still waiting', () => {
    expect(
      hoursCandidateToDecision([
        { to_status: 'submitted', created_at: '2026-10-01T12:00:00.000Z' },
      ])
    ).toBeNull()
  })

  it('median across fixtures', () => {
    const median = medianHoursCandidateToDecision([
      [
        { to_status: 'submitted', created_at: '2026-10-01T00:00:00.000Z' },
        { to_status: 'approved', created_at: '2026-10-01T02:00:00.000Z' },
      ],
      [
        { to_status: 'brand_review', created_at: '2026-10-01T00:00:00.000Z' },
        { to_status: 'changes_requested', created_at: '2026-10-01T04:00:00.000Z' },
      ],
      [
        { to_status: 'submitted', created_at: '2026-10-01T00:00:00.000Z' },
        { to_status: 'rejected', created_at: '2026-10-01T06:00:00.000Z' },
      ],
    ])
    expect(median).toBe(4)
  })
})
