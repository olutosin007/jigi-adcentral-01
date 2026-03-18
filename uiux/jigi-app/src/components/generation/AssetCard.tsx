import { useState, useEffect } from 'react'
import { Layers, FileText, Image, MoreHorizontal, Trash2, Eye, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

const statusStyles: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-muted', text: 'text-muted-foreground' },
  agency_review: { bg: 'bg-primary/10', text: 'text-primary' },
  submitted: { bg: 'bg-primary/10', text: 'text-primary' },
  brand_review: { bg: 'bg-warning/10', text: 'text-warning' },
  changes_requested: { bg: 'bg-warning/10', text: 'text-warning' },
  approved: { bg: 'bg-success/10', text: 'text-success' },
  rejected: { bg: 'bg-destructive/10', text: 'text-destructive' },
}

function getAssetName(asset: CreativeAsset): string {
  const content = asset.content as any
  if (asset.type === 'concept') {
    return content?.theme || 'Untitled Concept'
  }
  if (asset.type === 'copy') {
    return content?.headline?.slice(0, 40) || 'Untitled Copy'
  }
  if (asset.type === 'image') {
    return content?.prompt_used?.slice(0, 40) || 'Generated Image'
  }
  return 'Asset'
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
  const statusStyle = statusStyles[asset.status] || statusStyles.draft
  const name = getAssetName(asset)
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
          <Badge variant="secondary" className={`${statusStyle.bg} ${statusStyle.text} text-[10px]`}>
            {asset.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {asset.created_at && formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
          </span>
          
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
              {onSubmit && (asset.status === 'draft' || asset.status === 'agency_review') && (
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
  )
}
