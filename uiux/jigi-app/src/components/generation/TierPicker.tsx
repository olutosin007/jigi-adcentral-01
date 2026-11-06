import type { KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import {
  IMAGE_ASPECT_OPTIONS,
  IMAGE_TIER_OPTIONS,
  formatCostUsd,
  type ImageTierId,
} from '@/lib/image-tiers'
import type { ImageAspectRatio } from '@/lib/ai'

interface TierPickerProps {
  tier: ImageTierId
  onTierChange: (tier: ImageTierId) => void
  aspectRatio: ImageAspectRatio
  onAspectRatioChange: (aspectRatio: ImageAspectRatio) => void
  disabled?: boolean
}

/** Arrow keys move selection within a radiogroup (WAI-ARIA radio pattern). */
function nextIndex(event: KeyboardEvent, current: number, length: number): number | null {
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') return (current + 1) % length
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') return (current - 1 + length) % length
  return null
}

export function TierPicker({
  tier,
  onTierChange,
  aspectRatio,
  onAspectRatioChange,
  disabled = false,
}: TierPickerProps) {
  const tierIndex = IMAGE_TIER_OPTIONS.findIndex((o) => o.id === tier)
  const aspectIndex = IMAGE_ASPECT_OPTIONS.findIndex((o) => o.id === aspectRatio)

  return (
    <div className="space-y-3" data-testid="tier-picker">
      <div
        role="radiogroup"
        aria-label="Image quality tier"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
        onKeyDown={(event) => {
          const next = nextIndex(event, tierIndex, IMAGE_TIER_OPTIONS.length)
          if (next === null || disabled) return
          event.preventDefault()
          onTierChange(IMAGE_TIER_OPTIONS[next].id)
        }}
      >
        {IMAGE_TIER_OPTIONS.map((option) => {
          const selected = option.id === tier
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onTierChange(option.id)}
              className={cn(
                'rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50',
                selected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              )}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>
                  {option.label}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatCostUsd(option.estCostUsd)}
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {option.modelLabel} · {option.speed}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">{option.description}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Aspect</span>
        <div
          role="radiogroup"
          aria-label="Aspect ratio"
          className="inline-flex rounded-lg border border-border bg-muted p-0.5"
          onKeyDown={(event) => {
            const next = nextIndex(event, aspectIndex, IMAGE_ASPECT_OPTIONS.length)
            if (next === null || disabled) return
            event.preventDefault()
            onAspectRatioChange(IMAGE_ASPECT_OPTIONS[next].id)
          }}
        >
          {IMAGE_ASPECT_OPTIONS.map((option) => {
            const selected = option.id === aspectRatio
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                disabled={disabled}
                onClick={() => onAspectRatioChange(option.id)}
                className={cn(
                  'px-2.5 py-0.5 text-xs rounded-md',
                  selected ? 'bg-card text-foreground font-medium shadow-sm' : 'text-muted-foreground'
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
