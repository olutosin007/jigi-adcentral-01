import { campaignBriefSchema, ideaFirstBriefSchema } from '@/lib/validations/campaign'
import type { PipelineGateCampaign } from './types'

export function isBriefComplete(campaign: PipelineGateCampaign): boolean {
  if (campaign.journey_mode === 'idea_first') {
    return ideaFirstBriefSchema.safeParse({
      seed_idea: campaign.seed_idea ?? '',
      audience: campaign.brief.audience,
      channels: campaign.brief.channels ?? [],
    }).success
  }

  return campaignBriefSchema.safeParse(campaign.brief).success
}
