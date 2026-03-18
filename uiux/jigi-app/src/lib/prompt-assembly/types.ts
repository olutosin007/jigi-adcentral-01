/**
 * Prompt Assembly — BIO type for three-layer injection
 * PRD: 05-prd-ctxt-prompt-assembly
 */

export interface BioContext {
  voice_descriptors?: string
  value_propositions?: string
  messaging_architecture?: string
  approved_vocabulary?: string
  banned_phrases?: string
  visual_identity?: {
    colours?: { primary?: string; secondary?: string }
    typography?: string
    photography_style?: string
    illustration_style?: string
    logo_rules?: string
  }
}

export type TrackType = 'concept' | 'copy' | 'image'

export interface AssemblePromptInput {
  campaignId: string
  brandId: string
  track: TrackType
  channelId?: string
}

export interface AssemblePromptResult {
  prompt: string
  hash: string
  truncated?: boolean
  cco_version?: number
  /** CCO for validation (e.g. concept validation rules) */
  cco?: import('@/lib/cco').CampaignContextObject
}
