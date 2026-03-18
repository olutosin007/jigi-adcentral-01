import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type JourneyMode = 'brand_first' | 'idea_first'
export type BrandProfileStatus = 'starter' | 'partial' | 'complete'

interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  journeyMode?: JourneyMode
}

interface Organisation {
  id: string
  name: string
  type: 'brand' | 'agency'
}

interface AppState {
  user: User | null
  organisation: Organisation | null
  journeyMode: JourneyMode | null
  sidebarCollapsed: boolean
  
  setUser: (user: User | null) => void
  setOrganisation: (org: Organisation | null) => void
  setJourneyMode: (mode: JourneyMode | null) => void
  toggleSidebar: () => void
  reset: () => void
}

const initialState = {
  user: null,
  organisation: null,
  journeyMode: null,
  sidebarCollapsed: false,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUser: (user) => set({ user }),
      setOrganisation: (organisation) => set({ organisation }),
      setJourneyMode: (journeyMode) => set({ journeyMode }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      reset: () => set(initialState),
    }),
    {
      name: 'jigi-app-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
