import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  /** Applied to icon wrapper; include both bg and text color e.g. "bg-orange-50 text-orange-600" */
  iconClassName?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
  iconClassName = 'bg-muted text-muted-foreground',
}: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border border-border rounded-xl', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
            {trend && (
              <p
                className={cn(
                  'text-xs mt-1',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% from last week
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', iconClassName)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
