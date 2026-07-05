export type PipelineStage = 'brief' | 'concepts' | 'copy' | 'images' | 'assets'

export type GenerationStage = 'concepts' | 'copy' | 'images'

export const PIPELINE_GENERATION_STAGES: { id: GenerationStage; label: string }[] = [
  { id: 'concepts', label: 'Concepts' },
  { id: 'copy', label: 'Copy' },
  { id: 'images', label: 'Images' },
]

export const PIPELINE_NAV: { id: PipelineStage; label: string; section?: 'main' | 'assets' }[] = [
  { id: 'brief', label: 'Brief', section: 'main' },
  { id: 'concepts', label: 'Concepts', section: 'main' },
  { id: 'copy', label: 'Copy', section: 'main' },
  { id: 'images', label: 'Images', section: 'main' },
  { id: 'assets', label: 'All assets', section: 'assets' },
]

const STAGE_ORDER: PipelineStage[] = ['brief', 'concepts', 'copy', 'images', 'assets']

export function parsePipelineStage(value: string | null | undefined): PipelineStage {
  if (
    value === 'brief' ||
    value === 'concepts' ||
    value === 'copy' ||
    value === 'images' ||
    value === 'assets'
  ) {
    return value
  }
  return 'brief'
}

export function parseLegacyTab(value: string | null | undefined): PipelineStage | null {
  if (value === 'brief') return 'brief'
  if (value === 'generated') return 'concepts'
  if (value === 'assets') return 'assets'
  return null
}

/**
 * @deprecated Use evaluateStageGates from pipeline-gates instead.
 */
export function isPipelineStageDone(stage: PipelineStage, active: PipelineStage): boolean {
  return STAGE_ORDER.indexOf(stage) < STAGE_ORDER.indexOf(active)
}

export function isGenerationStage(stage: PipelineStage): stage is GenerationStage {
  return stage === 'concepts' || stage === 'copy' || stage === 'images'
}

export function primaryCtaLabel(stage: PipelineStage): string {
  switch (stage) {
    case 'brief':
      return 'Save brief'
    case 'concepts':
      return 'Generate concepts'
    case 'copy':
      return 'Generate copy'
    case 'images':
      return 'Generate image'
    case 'assets':
      return 'Upload asset'
    default:
      return 'Generate'
  }
}
