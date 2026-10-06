import { getAssetImageUrl, diffContentFields, roundLabel, type DisplayableAsset } from '@/lib/handoff'
import { cn } from '@/lib/utils'

interface CompareToPreviousProps {
  asset: DisplayableAsset
  previousContent: Record<string, unknown>
  round: number
  className?: string
}

export function CompareToPrevious({ asset, previousContent, round, className }: CompareToPreviousProps) {
  const prevLabel = roundLabel(round - 1)
  const currentLabel = `${roundLabel(round)} · now`

  if (asset.type === 'image') {
    const current = getAssetImageUrl(asset)
    const previous = getAssetImageUrl({ type: 'image', content: previousContent })
    return (
      <div className={cn('grid gap-3 sm:grid-cols-2', className)} data-testid="compare-images">
        {[
          { label: prevLabel, url: previous, muted: true },
          { label: currentLabel, url: current, muted: false },
        ].map((side) => (
          <figure key={side.label} className="space-y-1.5">
            <figcaption className={cn('text-xs font-medium', side.muted ? 'text-muted-foreground' : 'text-foreground')}>
              {side.label}
            </figcaption>
            <div className="rounded-xl border border-border bg-[#F5F5F4] dark:bg-muted">
              {side.url ? (
                <img src={side.url} alt={side.label} className="mx-auto block max-h-[60vh] max-w-full object-contain" />
              ) : (
                <p className="p-10 text-center text-sm text-muted-foreground">No image saved for this round</p>
              )}
            </div>
          </figure>
        ))}
      </div>
    )
  }

  const rows = diffContentFields(previousContent, asset.content as Record<string, unknown>)
  const changed = rows.filter((r) => r.changed).length

  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 space-y-4', className)} data-testid="compare-fields">
      <p className="text-sm text-muted-foreground">
        {changed === 0 ? 'No text changes since' : `${changed} field${changed === 1 ? '' : 's'} changed since`} {prevLabel}
      </p>
      <dl className="space-y-4">
        {rows.map((row) => (
          <div key={row.key} className={cn(!row.changed && 'opacity-60')}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {row.label}
              {!row.changed && <span className="ml-1.5 normal-case font-normal tracking-normal">· unchanged</span>}
            </dt>
            {row.changed ? (
              <dd className="mt-1 space-y-1 text-sm">
                {row.before && (
                  <p className="text-muted-foreground line-through decoration-destructive/50 whitespace-pre-line">
                    {row.before}
                  </p>
                )}
                <p className="text-foreground whitespace-pre-line rounded-md bg-success/10 px-2 py-1">{row.after || '—'}</p>
              </dd>
            ) : (
              <dd className="mt-1 text-sm text-foreground whitespace-pre-line">{row.after}</dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  )
}
