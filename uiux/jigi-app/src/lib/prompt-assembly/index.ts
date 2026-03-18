/**
 * Prompt Assembly — Three-layer injection (BIO + CCO + Track Template)
 * PRD: 05-prd-ctxt-prompt-assembly
 */

export { assemblePrompt } from './assembler'
export type {
  AssemblePromptInput,
  AssemblePromptResult,
  BioContext,
  TrackType,
} from './types'
export { getTemplate, CONCEPT_TEMPLATE, COPY_TEMPLATE, IMAGE_TEMPLATE } from './templates'
export { buildBioFromBrand } from './bio-builder'
export { substitutePlaceholders } from './substitution'
export { truncateCCOForBudget, estimateTokenCount } from './truncation'
