import { useState } from 'react'
import { Download, ExternalLink, Trash2, MoreHorizontal, RefreshCw, Check, ZoomIn, Send, Wand2, Maximize2, Loader2 } from 'lucide-react'
import { DriftBadge } from './DriftBadge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { canSubmitAssetForReview } from '@/lib/status'
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
  onSubmit?: () => void
  /** Loads this image's prompt, tier and aspect back into the composer. */
  onRemix?: () => void
  onUpscale?: () => void
  isUpscaling?: boolean
  version?: number
  showActions?: boolean
}

const ASPECT_CLASS: Record<string, string> = {
  '1:1': 'aspect-square',
  '4:5': 'aspect-[4/5]',
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-video',
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
  onSubmit,
  onRemix,
  onUpscale,
  isUpscaling = false,
  version,
  showActions = true,
}: ImageCardProps) {
  const canUpscale = !!onUpscale && !image.upscaled_from
  const aspectClass = ASPECT_CLASS[image.aspect_ratio ?? '1:1'] ?? 'aspect-square'
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
      <div className={`relative ${aspectClass} bg-muted`}>
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
          <div className="absolute top-2 right-2">
            <StatusBadge status={status} />
          </div>
        )}
        {version != null && version > 1 && (
          <span
            className="absolute bottom-2 right-2 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground"
            data-testid="image-version-badge"
          >
            v{version}
            {image.upscaled_from ? ` · ${image.upscale_scale ?? 2}×` : ''}
          </span>
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
          
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {[image.aspect_ratio, image.image_resolution].filter(Boolean).join(' · ') || image.size || '1024×1024'}
            </span>
            
            <div className="flex items-center gap-1 flex-wrap">
              {onSubmit && canSubmitAssetForReview(status) && (
                <Button
                  size="sm"
                  className="h-7 text-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSubmit()
                  }}
                >
                  <Send className="w-3 h-3 mr-1" aria-hidden />
                  Submit
                </Button>
              )}
              {onRemix && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  aria-label="Remix"
                  title="Remix"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemix()
                  }}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                </Button>
              )}
              {canUpscale && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  aria-label={isUpscaling ? 'Upscaling' : 'Upscale 2×'}
                  title="Upscale 2×"
                  disabled={isUpscaling}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpscale?.()
                  }}
                >
                  {isUpscaling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label="Download"
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
                    aria-label="More actions"
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
