import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UploadDropzone } from './UploadDropzone'
import { getAllowedMimeTypes } from '@/lib/upload'
import { useUploadAsset, useCreateUploadedCopy } from '@/hooks/useCampaignQueries'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  userId?: string
  initialType?: 'image' | 'copy' | 'concept'
}

export function UploadModal({ open, onOpenChange, campaignId, userId, initialType }: UploadModalProps) {
  const [assetType, setAssetType] = useState<'image' | 'copy' | 'concept'>(initialType ?? 'image')
  const [file, setFile] = useState<File | null>(null)
  const [copyText, setCopyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [debugError, setDebugError] = useState<string | null>(null)
  const uploadAsset = useUploadAsset()
  const createUploadedCopy = useCreateUploadedCopy()

  const resetForm = () => {
    setFile(null)
    setCopyText('')
    setDebugError(null)
  }

  const handleClose = () => {
    if (isSubmitting) return
    resetForm()
    onOpenChange(false)
  }

  useEffect(() => {
    if (!open) return
    setAssetType(initialType ?? 'image')
    setFile(null)
    setCopyText('')
    setDebugError(null)
  }, [open, initialType])

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as { message?: unknown }).message ?? 'Unknown upload error')
    }
    return 'Unknown upload error'
  }

  const handleSubmit = async () => {
    if (!userId) {
      setDebugError('No authenticated user found for this upload request.')
      toast.error('You must be signed in to upload assets.')
      return
    }
    try {
      setDebugError(null)
      setIsSubmitting(true)
      if (assetType === 'copy') {
        const text = copyText.trim()
        if (!text) {
          setDebugError('Copy upload was attempted with empty text input.')
          toast.error('Paste some copy to upload.')
          setIsSubmitting(false)
          return
        }

        await createUploadedCopy.mutateAsync({
          campaignId,
          userId,
          text,
        })

        toast.success('Copy uploaded successfully.')
        resetForm()
        onOpenChange(false)
      } else {
        if (!file) {
          setDebugError(
            assetType === 'image'
              ? 'No image file was selected before upload.'
              : 'No concept document was selected before upload.'
          )
          toast.error(
            assetType === 'image'
              ? 'Select an image to upload.'
              : 'Select a concept file (PDF, TXT, or DOCX) to upload.'
          )
          setIsSubmitting(false)
          return
        }

        await uploadAsset.mutateAsync({
          campaignId,
          type: assetType,
          file,
          userId,
        })
        toast.success(
          assetType === 'image' ? 'Image uploaded successfully.' : 'Concept uploaded successfully.'
        )
        resetForm()
        onOpenChange(false)
      }
    } catch (error) {
      const message = getErrorMessage(error)
      console.error('Upload failed', error)
      setDebugError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const acceptedTypes =
    assetType === 'image' || assetType === 'concept'
      ? getAllowedMimeTypes(assetType)
      : []

  const isTypeLocked = !!initialType

  const heading =
    assetType === 'image'
      ? 'Upload image'
      : assetType === 'copy'
      ? 'Upload copy'
      : 'Upload concept'

  const description =
    assetType === 'image'
      ? 'Add existing campaign visuals so they flow through the same review and approval pipeline as AI-generated images.'
      : assetType === 'copy'
      ? 'Paste or upload copy for this campaign so it can be reviewed alongside generated variants.'
      : 'Attach decks or files that represent the campaign concept so reviewers see offline strategy alongside AI work.'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription className="text-xs">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isTypeLocked && (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                {(['image', 'copy', 'concept'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant={assetType === type ? 'default' : 'outline'}
                    className={assetType === type ? 'bg-primary hover:bg-primary/90' : ''}
                    onClick={() => {
                      setAssetType(type)
                      setFile(null)
                      setCopyText('')
                    }}
                  >
                    {type === 'image' ? 'Image' : type === 'copy' ? 'Copy' : 'Concept'}
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Image: upload campaign visuals · Copy: paste or upload text · Concept: attach decks or reference files.
              </p>
            </div>
          )}

          {assetType === 'copy' ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">
                Paste copy
              </label>
              <Textarea
                rows={6}
                value={copyText}
                onChange={(e) => setCopyText(e.target.value)}
                placeholder="Paste your copy here. First line will be treated as headline; the rest as body."
                className="text-sm"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <UploadDropzone
                accept={acceptedTypes}
                onFileSelected={(selected) => setFile(selected)}
              />

              {file && (
                <p className="text-xs text-muted-foreground">
                  Selected file: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>
          )}

          {debugError && (
            <Alert variant="destructive">
              <AlertTitle>Upload debug</AlertTitle>
              <AlertDescription>
                <p>{debugError}</p>
                <p className="text-xs">
                  Storage target: <code>{`creative-assets/${campaignId}/{asset_id}/{filename}`}</code>
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || (assetType === 'copy' ? !copyText.trim() : !file)}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

