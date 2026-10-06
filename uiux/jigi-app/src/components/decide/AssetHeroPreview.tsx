import { useState } from 'react'
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAssetImageUrl, getAssetTitle, type DisplayableAsset } from '@/lib/handoff'
import { cn } from '@/lib/utils'

interface AssetHeroPreviewProps {
  asset: DisplayableAsset
  className?: string
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v : undefined
}

export function AssetHeroPreview({ asset, className }: AssetHeroPreviewProps) {
  const [zoomed, setZoomed] = useState(false)
  const content = (asset.content ?? {}) as Record<string, unknown>
  const imageUrl = getAssetImageUrl(asset)
  const fileUrl = str(content.file_url) ?? (asset.type !== 'image' ? str(content.url) : undefined)

  return (
    <div
      className={cn(
        'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-[0.98] motion-safe:duration-500',
        className
      )}
      data-tour="decide-asset"
    >
      {asset.type === 'image' && imageUrl ? (
        <div className="relative rounded-xl border border-border bg-[#F5F5F4] dark:bg-muted overflow-auto">
          <img
            src={imageUrl}
            alt={getAssetTitle(asset)}
            onClick={() => setZoomed((z) => !z)}
            className={cn(
              'mx-auto block transition-[max-height,max-width] duration-300',
              zoomed ? 'max-w-none cursor-zoom-out' : 'max-h-[70vh] max-w-full object-contain cursor-zoom-in'
            )}
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-3 top-3 h-8 w-8 shadow-sm"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? 'Fit to screen' : 'View actual size'}
          >
            {zoomed ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      ) : asset.type === 'copy' ? (
        <article className="rounded-xl border border-border bg-card px-8 py-10 md:px-12 md:py-14 shadow-sm">
          {str(content.headline) && (
            <h2 className="text-2xl md:text-3xl font-semibold leading-tight text-foreground">
              {String(content.headline)}
            </h2>
          )}
          {str(content.body) && (
            <p className="mt-4 text-base md:text-lg leading-relaxed text-foreground/90 whitespace-pre-line">
              {String(content.body)}
            </p>
          )}
          {str(content.cta) && (
            <span className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              {String(content.cta)}
            </span>
          )}
        </article>
      ) : (
        <article className="rounded-xl border border-border bg-card px-8 py-10 md:px-12 shadow-sm space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Concept</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-semibold text-foreground">{getAssetTitle(asset)}</h2>
          </div>
          {Array.isArray(content.headlines) && content.headlines.length > 0 && (
            <ul className="space-y-2">
              {(content.headlines as unknown[]).filter(str).map((h, i) => (
                <li key={i} className="rounded-lg bg-muted px-4 py-3 text-lg font-medium">
                  {String(h)}
                </li>
              ))}
            </ul>
          )}
          {str(content.visual_direction) && (
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Visual direction</p>
              <p className="mt-1 text-foreground">{String(content.visual_direction)}</p>
            </section>
          )}
          {str(content.rationale) && (
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Why it works</p>
              <p className="mt-1 text-muted-foreground leading-relaxed">{String(content.rationale)}</p>
            </section>
          )}
          {fileUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Open {asset.original_filename ?? 'attachment'}
              </a>
            </Button>
          )}
        </article>
      )}
    </div>
  )
}
