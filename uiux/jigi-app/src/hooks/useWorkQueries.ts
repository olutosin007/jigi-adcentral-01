import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CampaignBrief } from '@/store/campaignStore'
import { evaluateBriefReadiness } from '@/lib/brief-readiness'
import {
  countJobAssets,
  getJobNextAction,
  oldestWaitingAt,
  type JobAssetCounts,
  type JobNextAction,
} from '@/lib/handoff'

export interface WorkJob {
  id: string
  name: string
  brandName?: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  journeyMode: 'brand_first' | 'idea_first'
  updatedAt: string
  counts: JobAssetCounts
  briefReady: boolean
  nextAction: JobNextAction
}

interface WorkJobRow {
  id: string
  name: string
  status: WorkJob['status']
  updated_at: string
  journey_mode?: 'brand_first' | 'idea_first' | null
  seed_idea?: string | null
  brief?: Record<string, unknown> | null
  brands?: { id: string; name: string } | { id: string; name: string }[] | null
  creative_assets?: { id: string; status: string; updated_at?: string | null }[] | null
}

export function toWorkJob(row: WorkJobRow): WorkJob {
  const brand = Array.isArray(row.brands) ? row.brands[0] : row.brands
  const journeyMode = row.journey_mode ?? 'brand_first'
  const counts = countJobAssets(row.creative_assets ?? [])
  const briefReady = evaluateBriefReadiness((row.brief ?? {}) as CampaignBrief, {
    journey_mode: journeyMode,
    seed_idea: row.seed_idea ?? null,
  }).ready

  return {
    id: row.id,
    name: row.name,
    brandName: brand?.name,
    status: row.status,
    journeyMode,
    updatedAt: row.updated_at,
    counts,
    briefReady,
    nextAction: getJobNextAction({
      counts,
      briefReady,
      archived: row.status === 'archived',
      oldestWaitingAt: oldestWaitingAt(row.creative_assets ?? []),
    }),
  }
}

async function fetchWorkJobs(): Promise<WorkJob[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      `
      id,
      name,
      status,
      updated_at,
      journey_mode,
      seed_idea,
      brief,
      brands(id, name),
      creative_assets(id, status, updated_at)
    `
    )
    .order('updated_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as WorkJobRow[]).map(toWorkJob)
}

export function useWorkJobs() {
  return useQuery({
    queryKey: ['work-jobs'],
    queryFn: fetchWorkJobs,
    staleTime: 30 * 1000,
  })
}
