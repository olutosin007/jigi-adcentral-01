import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, FileImage, FileText } from 'lucide-react'
import { uploadCampaignReference, validateReferenceFile } from '@/lib/brief-reference-upload'
import { toast } from 'sonner'
import type { BriefReferenceAsset } from '@/store/campaignStore'

interface ReferenceAssetUploadInlineProps {
  campaignId: string
  value: BriefReferenceAsset[]
  onChange: (assets: BriefReferenceAsset[]) => void
  disabled?: boolean
}

export function ReferenceAssetUploadInline({
  campaignId,
  value,
  onChange,
  disabled,
}: ReferenceAssetUploadInlineProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

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

    setIsUploading(true)
    try {
      const newAssets: BriefReferenceAsset[] = []
      for (const file of files) {
        const url = await uploadCampaignReference(campaignId, file)
        newAssets.push({ file_url: url, filename: file.name })
      }
      onChange([...value, ...newAssets])
      toast.success(`${files.length} file(s) uploaded`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
    e.target.value = ''
  }

  const removeAsset = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

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
          disabled={isUploading || disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || disabled}
        >
          {isUploading ? 'Uploading…' : 'Add files'}
        </Button>
      </div>
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((asset, i) => (
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
              {!disabled && (
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
