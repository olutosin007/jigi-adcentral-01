import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { BrandEssentialsResult } from '@/lib/brand-profile-status'
import type { BrandIdentity, BrandVoice } from '@/store/brandStore'
import { getContrastColor } from '@/lib/colors'

interface BrandPreviewPanelProps {
  brandName: string
  identity: BrandIdentity
  voice: BrandVoice
  essentials: BrandEssentialsResult
}

export function BrandPreviewPanel({
  brandName,
  identity,
  voice,
  essentials,
}: BrandPreviewPanelProps) {
  const colours = identity.colours ?? {}
  const fonts = identity.fonts ?? {}
  const tone = voice.tone ?? []
  const pct = Math.round((essentials.score / essentials.maxScore) * 100)

  const swatchEntries = (
    ['primary', 'secondary', 'accent', 'neutral'] as const
  ).filter((key) => colours[key])

  return (
    <Card className="shadow-[var(--shadow-card)] border-border rounded-xl lg:sticky lg:top-[76px] lg:self-start">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Preview</CardTitle>
        <CardDescription>How this brand kit shapes AI output</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div
            className="relative h-16 w-16 shrink-0 rounded-full"
            style={{
              background: `conic-gradient(#0D9488 ${pct}%, #E7E0D9 ${pct}%)`,
            }}
            aria-label={`${essentials.score} of ${essentials.maxScore} brand essentials`}
          >
            <div className="absolute inset-1 rounded-full bg-card flex items-center justify-center text-sm font-semibold tabular-nums">
              {essentials.score}/{essentials.maxScore}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">On-brand readiness</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {essentials.status === 'complete'
                ? 'Ready for grounded generation'
                : 'Add missing essentials for stronger alignment'}
            </p>
          </div>
        </div>

        {swatchEntries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Colours
            </p>
            <div className="flex flex-wrap gap-2">
              {swatchEntries.map((key) => {
                const hex = colours[key] as string
                return (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <div
                      className="h-10 w-10 rounded-lg border border-border shadow-sm"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                    <span className="text-[10px] text-muted-foreground capitalize">{key}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {(fonts.heading || fonts.body) && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Typography
            </p>
            {fonts.heading && (
              <p
                className="text-xl font-semibold leading-tight"
                style={{ fontFamily: fonts.heading }}
              >
                {brandName}
              </p>
            )}
            {fonts.body && (
              <p className="text-sm text-muted-foreground" style={{ fontFamily: fonts.body }}>
                Body sample — the quick brown fox jumps over the lazy dog.
              </p>
            )}
          </div>
        )}

        {tone.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Tone
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tone.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {identity.visual_style && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Visual direction
            </p>
            <blockquote className="border-l-2 border-primary/40 pl-3 text-sm text-foreground italic">
              &ldquo;{identity.visual_style}&rdquo;
            </blockquote>
          </div>
        )}

        {identity.logo_url && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Logo
            </p>
            <div
              className="inline-flex rounded-lg border border-border p-2"
              style={{
                backgroundColor: (colours.primary || '#0D9488') + '15',
              }}
            >
              <img
                src={identity.logo_url}
                alt={`${brandName} logo`}
                className="h-10 max-w-[120px] object-contain"
              />
            </div>
          </div>
        )}

        {colours.primary && (
          <div
            className="rounded-lg px-3 py-2 text-sm font-medium text-center"
            style={{
              backgroundColor: colours.primary,
              color: getContrastColor(colours.primary),
            }}
          >
            Primary CTA preview
          </div>
        )}
      </CardContent>
    </Card>
  )
}
