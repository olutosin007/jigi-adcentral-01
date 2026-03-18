import { useMemo } from 'react'
import { FileText, Trash2, Copy, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { CopyResult } from '@/lib/ai'

interface CopyDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  copy: CopyResult | null
  status?: string
  variantLabel?: string
  onDelete?: () => void
}

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  agency_review: 'bg-purple-100 text-purple-800',
  submitted: 'bg-primary/10 text-primary',
  brand_review: 'bg-amber-100 text-amber-800',
  changes_requested: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
}

export function CopyDetailModal({
  open,
  onOpenChange,
  copy,
  status = 'draft',
  variantLabel,
  onDelete,
}: CopyDetailModalProps) {
  const textToCopy = useMemo(() => {
    if (!copy) return ''
    return `${copy.headline}\n\n${copy.body}\n\nCTA: ${copy.cta}`
  }, [copy])

  if (!copy) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textToCopy)
    toast.success('Copy variant copied')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-xl border-border shadow-xl" showCloseButton={false} aria-describedby={undefined}>
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">Copy Detail</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">Review and action this copy variant.</p>
              </div>
            </div>
            <DialogClose asChild>
              <button className="rounded-full p-1 hover:bg-muted transition-colors" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              {variantLabel && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{variantLabel}</p>
              )}
              <h3 className="text-xl font-semibold text-foreground mt-1">{copy.headline}</h3>
            </div>
            <Badge className={`text-[10px] ${statusStyles[status] || statusStyles.draft}`}>
              {status.replace('_', ' ')}
            </Badge>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Body Copy</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{copy.body}</p>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">CTA</p>
            <p className="text-sm font-medium text-primary">{copy.cta}</p>
          </div>

          {(copy.character_count != null ||
            copy.key_message_delivery ||
            (copy.validation_warnings?.length ?? 0) > 0 ||
            copy.truncation_suggestion ||
            copy.exclusions_violated ||
            (copy.brand_voice_score != null && copy.brand_voice_score < 50)) && (
            <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-2">Validation</p>
              {copy.character_count != null && (
                <p className="text-sm mb-1">Character count: {copy.character_count}</p>
              )}
              {copy.key_message_delivery && (
                <p className="text-sm text-muted-foreground mb-2">{copy.key_message_delivery}</p>
              )}
              {copy.exclusions_violated && (
                <p className="text-sm text-destructive font-medium mb-2">Exclusions violated — approval blocked</p>
              )}
              {copy.truncation_suggestion && (
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">{copy.truncation_suggestion}</p>
              )}
              {copy.brand_voice_score != null && copy.brand_voice_score < 50 && (
                <p className="text-sm mb-2">
                  Brand voice score: {copy.brand_voice_score}/100
                  {copy.brand_tune_suggestion && (
                    <span className="block text-muted-foreground mt-1">{copy.brand_tune_suggestion}</span>
                  )}
                </p>
              )}
              {copy.validation_warnings?.map((w, i) => (
                <p key={i} className="text-sm text-amber-800 dark:text-amber-200">• {w}</p>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleCopy} className="hover:bg-muted transition-colors">
            <Copy className="w-4 h-4 mr-1.5" />
            Copy
          </Button>
          {onDelete && status === 'draft' && (
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 transition-colors" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
