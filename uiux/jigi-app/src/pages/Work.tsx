import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Building2, Lightbulb, Plus, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { HANDOFF_TONE_CLASSES, jobStageHref } from '@/lib/handoff'
import { useWorkJobs, type WorkJob } from '@/hooks/useWorkQueries'

export function Work() {
  const navigate = useNavigate()
  const { data: jobs = [], isLoading, error, refetch } = useWorkJobs()
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const visibleJobs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return jobs.filter((job) => {
      if (!showArchived && job.status === 'archived') return false
      if (!q) return true
      return job.name.toLowerCase().includes(q) || job.brandName?.toLowerCase().includes(q)
    })
  }, [jobs, query, showArchived])

  const needsYou = useMemo(
    () => visibleJobs.filter((j) => j.nextAction.tone === 'warning' || j.nextAction.stage === 'send'),
    [visibleJobs]
  )
  const waitingCount = useMemo(
    () => visibleJobs.reduce((n, j) => n + j.counts.waiting, 0),
    [visibleJobs]
  )
  const archivedCount = jobs.filter((j) => j.status === 'archived').length

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-6" data-tour="work-home">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[2rem] leading-tight font-serif font-semibold tracking-tight text-foreground">
            Work
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? 'Loading your jobs…'
              : needsYou.length > 0
                ? `${needsYou.length} job${needsYou.length === 1 ? '' : 's'} need${needsYou.length === 1 ? 's' : ''} you`
                : waitingCount > 0
                  ? `${waitingCount} asset${waitingCount === 1 ? '' : 's'} waiting on client`
                  : 'Everything is moving.'}
          </p>
        </div>
        <Button onClick={() => navigate('/app/campaigns/new')} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New
        </Button>
      </header>

      {jobs.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs or brands"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search jobs"
            />
          </div>
          {archivedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start sm:self-auto text-muted-foreground"
              onClick={() => setShowArchived((v) => !v)}
              aria-pressed={showArchived}
            >
              {showArchived ? 'Hide archived' : `Show archived (${archivedCount})`}
            </Button>
          )}
          <Link
            to="/app/campaigns"
            className="text-sm text-muted-foreground hover:text-primary sm:ml-auto"
          >
            Manage all campaigns
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2" aria-busy>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[76px] rounded-[10px]" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Sparkles}
          title="Couldn’t load your work"
          description={error instanceof Error ? error.message : 'Please try again.'}
          action={{ label: 'Try again', onClick: () => void refetch() }}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Start your first job"
          description="Bring in a brief, generate or upload creative, and send it for a client decision — all in one place."
          action={{ label: 'New job', onClick: () => navigate('/app/campaigns/new') }}
        />
      ) : visibleJobs.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching jobs"
          description="Try a different search."
          action={{ label: 'Clear search', onClick: () => setQuery('') }}
        />
      ) : (
        <ul className="space-y-2" aria-label="Jobs">
          {visibleJobs.map((job) => (
            <WorkRow key={job.id} job={job} />
          ))}
        </ul>
      )}
    </div>
  )
}

function WorkRow({ job }: { job: WorkJob }) {
  const { nextAction, counts } = job
  return (
    <li>
      <Link
        to={jobStageHref(job.id, nextAction.stage)}
        className={cn(
          'group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 rounded-[10px] border border-border bg-card px-4 py-3.5',
          'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:border-primary/30 transition-[box-shadow,border-color] duration-200',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          job.status === 'archived' && 'opacity-70'
        )}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{job.name}</p>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-1">
            {job.brandName ? (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" aria-hidden />
                {job.brandName}
              </span>
            ) : (
              <span className="italic">No brand yet</span>
            )}
            {job.journeyMode === 'idea_first' && (
              <span className="inline-flex items-center gap-1 text-[#B45309] dark:text-[#FBBF24]">
                <Lightbulb className="h-3 w-3" aria-hidden />
                Idea-first
              </span>
            )}
            <span aria-hidden>·</span>
            <span>{formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}</span>
            {counts.total > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="tabular-nums">
                  {counts.approved}/{counts.total} approved
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 sm:justify-end">
          {nextAction.hint && (
            <span className="hidden md:inline text-xs text-muted-foreground">{nextAction.hint}</span>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap',
              HANDOFF_TONE_CLASSES[nextAction.tone]
            )}
            data-testid="work-next-action"
          >
            {nextAction.label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  )
}
