import { useEffect } from 'react'
import { useActivationStore } from '@/store/activationStore'
import { useAuthStore } from '@/store/authStore'
import type { WorkJob } from '@/hooks/useWorkQueries'

/**
 * Binds activation checklist to auth user + analytics events + coarse Work signals.
 */
export function useActivationProgress(jobs: WorkJob[] = []) {
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const setUserId = useActivationStore((s) => s.setUserId)
  const markTick = useActivationStore((s) => s.markTick)
  const markFromAnalyticsEvent = useActivationStore((s) => s.markFromAnalyticsEvent)

  useEffect(() => {
    setUserId(userId)
  }, [userId, setUserId])

  useEffect(() => {
    const onAnalytics = (e: Event) => {
      const detail = (e as CustomEvent<{ event?: string }>).detail
      if (detail?.event) markFromAnalyticsEvent(detail.event)
    }
    window.addEventListener('jigi:analytics', onAnalytics)
    return () => window.removeEventListener('jigi:analytics', onAnalytics)
  }, [markFromAnalyticsEvent])

  useEffect(() => {
    if (jobs.some((j) => j.counts.total > 0 || j.counts.draft > 0)) {
      markTick('draft_started')
    }
    if (jobs.some((j) => j.counts.waiting > 0 || j.counts.approved > 0)) {
      markTick('decide_link_sent')
    }
    if (jobs.some((j) => j.counts.approved > 0 || j.counts.changes > 0)) {
      markTick('decision_received')
    }
    if (jobs.some((j) => Boolean(j.brandName))) {
      markTick('brand_kit_optional')
    }
  }, [jobs, markTick])
}
