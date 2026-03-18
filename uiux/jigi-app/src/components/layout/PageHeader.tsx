import { type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  onBack?: () => void
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  backHref,
  onBack,
  actions,
  className,
}: PageHeaderProps) {
  const showBackButton = backHref || onBack

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-4">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 mt-0.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}
