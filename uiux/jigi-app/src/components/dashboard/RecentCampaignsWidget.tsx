import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, FolderOpen, Sparkles, Palette } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { BriefIncompleteBanner } from '@/components/campaign/BriefIncompleteBanner'
import type { RecentCampaignItem } from '@/hooks/useDashboardQueries'

interface RecentCampaignsWidgetProps {
  campaigns?: RecentCampaignItem[]
  isLoading?: boolean
}

export function RecentCampaignsWidget({ campaigns = [], isLoading }: RecentCampaignsWidgetProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Card className="shadow-[var(--shadow-card)] border-border rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No campaigns yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first campaign to start generating creative.</p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => navigate('/app/campaigns/new')}
            >
              New Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Recent Campaigns</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => navigate('/app/campaigns')}
        >
          View all <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {campaigns.map((campaign) => {
          const progress = campaign.totalAssets > 0
            ? Math.round((campaign.approvedAssets / campaign.totalAssets) * 100)
            : 0

          return (
            <div
              key={campaign.id}
              className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200 cursor-pointer"
              onClick={() => navigate(`/app/campaigns/${campaign.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{campaign.name}</p>
                  {campaign.brandName && (
                    <p className="text-xs text-muted-foreground truncate">{campaign.brandName}</p>
                  )}
                </div>
                {campaign.generationMode && (
                  <Badge
                    variant="outline"
                    className={
                      campaign.generationMode === 'brand_grounded'
                        ? 'border-purple-200 text-purple-700 bg-purple-50'
                        : 'border-amber-200 text-amber-700 bg-amber-50'
                    }
                  >
                    {campaign.generationMode === 'brand_grounded' ? (
                      <Palette className="h-3 w-3 mr-1" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    {campaign.generationMode === 'brand_grounded' ? 'Brand' : 'Idea'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Progress value={progress} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {campaign.approvedAssets}/{campaign.totalAssets} approved
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Updated {formatDistanceToNow(new Date(campaign.updatedAt), { addSuffix: true })}
              </p>
              {campaign.briefReady === false && (
                <BriefIncompleteBanner
                  readiness={{ ready: false, missing: ['Brief incomplete'], warnings: [] }}
                  compact
                />
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
