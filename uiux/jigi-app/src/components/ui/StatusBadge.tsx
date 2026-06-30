import { cn } from '@/lib/utils'
import { getStatusConfig } from '@/lib/status'

interface StatusBadgeProps {
  status: string
  className?: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, className, size = 'sm' }: StatusBadgeProps) {
  const config = getStatusConfig(status)
  const Icon = config.icon
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-0.5 gap-1.5'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap border',
        config.bgColor,
        config.color,
        config.borderColor,
        sizeClasses,
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} aria-hidden />
      <span>{config.label}</span>
    </span>
  )
}
