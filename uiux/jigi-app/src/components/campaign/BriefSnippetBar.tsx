import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CHANNEL_OPTIONS } from '@/store/campaignStore'
import type { BriefReadinessResult } from '@/lib/brief-readiness'

interface BriefSnippetBarProps {
  keyMessage?: string
  objective?: string
  audience?: string
  channels?: string[]
  exclusions?: string
  readiness?: BriefReadinessResult
  onEditBrief: () => void
  hidden?: boolean
}

function channelLabels(channels: string[] | undefined): string {
  if (!channels?.length) return 'Not set'
  return channels
    .map((ch) => CHANNEL_OPTIONS.find((c) => c.value === ch)?.label ?? ch)
    .join(', ')
}

function exclusionPreview(exclusions: string | undefined): string | null {
  const trimmed = exclusions?.trim()
  if (!trimmed) return null
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed
}

export function BriefSnippetBar({
  keyMessage,
  objective,
  audience,
  channels,
  exclusions,
  readiness,
  onEditBrief,
  hidden = false,
}: BriefSnippetBarProps) {
  if (hidden) return null

  const keyMessageText = keyMessage?.trim() || 'Not specified'
  const exclusionText = exclusionPreview(exclusions)
  const readinessLabel = readiness
    ? readiness.ready
      ? 'Ready'
      : `Incomplete (${readiness.missing.length})`
    : null

  return (
    <section
      className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 md:px-8 py-3 bg-muted border-b border-border text-[13px]"
      aria-label="Campaign brief summary"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
        Brief
      </span>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-baseline gap-1.5 min-w-0 max-w-full sm:max-w-[280px] text-left hover:opacity-80"
          >
            <span className="font-semibold text-foreground shrink-0">Key message</span>
            <span className="font-semibold text-foreground truncate">{keyMessageText}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 text-sm" align="start">
          <p className="font-semibold text-foreground mb-1">Key message</p>
          <p className="text-muted-foreground whitespace-pre-wrap">{keyMessageText}</p>
        </PopoverContent>
      </Popover>

      <div className="flex items-baseline gap-1.5 min-w-0 max-w-full sm:max-w-[240px]">
        <span className="font-semibold text-foreground shrink-0">Objective</span>
        <span className="text-muted-foreground truncate">
          {objective?.trim() || 'Not specified'}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0 max-w-full sm:max-w-[200px]">
        <span className="font-semibold text-foreground shrink-0">Audience</span>
        <span className="text-muted-foreground truncate">
          {audience?.trim() || 'Not specified'}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0 max-w-full sm:max-w-[200px]">
        <span className="font-semibold text-foreground shrink-0">Channels</span>
        <span className="text-muted-foreground truncate">{channelLabels(channels)}</span>
      </div>

      {exclusionText && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-warning shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden />
                Exclusions
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-pre-wrap">{exclusionText}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {readinessLabel && (
        <Badge
          variant="outline"
          className={
            readiness?.ready
              ? 'bg-success/10 text-success border-success/20 text-[10px] font-semibold'
              : 'bg-warning/10 text-warning border-warning/30 text-[10px] font-semibold'
          }
        >
          {readinessLabel}
        </Badge>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto h-8 text-xs shrink-0"
        onClick={onEditBrief}
      >
        Edit full brief
      </Button>
    </section>
  )
}
