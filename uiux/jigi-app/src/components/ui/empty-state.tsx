import { type LucideIcon } from 'lucide-react'
import { isValidElement } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReactNode, ReactElement } from 'react'

interface EmptyStateProps {
  icon: LucideIcon | ReactElement
  title: string
  description: string
  action?: ReactNode | {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

function isActionObject(action: unknown): action is { label: string; onClick: () => void } {
  return typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action
}

function isReactElement(icon: LucideIcon | ReactElement): icon is ReactElement {
  return isValidElement(icon)
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        {isReactElement(icon) ? (
          icon
        ) : (
          (() => {
            const Icon = icon as LucideIcon
            return <Icon className="h-7 w-7 text-muted-foreground" aria-hidden />
          })()
        )}
      </div>
      <h3 className="mt-4 text-xl font-serif font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex gap-3">
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            isActionObject(action) ? (
              <Button onClick={action.onClick}>
                {action.label}
              </Button>
            ) : (
              action
            )
          )}
        </div>
      )}
    </div>
  )
}
