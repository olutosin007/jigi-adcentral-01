import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  trackCandidateCreated,
  trackDecision,
  trackGenerateImagePath,
  trackSubmitted,
} from './analytics'

describe('trackGenerateImagePath', () => {
  beforeEach(() => {
    vi.spyOn(window, 'dispatchEvent')
  })

  it('K3: dispatches generate_image with path', () => {
    trackGenerateImagePath('production_path', { campaign_id: 'camp-1', source: 'copy_card' })
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'jigi:analytics',
        detail: {
          event: 'generate_image',
          props: { path: 'production_path', campaign_id: 'camp-1', source: 'copy_card' },
        },
      })
    )
  })
})

describe('north-star events', () => {
  beforeEach(() => {
    vi.spyOn(window, 'dispatchEvent')
  })

  it('fires candidate_created, submitted, and decision_made with timestamps', () => {
    trackCandidateCreated({ source: 'ai', asset_type: 'image', at: '2026-10-01T12:00:00.000Z' })
    trackSubmitted({ target: 'submitted', asset_type: 'image', at: '2026-10-01T13:00:00.000Z' })
    trackDecision({
      via: 'guest',
      action: 'approve',
      round: 1,
      sentAt: '2026-10-01T13:00:00.000Z',
      assetType: 'image',
      now: new Date('2026-10-01T15:00:00.000Z'),
    })

    const events = vi.mocked(window.dispatchEvent).mock.calls.map((c) => {
      const detail = (c[0] as CustomEvent).detail as { event: string; props: Record<string, unknown> }
      return detail
    })

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event: 'candidate_created',
          props: expect.objectContaining({ at: '2026-10-01T12:00:00.000Z', asset_type: 'image' }),
        }),
        expect.objectContaining({
          event: 'submitted',
          props: expect.objectContaining({ at: '2026-10-01T13:00:00.000Z' }),
        }),
        expect.objectContaining({
          event: 'decision_made',
          props: expect.objectContaining({
            action: 'approve',
            hours_to_decision: 2,
            at: '2026-10-01T15:00:00.000Z',
          }),
        }),
      ])
    )
  })
})
