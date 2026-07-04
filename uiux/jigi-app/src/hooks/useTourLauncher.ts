import { useCallback } from 'react'
import { useOnborda } from 'onborda-rrd'
import { supabase } from '@/lib/supabase'
import { useDemoStore } from '@/store/demoStore'
import { trackTourEvent } from '@/lib/analytics'
import { TOURS, type TourName } from '@/lib/tour/steps'

interface StartTourOptions {
  /**
   * When true (default), flip the demo "view as" role so a single session can
   * preview a persona it isn't. Set false for role-aware auto-start, which
   * should reflect the user's real role without overriding it.
   */
  demo?: boolean
  /** For analytics attribution (e.g. 'settings', 'auto', 'handoff'). */
  source?: string
}

/**
 * Starts a persona tour with the demo scaffolding in place:
 * 1. optionally flips the "view as" role so the UI matches the persona,
 * 2. resolves a concrete campaign / review asset id so the id-scoped steps
 *    can navigate (best-effort — the tour still runs without one),
 * 3. starts the onborda tour.
 *
 * ids are resolved via Supabase under the signed-in user's session, so RLS
 * still applies. If nothing is found the scoped steps simply don't navigate.
 */
export function useTourLauncher() {
  const { startOnborda } = useOnborda()
  const setViewAsRole = useDemoStore((s) => s.setViewAsRole)
  const setDemoCampaignId = useDemoStore((s) => s.setDemoCampaignId)
  const setDemoAssetId = useDemoStore((s) => s.setDemoAssetId)

  const resolveCampaignId = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('campaigns')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return (data?.id as string | undefined) ?? null
    } catch {
      return null
    }
  }, [])

  const resolveReviewAssetId = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('creative_assets')
        .select('id')
        .in('status', ['submitted', 'brand_review'])
        .order('updated_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      return (data?.id as string | undefined) ?? null
    } catch {
      return null
    }
  }, [])

  const startTour = useCallback(
    async (tour: TourName, { demo = true, source = 'manual' }: StartTourOptions = {}) => {
      if (tour === TOURS.creative) {
        if (demo) setViewAsRole('creator')
        setDemoCampaignId(await resolveCampaignId())
      } else {
        if (demo) setViewAsRole('approver')
        setDemoAssetId(await resolveReviewAssetId())
      }
      trackTourEvent('tour_started', { tour, demo, source })
      startOnborda(tour)
    },
    [resolveCampaignId, resolveReviewAssetId, setDemoAssetId, setDemoCampaignId, setViewAsRole, startOnborda]
  )

  const startCreativeTour = useCallback(
    (source = 'settings') => startTour(TOURS.creative, { demo: true, source }),
    [startTour]
  )
  const startApproverTour = useCallback(
    (source = 'settings') => startTour(TOURS.approver, { demo: true, source }),
    [startTour]
  )

  return { startTour, startCreativeTour, startApproverTour }
}
