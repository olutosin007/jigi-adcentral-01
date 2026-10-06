import type { CreativeAsset } from '@/store/campaignStore'

export type GuestLinkState = 'active' | 'decided' | 'expired' | 'revoked' | 'used_up' | 'not_found'
export type GuestDecision = 'approve' | 'reject' | 'request_changes'

export interface GuestReviewPayload {
  state: 'active' | 'decided'
  link: {
    expires_at: string
    recipient_name: string | null
    decided_at: string | null
    decision: GuestDecision | null
    guest_name: string | null
  }
  asset: Pick<
    CreativeAsset,
    | 'id'
    | 'type'
    | 'status'
    | 'source'
    | 'content'
    | 'original_filename'
    | 'version'
    | 'submission_note'
    | 'review_notes'
    | 'validation_scores'
    | 'drift_status'
    | 'compliance_check'
    | 'created_at'
    | 'updated_at'
  >
  campaign: {
    name: string
    brief: {
      objective: string | null
      key_message: string | null
      audience: string | null
      channels: string[]
    }
  }
  brand: { name: string; logo_url: string | null; primary_colour: string | null } | null
  brand_kit?: 'starter' | 'partial' | 'complete' | 'none'
}

export type GuestReviewResult =
  | { ok: true; data: GuestReviewPayload }
  | { ok: false; state: GuestLinkState; error: string }

/** Public, unauthenticated: guests have no session. */
export async function fetchGuestReview(token: string): Promise<GuestReviewResult> {
  try {
    const res = await fetch(`/api/review-links?token=${encodeURIComponent(token)}`)
    const body = await res.json().catch(() => ({}))
    if (res.ok) return { ok: true, data: body as GuestReviewPayload }
    return {
      ok: false,
      state: (body.state as GuestLinkState) ?? (res.status === 429 ? 'active' : 'not_found'),
      error: body.error ?? 'Something went wrong loading this review',
    }
  } catch {
    return { ok: false, state: 'active', error: 'Could not reach Jigi. Check your connection and retry.' }
  }
}

export interface GuestDecisionInput {
  action: GuestDecision
  notes?: string
  guest_name: string
  guest_email?: string
}

export async function submitGuestDecision(
  token: string,
  input: GuestDecisionInput
): Promise<{ ok: true } | { ok: false; error: string; state?: GuestLinkState }> {
  try {
    const res = await fetch(`/api/review-links?action=review&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const body = await res.json().catch(() => ({}))
    if (res.ok) return { ok: true }
    return { ok: false, error: body.error ?? 'Could not record your decision', state: body.state }
  } catch {
    return { ok: false, error: 'Could not reach Jigi. Check your connection and retry.' }
  }
}
