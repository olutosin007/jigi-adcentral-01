import type { CampaignBrief } from '@/store/campaignStore'
import type { BriefReadinessCampaign, BriefReadinessResult } from './types'
import { evaluateBriefReadiness } from './evaluate'

export interface BriefChecklistItem {
  label: string
  done: boolean
}

export function buildBriefChecklistItems(
  brief: CampaignBrief,
  campaign: BriefReadinessCampaign & { brand_id?: string | null }
): BriefChecklistItem[] {
  const readiness = evaluateBriefReadiness(brief, campaign)
  const doneLabels = new Set(
    ['Key message', 'Channels', 'Objective', 'Audience', 'Your idea'].filter(
      (label) => !readiness.missing.includes(label)
    )
  )

  const items: BriefChecklistItem[] = [
    ...(campaign.journey_mode === 'brand_first'
      ? [{ label: 'Brand selected', done: Boolean(campaign.brand_id) }]
      : [{ label: 'Your idea', done: doneLabels.has('Your idea') }]),
    { label: 'Objective', done: doneLabels.has('Objective') },
    { label: 'Target audience', done: doneLabels.has('Audience') },
    { label: 'Key message', done: doneLabels.has('Key message') },
    { label: 'Channels', done: doneLabels.has('Channels') },
  ]

  return items
}

export function buildCreateChecklistItems(input: {
  name: string
  brandId?: string
  objective: string
  audience: string
  channels: string[]
  keyMessage: string
  seedIdea: string
  journeyMode: 'brand_first' | 'idea_first'
}): BriefChecklistItem[] {
  return [
    { label: 'Campaign name', done: input.name.trim().length >= 3 },
    ...(input.journeyMode === 'brand_first'
      ? [{ label: 'Brand selected', done: Boolean(input.brandId) }]
      : [{ label: 'Your idea', done: input.seedIdea.trim().length >= 10 }]),
    { label: 'Objective', done: input.objective.trim().length >= 10 },
    { label: 'Target audience', done: input.audience.trim().length >= 10 },
    { label: 'Key message', done: input.keyMessage.trim().length >= 1 },
    { label: 'Channels', done: input.channels.length >= 1 },
  ]
}

export function readinessSummary(result: BriefReadinessResult): string {
  if (result.ready) return 'Ready'
  return `Incomplete (${result.missing.length})`
}
