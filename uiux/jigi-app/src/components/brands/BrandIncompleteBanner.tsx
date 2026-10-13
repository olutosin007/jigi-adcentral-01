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
      className="rounded-lg border border-honey/30 bg-honey/10 dark:bg-honey/5 px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-honey-text flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-honey-text">
            Brand profile incomplete — results may drift
          </p>
          <p className="text-sm text-honey-text/90 mt-0.5">
            {missingText} ({essentials.score}/{essentials.maxScore} essentials)
          </p>
        </div>
      </div>
      {onCompleteBrandKit && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-honey/40 shrink-0"
          onClick={onCompleteBrandKit}
        >
          Complete brand kit
        </Button>
      )}
    </div>
  )
}
