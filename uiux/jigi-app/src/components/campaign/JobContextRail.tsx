import { Link } from 'react-router-dom'
import { Building2, Lightbulb, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { deriveBrandEssentials } from '@/lib/brand-profile-status'
import type { Brand } from '@/store/brandStore'
import type { CampaignBrief } from '@/store/campaignStore'
import type { BriefReadinessResult } from '@/lib/brief-readiness'
import { cn } from '@/lib/utils'

interface JobContextRailProps {
  brand?: Brand | null
  brief: CampaignBrief
  seedIdea?: string | null
  journeyMode: 'brand_first' | 'idea_first'
  briefReadiness?: BriefReadinessResult
  onEditBrief?: () => void
  className?: string
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
  )
}

export function JobContextRail({
  brand,
  brief,
  seedIdea,
  journeyMode,
  briefReadiness,
  onEditBrief,
  className,
}: JobContextRailProps) {
  const essentials = brand ? deriveBrandEssentials(brand.identity, brand.voice) : null
  const pct = essentials ? Math.round((essentials.score / essentials.maxScore) * 100) : 0
  const colours = brand?.identity?.colours ?? {}
  const swatches = (['primary', 'secondary', 'accent', 'neutral'] as const).filter((k) => colours[k])
  const tone = brand?.voice?.tone ?? []
  const channels = brief.channels ?? []

  return (
    <aside
      className={cn(
        'w-[272px] flex-shrink-0 border-l border-border bg-background overflow-y-auto scrollbar-thin px-5 py-5 space-y-6',
        className
      )}
      aria-label="Brand and brief context"
      data-tour="job-context-rail"
    >
      <section className="space-y-3">
        <SectionLabel>Brand</SectionLabel>
        {brand && essentials ? (
          <>
            <div className="flex items-center gap-3">
              <div
                className="relative h-11 w-11 shrink-0 rounded-full"
                style={{ background: `conic-gradient(#0D9488 ${pct}%, #E7E0D9 ${pct}%)` }}
                aria-label={`${essentials.score} of ${essentials.maxScore} brand essentials`}
              >
                <div className="absolute inset-[3px] rounded-full bg-background flex items-center justify-center text-[11px] font-semibold tabular-nums">
                  {essentials.score}/{essentials.maxScore}
                </div>
              </div>
              <div className="min-w-0">
                <Link
                  to={`/app/brands/${brand.id}`}
                  className="text-sm font-semibold text-foreground hover:text-primary truncate block"
                >
                  {brand.name}
                </Link>
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    essentials.status === 'complete'
                      ? 'text-success'
                      : 'text-[#B45309] dark:text-[#FBBF24]'
                  )}
                >
                  {essentials.status === 'complete' ? 'Ready for grounded work' : 'Guidance only — kit incomplete'}
                </p>
              </div>
            </div>
            {swatches.length > 0 && (
              <div className="flex gap-1.5" aria-label="Brand colours">
                {swatches.map((key) => (
                  <span
                    key={key}
                    className="h-7 w-7 rounded-md border border-border shadow-sm"
                    style={{ backgroundColor: colours[key] as string }}
                    title={`${key}: ${colours[key]}`}
                  />
                ))}
              </div>
            )}
            {tone.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tone.slice(0, 5).map((t) => (
                  <Badge key={t} variant="secondary" className="text-[11px] font-medium">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-[10px] border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              No brand attached
            </span>
            <p className="mt-1">Work stays idea-led until a brand kit is attached.</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Brief</SectionLabel>
          {onEditBrief && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onEditBrief}>
              <Pencil className="h-3 w-3 mr-1" aria-hidden />
              Edit
            </Button>
          )}
        </div>
        {journeyMode === 'idea_first' && seedIdea && (
          <p className="text-sm italic text-foreground border-l-2 border-[#F59E0B]/60 pl-3">
            <Lightbulb className="inline h-3.5 w-3.5 mr-1 text-[#D97706]" aria-hidden />
            {seedIdea}
          </p>
        )}
        {brief.key_message && (
          <div>
            <p className="text-xs text-muted-foreground">Key message</p>
            <p className="text-sm text-foreground mt-0.5">{brief.key_message}</p>
          </div>
        )}
        {brief.objective && (
          <div>
            <p className="text-xs text-muted-foreground">Objective</p>
            <p className="text-sm text-foreground mt-0.5 line-clamp-3">{brief.objective}</p>
          </div>
        )}
        {brief.audience && (
          <div>
            <p className="text-xs text-muted-foreground">Audience</p>
            <p className="text-sm text-foreground mt-0.5 line-clamp-2">{brief.audience}</p>
          </div>
        )}
        {channels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {channels.map((c) => (
              <Badge key={c} variant="outline" className="text-[11px] font-medium">
                {c}
              </Badge>
            ))}
          </div>
        )}
        {briefReadiness && !briefReadiness.ready && (
          <p className="text-xs text-[#B45309] dark:text-[#FBBF24]">
            Brief incomplete — {briefReadiness.missing.slice(0, 2).join(', ')}
          </p>
        )}
      </section>
    </aside>
  )
}
