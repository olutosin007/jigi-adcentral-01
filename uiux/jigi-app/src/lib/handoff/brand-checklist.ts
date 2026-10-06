export type BrandCheckItemStatus = 'pass' | 'warn' | 'fail'

export interface BrandCheckItem {
  label: string
  status: BrandCheckItemStatus
  detail?: string
}

export interface ChecklistSource {
  compliance_check?: unknown
  validation_scores?: unknown
  drift_status?: string | null
  content?: unknown
}

const MAX_ITEMS = 8

function humanize(key: string): string {
  const s = key.replace(/[_-]+/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Accepts 0–1 or 0–100 scores; returns 0–100 or null when not a usable score. */
function toPercent(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  if (value <= 1) return Math.round(value * 100)
  if (value <= 100) return Math.round(value)
  return null
}

function scoreStatus(pct: number): BrandCheckItemStatus {
  if (pct >= 70) return 'pass'
  if (pct >= 40) return 'warn'
  return 'fail'
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/**
 * Turns persisted validation/compliance data into a short, client-safe
 * checklist. Only names, statuses and short messages are surfaced — never
 * prompts or raw model output.
 */
export function buildBrandChecklist(source: ChecklistSource): BrandCheckItem[] {
  const items: BrandCheckItem[] = []

  if (source.drift_status === 'review_required') {
    items.push({ label: 'Brief changed since this was made', status: 'warn' })
  }

  const compliance = asRecord(source.compliance_check)
  if (Array.isArray(compliance?.checks)) {
    for (const c of compliance.checks as unknown[]) {
      const check = asRecord(c)
      if (!check || typeof check.name !== 'string') continue
      const status = check.status === 'pass' || check.status === 'fail' || check.status === 'warning'
        ? (check.status === 'warning' ? 'warn' : check.status)
        : null
      if (!status) continue
      items.push({
        label: humanize(check.name),
        status,
        detail: typeof check.message === 'string' ? check.message.slice(0, 160) : undefined,
      })
    }
  }

  const validation = asRecord(source.validation_scores)
  const scores = asRecord(validation?.scores)
  if (scores) {
    for (const [key, value] of Object.entries(scores)) {
      const pct = toPercent(value)
      if (pct == null) continue
      items.push({ label: `${humanize(key)} · ${pct}%`, status: scoreStatus(pct) })
    }
  }

  const checklists = asRecord(validation?.checklists)
  if (Array.isArray(checklists?.exclusions)) {
    for (const e of checklists.exclusions as unknown[]) {
      const ex = asRecord(e)
      if (!ex || typeof ex.item !== 'string') continue
      items.push({ label: `Avoids “${ex.item.slice(0, 60)}”`, status: ex.violated ? 'fail' : 'pass' })
    }
  }

  const content = asRecord(source.content)
  const alignment = toPercent(content?.brand_alignment_score)
  if (alignment != null) {
    items.push({ label: `Brand alignment · ${alignment}%`, status: scoreStatus(alignment) })
  }

  const rank = { fail: 0, warn: 1, pass: 2 }
  return items.sort((a, b) => rank[a.status] - rank[b.status]).slice(0, MAX_ITEMS)
}
