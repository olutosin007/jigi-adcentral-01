import { getBooleanEnv, getNumberEnv, getServerEnv } from './env.js'

export type ImageProvider = 'google_imagen' | 'replicate' | 'azure_openai' | 'azure_foundry'
export type ImageTier = 'draft' | 'refine' | 'final'
export type RoutingReason =
  | 'default'
  | 'retry'
  | 'quota_exhausted'
  | 'budget_guard'
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
}

export interface ResolvedRoute extends ImageRoutingMetadata {
  provider: ImageProvider
  model: string
  costBucket: CostBucket
}

export interface RoutingContext {
  tier: ImageTier
  quotaExhaustedFreeLane?: boolean
  paidFallbackBlocked?: boolean
  attempt: number
  previousErrorWasRetryable?: boolean
}

type ImageRoutingProviderMode = 'hybrid' | 'azure_only'

const DEFAULT_GOOGLE_MODEL_BY_TIER: Record<ImageTier, string> = {
  draft: 'imagen-4.0-fast-generate-001',
  refine: 'imagen-4.0-generate-001',
  final: 'imagen-4.0-ultra-generate-001',
}

const DEFAULT_REPLICATE_MODEL_BY_TIER: Record<ImageTier, string> = {
  draft: 'black-forest-labs/flux-schnell',
  refine: 'black-forest-labs/flux-dev',
  final: 'black-forest-labs/flux-dev',
}

const DEFAULT_AZURE_MODEL_BY_TIER: Record<ImageTier, string> = {
  draft: 'gpt-image-1-mini',
  refine: 'gpt-image-1-mini',
  final: getServerEnv('AZURE_OPENAI_DEPLOYMENT_DALLE', false) || 'gpt-image-1-mini',
}

const DEFAULT_FOUNDRY_MODEL_BY_TIER: Record<ImageTier, string> = {
  draft: 'flux-2-flex',
  refine: 'flux-2-flex',
  final: 'flux-2-flex',
}

function getGoogleModelForTier(tier: ImageTier): string {
  if (tier === 'draft') {
    return (
      getServerEnv('GOOGLE_IMAGEN_MODEL_DRAFT', false) ||
      DEFAULT_GOOGLE_MODEL_BY_TIER.draft
    )
  }
  if (tier === 'refine') {
    return (
      getServerEnv('GOOGLE_IMAGEN_MODEL_REFINE', false) ||
      DEFAULT_GOOGLE_MODEL_BY_TIER.refine
    )
  }
  return (
    getServerEnv('GOOGLE_IMAGEN_MODEL_FINAL', false) ||
    DEFAULT_GOOGLE_MODEL_BY_TIER.final
  )
}

function getReplicateModelForTier(tier: ImageTier): string {
  if (tier === 'draft') {
    return (
      getServerEnv('REPLICATE_IMAGE_MODEL_DRAFT', false) ||
      DEFAULT_REPLICATE_MODEL_BY_TIER.draft
    )
  }
  if (tier === 'refine') {
    return (
      getServerEnv('REPLICATE_IMAGE_MODEL_REFINE', false) ||
      DEFAULT_REPLICATE_MODEL_BY_TIER.refine
    )
  }
  return (
    getServerEnv('REPLICATE_IMAGE_MODEL_FINAL', false) ||
    DEFAULT_REPLICATE_MODEL_BY_TIER.final
  )
}

function getAzureModelForTier(tier: ImageTier): string {
  if (tier === 'draft') {
    return (
      getServerEnv('AZURE_OPENAI_IMAGE_MODEL_DRAFT', false) ||
      DEFAULT_AZURE_MODEL_BY_TIER.draft
    )
  }
  if (tier === 'refine') {
    return (
      getServerEnv('AZURE_OPENAI_IMAGE_MODEL_REFINE', false) ||
      DEFAULT_AZURE_MODEL_BY_TIER.refine
    )
  }
  return (
    getServerEnv('AZURE_OPENAI_IMAGE_MODEL_FINAL', false) ||
    DEFAULT_AZURE_MODEL_BY_TIER.final
  )
}

function hasGoogleConfig(): boolean {
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

function getFoundryModelForTier(tier: ImageTier): string {
  return (
    getServerEnv('AZURE_FOUNDRY_FLUX_MODEL', false) ||
    DEFAULT_FOUNDRY_MODEL_BY_TIER[tier]
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

export function buildRouteChain(tier: ImageTier): RouteCandidate[] {
  const chain: RouteCandidate[] = []
  const providerMode = getImageRoutingProviderMode()

  if (providerMode === 'azure_only') {
    if (hasFoundryFluxConfig()) {
      chain.push({
        provider: 'azure_foundry',
        model: getFoundryModelForTier(tier),
        costBucket: 'paid_fallback',
      })
    }
    if (hasFoundryFluxConfig()) {
      return chain
    }
    if (hasAzureImageConfig()) {
      chain.push({
        provider: 'azure_openai',
        model: getAzureModelForTier(tier),
        costBucket: 'paid_fallback',
      })
    }
    return chain
  }

  if (hasFoundryFluxConfig()) {
    chain.push({
      provider: 'azure_foundry',
      model: getFoundryModelForTier(tier),
      costBucket: 'free',
    })
  }

  if (hasGoogleConfig()) {
    chain.push({
      provider: 'google_imagen',
      model: getGoogleModelForTier(tier),
      costBucket: 'free',
    })
  }

  if (isPaidFallbackEnabled() && hasReplicateConfig()) {
    chain.push({
      provider: 'replicate',
      model: getReplicateModelForTier(tier),
      costBucket: 'paid_fallback',
    })
  }

  if (isPaidFallbackEnabled() && hasAzureImageConfig()) {
    chain.push({
      provider: 'azure_openai',
      model: getAzureModelForTier(tier),
      costBucket: 'paid_fallback',
    })
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
    image_provider: selected.provider,
    image_tier: context.tier,
    routing_reason: routingReason,
    cost_bucket: selected.costBucket,
    provider_model: selected.model,
    route_attempt: context.attempt + 1,
  }
}

export function isRetryableProviderError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
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
