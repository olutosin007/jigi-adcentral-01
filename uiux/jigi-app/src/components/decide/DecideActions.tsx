import { Check, MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type DecideAction = 'approve' | 'request_changes' | 'reject'

interface DecideActionsProps {
  onAction: (action: DecideAction) => void
  disabled?: boolean
  className?: string
}

export function DecideActions({ onAction, disabled, className }: DecideActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-3',
        'motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in motion-safe:duration-500',
        className
      )}
      data-tour="decide-actions"
    >
      <Button
        variant="ghost"
        className="h-11 sm:h-10 text-muted-foreground hover:text-destructive"
        onClick={() => onAction('reject')}
        disabled={disabled}
      >
        <X className="mr-1.5 h-4 w-4" aria-hidden />
        Decline
      </Button>
      <div className="flex-1 hidden sm:block" />
      <Button
        variant="outline"
        className="h-11 sm:h-10"
        onClick={() => onAction('request_changes')}
        disabled={disabled}
      >
        <MessageSquare className="mr-1.5 h-4 w-4" aria-hidden />
        Request changes
      </Button>
      <Button className="h-11 sm:h-10 sm:min-w-[140px]" onClick={() => onAction('approve')} disabled={disabled}>
        <Check className="mr-1.5 h-4 w-4" aria-hidden />
        Approve
      </Button>
    </div>
  )
}
