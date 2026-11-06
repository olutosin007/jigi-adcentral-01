import { useState, useEffect } from 'react'
import { Layers, FileText, Image, MoreHorizontal, Trash2, Eye, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { canSubmitAssetForReview } from '@/lib/status'
import { DriftBadge } from './DriftBadge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import type { CreativeAsset } from '@/store/campaignStore'

interface AssetCardProps {
  asset: CreativeAsset
  selected?: boolean
  onSelect?: (checked: boolean) => void
  onView?: () => void
  onDelete?: () => void
  onSubmit?: () => void
}

const typeIcons = {
  concept: Layers,
  copy: FileText,
  image: Image,
}

const typeGradients = {
  concept: 'from-primary to-primary/80',
  copy: 'from-chart-2 to-chart-3',
  image: 'from-chart-3 to-chart-4',
}

function getAssetName(asset: CreativeAsset): string {
  const content = asset.content as unknown as Record<string, unknown>
  if (asset.type === 'concept') {
    return (content?.theme as string) || 'Untitled Concept'
  }
  if (asset.type === 'copy') {
    const h = content?.headline as string | undefined
    return h?.slice(0, 40) || 'Untitled Copy'
  }
  if (asset.type === 'image') {
    return (content?.prompt_used as string | undefined)?.slice(0, 40) || 'Generated Image'
  }
  return 'Asset'
}

function getCopyCardMeta(asset: CreativeAsset): { chips: string[]; keySnippet?: string } {
  if (asset.type !== 'copy') return { chips: [] }
  const c = asset.content as unknown as Record<string, unknown>
  const chips = [c.channel, c.deliverable_type].map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
  const km = c.key_message_delivery
  const keySnippet =
    typeof km === 'string' && km.trim()
      ? km.trim().length > 72
        ? `${km.trim().slice(0, 72)}…`
        : km.trim()
      : undefined
  return { chips, keySnippet }
}

export function AssetCard({
  asset,
  selected = false,
  onSelect,
  onView,
  onDelete,
  onSubmit,
}: AssetCardProps) {
  const Icon = typeIcons[asset.type] || Layers
  const gradient = typeGradients[asset.type] || typeGradients.concept
  const name = getAssetName(asset)
  const copyMeta = getCopyCardMeta(asset)
  const imageUrl = asset.type === 'image' ? (asset.content as { url?: string })?.url : null
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [asset.id, imageUrl])

  const showImage = imageUrl && !imageError

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all group">
      <div
        className={`h-28 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}
      >
        {showImage ? (
          <img
            src={imageUrl ?? ''}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Icon className="w-8 h-8 text-white/60" />
        )}
        
        {onSelect && (
          <div className="absolute top-2 left-2">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="bg-white/90 border-white"
            />
          </div>
        )}

        {asset.generation_mode === 'idea_first' && (
          <Badge className="absolute top-2 right-2 bg-warning text-primary-foreground text-[9px]">
            Idea-first
          </Badge>
        )}
        {asset.drift_status === 'review_required' && (
          <div className="absolute bottom-2 right-2">
            <DriftBadge />
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-sm font-medium text-foreground mb-2 truncate" title={name}>
          {name}
        </p>

        {asset.type === 'copy' && (copyMeta.chips.length > 0 || copyMeta.keySnippet) && (
          <div className="mb-2 space-y-1.5">
            {copyMeta.chips.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {copyMeta.chips.map((chip) => (
                  <Badge key={chip} variant="outline" className="text-[8px] px-1 py-0 font-normal">
                    {chip}
                  </Badge>
                ))}
              </div>
            )}
            {copyMeta.keySnippet && (
              <p className="text-[10px] text-muted-foreground line-clamp-2" title={copyMeta.keySnippet}>
                {copyMeta.keySnippet}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground capitalize">{asset.type}</span>
            {asset.source && (
              <Badge
                variant="outline"
                className="text-[9px] border-primary/30 bg-primary/10 text-primary"
              >
                {asset.source === 'uploaded' ? 'Uploaded' : 'AI'}
              </Badge>
            )}
          </div>
          <StatusBadge status={asset.status} />
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
          <span>
            {asset.created_at && formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
          </span>

          <div className="flex items-center gap-1">
            {onSubmit && canSubmitAssetForReview(asset.status) && (
              <Button
                size="sm"
                className="h-7 text-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={onSubmit}
              >
                <Send className="w-3 h-3 mr-1" aria-hidden />
                Submit
              </Button>
            )}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={onView}>
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </DropdownMenuItem>
              )}
              {onSubmit && canSubmitAssetForReview(asset.status) && (
                <DropdownMenuItem onClick={onSubmit}>
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Review
                </DropdownMenuItem>
              )}
              {onDelete && asset.status === 'draft' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
