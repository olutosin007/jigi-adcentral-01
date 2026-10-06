import { useState } from 'react'
import { MessageSquareWarning, Send, Hourglass, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { CreativeAsset } from '@/store/campaignStore'
import {
  HANDOFF_TONE_CLASSES,
  describeReviewLink,
  type BrandKitLevel,
  type ReviewLinkLike,
} from '@/lib/handoff'
import { cn } from '@/lib/utils'
import { JobAssetRow } from './JobAssetRow'

interface JobDecisionsStageProps {
  assets: CreativeAsset[]
  onOpenAsset?: (asset: CreativeAsset) => void
  onResend?: (asset: CreativeAsset) => void
  onGoToSend?: () => void
  brandKit?: BrandKitLevel
  links?: Map<string, ReviewLinkLike>
  onShare?: (asset: CreativeAsset) => void
  onRevokeLink?: (linkId: string) => void
}

type SourceFilter = 'all' | 'ai' | 'uploaded'

const SOURCE_FILTERS: { id: SourceFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI' },
  { id: 'uploaded', label: 'Uploaded' },
]

function matchesSource(asset: CreativeAsset, filter: SourceFilter) {
  if (filter === 'all') return true
  return filter === 'uploaded' ? asset.source === 'uploaded' : asset.source !== 'uploaded'
}

function bucket(assets: CreativeAsset[], statuses: string[]) {
  return assets
    .filter((a) => statuses.includes(a.status))
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
}

export function JobDecisionsStage({
  assets,
  onOpenAsset,
  onResend,
  onGoToSend,
  brandKit,
  links,
  onShare,
  onRevokeLink,
}: JobDecisionsStageProps) {
  const linkMeta = (asset: CreativeAsset) => {
    const link = links?.get(asset.id)
    if (!link) return null
    const view = describeReviewLink(link)
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
          HANDOFF_TONE_CLASSES[view.tone]
        )}
        data-testid="link-status"
      >
        <Link2 className="h-3 w-3" aria-hidden />
        {view.label}
      </span>
    )
  }
  const waitingTrailing = (asset: CreativeAsset) => {
    const link = links?.get(asset.id)
    const view = link ? describeReviewLink(link) : null
    return (
      <div className="flex items-center gap-1">
        {view?.canRevoke && onRevokeLink && link && (
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => onRevokeLink(link.id)}>
            Revoke
          </Button>
        )}
        {onShare && (
          <Button size="sm" variant="outline" onClick={() => onShare(asset)}>
            <Link2 className="h-3.5 w-3.5 mr-1" aria-hidden />
            {view?.canRevoke ? 'New link' : 'Share link'}
          </Button>
        )}
      </div>
    )
  }
  const [source, setSource] = useState<SourceFilter>('all')
  const inFlight = assets.filter((a) =>
    ['changes_requested', 'submitted', 'brand_review', 'agency_review', 'rejected'].includes(a.status)
  )
  const hasMixedSources =
    inFlight.some((a) => a.source === 'uploaded') && inFlight.some((a) => a.source !== 'uploaded')
  const visible = inFlight.filter((a) => matchesSource(a, source))
  const changes = bucket(visible, ['changes_requested'])
  const waiting = bucket(visible, ['submitted', 'brand_review'])
  const internal = bucket(visible, ['agency_review'])
  const declined = bucket(visible, ['rejected'])
  const total = inFlight.length

  if (total === 0) {
    return (
      <div className="p-6 overflow-y-auto h-full">
        <EmptyState
          icon={Hourglass}
          title="No decisions in flight"
          description="Send creative for approval and decisions will collect here."
          action={onGoToSend ? { label: 'Go to Send', onClick: onGoToSend } : undefined}
        />
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full space-y-6" data-tour="decisions-stage">
      <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Decisions</h2>
        <p className="text-sm text-muted-foreground">
          {changes.length > 0
            ? `${changes.length} need${changes.length === 1 ? 's' : ''} your fix`
            : waiting.length > 0
              ? `${waiting.length} waiting on client`
              : 'Nothing waiting on you'}
        </p>
      </div>
        {hasMixedSources && (
          <div role="radiogroup" aria-label="Filter by source" className="inline-flex rounded-lg border border-border bg-muted p-0.5">
            {SOURCE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={source === f.id}
                onClick={() => setSource(f.id)}
                className={cn(
                  'px-2.5 py-0.5 text-xs rounded-md',
                  source === f.id ? 'bg-card text-foreground font-medium shadow-sm' : 'text-muted-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {changes.length > 0 && (
        <section className="space-y-2" aria-label="Fix and resend">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">Fix & resend</p>
          {changes.map((asset) => (
            <div key={asset.id} className="space-y-1.5">
              <JobAssetRow
                brandKit={brandKit}
                asset={asset}
                onOpen={onOpenAsset ? () => onOpenAsset(asset) : undefined}
                timestampLabel="Returned"
                meta={linkMeta(asset)}
                trailing={
                  onResend && (
                    <Button size="sm" variant="outline" onClick={() => onResend(asset)}>
                      <Send className="h-3.5 w-3.5 mr-1" aria-hidden />
                      Resend
                    </Button>
                  )
                }
              />
              {asset.review_notes && (
                <div className="ml-3 flex gap-2 rounded-md border-l-2 border-warning bg-warning/5 px-3 py-2 text-sm text-foreground">
                  <MessageSquareWarning className="h-4 w-4 shrink-0 text-warning mt-0.5" aria-hidden />
                  <p className="whitespace-pre-line">{asset.review_notes}</p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {waiting.length > 0 && (
        <section className="space-y-2" aria-label="Waiting on client">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#B45309] dark:text-[#FBBF24]">
            Waiting on client
          </p>
          {waiting.map((asset) => (
            <JobAssetRow
                brandKit={brandKit}
              key={asset.id}
              asset={asset}
              timestampLabel="Sent"
              onOpen={onOpenAsset ? () => onOpenAsset(asset) : undefined}
              meta={linkMeta(asset)}
              trailing={waitingTrailing(asset)}
            />
          ))}
        </section>
      )}

      {internal.length > 0 && (
        <section className="space-y-2" aria-label="Internal check">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Internal check</p>
          {internal.map((asset) => (
            <JobAssetRow
                brandKit={brandKit}
              key={asset.id}
              asset={asset}
              onOpen={onOpenAsset ? () => onOpenAsset(asset) : undefined}
            />
          ))}
        </section>
      )}

      {declined.length > 0 && (
        <section className="space-y-2" aria-label="Not moving forward">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Not moving forward
          </p>
          {declined.map((asset) => (
            <div key={asset.id} className="space-y-1.5">
              <JobAssetRow
                brandKit={brandKit}
                asset={asset}
                onOpen={onOpenAsset ? () => onOpenAsset(asset) : undefined}
              />
              {asset.review_notes && (
                <p className="ml-3 border-l-2 border-border pl-3 text-sm text-muted-foreground whitespace-pre-line">
                  {asset.review_notes}
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
