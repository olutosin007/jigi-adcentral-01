import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ACTIVATION_TICK_META, completionCount } from '@/lib/activation/checklist'
import { useActivationStore } from '@/store/activationStore'
import { cn } from '@/lib/utils'

/**
 * L1 activation checklist — Flow A outcomes on Work home.
 * Dismissible; not a modal gauntlet (04-key-user-flows-01 §7).
 */
export function ActivationChecklist() {
  const completed = useActivationStore((s) => s.completed)
  const dismissed = useActivationStore((s) => s.dismissed)
  const dismiss = useActivationStore((s) => s.dismiss)
  const isComplete = useActivationStore((s) => s.isComplete())

  if (dismissed || isComplete) return null

  const { done, total } = completionCount(completed)

  return (
    <section
      className="rounded-[10px] border border-orchid-6 bg-orchid-2/40 p-4 shadow-[var(--shadow-card)]"
      data-testid="activation-checklist"
      aria-label="Getting started"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Ship a decision, not a folder</p>
          <p className="mt-0.5 text-xs text-slate">
            {done}/{total} · Generate or upload → Brand check → Decide link → client yes
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate"
          aria-label="Dismiss checklist"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ul className="mt-3 space-y-2">
        {ACTIVATION_TICK_META.map((tick) => {
          const doneTick = Boolean(completed[tick.id])
          return (
            <li key={tick.id} className="flex items-start gap-2 text-sm">
              <span
                className={cn(
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                  doneTick
                    ? 'border-sage-8 bg-sage-3 text-sage-11'
                    : 'border-line bg-surface text-transparent'
                )}
                aria-hidden
              >
                <Check className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('font-medium', doneTick ? 'text-slate line-through' : 'text-ink')}>
                  {tick.label}
                  {tick.optional ? (
                    <span className="ml-1 text-xs font-normal text-pewter">(optional)</span>
                  ) : null}
                </p>
                <p className="text-xs text-slate">{tick.hint}</p>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/app/generate">Generate now</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/app/brands">Brand guidelines</Link>
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-pewter">
        Practice tip: after you send a Decide link, open it yourself to tick “Get a yes”.
      </p>
    </section>
  )
}
