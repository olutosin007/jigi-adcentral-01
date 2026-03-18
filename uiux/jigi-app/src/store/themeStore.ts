import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STORAGE_KEY = 'jigi-theme'

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed?.state?.theme === 'dark' || parsed?.state?.theme === 'light')
      return parsed.state.theme
  } catch (_) {}
  return 'dark' // default to dark to match landing; user can change in Settings
}

function applyThemeToDom(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

interface ThemeState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: getInitialTheme(),
      setTheme: (theme) => {
        applyThemeToDom(theme)
        set({ theme })
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({ theme: s.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyThemeToDom(state.theme)
      },
    }
  )
)

// Apply theme on first load before React (avoids flash)
if (typeof document !== 'undefined') {
  applyThemeToDom(getInitialTheme())
}
