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
          <DialogTitle>Submit for Review</DialogTitle>
          <DialogDescription>
            Submit this {assetType} for review and approval.
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
            <Label htmlFor="target">Submit to</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as AssetStatus)}>
              <SelectTrigger id="target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowAgencyReview && (
                  <SelectItem value="agency_review">
                    Agency Review (internal)
                  </SelectItem>
                )}
                <SelectItem value="submitted">
                  Brand Review (external)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {target === 'agency_review'
                ? 'Asset will be reviewed internally by your team before going to the brand.'
                : 'Asset will be sent directly to the brand for approval.'}
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
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
