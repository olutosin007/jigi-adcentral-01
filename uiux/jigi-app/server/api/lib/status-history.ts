import type { SupabaseClient } from '@supabase/supabase-js'
import type { RoundHistoryEntry } from '../../../src/lib/handoff/rounds.js'

interface StatusHistoryInsert {
  asset_id: string
  user_id: string | null
  from_status: string | null
  to_status: string
  notes?: string | null
  content_snapshot?: unknown
  [key: string]: unknown
}

/** Postgres undefined_column / PostgREST unknown column — migration 033 not applied yet. */
function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42703' || error.code === 'PGRST204' || /content_snapshot/.test(error.message ?? '')
}

export async function insertStatusHistory(admin: SupabaseClient, row: StatusHistoryInsert): Promise<void> {
  const { error } = await admin.from('asset_status_history').insert(row)
  if (error && 'content_snapshot' in row && isMissingColumn(error)) {
    const { content_snapshot: _omit, ...rest } = row
    const retry = await admin.from('asset_status_history').insert(rest)
    if (retry.error) console.error('Status history insert failed:', retry.error)
    return
  }
  if (error) console.error('Status history insert failed:', error)
}

export async function fetchRoundHistory(admin: SupabaseClient, assetId: string): Promise<RoundHistoryEntry[]> {
  const withSnapshot = await admin
    .from('asset_status_history')
    .select('to_status, created_at, content_snapshot')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: true })
  if (!withSnapshot.error) return (withSnapshot.data ?? []) as RoundHistoryEntry[]
  if (!isMissingColumn(withSnapshot.error)) return []

  const plain = await admin
    .from('asset_status_history')
    .select('to_status, created_at')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: true })
  return (plain.data ?? []) as RoundHistoryEntry[]
}
