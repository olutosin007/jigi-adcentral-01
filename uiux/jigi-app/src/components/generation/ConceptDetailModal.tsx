import { useMemo } from 'react'
import { Lightbulb, Sparkles, Trash2, Copy, X, FileText, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { canSubmitAssetForReview } from '@/lib/status'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import type { ConceptResult } from '@/lib/ai'

interface ConceptDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  concept: ConceptResult | null
  status?: string
  /** Primary flow: jump to Copy tab with this concept selected */
  onGoToCopy?: () => void
  onGenerateImage?: () => void
  onDelete?: () => void
  onSubmit?: () => void
}

export function ConceptDetailModal({
  open,
  onOpenChange,
  concept,
  status = 'draft',
  onGoToCopy,
  onGenerateImage,
  onDelete,
  onSubmit,
}: ConceptDetailModalProps) {
  const textToCopy = useMemo(() => {
    if (!concept) return ''
    return [
      `Theme: ${concept.theme}`,
      '',
      'Headlines:',
      ...concept.headlines.map((h) => `- ${h}`),
      '',
      `Visual Direction: ${concept.visual_direction}`,
      '',
      `Rationale: ${concept.rationale}`,
    ].join('\n')
  }, [concept])

  if (!concept) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textToCopy)
    toast.success('Concept copied to clipboard')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-xl border-border shadow-xl" showCloseButton={false} aria-describedby={undefined}>
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">Concept Detail</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">Review and act on this concept.</p>
              </div>
            </div>
            <DialogClose asChild>
              <button className="rounded-full p-1 hover:bg-muted transition-colors" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Concept Theme</p>
              <h3 className="text-xl font-semibold text-foreground mt-1">{concept.theme}</h3>
            </div>
            <StatusBadge status={status} />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Headlines</p>
            <div className="space-y-2">
              {concept.headlines.map((headline, idx) => (
                <p key={idx} className="text-sm italic text-foreground">
                  "{headline}"
                </p>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Visual Direction</p>
            <p className="text-sm text-foreground leading-relaxed">{concept.visual_direction}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Rationale</p>
            <p className="text-sm text-foreground leading-relaxed">{concept.rationale}</p>
          </div>

          {concept.key_message_link && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Message Link</p>
              <p className="text-sm text-foreground leading-relaxed">{concept.key_message_link}</p>
            </div>
          )}

          {(concept.brand_alignment_score != null || (concept.validation_warnings?.length ?? 0) > 0) && (
            <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-2">Validation</p>
              {concept.brand_alignment_score != null && (
                <p className="text-sm mb-2">
                  Brand alignment: <strong>{concept.brand_alignment_score}/100</strong>
                  {concept.brand_alignment_score < 60 && (
                    <span className="text-amber-700 dark:text-amber-300 ml-2">(below 60 — review recommended)</span>
                  )}
                </p>
              )}
              {concept.brand_alignment_rationale && (
                <p className="text-sm text-muted-foreground mb-2">{concept.brand_alignment_rationale}</p>
              )}
              {concept.validation_warnings?.map((w, i) => (
                <p key={i} className="text-sm text-amber-800 dark:text-amber-200">• {w}</p>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={handleCopy} className="hover:bg-muted transition-colors">
            <Copy className="w-4 h-4 mr-1.5" aria-hidden />
            Copy
          </Button>
          <TooltipProvider delayDuration={300}>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {onSubmit && canSubmitAssetForReview(status) && (
                <Button
                  size="sm"
                  className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={onSubmit}
                >
                  <Send className="w-4 h-4 mr-1.5" aria-hidden />
                  Submit for Review
                </Button>
              )}
              {onDelete && status === 'draft' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={onDelete}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" aria-hidden />
                  Delete
                </Button>
              )}
              {onGenerateImage && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="transition-colors" onClick={onGenerateImage}>
                      <Sparkles className="w-4 h-4 mr-1.5" aria-hidden />
                      Generate image
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs">
                    Key art often works best after you have copy—still fine to generate from the visual direction now.
                  </TooltipContent>
                </Tooltip>
              )}
              {onGoToCopy && (
                <Button
                  size="sm"
                  className="transition-colors"
                  onClick={onGoToCopy}
                >
                  <FileText className="w-4 h-4 mr-1.5" aria-hidden />
                  Generate copy
                </Button>
              )}
            </div>
          </TooltipProvider>
        </div>
      </DialogContent>
    </Dialog>
  )
}
