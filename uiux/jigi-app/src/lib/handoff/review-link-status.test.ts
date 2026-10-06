import { describe, it, expect } from 'vitest'
import { describeReviewLink, latestLinkByAsset, type ReviewLinkLike } from './review-link-status'

const NOW = new Date('2026-10-06T12:00:00Z')
const link = (over: Partial<ReviewLinkLike> = {}): ReviewLinkLike => ({
  id: 'l1',
  asset_id: 'a1',
  created_at: '2026-10-01T00:00:00Z',
  expires_at: '2026-10-15T00:00:00Z',
  revoked_at: null,
  first_opened_at: null,
  decided_at: null,
  decision: null,
  guest_name: null,
  recipient_name: null,
  recipient_email: null,
  ...over,
})

describe('describeReviewLink', () => {
  it('walks the lifecycle', () => {
    expect(describeReviewLink(link(), NOW)).toMatchObject({ status: 'active', canRevoke: true })
    expect(describeReviewLink(link({ first_opened_at: NOW.toISOString() }), NOW)).toMatchObject({
      status: 'opened',
      canRevoke: true,
    })
    expect(
      describeReviewLink(link({ decided_at: NOW.toISOString(), decision: 'approve', guest_name: 'Ada' }), NOW)
    ).toMatchObject({ status: 'decided', label: 'Ada approved', canRevoke: false })
    expect(describeReviewLink(link({ expires_at: '2026-10-01T00:00:00Z' }), NOW).status).toBe('expired')
    expect(describeReviewLink(link({ revoked_at: NOW.toISOString() }), NOW).status).toBe('revoked')
  })
})

describe('latestLinkByAsset', () => {
  it('keeps the newest link per asset', () => {
    const map = latestLinkByAsset([
      link({ id: 'old', created_at: '2026-10-01T00:00:00Z' }),
      link({ id: 'new', created_at: '2026-10-03T00:00:00Z' }),
      link({ id: 'other', asset_id: 'a2' }),
    ])
    expect(map.get('a1')?.id).toBe('new')
    expect(map.get('a2')?.id).toBe('other')
  })
})
