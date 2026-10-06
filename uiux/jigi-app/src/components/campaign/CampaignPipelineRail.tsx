import { cn } from '@/lib/utils'
import {
  type PipelineNavGroup,
  type PipelineStage,
  PIPELINE_NAV,
} from '@/lib/campaign-workspace'
import type { StageGateStatus } from '@/lib/pipeline-gates'

type RailGateMap = Partial<Record<PipelineStage, StageGateStatus>>

interface CampaignPipelineRailProps {
  activeStage: PipelineStage
  gateMap: RailGateMap
  onStageChange: (stage: PipelineStage) => void
  /** Optional counts shown beside handoff stages (e.g. waiting decisions). */
  badges?: Partial<Record<PipelineStage, number>>
}

const GROUP_LABELS: Record<PipelineNavGroup, string | null> = {
  brief: null,
  creative: 'Creative',
  handoff: 'Handoff',
}

function dotClass(status: StageGateStatus, isActive: boolean): string {
  if (status === 'complete') return 'bg-success'
  if (status === 'in_progress') return isActive ? 'bg-primary' : 'bg-primary/60'
  return isActive ? 'bg-primary' : 'bg-border'
}

function labelClass(status: StageGateStatus, isActive: boolean): string {
  if (isActive) return 'bg-card text-foreground border border-border font-semibold shadow-sm'
  if (status === 'complete') return 'text-success hover:bg-card hover:text-foreground'
  if (status === 'in_progress') return 'text-foreground hover:bg-card'
  return 'text-muted-foreground hover:bg-card hover:text-foreground'
}

export function CampaignPipelineRail({
  activeStage,
  gateMap,
  onStageChange,
  badges,
}: CampaignPipelineRailProps) {
  const groups: PipelineNavGroup[] = ['brief', 'creative', 'handoff']

  return (
    <nav
      className="flex md:flex-col gap-0.5 md:w-[212px] md:flex-shrink-0 md:border-r md:border-border md:bg-muted md:px-2.5 md:py-4 overflow-x-auto md:overflow-y-auto scrollbar-thin"
      aria-label="Job stages"
      data-tour="job-stage-rail"
    >
      {groups.map((group, groupIdx) => {
        const items = PIPELINE_NAV.filter((s) => s.group === group)
        const label = GROUP_LABELS[group]
        return (
          <div key={group} className="contents md:block">
            {groupIdx > 0 && (
              <div className="hidden md:block h-px bg-border my-2 mx-1" role="separator" />
            )}
            {label && (
              <p className="hidden md:block px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
              </p>
            )}
            {items.map((item) => {
              const isActive = activeStage === item.id
              const status = gateMap[item.id] ?? 'available'
              const badge = badges?.[item.id] ?? 0
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onStageChange(item.id)}
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-medium whitespace-nowrap md:whitespace-normal text-left transition-colors min-h-[44px] md:min-h-0',
                    group === 'creative' && 'md:pl-5',
                    labelClass(status, isActive)
                  )}
                >
                  <span
                    className={cn('w-2 h-2 rounded-full flex-shrink-0', dotClass(status, isActive))}
                    aria-hidden
                  />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span
                      className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] dark:bg-[#422006] dark:text-[#FBBF24]"
                      aria-label={`${badge} pending`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
