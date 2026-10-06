/**
 * Review rounds, derived from asset_status_history. Dependency-free so the
 * server (guest payload, notifications) can import it directly.
 *
 * A round starts every time creative is sent to the client (to_status =
 * 'submitted'). Internal checks don't count.
 */

export interface RoundHistoryEntry {
  to_status: string
  created_at: string
  content_snapshot?: Record<string, unknown> | null
}

const CLIENT_FACING = new Set(['submitted', 'brand_review', 'changes_requested', 'approved', 'rejected'])

export function countRounds(history: RoundHistoryEntry[], status?: string | null): number {
  const submits = history.filter((h) => h.to_status === 'submitted').length
  if (submits === 0 && status && CLIENT_FACING.has(status)) return 1
  return submits
}

/** Round the next send will create. */
export function nextRound(history: RoundHistoryEntry[]): number {
  return history.filter((h) => h.to_status === 'submitted').length + 1
}

export function roundLabel(round: number): string {
  return `Round ${Math.max(1, round)}`
}

/** Content as it was sent in the previous round, if a snapshot was captured. */
export function previousRoundSnapshot(history: RoundHistoryEntry[]): Record<string, unknown> | null {
  const submits = history
    .filter((h) => h.to_status === 'submitted')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
  if (submits.length < 2) return null
  return submits[submits.length - 2].content_snapshot ?? null
}

export interface ContentFieldDiff {
  key: string
  label: string
  before: string
  after: string
  changed: boolean
}

const SKIP_KEYS = /url|path|prompt|generation_log|(^|_)(id|model|provider|seed|width|height|mime|size|raw|tokens?)(_|$)/i

function toText(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value) && value.every((v) => typeof v === 'string' || typeof v === 'number')) {
    return value.join(', ')
  }
  return null
}

function humanKey(key: string): string {
  const spaced = key.replace(/_/g, ' ').trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** Field-level text diff for copy/concept content; images compare by URL instead. */
export function diffContentFields(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): ContentFieldDiff[] {
  const prev = before ?? {}
  const next = after ?? {}
  const keys = Array.from(new Set([...Object.keys(next), ...Object.keys(prev)]))
  const rows: ContentFieldDiff[] = []
  for (const key of keys) {
    if (SKIP_KEYS.test(key)) continue
    const a = toText(prev[key])
    const b = toText(next[key])
    if (a == null && b == null) continue
    rows.push({ key, label: humanKey(key), before: a ?? '', after: b ?? '', changed: (a ?? '') !== (b ?? '') })
  }
  return rows.sort((x, y) => Number(y.changed) - Number(x.changed))
}
