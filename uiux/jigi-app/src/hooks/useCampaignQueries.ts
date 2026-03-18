import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uploadFileToStorage, isAllowedMimeType, validateFileSize } from '@/lib/upload'
import { aiOrchestrator, type BrandConstraints, type BrandIncludeFlags, type CampaignBrief, type FallbackContext, type ConceptResult, type CopyResult, type ImageResult, type ComplianceResult } from '@/lib/ai'
import type { Campaign, CreativeAsset } from '@/store/campaignStore'
import type { Brand } from '@/store/brandStore'

interface AssetFilters {
  type?: 'concept' | 'copy' | 'image'
  status?: string
}

async function fetchCampaign(campaignId: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (error) throw error
  return data as Campaign
}

async function fetchCampaignAssets(campaignId: string, filters?: AssetFilters): Promise<CreativeAsset[]> {
  let query = supabase
    .from('creative_assets')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) throw error
  return data as CreativeAsset[]
}

async function fetchBrand(brandId: string): Promise<Brand | null> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', brandId)
    .single()

  if (error) return null
  return data as Brand
}

export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => fetchCampaign(campaignId),
    enabled: !!campaignId,
  })
}

export function useCampaignAssets(campaignId: string, filters?: AssetFilters) {
  return useQuery({
    queryKey: ['campaign-assets', campaignId, filters],
    queryFn: () => fetchCampaignAssets(campaignId, filters),
    enabled: !!campaignId,
  })
}

export function useBrand(brandId: string | undefined) {
  return useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => fetchBrand(brandId!),
    enabled: !!brandId,
  })
}

interface GenerateConceptsParams {
  campaignId: string
  brandId?: string
  brief: CampaignBrief
  seedIdea?: string
  userId?: string
}

interface GenerateCopyParams {
  campaignId: string
  brandId?: string
  brief: CampaignBrief
  seedIdea?: string
  format?: string
  conceptAssetId?: string
  conceptContext?: Pick<ConceptResult, 'theme' | 'headlines' | 'visual_direction'>
  userId?: string
}

async function generateAndSaveConcepts(params: GenerateConceptsParams) {
  const { campaignId, brandId, brief, seedIdea, userId } = params

  let brandConstraints: BrandConstraints | undefined
  if (brandId) {
    const brand = await fetchBrand(brandId)
    if (brand) {
      brandConstraints = {
        name: brand.name,
        identity: {
          colours: brand.identity?.colours
            ? Object.entries(brand.identity.colours).map(([role, hex]) => ({ role, hex: hex as string }))
            : [],
          fonts: {
            heading: brand.identity?.fonts?.heading || 'Inter',
            body: brand.identity?.fonts?.body || 'Inter',
          },
          logo_url: brand.identity?.logo_url,
        },
        voice: {
          tone: brand.voice?.tone || [],
          preferred_words: brand.voice?.preferred_words || [],
          avoided_words: brand.voice?.avoided_words || [],
          samples: brand.voice?.samples,
        },
        strategy: brand.strategy,
      }
    }
  }

  const fallbackContext: FallbackContext | undefined = !brandConstraints && seedIdea
    ? {
        seed_idea: seedIdea,
        audience: brief.audience,
        style_hints: brief.requirements ? [brief.requirements] : [],
      }
    : undefined

  const result = await aiOrchestrator.generateConcepts(
    brandConstraints,
    brief,
    fallbackContext,
    userId,
    brandId,
    campaignId
  )

  const concepts = result.data as ConceptResult[]

  const lineage = result.metadata?.lineage
  const promptHash = result.metadata?.prompt_hash

  const savedAssets = await Promise.all(
    concepts.map(async (concept) => {
      const insertPayload: Record<string, unknown> = {
        campaign_id: campaignId,
        created_by: userId,
        type: 'concept',
        generation_mode: brandConstraints ? 'brand_grounded' : 'idea_first',
        content: concept,
        status: 'draft',
      }
      if (lineage?.cco_version != null) insertPayload.cco_version = lineage.cco_version
      if (lineage?.bio_version != null) insertPayload.bio_version = lineage.bio_version
      if (lineage?.generation_timestamp != null)
        insertPayload.generation_timestamp = lineage.generation_timestamp
      if (promptHash != null)
        insertPayload.validation_scores = { prompt_hash: promptHash }

      const { data, error } = await supabase
        .from('creative_assets')
        .insert(insertPayload)
        .select()
        .single()

      if (error) throw error
      return data as CreativeAsset
    })
  )

  return {
    concepts,
    assets: savedAssets,
    metadata: result.metadata,
  }
}

async function generateAndSaveCopy(params: GenerateCopyParams) {
  const { campaignId, brandId, brief, seedIdea, format, conceptAssetId, conceptContext, userId } = params

  let brandConstraints: BrandConstraints | undefined
  if (brandId) {
    const brand = await fetchBrand(brandId)
    if (brand) {
      brandConstraints = {
        name: brand.name,
        identity: {
          colours: brand.identity?.colours
            ? Object.entries(brand.identity.colours).map(([role, hex]) => ({ role, hex: hex as string }))
            : [],
          fonts: {
            heading: brand.identity?.fonts?.heading || 'Inter',
            body: brand.identity?.fonts?.body || 'Inter',
          },
        },
        voice: {
          tone: brand.voice?.tone || [],
          preferred_words: brand.voice?.preferred_words || [],
          avoided_words: brand.voice?.avoided_words || [],
          samples: brand.voice?.samples,
        },
      }
    }
  }

  const fallbackContext: FallbackContext | undefined = !brandConstraints && seedIdea
    ? {
        seed_idea: seedIdea,
        audience: brief.audience,
      }
    : undefined

  // This path uses the text generation route (GPT) and never the image provider.
  const result = await aiOrchestrator.generateCopy(
    brandConstraints,
    brief,
    format,
    fallbackContext,
    userId,
    brandId,
    campaignId,
    conceptContext
  )

  const variants = result.data as CopyResult[]

  const lineage = result.metadata?.lineage
  const promptHash = result.metadata?.prompt_hash

  const savedAssets = await Promise.all(
    variants.map(async (variant) => {
      const insertPayload: Record<string, unknown> = {
        campaign_id: campaignId,
        created_by: userId,
        type: 'copy',
        generation_mode: brandConstraints ? 'brand_grounded' : 'idea_first',
        parent_asset_id: conceptAssetId,
        content: variant,
        status: 'draft',
      }
      if (lineage?.cco_version != null) insertPayload.cco_version = lineage.cco_version
      if (lineage?.bio_version != null) insertPayload.bio_version = lineage.bio_version
      if (lineage?.generation_timestamp != null)
        insertPayload.generation_timestamp = lineage.generation_timestamp
      if (promptHash != null)
        insertPayload.validation_scores = { prompt_hash: promptHash }

      const { data, error } = await supabase
        .from('creative_assets')
        .insert(insertPayload)
        .select()
        .single()

      if (error) throw error
      return data as CreativeAsset
    })
  )

  return {
    variants,
    assets: savedAssets,
    metadata: result.metadata,
  }
}

export function useGenerateConcepts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateAndSaveConcepts,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-assets', variables.campaignId],
      })
    },
  })
}

export function useGenerateCopy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateAndSaveCopy,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-assets', variables.campaignId],
      })
    },
  })
}

export function useUpdateAssetStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ assetId, status, campaignId }: { assetId: string; status: string; campaignId: string }) => {
      const { error } = await supabase
        .from('creative_assets')
        .update({ status })
        .eq('id', assetId)

      if (error) throw error
      return { assetId, status, campaignId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-assets', result.campaignId],
      })
    },
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ assetId, campaignId }: { assetId: string; campaignId: string }) => {
      const { error } = await supabase
        .from('creative_assets')
        .delete()
        .eq('id', assetId)
        .eq('status', 'draft')

      if (error) throw error
      return { assetId, campaignId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-assets', result.campaignId],
      })
    },
  })
}

interface UploadAssetParams {
  campaignId: string
  type: 'concept' | 'copy' | 'image'
  file: File
  userId: string
}

async function uploadAssetFn(params: UploadAssetParams): Promise<CreativeAsset> {
  const { campaignId, type, file, userId } = params

  validateFileSize(file.size)
  if (!isAllowedMimeType(file.type, type)) {
    throw new Error(`File type ${file.type} is not allowed for ${type} assets`)
  }

  const assetId = crypto.randomUUID()
  const publicUrl = await uploadFileToStorage(campaignId, assetId, file)

  let content: Record<string, unknown>
  if (type === 'image') {
    const baseContent = { url: publicUrl, prompt_used: '', model: '' }
    try {
      const { validateImportedImage } = await import('@/lib/image-enforcement')
      const { normalized } = await validateImportedImage(baseContent, campaignId)
      content = { ...normalized }
    } catch {
      content = baseContent
    }
  } else if (type === 'concept') {
    const baseContent = { theme: 'Uploaded concept', headlines: [], visual_direction: '', rationale: '', file_url: publicUrl }
    try {
      const { validateImportedConcept } = await import('@/lib/concept-enforcement')
      const { normalized } = await validateImportedConcept(baseContent, campaignId)
      content = { ...normalized, file_url: publicUrl }
    } catch {
      content = baseContent
    }
  } else {
    content = { headline: '', body: '', cta: '', file_url: publicUrl }
  }

  const { data, error } = await supabase
    .from('creative_assets')
    .insert({
      id: assetId,
      campaign_id: campaignId,
      created_by: userId,
      type,
      generation_mode: 'brand_grounded',
      source: 'uploaded',
      original_filename: file.name,
      content,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error
  return data as CreativeAsset
}

export function useUploadAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadAssetFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-assets', variables.campaignId],
      })
    },
  })
}

interface CreateUploadedCopyParams {
  campaignId: string
  userId: string
  text: string
}

async function createUploadedCopy(params: CreateUploadedCopyParams): Promise<CreativeAsset> {
  const { campaignId, userId, text } = params

  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Copy text is required')
  }

  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)
  const headline = lines.length > 1 ? lines[0] : ''
  const body = lines.length > 1 ? lines.slice(1).join('\n') : trimmed
  const cta = ''

  const baseContent = { headline, body, cta }
  let content: Record<string, unknown> = baseContent
  try {
    const { validateImportedCopy } = await import('@/lib/copy-enforcement')
    const { normalized } = await validateImportedCopy(baseContent, campaignId)
    content = { ...normalized }
  } catch {
    // Keep base content on validation failure
  }

  const { data, error } = await supabase
    .from('creative_assets')
    .insert({
      campaign_id: campaignId,
      created_by: userId,
      type: 'copy',
      generation_mode: 'brand_grounded',
      source: 'uploaded',
      content,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error
  return data as CreativeAsset
}

export function useCreateUploadedCopy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUploadedCopy,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-assets', variables.campaignId],
      })
    },
  })
}

interface GenerateImageParams {
  campaignId: string
  brandId?: string
  conceptId?: string
  visualDirection: string
  imageTier?: 'draft' | 'refine' | 'final'
  seedIdea?: string
  userId?: string
  brandInclude?: BrandIncludeFlags
  channelId?: string
}

async function generateAndSaveImage(params: GenerateImageParams) {
  const { campaignId, brandId, conceptId, visualDirection, imageTier, seedIdea, userId, brandInclude, channelId } = params

  let brandConstraints: BrandConstraints | undefined
  if (brandId) {
    const brand = await fetchBrand(brandId)
    if (brand) {
      brandConstraints = {
        name: brand.name,
        identity: {
          colours: brand.identity?.colours
            ? Object.entries(brand.identity.colours).map(([role, hex]) => ({ role, hex: hex as string }))
            : [],
          fonts: {
            heading: brand.identity?.fonts?.heading || 'Inter',
            body: brand.identity?.fonts?.body || 'Inter',
          },
          logo_url: brand.identity?.logo_url,
        },
        voice: {
          tone: brand.voice?.tone || [],
          preferred_words: brand.voice?.preferred_words || [],
          avoided_words: brand.voice?.avoided_words || [],
        },
      }
    }
  }

  const fallbackContext: FallbackContext | undefined = !brandConstraints && seedIdea
    ? {
        seed_idea: seedIdea,
        style_hints: ['modern', 'professional', 'advertising'],
      }
    : undefined

  const channel = channelId ?? (await fetchCampaign(campaignId))?.brief?.channels?.[0]
  const result = await aiOrchestrator.generateImage(
    brandConstraints,
    visualDirection,
    fallbackContext,
    userId,
    brandId,
    campaignId,
    imageTier || 'draft',
    conceptId,
    brandInclude,
    channel
  )

  const imageData = (result.data as ImageResult[])[0]
  const asset = (result.metadata as { asset?: { id: string; content?: Record<string, unknown> } })?.asset

  if (asset?.id && imageData) {
    const contentUpdate: Record<string, unknown> = {
      ...(asset.content as Record<string, unknown>),
      ...imageData,
    }
    await supabase
      .from('creative_assets')
      .update({ content: contentUpdate })
      .eq('id', asset.id)
  }

  return {
    image: imageData,
    metadata: result.metadata,
  }
}

export function useGenerateImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateAndSaveImage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-assets', variables.campaignId],
      })
    },
  })
}

interface CheckComplianceParams {
  assetId: string
  campaignId: string
  content: string
  brandId: string
}

async function checkAssetCompliance(params: CheckComplianceParams) {
  const { assetId, campaignId, content, brandId } = params

  const brand = await fetchBrand(brandId)
  if (!brand) {
    return {
      assetId,
      campaignId,
      result: {
        passed: true,
        checks: [
          { name: 'Brand check', status: 'pass' as const, message: 'No brand constraints to check against.' },
        ],
      } as ComplianceResult,
    }
  }

  const brandConstraints: BrandConstraints = {
    name: brand.name,
    identity: {
      colours: brand.identity?.colours
        ? Object.entries(brand.identity.colours).map(([role, hex]) => ({ role, hex: hex as string }))
        : [],
      fonts: {
        heading: brand.identity?.fonts?.heading || 'Inter',
        body: brand.identity?.fonts?.body || 'Inter',
      },
    },
    voice: {
      tone: brand.voice?.tone || [],
      preferred_words: brand.voice?.preferred_words || [],
      avoided_words: brand.voice?.avoided_words || [],
    },
  }

  const result = await aiOrchestrator.checkCompliance(content, brandConstraints)

  await supabase
    .from('creative_assets')
    .update({ compliance_check: result })
    .eq('id', assetId)

  return {
    assetId,
    campaignId,
    result,
  }
}

export function useCheckCompliance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: checkAssetCompliance,
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['campaign-assets', result.campaignId],
      })
    },
  })
}

interface GenerationLogEntry {
  id: string
  type: string
  model: string
  status: 'success' | 'error'
  latency_ms: number
  tokens_used?: number
  generation_mode: string
  created_at: string
}

async function fetchGenerationHistory(campaignId: string): Promise<GenerationLogEntry[]> {
  const { data, error } = await supabase
    .from('generation_log')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data as GenerationLogEntry[]
}

export function useGenerationHistory(campaignId: string) {
  return useQuery({
    queryKey: ['generation-history', campaignId],
    queryFn: () => fetchGenerationHistory(campaignId),
    enabled: !!campaignId,
  })
}

// ============================================
// Submission & Review Hooks
// ============================================

import { type AssetStatus, type ReviewAction } from '@/lib/status'
import { submitAsset as submitAssetApi, reviewAsset as reviewAssetApi } from '@/lib/api-client'

interface SubmitAssetParams {
  assetId: string
  campaignId: string
  userId: string
  targetStatus: AssetStatus
  note?: string
}

async function submitAssetFn(params: SubmitAssetParams) {
  const { assetId, campaignId, targetStatus, note } = params

  const target = targetStatus === 'submitted' || targetStatus === 'brand_review'
    ? 'brand_review'
    : 'agency_review'

  await submitAssetApi({
    asset_id: assetId,
    target,
    message: note,
  })

  return { assetId, campaignId }
}

export function useSubmitAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitAssetFn,
    onSuccess: ({ campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-assets', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['review-queue'] })
    },
  })
}

interface ReviewQueueFilters {
  status?: AssetStatus
  campaignId?: string
}

interface ReviewQueueItem {
  campaignId: string
  campaignName: string
  brandId?: string
  brandName?: string
  assetCount: number
  assets: CreativeAsset[]
}

async function fetchReviewQueue(filters?: ReviewQueueFilters): Promise<ReviewQueueItem[]> {
  let query = supabase
    .from('creative_assets')
    .select(`
      *,
      campaigns!inner(id, name, brand_id, brands(id, name))
    `)
    .in('status', ['submitted', 'brand_review'])
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.campaignId) {
    query = query.eq('campaign_id', filters.campaignId)
  }

  const { data, error } = await query

  if (error) throw error

  const grouped: Record<string, ReviewQueueItem> = {}

  for (const asset of data || []) {
    const campaign = asset.campaigns as { id: string; name: string; brand_id?: string; brands?: { id: string; name: string } }
    const campaignId = campaign.id

    if (!grouped[campaignId]) {
      grouped[campaignId] = {
        campaignId,
        campaignName: campaign.name,
        brandId: campaign.brand_id,
        brandName: campaign.brands?.name,
        assetCount: 0,
        assets: [],
      }
    }

    grouped[campaignId].assetCount++
    grouped[campaignId].assets.push(asset as unknown as CreativeAsset)
  }

  return Object.values(grouped)
}

export function useReviewQueue(filters?: ReviewQueueFilters) {
  return useQuery({
    queryKey: ['review-queue', filters],
    queryFn: () => fetchReviewQueue(filters),
  })
}

interface AssetWithReviewContext extends CreativeAsset {
  campaign?: Campaign
  brand?: Brand | null
  statusHistory?: StatusHistoryEntry[]
}

interface StatusHistoryEntry {
  id: string
  from_status: string | null
  to_status: string
  notes: string | null
  created_at: string
  user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

async function fetchAssetWithReviewContext(assetId: string): Promise<AssetWithReviewContext> {
  const { data: asset, error: assetError } = await supabase
    .from('creative_assets')
    .select('*')
    .eq('id', assetId)
    .single()

  if (assetError) throw assetError

  let campaign: Campaign | null = null
  let brand: Brand | null = null

  if (asset.campaign_id) {
    campaign = await fetchCampaign(asset.campaign_id)
    if (campaign?.brand_id) {
      brand = await fetchBrand(campaign.brand_id)
    }
  }

  const { data: statusHistory, error: historyError } = await supabase
    .from('asset_status_history')
    .select(`
      id,
      from_status,
      to_status,
      notes,
      created_at,
      users(id, full_name, avatar_url)
    `)
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })

  if (historyError) console.error('Failed to fetch status history:', historyError)

  return {
    ...asset,
    campaign: campaign ?? undefined,
    brand,
    statusHistory: (statusHistory || []).map(h => ({
      ...h,
      user: h.users as unknown as StatusHistoryEntry['user'],
    })),
  } as AssetWithReviewContext
}

export function useAssetWithReviewContext(assetId: string) {
  return useQuery({
    queryKey: ['asset-review', assetId],
    queryFn: () => fetchAssetWithReviewContext(assetId),
    enabled: !!assetId,
  })
}

async function fetchAssetStatusHistory(assetId: string): Promise<StatusHistoryEntry[]> {
  const { data, error } = await supabase
    .from('asset_status_history')
    .select(`
      id,
      from_status,
      to_status,
      notes,
      created_at,
      users(id, full_name, avatar_url)
    `)
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map(h => ({
    ...h,
    user: h.users as unknown as StatusHistoryEntry['user'],
  }))
}

export function useAssetStatusHistory(assetId: string) {
  return useQuery({
    queryKey: ['asset-status-history', assetId],
    queryFn: () => fetchAssetStatusHistory(assetId),
    enabled: !!assetId,
  })
}

interface ReviewAssetParams {
  assetId: string
  campaignId: string
  userId: string
  action: ReviewAction
  notes?: string
}

async function reviewAssetFn(params: ReviewAssetParams) {
  const { assetId, campaignId, action, notes } = params

  await reviewAssetApi({
    asset_id: assetId,
    action,
    notes,
  })

  return { assetId, campaignId, action }
}

export function useReviewAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reviewAssetFn,
    onSuccess: ({ campaignId, assetId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-assets', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['review-queue'] })
      queryClient.invalidateQueries({ queryKey: ['asset-review', assetId] })
      queryClient.invalidateQueries({ queryKey: ['asset-status-history', assetId] })
    },
  })
}

async function fetchRecentlyReviewed(userId: string): Promise<CreativeAsset[]> {
  const { data, error } = await supabase
    .from('creative_assets')
    .select('*')
    .eq('reviewed_by', userId)
    .in('status', ['approved', 'rejected', 'changes_requested'])
    .order('reviewed_at', { ascending: false })
    .limit(10)

  if (error) throw error
  return data as CreativeAsset[]
}

export function useRecentlyReviewed(userId: string) {
  return useQuery({
    queryKey: ['recently-reviewed', userId],
    queryFn: () => fetchRecentlyReviewed(userId),
    enabled: !!userId,
  })
}

export type { ReviewQueueItem, StatusHistoryEntry, AssetWithReviewContext }

// ============================================
// Comments Hooks
// ============================================

export interface AssetComment {
  id: string
  asset_id: string
  user_id: string
  content: string
  parent_comment_id: string | null
  resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  user_name?: string
  user_avatar?: string
  replies?: AssetComment[]
}

async function fetchAssetComments(assetId: string): Promise<AssetComment[]> {
  const { data, error } = await supabase
    .from('asset_comments')
    .select(`
      *,
      users(id, full_name, avatar_url)
    `)
    .eq('asset_id', assetId)
    .order('created_at', { ascending: true })

  if (error) throw error

  const comments = (data || []).map((c) => ({
    ...c,
    user_name: (c.users as { full_name?: string })?.full_name || 'Unknown User',
    user_avatar: (c.users as { avatar_url?: string })?.avatar_url,
  }))

  const topLevel = comments.filter((c) => !c.parent_comment_id)
  const replies = comments.filter((c) => c.parent_comment_id)

  return topLevel.map((comment) => ({
    ...comment,
    replies: buildReplyTree(comment.id, replies),
  }))
}

function buildReplyTree(parentId: string, allReplies: AssetComment[]): AssetComment[] {
  const directReplies = allReplies.filter((r) => r.parent_comment_id === parentId)
  return directReplies.map((reply) => ({
    ...reply,
    replies: buildReplyTree(reply.id, allReplies),
  }))
}

export function useAssetComments(assetId: string) {
  return useQuery({
    queryKey: ['asset-comments', assetId],
    queryFn: () => fetchAssetComments(assetId),
    enabled: !!assetId,
  })
}

interface AddCommentParams {
  assetId: string
  userId: string
  content: string
  parentCommentId?: string
}

async function addComment(params: AddCommentParams) {
  const { assetId, userId, content, parentCommentId } = params

  const { data, error } = await supabase
    .from('asset_comments')
    .insert({
      asset_id: assetId,
      user_id: userId,
      content,
      parent_comment_id: parentCommentId || null,
    })
    .select()
    .single()

  if (error) throw error
  return { assetId, comment: data }
}

export function useAddComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addComment,
    onSuccess: ({ assetId }) => {
      queryClient.invalidateQueries({ queryKey: ['asset-comments', assetId] })
    },
  })
}

interface ResolveCommentParams {
  commentId: string
  assetId: string
  userId: string
}

async function resolveComment(params: ResolveCommentParams) {
  const { commentId, assetId, userId } = params

  const { error } = await supabase
    .from('asset_comments')
    .update({
      resolved: true,
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', commentId)

  if (error) throw error
  return { assetId, commentId }
}

export function useResolveComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resolveComment,
    onSuccess: ({ assetId }) => {
      queryClient.invalidateQueries({ queryKey: ['asset-comments', assetId] })
    },
  })
}

interface DeleteCommentParams {
  commentId: string
  assetId: string
}

async function deleteComment(params: DeleteCommentParams) {
  const { commentId, assetId } = params

  const { error } = await supabase
    .from('asset_comments')
    .delete()
    .eq('id', commentId)

  if (error) throw error
  return { assetId, commentId }
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: ({ assetId }) => {
      queryClient.invalidateQueries({ queryKey: ['asset-comments', assetId] })
    },
  })
}

// ============================================
// Validation Pipeline (PRD 09)
// ============================================

export function useValidateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ assetId, campaignId }: { assetId: string; campaignId: string }) => {
      const { validateAsset } = await import('@/lib/validation-pipeline')
      return validateAsset({ assetId, campaignId })
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['asset-review', result.assetId] })
      queryClient.invalidateQueries({ queryKey: ['campaign-assets'] })
    },
  })
}

export function useValidateAssets() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ assetIds, campaignId }: { assetIds: string[]; campaignId: string }) => {
      const { validateAssets } = await import('@/lib/validation-pipeline')
      return validateAssets(assetIds, campaignId)
    },
    onSuccess: (_, variables) => {
      variables.assetIds.forEach((id) => queryClient.invalidateQueries({ queryKey: ['asset-review', id] }))
      queryClient.invalidateQueries({ queryKey: ['campaign-assets', variables.campaignId] })
    },
  })
}

// ============================================
// Approval Actions Hooks
// ============================================

interface RecordApprovalActionParams {
  assetId: string
  userId: string
  action: 'approve' | 'reject' | 'request_changes'
  notes?: string
}

async function recordApprovalAction(params: RecordApprovalActionParams) {
  const { assetId, userId, action, notes } = params

  const { data, error } = await supabase
    .from('approval_actions')
    .insert({
      asset_id: assetId,
      user_id: userId,
      action,
      notes,
    })
    .select()
    .single()

  if (error) throw error
  return { assetId, action: data }
}

export function useRecordApprovalAction() {
  return useMutation({
    mutationFn: recordApprovalAction,
  })
}
