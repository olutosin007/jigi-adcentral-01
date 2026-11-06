import { Check } from 'lucide-react'
import type { BrandEssentialItem } from '@/lib/brand-profile-status'

interface BrandEssentialsChecklistProps {
  items: BrandEssentialItem[]
  score: number
  maxScore: number
  onItemAction?: (id: string) => void
}

export function BrandEssentialsChecklist({
  items,
  score,
  maxScore,
  onItemAction,
}: BrandEssentialsChecklistProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">Brand essentials</p>
        <p className="text-sm text-muted-foreground">
          {score}/{maxScore} for on-brand AI
        </p>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const content = (
            <>
              {item.met ? (
                <Check className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
              ) : (
                <span
                  className="h-4 w-4 rounded-full border border-muted-foreground/50 flex-shrink-0"
                  aria-hidden
                />
              )}
              <span className={item.met ? 'text-foreground' : 'text-muted-foreground'}>
                {item.label}
                {item.recommended && !item.met ? (
                  <span className="text-muted-foreground/80"> (recommended)</span>
                ) : null}
              </span>
            </>
          )

          if (!item.met && onItemAction) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemAction(item.id)}
                className="flex w-full items-center gap-2 text-sm text-left rounded-md px-1 py-0.5 hover:bg-muted/60 transition-colors"
              >
                {content}
              </button>
            )
          }

          return (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
