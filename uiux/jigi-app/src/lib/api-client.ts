import { useAuthStore } from '@/store/authStore'
import { getSupabaseSessionSingleFlight } from './supabase-session'

const API_BASE = '/api'

async function getAuthToken(): Promise<string | null> {
  const fromStore = useAuthStore.getState().session?.access_token ?? null
  if (fromStore) return fromStore

  const { session } = await getSupabaseSessionSingleFlight()
  return session?.access_token ?? null
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `API error: ${response.status}`)
  }

  return response.json()
}

export interface GenerateTextRequest {
  type: 'concept' | 'copy' | 'compliance' | 'image_prompt_refine'
  campaign_id: string
  brand_id?: string
  prompt: string
  brand_context?: {
    name: string
    voice?: {
      tone?: string[]
      preferred_words?: string[]
      avoided_words?: string[]
    }
    identity?: {
      colours?: { primary?: string; secondary?: string }
    }
  }
  seed_idea?: string
  concept_context?: {
    theme: string
    headlines: string[]
    visual_direction: string
  }
  /** Prompt hash for audit; stored in generation_log when provided */
  prompt_hash?: string
  /** When true (concept only), use prompt as system message instead of user message */
  use_prompt_as_system?: boolean
}

export interface GenerateTextResponse {
  content: Record<string, unknown>
  type: string
  model: string
  latency_ms: number
  tokens_used: number
}

export async function generateText(
  request: GenerateTextRequest
): Promise<GenerateTextResponse> {
  return apiRequest<GenerateTextResponse>('/generate/text', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export interface GenerateImageRequest {
  prompt: string
  campaign_id: string
  brand_id?: string
  concept_id?: string
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  image_tier?: 'draft' | 'refine' | 'final'
  quality?: 'draft' | 'standard' | 'high'
  brand_context?: {
    name: string
    voice?: { tone?: string[] }
    identity?: {
      colours?: { primary?: string; secondary?: string; accent?: string }
      logo_url?: string
    }
  }
  /** Prompt hash for audit; stored with asset when provided */
  prompt_hash?: string
  /** Asset lineage (CCO version, etc.) for drift detection */
  lineage?: { cco_version?: number; bio_version?: number; generation_timestamp?: string }
  /** Copy variant used as messaging anchor for the image prompt */
  copy_asset_id?: string
  copy_headline_anchor?: string
  copy_key_message?: string
  copy_body_snippet?: string
}

export interface GenerateImageResponse {
  asset: {
    id: string
    campaign_id: string
    type: string
    content: Record<string, unknown>
    status: string
  }
  image_url: string
  model: string
  image_provider: 'google_imagen' | 'replicate' | 'azure_openai' | 'azure_foundry'
  image_tier: 'draft' | 'refine' | 'final'
  routing_reason: 'default' | 'retry' | 'quota_exhausted' | 'budget_guard'
  cost_bucket: 'free' | 'paid_fallback'
  latency_ms: number
}

export async function generateImage(
  request: GenerateImageRequest
): Promise<GenerateImageResponse> {
  return apiRequest<GenerateImageResponse>('/generate/image', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export interface SubmitAssetRequest {
  asset_id: string
  target: 'agency_review' | 'brand_review'
  message?: string
}

export interface SubmitAssetResponse {
  asset: Record<string, unknown>
  previous_status: string
  new_status: string
  notifications_sent: boolean
}

export async function submitAsset(
  request: SubmitAssetRequest
): Promise<SubmitAssetResponse> {
  return apiRequest<SubmitAssetResponse>('/assets/submit', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export interface ReviewAssetRequest {
  asset_id: string
  action: 'approve' | 'reject' | 'request_changes'
  notes?: string
}

export interface ReviewAssetResponse {
  asset: Record<string, unknown>
  previous_status: string
  new_status: string
  action: string
  reviewed_by: string
}

export async function reviewAsset(
  request: ReviewAssetRequest
): Promise<ReviewAssetResponse> {
  return apiRequest<ReviewAssetResponse>('/assets/review', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export interface SendNotificationRequest {
  user_id: string
  type: 'submission' | 'approval' | 'rejection' | 'changes_requested' | 'comment_added' | 'comment_reply'
  title: string
  body: string
  related_asset_id?: string
  related_campaign_id?: string
  send_email?: boolean
  email_subject?: string
  email_html?: string
}

export interface SendNotificationResponse {
  notification: Record<string, unknown>
  email_sent: boolean
}

export async function sendNotification(
  request: SendNotificationRequest
): Promise<SendNotificationResponse> {
  return apiRequest<SendNotificationResponse>('/notifications/send', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export interface CreativeRouterVariant {
  id: string
  provider: string
  templateId?: string
  placements: string[]
  assetUrl?: string
}

export interface GenerateCreativesViaRouterResponse {
  jobId: string
  status: string
  variants: CreativeRouterVariant[]
}

export async function generateCreativesViaRouter(
  campaignId: string
): Promise<GenerateCreativesViaRouterResponse> {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE}/creative-router/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ campaign_id: campaignId }),
  })
  const data = await response.json().catch(() => ({})) as GenerateCreativesViaRouterResponse & { error?: string; code?: string }
  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate creatives')
  }
  return {
    jobId: data.jobId,
    status: data.status ?? 'accepted',
    variants: data.variants ?? [],
  }
}
