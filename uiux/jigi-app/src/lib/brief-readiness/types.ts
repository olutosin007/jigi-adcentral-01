import type { CampaignBrief } from '@/store/campaignStore'

export interface BriefReadinessCampaign {
  journey_mode: 'brand_first' | 'idea_first'
  seed_idea?: string | null
}

export interface BriefReadinessResult {
  ready: boolean
  missing: string[]
  warnings: string[]
}

export type BriefReadinessInput = {
  brief: CampaignBrief
  campaign: BriefReadinessCampaign
}
