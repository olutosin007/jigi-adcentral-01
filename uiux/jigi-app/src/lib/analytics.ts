/**
 * Minimal, provider-agnostic analytics shim.
 *
 * No analytics vendor is wired yet, so events are:
 *  - forwarded to `window.analytics.track` if a provider (Segment/PostHog/…)
 *    is later attached,
 *  - dispatched as a `jigi:analytics` CustomEvent so anything in-app can listen,
 *  - logged in dev for visibility.
 *
 * Swap the body for a real SDK call when a provider is chosen — call sites stay
 * unchanged.
 */
export type TourEventName =
  | 'tour_started'
  | 'tour_step_viewed'
  | 'tour_completed'
  | 'tour_skipped'
  | 'tour_handoff'

type AnalyticsProps = Record<string, unknown>

interface WindowWithAnalytics extends Window {
  analytics?: { track?: (event: string, props?: AnalyticsProps) => void }
}

export function trackEvent(event: string, props: AnalyticsProps = {}): void {
  if (typeof window === 'undefined') return

  const w = window as WindowWithAnalytics
  try {
    w.analytics?.track?.(event, props)
  } catch {
    // never let analytics break the UI
  }

  window.dispatchEvent(new CustomEvent('jigi:analytics', { detail: { event, props } }))

  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, props)
  }
}

export function trackTourEvent(event: TourEventName, props: AnalyticsProps = {}): void {
  trackEvent(event, props)
}

export type GenerateImagePath = 'production_path' | 'explore_path'

/** Tracks concept→copy→image production flow vs explore shortcuts (P4 Sprint 4). */
export function trackGenerateImagePath(
  path: GenerateImagePath,
  props: AnalyticsProps = {}
): void {
  trackEvent('generate_image', { path, ...props })
}

export type DecideVia = 'guest' | 'app'

/**
 * North-star decision event. `hours_to_decision` is measured from the last
 * send; `approved_first_round` feeds approved_first_round_rate.
 */
export function trackDecision(input: {
  via: DecideVia
  action: 'approve' | 'request_changes' | 'reject'
  round: number
  sentAt?: string | null
  assetType?: string
  candidateSource?: string | null
  now?: Date
}): void {
  const sent = input.sentAt ? new Date(input.sentAt).getTime() : NaN
  const hours = Number.isNaN(sent)
    ? null
    : Math.max(0, Math.round((((input.now ?? new Date()).getTime() - sent) / 3_600_000) * 10) / 10)
  trackEvent('decide_completed', {
    via: input.via,
    decide_via: input.via,
    action: input.action,
    round: input.round,
    hours_to_decision: hours,
    approved_first_round: input.action === 'approve' && input.round <= 1,
    asset_type: input.assetType,
    candidate_source: input.candidateSource ?? 'ai',
  })
}
