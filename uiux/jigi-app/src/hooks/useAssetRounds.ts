import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { countRounds, previousRoundSnapshot, type RoundHistoryEntry } from '@/lib/handoff/rounds'

async function fetchHistory(assetIds: string[], withSnapshot: boolean) {
  const columns = withSnapshot ? 'asset_id, to_status, created_at, content_snapshot' : 'asset_id, to_status, created_at'
  return supabase
    .from('asset_status_history')
    .select(columns)
    .in('asset_id', assetIds)
    .order('created_at', { ascending: true })
}

type HistoryRow = RoundHistoryEntry & { asset_id: string }

/** Falls back to snapshot-less history in environments without migration 033. */
async function fetchRoundRows(assetIds: string[], withSnapshot: boolean): Promise<HistoryRow[]> {
  if (assetIds.length === 0) return []
  const first = await fetchHistory(assetIds, withSnapshot)
  if (!first.error) return (first.data ?? []) as unknown as HistoryRow[]
  if (!withSnapshot) return []
  const plain = await fetchHistory(assetIds, false)
  return (plain.data ?? []) as unknown as HistoryRow[]
}

export interface AssetRounds {
  round: number
  previousContent: Record<string, unknown> | null
}

export function useAssetRounds(assetId: string | undefined, status: string | undefined) {
  return useQuery({
    queryKey: ['asset-rounds', assetId, status],
    enabled: !!assetId,
    retry: false,
    queryFn: async (): Promise<AssetRounds> => {
      const rows = await fetchRoundRows([assetId!], true)
      return { round: countRounds(rows, status), previousContent: previousRoundSnapshot(rows) }
    },
  })
}

/** Round per asset for a job's Decisions view. */
export function useCampaignRounds(assets: Array<{ id: string; status: string }>) {
  const ids = assets.map((a) => a.id).sort()
  const key = assets.map((a) => `${a.id}:${a.status}`).sort()
  return useQuery({
    queryKey: ['campaign-rounds', key],
    enabled: ids.length > 0,
    retry: false,
    queryFn: async (): Promise<Map<string, number>> => {
      const rows = await fetchRoundRows(ids, false)
      const byAsset = new Map<string, HistoryRow[]>()
      for (const row of rows) byAsset.set(row.asset_id, [...(byAsset.get(row.asset_id) ?? []), row])
      return new Map(assets.map((a) => [a.id, countRounds(byAsset.get(a.id) ?? [], a.status)]))
    },
  })
}
