import { createHash, randomBytes } from 'node:crypto'

export type ReviewAction = 'approve' | 'reject' | 'request_changes'
export type ReviewLinkState = 'active' | 'expired' | 'revoked' | 'used_up' | 'decided'

export const REVIEWABLE_STATUSES = ['submitted', 'brand_review']
export const DEFAULT_LINK_TTL_DAYS = 14
export const MAX_LINK_TTL_DAYS = 60
const REVIEW_ACTIONS: ReviewAction[] = ['approve', 'reject', 'request_changes']

export interface ReviewLinkRow {
  id: string
  asset_id: string
  campaign_id: string
  brand_id: string | null
  created_by: string
  expires_at: string
  revoked_at: string | null
  max_uses: number | null
  use_count: number
  decided_at: string | null
  decision: ReviewAction | null
}

/** 256-bit URL-safe token. Only the hash is persisted. */
export function generateReviewToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashReviewToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

/** Cheap shape check so junk never reaches the database. */
export function isPlausibleToken(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{40,64}$/.test(token)
}

export function linkExpiry(days: number | undefined, now = new Date()): Date {
  const requested = Number.isFinite(days) && days ? Math.floor(days as number) : DEFAULT_LINK_TTL_DAYS
  const clamped = Math.min(Math.max(requested, 1), MAX_LINK_TTL_DAYS)
  return new Date(now.getTime() + clamped * 24 * 60 * 60 * 1000)
}

export function evaluateLinkState(
  link: Pick<ReviewLinkRow, 'expires_at' | 'revoked_at' | 'max_uses' | 'use_count' | 'decided_at'>,
  now = new Date()
): ReviewLinkState {
  if (link.revoked_at) return 'revoked'
  if (link.decided_at) return 'decided'
  if (new Date(link.expires_at).getTime() <= now.getTime()) return 'expired'
  if (link.max_uses != null && link.use_count >= link.max_uses) return 'used_up'
  return 'active'
}

export interface GuestReviewInput {
  action: ReviewAction
  notes?: string
  guestName: string
  guestEmail?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateGuestReviewInput(
  body: unknown
): { ok: true; value: GuestReviewInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid request body' }
  const b = body as Record<string, unknown>
  const action = b.action as ReviewAction
  if (!REVIEW_ACTIONS.includes(action)) {
    return { ok: false, error: 'Invalid action. Must be: approve, reject, or request_changes' }
  }
  const guestName = typeof b.guest_name === 'string' ? b.guest_name.trim() : ''
  if (!guestName || guestName.length > 120) {
    return { ok: false, error: 'Please add your name so the team knows who decided' }
  }
  const guestEmail = typeof b.guest_email === 'string' ? b.guest_email.trim() : ''
  if (guestEmail && (guestEmail.length > 254 || !EMAIL_RE.test(guestEmail))) {
    return { ok: false, error: 'That email address does not look right' }
  }
  const notes = typeof b.notes === 'string' ? b.notes.trim() : ''
  if (notes.length > 5000) return { ok: false, error: 'Notes are too long (5000 characters max)' }
  if (action === 'request_changes' && !notes) {
    return { ok: false, error: 'Tell the team what to change' }
  }
  return {
    ok: true,
    value: {
      action,
      notes: notes || undefined,
      guestName,
      guestEmail: guestEmail || undefined,
    },
  }
}

/**
 * Best-effort, per-instance fixed-window limiter. Serverless instances don't
 * share memory, so this only blunts bursts; expiry, revocation, single-decision
 * and the 256-bit token space are the real controls.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return function allow(key: string, now = Date.now()): boolean {
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
      }
      return true
    }
    entry.count += 1
    return entry.count <= limit
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const INTERNAL_CONTENT_KEY = /prompt|generation_log|(^|_)(model|provider|seed|negative|system|raw|tokens?)(_|$)/i

/** Strip generation internals (prompts, model ids, raw output) before showing content to guests. */
export function sanitizeContentForGuest(content: unknown): Record<string, unknown> {
  if (!content || typeof content !== 'object' || Array.isArray(content)) return {}
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(content as Record<string, unknown>)) {
    if (INTERNAL_CONTENT_KEY.test(key)) continue
    out[key] = value
  }
  return out
}
