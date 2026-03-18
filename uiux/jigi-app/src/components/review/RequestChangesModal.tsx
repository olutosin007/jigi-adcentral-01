import { useState } from 'react'
import { MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface RequestChangesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (feedback: string, options?: { notifyTeam?: boolean }) => void
  assetName?: string
  isLoading?: boolean
}

const QUICK_FEEDBACK_OPTIONS = [
  'Adjust the color palette',
  'Update the headline',
  'Change the image composition',
  'Modify the call-to-action',
  'Adjust the tone of voice',
  'Fix brand guideline violations',
]

export function RequestChangesModal({
  open,
  onOpenChange,
  onConfirm,
  assetName,
  isLoading = false,
}: RequestChangesModalProps) {
  const [feedback, setFeedback] = useState('')
  const [notifyTeam, setNotifyTeam] = useState(true)
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!feedback.trim()) {
      setError('Please provide feedback on what changes are needed')
      return
    }
    onConfirm(feedback.trim(), { notifyTeam })
    setFeedback('')
    setError('')
    setNotifyTeam(true)
  }

  const handleCancel = () => {
    onOpenChange(false)
    setFeedback('')
    setError('')
    setNotifyTeam(true)
  }

  const handleQuickFeedback = (option: string) => {
    setFeedback((prev) => {
      if (prev.trim()) {
        return `${prev}\n• ${option}`
      }
      return `• ${option}`
    })
    if (error) setError('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-warning" />
            Request Changes
          </DialogTitle>
          <DialogDescription>
            {assetName
              ? `Provide feedback for "${assetName}". The asset will be sent back for revision.`
              : 'Provide feedback for this asset. It will be sent back for revision.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Quick Feedback
            </Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_FEEDBACK_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 hover:bg-muted transition-colors"
                  onClick={() => handleQuickFeedback(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="changes-feedback" className="text-sm font-medium mb-2 block">
              Detailed Feedback <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="changes-feedback"
              placeholder="Describe the changes needed in detail..."
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value)
                if (error) setError('')
              }}
              rows={5}
              className={`resize-none ${error ? 'border-red-500' : ''}`}
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify-team"
              checked={notifyTeam}
              onCheckedChange={(checked) => setNotifyTeam(checked as boolean)}
            />
            <Label htmlFor="notify-team" className="text-sm cursor-pointer">
              Notify the creative team via email
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="hover:bg-muted transition-colors">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-warning hover:bg-warning/90 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Request Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
