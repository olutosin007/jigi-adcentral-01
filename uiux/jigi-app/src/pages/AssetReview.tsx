import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  FileQuestion,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AssetPreviewArea } from '@/components/review/AssetPreviewArea'
import { AssetDetailsSidebar } from '@/components/review/AssetDetailsSidebar'
import { ReviewActions } from '@/components/review/ReviewActions'
import { ApproveModal, RejectModal, RequestChangesModal } from '@/components/review'
import { EmptyState } from '@/components/ui/empty-state'
import {
  useAssetWithReviewContext,
  useReviewAsset,
  useReviewQueue,
  useCheckCompliance,
  useValidateAsset,
  useAssetComments,
  useAddComment,
  useResolveComment,
  useDeleteComment,
} from '@/hooks/useCampaignQueries'
import { useAuthStore } from '@/store/authStore'
import { getStatusConfig, isPendingReview, type ReviewAction } from '@/lib/status'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function AssetReview() {
  const { assetId } = useParams<{ assetId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showChangesModal, setShowChangesModal] = useState(false)

  const {
    data: asset,
    isLoading: assetLoading,
    error: assetError,
  } = useAssetWithReviewContext(assetId || '')

  const { data: queueItems = [] } = useReviewQueue()

  const {
    data: comments = [],
    isLoading: isLoadingComments,
  } = useAssetComments(assetId || '')

  const reviewMutation = useReviewAsset()
  const complianceMutation = useCheckCompliance()
  const validateAssetMutation = useValidateAsset()
  const addCommentMutation = useAddComment()
  const resolveCommentMutation = useResolveComment()
  const deleteCommentMutation = useDeleteComment()

  const allQueueAssets = queueItems.flatMap((item) => item.assets)
  const currentIndex = allQueueAssets.findIndex((a) => a.id === assetId)
  const totalAssets = allQueueAssets.length

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      navigate(`/app/review/${allQueueAssets[currentIndex - 1].id}`)
    }
  }, [currentIndex, allQueueAssets, navigate])

  const goToNext = useCallback(() => {
    if (currentIndex < allQueueAssets.length - 1) {
      navigate(`/app/review/${allQueueAssets[currentIndex + 1].id}`)
    }
  }, [currentIndex, allQueueAssets, navigate])

  const goToQueue = useCallback(() => {
    navigate('/app/review')
  }, [navigate])

  const handleReview = async (action: ReviewAction, notes?: string) => {
    if (!asset || !user) return

    try {
      await reviewMutation.mutateAsync({
        assetId: asset.id,
        campaignId: asset.campaign_id,
        userId: user.id,
        action,
        notes,
      })

      const actionLabels: Record<ReviewAction, string> = {
        approve: 'approved',
        reject: 'rejected',
        request_changes: 'Changes requested',
      }

      toast.success(`Asset ${actionLabels[action]}`)

      setShowApproveModal(false)
      setShowRejectModal(false)
      setShowChangesModal(false)

      if (currentIndex < allQueueAssets.length - 1) {
        goToNext()
      } else {
        goToQueue()
      }
    } catch (error) {
      toast.error('Failed to submit review')
      console.error('Review error:', error)
    }
  }

  const handleAddComment = async (content: string) => {
    if (!assetId || !user) return
    try {
      await addCommentMutation.mutateAsync({
        assetId,
        userId: user.id,
        content,
      })
      toast.success('Comment added')
    } catch (error) {
      toast.error('Failed to add comment')
      console.error('Add comment error:', error)
    }
  }

  const handleReplyComment = async (commentId: string, content: string) => {
    if (!assetId || !user) return
    try {
      await addCommentMutation.mutateAsync({
        assetId,
        userId: user.id,
        content,
        parentCommentId: commentId,
      })
      toast.success('Reply added')
    } catch (error) {
      toast.error('Failed to add reply')
      console.error('Reply comment error:', error)
    }
  }

  const handleResolveComment = async (commentId: string) => {
    if (!assetId || !user) return
    try {
      await resolveCommentMutation.mutateAsync({
        commentId,
        assetId,
        userId: user.id,
      })
      toast.success('Comment resolved')
    } catch (error) {
      toast.error('Failed to resolve comment')
      console.error('Resolve comment error:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!assetId) return
    try {
      await deleteCommentMutation.mutateAsync({
        commentId,
        assetId,
      })
      toast.success('Comment deleted')
    } catch (error) {
      toast.error('Failed to delete comment')
      console.error('Delete comment error:', error)
    }
  }

  const openModalForAction = (action: ReviewAction) => {
    switch (action) {
      case 'approve':
        setShowApproveModal(true)
        break
      case 'reject':
        setShowRejectModal(true)
        break
      case 'request_changes':
        setShowChangesModal(true)
        break
    }
  }

  const handleCheckCompliance = async () => {
    if (!asset || !asset.campaign?.brand_id) return

    try {
      const contentText =
        asset.type === 'concept'
          ? JSON.stringify(asset.content)
          : asset.type === 'copy'
          ? `${(asset.content as { headline?: string })?.headline} ${(asset.content as { body?: string })?.body}`
          : (asset.content as { prompt_used?: string })?.prompt_used || ''

      await complianceMutation.mutateAsync({
        assetId: asset.id,
        campaignId: asset.campaign_id,
        content: contentText,
        brandId: asset.campaign.brand_id,
      })

      toast.success('Compliance check complete')
    } catch (error) {
      toast.error('Failed to run compliance check')
      console.error('Compliance error:', error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (showApproveModal || showRejectModal || showChangesModal) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'a':
          if (asset && isPendingReview(asset.status)) {
            setShowApproveModal(true)
          }
          break
        case 'r':
          if (asset && isPendingReview(asset.status)) {
            setShowChangesModal(true)
          }
          break
        case 'x':
          if (asset && isPendingReview(asset.status)) {
            setShowRejectModal(true)
          }
          break
        case 'n':
        case 'arrowright':
          goToNext()
          break
        case 'p':
        case 'arrowleft':
          goToPrevious()
          break
        case 'escape':
          goToQueue()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [asset, goToNext, goToPrevious, goToQueue, showApproveModal, showRejectModal, showChangesModal])

  if (assetLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="flex flex-col gap-3 w-full max-w-md px-6">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-8 bg-muted rounded animate-pulse w-1/2" />
          <div className="h-64 bg-muted rounded-lg animate-pulse mt-6" />
          <div className="h-24 bg-muted rounded animate-pulse w-full mt-4" />
        </div>
        <p className="text-sm text-muted-foreground">Loading asset...</p>
      </div>
    )
  }

  if (assetError || !asset) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <EmptyState
          icon={FileQuestion}
          title="Asset not found"
          description="This asset may have been removed or you don’t have access."
          action={{ label: 'Back to queue', onClick: goToQueue }}
        />
      </div>
    )
  }

  const statusConfig = getStatusConfig(asset.status)
  const canReview = isPendingReview(asset.status)

  const assetName =
    asset.type === 'concept'
      ? (asset.content as { theme?: string })?.theme
      : asset.type === 'copy'
      ? (asset.content as { headline?: string })?.headline
      : 'Image Asset'

  return (
    <div
      className={cn(
        'flex flex-col h-[calc(100vh-4rem)]',
        canReview && 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0'
      )}
    >
      {/* Top Navigation Bar - Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 border-b bg-background">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={goToQueue} className="h-auto p-0 text-muted-foreground hover:text-primary font-medium">
            Review Queue
          </Button>
          <span className="text-muted-foreground">/</span>
          {asset.campaign && (
            <>
              <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-[200px]" title={asset.campaign.name}>
                {asset.campaign.name}
              </span>
              <span className="text-muted-foreground">/</span>
            </>
          )}
          <span className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-none" title={assetName}>
            {assetName}
          </span>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-muted" aria-label="Keyboard shortcuts">
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="w-56">
                <div className="space-y-2 text-xs">
                  <p className="font-medium">Keyboard Shortcuts</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span><kbd className="px-1 bg-muted rounded">A</kbd> Approve</span>
                    <span><kbd className="px-1 bg-muted rounded">R</kbd> Request Changes</span>
                    <span><kbd className="px-1 bg-muted rounded">X</kbd> Reject</span>
                    <span><kbd className="px-1 bg-muted rounded">←</kbd> Previous</span>
                    <span><kbd className="px-1 bg-muted rounded">→</kbd> Next</span>
                    <span><kbd className="px-1 bg-muted rounded">Esc</kbd> Back</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left Navigation Strip - Prev/Next */}
        {totalAssets > 1 && (
          <div className="lg:w-14 flex-shrink-0 flex flex-row lg:flex-col items-center justify-center gap-3 border-b lg:border-b-0 lg:border-r bg-muted/30 py-3 lg:py-6 px-4 lg:px-0" aria-label="Asset navigation">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex <= 0}
              aria-label="Previous asset"
              className="hover:bg-muted transition-colors"
            >
              <ChevronUp className="h-4 w-4 hidden lg:block" />
              <ChevronLeft className="h-4 w-4 lg:hidden" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-bold">{currentIndex + 1}</p>
              <div className="w-px h-3 bg-border mx-auto my-1 hidden lg:block" />
              <p className="text-xs text-muted-foreground">{totalAssets}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex >= totalAssets - 1}
              aria-label="Next asset"
              className="hover:bg-muted transition-colors"
            >
              <ChevronDown className="h-4 w-4 hidden lg:block" />
              <ChevronRight className="h-4 w-4 lg:hidden" />
            </Button>
          </div>
        )}

        {/* Main Preview Area */}
        <div className="flex-1 overflow-hidden bg-background min-h-0">
          <AssetPreviewArea
            asset={asset}
            generationMode={asset.campaign?.generation_mode as 'brand_grounded' | 'idea_first' | undefined}
          />
        </div>

        {/* Right Sidebar - Details (stacks below on mobile) */}
        <div className="w-full lg:w-96 flex-shrink-0 min-h-0 overflow-hidden">
        <AssetDetailsSidebar
          asset={asset}
          onCheckCompliance={handleCheckCompliance}
          isCheckingCompliance={complianceMutation.isPending}
          onRevalidate={
            asset?.campaign_id
              ? () =>
                  validateAssetMutation.mutate(
                    { assetId: asset.id, campaignId: asset.campaign_id },
                    {
                      onSuccess: () => toast.success('Validation complete'),
                      onError: () => toast.error('Validation failed'),
                    }
                  )
              : undefined
          }
          isRevalidating={validateAssetMutation.isPending}
          comments={comments}
          isLoadingComments={isLoadingComments}
          isSubmittingComment={addCommentMutation.isPending}
          currentUserId={user?.id}
          currentUserName={user?.user_metadata?.full_name || 'User'}
          onAddComment={handleAddComment}
          onReplyComment={handleReplyComment}
          onResolveComment={handleResolveComment}
          onDeleteComment={handleDeleteComment}
        />
        </div>
      </div>

      {/* Approval Modals */}
      <ApproveModal
        open={showApproveModal}
        onOpenChange={setShowApproveModal}
        onConfirm={(notes) => handleReview('approve', notes)}
        assetName={
          asset.type === 'concept'
            ? (asset.content as { theme?: string })?.theme
            : asset.type === 'copy'
            ? (asset.content as { headline?: string })?.headline
            : 'Image Asset'
        }
        isLoading={reviewMutation.isPending}
      />

      <RejectModal
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
        onConfirm={(reason) => handleReview('reject', reason)}
        assetName={
          asset.type === 'concept'
            ? (asset.content as { theme?: string })?.theme
            : asset.type === 'copy'
            ? (asset.content as { headline?: string })?.headline
            : 'Image Asset'
        }
        isLoading={reviewMutation.isPending}
      />

      <RequestChangesModal
        open={showChangesModal}
        onOpenChange={setShowChangesModal}
        onConfirm={(feedback) => handleReview('request_changes', feedback)}
        assetName={
          asset.type === 'concept'
            ? (asset.content as { theme?: string })?.theme
            : asset.type === 'copy'
            ? (asset.content as { headline?: string })?.headline
            : 'Image Asset'
        }
        isLoading={reviewMutation.isPending}
      />

      {/* Bottom action bar — fixed on mobile, in-flow on lg+ */}
      {canReview && (
        <div
          className={cn(
            'flex-shrink-0 bg-background border-t px-4 sm:px-6 py-3 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]',
            'fixed bottom-0 inset-x-0 z-40 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            'lg:static lg:z-auto lg:pb-4'
          )}
          data-tour="review-mobile-bar"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-[1400px] mx-auto">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Asset {currentIndex + 1} of {totalAssets}
              </span>
              {asset.campaign && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[200px]">{asset.campaign.name}</span>
                </>
              )}
            </div>
            <div className="w-full sm:w-auto sm:min-w-[min(100%,28rem)] sm:flex-1 lg:flex-none lg:w-1/2">
              <ReviewActions
                onReview={openModalForAction}
                isReviewing={reviewMutation.isPending}
                disabled={!canReview}
                approveBlocked={
                  (asset.type === 'copy' &&
                    (asset.content as { exclusions_violated?: boolean })?.exclusions_violated === true) ||
                  (asset.type === 'image' &&
                    (asset.content as { safe_zones_violated?: boolean })?.safe_zones_violated === true)
                }
                approveBlockedReason={
                  asset.type === 'copy'
                    ? 'Exclusions violated. Resolve before approving.'
                    : asset.type === 'image'
                    ? 'Safe zones not clear. Resolve before approving.'
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
