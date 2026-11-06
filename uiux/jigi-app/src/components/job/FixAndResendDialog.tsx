import { useEffect, useState } from 'react'
import { Loader2, MessageSquareWarning, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UploadDropzone } from '@/components/upload/UploadDropzone'
import { AssetHeroPreview } from '@/components/decide/AssetHeroPreview'
import { getAssetTitle, roundLabel } from '@/lib/handoff'
import type { CreativeAsset } from '@/store/campaignStore'

const EDITABLE_FIELDS: Record<CreativeAsset['type'], { key: string; label: string; multiline?: boolean }[]> = {
  copy: [
    { key: 'headline', label: 'Headline' },
    { key: 'body', label: 'Body', multiline: true },
    { key: 'cta', label: 'Call to action' },
  ],
  concept: [
    { key: 'theme', label: 'Theme' },
    { key: 'visual_direction', label: 'Visual direction', multiline: true },
    { key: 'rationale', label: 'Rationale', multiline: true },
  ],
  image: [],
}

export interface FixAndResendPayload {
  fields?: Record<string, string>
  file?: File
  note?: string
}

interface FixAndResendDialogProps {
  asset: CreativeAsset | null
  /** Round the asset was last sent in. */
  round: number
  onOpenChange: (open: boolean) => void
  onResend: (asset: CreativeAsset, payload: FixAndResendPayload) => Promise<void>
  isSending: boolean
}

function initialFields(asset: CreativeAsset | null): Record<string, string> {
  if (!asset) return {}
  const content = (asset.content ?? {}) as unknown as Record<string, unknown>
  return Object.fromEntries(
    EDITABLE_FIELDS[asset.type].map((f) => [f.key, typeof content[f.key] === 'string' ? (content[f.key] as string) : ''])
  )
}

export function FixAndResendDialog({ asset, round, onOpenChange, onResend, isSending }: FixAndResendDialogProps) {
  const [fields, setFields] = useState<Record<string, string>>({})
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    setFields(initialFields(asset))
    setFile(null)
    setNote('')
  }, [asset])

  if (!asset) return null

  const original = initialFields(asset)
  const changedFields = Object.fromEntries(Object.entries(fields).filter(([k, v]) => v !== original[k]))
  const hasRevision = Object.keys(changedFields).length > 0 || !!file
  const content = (asset.content ?? {}) as unknown as Record<string, unknown>
  const acceptsFile = asset.type === 'image' || typeof content.file_url === 'string'
  const nextLabel = roundLabel(round + 1)

  const handleResend = () =>
    onResend(asset, {
      fields: Object.keys(changedFields).length > 0 ? changedFields : undefined,
      file: file ?? undefined,
      note: note.trim() || undefined,
    })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-tour="fix-resend">
        <DialogHeader>
          <DialogTitle>Fix & resend</DialogTitle>
          <DialogDescription>
            {getAssetTitle(asset)} · goes back to the client as {nextLabel}
          </DialogDescription>
        </DialogHeader>

        <section
          className="flex gap-2.5 rounded-md border-l-2 border-warning bg-warning/5 px-3.5 py-3"
          aria-label="What the client asked for"
        >
          <MessageSquareWarning className="h-4 w-4 shrink-0 text-warning mt-0.5" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">What the client asked for</p>
            <p className="mt-1 text-sm text-foreground whitespace-pre-line">
              {asset.review_notes?.trim() || 'No notes were left — check comments on the asset.'}
            </p>
          </div>
        </section>

        <div className="space-y-4">
          {EDITABLE_FIELDS[asset.type].length > 0 && (
            <div className="space-y-3">
              {EDITABLE_FIELDS[asset.type].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={`fix-${f.key}`}>{f.label}</Label>
                  {f.multiline ? (
                    <Textarea
                      id={`fix-${f.key}`}
                      rows={3}
                      value={fields[f.key] ?? ''}
                      onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      id={`fix-${f.key}`}
                      value={fields[f.key] ?? ''}
                      onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {acceptsFile && (
            <div className="space-y-2">
              {asset.type === 'image' && !file && <AssetHeroPreview asset={asset} className="max-h-64 overflow-hidden" />}
              {file ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
                  <span className="truncate">Revised file: {file.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                    Remove
                  </Button>
                </div>
              ) : (
                <UploadDropzone
                  accept={asset.type === 'image' ? ['image/png', 'image/jpeg', 'image/webp'] : undefined}
                  onFileSelected={setFile}
                  title="Upload revised file"
                  hint={asset.original_filename ? `Replaces ${asset.original_filename}` : 'Replaces the current file'}
                />
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="fix-note">Tell the client what changed</Label>
            <Textarea
              id="fix-note"
              rows={2}
              placeholder="e.g. Logo enlarged and CTA moved above the fold"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {!hasRevision && (
            <p className="text-xs text-muted-foreground" data-testid="no-revision-hint">
              Nothing changed yet — the client will see the same version.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleResend} disabled={isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4 mr-1.5" aria-hidden />
            )}
            Resend as {nextLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
