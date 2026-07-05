import { isBriefComplete } from './brief-readiness'
import { evaluateStageGates } from './evaluate-stage-gates'
import {
  getConceptAssets,
  getCopyAssetsForConcept,
  resolveSelections,
} from './resolve-selections'
import type { NextPipelineAction, PipelineGateInput } from './types'

export function getNextPipelineAction(input: PipelineGateInput): NextPipelineAction {
  const { campaign } = input

  if (campaign.status === 'archived') {
    return {
      label: 'View assets',
      stage: 'assets',
      actionType: 'navigate',
      reason: 'Campaign is archived',
    }
  }

  const gates = evaluateStageGates(input)
  const { selectedConceptId, selectedCopyId } = resolveSelections(input)
  const concepts = getConceptAssets(input.assets)

  if (gates.brief !== 'complete' && !isBriefComplete(campaign)) {
    return {
      label: 'Complete brief',
      stage: 'brief',
      actionType: 'navigate',
    }
  }

  if (concepts.length === 0) {
    return {
      label: 'Generate concepts',
      stage: 'concepts',
      actionType: 'focus_generate',
    }
  }

  if (!selectedConceptId) {
    return {
      label: 'Select a concept',
      stage: 'concepts',
      actionType: 'scroll_selection',
    }
  }

  const copyAssets = getCopyAssetsForConcept(input.assets, selectedConceptId)

  if (copyAssets.length === 0) {
    return {
      label: 'Generate copy',
      stage: 'copy',
      actionType: 'focus_generate',
    }
  }

  if (!selectedCopyId) {
    return {
      label: 'Select copy for key art',
      stage: 'copy',
      actionType: 'scroll_selection',
    }
  }

  return {
    label: 'Generate image',
    stage: 'images',
    actionType: 'focus_generate',
  }
}
