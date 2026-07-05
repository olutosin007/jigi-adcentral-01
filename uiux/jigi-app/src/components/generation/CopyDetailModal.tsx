import { useMemo } from 'react'
import { FileText, Trash2, Copy, X, ChevronDown, Image as ImageIcon, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { canSubmitAssetForReview } from '@/lib/status'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatCopyCharBudget, isCopyOverCharLimit } from '@/lib/copy-display'
import { toast } from 'sonner'
import type { CopyResult } from '@/lib/ai'

interface CopyDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  copy: CopyResult | null
  status?: string
  /** Fallback when `copy.variant_label` is missing (e.g. Variant A) */
  variantLabel?: string
  /** Optional channel library hint for copy length (read-only) */
  channelMaxCharsHint?: number
  /** Parent concept theme for compliance context */
  parentConceptTheme?: string
  onDelete?: () => void
  /** Opens image flow anchored on this copy variant (GenerationPanel). */
  onGenerateImage?: () => void
  isGeneratingImage?: boolean
  onSubmit?: () => void
}

function sectionLabel(text: string) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{text}</p>
}

export function CopyDetailModal({
  open,
  onOpenChange,
  copy,
  status = 'draft',
  variantLabel,
  channelMaxCharsHint,
  parentConceptTheme,
  onDelete,
  onGenerateImage,
  isGeneratingImage = false,
  onSubmit,
}: CopyDetailModalProps) {
  const displayVariant = copy?.variant_label?.trim() || variantLabel

  const textToCopy = useMemo(() => {
    if (!copy) return ''
    const parts: string[] = []
    if (displayVariant) parts.push(displayVariant)
    if (copy.channel || copy.deliverable_type) {
      parts.push([copy.channel, copy.deliverable_type].filter(Boolean).join(' · '))
    }
    if (copy.variant_intent) parts.push(`Intent: ${copy.variant_intent}`)
    if (copy.key_message_delivery) parts.push(`Key message: ${copy.key_message_delivery}`)
    parts.push(copy.headline, '', copy.body, '', `CTA: ${copy.cta}`)
    if (copy.cta_alternates?.length) parts.push('', 'CTA alternates:', ...copy.cta_alternates.map((c) => `• ${c}`))
    if (copy.primary_text) parts.push('', `Primary text: ${copy.primary_text}`)
    if (copy.subject_line) parts.push(`Subject: ${copy.subject_line}`)
    if (copy.preview_text) parts.push(`Preview: ${copy.preview_text}`)
    return parts.join('\n')
  }, [copy, displayVariant])

  if (!copy) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textToCopy)
    toast.success('Copy variant copied')
  }

  const charCount = copy.character_count
  const hasSuiteMeta =
    !!copy.channel?.trim() ||
    !!copy.deliverable_type?.trim() ||
    !!copy.variant_intent?.trim() ||
    !!displayVariant
  const hasModelChecks =
    (copy.mandatory_inclusions_check?.length ?? 0) > 0 ||
    (copy.exclusions_check?.length ?? 0) > 0 ||
    copy.legal_disclaimers_appended === true
  const hasPipelineValidation =
    (copy.validation_warnings?.length ?? 0) > 0 ||
    !!copy.truncation_suggestion ||
    copy.exclusions_violated ||
    isCopyOverCharLimit(copy, channelMaxCharsHint) ||
    (copy.brand_voice_score != null && copy.brand_voice_score < 50)

  const mandatoryFailCount =
    copy.mandatory_inclusions_check?.filter((row) => !row.present).length ?? 0
  const exclusionFailCount = copy.exclusions_check?.filter((row) => row.violated).length ?? 0
  const complianceDefaultOpen = mandatoryFailCount > 0 || exclusionFailCount > 0 || copy.exclusions_violated

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden rounded-xl border-border shadow-xl"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700">
                <FileText className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <DialogTitle className="text-lg">Copy Detail</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">Review and action this copy variant.</p>
              </div>
            </div>
            <DialogClose asChild>
              <button type="button" className="rounded-full p-1 hover:bg-muted transition-colors" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              {displayVariant && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{displayVariant}</p>
              )}
              <h3 className="text-xl font-semibold text-foreground mt-1 break-words">{copy.headline || '—'}</h3>
            </div>
            <StatusBadge status={status} className="shrink-0" />
          </div>

          {hasSuiteMeta && (
            <div className="flex flex-wrap gap-2 items-center">
              {copy.channel?.trim() ? (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {copy.channel}
                </Badge>
              ) : null}
              {copy.deliverable_type?.trim() ? (
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {copy.deliverable_type}
                </Badge>
              ) : null}
              {copy.variant_intent?.trim() ? (
                <span className="text-xs text-muted-foreground w-full sm:w-auto">{copy.variant_intent}</span>
              ) : null}
            </div>
          )}

          {parentConceptTheme?.trim() ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              {sectionLabel('Parent concept')}
              <p className="text-sm font-medium text-foreground">{parentConceptTheme.trim()}</p>
            </div>
          ) : null}

          {copy.key_message_delivery?.trim() ? (
            <div>
              {sectionLabel('Key message')}
              <p className="text-sm text-foreground leading-relaxed border-l-2 border-primary/40 pl-3">{copy.key_message_delivery}</p>
            </div>
          ) : null}

          <div>
            {sectionLabel('Body copy')}
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{copy.body?.trim() || '—'}</p>
          </div>

          {copy.primary_text?.trim() ? (
            <div>
              {sectionLabel('Primary text')}
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{copy.primary_text}</p>
            </div>
          ) : null}

          {(copy.subject_line?.trim() || copy.preview_text?.trim()) ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {copy.subject_line?.trim() ? (
                <div>
                  {sectionLabel('Subject line')}
                  <p className="text-sm font-medium text-foreground">{copy.subject_line}</p>
                </div>
              ) : null}
              {copy.preview_text?.trim() ? (
                <div>
                  {sectionLabel('Preview text')}
                  <p className="text-sm text-muted-foreground">{copy.preview_text}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            {sectionLabel('CTA')}
            <p className="text-sm font-medium text-primary">{copy.cta?.trim() || '—'}</p>
            {copy.cta_alternates && copy.cta_alternates.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-primary/90 list-disc list-inside" aria-label="Alternate CTAs">
                {copy.cta_alternates.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            ) : null}
          </div>

          {(charCount != null || channelMaxCharsHint != null || copy.tone_adherence != null) && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm space-y-1">
              {(charCount != null || channelMaxCharsHint != null) && (
                <p>
                  <span className="text-muted-foreground">Character count: </span>
                  <span
                    className={`font-medium tabular-nums ${
                      isCopyOverCharLimit(copy, channelMaxCharsHint) ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {formatCopyCharBudget(copy, channelMaxCharsHint)}
                  </span>
                  {channelMaxCharsHint != null && (
                    <span className="text-muted-foreground"> (channel limit)</span>
                  )}
                </p>
              )}
              {copy.tone_adherence != null && (
                <p className="text-muted-foreground">
                  Tone adherence (model):{' '}
                  <span className="font-medium text-foreground tabular-nums">{copy.tone_adherence}</span>
                  <span className="text-muted-foreground"> / 100</span>
                </p>
              )}
            </div>
          )}

          {hasModelChecks ? (
            <Collapsible defaultOpen={complianceDefaultOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors [&[data-state=open]>svg]:rotate-180">
                <span>
                  Compliance summary
                  {(mandatoryFailCount > 0 || exclusionFailCount > 0) && (
                    <span className="ml-2 text-xs font-normal text-destructive">
                      {mandatoryFailCount + exclusionFailCount} issue
                      {mandatoryFailCount + exclusionFailCount === 1 ? '' : 's'}
                    </span>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" aria-hidden />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 pt-2 space-y-3 border border-t-0 border-border rounded-b-lg bg-muted/20">
                {copy.mandatory_inclusions_check && copy.mandatory_inclusions_check.length > 0 ? (
                  <div role="table" aria-label="Mandatory inclusions">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Mandatory inclusions</p>
                    <div className="rounded-md border border-border overflow-hidden">
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-2 text-xs bg-muted/40 font-medium text-muted-foreground">
                        <span>Status</span>
                        <span>Requirement</span>
                      </div>
                      {copy.mandatory_inclusions_check.map((row, i) => (
                        <div key={i} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-2 text-sm border-t border-border">
                          <span className={row.present ? 'text-success' : 'text-destructive'} aria-hidden>
                            {row.present ? '✓' : '✗'}
                          </span>
                          <span>{row.requirement || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {copy.exclusions_check && copy.exclusions_check.length > 0 ? (
                  <div role="table" aria-label="Exclusions">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Exclusions</p>
                    <div className="rounded-md border border-border overflow-hidden">
                      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-2 text-xs bg-muted/40 font-medium text-muted-foreground">
                        <span>Status</span>
                        <span>Exclusion</span>
                      </div>
                      {copy.exclusions_check.map((row, i) => (
                        <div key={i} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-2 text-sm border-t border-border">
                          <span className={row.violated ? 'text-destructive' : 'text-muted-foreground'} aria-hidden>
                            {row.violated ? '!' : '○'}
                          </span>
                          <span>{row.exclusion || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {copy.legal_disclaimers_appended ? (
                  <p className="text-xs text-muted-foreground">Legal disclaimers flagged as appended in this variant.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Legal disclaimers: not flagged as appended.</p>
                )}
              </CollapsibleContent>
            </Collapsible>
          ) : null}

          {hasPipelineValidation && (
            <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-2">Validation</p>
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
                <p key={i} className="text-sm text-amber-800 dark:text-amber-200">
                  • {w}
                </p>
              ))}
            </div>
          )}

        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleCopy} className="hover:bg-muted transition-colors">
              <Copy className="w-4 h-4 mr-1.5" aria-hidden />
              Copy
            </Button>
            {onGenerateImage && (
              <Button
                type="button"
                size="sm"
                onClick={onGenerateImage}
                disabled={isGeneratingImage}
                className="transition-colors"
              >
                <ImageIcon className="w-4 h-4 mr-1.5" aria-hidden />
                {isGeneratingImage ? 'Generating…' : 'Generate image'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
