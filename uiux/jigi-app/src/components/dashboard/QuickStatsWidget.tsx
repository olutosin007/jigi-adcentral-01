import { ClipboardCheck, FolderOpen, CheckCircle2 } from 'lucide-react'
import { StatCard } from './StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from '@/hooks/useDashboardQueries'

interface QuickStatsWidgetProps {
  stats?: DashboardStats
  isLoading?: boolean
}

export function QuickStatsWidget({ stats, isLoading }: QuickStatsWidgetProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Pending Review"
        value={stats?.pendingReview ?? 0}
        icon={ClipboardCheck}
        iconClassName="bg-warning/10 text-warning"
      />
      <StatCard
        label="Active Campaigns"
        value={stats?.activeCampaigns ?? 0}
        icon={FolderOpen}
        iconClassName="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
      />
      <StatCard
        label="Approved This Week"
        value={stats?.approvedThisWeek ?? 0}
        icon={CheckCircle2}
        iconClassName="bg-success/10 text-success"
      />
    </div>
  )
}
