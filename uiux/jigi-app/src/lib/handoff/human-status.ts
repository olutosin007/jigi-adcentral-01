import type { AssetStatus } from '@/lib/status'

export type HandoffAudience = 'creator' | 'client'

export type HandoffTone = 'muted' | 'primary' | 'pending' | 'warning' | 'success' | 'destructive'

interface HumanStatus {
  creator: string
  client: string
  tone: HandoffTone
}

const HUMAN_STATUS: Record<AssetStatus, HumanStatus> = {
  draft: { creator: 'Working', client: 'In progress', tone: 'muted' },
  agency_review: { creator: 'Internal check', client: 'In progress', tone: 'primary' },
  submitted: { creator: 'Waiting on client', client: 'Needs your decision', tone: 'pending' },
  brand_review: { creator: 'Waiting on client', client: 'Needs your decision', tone: 'pending' },
  changes_requested: { creator: 'Fix & resend', client: 'You asked for changes', tone: 'warning' },
  approved: { creator: 'Approved', client: 'Approved', tone: 'success' },
  rejected: { creator: 'Not moving forward', client: 'Declined', tone: 'destructive' },
}

export const HANDOFF_TONE_CLASSES: Record<HandoffTone, string> = {
  muted: 'bg-muted text-muted-foreground border-border',
  primary: 'bg-primary/10 text-primary border-primary/30',
  pending: 'bg-[#FEF3C7] text-[#B45309] border-[#F59E0B]/30 dark:bg-[#422006] dark:text-[#FBBF24]',
  warning: 'bg-warning/10 text-warning border-warning/30',
  success: 'bg-success/10 text-success border-success/30',
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
}

function resolve(status: string): HumanStatus {
  return HUMAN_STATUS[status as AssetStatus] ?? HUMAN_STATUS.draft
}

export function humanStatusLabel(status: string, audience: HandoffAudience = 'creator'): string {
  return resolve(status)[audience]
}

export function humanStatusTone(status: string): HandoffTone {
  return resolve(status).tone
}

export function humanStatusClasses(status: string): string {
  return HANDOFF_TONE_CLASSES[resolve(status).tone]
}
