import { Check, Copy, Trash2, MoreHorizontal, Edit, Send, AlertTriangle } from 'lucide-react'
import { DriftBadge } from './DriftBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { canSubmitAssetForReview } from '@/lib/status'
import {
  formatCopyCharBudget,
  getPrimaryCopyCardWarning,
  isCopyOverCharLimit,
} from '@/lib/copy-display'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { CopyResult } from '@/lib/ai'

interface CopyCardProps {
  copy: CopyResult
  assetId?: string
  status?: string
  /** PRD 10: Drift status when brief changed after asset generation */
  driftStatus?: 'none' | 'review_required' | null
  variantLabel?: string
  selected?: boolean
  inProduction?: boolean
  onSelect?: () => void
  onUseForProduction?: () => void
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSubmit?: () => void
  showActions?: boolean
  /** Channel character budget for display (from getPrimaryCopyBudgetChars) */
  channelMaxChars?: number
}

export function CopyCard({
  copy,
  assetId: _assetId,
  status = 'draft',
  driftStatus,
  variantLabel,
  selected = false,
  inProduction = false,
  onSelect,
  onUseForProduction,
  onView,
  onEdit,
  onDelete,
  onSubmit,
  showActions = true,
  channelMaxChars,
}: CopyCardProps) {
  const handleCopyToClipboard = () => {
    const parts = [copy.headline, '', copy.body, '', `CTA: ${copy.cta}`]
    if (copy.key_message_delivery) parts.unshift(`Key message: ${copy.key_message_delivery}`, '')
    if (copy.cta_alternates?.length) parts.push('', 'Alternates:', ...copy.cta_alternates.map((c) => `• ${c}`))
    navigator.clipboard.writeText(parts.join('\n'))
    toast.success('Copied to clipboard')
  }

  const label = copy.variant_label?.trim() || variantLabel
  const metaChips = [copy.channel?.trim(), copy.deliverable_type?.trim()].filter(Boolean) as string[]
  const keyLine = copy.key_message_delivery?.trim()
  const charBudgetLabel = formatCopyCharBudget(copy, channelMaxChars)
  const overLimit = isCopyOverCharLimit(copy, channelMaxChars)
  const cardWarning = getPrimaryCopyCardWarning(copy, channelMaxChars)
  const hasComplianceFail = copy.exclusions_violated === true

  const handleCardOpen = onView || onSelect

  return (
    <div
      className={`bg-background rounded-xl border-2 p-5 shadow-sm transition-all ${
        inProduction
          ? 'border-primary shadow-md'
          : selected
          ? 'border-primary/40 shadow-sm'
          : 'border-border hover:border-primary/60 hover:shadow-md'
      } ${handleCardOpen ? 'cursor-pointer' : ''}`}
      onClick={handleCardOpen}
      role={onSelect ? 'checkbox' : undefined}
      aria-checked={onSelect ? selected : undefined}
      tabIndex={handleCardOpen ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && handleCardOpen?.()}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          {label && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {label}
            </span>
          )}
          {metaChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Channel and format">
              {metaChips.map((chip) => (
                <Badge key={chip} variant="outline" className="text-[9px] font-normal px-1.5 py-0">
                  {chip}
                </Badge>
              ))}
            </div>
          )}
          {copy.variant_intent?.trim() && (
            <p className="text-xs text-muted-foreground line-clamp-2">{copy.variant_intent.trim()}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {inProduction && (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold">
              In production
            </Badge>
          )}
          {driftStatus === 'review_required' && <DriftBadge />}
          {status && <StatusBadge status={status} />}
          {onSelect && (
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                selected ? 'bg-primary border-primary' : 'border-border'
              }`}
            >
              {selected && <Check className="w-3 h-3 text-white" />}
            </div>
          )}
        </div>
      </div>

      <p className="text-base font-bold text-foreground mb-2 break-words">{copy.headline || '—'}</p>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className={`text-[11px] font-medium tabular-nums ${
            overLimit ? 'text-destructive' : 'text-muted-foreground'
          }`}
          aria-label={overLimit ? 'Character count over channel limit' : 'Character count'}
        >
          {charBudgetLabel}
        </span>
        {(hasComplianceFail || cardWarning) && (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden />
            {hasComplianceFail ? 'Compliance fail' : 'Review warning'}
          </span>
        )}
      </div>

      {cardWarning && (
        <p className="text-xs text-amber-800 dark:text-amber-200 mb-2 line-clamp-2">{cardWarning}</p>
      )}

      {keyLine && (
        <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2" title={keyLine}>
          {keyLine}
        </p>
      )}

      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-4">{copy.body || '—'}</p>
      
      <p className="text-sm font-semibold text-primary">→ {copy.cta}</p>

      {showActions && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border flex-wrap">
          {onSubmit && canSubmitAssetForReview(status) && (
            <Button
              size="sm"
              className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              onClick={(e) => {
                e.stopPropagation()
                onSubmit()
              }}
            >
              <Send className="w-3.5 h-3.5 mr-1" aria-hidden />
              Submit for Review
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleCopyToClipboard()
            }}
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>

          {onUseForProduction && (
            <Button
              variant={inProduction ? 'default' : 'outline'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onUseForProduction()
              }}
            >
              {inProduction ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  In production
                </>
              ) : (
                'Use for key art'
              )}
            </Button>
          )}
          {onSelect && !onUseForProduction && (
            <Button
              variant={selected ? 'default' : 'outline'}
              size="sm"
              className={selected ? '' : ''}
              onClick={(e) => {
                e.stopPropagation()
                onSelect()
              }}
            >
              {selected ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Selected
                </>
              ) : (
                'Select'
              )}
            </Button>
          )}

          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && status === 'draft' && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  )
}
