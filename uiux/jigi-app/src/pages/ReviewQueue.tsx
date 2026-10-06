import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ChevronRight, Inbox as InboxIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AssetThumb } from '@/components/job/JobAssetRow'
import { useReviewQueue, useRecentlyReviewed } from '@/hooks/useCampaignQueries'
import { useAuthStore } from '@/store/authStore'
import { getAssetTitle } from '@/lib/handoff'

/** Authenticated approver home ("Inbox"). Route stays /app/review for link stability. */
export function ReviewQueue() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const campaignFilter = searchParams.get('campaign')
  const { user } = useAuthStore()

  const { data: queueItems = [], isLoading, isError, error, refetch } = useReviewQueue()
  const { data: recentlyReviewed = [] } = useRecentlyReviewed(user?.id || '')

  const groups = useMemo(() => {
    const items = campaignFilter
      ? queueItems.filter((item) => item.campaignId === campaignFilter)
      : queueItems
    const oldest = (assets: { updated_at: string }[]) =>
      Math.min(...assets.map((a) => new Date(a.updated_at).getTime()))
    return [...items]
      .map((item) => ({
        ...item,
        assets: [...item.assets].sort(
          (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        ),
      }))
      .sort((a, b) => oldest(a.assets) - oldest(b.assets))
  }, [queueItems, campaignFilter])

  const totalPending = groups.reduce((sum, item) => sum + item.assets.length, 0)

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-[960px] mx-auto space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-56" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[10px]" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 md:p-8 max-w-[960px] mx-auto">
        <EmptyState
          icon={InboxIcon}
          title="Couldn’t load your inbox"
          description={
            error instanceof Error ? error.message : 'Check your connection or permissions, then try again.'
          }
          action={{ label: 'Try again', onClick: () => void refetch() }}
        />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-[960px] mx-auto space-y-8" data-tour="review-queue">
      <div>
        <h1 className="text-[2rem] leading-tight font-serif font-semibold tracking-tight text-foreground">
          Inbox
        </h1>
        <p className="text-muted-foreground mt-1">
          {totalPending === 0
            ? 'Nothing needs your decision right now'
            : `${totalPending} need${totalPending === 1 ? 's' : ''} your decision · oldest first`}
        </p>
      </div>

      {campaignFilter && (
        <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <span className="text-foreground">Showing one campaign.</span>
          <Link to="/app/review" className="font-medium text-primary hover:underline">
            Show everything
          </Link>
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-7 w-7 text-success" />}
          title="All caught up"
          description="When the team sends creative for a decision, it lands here."
          action={
            campaignFilter ? { label: 'Show everything', onClick: () => navigate('/app/review') } : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.campaignId} aria-label={group.campaignName} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {group.campaignName}
                  {group.brandName && (
                    <span className="font-normal text-muted-foreground"> · {group.brandName}</span>
                  )}
                </h2>
                <span className="text-xs text-muted-foreground">{group.assets.length} waiting</span>
              </div>
              <ul className="space-y-2">
                {group.assets.map((asset) => (
                  <li key={asset.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/app/review/${asset.id}`)}
                      className="group flex w-full items-center gap-3 rounded-[10px] border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                    >
                      <AssetThumb asset={asset} className="h-14 w-14" />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {getAssetTitle(asset)}
                        </span>
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          <span className="capitalize">{asset.type}</span> · Version {asset.version ?? 1} · waiting{' '}
                          {formatDistanceToNow(new Date(asset.updated_at))}
                        </span>
                      </span>
                      <StatusBadge status={asset.status} audience="client" />
                      <span className="hidden sm:inline-flex items-center text-sm font-medium text-primary">
                        Review
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {recentlyReviewed.length > 0 && (
        <section className="space-y-2" aria-label="Decided recently">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Decided recently
          </h2>
          <ul className="divide-y divide-border rounded-[10px] border border-border bg-card">
            {recentlyReviewed.slice(0, 6).map((asset) => (
              <li key={asset.id} className="flex items-center gap-3 px-3 py-2">
                <AssetThumb asset={asset} className="h-9 w-9" />
                <span className="flex-1 min-w-0 truncate text-sm">{getAssetTitle(asset)}</span>
                {asset.reviewed_at && (
                  <span className="hidden sm:inline text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(asset.reviewed_at), { addSuffix: true })}
                  </span>
                )}
                <StatusBadge status={asset.status} audience="client" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={() => navigate(`/app/review/${groups[0].assets[0].id}`)}>
            Start with the oldest
          </Button>
        </div>
      )}
    </div>
  )
}
