import type { AssetStatus } from '@/lib/status'

export type UserRole = 'admin' | 'approver' | 'reviewer' | 'creator'

export function isReviewerRole(role: string | undefined | null): role is UserRole {
  return role === 'admin' || role === 'approver' || role === 'reviewer'
}

export function isAssetInReviewPipeline(status: AssetStatus): boolean {
  return status === 'agency_review' || status === 'submitted' || status === 'brand_review'
}

/** Reviewers open the approval workspace; creators see read-only detail on the campaign. */
export function shouldOpenAssetReview(
  role: string | undefined | null,
  status: AssetStatus
): boolean {
  return isReviewerRole(role) && isAssetInReviewPipeline(status)
}
