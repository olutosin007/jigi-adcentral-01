import { useState } from 'react'
import { ExternalLink, Calendar, User, Folder, Tag, MessageSquare, RefreshCw, GitBranch, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ComplianceDisplay } from '@/components/generation/ComplianceDisplay'
import { DriftBadge } from '@/components/generation/DriftBadge'
import { StatusHistoryTimeline } from './StatusHistoryTimeline'
import { CommentsSidebar, type Comment } from '@/components/comments'
import { getStatusConfig } from '@/lib/status'
import { formatDistanceToNow, format } from 'date-fns'
import type { AssetWithReviewContext, StatusHistoryEntry, AssetComment } from '@/hooks/useCampaignQueries'
import type { ComplianceResult } from '@/lib/ai'

interface AssetDetailsSidebarProps {
  asset: AssetWithReviewContext
  onCheckCompliance?: () => void
  isCheckingCompliance?: boolean
  onRevalidate?: () => void
  isRevalidating?: boolean
  comments?: AssetComment[]
  isLoadingComments?: boolean
  isSubmittingComment?: boolean
  currentUserId?: string
  currentUserName?: string
  currentUserAvatar?: string
  onAddComment?: (content: string) => void
  onReplyComment?: (commentId: string, content: string) => void
  onResolveComment?: (commentId: string) => void
  onDeleteComment?: (commentId: string) => void
}

function mapAssetCommentsToComments(assetComments: AssetComment[]): Comment[] {
  return assetComments.map((c) => ({
    id: c.id,
    content: c.content,
    user_id: c.user_id,
    user_name: c.user_name || 'Unknown User',
    user_avatar: c.user_avatar,
    created_at: c.created_at,
    resolved: c.resolved,
    resolved_by: c.resolved_by || undefined,
    resolved_at: c.resolved_at || undefined,
    replies: c.replies ? mapAssetCommentsToComments(c.replies) : [],
  }))
}

export function AssetDetailsSidebar({
  asset,
  onCheckCompliance,
  isCheckingCompliance,
  onRevalidate,
  isRevalidating,
  comments = [],
  isLoadingComments = false,
  isSubmittingComment = false,
  currentUserId,
  currentUserName = 'User',
  currentUserAvatar,
  onAddComment,
  onReplyComment,
  onResolveComment,
  onDeleteComment,
}: AssetDetailsSidebarProps) {
  const [showComments, setShowComments] = useState(false)
  const statusConfig = getStatusConfig(asset.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-muted/30 overflow-y-auto h-full" data-tour="asset-details">
      <div className="p-6 space-y-6">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center`}>
                <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                    {statusConfig.label}
                  </Badge>
                  {asset.drift_status === 'review_required' && (
                    <DriftBadge tooltip="Brief updated after this asset was generated. Re-validate to update scores and clear this flag." />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {statusConfig.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow
              icon={Tag}
              label="Type"
              value={<span className="capitalize">{asset.type}</span>}
            />
            <DetailRow
              icon={Calendar}
              label="Created"
              value={
                asset.created_at
                  ? format(new Date(asset.created_at), 'MMM d, yyyy')
                  : '-'
              }
            />
            {asset.created_at && (
              <p className="text-xs text-muted-foreground pl-7">
                {formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
              </p>
            )}
            {asset.campaign && (
              <DetailRow
                icon={Folder}
                label="Campaign"
                value={
                  <Link
                    to={`/app/campaigns/${asset.campaign.id}`}
                    className="text-primary hover:underline"
                  >
                    {asset.campaign.name}
                  </Link>
                }
              />
            )}
            {asset.brand && (
              <DetailRow
                icon={ExternalLink}
                label="Brand"
                value={
                  <Link
                    to={`/app/brands/${asset.brand.id}`}
                    className="text-primary hover:underline"
                  >
                    {asset.brand.name}
                  </Link>
                }
              />
            )}
            {asset.reviewed_by && (
              <DetailRow
                icon={User}
                label="Reviewed By"
                value={asset.reviewed_by}
              />
            )}
            {(asset.cco_version != null || asset.bio_version != null || asset.generation_timestamp) && (
              <>
                <div className="pt-2 mt-2 border-t border-border" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider pl-7 mb-2">
                  Asset Lineage (PRD 10)
                </p>
                {asset.cco_version != null && (
                  <DetailRow
                    icon={GitBranch}
                    label="CCO Version"
                    value={`v${asset.cco_version}`}
                  />
                )}
                {asset.bio_version != null && (
                  <DetailRow
                    icon={GitBranch}
                    label="BIO Version"
                    value={`v${asset.bio_version}`}
                  />
                )}
                {asset.generation_timestamp && (
                  <DetailRow
                    icon={Clock}
                    label="Generated"
                    value={format(new Date(asset.generation_timestamp), 'MMM d, yyyy HH:mm')}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Submission Note */}
        {asset.submission_note && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Submission Note</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-3">
                {asset.submission_note}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Review Notes */}
        {asset.review_notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Review Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground bg-muted rounded-lg p-3">
                {asset.review_notes}
              </p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Validation Pipeline (PRD 09) */}
        {onRevalidate && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Re-run CCO/BIO validation for this asset.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full hover:bg-muted transition-colors"
                onClick={onRevalidate}
                disabled={isRevalidating}
              >
                {isRevalidating ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Re-validate
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Compliance Check */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Compliance Check</CardTitle>
          </CardHeader>
          <CardContent>
            <ComplianceDisplay
              result={(asset.compliance_check as ComplianceResult) || null}
              isLoading={isCheckingCompliance}
              onRecheck={onCheckCompliance}
            />
            {!asset.compliance_check && !isCheckingCompliance && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 hover:bg-muted transition-colors"
                onClick={onCheckCompliance}
              >
                Run Compliance Check
              </Button>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Status History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusHistoryTimeline
              history={asset.statusHistory as StatusHistoryEntry[] | undefined}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Comments Section Toggle */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
                {comments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {comments.length}
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="hover:bg-muted transition-colors"
              >
                {showComments ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          {showComments && onAddComment && onReplyComment && onResolveComment && onDeleteComment && (
            <CardContent className="pt-0">
              <div className="border rounded-lg overflow-hidden -mx-2">
                <CommentsSidebar
                  assetId={asset.id}
                  comments={mapAssetCommentsToComments(comments)}
                  isLoading={isLoadingComments}
                  isSubmitting={isSubmittingComment}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  currentUserAvatar={currentUserAvatar}
                  onAddComment={onAddComment}
                  onReplyComment={onReplyComment}
                  onResolveComment={onResolveComment}
                  onDeleteComment={onDeleteComment}
                />
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground w-20">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
