import { describe, expect, it } from 'vitest'
import {
  ACTIVATION_EVENT_TO_TICK,
  completionCount,
  requiredTicksComplete,
} from './checklist'

describe('activation checklist', () => {
  it('maps north-star analytics events to ticks', () => {
    expect(ACTIVATION_EVENT_TO_TICK.candidate_created).toBe('draft_started')
    expect(ACTIVATION_EVENT_TO_TICK.decide_link_created).toBe('decide_link_sent')
    expect(ACTIVATION_EVENT_TO_TICK.decision_made).toBe('decision_received')
  })

  it('treats brand kit as optional for completion', () => {
    expect(
      requiredTicksComplete({
        draft_started: true,
        brand_check_seen: true,
        decide_link_sent: true,
        decision_received: true,
      })
    ).toBe(true)
    expect(
      requiredTicksComplete({
        draft_started: true,
        brand_check_seen: true,
        decide_link_sent: true,
      })
    ).toBe(false)
  })

  it('counts only required ticks', () => {
    expect(
      completionCount({
        draft_started: true,
        brand_kit_optional: true,
      })
    ).toEqual({ done: 1, total: 4 })
  })
})
