import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCreateUploadedCopy, useUploadAsset } from '@/hooks/useCampaignQueries'
import { trackEvent } from '@/lib/analytics'
import { validateFileSize } from '@/lib/upload'
import {
  allowedTypesForFile,
  inferUploadType,
  intakeAcceptList,
  type UploadAssetType,
} from '@/lib/upload-intake'
import type { CreativeAsset } from '@/store/campaignStore'
import { JobAssetRow } from '@/components/job/JobAssetRow'
import { cn } from '@/lib/utils'
import { UploadDropzone } from './UploadDropzone'

type QueueStatus = 'ready' | 'uploading' | 'done' | 'error'

interface QueueItem {
  key: string
  file: File
  type: UploadAssetType | null
  status: QueueStatus
  error?: string
}

interface UploadCanvasProps {
  campaignId: string
  userId?: string
  defaultType: UploadAssetType
  uploadedAssets: CreativeAsset[]
  onOpenAsset?: (asset: CreativeAsset) => void
  onGoToSend?: () => void
}

const TYPE_LABELS: Record<UploadAssetType, string> = {
  image: 'Image',
  copy: 'Copy',
  concept: 'Concept',
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'))
    reader.readAsText(file)
  })
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Upload failed')
  }
  return 'Upload failed'
}

export function UploadCanvas({
  campaignId,
  userId,
  defaultType,
  uploadedAssets,
  onOpenAsset,
  onGoToSend,
}: UploadCanvasProps) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [copyText, setCopyText] = useState('')
  const [isPastingCopy, setIsPastingCopy] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const uploadAsset = useUploadAsset()
  const createUploadedCopy = useCreateUploadedCopy()

  const patch = (key: string, next: Partial<QueueItem>) =>
    setQueue((q) => q.map((item) => (item.key === key ? { ...item, ...next } : item)))

  const addFiles = (files: File[]) => {
    const items = files.map<QueueItem>((file, i) => {
      const type = inferUploadType(file, defaultType)
      let error: string | undefined
      if (!type) error = 'File type not supported'
      else {
        try {
          validateFileSize(file.size)
        } catch (e) {
          error = errorMessage(e)
        }
      }
      return {
        key: `${Date.now()}-${i}-${file.name}`,
        file,
        type,
        status: error ? 'error' : 'ready',
        error,
      }
    })
    setQueue((q) => [...q, ...items])
  }

  const uploadOne = async (item: QueueItem) => {
    if (!userId || !item.type) return false
    patch(item.key, { status: 'uploading', error: undefined })
    try {
      if (item.type === 'copy') {
        const text = await readFileText(item.file)
        await createUploadedCopy.mutateAsync({ campaignId, userId, text })
      } else {
        await uploadAsset.mutateAsync({ campaignId, type: item.type, file: item.file, userId })
      }
      patch(item.key, { status: 'done' })
      trackEvent('candidate_added', { source: 'uploaded', type: item.type })
      return true
    } catch (e) {
      patch(item.key, { status: 'error', error: errorMessage(e) })
      return false
    }
  }

  const uploadAll = async () => {
    if (!userId) {
      toast.error('You must be signed in to upload.')
      return
    }
    setIsUploading(true)
    let ok = 0
    for (const item of queue.filter((i) => i.status === 'ready')) {
      if (await uploadOne(item)) ok += 1
    }
    setIsUploading(false)
    if (ok > 0) toast.success(`${ok} added to this job`)
  }

  const submitPastedCopy = async () => {
    const text = copyText.trim()
    if (!text || !userId) return
    setIsPastingCopy(true)
    try {
      await createUploadedCopy.mutateAsync({ campaignId, userId, text })
      trackEvent('candidate_added', { source: 'uploaded', type: 'copy' })
      setCopyText('')
      toast.success('Copy added to this job')
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setIsPastingCopy(false)
    }
  }

  const readyCount = queue.filter((i) => i.status === 'ready').length
  const doneCount = queue.filter((i) => i.status === 'done').length

  return (
    <div className="p-6 overflow-y-auto h-full space-y-6" data-tour="upload-canvas">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Add work made elsewhere</h2>
        <p className="text-sm text-muted-foreground">
          Same approval loop as generated work — drop images, concept decks or copy.
        </p>
      </div>

      <UploadDropzone
        multiple
        accept={intakeAcceptList()}
        onFilesSelected={addFiles}
        title="Drop files here"
        hint="PNG, JPG, WebP, SVG, PDF, DOCX or TXT · up to 10MB each"
      />

      {queue.length > 0 && (
        <section className="space-y-2" aria-label="Upload queue">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {doneCount}/{queue.length} added
            </p>
            {queue.every((i) => i.status !== 'uploading') && (
              <Button variant="ghost" size="sm" onClick={() => setQueue((q) => q.filter((i) => i.status !== 'done'))}>
                Clear finished
              </Button>
            )}
          </div>
          <ul className="space-y-2">
            {queue.map((item) => {
              const options = allowedTypesForFile(item.file)
              return (
                <li
                  key={item.key}
                  className="flex items-center gap-3 rounded-[10px] border border-border bg-card px-3 py-2"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-sm font-medium">{item.file.name}</span>
                    {item.error && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" aria-hidden />
                        {item.error}
                      </span>
                    )}
                  </span>
                  {options.length > 1 && item.status === 'ready' ? (
                    <select
                      aria-label={`Type for ${item.file.name}`}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      value={item.type ?? ''}
                      onChange={(e) => patch(item.key, { type: e.target.value as UploadAssetType })}
                    >
                      {options.map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    item.type && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {TYPE_LABELS[item.type]}
                      </span>
                    )
                  )}
                  {item.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Uploading" />
                  )}
                  {item.status === 'done' && (
                    <CheckCircle2 className="h-4 w-4 text-success" aria-label="Added" />
                  )}
                  {item.status === 'error' && item.type && !isUploading && (
                    <Button variant="ghost" size="sm" onClick={() => uploadOne(item)}>
                      Retry
                    </Button>
                  )}
                  {item.status !== 'uploading' && item.status !== 'done' && (
                    <button
                      type="button"
                      onClick={() => setQueue((q) => q.filter((i) => i.key !== item.key))}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          <Button onClick={uploadAll} disabled={readyCount === 0 || isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            {readyCount > 0 ? `Add ${readyCount} to job` : 'Nothing to add'}
          </Button>
        </section>
      )}

      <section className="space-y-2" aria-label="Paste copy">
        <label htmlFor="paste-copy" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Or paste copy
        </label>
        <Textarea
          id="paste-copy"
          rows={4}
          className="resize-none bg-card text-sm"
          placeholder="First line becomes the headline; the rest is body."
          value={copyText}
          onChange={(e) => setCopyText(e.target.value)}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={submitPastedCopy}
          disabled={!copyText.trim() || isPastingCopy}
        >
          {isPastingCopy && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden />}
          Add copy
        </Button>
      </section>

      {uploadedAssets.length > 0 && (
        <section className="space-y-2" aria-label="Uploaded to this job">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Uploaded to this job ({uploadedAssets.length})
            </p>
            {onGoToSend && uploadedAssets.some((a) => a.status === 'draft') && (
              <Button size="sm" variant="outline" onClick={onGoToSend}>
                <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Send for approval
              </Button>
            )}
          </div>
          {uploadedAssets.map((asset) => (
            <JobAssetRow
              key={asset.id}
              asset={asset}
              onOpen={onOpenAsset ? () => onOpenAsset(asset) : undefined}
            />
          ))}
        </section>
      )}
    </div>
  )
}

export function CreativeModeToggle({
  mode,
  onChange,
}: {
  mode: 'generate' | 'upload'
  onChange: (mode: 'generate' | 'upload') => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="How to add creative"
      className="inline-flex rounded-lg border border-border bg-muted p-0.5"
      data-tour="creative-mode"
    >
      {(['generate', 'upload'] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => onChange(m)}
          className={cn(
            'px-3 py-1 text-sm rounded-md transition-colors',
            mode === m
              ? 'bg-card text-foreground font-medium shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {m === 'generate' ? 'Generate' : 'Upload'}
        </button>
      ))}
    </div>
  )
}
