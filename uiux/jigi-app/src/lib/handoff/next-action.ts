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
}): JobNextAction {
  const { counts, briefReady, archived } = input

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
