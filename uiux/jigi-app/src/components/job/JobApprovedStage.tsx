import { Link } from 'react-router-dom'
import { CheckCircle2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { getAssetImageUrl, getAssetTitle } from '@/lib/handoff'
import type { CreativeAsset } from '@/store/campaignStore'
import { AssetThumb } from './JobAssetRow'

interface JobApprovedStageProps {
  assets: CreativeAsset[]
  onOpenAsset?: (asset: CreativeAsset) => void
}

export function JobApprovedStage({ assets, onOpenAsset }: JobApprovedStageProps) {
  if (assets.length === 0) {
    return (
      <div className="p-6 overflow-y-auto h-full">
        <EmptyState
          icon={CheckCircle2}
          title="Nothing approved yet"
          description="Approved creative for this job lands here, ready to hand off."
        />
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full space-y-5" data-tour="approved-stage">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Approved</h2>
          <p className="text-sm text-muted-foreground">
            {assets.length} asset{assets.length === 1 ? '' : 's'} cleared for use
          </p>
        </div>
        <Link to="/app/approved" className="text-sm text-muted-foreground hover:text-primary">
          All approved work
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => {
          const url = getAssetImageUrl(asset)
          const title = getAssetTitle(asset)
          return (
            <li key={asset.id} className="rounded-[10px] border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={onOpenAsset ? () => onOpenAsset(asset) : undefined}
                className="block w-full text-left"
              >
                <AssetThumb asset={asset} className="h-36 w-full rounded-none border-0" />
              </button>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" aria-hidden />
                <p className="flex-1 truncate text-sm font-medium" title={title}>
                  {title}
                </p>
                {url && (
                  <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                    <a href={url} download target="_blank" rel="noreferrer" aria-label={`Download ${title}`}>
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
