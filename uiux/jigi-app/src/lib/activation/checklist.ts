/**
 * Flow A activation checklist — outcome ticks for first-run agency users.
 * Persistence is per-user (see activationStore). Defaults from
 * docs/07-product-strategy/04-key-user-flows-01.md §7.3 / §11.
 */

export const ACTIVATION_TICKS = [
  'draft_started',
  'brand_check_seen',
  'decide_link_sent',
  'decision_received',
  'brand_kit_optional',
] as const

export type ActivationTick = (typeof ACTIVATION_TICKS)[number]

export interface ActivationTickMeta {
  id: ActivationTick
  label: string
  hint: string
  optional?: boolean
}

export const ACTIVATION_TICK_META: ActivationTickMeta[] = [
  {
    id: 'draft_started',
    label: 'Start a draft',
    hint: 'Generate now or upload creative into a job',
  },
  {
    id: 'brand_check_seen',
    label: 'See Brand check',
    hint: 'Brand Guardian sits beside the asset before you send',
  },
  {
    id: 'decide_link_sent',
    label: 'Send for a decision',
    hint: 'Submit and copy a Guest Decide link',
  },
  {
    id: 'decision_received',
    label: 'Get a yes (or changes)',
    hint: 'Open the Decide link yourself to practice, or wait for the client',
  },
  {
    id: 'brand_kit_optional',
    label: 'Put guidelines in',
    hint: 'Optional for idea-first — brand-first users should do this early',
    optional: true,
  },
]

/** Analytics events that complete checklist ticks (Flow plan §4.6). */
export const ACTIVATION_EVENT_TO_TICK: Record<string, ActivationTick> = {
  candidate_created: 'draft_started',
  generate_image: 'draft_started',
  brand_check_seen: 'brand_check_seen',
  decide_link_created: 'decide_link_sent',
  assets_sent: 'decide_link_sent',
  submitted: 'decide_link_sent',
  decision_made: 'decision_received',
  decide_completed: 'decision_received',
}

export function requiredTicksComplete(completed: Partial<Record<ActivationTick, boolean>>): boolean {
  return ACTIVATION_TICK_META.filter((t) => !t.optional).every((t) => completed[t.id])
}

export function completionCount(completed: Partial<Record<ActivationTick, boolean>>): {
  done: number
  total: number
} {
  const required = ACTIVATION_TICK_META.filter((t) => !t.optional)
  const done = required.filter((t) => completed[t.id]).length
  return { done, total: required.length }
}
