import { cn } from '@/lib/utils'
import { getStatusConfig } from '@/lib/status'
import { humanStatusClasses, humanStatusLabel, type HandoffAudience } from '@/lib/handoff'

interface StatusBadgeProps {
  status: string
  className?: string
  size?: 'sm' | 'md'
  audience?: HandoffAudience
}

export function StatusBadge({ status, className, size = 'sm', audience = 'creator' }: StatusBadgeProps) {
  const Icon = getStatusConfig(status).icon
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-0.5 gap-1.5'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap border',
        humanStatusClasses(status),
        sizeClasses,
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} aria-hidden />
      <span>{humanStatusLabel(status, audience)}</span>
    </span>
  )
}
