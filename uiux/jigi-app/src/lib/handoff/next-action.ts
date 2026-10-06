import type { HandoffTone } from './human-status'

export type JobStageTarget = 'brief' | 'creative' | 'send' | 'decisions' | 'approved'

export interface JobAssetCounts {
  total: number
  draft: number
  internal: number
  waiting: number
  changes: number
  approved: number
  rejected: number
}

export interface JobNextAction {
  label: string
  stage: JobStageTarget
  tone: HandoffTone
  /** Short supporting line under the action. */
  hint?: string
}

export const EMPTY_JOB_COUNTS: JobAssetCounts = {
  total: 0,
  draft: 0,
  internal: 0,
  waiting: 0,
  changes: 0,
  approved: 0,
  rejected: 0,
}

export function countJobAssets(assets: { status: string }[]): JobAssetCounts {
  const counts = { ...EMPTY_JOB_COUNTS, total: assets.length }
  for (const a of assets) {
    switch (a.status) {
      case 'draft':
        counts.draft++
        break
      case 'agency_review':
        counts.internal++
        break
      case 'submitted':
      case 'brand_review':
        counts.waiting++
        break
      case 'changes_requested':
        counts.changes++
        break
      case 'approved':
        counts.approved++
        break
      case 'rejected':
        counts.rejected++
        break
    }
  }
  return counts
}

export function jobStageHref(campaignId: string, stage: JobStageTarget): string {
  return `/app/campaigns/${campaignId}?stage=${stage}`
}

/** Waiting longer than this nudges the creator to chase the client. */
export const STALE_WAITING_DAYS = 3
const DAY_MS = 24 * 60 * 60 * 1000

/** Oldest updated_at among assets waiting on the client (submitted / brand_review). */
export function oldestWaitingAt(assets: { status: string; updated_at?: string | null }[]): string | null {
  let oldest: string | null = null
  for (const a of assets) {
    if ((a.status === 'submitted' || a.status === 'brand_review') && a.updated_at) {
      if (!oldest || a.updated_at < oldest) oldest = a.updated_at
    }
  }
  return oldest
}

export function waitingDays(since: string | null | undefined, now: Date = new Date()): number {
  if (!since) return 0
  const t = new Date(since).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((now.getTime() - t) / DAY_MS))
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

/**
 * One primary next action per job. Order reflects what unblocks the handoff
 * fastest: client feedback first, then unsent work, then waiting.
 */
export function getJobNextAction(input: {
  counts: JobAssetCounts
  briefReady: boolean
  archived?: boolean
  oldestWaitingAt?: string | null
  now?: Date
}): JobNextAction {
  const { counts, briefReady, archived } = input
  const staleDays = counts.waiting > 0 ? waitingDays(input.oldestWaitingAt, input.now) : 0

  if (archived) {
    return { label: 'View approved', stage: 'approved', tone: 'muted', hint: 'Archived' }
  }

  if (counts.changes > 0) {
    return {
      label: `Fix ${plural(counts.changes, 'note')}`,
      stage: 'decisions',
      tone: 'warning',
      hint: 'Client asked for changes',
    }
  }

  if (counts.total === 0) {
    if (!briefReady) {
      return { label: 'Complete brief', stage: 'brief', tone: 'primary' }
    }
    return { label: 'Add creative', stage: 'creative', tone: 'primary' }
  }

  if (staleDays >= STALE_WAITING_DAYS) {
    return {
      label: 'Nudge client',
      stage: 'decisions',
      tone: 'pending',
      hint: `${plural(counts.waiting, 'asset')} waiting ${plural(staleDays, 'day')}`,
    }
  }

  if (counts.draft > 0) {
    return {
      label: 'Send for approval',
      stage: 'send',
      tone: 'primary',
      hint: `${plural(counts.draft, 'candidate')} ready`,
    }
  }

  if (counts.waiting > 0) {
    return {
      label: `${counts.waiting} waiting on client`,
      stage: 'decisions',
      tone: 'pending',
    }
  }

  if (counts.internal > 0) {
    return {
      label: `${counts.internal} in internal check`,
      stage: 'decisions',
      tone: 'primary',
    }
  }

  if (counts.approved > 0) {
    return {
      label: `${plural(counts.approved, 'asset')} approved`,
      stage: 'approved',
      tone: 'success',
    }
  }

  return { label: 'Add creative', stage: 'creative', tone: 'primary' }
}
