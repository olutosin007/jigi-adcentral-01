/**
 * Campaign Context Object (CCO) — Schema & Types
 * Compiled from Campaign Brief at save-time. Injected into all generation calls.
 * @see docs/05 mvp-cleanup/02-campaign-context-enforcement/Jigi_Campaign_Context_Object_Spec_v1.docx.md
 */

import { z } from 'zod'

// ─── Enums ─────────────────────────────────────────────────────────────────

export const GOAL_TYPE = [
  'awareness',
  'engagement',
  'conversion',
  'retention',
  'launch',
  'event',
] as const
export type GoalType = (typeof GOAL_TYPE)[number]

export const LANGUAGE_REGISTER = [
  'formal',
  'conversational',
  'slang-friendly',
  'technical',
] as const
export type LanguageRegister = (typeof LANGUAGE_REGISTER)[number]

export const CONTENT_TYPE = [
  'static_image',
  'video',
  'carousel',
  'text_only',
  'mixed',
] as const
export type ContentType = (typeof CONTENT_TYPE)[number]

export const REFERENCE_ASSET_CLASSIFICATION = [
  'mood_board',
  'competitor_example',
  'previous_campaign',
  'style_reference',
  'negative_reference',
] as const
export type ReferenceAssetClassification =
  (typeof REFERENCE_ASSET_CLASSIFICATION)[number]

export const APPLICABLE_TRACK = ['concept', 'copy', 'image'] as const
export type ApplicableTrack = (typeof APPLICABLE_TRACK)[number]

// ─── 3.2 strategic_context ─────────────────────────────────────────────────

export const demographicCuesSchema = z.object({
  age_range: z.string().optional(),
  location: z.string().optional(),
  profession: z.string().optional(),
}).passthrough()

export const strategicContextSchema = z.object({
  objective_raw: z.string(),
  goal_type: z.enum(GOAL_TYPE).optional(),
  emotional_register: z.array(z.string()).default([]),
  key_message: z.string(),
  value_prop_alignment: z.string().optional(),
})

export type StrategicContext = z.infer<typeof strategicContextSchema>
export type DemographicCues = z.infer<typeof demographicCuesSchema>

// ─── 3.3 audience_context ───────────────────────────────────────────────────

export const audienceContextSchema = z.object({
  audience_raw: z.string(),
  demographic_cues: demographicCuesSchema.optional(),
  psychographic_traits: z.array(z.string()).default([]),
  language_register: z.enum(LANGUAGE_REGISTER).optional(),
  cultural_context: z.array(z.string()).default([]),
})

export type AudienceContext = z.infer<typeof audienceContextSchema>

// ─── 3.4 channel_constraints ────────────────────────────────────────────────

export const imageDimensionsSchema = z.object({
  width: z.number(),
  height: z.number(),
  aspect_ratio: z.string().optional(),
  safe_zones: z.record(z.unknown()).optional(),
  alternate_sizes: z.array(z.object({ width: z.number(), height: z.number() })).optional(),
}).passthrough()

export const copyLimitsSchema = z.object({
  max_chars: z.number().optional(),
  max_lines: z.number().optional(),
  headline_max: z.number().optional(),
  cta_max: z.number().optional(),
  caption_max: z.number().optional(),
  overlay_max: z.number().optional(),
  visible_chars: z.number().optional(),
  hashtags_max: z.number().optional(),
  optimal_chars: z.number().optional(),
  visible_lines: z.number().optional(),
  primary_max: z.number().optional(),
  description_max: z.number().optional(),
  body_max: z.number().optional(),
  subject_max: z.number().optional(),
  pre_header_max: z.number().optional(),
}).passthrough()

export const channelConstraintSchema = z.object({
  channel_id: z.string(),
  image_dimensions: imageDimensionsSchema.optional(),
  copy_limits: copyLimitsSchema.optional(),
  format_rules: z.array(z.string()).default([]),
  content_type: z.enum(CONTENT_TYPE).optional(),
})

export type ChannelConstraint = z.infer<typeof channelConstraintSchema>
export type ImageDimensions = z.infer<typeof imageDimensionsSchema>
export type CopyLimits = z.infer<typeof copyLimitsSchema>

// ─── 3.5 tone_profile ───────────────────────────────────────────────────────

export const toneProfileSchema = z.object({
  base_tone: z.array(z.string()).default([]),
  campaign_modifiers: z.array(z.string()).default([]),
  effective_tone: z.array(z.string()).default([]),
  vocabulary_guidance: z.string().optional(),
})

export type ToneProfile = z.infer<typeof toneProfileSchema>

// ─── 3.6 hard_constraints ─────────────────────────────────────────────────

export const hardConstraintsSchema = z.object({
  requirements_raw: z.string().optional(),
  exclusions_raw: z.string().optional(),
  parsed_requirements: z.array(z.string()).default([]),
  parsed_exclusions: z.array(z.string()).default([]),
  legal_disclaimers: z.array(z.string()).default([]),
})

export type HardConstraints = z.infer<typeof hardConstraintsSchema>

// ─── 3.7 reference_assets ───────────────────────────────────────────────────

export const referenceAssetSchema = z.object({
  asset_id: z.string().uuid(),
  file_url: z.string(),
  classification: z.enum(REFERENCE_ASSET_CLASSIFICATION),
  applicable_tracks: z.array(z.enum(APPLICABLE_TRACK)).default([]),
  description: z.string().optional(),
})

export type ReferenceAsset = z.infer<typeof referenceAssetSchema>

// ─── 3.1 Root CCO ──────────────────────────────────────────────────────────

export const campaignContextObjectSchema = z.object({
  campaign_id: z.string().uuid(),
  brand_id: z.string().uuid(),
  compiled_at: z.string().datetime(),
  version: z.number().int().min(1),
  strategic_context: strategicContextSchema,
  audience_context: audienceContextSchema,
  channel_constraints: z.array(channelConstraintSchema),
  tone_profile: toneProfileSchema,
  hard_constraints: hardConstraintsSchema,
  reference_assets: z.array(referenceAssetSchema).default([]),
})

export type CampaignContextObject = z.infer<typeof campaignContextObjectSchema>

// ─── Asset lineage (for creative_assets) ──────────────────────────────────────

export const assetLineageSchema = z.object({
  cco_version: z.number().int().min(1),
  bio_version: z.number().int().min(0).optional(),
  generation_timestamp: z.string().datetime(),
  validation_scores: z.record(z.unknown()).optional(),
})

export type AssetLineage = z.infer<typeof assetLineageSchema>
