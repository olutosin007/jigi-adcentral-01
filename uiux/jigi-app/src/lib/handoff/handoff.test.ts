import { describe, expect, it } from 'vitest'
import {
  countJobAssets,
  getJobNextAction,
  oldestWaitingAt,
  waitingDays,
  humanStatusLabel,
  EMPTY_JOB_COUNTS,
} from './index'

describe('humanStatusLabel', () => {
  it('maps statuses to creator language', () => {
    expect(humanStatusLabel('draft')).toBe('Working')
    expect(humanStatusLabel('submitted')).toBe('Waiting on client')
    expect(humanStatusLabel('brand_review')).toBe('Waiting on client')
    expect(humanStatusLabel('changes_requested')).toBe('Fix & resend')
    expect(humanStatusLabel('rejected')).toBe('Not moving forward')
  })

  it('maps statuses to client language', () => {
    expect(humanStatusLabel('submitted', 'client')).toBe('Needs your decision')
    expect(humanStatusLabel('rejected', 'client')).toBe('Declined')
  })

  it('falls back to draft for unknown statuses', () => {
    expect(humanStatusLabel('mystery')).toBe('Working')
  })
})

describe('countJobAssets', () => {
  it('buckets statuses', () => {
    const counts = countJobAssets([
      { status: 'draft' },
      { status: 'submitted' },
      { status: 'brand_review' },
      { status: 'changes_requested' },
      { status: 'approved' },
      { status: 'agency_review' },
    ])
    expect(counts).toMatchObject({
      total: 6,
      draft: 1,
      waiting: 2,
      changes: 1,
      approved: 1,
      internal: 1,
    })
  })
})

describe('getJobNextAction', () => {
  it('nudges the client when work has waited too long, ahead of new drafts', () => {
    const action = getJobNextAction({
      counts: { ...EMPTY_JOB_COUNTS, total: 3, waiting: 2, draft: 1 },
      briefReady: true,
      oldestWaitingAt: '2026-10-01T09:00:00Z',
      now: new Date('2026-10-05T10:00:00Z'),
    })
    expect(action).toMatchObject({ label: 'Nudge client', stage: 'decisions', hint: '2 assets waiting 4 days' })
  })

  it('keeps normal priority when waiting is fresh', () => {
    const action = getJobNextAction({
      counts: { ...EMPTY_JOB_COUNTS, total: 2, waiting: 1, draft: 1 },
      briefReady: true,
      oldestWaitingAt: '2026-10-04T09:00:00Z',
      now: new Date('2026-10-05T10:00:00Z'),
    })
    expect(action.label).toBe('Send for approval')
  })

  it('finds the oldest waiting asset', () => {
    expect(
      oldestWaitingAt([
        { status: 'submitted', updated_at: '2026-10-03' },
        { status: 'brand_review', updated_at: '2026-10-02' },
        { status: 'draft', updated_at: '2026-09-01' },
      ])
    ).toBe('2026-10-02')
    expect(waitingDays(null)).toBe(0)
  })

  it('prioritises client changes over everything', () => {
    const action = getJobNextAction({
      counts: { ...EMPTY_JOB_COUNTS, total: 3, changes: 2, draft: 1 },
      briefReady: true,
    })
    expect(action.label).toBe('Fix 2 notes')
    expect(action.stage).toBe('decisions')
  })

  it('asks for brief when empty and brief incomplete', () => {
    expect(getJobNextAction({ counts: EMPTY_JOB_COUNTS, briefReady: false }).stage).toBe('brief')
  })

  it('asks for creative when empty and brief ready', () => {
    const action = getJobNextAction({ counts: EMPTY_JOB_COUNTS, briefReady: true })
    expect(action.label).toBe('Add creative')
    expect(action.stage).toBe('creative')
  })

  it('prompts send when drafts exist', () => {
    const action = getJobNextAction({
      counts: { ...EMPTY_JOB_COUNTS, total: 2, draft: 2 },
      briefReady: true,
    })
    expect(action.label).toBe('Send for approval')
    expect(action.stage).toBe('send')
  })

  it('shows waiting when everything is with the client', () => {
    const action = getJobNextAction({
      counts: { ...EMPTY_JOB_COUNTS, total: 3, waiting: 3 },
      briefReady: true,
    })
    expect(action.label).toBe('3 waiting on client')
    expect(action.tone).toBe('pending')
  })

  it('routes archived jobs to approved', () => {
    expect(
      getJobNextAction({ counts: EMPTY_JOB_COUNTS, briefReady: true, archived: true }).stage
    ).toBe('approved')
  })
})
