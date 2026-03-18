import { formatDistanceToNow } from 'date-fns'
import { Download, Eye, Image as ImageIcon, FileText, Lightbulb, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CreativeAsset, ImageContent, ConceptContent, CopyContent } from '@/store/campaignStore'

interface ApprovedAssetCardProps {
  asset: CreativeAsset
  onView: (asset: CreativeAsset) => void
  onDownload: (asset: CreativeAsset) => void
}

export function ApprovedAssetCard({ asset, onView, onDownload }: ApprovedAssetCardProps) {
  const getAssetIcon = () => {
    switch (asset.type) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-white/70" />
      case 'copy':
        return <FileText className="h-8 w-8 text-white/70" />
      case 'concept':
        return <Lightbulb className="h-8 w-8 text-white/70" />
      default:
        return <ImageIcon className="h-8 w-8 text-white/70" />
    }
  }

  const getAssetGradient = () => {
    switch (asset.type) {
      case 'image':
        return 'from-primary to-primary/80'
      case 'copy':
        return 'from-purple-400 to-purple-600'
      case 'concept':
        return 'from-amber-400 to-orange-500'
      default:
        return 'from-muted-foreground to-muted-foreground/80'
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

  const imageContent = asset.type === 'image' ? (asset.content as ImageContent) : null
  const hasImageUrl = imageContent?.url

  return (
    <Card className="overflow-hidden group cursor-pointer shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl">
      {/* Thumbnail */}
      <div
        className={`relative h-40 flex items-center justify-center ${
          hasImageUrl ? '' : `bg-gradient-to-br ${getAssetGradient()}`
        }`}
        onClick={() => onView(asset)}
      >
        {hasImageUrl ? (
          <img
            src={imageContent.url}
            alt={getAssetName()}
            className="w-full h-full object-cover"
          />
        ) : (
          getAssetIcon()
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1"
            onClick={(e) => {
              e.stopPropagation()
              onView(asset)
            }}
          >
            <Eye className="h-3 w-3" />
            View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1"
            onClick={(e) => {
              e.stopPropagation()
              onDownload(asset)
            }}
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>

        {/* Approved badge */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-success hover:bg-success text-primary-foreground gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-3">
        <p className="font-medium text-sm truncate mb-1">{getAssetName()}</p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs capitalize">
            {asset.type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(asset.updated_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
