import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'approver' | 'reviewer' | 'creator'
  organisation_id: string | null
  journey_mode: 'brand_first' | 'idea_first' | null
  avatar_url: string | null
}

interface AuthState {
  user: SupabaseUser | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  initialize: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      isLoading: true,
      isInitialized: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true })

          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Error getting session:', error)
            set({ isLoading: false, isInitialized: true })
            return
          }

          if (session) {
            set({ session, user: session.user, isLoading: false, isInitialized: true })
            get().fetchProfile().catch((err) => console.error('Background profile fetch:', err))
          } else {
            set({ isLoading: false, isInitialized: true })
          }

          supabase.auth.onAuthStateChange(async (event, session) => {
            set({ session, user: session?.user ?? null })
            
            if (event === 'SIGNED_IN' && session) {
              await get().fetchProfile()
            } else if (event === 'SIGNED_OUT') {
              set({ profile: null })
            }
          })
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ isLoading: false, isInitialized: true })
        }
      },

      signUp: async (email, password, name) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
            },
          })

          if (error) {
            set({ isLoading: false, error: error.message })
            return { success: false, error: error.message }
          }

          if (data.user) {
            set({ user: data.user, session: data.session })
          }

          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign up failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            set({ isLoading: false, error: error.message })
            return { success: false, error: error.message }
          }

          set({ user: data.user, session: data.session })
          await get().fetchProfile()
          
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Sign in failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      signOut: async () => {
        set({ isLoading: true })
        
        try {
          await supabase.auth.signOut()
          set({ user: null, profile: null, session: null, isLoading: false })
        } catch (error) {
          console.error('Sign out error:', error)
          set({ isLoading: false })
        }
      },

      resetPassword: async (email) => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password-confirm`,
          })

          if (error) {
            set({ isLoading: false, error: error.message })
            return { success: false, error: error.message }
          }

          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Password reset failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      updatePassword: async (password) => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase.auth.updateUser({ password })

          if (error) {
            set({ isLoading: false, error: error.message })
            return { success: false, error: error.message }
          }

          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Password update failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      fetchProfile: async () => {
        const { user } = get()
        if (!user) return

        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('Error fetching profile:', error)
            return
          }

          set({ profile: data as UserProfile })
        } catch (error) {
          console.error('Error fetching profile:', error)
        }
      },

      updateProfile: async (updates) => {
        const { user } = get()
        if (!user) return { success: false, error: 'Not authenticated' }

        try {
          const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .maybeSingle()

          if (error) {
            return { success: false, error: error.message }
          }

          if (!data) {
            return { success: false, error: 'Profile not found or you do not have permission to update it' }
          }

          set({ profile: data as UserProfile })
          return { success: true }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Profile update failed'
          return { success: false, error: message }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'jigi-auth-store',
      partialize: () => ({}),
    }
  )
)
