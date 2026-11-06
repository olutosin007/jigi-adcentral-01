import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ACTIVATION_EVENT_TO_TICK,
  type ActivationTick,
  requiredTicksComplete,
} from '@/lib/activation/checklist'

interface ActivationState {
  /** Per-user tick map (store key is namespaced by user id when set). */
  userId: string | null
  completed: Partial<Record<ActivationTick, boolean>>
  dismissed: boolean
  setUserId: (userId: string | null) => void
  markTick: (tick: ActivationTick) => void
  markFromAnalyticsEvent: (event: string) => void
  dismiss: () => void
  reset: () => void
  isComplete: () => boolean
}

const empty = (): Pick<ActivationState, 'completed' | 'dismissed' | 'userId'> => ({
  userId: null,
  completed: {},
  dismissed: false,
})

export const useActivationStore = create<ActivationState>()(
  persist(
    (set, get) => ({
      ...empty(),
      setUserId: (userId) => {
        const prev = get().userId
        if (prev && userId && prev !== userId) {
          set({ userId, completed: {}, dismissed: false })
          return
        }
        set({ userId })
      },
      markTick: (tick) =>
        set((s) => {
          if (s.completed[tick]) return s
          return { completed: { ...s.completed, [tick]: true } }
        }),
      markFromAnalyticsEvent: (event) => {
        const tick = ACTIVATION_EVENT_TO_TICK[event]
        if (tick) get().markTick(tick)
      },
      dismiss: () => set({ dismissed: true }),
      reset: () => set({ completed: {}, dismissed: false }),
      isComplete: () => requiredTicksComplete(get().completed),
    }),
    { name: 'jigi-activation-checklist' }
  )
)
