import { Check } from 'lucide-react'
import type { BriefChecklistItem } from '@/lib/brief-readiness/checklist'

interface BriefReadinessChecklistProps {
  items: BriefChecklistItem[]
}

export function BriefReadinessChecklist({ items }: BriefReadinessChecklistProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      {items.map(({ label, done }) => (
        <div key={label} className="flex items-center gap-2 text-sm">
          {done ? (
            <Check className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
          ) : (
            <span
              className="h-4 w-4 rounded-full border border-muted-foreground/50 flex-shrink-0"
              aria-hidden
            />
          )}
          <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        </div>
      ))}
    </div>
  )
}
