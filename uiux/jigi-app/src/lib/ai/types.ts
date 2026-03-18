export interface BrandIncludeFlags {
  colours: boolean
  tone: boolean
  logo?: boolean
  text?: boolean
}

export const DEFAULT_BRAND_INCLUDE: BrandIncludeFlags = {
  colours: true,
  tone: true,
  logo: true,
  text: false, // off by default; models struggle with exact text
}

export interface BrandConstraints {
  name: string
  identity: {
    colours: Array<{ hex: string; role: string }>
    fonts: { heading: string; body: string }
    logo_url?: string
  }
  voice: {
    tone: string[]
    preferred_words: string[]
    avoided_words: string[]
    samples?: string[]
  }
  strategy?: {
    positioning?: string
    differentiators?: string[]
  }
}

export interface CampaignBrief {
  objective?: string
  audience?: string
  channels?: string[]
  requirements?: string
}

export interface FallbackContext {
  seed_idea: string
  audience?: string
  style_hints?: string[]
}

export interface GenerationRequest {
  type: 'concept' | 'copy' | 'image'
  brand?: BrandConstraints
  fallback_context?: FallbackContext
  brief: CampaignBrief
  options?: {
    quality?: 'draft' | 'production'
    image_tier?: 'draft' | 'refine' | 'final'
    count?: number
  }
}

export interface ConceptResult {
  theme: string
  headlines: string[]
  visual_direction: string
  rationale: string
  /** PRD 06: New schema fields */
  concept_name?: string
  strategic_insight?: string
  creative_territory?: string
  headline_direction?: string
  format_suitability?: string[]
  key_message_link?: string
  brand_alignment_score?: number
  brand_alignment_rationale?: string
  validation_warnings?: string[]
}

export interface CopyResult {
  headline: string
  body: string
  cta: string
  /** PRD 07: Copy Output Schema fields */
  copy_id?: string
  channel?: string
  deliverable_type?: string
  character_count?: number
  tone_adherence?: number
  key_message_delivery?: string
  mandatory_inclusions_check?: Array<{ requirement: string; present: boolean }>
  exclusions_check?: Array<{ exclusion: string; violated: boolean }>
  legal_disclaimers_appended?: boolean
  validation_warnings?: string[]
  truncation_suggestion?: string
  exclusions_violated?: boolean
  brand_voice_score?: number
  brand_tune_suggestion?: string
}

export interface ImageResult {
  url: string
  prompt_used: string
  model: string
  image_provider?: 'google_imagen' | 'replicate' | 'azure_openai' | 'azure_foundry'
  image_tier?: 'draft' | 'refine' | 'final'
  routing_reason?: 'default' | 'retry' | 'quota_exhausted' | 'budget_guard'
  cost_bucket?: 'free' | 'paid_fallback'
  provider_model?: string
  route_attempt?: number
  revised_prompt?: string
  size?: string
  quality?: string
  /** PRD 08: Image Output Schema fields */
  channel?: string
  dimensions?: { width: number; height: number }
  colour_compliance?: { bio_palette_match: number; dominant_colours?: string[] }
  composition_check?: { safe_zones_clear: boolean }
  validation_warnings?: string[]
  safe_zones_violated?: boolean
}

export interface GenerationResult {
  type: 'concept' | 'copy' | 'image'
  data: ConceptResult[] | CopyResult[] | ImageResult[]
  metadata: {
    model: string
    latency_ms: number
    tokens_used?: number
    generation_mode: 'brand_grounded' | 'idea_first'
    image_provider?: 'google_imagen' | 'replicate' | 'azure_openai' | 'azure_foundry'
    image_tier?: 'draft' | 'refine' | 'final'
    routing_reason?: 'default' | 'retry' | 'quota_exhausted' | 'budget_guard'
    cost_bucket?: 'free' | 'paid_fallback'
    prompt_hash?: string
    lineage?: { cco_version?: number; bio_version?: number; generation_timestamp?: string }
    /** PRD 08: Asset from image API for validation update */
    asset?: { id: string; content?: Record<string, unknown> }
  }
}

export interface GenerationOptions {
  temperature?: number
  maxTokens?: number
}

export interface AIModel {
  name: string
  generate(prompt: string, options?: GenerationOptions): Promise<string>
}

export interface ComplianceCheck {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

export interface ComplianceResult {
  passed: boolean
  checks: ComplianceCheck[]
}
