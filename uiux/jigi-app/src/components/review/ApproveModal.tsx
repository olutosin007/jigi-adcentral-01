import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
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

interface ApproveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (notes?: string) => void
  assetName?: string
  isLoading?: boolean
}

export function ApproveModal({
  open,
  onOpenChange,
  onConfirm,
  assetName,
  isLoading = false,
}: ApproveModalProps) {
  const [notes, setNotes] = useState('')

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined)
    setNotes('')
  }

  const handleCancel = () => {
    onOpenChange(false)
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Approve Asset
          </DialogTitle>
          <DialogDescription>
            {assetName
              ? `Confirm approval for "${assetName}". This will move the asset to the approved state.`
              : 'Confirm approval for this asset. This will move it to the approved state.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="approve-notes" className="text-sm font-medium mb-2 block">
            Notes (optional)
          </Label>
          <Textarea
            id="approve-notes"
            placeholder="Add any approval notes or feedback..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Your notes will be visible in the asset&apos;s review history.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="hover:bg-muted transition-colors">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-success hover:bg-success/90 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
