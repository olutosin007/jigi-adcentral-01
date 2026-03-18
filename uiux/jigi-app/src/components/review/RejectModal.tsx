import { useState } from 'react'
import { XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface RejectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  assetName?: string
  isLoading?: boolean
}

export function RejectModal({
  open,
  onOpenChange,
  onConfirm,
  assetName,
  isLoading = false,
}: RejectModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    onConfirm(reason.trim())
    setReason('')
    setError('')
  }

  const handleCancel = () => {
    onOpenChange(false)
    setReason('')
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Reject Asset
          </DialogTitle>
          <DialogDescription>
            {assetName
              ? `Reject "${assetName}". This action cannot be undone.`
              : 'Reject this asset. This action cannot be undone.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              Rejecting an asset is a final decision. The asset will be marked as rejected
              and will need to be regenerated if needed again.
            </p>
          </div>

          <div>
            <Label htmlFor="reject-reason" className="text-sm font-medium mb-2 block">
              Rejection Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why this asset is being rejected..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError('')
              }}
              rows={4}
              className={`resize-none ${error ? 'border-red-500' : ''}`}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Your feedback will be shared with the creative team.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="hover:bg-muted transition-colors">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="destructive"
            disabled={isLoading}
            className="transition-colors"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
