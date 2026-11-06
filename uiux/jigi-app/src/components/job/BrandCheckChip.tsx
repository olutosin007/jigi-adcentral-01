import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { HANDOFF_TONE_CLASSES, summarizeBrandCheck, type BrandKitLevel } from '@/lib/handoff'
import type { CreativeAsset } from '@/store/campaignStore'
import { cn } from '@/lib/utils'

const ICONS = {
  unchecked: ShieldQuestion,
  clear: ShieldCheck,
  attention: ShieldAlert,
  blocking: ShieldAlert,
}

export function BrandCheckChip({
  asset,
  kit,
  className,
}: {
  asset: Pick<CreativeAsset, 'validation_scores' | 'drift_status'>
  kit: BrandKitLevel
  className?: string
}) {
  const summary = summarizeBrandCheck(asset, kit)
  const Icon = ICONS[summary.state]
  const title = summary.guidanceOnly
    ? 'Guidance only — complete the brand kit for stronger checks'
    : undefined
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
        HANDOFF_TONE_CLASSES[summary.tone],
        className
      )}
      title={title}
      data-testid="brand-check-chip"
    >
      <Icon className="h-3 w-3" aria-hidden />
      {summary.label}
      {summary.guidanceOnly && summary.state !== 'unchecked' && (
        <span className="opacity-70">· guidance</span>
      )}
    </span>
  )
}
