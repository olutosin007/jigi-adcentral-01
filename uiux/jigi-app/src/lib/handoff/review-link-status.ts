import type { HandoffTone } from './human-status'

export interface ReviewLinkLike {
  id: string
  asset_id: string
  created_at: string
  expires_at: string
  revoked_at: string | null
  first_opened_at: string | null
  decided_at: string | null
  decision: 'approve' | 'reject' | 'request_changes' | null
  guest_name: string | null
  recipient_name: string | null
  recipient_email: string | null
}

export type LinkStatus = 'active' | 'opened' | 'decided' | 'expired' | 'revoked'

export interface LinkStatusView {
  status: LinkStatus
  label: string
  tone: HandoffTone
  canRevoke: boolean
}

const DECISION_LABEL = {
  approve: 'approved',
  reject: 'declined',
  request_changes: 'asked for changes',
} as const

export function describeReviewLink(link: ReviewLinkLike, now = new Date()): LinkStatusView {
  if (link.revoked_at) return { status: 'revoked', label: 'Link revoked', tone: 'muted', canRevoke: false }
  if (link.decided_at) {
    const who = link.guest_name ?? 'Client'
    const what = link.decision ? DECISION_LABEL[link.decision] : 'decided'
    return { status: 'decided', label: `${who} ${what}`, tone: 'success', canRevoke: false }
  }
  if (new Date(link.expires_at).getTime() <= now.getTime()) {
    return { status: 'expired', label: 'Link expired', tone: 'muted', canRevoke: false }
  }
  if (link.first_opened_at) return { status: 'opened', label: 'Link opened', tone: 'pending', canRevoke: true }
  return { status: 'active', label: 'Link sent', tone: 'primary', canRevoke: true }
}

/** Newest link per asset (links arrive in any order). */
export function latestLinkByAsset<T extends ReviewLinkLike>(links: T[]): Map<string, T> {
  const map = new Map<string, T>()
  for (const link of links) {
    const current = map.get(link.asset_id)
    if (!current || new Date(link.created_at) > new Date(current.created_at)) map.set(link.asset_id, link)
  }
  return map
}
