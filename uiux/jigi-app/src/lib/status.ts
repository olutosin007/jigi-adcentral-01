import { CheckCircle, Clock, Send, Eye, AlertTriangle, XCircle, Edit } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AssetStatus =
  | 'draft'
  | 'agency_review'
  | 'submitted'
  | 'brand_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected'

export const STATUS_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  draft: ['agency_review', 'submitted'],
  agency_review: ['draft', 'submitted'],
  submitted: ['brand_review'],
  brand_review: ['approved', 'rejected', 'changes_requested'],
  changes_requested: ['draft', 'submitted'],
  approved: [],
  rejected: [],
}

export function canTransition(from: AssetStatus, to: AssetStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export function getValidTransitions(status: AssetStatus): AssetStatus[] {
  return STATUS_TRANSITIONS[status] || []
}

export function isTerminalStatus(status: AssetStatus): boolean {
  return status === 'approved' || status === 'rejected'
}

export function isPendingReview(status: AssetStatus): boolean {
  return status === 'submitted' || status === 'brand_review'
}

export interface StatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: LucideIcon
  description: string
}

export const STATUS_CONFIG: Record<AssetStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-border',
    icon: Edit,
    description: 'Asset is being worked on',
  },
  agency_review: {
    label: 'Agency Review',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    icon: Eye,
    description: 'Awaiting internal agency review',
  },
  submitted: {
    label: 'Submitted',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
    icon: Send,
    description: 'Submitted for brand review',
  },
  brand_review: {
    label: 'Brand Review',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    icon: Clock,
    description: 'Under review by brand team',
  },
  changes_requested: {
    label: 'Changes Requested',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    icon: AlertTriangle,
    description: 'Revisions required',
  },
  approved: {
    label: 'Approved',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    icon: CheckCircle,
    description: 'Approved for use',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    icon: XCircle,
    description: 'Not approved',
  },
}

export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status as AssetStatus] || STATUS_CONFIG.draft
}

/** True when the asset can be sent into the review workflow from the UI. */
export function canSubmitAssetForReview(status: string): boolean {
  const transitions = getValidTransitions(status as AssetStatus)
  return transitions.includes('submitted') || transitions.includes('agency_review')
}

export type ReviewAction = 'approve' | 'reject' | 'request_changes'

export interface ReviewActionConfig {
  label: string
  targetStatus: AssetStatus
  color: string
  bgColor: string
  hoverColor: string
  icon: LucideIcon
  shortcut: string
}

export const REVIEW_ACTIONS: Record<ReviewAction, ReviewActionConfig> = {
  approve: {
    label: 'Approve',
    targetStatus: 'approved',
    color: 'text-primary-foreground',
    bgColor: 'bg-success',
    hoverColor: 'hover:bg-success/90',
    icon: CheckCircle,
    shortcut: 'a',
  },
  reject: {
    label: 'Reject',
    targetStatus: 'rejected',
    color: 'text-destructive-foreground',
    bgColor: 'bg-destructive',
    hoverColor: 'hover:bg-destructive/90',
    icon: XCircle,
    shortcut: 'x',
  },
  request_changes: {
    label: 'Request Changes',
    targetStatus: 'changes_requested',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    hoverColor: 'hover:bg-warning/20',
    icon: AlertTriangle,
    shortcut: 'r',
  },
}
