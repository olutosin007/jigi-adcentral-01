import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BriefReadinessResult } from '@/lib/brief-readiness'

interface BriefIncompleteBannerProps {
  readiness: BriefReadinessResult
  onEditBrief?: () => void
  compact?: boolean
}

export function BriefIncompleteBanner({
  readiness,
  onEditBrief,
  compact = false,
}: BriefIncompleteBannerProps) {
  if (readiness.ready) return null

  const missingText =
    readiness.missing.length > 0
      ? `Missing: ${readiness.missing.join(', ')}`
      : 'Complete your brief before generating creative.'

  if (compact) {
    return (
      <p className="text-xs text-honey-text mt-1 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3 flex-shrink-0" aria-hidden />
        Brief incomplete — generation may be off-brief
      </p>
    )
  }

  return (
    <div
      role="status"
      className="rounded-lg border border-honey/30 bg-honey/10 dark:bg-honey/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-honey-text flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-honey-text">
            Brief incomplete — generation may be off-brief
          </p>
          <p className="text-sm text-honey-text/90 mt-0.5">{missingText}</p>
        </div>
      </div>
      {onEditBrief && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-honey/40 shrink-0"
          onClick={onEditBrief}
        >
          Complete brief
        </Button>
      )}
    </div>
  )
}
