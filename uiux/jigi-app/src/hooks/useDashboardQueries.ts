import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CreativeAsset } from '@/store/campaignStore'

export interface DashboardStats {
  pendingReview: number
  activeCampaigns: number
  approvedThisWeek: number
  totalAssets: number
}

export interface GenerationMixStats {
  brandGrounded: number
  ideaFirst: number
  total: number
}

export interface PendingReviewItem {
  campaignId: string
  campaignName: string
  brandName?: string
  assetCount: number
  oldestPendingAt: string
  assets: CreativeAsset[]
}

export interface RecentCampaignItem {
  id: string
  name: string
  brandName?: string
  totalAssets: number
  approvedAssets: number
  pendingAssets: number
  updatedAt: string
  generationMode?: 'brand_grounded' | 'idea_first'
}

interface RecentCampaignRow {
  id: string
  name: string
  updated_at: string
  generation_mode?: 'brand_grounded' | 'idea_first'
  journey_mode?: 'brand_first' | 'idea_first'
  brands?: { id: string; name: string } | { id: string; name: string }[] | null
  creative_assets?: { id: string; status: string }[] | null
}

async function fetchDashboardStats(_userId: string): Promise<DashboardStats> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [pendingResult, campaignsResult, approvedResult, totalResult] = await Promise.all([
    supabase
      .from('creative_assets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'brand_review']),

    supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),

    supabase
      .from('creative_assets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('updated_at', weekAgo),

    supabase
      .from('creative_assets')
      .select('id', { count: 'exact', head: true }),
  ])

  return {
    pendingReview: pendingResult.count || 0,
    activeCampaigns: campaignsResult.count || 0,
    approvedThisWeek: approvedResult.count || 0,
    totalAssets: totalResult.count || 0,
  }
}

export function useDashboardStats(userId: string) {
  return useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: () => fetchDashboardStats(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}

async function fetchGenerationMixStats(): Promise<GenerationMixStats> {
  const [brandGroundedResult, ideaFirstResult] = await Promise.all([
    supabase
      .from('creative_assets')
      .select('id', { count: 'exact', head: true })
      .eq('generation_mode', 'brand_grounded'),

    supabase
      .from('creative_assets')
      .select('id', { count: 'exact', head: true })
      .eq('generation_mode', 'idea_first'),
  ])

  const brandGrounded = brandGroundedResult.count || 0
  const ideaFirst = ideaFirstResult.count || 0

  return {
    brandGrounded,
    ideaFirst,
    total: brandGrounded + ideaFirst,
  }
}

export function useGenerationMixStats() {
  return useQuery({
    queryKey: ['generation-mix-stats'],
    queryFn: fetchGenerationMixStats,
    staleTime: 60 * 1000,
  })
}

async function fetchPendingReviews(): Promise<PendingReviewItem[]> {
  const { data, error } = await supabase
    .from('creative_assets')
    .select(`
      *,
      campaigns!inner(id, name, brand_id, brands(id, name))
    `)
    .in('status', ['submitted', 'brand_review'])
    .order('updated_at', { ascending: true })

  if (error) throw error

  const grouped: Record<string, PendingReviewItem> = {}

  for (const asset of data || []) {
    const campaign = asset.campaigns as { id: string; name: string; brand_id?: string; brands?: { id: string; name: string } }
    const campaignId = campaign.id

    if (!grouped[campaignId]) {
      grouped[campaignId] = {
        campaignId,
        campaignName: campaign.name,
        brandName: campaign.brands?.name,
        assetCount: 0,
        oldestPendingAt: asset.updated_at ?? asset.created_at,
        assets: [],
      }
    }

    grouped[campaignId].assetCount++
    grouped[campaignId].assets.push(asset as unknown as CreativeAsset)

    if (new Date(asset.updated_at ?? asset.created_at) < new Date(grouped[campaignId].oldestPendingAt)) {
      grouped[campaignId].oldestPendingAt = asset.updated_at ?? asset.created_at
    }
  }

  return Object.values(grouped).sort(
    (a, b) => new Date(a.oldestPendingAt).getTime() - new Date(b.oldestPendingAt).getTime()
  )
}

export function usePendingReviews() {
  return useQuery({
    queryKey: ['pending-reviews'],
    queryFn: fetchPendingReviews,
    refetchInterval: 60 * 1000,
  })
}

async function fetchRecentCampaigns(limit: number = 5): Promise<RecentCampaignItem[]> {
  let data: RecentCampaignRow[] = []

  // Primary query: canonical campaign generation_mode.
  const primary = await supabase
    .from('campaigns')
    .select(`
      id,
      name,
      updated_at,
      generation_mode,
      brands(id, name),
      creative_assets(id, status)
    `)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (primary.error) {
    // Backward compatibility while migration is being rolled out.
    const fallback = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        updated_at,
        journey_mode,
        brands(id, name),
        creative_assets(id, status)
      `)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (fallback.error) throw fallback.error
    data = ((fallback.data || []) as RecentCampaignRow[]).map((campaign) => ({
      ...campaign,
      generation_mode: campaign.journey_mode === 'idea_first' ? 'idea_first' : 'brand_grounded',
    }))
  } else {
    data = (primary.data || []) as RecentCampaignRow[]
  }

  return data.map((campaign) => {
    const assets = campaign.creative_assets || []
    const brandsData = campaign.brands
    const brand = Array.isArray(brandsData) 
      ? (brandsData[0] as { id: string; name: string } | undefined) 
      : (brandsData as { id: string; name: string } | null)

    return {
      id: campaign.id,
      name: campaign.name,
      brandName: brand?.name,
      totalAssets: assets.length,
      approvedAssets: assets.filter((a) => a.status === 'approved').length,
      pendingAssets: assets.filter((a) => ['submitted', 'brand_review'].includes(a.status)).length,
      updatedAt: campaign.updated_at,
      generationMode: campaign.generation_mode as 'brand_grounded' | 'idea_first' | undefined,
    }
  })
}

export function useRecentCampaigns(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-campaigns', limit],
    queryFn: () => fetchRecentCampaigns(limit),
    staleTime: 30 * 1000,
  })
}

async function fetchApprovedAssets(): Promise<{ campaignId: string; campaignName: string; assets: CreativeAsset[] }[]> {
  const { data, error } = await supabase
    .from('creative_assets')
    .select(`
      *,
      campaigns!inner(id, name)
    `)
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })

  if (error) throw error

  const grouped: Record<string, { campaignId: string; campaignName: string; assets: CreativeAsset[] }> = {}

  for (const asset of data || []) {
    const campaignData = asset.campaigns
    const campaign = Array.isArray(campaignData) ? campaignData[0] : campaignData
    if (!campaign) continue
    
    const campaignId = (campaign as { id: string; name: string }).id
    const campaignName = (campaign as { id: string; name: string }).name

    if (!grouped[campaignId]) {
      grouped[campaignId] = {
        campaignId,
        campaignName,
        assets: [],
      }
    }

    grouped[campaignId].assets.push(asset as unknown as CreativeAsset)
  }

  return Object.values(grouped)
}

export function useApprovedAssets() {
  return useQuery({
    queryKey: ['approved-assets'],
    queryFn: fetchApprovedAssets,
    staleTime: 30 * 1000,
  })
}
