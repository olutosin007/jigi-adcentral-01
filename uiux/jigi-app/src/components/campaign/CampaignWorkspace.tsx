import type { ReactNode } from 'react'
import { CampaignPipelineRail } from './CampaignPipelineRail'
import type { PipelineStage } from '@/lib/campaign-workspace'
import { isGenerationStage } from '@/lib/campaign-workspace'

interface CampaignWorkspaceProps {
  activeStage: PipelineStage
  onStageChange: (stage: PipelineStage) => void
  briefStage: ReactNode
  generationStage: ReactNode
  assetsStage: ReactNode
}

export function CampaignWorkspace({
  activeStage,
  onStageChange,
  briefStage,
  generationStage,
  assetsStage,
}: CampaignWorkspaceProps) {
  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
      <CampaignPipelineRail activeStage={activeStage} onStageChange={onStageChange} />
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {activeStage === 'brief' && briefStage}
        {isGenerationStage(activeStage) && generationStage}
        {activeStage === 'assets' && assetsStage}
      </div>
    </div>
  )
}
