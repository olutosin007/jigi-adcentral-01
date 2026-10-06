import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

vi.mock('./resend.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({}),
  createApprovalEmailHtml: vi.fn().mockReturnValue('<p/>'),
}))

import { applyReviewDecision } from './review-domain'

interface Call {
  table: string
  op: string
  payload?: unknown
  filters: Array<[string, unknown]>
}

function fakeAdmin(opts: { assetStatus: string; updateMatches?: boolean }) {
  const calls: Call[] = []
  const asset = {
    id: 'a1',
    type: 'image',
    status: opts.assetStatus,
    created_by: 'creator1',
    generation_mode: 'brand_grounded',
    campaigns: { id: 'c1', name: 'Launch' },
  }
  const from = (table: string) => {
    const call: Call = { table, op: 'select', filters: [] }
    calls.push(call)
    const builder: Record<string, unknown> = {}
    const chain = (fn: (...a: unknown[]) => void) => (...args: unknown[]) => {
      fn(...args)
      return builder
    }
    builder.select = chain(() => {})
    builder.update = chain((p) => {
      call.op = 'update'
      call.payload = p
    })
    builder.eq = chain((k, v) => call.filters.push([k as string, v]))
    builder.in = chain((k, v) => call.filters.push([k as string, v]))
    builder.insert = (p: unknown) => {
      call.op = 'insert'
      call.payload = p
      return Promise.resolve({ error: null })
    }
    const resolveRow = () => {
      if (table === 'creative_assets' && call.op === 'select') return { data: asset, error: null }
      if (table === 'creative_assets' && call.op === 'update')
        return { data: opts.updateMatches === false ? null : { ...asset, ...(call.payload as object) }, error: null }
      if (table === 'users') return { data: { id: 'creator1', name: 'Rev', email: 'c@x.co' }, error: null }
      return { data: null, error: null }
    }
    builder.single = () => Promise.resolve(resolveRow())
    builder.maybeSingle = () => Promise.resolve(resolveRow())
    builder.then = (r: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(r)
    return builder
  }
  return { admin: { from } as unknown as SupabaseClient, calls }
}

describe('applyReviewDecision', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes identical status + history for app and guest paths', async () => {
    const app = fakeAdmin({ assetStatus: 'brand_review' })
    const guest = fakeAdmin({ assetStatus: 'brand_review' })

    const r1 = await applyReviewDecision(app.admin, {
      assetId: 'a1',
      action: 'request_changes',
      notes: 'Bigger logo',
      actor: { userId: 'u1', via: 'app' },
    })
    const r2 = await applyReviewDecision(guest.admin, {
      assetId: 'a1',
      action: 'request_changes',
      notes: 'Bigger logo',
      actor: { userId: null, via: 'guest_link', guestName: 'Ada', reviewLinkId: 'l1' },
    })

    expect(r1).toMatchObject({ ok: true, newStatus: 'changes_requested', previousStatus: 'brand_review' })
    expect(r2).toMatchObject({ ok: true, newStatus: 'changes_requested', previousStatus: 'brand_review' })

    const hist = (c: Call[]) => c.find((x) => x.table === 'asset_status_history')!.payload as Record<string, unknown>
    expect(hist(app.calls)).toMatchObject({ to_status: 'changes_requested', from_status: 'brand_review', user_id: 'u1' })
    expect(hist(guest.calls)).toMatchObject({
      to_status: 'changes_requested',
      from_status: 'brand_review',
      user_id: null,
      reviewed_via: 'guest_link',
    })

    const audit = guest.calls.find((x) => x.table === 'approval_actions')!.payload as Record<string, unknown>
    expect(audit).toMatchObject({ action: 'request_changes', guest_name: 'Ada', review_link_id: 'l1' })
    const appAudit = app.calls.find((x) => x.table === 'approval_actions')!.payload as Record<string, unknown>
    expect(appAudit).not.toHaveProperty('reviewed_via')
  })

  it('guards the update on reviewable statuses', async () => {
    const { admin, calls } = fakeAdmin({ assetStatus: 'submitted' })
    await applyReviewDecision(admin, { assetId: 'a1', action: 'approve', actor: { userId: 'u1', via: 'app' } })
    const update = calls.find((c) => c.table === 'creative_assets' && c.op === 'update')!
    expect(update.filters).toContainEqual(['status', ['submitted', 'brand_review']])
  })

  it('rejects non-reviewable statuses', async () => {
    const { admin } = fakeAdmin({ assetStatus: 'draft' })
    const r = await applyReviewDecision(admin, { assetId: 'a1', action: 'approve', actor: { userId: 'u1', via: 'app' } })
    expect(r).toMatchObject({ ok: false, status: 400 })
  })

  it('returns 409 when a concurrent decision already won', async () => {
    const { admin, calls } = fakeAdmin({ assetStatus: 'brand_review', updateMatches: false })
    const r = await applyReviewDecision(admin, {
      assetId: 'a1',
      action: 'approve',
      actor: { userId: null, via: 'guest_link', guestName: 'Ada' },
    })
    expect(r).toMatchObject({ ok: false, status: 409 })
    expect(calls.some((c) => c.table === 'asset_status_history')).toBe(false)
  })
})
