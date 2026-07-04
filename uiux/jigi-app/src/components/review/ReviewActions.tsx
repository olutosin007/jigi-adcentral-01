import { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { REVIEW_ACTIONS, type ReviewAction } from '@/lib/status'

interface ReviewActionsProps {
  onReview: (action: ReviewAction, notes?: string) => void
  isReviewing: boolean
  disabled?: boolean
  /** PRD 07: Block approve when copy has exclusions violated */
  approveBlocked?: boolean
  approveBlockedReason?: string
}

export function ReviewActions({ onReview, isReviewing, disabled, approveBlocked, approveBlockedReason }: ReviewActionsProps) {
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null)
  const [notes, setNotes] = useState('')

  const handleAction = (action: ReviewAction) => {
    if (action === 'request_changes' || action === 'reject') {
      setPendingAction(action)
      setShowNotesDialog(true)
    } else {
      onReview(action)
    }
  }

  const handleConfirmWithNotes = () => {
    if (pendingAction) {
      onReview(pendingAction, notes.trim() || undefined)
      setShowNotesDialog(false)
      setNotes('')
      setPendingAction(null)
    }
  }

  const handleCancelNotes = () => {
    setShowNotesDialog(false)
    setNotes('')
    setPendingAction(null)
  }

  const actionConfig = pendingAction ? REVIEW_ACTIONS[pendingAction] : null

  return (
    <>
      {approveBlocked && approveBlockedReason && (
        <Alert variant="destructive" className="mb-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{approveBlockedReason}</AlertDescription>
        </Alert>
      )}
      <div className="flex items-center gap-3" data-tour="review-actions">
        {/* Approve Button - Primary */}
        <Button
          onClick={() => handleAction('approve')}
          disabled={isReviewing || disabled || approveBlocked}
          title={approveBlocked ? approveBlockedReason : undefined}
          className="bg-success hover:bg-success/90 text-primary-foreground flex-1 transition-colors"
        >
          {isReviewing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <REVIEW_ACTIONS.approve.icon className="mr-2 h-4 w-4" />
          )}
          Approve
          <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 rounded border bg-success/50 px-1.5 text-xs font-medium">
            A
          </kbd>
        </Button>

        {/* Request Changes Button - Outline */}
        <Button
          variant="outline"
          onClick={() => handleAction('request_changes')}
          disabled={isReviewing || disabled}
          className="border-warning/30 text-warning hover:bg-warning/10 flex-1 transition-colors"
        >
          <REVIEW_ACTIONS.request_changes.icon className="mr-2 h-4 w-4" />
          Request Changes
          <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 rounded border bg-warning/20 px-1.5 text-xs font-medium">
            R
          </kbd>
        </Button>

        {/* Reject Button - Destructive */}
        <Button
          variant="destructive"
          onClick={() => handleAction('reject')}
          disabled={isReviewing || disabled}
          className="flex-1 transition-colors"
        >
          <REVIEW_ACTIONS.reject.icon className="mr-2 h-4 w-4" />
          Reject
          <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 rounded border bg-destructive/20 px-1.5 text-xs font-medium">
            X
          </kbd>
        </Button>
      </div>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionConfig && (
                <actionConfig.icon className={`h-5 w-5 ${
                  pendingAction === 'reject' ? 'text-destructive' : 'text-warning'
                }`} />
              )}
              {actionConfig?.label || 'Add Notes'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'reject'
                ? 'Please explain why this asset is being rejected.'
                : 'Provide feedback on what changes are needed.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="review-notes" className="sr-only">Notes</Label>
            <Textarea
              id="review-notes"
              placeholder={
                pendingAction === 'reject'
                  ? 'Explain the reason for rejection...'
                  : 'Describe the changes needed...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNotes}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmWithNotes}
              className={
                pendingAction === 'reject'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-warning hover:bg-warning/90'
              }
            >
              {isReviewing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm {actionConfig?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
