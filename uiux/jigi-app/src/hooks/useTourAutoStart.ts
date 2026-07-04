import { useEffect, useRef } from 'react'
import { useOnborda } from 'onborda-rrd'
import { useAuthStore } from '@/store/authStore'
import { useDemoStore } from '@/store/demoStore'
import { useTourStore } from '@/store/tourStore'
import { useIsMobile } from '@/hooks/use-mobile'
import { useTourLauncher } from '@/hooks/useTourLauncher'
import { TOURS, type TourName } from '@/lib/tour/steps'

/** The default tour for a user's real role. */
function defaultTourForRole(role: string | null | undefined): TourName {
  return role === 'reviewer' || role === 'approver' ? TOURS.approver : TOURS.creative
}

/**
 * On first arrival into the app, auto-start the tour matching the user's real
 * role — once ever (persisted), never on mobile, and never while a demo "view
 * as" preview or another tour is already active.
 */
export function useTourAutoStart(): void {
  const role = useAuthStore((s) => s.profile?.role)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const viewAsRole = useDemoStore((s) => s.viewAsRole)
  const completed = useTourStore((s) => s.completed)
  const autoStarted = useTourStore((s) => s.autoStarted)
  const markAutoStarted = useTourStore((s) => s.markAutoStarted)
  const { currentTour } = useOnborda()
  const { startTour } = useTourLauncher()
  const isMobile = useIsMobile()
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    if (!isInitialized || !role || isMobile) return
    if (viewAsRole || currentTour) return

    const tour = defaultTourForRole(role)
    if (completed[tour] || autoStarted[tour]) return

    firedRef.current = true
    markAutoStarted(tour)
    // Let the layout mount so anchors exist before the spotlight resolves.
    const t = setTimeout(() => {
      void startTour(tour, { demo: false, source: 'auto' })
    }, 900)
    return () => clearTimeout(t)
  }, [
    isInitialized,
    role,
    isMobile,
    viewAsRole,
    currentTour,
    completed,
    autoStarted,
    markAutoStarted,
    startTour,
  ])
}
