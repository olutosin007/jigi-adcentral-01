import { useNavigate } from 'react-router-dom'
import { Palette, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { GenerationMixStats } from '@/hooks/useDashboardQueries'

interface GenerationMixCardProps {
  stats?: GenerationMixStats
  isLoading?: boolean
}

export function GenerationMixCard({ stats, isLoading }: GenerationMixCardProps) {
  const navigate = useNavigate()
  if (isLoading) {
    return (
      <Card className="shadow-[var(--shadow-card)] border-border rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  const brandGrounded = stats?.brandGrounded ?? 0
  const ideaFirst = stats?.ideaFirst ?? 0
  const total = stats?.total ?? 0

  const brandPercentage = total > 0 ? Math.round((brandGrounded / total) * 100) : 0
  const ideaPercentage = total > 0 ? Math.round((ideaFirst / total) * 100) : 0

  if (total === 0) {
    return (
      <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Generation Mix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Palette className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <p className="font-medium text-foreground">No assets generated yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create a campaign and generate assets to see your mix.</p>
            <Button size="sm" className="mt-4" onClick={() => navigate('/app/campaigns/new')}>
              New Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Generation Mix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-4 rounded-full overflow-hidden bg-muted mb-4">
          {brandPercentage > 0 && (
            <div
              className="bg-purple-500 transition-all duration-500"
              style={{ width: `${brandPercentage}%` }}
            />
          )}
          {ideaPercentage > 0 && (
            <div
              className="bg-amber-400 transition-all duration-500"
              style={{ width: `${ideaPercentage}%` }}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg hover:bg-purple-100/80 dark:hover:bg-purple-900/40 transition-colors duration-200">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-900">Brand-Grounded</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-purple-700">{brandGrounded}</span>
                <span className="text-xs text-purple-600">({brandPercentage}%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg hover:bg-amber-100/80 dark:hover:bg-amber-900/40 transition-colors duration-200">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">Idea-First</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-amber-700">{ideaFirst}</span>
                <span className="text-xs text-amber-600">({ideaPercentage}%)</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {total} total asset{total !== 1 ? 's' : ''} generated
        </p>
      </CardContent>
    </Card>
  )
}
