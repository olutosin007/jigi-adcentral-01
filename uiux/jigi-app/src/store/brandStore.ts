import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface BrandIdentity {
  logo_url?: string
  colours?: {
    primary?: string
    secondary?: string
    accent?: string
    neutral?: string
  }
  fonts?: {
    heading?: string
    body?: string
  }
  /**
   * Free-text art-direction guidance (photography/illustration mood, lighting,
   * composition). Drives on-brand image generation; do NOT hardcode a generic
   * aesthetic when this is set.
   */
  visual_style?: string
}

export interface BrandVoice {
  tone?: string[]
  preferred_words?: string[]
  avoided_words?: string[]
  samples?: string[]
}

export interface BrandStrategy {
  positioning?: string
  differentiators?: string[]
  competitors?: string[]
}

export interface BrandGovernance {
  approval_workflow?: string[]
  backup_approvers?: string[]
}

export interface Brand {
  id: string
  organisation_id: string
  name: string
  identity: BrandIdentity
  voice: BrandVoice
  strategy: BrandStrategy
  governance: BrandGovernance
  onboarding_completed: boolean
  onboarding_step: number
  journey_mode: 'brand_first' | 'idea_first'
  brand_profile_status: 'starter' | 'partial' | 'complete'
  /** active | archived. Default active. Filters fetchBrands. */
  status?: 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface AgencyBrandAccess {
  id: string
  agency_organisation_id: string
  brand_id: string
  permissions: {
    can_generate: boolean
    can_view_approved: boolean
  }
  status: 'pending' | 'active' | 'revoked'
  invited_email?: string
  granted_at?: string
  granted_by?: string
  created_at: string
}

interface BrandState {
  brands: Brand[]
  currentBrand: Brand | null
  agencyAccess: AgencyBrandAccess[]
  isLoading: boolean
  error: string | null

  fetchBrands: (options?: { includeArchived?: boolean }) => Promise<void>
  fetchBrand: (id: string) => Promise<Brand | null>
  createBrand: (data: Partial<Brand>) => Promise<{ success: boolean; brand?: Brand; error?: string }>
  updateBrand: (
    id: string,
    data: Partial<Brand>,
    options?: { quiet?: boolean }
  ) => Promise<{ success: boolean; error?: string }>
  deleteBrand: (id: string) => Promise<{ success: boolean; error?: string }>
  archiveBrand: (id: string) => Promise<{ success: boolean; error?: string }>
  unarchiveBrand: (id: string) => Promise<{ success: boolean; error?: string }>
  setCurrentBrand: (brand: Brand | null) => void
  
  updateOnboardingStep: (brandId: string, step: number, data?: Partial<Brand>) => Promise<{ success: boolean; error?: string }>
  completeOnboarding: (brandId: string) => Promise<{ success: boolean; error?: string }>
  
  fetchAgencyAccess: (brandId: string) => Promise<void>
  inviteAgency: (brandId: string, email: string) => Promise<{ success: boolean; error?: string }>
  updateAgencyAccess: (accessId: string, status: 'active' | 'revoked') => Promise<{ success: boolean; error?: string }>
  
  clearError: () => void
}

export const useBrandStore = create<BrandState>((set, get) => ({
  brands: [],
  currentBrand: null,
  agencyAccess: [],
  isLoading: false,
  error: null,

  fetchBrands: async (options?: { includeArchived?: boolean }) => {
    set({ isLoading: true, error: null })

    try {
      let query = supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false })

      if (!options?.includeArchived) {
        query = query.eq('status', 'active')
      }

      const { data, error } = await query

      if (error) throw error

      set({ brands: (data as Brand[]) ?? [], isLoading: false })
    } catch (error) {
      console.error('Error fetching brands:', error)
      set({ isLoading: false, error: 'Failed to fetch brands' })
    }
  },

  archiveBrand: async (id: string) => {
    return get().updateBrand(id, { status: 'archived' })
  },

  unarchiveBrand: async (id: string) => {
    return get().updateBrand(id, { status: 'active' })
  },

  fetchBrand: async (id) => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      const brand = data as Brand
      set({ currentBrand: brand })
      return brand
    } catch (error) {
      console.error('Error fetching brand:', error)
      return null
    }
  },

  createBrand: async (data) => {
    set({ isLoading: true, error: null })
    
    try {
      const { data: brand, error } = await supabase
        .from('brands')
        .insert({
          name: data.name,
          organisation_id: data.organisation_id,
          identity: data.identity || {},
          voice: data.voice || {},
          strategy: data.strategy || {},
          governance: data.governance || {},
          journey_mode: data.journey_mode || 'brand_first',
          brand_profile_status: data.brand_profile_status || 'starter',
        })
        .select()
        .single()

      if (error) throw error

      const newBrand = brand as Brand
      set((state) => ({
        brands: [newBrand, ...state.brands],
        currentBrand: newBrand,
        isLoading: false,
      }))

      return { success: true, brand: newBrand }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create brand'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  updateBrand: async (id, data, options) => {
    const quiet = options?.quiet ?? false
    if (!quiet) set({ isLoading: true, error: null })

    try {
      const { data: brand, error } = await supabase
        .from('brands')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updatedBrand = brand as Brand
      set((state) => ({
        brands: state.brands.map((b) => (b.id === id ? updatedBrand : b)),
        currentBrand: state.currentBrand?.id === id ? updatedBrand : state.currentBrand,
        ...(quiet ? {} : { isLoading: false }),
      }))

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update brand'
      if (!quiet) set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  deleteBrand: async (id) => {
    set({ isLoading: true, error: null })
    
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        brands: state.brands.filter((b) => b.id !== id),
        currentBrand: state.currentBrand?.id === id ? null : state.currentBrand,
        isLoading: false,
      }))

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete brand'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  setCurrentBrand: (brand) => {
    set({ currentBrand: brand })
  },

  updateOnboardingStep: async (brandId, step, data = {}) => {
    const updateData: Partial<Brand> = {
      onboarding_step: step,
      ...data,
    }

    if (step > 0) {
      updateData.brand_profile_status = 'partial'
    }

    return get().updateBrand(brandId, updateData)
  },

  completeOnboarding: async (brandId) => {
    return get().updateBrand(brandId, {
      onboarding_completed: true,
      brand_profile_status: 'complete',
    })
  },

  fetchAgencyAccess: async (brandId) => {
    try {
      const { data, error } = await supabase
        .from('agency_brand_access')
        .select('*')
        .eq('brand_id', brandId)

      if (error) throw error

      set({ agencyAccess: data as AgencyBrandAccess[] })
    } catch (error) {
      console.error('Error fetching agency access:', error)
    }
  },

  inviteAgency: async (brandId, email) => {
    try {
      const { data, error } = await supabase
        .from('agency_brand_access')
        .insert({
          brand_id: brandId,
          invited_email: email,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        agencyAccess: [...state.agencyAccess, data as AgencyBrandAccess],
      }))

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invite agency'
      return { success: false, error: message }
    }
  },

  updateAgencyAccess: async (accessId, status) => {
    try {
      const updateData: Partial<AgencyBrandAccess> = { status }
      if (status === 'active') {
        updateData.granted_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('agency_brand_access')
        .update(updateData)
        .eq('id', accessId)

      if (error) throw error

      set((state) => ({
        agencyAccess: state.agencyAccess.map((a) =>
          a.id === accessId ? { ...a, ...updateData } : a
        ),
      }))

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update access'
      return { success: false, error: message }
    }
  },

  clearError: () => set({ error: null }),
}))
