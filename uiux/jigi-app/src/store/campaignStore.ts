import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { CampaignContextObject } from '@/lib/cco'
import { compileBriefToCCO } from '@/lib/brief-compiler'

/** Reference asset uploaded to brief (mood boards, competitor examples, etc.) */
export interface BriefReferenceAsset {
  file_url: string
  filename?: string
}

export interface CampaignBrief {
  objective?: string
  audience?: string
  channels?: string[]
  requirements?: string
  /** The single message this campaign must communicate. Required for CCO. */
  key_message?: string
  /** Tone modifiers (e.g. playful, bold). Overrides BIO for this campaign. */
  tone_override?: string[]
  /** Uploaded mood boards, competitor examples, previous campaign assets. */
  reference_assets?: BriefReferenceAsset[]
  /** Things to avoid: competitor names, visual clichés, banned phrases. */
  exclusions?: string
}

export interface Campaign {
  id: string
  brand_id: string | null
  created_by: string
  name: string
  brief: CampaignBrief
  journey_mode: 'brand_first' | 'idea_first'
  generation_mode?: 'brand_grounded' | 'idea_first'
  seed_idea?: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
  asset_count?: number
  pending_review_count?: number
  /** Compiled Campaign Context Object (CCO) from brief. Set by Brief Compiler on save. */
  campaign_context?: CampaignContextObject | null
  /** CCO version; increments on every brief edit. Used for drift detection. */
  cco_version?: number
  /** Production concept selection for pipeline (P1 Sprint 2). */
  selected_concept_asset_id?: string | null
  /** Production copy selection for key art (P1 Sprint 2). */
  selected_copy_asset_id?: string | null
  /** When selection columns were last updated. */
  selection_updated_at?: string | null
}

export interface CreativeAsset {
  id: string
  campaign_id: string
  created_by: string
  type: 'concept' | 'copy' | 'image'
  generation_mode: 'brand_grounded' | 'idea_first'
  content: ConceptContent | CopyContent | ImageContent
  version: number
  parent_asset_id?: string
  status: 'draft' | 'agency_review' | 'submitted' | 'brand_review' | 'changes_requested' | 'approved' | 'rejected'
  compliance_check: ComplianceCheck
  submission_note?: string
  review_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  source?: 'ai' | 'uploaded'
  original_filename?: string
  /** CCO version active when this asset was generated. For drift detection. */
  cco_version?: number | null
  /** BIO version active when this asset was generated. */
  bio_version?: number | null
  /** When this asset was generated. */
  generation_timestamp?: string | null
  /** Snapshot of compliance scores at generation time. */
  validation_scores?: Record<string, unknown> | null
  /** PRD 10: Drift status when brief changed after asset generation. */
  drift_status?: 'none' | 'review_required' | null
}

export interface ConceptContent {
  theme: string
  headlines: string[]
  visual_direction: string
  rationale: string
  file_url?: string
  /** PRD 06: Concept enforcement fields */
  concept_name?: string
  strategic_insight?: string
  creative_territory?: string
  headline_direction?: string
  format_suitability?: string[]
  key_message_link?: string
  brand_alignment_score?: number
  brand_alignment_rationale?: string
  validation_warnings?: string[]
}

export interface CopyContent {
  headline: string
  body: string
  cta: string
  file_url?: string
}

export interface ImageContent {
  url: string
  prompt_used?: string
  model?: string
}

export interface ComplianceCheck {
  passed?: boolean
  checks?: Array<{
    name: string
    status: 'pass' | 'fail' | 'warning'
    message: string
  }>
}

function isMissingGenerationModeColumn(error: unknown): boolean {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : ''

  return message.includes('generation_mode') && message.includes('campaigns')
}

interface CampaignState {
  campaigns: Campaign[]
  currentCampaign: Campaign | null
  assets: CreativeAsset[]
  isLoading: boolean
  error: string | null

  fetchCampaigns: (brandId?: string) => Promise<void>
  fetchCampaign: (id: string) => Promise<Campaign | null>
  createCampaign: (data: Partial<Campaign>) => Promise<{ success: boolean; campaign?: Campaign; error?: string }>
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<{ success: boolean; error?: string }>
  deleteCampaign: (id: string) => Promise<{ success: boolean; error?: string }>
  setCurrentCampaign: (campaign: Campaign | null) => void

  fetchAssets: (campaignId: string) => Promise<void>
  createAsset: (data: Partial<CreativeAsset>) => Promise<{ success: boolean; asset?: CreativeAsset; error?: string }>
  updateAssetStatus: (assetId: string, status: CreativeAsset['status']) => Promise<{ success: boolean; error?: string }>

  clearError: () => void
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  currentCampaign: null,
  assets: [],
  isLoading: false,
  error: null,

  fetchCampaigns: async (brandId) => {
    set({ isLoading: true, error: null })

    try {
      let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false })

      if (brandId) {
        query = query.eq('brand_id', brandId)
      }

      const { data, error } = await query

      if (error) throw error

      set({ campaigns: data as Campaign[], isLoading: false })
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      set({ isLoading: false, error: 'Failed to fetch campaigns' })
    }
  },

  fetchCampaign: async (id) => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      const campaign = data as Campaign
      set({ currentCampaign: campaign })
      
      await get().fetchAssets(id)
      
      return campaign
    } catch (error) {
      console.error('Error fetching campaign:', error)
      return null
    }
  },

  createCampaign: async (data) => {
    set({ isLoading: true, error: null })

    try {
      const insertPayload = {
        name: data.name,
        brand_id: data.brand_id,
        created_by: data.created_by,
        brief: data.brief || {},
        journey_mode: data.journey_mode || 'brand_first',
        generation_mode:
          data.generation_mode ||
          (data.journey_mode === 'idea_first' ? 'idea_first' : 'brand_grounded'),
        seed_idea: data.seed_idea,
        status: 'draft',
      }

      let campaign: unknown = null
      let error: unknown = null

      const withGenerationMode = await supabase
        .from('campaigns')
        .insert(insertPayload)
        .select()
        .single()

      campaign = withGenerationMode.data
      error = withGenerationMode.error

      if (error && isMissingGenerationModeColumn(error)) {
        // Backward compatibility before DB migration is applied.
        const legacyPayload = { ...insertPayload } as Partial<typeof insertPayload>
        delete legacyPayload.generation_mode
        const legacyInsert = await supabase
          .from('campaigns')
          .insert(legacyPayload)
          .select()
          .single()

        campaign = legacyInsert.data
        error = legacyInsert.error
      }

      if (error) throw error

      const newCampaign = campaign as Campaign

      // Compile brief to CCO when campaign is created with brief
      if (insertPayload.brief && newCampaign.brand_id && Object.keys(insertPayload.brief).length > 0) {
        compileBriefToCCO({
          campaignId: newCampaign.id,
          brandId: newCampaign.brand_id,
          brief: insertPayload.brief as CampaignBrief,
        }).catch((err) => console.warn('Brief compiler failed:', err))
      }

      set((state) => ({
        campaigns: [newCampaign, ...state.campaigns],
        currentCampaign: newCampaign,
        isLoading: false,
      }))

      return { success: true, campaign: newCampaign }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create campaign'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  updateCampaign: async (id, data) => {
    set({ isLoading: true, error: null })

    try {
      const updatePayload: Partial<Campaign> = { ...data }
      delete updatePayload.selected_concept_asset_id
      delete updatePayload.selected_copy_asset_id
      delete updatePayload.selection_updated_at
      if (data.journey_mode && !data.generation_mode) {
        updatePayload.generation_mode =
          data.journey_mode === 'idea_first' ? 'idea_first' : 'brand_grounded'
      }

      let { data: campaign, error } = await supabase
        .from('campaigns')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .maybeSingle()

      if (error && isMissingGenerationModeColumn(error)) {
        const legacyUpdatePayload = { ...updatePayload }
        delete legacyUpdatePayload.generation_mode
        const legacyUpdate = await supabase
          .from('campaigns')
          .update(legacyUpdatePayload)
          .eq('id', id)
          .select()
          .maybeSingle()

        campaign = legacyUpdate.data
        error = legacyUpdate.error
      }

      if (error) throw error
      if (!campaign) {
        throw new Error('Campaign not found or you do not have permission to update it')
      }

      const updatedCampaign = campaign as Campaign

      // Compile brief to CCO when brief is updated
      if (data.brief && updatedCampaign.brand_id) {
        compileBriefToCCO({
          campaignId: id,
          brandId: updatedCampaign.brand_id,
          brief: data.brief,
        }).catch((err) => console.warn('Brief compiler failed:', err))
      }

      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === id ? updatedCampaign : c)),
        currentCampaign: state.currentCampaign?.id === id ? updatedCampaign : state.currentCampaign,
        isLoading: false,
      }))

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update campaign'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  deleteCampaign: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== id),
        currentCampaign: state.currentCampaign?.id === id ? null : state.currentCampaign,
        isLoading: false,
      }))

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete campaign'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  setCurrentCampaign: (campaign) => {
    set({ currentCampaign: campaign })
  },

  fetchAssets: async (campaignId) => {
    try {
      const { data, error } = await supabase
        .from('creative_assets')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ assets: data as CreativeAsset[] })
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  },

  createAsset: async (data) => {
    try {
      const insertPayload: Record<string, unknown> = {
        campaign_id: data.campaign_id,
        created_by: data.created_by,
        type: data.type,
        generation_mode: data.generation_mode,
        content: data.content,
        status: 'draft',
      }
      if (data.cco_version != null) insertPayload.cco_version = data.cco_version
      if (data.bio_version != null) insertPayload.bio_version = data.bio_version
      if (data.generation_timestamp != null)
        insertPayload.generation_timestamp = data.generation_timestamp
      if (data.validation_scores != null)
        insertPayload.validation_scores = data.validation_scores

      const { data: asset, error } = await supabase
        .from('creative_assets')
        .insert(insertPayload)
        .select()
        .single()

      if (error) throw error

      const newAsset = asset as CreativeAsset
      set((state) => ({
        assets: [newAsset, ...state.assets],
      }))

      return { success: true, asset: newAsset }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create asset'
      return { success: false, error: message }
    }
  },

  updateAssetStatus: async (assetId, status) => {
    try {
      const { error } = await supabase
        .from('creative_assets')
        .update({ status })
        .eq('id', assetId)

      if (error) throw error

      set((state) => ({
        assets: state.assets.map((a) => (a.id === assetId ? { ...a, status } : a)),
      }))

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update asset status'
      return { success: false, error: message }
    }
  },

  clearError: () => set({ error: null }),
}))

/** Brand-approved tone palette for campaign tone_override. From BIO or config. */
export const TONE_OPTIONS = [
  { value: 'playful', label: 'Playful' },
  { value: 'bold', label: 'Bold' },
  { value: 'professional', label: 'Professional' },
  { value: 'warm', label: 'Warm' },
  { value: 'confident', label: 'Confident' },
  { value: 'aspirational', label: 'Aspirational' },
  { value: 'accessible', label: 'Accessible' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'luxury', label: 'Luxury' },
] as const

export const CHANNEL_OPTIONS = [
  { value: 'instagram_post', label: 'Instagram Post', category: 'social' },
  { value: 'instagram_story', label: 'Instagram Story', category: 'social' },
  { value: 'instagram_reel', label: 'Instagram Reel', category: 'social' },
  { value: 'facebook_post', label: 'Facebook Post', category: 'social' },
  { value: 'facebook_ad', label: 'Facebook Ad', category: 'social' },
  { value: 'twitter_post', label: 'Twitter/X Post', category: 'social' },
  { value: 'linkedin_post', label: 'LinkedIn Post', category: 'social' },
  { value: 'display_ad', label: 'Display Ad', category: 'display' },
  { value: 'website_banner', label: 'Website Banner', category: 'display' },
  { value: 'email_header', label: 'Email Header', category: 'email' },
  { value: 'other', label: 'Other', category: 'other' },
] as const

export const CHANNEL_CATEGORIES = [
  { id: 'social', label: 'Social' },
  { id: 'display', label: 'Display & Web' },
  { id: 'email', label: 'Email' },
  { id: 'other', label: 'Other' },
] as const

export const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-muted text-muted-foreground' },
  { value: 'active', label: 'Active', color: 'bg-success/10 text-success' },
  { value: 'completed', label: 'Completed', color: 'bg-primary/10 text-primary' },
  { value: 'archived', label: 'Archived', color: 'bg-warning/10 text-warning' },
] as const

export const ASSET_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-muted text-muted-foreground' },
  { value: 'agency_review', label: 'Agency Review', color: 'bg-primary/10 text-primary' },
  { value: 'submitted', label: 'Submitted', color: 'bg-primary/10 text-primary' },
  { value: 'brand_review', label: 'Brand Review', color: 'bg-warning/10 text-warning' },
  { value: 'changes_requested', label: 'Changes Requested', color: 'bg-warning/10 text-warning' },
  { value: 'approved', label: 'Approved', color: 'bg-success/10 text-success' },
  { value: 'rejected', label: 'Rejected', color: 'bg-destructive/10 text-destructive' },
] as const
