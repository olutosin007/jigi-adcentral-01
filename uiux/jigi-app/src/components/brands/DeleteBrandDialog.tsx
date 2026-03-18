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

interface DeleteBrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandName: string
  campaignCount?: number
  onConfirm: () => Promise<void>
  isDeleting?: boolean
}

export function DeleteBrandDialog({
  open,
  onOpenChange,
  brandName,
  campaignCount,
  onConfirm,
  isDeleting = false,
}: DeleteBrandDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete brand?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. All campaigns and assets linked to this brand will be permanently removed.
            {campaignCount !== undefined && campaignCount > 0 && (
              <span className="block mt-1 text-foreground">
                {campaignCount} campaign{campaignCount !== 1 ? 's' : ''} will be deleted.
              </span>
            )}
            {brandName && (
              <span className="block mt-1 font-medium text-foreground">
                &quot;{brandName}&quot;
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
