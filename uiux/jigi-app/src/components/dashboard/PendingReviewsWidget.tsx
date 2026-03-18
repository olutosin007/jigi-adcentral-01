import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Clock, ArrowRight, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { PendingReviewItem } from '@/hooks/useDashboardQueries'

interface PendingReviewsWidgetProps {
  reviews?: PendingReviewItem[]
  isLoading?: boolean
}

export function PendingReviewsWidget({ reviews = [], isLoading }: PendingReviewsWidgetProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Card className="shadow-[var(--shadow-card)] border-border rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Pending Your Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <p className="font-medium text-foreground">You&apos;re all caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No assets waiting for your review.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Pending Your Review</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => navigate('/app/review')}
        >
          View all <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.slice(0, 5).map((review) => (
          <div
            key={review.campaignId}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200 cursor-pointer"
            onClick={() => navigate(`/app/review?campaign=${review.campaignId}`)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{review.campaignName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {review.assetCount} asset{review.assetCount !== 1 ? 's' : ''}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(review.oldestPendingAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 ml-3"
              onClick={(e) => {
                e.stopPropagation()
                if (review.assets[0]) {
                  navigate(`/app/review/${review.assets[0].id}`)
                }
              }}
            >
              Review
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
