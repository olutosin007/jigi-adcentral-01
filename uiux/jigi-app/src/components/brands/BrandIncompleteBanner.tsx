import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BrandEssentialsResult } from '@/lib/brand-profile-status'

interface BrandIncompleteBannerProps {
  essentials: BrandEssentialsResult
  onCompleteBrandKit?: () => void
}

export function BrandIncompleteBanner({
  essentials,
  onCompleteBrandKit,
}: BrandIncompleteBannerProps) {
  if (essentials.status === 'complete') return null

  const missing = [...essentials.missing, ...essentials.recommendedMissing]
  const missingText =
    missing.length > 0
      ? `Missing: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? '…' : ''}`
      : 'Complete your brand kit for on-brand generation.'

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Brand profile incomplete — results may drift
          </p>
          <p className="text-sm text-amber-800/90 dark:text-amber-200/90 mt-0.5">
            {missingText} ({essentials.score}/{essentials.maxScore} essentials)
          </p>
        </div>
      </div>
      {onCompleteBrandKit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-amber-500/40 shrink-0"
          onClick={onCompleteBrandKit}
        >
          Complete brand kit
        </Button>
      )}
    </div>
  )
}
