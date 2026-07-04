import { useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { useOnborda, type CardComponentProps } from 'onborda-rrd'
import { Button } from '@/components/ui/button'
import { ROLE_SWITCH_SELECTOR, type TourName } from '@/lib/tour/steps'
import { useTourLauncher } from '@/hooks/useTourLauncher'
import { useTourStore } from '@/store/tourStore'
import { trackTourEvent } from '@/lib/analytics'

/**
 * Custom tour tooltip, themed to the shadcn/Tailwind design system.
 * Also owns completion/skip persistence and per-step analytics.
 */
export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  arrow,
}: CardComponentProps) {
  const { closeOnborda, currentTour } = useOnborda()
  const { startApproverTour } = useTourLauncher()
  const markCompleted = useTourStore((s) => s.markCompleted)
  const tour = currentTour as TourName | null

  const isFirst = currentStep === 0
  const isLast = currentStep === totalSteps - 1
  const isHandoff = step.selector === ROLE_SWITCH_SELECTOR

  useEffect(() => {
    if (tour) {
      trackTourEvent('tour_step_viewed', { tour, step: currentStep, title: step.title })
    }
  }, [tour, currentStep, step.title])

  const handleClose = () => {
    if (tour) trackTourEvent('tour_skipped', { tour, step: currentStep })
    closeOnborda()
  }

  const handleDone = () => {
    if (tour) {
      markCompleted(tour)
      trackTourEvent('tour_completed', { tour })
    }
    closeOnborda()
  }

  const handleHandoff = () => {
    if (tour) {
      markCompleted(tour)
      trackTourEvent('tour_handoff', { from: tour })
    }
    void startApproverTour('handoff')
  }

  return (
    <div className="w-[320px] max-w-[90vw] rounded-xl border border-border bg-background p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {step.icon ? <span aria-hidden>{step.icon}</span> : null}
          <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close walkthrough"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.content}</div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {currentStep + 1} of {totalSteps}
        </span>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button variant="ghost" size="sm" onClick={() => prevStep()}>
              Back
            </Button>
          )}
          {isHandoff ? (
            <Button size="sm" onClick={handleHandoff}>
              View as approver
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : isLast ? (
            <Button size="sm" onClick={handleDone}>
              Done
            </Button>
          ) : (
            <Button size="sm" onClick={() => nextStep()}>
              Next
            </Button>
          )}
        </div>
      </div>

      <span className="text-border">{arrow}</span>
    </div>
  )
}
