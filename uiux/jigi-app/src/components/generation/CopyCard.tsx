import { Check, Copy, Trash2, MoreHorizontal, Edit } from 'lucide-react'
import { DriftBadge } from './DriftBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  onSelect?: () => void
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  showActions?: boolean
}

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  agency_review: 'bg-primary/10 text-primary',
  submitted: 'bg-primary/10 text-primary',
  brand_review: 'bg-warning/10 text-warning',
  changes_requested: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
}

export function CopyCard({
  copy,
  assetId: _assetId,
  status = 'draft',
  driftStatus,
  variantLabel,
  selected = false,
  onSelect,
  onView,
  onEdit,
  onDelete,
  showActions = true,
}: CopyCardProps) {
  const handleCopyToClipboard = () => {
    const text = `${copy.headline}\n\n${copy.body}\n\n${copy.cta}`
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

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
        <div className="flex items-center gap-2">
          {variantLabel && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {variantLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {driftStatus === 'review_required' && <DriftBadge />}
          {status && (
            <Badge variant="secondary" className={`text-[10px] ${statusStyles[status] || statusStyles.draft}`}>
              {status.replace('_', ' ')}
            </Badge>
          )}
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

      <p className="text-base font-bold text-foreground mb-2">{copy.headline}</p>
      
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">{copy.body}</p>
      
      <p className="text-sm font-semibold text-primary">→ {copy.cta}</p>

      {showActions && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
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

          {onSelect && (
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
