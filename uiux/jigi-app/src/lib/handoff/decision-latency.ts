/**
 * Dev/admin stub: median hours from first "candidate in review" status
 * (submitted / brand_review) to a terminal decision (approved / rejected / changes_requested).
 */

export interface StatusHistoryPoint {
  to_status: string
  created_at: string
}

const CANDIDATE_STATUSES = new Set(['submitted', 'brand_review'])
const DECISION_STATUSES = new Set(['approved', 'rejected', 'changes_requested'])

function hoursBetween(fromIso: string, toIso: string): number | null {
  const a = new Date(fromIso).getTime()
  const b = new Date(toIso).getTime()
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null
  return (b - a) / 3_600_000
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((x, y) => x - y)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2
  }
  return sorted[mid]!
}

/**
 * For a single asset's chronological status history, hours from first
 * candidate status to the first subsequent decision status.
 */
export function hoursCandidateToDecision(history: StatusHistoryPoint[]): number | null {
  const ordered = [...history].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const candidate = ordered.find((h) => CANDIDATE_STATUSES.has(h.to_status))
  if (!candidate) return null
  const decision = ordered.find(
    (h) =>
      DECISION_STATUSES.has(h.to_status) &&
      new Date(h.created_at).getTime() >= new Date(candidate.created_at).getTime()
  )
  if (!decision) return null
  return hoursBetween(candidate.created_at, decision.created_at)
}

/** Median across many assets' histories (admin/dev metric stub). */
export function medianHoursCandidateToDecision(
  histories: StatusHistoryPoint[][]
): number | null {
  const hours = histories
    .map(hoursCandidateToDecision)
    .filter((h): h is number => h != null)
  return median(hours)
}
