export type CreativeStage = 'concepts' | 'copy' | 'images' | 'assets'

export type HandoffStage = 'send' | 'decisions' | 'approved'

export type PipelineStage = 'brief' | CreativeStage | HandoffStage

export type GenerationStage = 'concepts' | 'copy' | 'images'

export type PipelineNavGroup = 'brief' | 'creative' | 'handoff'

export const PIPELINE_GENERATION_STAGES: { id: GenerationStage; label: string }[] = [
  { id: 'concepts', label: 'Concepts' },
  { id: 'copy', label: 'Copy' },
  { id: 'images', label: 'Images' },
]

export const PIPELINE_NAV: { id: PipelineStage; label: string; group: PipelineNavGroup }[] = [
  { id: 'brief', label: 'Brief', group: 'brief' },
  { id: 'concepts', label: 'Concepts', group: 'creative' },
  { id: 'copy', label: 'Copy', group: 'creative' },
  { id: 'images', label: 'Images', group: 'creative' },
  { id: 'assets', label: 'All candidates', group: 'creative' },
  { id: 'send', label: 'Send', group: 'handoff' },
  { id: 'decisions', label: 'Decisions', group: 'handoff' },
  { id: 'approved', label: 'Approved', group: 'handoff' },
]

const STAGE_ORDER: PipelineStage[] = PIPELINE_NAV.map((s) => s.id)

const ALL_STAGES = new Set<string>(STAGE_ORDER)

export function parsePipelineStage(value: string | null | undefined): PipelineStage {
  if (value === 'creative') return 'concepts'
  if (value && ALL_STAGES.has(value)) return value as PipelineStage
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

export function isCreativeStage(stage: PipelineStage): stage is CreativeStage {
  return isGenerationStage(stage) || stage === 'assets'
}

export function isHandoffStage(stage: PipelineStage): stage is HandoffStage {
  return stage === 'send' || stage === 'decisions' || stage === 'approved'
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
    case 'send':
      return 'Send for approval'
    case 'decisions':
      return 'View decisions'
    case 'approved':
      return 'View approved'
    default:
      return 'Generate'
  }
}
