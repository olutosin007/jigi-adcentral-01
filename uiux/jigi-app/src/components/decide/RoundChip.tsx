import { Clock } from 'lucide-react'
import { roundLabel } from '@/lib/handoff'
import { cn } from '@/lib/utils'

interface RoundChipProps {
  round: number
  /** Appended after the round, e.g. "Waiting on you". */
  suffix?: string
  className?: string
}

/** Amber pending chip; the round is only mentioned from Round 2 onwards. */
export function RoundChip({ round, suffix = 'Needs your decision', className }: RoundChipProps) {
  const text = round >= 2 ? `${roundLabel(round)} · ${suffix}` : suffix
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[#F59E0B]/30 bg-[#FEF3C7] px-2.5 py-1 text-xs font-medium text-[#B45309] dark:bg-[#422006] dark:text-[#FBBF24]',
        className
      )}
      data-testid="round-chip"
    >
      <Clock className="h-3 w-3" aria-hidden />
      {text}
    </span>
  )
}
