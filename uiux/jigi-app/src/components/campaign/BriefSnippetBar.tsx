import { Button } from '@/components/ui/button'
import { CHANNEL_OPTIONS } from '@/store/campaignStore'

interface BriefSnippetBarProps {
  objective?: string
  audience?: string
  channels?: string[]
  onEditBrief: () => void
  hidden?: boolean
}

function channelLabels(channels: string[] | undefined): string {
  if (!channels?.length) return 'Not set'
  return channels
    .map((ch) => CHANNEL_OPTIONS.find((c) => c.value === ch)?.label ?? ch)
    .join(', ')
}

export function BriefSnippetBar({
  objective,
  audience,
  channels,
  onEditBrief,
  hidden = false,
}: BriefSnippetBarProps) {
  if (hidden) return null

  return (
    <section
      className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 md:px-8 py-3 bg-muted border-b border-border text-[13px]"
      aria-label="Campaign brief summary"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
        Brief
      </span>
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
