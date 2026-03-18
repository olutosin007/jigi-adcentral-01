import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type ReviewQueueItem } from '@/hooks/useCampaignQueries'
import { formatDistanceToNow } from 'date-fns'

interface ReviewQueueCardProps {
  item: ReviewQueueItem
}

export function ReviewQueueCard({ item }: ReviewQueueCardProps) {
  const navigate = useNavigate()

  const assetTypes = item.assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const previewAssets = item.assets.slice(0, 3)
  const oldestAsset = item.assets[item.assets.length - 1]
  const waitingTime = oldestAsset?.created_at
    ? formatDistanceToNow(new Date(oldestAsset.created_at), { addSuffix: true })
    : null

  const handleStartReview = () => {
    if (item.assets.length > 0) {
      navigate(`/app/review/${item.assets[0].id}`)
    }
  }

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{item.campaignName}</CardTitle>
            {item.brandName && (
              <CardDescription>{item.brandName}</CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="bg-warning/10 text-warning">
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
              style={{ opacity: 1 - idx * 0.2 }}
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
        <div className="flex items-center justify-between">
          {waitingTime && (
            <span className="text-xs text-muted-foreground">
              Waiting {waitingTime}
            </span>
          )}
          <Button size="sm" onClick={handleStartReview}>
            Start Review
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
