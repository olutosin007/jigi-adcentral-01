import type { ReactNode } from 'react'
import { CampaignPipelineRail } from './CampaignPipelineRail'
import type { PipelineStage } from '@/lib/campaign-workspace'
import { isGenerationStage } from '@/lib/campaign-workspace'
import type { StageGateStatus } from '@/lib/pipeline-gates'

interface CampaignWorkspaceProps {
  activeStage: PipelineStage
  gateMap: Partial<Record<PipelineStage, StageGateStatus>>
  onStageChange: (stage: PipelineStage) => void
  briefStage: ReactNode
  generationStage: ReactNode
  assetsStage: ReactNode
  sendStage?: ReactNode
  decisionsStage?: ReactNode
  approvedStage?: ReactNode
  contextRail?: ReactNode
  railBadges?: Partial<Record<PipelineStage, number>>
}

export function CampaignWorkspace({
  activeStage,
  gateMap,
  onStageChange,
  briefStage,
  generationStage,
  assetsStage,
  sendStage,
  decisionsStage,
  approvedStage,
  contextRail,
  railBadges,
}: CampaignWorkspaceProps) {
  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
      <CampaignPipelineRail
        activeStage={activeStage}
        gateMap={gateMap}
        onStageChange={onStageChange}
        badges={railBadges}
      />
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {activeStage === 'brief' && briefStage}
        {isGenerationStage(activeStage) && generationStage}
        {activeStage === 'assets' && assetsStage}
        {activeStage === 'send' && sendStage}
        {activeStage === 'decisions' && decisionsStage}
        {activeStage === 'approved' && approvedStage}
      </div>
      {contextRail}
    </div>
  )
}
