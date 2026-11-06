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
    /** Brand art-direction guidance (mood, lighting, composition). */
    visual_style?: string
    photography_style?: string
    illustration_style?: string
    logo_rules?: string
  }
}

export type TrackType = 'concept' | 'copy' | 'image'

export interface ConceptContextForAssembly {
  theme: string
  headlines?: string[]
  visual_direction?: string
  key_message_link?: string
}

export interface AssemblePromptInput {
  campaignId: string
  brandId?: string | null
  track: TrackType
  channelId?: string
  /** Selected concept — injected into copy (and concept) assembled prompts */
  conceptContext?: ConceptContextForAssembly
}

export interface AssemblePromptResult {
  prompt: string
  hash: string
  truncated?: boolean
  cco_version?: number
  /** CCO for validation (e.g. concept validation rules) */
  cco?: import('@/lib/cco').CampaignContextObject
}
