import { evaluateBriefReadiness } from '@/lib/brief-readiness'
import type { PipelineGateCampaign } from './types'

export { evaluateBriefReadiness } from '@/lib/brief-readiness'
export type { BriefReadinessResult } from '@/lib/brief-readiness'

export function isBriefComplete(campaign: PipelineGateCampaign): boolean {
  return evaluateBriefReadiness(campaign.brief, {
    journey_mode: campaign.journey_mode,
    seed_idea: campaign.seed_idea ?? null,
  }).ready
}
