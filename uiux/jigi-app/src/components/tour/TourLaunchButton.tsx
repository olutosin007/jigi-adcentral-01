import { HelpCircleIcon } from 'lucide-react'
import { useEffectiveRole } from '@/hooks/useEffectiveRole'
import { useTourLauncher } from '@/hooks/useTourLauncher'
import { TOURS } from '@/lib/tour/steps'

/**
 * Always-available manual entry point for the guided tour. Starts the tour
 * matching the current (effective) role, independent of the once-only
 * auto-start state so the walkthrough is never "stuck" as unseen.
 */
export function TourLaunchButton() {
  const role = useEffectiveRole()
  const { startTour } = useTourLauncher()
  const tour = role === 'reviewer' || role === 'approver' ? TOURS.approver : TOURS.creative

  return (
    <button
      type="button"
      onClick={() => void startTour(tour, { demo: false, source: 'header' })}
      aria-label="Take a tour"
      title="Take a tour"
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg border border-border bg-muted text-muted-foreground hover:bg-accent transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <HelpCircleIcon className="w-4 h-4" />
      <span className="hidden md:inline">Tour</span>
    </button>
  )
}
