import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface DeleteCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignName: string
  onConfirm: () => Promise<void>
  isDeleting?: boolean
}

export function DeleteCampaignDialog({
  open,
  onOpenChange,
  campaignName,
  onConfirm,
  isDeleting = false,
}: DeleteCampaignDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    // Parent closes dialog on success by clearing state; do not close on error
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. All draft assets will be removed.
            {campaignName && (
              <span className="block mt-1 font-medium text-foreground">
                &quot;{campaignName}&quot;
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
