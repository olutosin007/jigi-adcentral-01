/**
 * Validation Pipeline — PRD 09
 * Input/output contracts for the unified validation layer.
 */

export type AssetType = 'concept' | 'copy' | 'image'

/** Input: asset to validate (minimal shape) */
export interface ValidationPipelineInput {
  assetId: string
  campaignId: string
  /** Optional: pre-fetched asset; if omitted, pipeline fetches */
  asset?: {
    id: string
    type: AssetType
    content: Record<string, unknown>
  }
}

/** Standardized validation result schema */
export interface ValidationPipelineResult {
  assetId: string
  assetType: AssetType
  valid: boolean
  /** Blocking issues (e.g. exclusions violated, safe zones not clear) */
  blocking: boolean
  /** Human-readable warnings */
  warnings: string[]
  /** Track-specific scores (0–100) */
  scores: {
    brand_alignment?: number
    brand_voice?: number
    colour_compliance?: number
    tone_adherence?: number
  }
  /** Track-specific checklists */
  checklists: {
    mandatory_inclusions?: Array<{ requirement: string; present: boolean }>
    exclusions?: Array<{ item: string; violated: boolean }>
    composition?: { safe_zones_clear?: boolean }
  }
  /** Suggestions (e.g. truncation) */
  suggestions?: string[]
  /** Normalized content with validation merged (for persistence) */
  normalizedContent?: Record<string, unknown>
}
