import { ACTIVATION_TICK_META, completionCount } from '@/lib/activation/checklist'
import { useActivationStore } from '@/store/activationStore'
import { Button } from '@/components/ui/button'

/**
 * Dev/admin stub for Flow A activation funnel (plan Wave F4.1).
 * Reads local checklist progress only — no server metrics yet.
 */
export function ActivationFunnelStub() {
  const completed = useActivationStore((s) => s.completed)
  const dismissed = useActivationStore((s) => s.dismissed)
  const reset = useActivationStore((s) => s.reset)
  const { done, total } = completionCount(completed)

  return (
    <div className="rounded-[10px] border border-border bg-card p-4 space-y-3" data-testid="activation-funnel-stub">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Activation funnel (this browser)</p>
          <p className="text-xs text-muted-foreground">
            {done}/{total} required ticks · checklist {dismissed ? 'dismissed' : 'visible'}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={reset}>
          Reset ticks
        </Button>
      </div>
      <ol className="space-y-1 text-xs text-muted-foreground">
        {ACTIVATION_TICK_META.map((t) => (
          <li key={t.id}>
            {completed[t.id] ? '✓' : '○'} {t.label}
            {t.optional ? ' (optional)' : ''}
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-muted-foreground">
        Path: draft → brand check seen → Decide link → decision. North-star events feed these ticks.
      </p>
    </div>
  )
}
