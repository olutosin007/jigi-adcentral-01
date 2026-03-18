import { useState } from 'react'
import { Download, ExternalLink, Trash2, MoreHorizontal, RefreshCw, Check, ZoomIn } from 'lucide-react'
import { DriftBadge } from './DriftBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ImageResult } from '@/lib/ai'

interface ImageCardProps {
  image: ImageResult
  assetId?: string
  status?: string
  /** PRD 10: Drift status when brief changed after asset generation */
  driftStatus?: 'none' | 'review_required' | null
  selected?: boolean
  onSelect?: () => void
  onRegenerate?: () => void
  onDelete?: () => void
  onView?: () => void
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

export function ImageCard({
  image,
  assetId: _assetId,
  status = 'draft',
  driftStatus,
  selected = false,
  onSelect,
  onRegenerate,
  onDelete,
  onView,
  showActions = true,
}: ImageCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `generated-image-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      window.open(image.url, '_blank')
    }
  }

  return (
    <div
      className={`bg-background rounded-xl border-2 overflow-hidden shadow-sm transition-all ${
        selected
          ? 'border-primary shadow-md'
          : 'border-border hover:border-primary/60 hover:shadow-md'
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={onSelect}
    >
      <div className="relative aspect-square bg-muted">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <span className="text-4xl mb-2">🖼</span>
            <span className="text-xs">Failed to load</span>
          </div>
        ) : (
          <img
            src={image.url}
            alt="Generated image"
            className={`w-full h-full object-cover transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
          />
        )}

        {onSelect && (
          <div
            className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              selected ? 'bg-primary border-primary' : 'bg-background/90 border-border'
            }`}
          >
            {selected && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
        )}

        {driftStatus === 'review_required' && (
          <div className="absolute bottom-2 left-2">
            <DriftBadge />
          </div>
        )}
        {status && (
          <Badge
            className={`absolute top-2 right-2 text-[10px] ${statusStyles[status] || statusStyles.draft}`}
          >
            {status.replace('_', ' ')}
          </Badge>
        )}

        {onView && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors group"
          >
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {showActions && (
        <div className="p-3 border-t border-border">
          <p className="text-xs text-muted-foreground truncate mb-2" title={image.prompt_used}>
            {image.prompt_used?.slice(0, 60)}...
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {image.size || '1024×1024'}
            </span>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload()
                }}
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.open(image.url, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in new tab
                  </DropdownMenuItem>
                  {onRegenerate && (
                    <DropdownMenuItem onClick={onRegenerate}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </DropdownMenuItem>
                  )}
                  {onDelete && status === 'draft' && (
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
      )}
    </div>
  )
}
