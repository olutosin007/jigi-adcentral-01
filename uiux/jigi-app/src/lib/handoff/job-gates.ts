import type { HandoffStage, PipelineStage } from '@/lib/campaign-workspace'
import {
  evaluateStageGates,
  getNextPipelineAction,
  type PipelineActionType,
  type PipelineGateInput,
  type StageGateMap,
  type StageGateStatus,
} from '@/lib/pipeline-gates'
import type { JobAssetCounts } from './next-action'

export type JobGateMap = StageGateMap & Record<HandoffStage, StageGateStatus>

export function evaluateHandoffGates(counts: JobAssetCounts): Record<HandoffStage, StageGateStatus> {
  const sent = counts.total - counts.draft
  const open = counts.waiting + counts.changes + counts.internal
  let send: StageGateStatus = 'available'
  if (sent > 0) send = counts.draft === 0 ? 'complete' : 'in_progress'
  return {
    send,
    decisions: open > 0 ? 'in_progress' : sent > 0 ? 'complete' : 'available',
    approved: counts.approved > 0 ? 'complete' : 'available',
  }
}

export function evaluateJobGates(input: PipelineGateInput, counts: JobAssetCounts): JobGateMap {
  return { ...evaluateStageGates(input), ...evaluateHandoffGates(counts) }
}

export interface JobHeaderAction {
  label: string
  stage: PipelineStage
  actionType: PipelineActionType
}

/**
 * Header CTA for the Job workspace. Client feedback and sendable work outrank
 * the generation pipeline; otherwise the pipeline drives the next step.
 */
export function getJobHeaderAction(
  input: PipelineGateInput,
  counts: JobAssetCounts,
  options: { hasUploaded?: boolean } = {}
): JobHeaderAction {
  if (input.campaign.status === 'archived') {
    return { label: 'View approved', stage: 'approved', actionType: 'navigate' }
  }

  if (counts.changes > 0) {
    return {
      label: `Fix ${counts.changes} note${counts.changes === 1 ? '' : 's'}`,
      stage: 'decisions',
      actionType: 'navigate',
    }
  }

  const gates = evaluateStageGates(input)
  const pipelineDone = gates.images === 'complete'

  if (counts.draft > 0 && (pipelineDone || options.hasUploaded)) {
    return { label: 'Send for approval', stage: 'send', actionType: 'navigate' }
  }

  if (!pipelineDone && counts.waiting === 0 && counts.approved === 0) {
    return getNextPipelineAction(input)
  }

  if (counts.waiting > 0) {
    return { label: `${counts.waiting} waiting on client`, stage: 'decisions', actionType: 'navigate' }
  }

  if (counts.approved > 0 && counts.draft === 0) {
    return { label: 'View approved', stage: 'approved', actionType: 'navigate' }
  }

  return getNextPipelineAction(input)
}
