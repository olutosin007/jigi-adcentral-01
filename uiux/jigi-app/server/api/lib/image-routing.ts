import { getBooleanEnv, getNumberEnv, getServerEnv } from './env.js'
import { pickModel, type ImageProvider, type ImageResolution, type ImageTier } from './image-models.js'
import { hasKlingConfig } from './kling-image.js'
import { hasFalConfig } from './fal.js'

export type { ImageProvider, ImageTier, ImageResolution } from './image-models.js'
export type RoutingReason =
  | 'default'
  | 'retry'
  | 'quota_exhausted'
  | 'budget_guard'
/** `free` is kept as the stored value for primary lanes (historic rows); the UI labels it "Primary". */
export type CostBucket = 'free' | 'paid_fallback'

export interface ImageRoutingMetadata {
  image_provider: ImageProvider
  image_tier: ImageTier
  routing_reason: RoutingReason
  cost_bucket: CostBucket
  provider_model: string
  route_attempt: number
}

export interface RouteCandidate {
  provider: ImageProvider
  model: string
  costBucket: CostBucket
  resolution: ImageResolution
}

export interface ResolvedRoute extends ImageRoutingMetadata {
  provider: ImageProvider
  model: string
  costBucket: CostBucket
  resolution: ImageResolution
}

export interface RoutingContext {
  tier: ImageTier
  quotaExhaustedFreeLane?: boolean
  paidFallbackBlocked?: boolean
  attempt: number
  previousErrorWasRetryable?: boolean
}

type ImageRoutingProviderMode = 'hybrid' | 'azure_only'

export const DEFAULT_GEMINI_MODEL_BY_TIER: Record<ImageTier, string> = {
  draft: 'gemini-3.1-flash-lite-image',
  refine: 'gemini-nano-banana-2.1',
  final: 'gemini-nano-banana-2.1',
}

export const DEFAULT_KLING_MODEL_BY_TIER: Record<ImageTier, string> = {
  draft: 'kling-v2-1',
  refine: 'kling-v3',
  final: 'kling-v3',
}

export const DEFAULT_FAL_MODEL_BY_TIER: Record<ImageTier, string> = {
  draft: 'fal-ai/flux/schnell',
  refine: 'fal-ai/bytedance/seedream/v4/text-to-image',
  final: 'fal-ai/nano-banana',
}

export const DEFAULT_REPLICATE_MODEL_BY_TIER: Record<ImageTier, string> = {
  draft: 'black-forest-labs/flux-schnell',
  refine: 'bytedance/seedream-4',
  final: 'google/nano-banana',
}

const DEFAULT_AZURE_MODEL_BY_TIER: Record<ImageTier, string> = {
  draft: 'gpt-image-1-mini',
  refine: 'gpt-image-1-mini',
  final: 'gpt-image-1-mini',
}

const DEFAULT_FOUNDRY_MODEL = 'flux-2-flex'

/** Output resolution requested per tier (providers that can't honour it render at 1K). */
export const RESOLUTION_BY_TIER: Record<ImageTier, ImageResolution> = {
  draft: '1K',
  refine: '1K',
  final: '2K',
}

const TIER_ENV_SUFFIX: Record<ImageTier, string> = {
  draft: 'DRAFT',
  refine: 'REFINE',
  final: 'FINAL',
}

/** Reads `<prefix>_<TIER>` (first prefix that is set wins) and refuses retired models. */
function modelFromEnv(prefixes: string[], tier: ImageTier, fallback: string): string {
  for (const prefix of prefixes) {
    const envKey = `${prefix}_${TIER_ENV_SUFFIX[tier]}`
    const envValue = getServerEnv(envKey, false)
    if (envValue) return pickModel({ envKey, envValue, fallback })
  }
  return fallback
}

export function getGeminiModelForTier(tier: ImageTier): string {
  return modelFromEnv(
    ['GOOGLE_IMAGE_MODEL', 'GOOGLE_IMAGEN_MODEL'],
    tier,
    DEFAULT_GEMINI_MODEL_BY_TIER[tier]
  )
}

export function getKlingModelForTier(tier: ImageTier): string {
  return modelFromEnv(['KLING_IMAGE_MODEL'], tier, DEFAULT_KLING_MODEL_BY_TIER[tier])
}

function getReplicateModelForTier(tier: ImageTier): string {
  return modelFromEnv(['REPLICATE_IMAGE_MODEL'], tier, DEFAULT_REPLICATE_MODEL_BY_TIER[tier])
}

export function getFalModelForTier(tier: ImageTier): string {
  return modelFromEnv(['FAL_IMAGE_MODEL'], tier, DEFAULT_FAL_MODEL_BY_TIER[tier])
}

function getAzureModelForTier(tier: ImageTier): string {
  const fallback =
    tier === 'final'
      ? pickModel({
          envKey: 'AZURE_OPENAI_DEPLOYMENT_DALLE',
          envValue: getServerEnv('AZURE_OPENAI_DEPLOYMENT_DALLE', false),
          fallback: DEFAULT_AZURE_MODEL_BY_TIER.final,
        })
      : DEFAULT_AZURE_MODEL_BY_TIER[tier]
  return modelFromEnv(['AZURE_OPENAI_IMAGE_MODEL'], tier, fallback)
}

function getFoundryModel(): string {
  return pickModel({
    envKey: 'AZURE_FOUNDRY_FLUX_MODEL',
    envValue: getServerEnv('AZURE_FOUNDRY_FLUX_MODEL', false),
    fallback: DEFAULT_FOUNDRY_MODEL,
  })
}

export function hasGeminiImageConfig(): boolean {
  return Boolean(getServerEnv('GOOGLE_AI_API_KEY', false))
}

function hasReplicateConfig(): boolean {
  return Boolean(getServerEnv('REPLICATE_API_TOKEN', false))
}

export function hasAzureImageConfig(): boolean {
  return Boolean(
    getServerEnv('AZURE_OPENAI_ENDPOINT', false) &&
      getServerEnv('AZURE_OPENAI_API_KEY', false)
  )
}

export function hasFoundryFluxConfig(): boolean {
  return Boolean(
    getServerEnv('AZURE_FOUNDRY_FLUX_ENDPOINT', false) &&
      getServerEnv('AZURE_FOUNDRY_FLUX_API_KEY', false)
  )
}

export function getImageRoutingCaps() {
  return {
    perUserDailyCap: getNumberEnv('IMAGE_CAP_PER_USER_DAILY', 24),
    perCampaignDailyCap: getNumberEnv('IMAGE_CAP_PER_CAMPAIGN_DAILY', 18),
    globalPaidDailyCap: getNumberEnv('IMAGE_PAID_CAP_GLOBAL_DAILY', 12),
    tierDailyCaps: {
      draft: getNumberEnv('IMAGE_CAP_DRAFT_DAILY', 300),
      refine: getNumberEnv('IMAGE_CAP_REFINE_DAILY', 120),
      final: getNumberEnv('IMAGE_CAP_FINAL_DAILY', 40),
    },
  }
}

export function isPaidFallbackEnabled(): boolean {
  return getBooleanEnv('IMAGE_ROUTING_ENABLE_PAID_FALLBACK', false)
}

export function getImageRoutingProviderMode(): ImageRoutingProviderMode {
  const mode = getServerEnv('IMAGE_ROUTING_PROVIDER_MODE', false)
  return mode === 'azure_only' ? 'azure_only' : 'hybrid'
}

/**
 * Primary-lane order per tier. Kling leads where it is cheapest (draft, refine);
 * Nano Banana 2.1 leads final for in-image text rendering.
 */
export const PRIMARY_PROVIDER_ORDER: Record<ImageTier, Array<'kling' | 'google_gemini'>> = {
  draft: ['kling', 'google_gemini'],
  refine: ['kling', 'google_gemini'],
  final: ['google_gemini', 'kling'],
}

export function buildRouteChain(tier: ImageTier): RouteCandidate[] {
  const chain: RouteCandidate[] = []
  const resolution = RESOLUTION_BY_TIER[tier]

  if (getImageRoutingProviderMode() === 'azure_only') {
    if (hasFoundryFluxConfig()) {
      return [{ provider: 'azure_foundry', model: getFoundryModel(), costBucket: 'paid_fallback', resolution }]
    }
    if (hasAzureImageConfig()) {
      chain.push({ provider: 'azure_openai', model: getAzureModelForTier(tier), costBucket: 'paid_fallback', resolution })
    }
    return chain
  }

  for (const provider of PRIMARY_PROVIDER_ORDER[tier]) {
    if (provider === 'kling' && hasKlingConfig()) {
      chain.push({ provider, model: getKlingModelForTier(tier), costBucket: 'free', resolution })
    }
    if (provider === 'google_gemini' && hasGeminiImageConfig()) {
      chain.push({ provider, model: getGeminiModelForTier(tier), costBucket: 'free', resolution })
    }
  }

  // D-ROUTER: fal before Foundry / Replicate (open-weight + video-ready substrate).
  if (hasFalConfig()) {
    const model = getFalModelForTier(tier)
    const falResolution: ImageResolution = model.includes('seedream') ? '2K' : '1K'
    chain.push({ provider: 'fal', model, costBucket: 'free', resolution: falResolution })
  }

  if (hasFoundryFluxConfig()) {
    chain.push({ provider: 'azure_foundry', model: getFoundryModel(), costBucket: 'free', resolution })
  }

  if (hasReplicateConfig()) {
    const model = getReplicateModelForTier(tier)
    // Seedream is requested at size 2K (flat price); other Replicate lanes return ~1MP.
    const replicateResolution: ImageResolution = model.startsWith('bytedance/seedream') ? '2K' : '1K'
    chain.push({ provider: 'replicate', model, costBucket: 'free', resolution: replicateResolution })
  }

  if (isPaidFallbackEnabled() && hasAzureImageConfig()) {
    chain.push({ provider: 'azure_openai', model: getAzureModelForTier(tier), costBucket: 'paid_fallback', resolution: '1K' })
  }

  return chain
}

export function resolveRoute(
  chain: RouteCandidate[],
  context: RoutingContext
): ResolvedRoute | null {
  if (!chain.length) return null

  const filtered = chain.filter((candidate) => {
    if (context.paidFallbackBlocked && candidate.costBucket === 'paid_fallback') {
      return false
    }
    if (context.quotaExhaustedFreeLane && candidate.costBucket === 'free') {
      return false
    }
    return true
  })

  const targetChain = filtered.length ? filtered : chain
  const routeIndex = Math.max(0, Math.min(context.attempt, targetChain.length - 1))
  const selected = targetChain[routeIndex]
  const routingReason: RoutingReason = context.quotaExhaustedFreeLane
    ? 'quota_exhausted'
    : context.paidFallbackBlocked
    ? 'budget_guard'
    : context.previousErrorWasRetryable
    ? 'retry'
    : 'default'

  return {
    provider: selected.provider,
    model: selected.model,
    costBucket: selected.costBucket,
    resolution: selected.resolution,
    image_provider: selected.provider,
    image_tier: context.tier,
    routing_reason: routingReason,
    cost_bucket: selected.costBucket,
    provider_model: selected.model,
    route_attempt: context.attempt + 1,
  }
}

/** Billing/plan quota (e.g. Gemini free tier `limit: 0`) — retrying the same provider cannot succeed. */
export function isHardQuotaError(message: string): boolean {
  return /exceeded your current quota|resource_exhausted|insufficient credit|billing/i.test(message)
}

export function isRetryableProviderError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  if (isHardQuotaError(error.message)) return false
  const message = error.message.toLowerCase()
  return (
    message.includes('timeout') ||
    message.includes('temporarily') ||
    message.includes('503') ||
    message.includes('429') ||
    message.includes('network') ||
    message.includes('rate limit')
  )
}


const PROVIDER_ERROR_MAX = 160

/** One readable line per failed lane for the client; full errors stay in server logs. */
export function summarizeProviderError(message: string): string {
  if (isHardQuotaError(message)) {
    return /free[_ ]?tier/i.test(message)
      ? 'quota exhausted — this API key is on the free tier, which has no image quota. Enable billing for the project.'
      : 'quota exhausted — check plan and billing for this provider.'
  }
  if (/\b429\b|rate limit|too many requests/i.test(message)) return 'rate limited — try again shortly.'
  if (/\b(401|403)\b|unauthori[sz]ed|permission denied|api key not valid|invalid api key/i.test(message)) {
    return 'credentials rejected — check the API key.'
  }
  const firstLine = message.split('\n')[0].replace(/\s*[-:]\s*\{.*$/s, '').trim()
  return firstLine.length > PROVIDER_ERROR_MAX ? `${firstLine.slice(0, PROVIDER_ERROR_MAX - 1)}…` : firstLine || 'unknown error'
}
