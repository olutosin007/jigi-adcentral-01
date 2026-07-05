import { Check, Image, Sparkles, FileText, Trash2, MoreHorizontal, AlertTriangle, Send } from 'lucide-react'
import { DriftBadge } from './DriftBadge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { canSubmitAssetForReview } from '@/lib/status'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ConceptResult } from '@/lib/ai'

interface ConceptCardProps {
  concept: ConceptResult
  assetId?: string // Keep for future use
  status?: string
  /** PRD 10: Drift status when brief changed after asset generation */
  driftStatus?: 'none' | 'review_required' | null
  selected?: boolean
  onSelect?: () => void
  onView?: () => void
  onGenerateCopy?: () => void
  onGenerateImage?: () => void
  onDelete?: () => void
  onSubmit?: () => void
  showActions?: boolean
}

export function ConceptCard({
  concept,
  assetId: _assetId,
  status = 'draft',
  driftStatus,
  selected = false,
  onSelect,
  onView,
  onGenerateCopy,
  onGenerateImage,
  onDelete,
  onSubmit,
  showActions = true,
}: ConceptCardProps) {
  const headlines = concept.headlines || []
  const displayHeadlines = headlines.slice(0, 2) as [string, string] | [string] | []

  const handleCardOpen = onView || onSelect

  return (
    <div
      className={`bg-background rounded-xl border-2 p-5 shadow-sm transition-all ${
        selected
          ? 'border-primary shadow-md'
          : 'border-border hover:border-primary/60 hover:shadow-md'
      } ${handleCardOpen ? 'cursor-pointer' : ''}`}
      onClick={handleCardOpen}
      role={onSelect ? 'checkbox' : undefined}
      aria-checked={onSelect ? selected : undefined}
      tabIndex={handleCardOpen ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && handleCardOpen?.()}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Concept Theme
          </span>
          <h3 className="text-sm font-bold text-foreground mt-0.5 truncate">{concept.theme}</h3>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="space-y-1.5 mb-4">
        {displayHeadlines.map((headline, i) => (
          <p
            key={i}
            className={`text-sm italic ${i === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          >
            "{headline}"
          </p>
        ))}
        {headlines.length > 2 && (
          <p className="text-xs text-muted-foreground">+{headlines.length - 2} more headlines</p>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-muted rounded-lg mb-4">
        <Image className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground line-clamp-3">{concept.visual_direction}</p>
      </div>

      {concept.rationale && (
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
          <strong>Why:</strong> {concept.rationale}
        </p>
      )}

      {(concept.validation_warnings?.length ?? 0) > 0 || (typeof concept.brand_alignment_score === 'number' && concept.brand_alignment_score < 60) ? (
        <div className="mb-4 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              {concept.brand_alignment_score != null && concept.brand_alignment_score < 60 && (
                <p>Brand alignment: {concept.brand_alignment_score}/100</p>
              )}
              {concept.validation_warnings?.slice(0, 2).map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showActions && (
        <div className="flex items-center gap-2 flex-wrap">
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
          {onSelect && (
            <Button
              variant={selected ? 'default' : 'outline'}
              size="sm"
              className={selected ? 'flex-1' : 'flex-1'}
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

          {(onGenerateCopy || onGenerateImage || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onGenerateCopy && (
                  <DropdownMenuItem
                    onClick={onGenerateCopy}
                    className="flex flex-col items-stretch gap-0.5 py-2.5"
                  >
                    <span className="flex items-center text-sm">
                      <FileText className="w-4 h-4 mr-2 shrink-0" />
                      Generate copy
                    </span>
                    <span className="text-[10px] text-muted-foreground pl-6 leading-snug">
                      Opens Copy tab with this concept selected
                    </span>
                  </DropdownMenuItem>
                )}
                {onGenerateImage && (
                  <DropdownMenuItem
                    onClick={onGenerateImage}
                    className="flex flex-col items-stretch gap-0.5 py-2.5"
                  >
                    <span className="flex items-center text-sm">
                      <Sparkles className="w-4 h-4 mr-2 shrink-0" />
                      Generate image
                    </span>
                    <span className="text-[10px] text-muted-foreground pl-6 leading-snug">
                      Optional now; often stronger after copy is set
                    </span>
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
