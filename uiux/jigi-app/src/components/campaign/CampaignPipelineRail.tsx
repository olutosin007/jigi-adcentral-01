import { cn } from '@/lib/utils'
import { type PipelineStage, PIPELINE_NAV } from '@/lib/campaign-workspace'
import type { StageGateMap, StageGateStatus } from '@/lib/pipeline-gates'

interface CampaignPipelineRailProps {
  activeStage: PipelineStage
  gateMap: StageGateMap
  onStageChange: (stage: PipelineStage) => void
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
}: CampaignPipelineRailProps) {
  const mainStages = PIPELINE_NAV.filter((s) => s.section === 'main')
  const assetsStage = PIPELINE_NAV.find((s) => s.section === 'assets')

  return (
    <nav
      className="flex md:flex-col gap-0.5 md:w-[212px] md:flex-shrink-0 md:border-r md:border-border md:bg-muted md:px-2.5 md:py-4 overflow-x-auto md:overflow-y-auto scrollbar-thin"
      aria-label="Creative pipeline"
    >
      {mainStages.map((item) => {
        const isActive = activeStage === item.id
        const status = gateMap[item.id]
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onStageChange(item.id)}
            aria-current={isActive ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-medium whitespace-nowrap md:whitespace-normal text-left transition-colors min-h-[44px] md:min-h-0',
              labelClass(status, isActive)
            )}
          >
            <span
              className={cn('w-2 h-2 rounded-full flex-shrink-0', dotClass(status, isActive))}
              aria-hidden
            />
            {item.label}
          </button>
        )
      })}
      {assetsStage && (
        <>
          <div className="hidden md:block h-px bg-border my-2 mx-1" role="separator" />
          <button
            type="button"
            onClick={() => onStageChange(assetsStage.id)}
            aria-current={activeStage === assetsStage.id ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-medium whitespace-nowrap md:whitespace-normal text-left transition-colors min-h-[44px] md:min-h-0',
              activeStage === assetsStage.id
                ? 'bg-card text-foreground border border-border font-semibold shadow-sm'
                : 'text-muted-foreground hover:bg-card hover:text-foreground'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                activeStage === assetsStage.id ? 'bg-primary' : 'bg-border'
              )}
              aria-hidden
            />
            {assetsStage.label}
          </button>
        </>
      )}
    </nav>
  )
}
