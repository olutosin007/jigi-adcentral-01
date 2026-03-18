import { z } from 'zod'

const briefReferenceAssetSchema = z.object({
  file_url: z.string().url(),
  filename: z.string().optional(),
})

export const campaignBriefSchema = z.object({
  objective: z.string().min(10, 'Objective must be at least 10 characters'),
  audience: z.string().min(10, 'Audience description must be at least 10 characters'),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
  requirements: z.string().optional(),
  key_message: z.string().min(1, 'Key message is required').max(500, 'Key message must be 500 characters or less'),
  tone_override: z.array(z.string()).optional(),
  reference_assets: z.array(briefReferenceAssetSchema).optional(),
  exclusions: z.string().max(1000, 'Exclusions must be 1000 characters or less').optional(),
})

export const ideaFirstBriefSchema = z.object({
  seed_idea: z.string().min(10, 'Your idea must be at least 10 characters'),
  audience: z.string().optional(),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
})

export const createCampaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  brand_id: z.string().uuid('Select a brand').optional(),
  journey_mode: z.enum(['brand_first', 'idea_first']),
  seed_idea: z.string().optional(),
  brief: campaignBriefSchema.partial(),
})

export const updateCampaignSchema = z.object({
  name: z.string().min(3).optional(),
  brief: campaignBriefSchema.partial().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
})

export const fullBriefSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  objective: z.string().min(10, 'Objective must be at least 10 characters'),
  audience: z.string().min(10, 'Audience description must be at least 10 characters'),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
  requirements: z.string().optional(),
  key_message: z.string().min(1, 'Key message is required').max(500),
  tone_override: z.array(z.string()).optional(),
  reference_assets: z.array(briefReferenceAssetSchema).optional(),
  exclusions: z.string().max(1000).optional(),
})

export type CampaignBrief = z.infer<typeof campaignBriefSchema>
export type IdeaFirstBrief = z.infer<typeof ideaFirstBriefSchema>
export type CreateCampaignData = z.infer<typeof createCampaignSchema>
export type UpdateCampaignData = z.infer<typeof updateCampaignSchema>
export type FullBriefData = z.infer<typeof fullBriefSchema>
