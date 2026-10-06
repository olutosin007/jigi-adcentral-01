import type { ReactNode } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Image as ImageIcon, Layers } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getAssetImageUrl, getAssetTitle } from '@/lib/handoff'
import type { CreativeAsset } from '@/store/campaignStore'
import { cn } from '@/lib/utils'

const TYPE_ICONS = { concept: Layers, copy: FileText, image: ImageIcon }

export function AssetThumb({ asset, className }: { asset: CreativeAsset; className?: string }) {
  const url = getAssetImageUrl(asset)
  const Icon = TYPE_ICONS[asset.type] ?? Layers
  return (
    <div
      className={cn(
        'shrink-0 rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center',
        className ?? 'h-12 w-12'
      )}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      )}
    </div>
  )
}

interface JobAssetRowProps {
  asset: CreativeAsset
  leading?: ReactNode
  trailing?: ReactNode
  meta?: ReactNode
  onOpen?: () => void
  timestampLabel?: string
}

export function JobAssetRow({ asset, leading, trailing, meta, onOpen, timestampLabel }: JobAssetRowProps) {
  const title = getAssetTitle(asset)
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-border bg-card px-3 py-2.5">
      {leading}
      <AssetThumb asset={asset} />
      <div className="flex-1 min-w-0">
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="block max-w-full truncate text-left text-sm font-medium text-foreground hover:text-primary"
            title={title}
          >
            {title}
          </button>
        ) : (
          <p className="truncate text-sm font-medium text-foreground" title={title}>
            {title}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
          <span className="capitalize">{asset.type}</span>
          <span aria-hidden>·</span>
          <span>{asset.source === 'uploaded' ? 'Uploaded' : 'AI'}</span>
          <span aria-hidden>·</span>
          <span>
            {timestampLabel ? `${timestampLabel} ` : ''}
            {formatDistanceToNow(new Date(asset.updated_at ?? asset.created_at), { addSuffix: true })}
          </span>
          {meta}
        </div>
      </div>
      <StatusBadge status={asset.status} />
      {trailing}
    </div>
  )
}
