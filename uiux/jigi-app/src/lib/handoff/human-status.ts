import type { AssetStatus } from '@/lib/status'
import { TONE_COLORS } from '@/design-system/tokens'
import { TONE_SURFACE_CLASSES } from '@/design-system/tones'

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
  muted: TONE_SURFACE_CLASSES[TONE_COLORS.muted],
  primary: TONE_SURFACE_CLASSES[TONE_COLORS.primary],
  pending: TONE_SURFACE_CLASSES[TONE_COLORS.pending],
  warning: TONE_SURFACE_CLASSES[TONE_COLORS.warning],
  success: TONE_SURFACE_CLASSES[TONE_COLORS.success],
  destructive: TONE_SURFACE_CLASSES[TONE_COLORS.destructive],
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
