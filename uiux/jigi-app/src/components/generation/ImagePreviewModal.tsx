import { useState } from 'react'
import { X, Download, RefreshCw, Save, ExternalLink, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ImageResult } from '@/lib/ai'

interface ImagePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  image: ImageResult | null
  conceptTheme?: string
  isGenerating?: boolean
  onRegenerate?: () => void
  onSave?: () => void
  onDiscard?: () => void
  isSaved?: boolean
}

export function ImagePreviewModal({
  open,
  onOpenChange,
  image,
  conceptTheme,
  isGenerating = false,
  onRegenerate,
  onSave,
  onDiscard,
  isSaved = false,
}: ImagePreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true)

  const handleDownload = async () => {
    if (!image) return
    
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-xl border-border shadow-xl" showCloseButton={false} aria-describedby={undefined}>
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {isGenerating ? 'Generating Image...' : 'Generated Image'}
            </DialogTitle>
            <DialogClose asChild>
              <button
                className="rounded-full p-1 hover:bg-muted transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="px-4">
          {conceptTheme && (
            <p className="text-sm text-muted-foreground mb-3">
              Based on concept: <span className="font-medium text-foreground">"{conceptTheme}"</span>
            </p>
          )}

          <div className="relative bg-muted rounded-lg overflow-hidden aspect-square max-h-[500px]">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-sm text-foreground font-medium">Generating image...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take 15-30 seconds</p>
              </div>
            ) : image ? (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <img
                  src={image.url}
                  alt="Generated image"
                  className={`w-full h-full object-contain transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setIsLoading(false)}
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
          </div>

          {image && !isGenerating && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {image.image_provider ? image.image_provider.replace('_', ' ') : image.model || 'unknown model'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {image.size || '1024×1024'}
              </Badge>
              {(image.image_tier || image.quality) && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {image.image_tier || image.quality}
                </Badge>
              )}
              {image.cost_bucket && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {image.cost_bucket === 'free' ? 'Free lane' : 'Paid fallback'}
                </Badge>
              )}
              {isSaved && (
                <Badge className="bg-success/10 text-success text-xs">
                  Saved
                </Badge>
              )}
            </div>
          )}

          {image?.routing_reason && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Routing decision:</p>
              <p className="text-sm text-foreground capitalize">
                {image.routing_reason.replace('_', ' ')}
                {image.provider_model ? ` via ${image.provider_model}` : ''}
              </p>
            </div>
          )}

          {image?.revised_prompt && (
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Revised prompt:</p>
              <p className="text-sm text-foreground">{image.revised_prompt}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-border mt-4">
          <div className="flex items-center gap-2">
            {image && (
              <>
                <Button variant="outline" size="sm" onClick={handleDownload} className="hover:bg-muted transition-colors">
                  <Download className="w-4 h-4 mr-1.5" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(image.url, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Open
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onRegenerate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isGenerating}
                  className="hover:bg-muted transition-colors"
                >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            )}
            
            {onDiscard && !isSaved && (
              <Button variant="ghost" size="sm" onClick={onDiscard} disabled={isGenerating}>
                Discard
              </Button>
            )}
            
            {onSave && !isSaved && (
              <Button
                size="sm"
                onClick={onSave}
                disabled={isGenerating || !image}
                className="transition-colors"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save to Assets
              </Button>
            )}

            {isSaved && (
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="transition-colors"
              >
                Done
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
