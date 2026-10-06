import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type AssetStatus } from '@/lib/status'

interface SubmitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetName: string
  assetType: string
  onSubmit: (targetStatus: AssetStatus, note?: string) => void
  isSubmitting: boolean
  allowAgencyReview?: boolean
}

export function SubmitModal({
  open,
  onOpenChange,
  assetName,
  assetType,
  onSubmit,
  isSubmitting,
  allowAgencyReview = true,
}: SubmitModalProps) {
  const [target, setTarget] = useState<AssetStatus>('submitted')
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    onSubmit(target, note.trim() || undefined)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNote('')
      setTarget('submitted')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send for approval</DialogTitle>
          <DialogDescription>
            Send this {assetType} for a decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Asset</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="font-medium text-sm">{assetName}</span>
              <span className="text-xs text-muted-foreground capitalize">
                ({assetType})
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Send to</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as AssetStatus)}>
              <SelectTrigger id="target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowAgencyReview && (
                  <SelectItem value="agency_review">
                    Internal check first
                  </SelectItem>
                )}
                <SelectItem value="submitted">
                  Client / brand
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {target === 'agency_review'
                ? 'Your team reviews it before the client sees anything.'
                : 'The client gets notified and can approve, request changes or decline.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Add context or instructions for the reviewer..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
            data-tour="submit-action"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
