import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  Download,
  X,
  Image as ImageIcon,
  FileText,
  Lightbulb,
  CheckCircle2,
  User,
  Calendar,
  Palette,
  Sparkles,
  Copy,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { CreativeAsset, ConceptContent, CopyContent, ImageContent } from '@/store/campaignStore'

interface AssetDetailModalProps {
  asset: CreativeAsset | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: (asset: CreativeAsset) => void
  campaignName?: string
  brandName?: string
}

export function AssetDetailModal({
  asset,
  open,
  onOpenChange,
  onDownload,
  campaignName,
  brandName,
}: AssetDetailModalProps) {
  const navigate = useNavigate()
  if (!asset) return null

  const getAssetIcon = () => {
    switch (asset.type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />
      case 'copy':
        return <FileText className="h-5 w-5" />
      case 'concept':
        return <Lightbulb className="h-5 w-5" />
      default:
        return <ImageIcon className="h-5 w-5" />
    }
  }

  const getAssetName = (): string => {
    if (asset.type === 'concept' && 'theme' in asset.content) {
      return (asset.content as ConceptContent).theme || 'Untitled Concept'
    }
    if (asset.type === 'copy' && 'headline' in asset.content) {
      return (asset.content as CopyContent).headline || 'Untitled Copy'
    }
    if (asset.type === 'image' && 'prompt_used' in asset.content) {
      return (asset.content as ImageContent).prompt_used?.slice(0, 40) || 'Generated Image'
    }
    return `Asset ${asset.id.slice(0, 8)}`
  }

  const getContentText = (): string => {
    if (asset.type === 'concept' && 'theme' in asset.content) {
      const c = asset.content as ConceptContent
      return `Theme: ${c.theme}\n\nHeadlines:\n${c.headlines?.join('\n') ?? ''}\n\nVisual Direction: ${c.visual_direction}\n\nRationale: ${c.rationale}`
    }
    if (asset.type === 'copy' && 'headline' in asset.content) {
      const c = asset.content as CopyContent
      return `${c.headline}\n\n${c.body}\n\nCTA: ${c.cta}`
    }
    if (asset.type === 'image' && 'prompt_used' in asset.content) {
      return (asset.content as ImageContent).prompt_used ?? ''
    }
    return 'No content available'
  }

  const imageContent = asset.type === 'image' ? (asset.content as ImageContent) : null
  const hasImageUrl = !!imageContent?.url

  const handleCopyContent = async () => {
    const text = getContentText()
    await navigator.clipboard.writeText(text)
    toast.success('Content copied to clipboard')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 rounded-xl border-border shadow-xl" showCloseButton={false} aria-describedby={undefined}>
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">{getAssetName()}</DialogTitle>
                <p className="text-sm text-muted-foreground">Approved asset</p>
              </div>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" aria-label="Close modal">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)] min-h-0">
          {/* Preview Area */}
          <div className="flex-1 bg-muted/30 p-4 sm:p-6 overflow-auto min-h-0">
            {hasImageUrl ? (
              <div className="flex items-center justify-center h-full">
                <img
                  src={imageContent!.url}
                  alt={getAssetName()}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : asset.type === 'copy' || asset.type === 'concept' ? (
              <div className="bg-background rounded-lg border border-border p-4 sm:p-6 max-h-full overflow-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {getAssetIcon()}
                    <span className="text-sm font-medium capitalize">{asset.type}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={handleCopyContent}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {getContentText()}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No preview available
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border p-4 sm:p-6 overflow-auto space-y-6 min-h-0">
            {/* Actions */}
            <Button
              className="w-full gap-2 hover:bg-primary/90 transition-colors"
              onClick={() => onDownload(asset)}
            >
              <Download className="h-4 w-4" />
              Download Asset
            </Button>
            {asset.campaign_id && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  onOpenChange(false)
                  navigate(`/app/campaigns/${asset.campaign_id}?stage=assets`)
                }}
              >
                View campaign
              </Button>
            )}

            {/* Metadata */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Details</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-muted rounded text-muted-foreground">
                    {getAssetIcon()}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{asset.type}</p>
                  </div>
                </div>

                {campaignName && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-muted rounded text-muted-foreground">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Campaign</p>
                      <p className="font-medium">{campaignName}</p>
                    </div>
                  </div>
                )}

                {brandName && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-muted rounded text-muted-foreground">
                      <Palette className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Brand</p>
                      <p className="font-medium">{brandName}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-muted rounded text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Approved</p>
                    <p className="font-medium">
                      {format(new Date(asset.updated_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {asset.reviewed_by && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-muted rounded text-muted-foreground">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Approved by</p>
                      <p className="font-medium">{asset.reviewed_by}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Generation Mode */}
            {asset.generation_mode && (
              <div className="pt-4 border-t">
                <Badge
                  variant="outline"
                  className={
                    asset.generation_mode === 'brand_grounded'
                      ? 'border-purple-200 text-purple-700 bg-purple-50'
                      : 'border-amber-200 text-amber-700 bg-amber-50'
                  }
                >
                  {asset.generation_mode === 'brand_grounded' ? (
                    <Palette className="h-3 w-3 mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  {asset.generation_mode === 'brand_grounded' ? 'Brand-Grounded' : 'Idea-First'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
