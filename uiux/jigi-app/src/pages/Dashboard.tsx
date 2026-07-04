import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Sparkles, Palette, FolderPlus, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { isReviewerRole } from '@/lib/roles'
import {
  QuickStatsWidget,
  PendingReviewsWidget,
  RecentCampaignsWidget,
  GenerationMixCard,
} from '@/components/dashboard'
import {
  useDashboardStats,
  usePendingReviews,
  useRecentCampaigns,
  useGenerationMixStats,
} from '@/hooks/useDashboardQueries'

function getUserDisplayName(
  user: { user_metadata?: { full_name?: string; name?: string }; email?: string } | null,
  profile: { name?: string | null } | null
): string {
  const fromProfile = profile?.name?.trim()
  if (fromProfile) {
    return fromProfile.split(/\s+/)[0] ?? 'there'
  }
  const fromMetadata = user?.user_metadata?.full_name ?? user?.user_metadata?.name
  if (fromMetadata) {
    return (typeof fromMetadata === 'string' ? fromMetadata : '').split(/\s+/)[0] ?? 'there'
  }
  const fromEmail = user?.email?.split('@')[0]
  if (fromEmail) return fromEmail
  return 'there'
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const userId = user?.id ?? ''
  const userName = getUserDisplayName(user, profile)

  const { data: stats, isLoading: statsLoading } = useDashboardStats(userId)
  const { data: pendingReviews, isLoading: pendingLoading } = usePendingReviews()
  const { data: recentCampaigns, isLoading: campaignsLoading } = useRecentCampaigns(5)
  const { data: generationMix, isLoading: mixLoading } = useGenerationMixStats()

  const greeting = getGreeting()
  const todayDate = format(new Date(), 'EEEE, d MMMM')
  const pendingCount = stats?.pendingReview ?? 0
  const isReviewer = isReviewerRole(profile?.role)
  const isCreator = !isReviewer
  const reviewerFirst = isReviewer && pendingCount > 0

  const recentCampaignsProminent = isCreator ? (
    <div
      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100"
      style={{ animationDelay: '150ms' }}
    >
      <RecentCampaignsWidget campaigns={recentCampaigns} isLoading={campaignsLoading} />
    </div>
  ) : null

  const pendingReviewsSection = (
    <div
      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100"
      style={{ animationDelay: reviewerFirst ? '150ms' : isCreator ? '300ms' : '225ms' }}
    >
      <div className={reviewerFirst ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}>
        <div className={reviewerFirst ? '' : 'lg:col-span-2'}>
          <PendingReviewsWidget reviews={pendingReviews} isLoading={pendingLoading} />
        </div>
        {!reviewerFirst && !isCreator && (
          <div className="space-y-6">
            <RecentCampaignsWidget campaigns={recentCampaigns} isLoading={campaignsLoading} />
            <GenerationMixCard stats={generationMix} isLoading={mixLoading} />
          </div>
        )}
      </div>
    </div>
  )

  const statsSection = (
    <div
      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100"
      style={{ animationDelay: reviewerFirst ? '225ms' : isCreator ? '225ms' : '150ms' }}
    >
      <QuickStatsWidget stats={stats} isLoading={statsLoading} />
    </div>
  )

  const creatorMixSection = isCreator ? (
    <div
      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100"
      style={{ animationDelay: '375ms' }}
    >
      <GenerationMixCard stats={generationMix} isLoading={mixLoading} />
    </div>
  ) : null

  const secondaryGridSection = reviewerFirst ? (
    <div
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100"
      style={{ animationDelay: '300ms' }}
    >
      <div className="lg:col-span-2">
        <RecentCampaignsWidget campaigns={recentCampaigns} isLoading={campaignsLoading} />
      </div>
      <div>
        <GenerationMixCard stats={generationMix} isLoading={mixLoading} />
      </div>
    </div>
  ) : null

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-10">
      {/* Welcome Header */}
      <div
        className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100"
        style={{ animationDelay: '0ms' }}
      >
        <p className="text-sm text-muted-foreground mb-1">{todayDate}</p>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          {greeting}, {userName}
        </h1>
        <p className="text-muted-foreground">
          {isCreator
            ? 'Pick up where you left off on your campaigns.'
            : "Here's what's happening with your creative workflows today."}
        </p>
      </div>

      {/* Quick Actions */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100"
        style={{ animationDelay: '75ms' }}
      >
        <Button
          onClick={() => navigate('/app/campaigns/new')}
          size="lg"
          className="gap-2 transition-colors duration-200 h-11 px-5"
        >
          <FolderPlus className="h-4 w-4" />
          New Campaign
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/app/campaigns/new?mode=idea_first')}
            className="gap-2 transition-colors duration-200"
          >
            <Sparkles className="h-4 w-4" />
            Quick Idea
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/app/brands')}
            className="gap-2 transition-colors duration-200"
          >
            <Palette className="h-4 w-4" />
            Manage Brands
          </Button>
          {pendingCount > 0 && isReviewerRole(profile?.role) && (
            <Button
              variant="outline"
              onClick={() => navigate('/app/review')}
              className="gap-2 border-warning/30 text-warning bg-warning/10 hover:bg-warning/20 hover:border-warning/50 transition-colors duration-200"
            >
              <Clock className="h-4 w-4" />
              {pendingCount} Pending Review{pendingCount !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>

      {reviewerFirst ? (
        <>
          {pendingReviewsSection}
          {statsSection}
          {secondaryGridSection}
        </>
      ) : isCreator ? (
        <>
          {recentCampaignsProminent}
          {statsSection}
          {pendingReviewsSection}
          {creatorMixSection}
        </>
      ) : (
        <>
          {statsSection}
          {pendingReviewsSection}
        </>
      )}
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
