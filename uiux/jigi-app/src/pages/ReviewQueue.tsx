import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Inbox, CheckCircle2, Clock, ArrowUpDown, Image as ImageIcon, FileText, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useReviewQueue, useRecentlyReviewed, type ReviewQueueItem } from '@/hooks/useCampaignQueries'
import { useAuthStore } from '@/store/authStore'
import { getStatusConfig, type AssetStatus } from '@/lib/status'
import { formatDistanceToNow } from 'date-fns'

const SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'campaign', label: 'Campaign name' },
] as const

export function ReviewQueue() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<string>('oldest')

  const { data: queueItems = [], isLoading } = useReviewQueue(
    statusFilter === 'all' ? undefined : { status: statusFilter }
  )
  const { data: recentlyReviewed = [] } = useRecentlyReviewed(user?.id || '')

  const sortedQueueItems = useMemo(() => {
    if (sortBy === 'campaign') {
      return [...queueItems].sort((a, b) => a.campaignName.localeCompare(b.campaignName))
    }
    return [...queueItems].sort((a, b) => {
      const oldestA = a.assets[a.assets.length - 1]?.created_at ?? ''
      const oldestB = b.assets[b.assets.length - 1]?.created_at ?? ''
      return new Date(oldestA).getTime() - new Date(oldestB).getTime()
    })
  }, [queueItems, sortBy])

  const totalPending = queueItems.reduce((sum, item) => sum + item.assetCount, 0)

  const handleStartReview = (item: ReviewQueueItem) => {
    if (item.assets.length > 0) {
      navigate(`/app/review/${item.assets[0].id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Review Queue</h1>
          <p className="text-muted-foreground">
            Review and approve creative assets
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{totalPending} pending review</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as AssetStatus | 'all')}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All pending</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="brand_review">Brand Review</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-1.5 shrink-0" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pending Your Review */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Inbox className="h-5 w-5 text-amber-500" />
          Pending Your Review
        </h2>

        {queueItems.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-12 w-12 text-success" />}
            title="All caught up!"
            description="No assets are waiting for your review."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedQueueItems.map((item) => (
              <ReviewQueueCard
                key={item.campaignId}
                item={item}
                onStartReview={() => handleStartReview(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recently Reviewed */}
      {recentlyReviewed.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Recently Reviewed
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recentlyReviewed.slice(0, 8).map((asset) => {
              const statusConfig = getStatusConfig(asset.status)
              const displayName =
                asset.type === 'concept'
                  ? (asset.content as { theme?: string })?.theme
                  : asset.type === 'copy'
                  ? (asset.content as { headline?: string })?.headline
                  : 'Image'
              const TypeIcon = asset.type === 'image' ? ImageIcon : asset.type === 'copy' ? FileText : Lightbulb
              return (
                <Card
                  key={asset.id}
                  className="cursor-pointer shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl"
                  onClick={() => navigate(`/app/review/${asset.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 bg-muted rounded-lg shrink-0">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate text-sm">{displayName}</p>
                          <p className="text-xs text-muted-foreground capitalize">{asset.type}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} shrink-0`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    {asset.reviewed_at && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Reviewed {formatDistanceToNow(new Date(asset.reviewed_at), { addSuffix: true })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

interface ReviewQueueCardProps {
  item: ReviewQueueItem
  onStartReview: () => void
}

function ReviewQueueCard({ item, onStartReview }: ReviewQueueCardProps) {
  const assetTypes = item.assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const previewAssets = item.assets.slice(0, 3)
  const oldestAsset = item.assets[item.assets.length - 1]
  const waitingTime = oldestAsset?.created_at
    ? formatDistanceToNow(new Date(oldestAsset.created_at), { addSuffix: true })
    : null

  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base">{item.campaignName}</CardTitle>
            {item.brandName && (
              <CardDescription className="truncate">{item.brandName}</CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
            {item.assetCount} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Asset Previews */}
        <div className="flex gap-2">
          {previewAssets.map((asset, idx) => (
            <div
              key={asset.id}
              className="w-16 h-16 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden"
              style={{ opacity: 1 - idx * 0.15 }}
            >
              {asset.type === 'image' && (asset.content as { url?: string })?.url ? (
                <img
                  src={(asset.content as { url: string }).url}
                  alt="Asset preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground capitalize">
                  {asset.type}
                </span>
              )}
            </div>
          ))}
          {item.assetCount > 3 && (
            <div className="w-16 h-16 rounded-lg bg-muted border border-border flex items-center justify-center">
              <span className="text-xs text-muted-foreground">
                +{item.assetCount - 3}
              </span>
            </div>
          )}
        </div>

        {/* Asset Type Breakdown */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(assetTypes).map(([type, count]) => (
            <Badge key={type} variant="outline" className="text-xs capitalize">
              {count} {type}
              {count > 1 ? 's' : ''}
            </Badge>
          ))}
        </div>

        {/* Waiting Time & Action */}
        <div className="flex items-center justify-between gap-2">
          {waitingTime && (
            <span className="text-xs text-muted-foreground">
              Waiting {waitingTime}
            </span>
          )}
          <Button size="sm" onClick={onStartReview} className="ml-auto">
            Start Review
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
