import { describe, it, expect } from 'vitest'
import { isReviewerRole, isAssetInReviewPipeline, shouldOpenAssetReview } from './roles'

describe('roles', () => {
  it('isReviewerRole recognizes admin, approver, reviewer', () => {
    expect(isReviewerRole('admin')).toBe(true)
    expect(isReviewerRole('approver')).toBe(true)
    expect(isReviewerRole('reviewer')).toBe(true)
    expect(isReviewerRole('creator')).toBe(false)
    expect(isReviewerRole(undefined)).toBe(false)
  })

  it('shouldOpenAssetReview only for reviewers on in-review statuses', () => {
    expect(shouldOpenAssetReview('reviewer', 'submitted')).toBe(true)
    expect(shouldOpenAssetReview('creator', 'submitted')).toBe(false)
    expect(shouldOpenAssetReview('reviewer', 'draft')).toBe(false)
  })

  it('isAssetInReviewPipeline covers agency and brand review states', () => {
    expect(isAssetInReviewPipeline('agency_review')).toBe(true)
    expect(isAssetInReviewPipeline('brand_review')).toBe(true)
    expect(isAssetInReviewPipeline('approved')).toBe(false)
  })
})
