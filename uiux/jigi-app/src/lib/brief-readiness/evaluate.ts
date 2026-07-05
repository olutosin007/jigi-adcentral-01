import type { CampaignBrief } from '@/store/campaignStore'
import type { BriefReadinessCampaign, BriefReadinessResult } from './types'

const MIN_OBJECTIVE = 10
const MIN_AUDIENCE = 10
const MIN_SEED_IDEA = 10
const MAX_KEY_MESSAGE = 500

function pushMissing(missing: string[], label: string, ok: boolean) {
  if (!ok) missing.push(label)
}

export function evaluateBriefReadiness(
  brief: CampaignBrief,
  campaign: BriefReadinessCampaign
): BriefReadinessResult {
  const missing: string[] = []
  const warnings: string[] = []

  const keyMessage = brief.key_message?.trim() ?? ''
  const objective = brief.objective?.trim() ?? ''
  const audience = brief.audience?.trim() ?? ''
  const channels = brief.channels ?? []
  const seedIdea = campaign.seed_idea?.trim() ?? ''

  pushMissing(missing, 'Key message', keyMessage.length >= 1 && keyMessage.length <= MAX_KEY_MESSAGE)
  pushMissing(missing, 'Channels', channels.length >= 1)
  pushMissing(missing, 'Objective', objective.length >= MIN_OBJECTIVE)
  pushMissing(missing, 'Audience', audience.length >= MIN_AUDIENCE)

  if (campaign.journey_mode === 'idea_first') {
    pushMissing(missing, 'Your idea', seedIdea.length >= MIN_SEED_IDEA)
  }

  if (!brief.exclusions?.trim()) {
    warnings.push('No exclusions set')
  }
  if (!brief.reference_assets?.length) {
    warnings.push('No reference assets uploaded')
  }
  if (!brief.requirements?.trim()) {
    warnings.push('No specific requirements listed')
  }

  return {
    ready: missing.length === 0,
    missing,
    warnings,
  }
}
