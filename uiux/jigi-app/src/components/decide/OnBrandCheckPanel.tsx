import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  HANDOFF_TONE_CLASSES,
  buildBrandChecklist,
  summarizeBrandCheck,
  type BrandKitLevel,
  type ChecklistSource,
} from '@/lib/handoff'
import { cn } from '@/lib/utils'

const ITEM_ICONS = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle }
const ITEM_COLOURS = { pass: 'text-success', warn: 'text-warning', fail: 'text-destructive' }

interface OnBrandCheckPanelProps {
  asset: ChecklistSource & { validation_scores?: unknown; drift_status?: 'none' | 'review_required' | null }
  kit: BrandKitLevel
  onRunCheck?: () => void
  isChecking?: boolean
  className?: string
}

/** Shared by guest Decide, authenticated review and the creator's views. */
export function OnBrandCheckPanel({ asset, kit, onRunCheck, isChecking, className }: OnBrandCheckPanelProps) {
  const summary = summarizeBrandCheck(
    {
      validation_scores: (asset.validation_scores ?? null) as Record<string, unknown> | null,
      drift_status: asset.drift_status ?? null,
    },
    kit
  )
  const items = kit === 'none' ? [] : buildBrandChecklist(asset)

  return (
    <section
      className={cn('rounded-[10px] border border-border bg-card p-4 space-y-3', className)}
      aria-label="On-brand check"
      data-tour="on-brand-check"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
          On-brand check
        </p>
        {kit !== 'none' && (
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-[11px] font-medium',
              HANDOFF_TONE_CLASSES[summary.tone]
            )}
            data-testid="on-brand-verdict"
          >
            {summary.label}
          </span>
        )}
      </div>

      {kit === 'none' ? (
        <p className="text-sm text-muted-foreground">
          No brand attached to this job — nothing has been checked against a brand.
        </p>
      ) : (
        <>
          {summary.guidanceOnly && (
            <p className="rounded-md bg-[#FEF3C7] px-2.5 py-1.5 text-xs text-[#B45309] dark:bg-[#422006] dark:text-[#FBBF24]">
              Guidance only — the brand kit is incomplete, so these checks can’t be conclusive.
            </p>
          )}
          {summary.state === 'unchecked' ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Not checked yet.</p>
              {onRunCheck && (
                <Button size="sm" variant="outline" onClick={onRunCheck} disabled={isChecking}>
                  {isChecking && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />}
                  Run check
                </Button>
              )}
            </div>
          ) : items.length > 0 ? (
            <ul className="space-y-1.5">
              {items.map((item, i) => {
                const Icon = ITEM_ICONS[item.status]
                return (
                  <li key={`${item.label}-${i}`} className="flex gap-2 text-sm">
                    <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', ITEM_COLOURS[item.status])} aria-hidden />
                    <span className="min-w-0">
                      <span className="text-foreground">{item.label}</span>
                      {item.detail && (
                        <span className="block text-xs text-muted-foreground">{item.detail}</span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Checked — no detail recorded.</p>
          )}
        </>
      )}
    </section>
  )
}
