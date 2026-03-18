import { ExternalLink, Download, Lightbulb, FileText, ImageIcon, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CreativeAsset } from '@/store/campaignStore'
import type { ConceptResult, CopyResult } from '@/lib/ai'

interface AssetPreviewAreaProps {
  asset: CreativeAsset
  generationMode?: 'brand_grounded' | 'idea_first'
}

export function AssetPreviewArea({ asset, generationMode }: AssetPreviewAreaProps) {
  const renderConceptPreview = (content: ConceptResult & { file_url?: string }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Lightbulb className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{content.theme}</h2>
          <p className="text-muted-foreground">Campaign Concept</p>
        </div>
      </div>

      <div className="space-y-4">
        <Section title="Headlines">
          <div className="space-y-2">
            {content.headlines?.map((headline, i) => (
              <p key={i} className="text-lg font-medium p-3 bg-muted rounded-lg">
                {headline}
              </p>
            ))}
          </div>
        </Section>

        <Section title="Visual Direction">
          <p className="text-foreground">{content.visual_direction}</p>
        </Section>

        <Section title="Rationale">
          <p className="text-muted-foreground leading-relaxed">{content.rationale}</p>
        </Section>

        {content.file_url && (
          <Section title="Attached file">
            <Button variant="outline" size="sm" asChild className="hover:bg-muted transition-colors">
              <a href={content.file_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Open attachment
              </a>
            </Button>
          </Section>
        )}
      </div>
    </div>
  )

  const renderCopyPreview = (content: CopyResult) => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{content.headline}</h2>
          <p className="text-muted-foreground">Ad Copy</p>
        </div>
      </div>

      {(content.exclusions_violated ||
        (content.validation_warnings?.length ?? 0) > 0 ||
        content.truncation_suggestion ||
        (content.brand_voice_score != null && content.brand_voice_score < 50)) && (
        <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 space-y-2">
          {content.exclusions_violated && (
            <div className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">Exclusions violated</p>
            </div>
          )}
          {content.truncation_suggestion && (
            <p className="text-sm text-amber-800 dark:text-amber-200">{content.truncation_suggestion}</p>
          )}
          {content.brand_voice_score != null && content.brand_voice_score < 50 && (
            <div>
              <p className="text-sm font-medium">Brand voice score: {content.brand_voice_score}/100</p>
              {content.brand_tune_suggestion && (
                <p className="text-sm text-muted-foreground mt-1">{content.brand_tune_suggestion}</p>
              )}
            </div>
          )}
          {content.validation_warnings?.map((w, i) => (
            <p key={i} className="text-sm text-amber-800 dark:text-amber-200">• {w}</p>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Headline
            </p>
            <p className="text-2xl font-bold">{content.headline}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Body
            </p>
            <p className="text-lg leading-relaxed">{content.body}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Call to Action
            </p>
            <Badge className="bg-primary text-primary-foreground text-base px-4 py-2">
              {content.cta}
            </Badge>
          </div>

          {content.character_count != null && (
            <p className="text-xs text-muted-foreground">Character count: {content.character_count}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderImagePreview = (content: {
    url: string
    prompt_used?: string
    colour_compliance?: { bio_palette_match?: number }
    validation_warnings?: string[]
    safe_zones_violated?: boolean
  }) => (
    <div className="space-y-6">
      {(content.safe_zones_violated ||
        (content.validation_warnings?.length ?? 0) > 0 ||
        (content.colour_compliance?.bio_palette_match != null &&
          content.colour_compliance.bio_palette_match < 40)) && (
        <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 space-y-2">
          {content.safe_zones_violated && (
            <div className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">Safe zones not clear — approval blocked</p>
            </div>
          )}
          {content.colour_compliance?.bio_palette_match != null &&
            content.colour_compliance.bio_palette_match < 40 && (
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Colour compliance: {content.colour_compliance.bio_palette_match}/100 (below 40)
              </p>
            )}
          {content.validation_warnings?.map((w, i) => (
            <p key={i} className="text-sm text-amber-800 dark:text-amber-200">• {w}</p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-3 to-chart-4 flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Generated Image</h2>
            <p className="text-muted-foreground">Visual Asset</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="hover:bg-muted transition-colors">
            <a href={content.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild className="hover:bg-muted transition-colors">
            <a href={content.url} download>
              <Download className="h-4 w-4 mr-1" />
              Download
            </a>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted overflow-hidden">
        <img
          src={content.url}
          alt="Generated asset"
          className="w-full h-auto max-h-[500px] object-contain"
        />
      </div>

      {content.prompt_used && (
        <Section title="Generation Prompt">
          <p className="text-sm text-foreground font-mono bg-muted p-3 rounded-lg">
            {content.prompt_used}
          </p>
        </Section>
      )}
    </div>
  )

  return (
    <div className="p-8 overflow-y-auto h-full">
      {/* Generation Mode Badge */}
      {generationMode && (
        <div className="mb-6">
          <Badge
            variant="outline"
            className={
              generationMode === 'brand_grounded'
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-purple-200 bg-purple-50 dark:bg-purple-950/30 text-purple-700'
            }
          >
            {generationMode === 'brand_grounded' ? 'Brand-Grounded' : 'Idea-First'}
          </Badge>
        </div>
      )}

      {/* Render based on asset type */}
      {asset.type === 'concept' && renderConceptPreview(asset.content as ConceptResult & { file_url?: string })}
      {asset.type === 'copy' && renderCopyPreview(asset.content as CopyResult)}
      {asset.type === 'image' && renderImagePreview(asset.content as { url: string; prompt_used?: string })}
    </div>
  )
}

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      {children}
    </div>
  )
}
