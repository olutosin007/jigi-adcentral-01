import { resolveSelections } from './resolve-selections'
import type { PipelineGateInput } from './types'

export function canGenerateConcepts(input: PipelineGateInput): boolean {
  return input.campaign.status !== 'archived'
}

export function canGenerateCopy(input: PipelineGateInput): boolean {
  if (input.campaign.status === 'archived') return false
  return resolveSelections(input).selectedConceptId !== null
}

export function canGenerateImageRecommended(input: PipelineGateInput): boolean {
  if (input.campaign.status === 'archived') return false
  return resolveSelections(input).selectedCopyId !== null
}

export function canGenerateImageExplore(input: PipelineGateInput): boolean {
  return input.campaign.status !== 'archived'
}
