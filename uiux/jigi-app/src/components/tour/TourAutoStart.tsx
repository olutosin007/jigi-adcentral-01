import { useTourAutoStart } from '@/hooks/useTourAutoStart'

/**
 * Headless mount point for role-aware first-login auto-start. Must render
 * inside <OnbordaProvider> (it uses onborda + the tour launcher).
 */
export function TourAutoStart() {
  useTourAutoStart()
  return null
}
