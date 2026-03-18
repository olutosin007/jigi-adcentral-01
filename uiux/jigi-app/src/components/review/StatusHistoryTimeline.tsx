import { ArrowRight, User } from 'lucide-react'
import { getStatusConfig } from '@/lib/status'
import { formatDistanceToNow } from 'date-fns'
import type { StatusHistoryEntry } from '@/hooks/useCampaignQueries'

interface StatusHistoryTimelineProps {
  history?: StatusHistoryEntry[]
}

export function StatusHistoryTimeline({ history }: StatusHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No status history yet
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => {
        const toConfig = getStatusConfig(entry.to_status)
        const fromConfig = entry.from_status
          ? getStatusConfig(entry.from_status)
          : null
        const ToIcon = toConfig.icon

        return (
          <div
            key={entry.id}
            className={`relative pl-6 ${
              index !== history.length - 1 ? 'pb-4' : ''
            }`}
          >
            {/* Timeline line */}
            {index !== history.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-border" />
            )}

            {/* Status icon */}
            <div
              className={`absolute left-0 top-0 w-6 h-6 rounded-full ${toConfig.bgColor} flex items-center justify-center`}
            >
              <ToIcon className={`h-3 w-3 ${toConfig.color}`} />
            </div>

            {/* Content */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {fromConfig && (
                  <>
                    <span
                      className={`text-xs font-medium ${fromConfig.color} ${fromConfig.bgColor} px-1.5 py-0.5 rounded`}
                    >
                      {fromConfig.label}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
                <span
                  className={`text-xs font-medium ${toConfig.color} ${toConfig.bgColor} px-1.5 py-0.5 rounded`}
                >
                  {toConfig.label}
                </span>
              </div>

              {entry.notes && (
                <p className="text-xs text-muted-foreground bg-muted rounded p-2 mt-1">
                  "{entry.notes}"
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {entry.user?.full_name && (
                  <>
                    <User className="h-3 w-3" />
                    <span>{entry.user.full_name}</span>
                    <span>•</span>
                  </>
                )}
                <span>
                  {formatDistanceToNow(new Date(entry.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
