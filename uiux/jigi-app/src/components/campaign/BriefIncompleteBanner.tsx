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
      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3 flex-shrink-0" aria-hidden />
        Brief incomplete — generation may be off-brief
      </p>
    )
  }

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Brief incomplete — generation may be off-brief
          </p>
          <p className="text-sm text-amber-800/90 dark:text-amber-200/90 mt-0.5">{missingText}</p>
        </div>
      </div>
      {onEditBrief && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-amber-500/40 shrink-0"
          onClick={onEditBrief}
        >
          Complete brief
        </Button>
      )}
    </div>
  )
}
