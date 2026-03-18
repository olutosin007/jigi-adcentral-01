/**
 * Validation Pipeline — PRD 09
 * Post-generation validation layer. Runs independently of generation.
 * Same pipeline for generated and imported assets.
 */

export type {
  AssetType,
  ValidationPipelineInput,
  ValidationPipelineResult,
} from './types'
export { validateAsset } from './pipeline'
export {
  validateAssets,
  type BatchValidationResult,
} from './batch'
