import { getBooleanEnv, getServerEnv } from './env.js'

const CREATIVE_ROUTER_ENABLED = getBooleanEnv('CREATIVE_ROUTER_ENABLED', false)
const CREATIVE_ROUTER_BASE_URL =
  getServerEnv('CREATIVE_ROUTER_BASE_URL', false) || 'http://localhost:4000'

interface GenerateCreativesPayload {
  campaignId: string
  channel: 'meta'
  placements: Array<{ placement: string; aspectRatio: string }>
  phase: 'test_and_learn' | 'scale'
  costProfile: 'template_only' | 'balanced' | 'premium'
  brandProfileId: string
  copy: { headlines: string[]; bodies: string[]; ctas: string[] }
  experimentConfig?: { maxVariants?: number }
  brandOverrides?: Record<string, unknown>
}

export interface GenerateCreativesResult {
  jobId: string
  status: 'accepted'
  variants?: Array<{
    id: string
    provider: string
    templateId?: string
    placements: string[]
    assetUrl?: string
  }>
}

export interface CreativeRouterError {
  errorCode: string
  message: string
  details?: Record<string, unknown>
}

export function isCreativeRouterEnabled(): boolean {
  return CREATIVE_ROUTER_ENABLED
}

export async function callGenerateCreatives(
  payload: GenerateCreativesPayload
): Promise<Response | null> {
  if (!CREATIVE_ROUTER_ENABLED) {
    return null
  }

  const res = await fetch(`${CREATIVE_ROUTER_BASE_URL}/generate-creatives`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return res
}

export function mapCreativeRouterErrorToMessage(errorCode: string): string {
  switch (errorCode) {
    case 'NO_TEMPLATES_FOUND':
      return 'No ad templates found for the selected placements. Try different placements or relax constraints.'
    case 'PROVIDER_UNAVAILABLE':
      return 'Creative service is temporarily unavailable. Please try again later.'
    case 'BRAND_PROFILE_INVALID':
      return 'Brand profile is incomplete. Please add logo and primary color in brand settings.'
    case 'BAD_REQUEST':
      return 'Invalid request. Check campaign and brand details.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

