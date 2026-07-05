import { Lightbulb, FileText, Image, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useGenerationHistory } from '@/hooks/useCampaignQueries'
import { formatDistanceToNow } from 'date-fns'

interface GenerationHistoryProps {
  campaignId: string
  /** Hide the internal heading when the parent provides chrome (drawer/sheet). */
  hideHeading?: boolean
}

const typeIcons = {
  concept: Lightbulb,
  copy: FileText,
  image: Image,
}

const typeLabels = {
  concept: 'Concept',
  copy: 'Copy',
  image: 'Image',
}

export function GenerationHistory({ campaignId, hideHeading = false }: GenerationHistoryProps) {
  const { data: history = [], isLoading } = useGenerationHistory(campaignId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No generation history yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {!hideHeading && (
        <h3 className="text-sm font-semibold text-foreground mb-3">Generation History</h3>
      )}

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
        {history.map((entry) => {
          const Icon = typeIcons[entry.type as keyof typeof typeIcons] || Lightbulb
          const label = typeLabels[entry.type as keyof typeof typeLabels] || entry.type

          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-2.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center flex-shrink-0 border border-border">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{label}</span>
                  <Badge
                    variant="secondary"
                    className={`text-[9px] ${
                      entry.status === 'success'
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {entry.status === 'success' ? (
                      <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                    ) : (
                      <XCircle className="w-2.5 h-2.5 mr-0.5" />
                    )}
                    {entry.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {entry.model} · {entry.latency_ms}ms ·{' '}
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </p>
              </div>

              <Badge
                variant="outline"
                className={`text-[9px] ${
                  entry.generation_mode === 'brand_grounded'
                    ? 'border-primary/30 text-primary'
                    : 'border-warning/30 text-warning'
                }`}
              >
                {entry.generation_mode === 'brand_grounded' ? 'Brand' : 'Idea'}
              </Badge>
            </div>
          )
        })}
      </div>

      <div className="pt-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground/80">
          {history.length} generation{history.length !== 1 ? 's' : ''} total
        </p>
      </div>
    </div>
  )
}
