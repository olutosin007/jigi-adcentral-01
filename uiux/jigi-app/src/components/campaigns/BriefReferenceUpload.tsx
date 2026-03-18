import { useState, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { X, FileImage, FileText } from 'lucide-react'
import { uploadCampaignReference, validateReferenceFile } from '@/lib/brief-reference-upload'
import { toast } from 'sonner'
import type { BriefReferenceAsset } from '@/store/campaignStore'

interface BriefReferenceUploadProps {
  /** Campaign ID for uploads. When missing (create flow), files are stored for upload after create. */
  campaignId?: string
  /** Callback when files are selected but not yet uploaded (create flow). */
  onPendingFilesChange?: (files: File[]) => void
}

export function BriefReferenceUpload({ campaignId, onPendingFilesChange }: BriefReferenceUploadProps) {
  const { setValue, watch } = useFormContext()
  const referenceAssets = (watch('reference_assets') || []) as BriefReferenceAsset[]

  const setReferenceAssets = (assets: BriefReferenceAsset[]) => {
    setValue('reference_assets', assets, { shouldValidate: true })
  }
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    for (const file of files) {
      try {
        validateReferenceFile(file)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Invalid file')
        e.target.value = ''
        return
      }
    }

    if (campaignId) {
      setIsUploading(true)
      try {
        const newAssets: BriefReferenceAsset[] = []
        for (const file of files) {
          const url = await uploadCampaignReference(campaignId, file)
          newAssets.push({ file_url: url, filename: file.name })
        }
        setReferenceAssets([...referenceAssets, ...newAssets])
        toast.success(`${files.length} file(s) uploaded`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setIsUploading(false)
      }
    } else {
      setPendingFiles((prev) => {
        const next = [...prev, ...files]
        onPendingFilesChange?.(next)
        return next
      })
    }
    e.target.value = ''
  }

  const removeAsset = (index: number) => {
    const next = referenceAssets.filter((_, i) => i !== index)
    setReferenceAssets(next)
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      onPendingFilesChange?.(next)
      return next
    })
  }

  const canUpload = !!campaignId
  const hasAssets = referenceAssets.length > 0 || pendingFiles.length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading…' : 'Add files'}
        </Button>
        {!canUpload && (
          <span className="text-xs text-muted-foreground self-center">
            Reference assets can be added after creating the campaign
          </span>
        )}
      </div>

      {hasAssets && (
        <div className="space-y-2">
          {referenceAssets.map((asset, i) => (
            <div
              key={asset.file_url}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
            >
              {asset.file_url.match(/\.(pdf)$/i) ? (
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <FileImage className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate flex-1">{asset.filename || 'Reference'}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeAsset(i)}
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {pendingFiles.map((file, i) => (
            <div
              key={`pending-${i}-${file.name}`}
              className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-sm"
            >
              {file.type.startsWith('image/') ? (
                <FileImage className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-xs text-muted-foreground">(will upload on save)</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removePendingFile(i)}
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
