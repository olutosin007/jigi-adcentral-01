import { isBriefComplete } from './brief-readiness'
import {
  getConceptAssets,
  getCopyAssetsForConcept,
  getImagesForSelections,
  resolveSelections,
} from './resolve-selections'
import type { PipelineGateInput, StageGateMap, StageGateStatus } from './types'

function briefStageStatus(input: PipelineGateInput): StageGateStatus {
  return isBriefComplete(input.campaign) ? 'complete' : 'in_progress'
}

function conceptsStageStatus(input: PipelineGateInput): StageGateStatus {
  const concepts = getConceptAssets(input.assets)
  const { selectedConceptId } = resolveSelections(input)

  if (concepts.length === 0) {
    return 'available'
  }

  if (selectedConceptId) {
    return 'complete'
  }

  return 'in_progress'
}

function copyStageStatus(input: PipelineGateInput): StageGateStatus {
  const { selectedConceptId, selectedCopyId } = resolveSelections(input)

  if (!selectedConceptId) {
    return 'available'
  }

  const copyAssets = getCopyAssetsForConcept(input.assets, selectedConceptId)

  if (selectedCopyId) {
    return 'complete'
  }

  if (copyAssets.length === 0) {
    return 'available'
  }

  return 'in_progress'
}

function imagesStageStatus(input: PipelineGateInput): StageGateStatus {
  const { selectedConceptId, selectedCopyId } = resolveSelections(input)
  const copyComplete = copyStageStatus(input) === 'complete'

  if (!copyComplete) {
    return 'available'
  }

  const images = getImagesForSelections(input.assets, selectedConceptId, selectedCopyId)
  if (images.length > 0) {
    return 'complete'
  }

  return 'available'
}

export function evaluateStageGates(input: PipelineGateInput): StageGateMap {
  return {
    brief: briefStageStatus(input),
    concepts: conceptsStageStatus(input),
    copy: copyStageStatus(input),
    images: imagesStageStatus(input),
    assets: 'available',
  }
}
