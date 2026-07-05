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
