import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TourName } from '@/lib/tour/steps'

/**
 * Persisted walkthrough state (localStorage).
 *
 * - `completed`   — the user finished the tour (pressed Done / handoff).
 * - `autoStarted` — we already auto-started this tour once, so we never nag
 *   again even if they skipped it. Reset via Settings → "Reset walkthroughs".
 */
interface TourState {
  completed: Partial<Record<TourName, boolean>>
  autoStarted: Partial<Record<TourName, boolean>>
  markCompleted: (tour: TourName) => void
  markAutoStarted: (tour: TourName) => void
  resetAll: () => void
}

export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      completed: {},
      autoStarted: {},
      markCompleted: (tour) =>
        set((s) => ({ completed: { ...s.completed, [tour]: true } })),
      markAutoStarted: (tour) =>
        set((s) => ({ autoStarted: { ...s.autoStarted, [tour]: true } })),
      resetAll: () => set({ completed: {}, autoStarted: {} }),
    }),
    { name: 'jigi-tour-store' }
  )
)
