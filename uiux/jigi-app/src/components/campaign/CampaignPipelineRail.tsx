import { cn } from '@/lib/utils'
import {
  type PipelineStage,
  PIPELINE_NAV,
  isPipelineStageDone,
} from '@/lib/campaign-workspace'

interface CampaignPipelineRailProps {
  activeStage: PipelineStage
  onStageChange: (stage: PipelineStage) => void
}

export function CampaignPipelineRail({ activeStage, onStageChange }: CampaignPipelineRailProps) {
  const mainStages = PIPELINE_NAV.filter((s) => s.section === 'main')
  const assetsStage = PIPELINE_NAV.find((s) => s.section === 'assets')

  return (
    <nav
      className="flex md:flex-col gap-1 md:w-[212px] md:flex-shrink-0 md:border-r md:border-border md:bg-muted/50 md:p-3 overflow-x-auto md:overflow-y-auto scrollbar-thin"
      aria-label="Creative pipeline"
    >
      {mainStages.map((item) => {
        const isActive = activeStage === item.id
        const isDone = isPipelineStageDone(item.id, activeStage)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onStageChange(item.id)}
            aria-current={isActive ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap md:whitespace-normal text-left transition-colors min-h-[44px] md:min-h-0',
              isActive && 'bg-card text-foreground border border-border shadow-sm',
              !isActive && !isDone && 'text-muted-foreground hover:bg-card/80 hover:text-foreground',
              isDone && !isActive && 'text-success'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                isActive && 'bg-primary',
                isDone && !isActive && 'bg-success',
                !isActive && !isDone && 'bg-border'
              )}
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
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap md:whitespace-normal text-left transition-colors min-h-[44px] md:min-h-0',
              activeStage === assetsStage.id
                ? 'bg-card text-foreground border border-border shadow-sm'
                : 'text-muted-foreground hover:bg-card/80 hover:text-foreground'
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
