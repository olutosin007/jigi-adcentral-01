import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchRoundHistory, insertStatusHistory } from './status-history'

const missingColumn = { code: 'PGRST204', message: "Could not find the 'content_snapshot' column" }

function fakeInsertClient(results: Array<{ error: unknown }>) {
  const insert = vi.fn(async () => results.shift() ?? { error: null })
  return { client: { from: () => ({ insert }) } as unknown as SupabaseClient, insert }
}

function fakeSelectClient(results: Array<{ data: unknown; error: unknown }>) {
  const select = vi.fn((cols: string) => {
    const chain = {
      eq: () => chain,
      order: async () => ({ ...(results.shift() ?? { data: [], error: null }), cols }),
    }
    return chain
  })
  return { client: { from: () => ({ select }) } as unknown as SupabaseClient, select }
}

describe('insertStatusHistory', () => {
  it('retries without the snapshot when migration 033 is missing', async () => {
    const { client, insert } = fakeInsertClient([{ error: missingColumn }, { error: null }])
    await insertStatusHistory(client, {
      asset_id: 'a',
      user_id: 'u',
      from_status: 'draft',
      to_status: 'submitted',
      content_snapshot: { headline: 'Hi' },
    })
    expect(insert).toHaveBeenCalledTimes(2)
    expect(insert.mock.calls[1][0]).not.toHaveProperty('content_snapshot')
  })
})

describe('fetchRoundHistory', () => {
  it('falls back to rows without snapshots', async () => {
    const rows = [{ to_status: 'submitted', created_at: '2026-10-01' }]
    const { client, select } = fakeSelectClient([
      { data: null, error: missingColumn },
      { data: rows, error: null },
    ])
    expect(await fetchRoundHistory(client, 'a')).toEqual(rows)
    expect(select).toHaveBeenLastCalledWith('to_status, created_at')
  })
})
