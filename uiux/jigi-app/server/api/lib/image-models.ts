/**
 * Single source of truth for image model ids, list prices and retirement dates.
 * Prices are USD per image at list rate (Oct 2026). `priceSource: 'estimate'`
 * marks per-second-billed hosts where the figure is a typical run, not a list price.
 */

export type ImageProvider =
  | 'google_gemini'
  | 'kling'
  | 'replicate'
  | 'azure_openai'
  | 'azure_foundry'
  /** Historic rows only — Imagen 4 is shut down on the Gemini API. Never routed. */
  | 'google_imagen'

export type ImageTier = 'draft' | 'refine' | 'final'
export type ImageResolution = '1K' | '2K' | '4K'

export interface ImageModelSpec {
  id: string
  provider: ImageProvider
  label: string
  usdPerImage: Partial<Record<ImageResolution, number>>
  priceSource: 'list' | 'estimate'
}

export const IMAGE_MODELS: Record<string, ImageModelSpec> = {
  'gemini-3.1-flash-lite-image': {
    id: 'gemini-3.1-flash-lite-image',
    provider: 'google_gemini',
    label: 'Nano Banana 2 Lite',
    usdPerImage: { '1K': 0.0336 },
    priceSource: 'list',
  },
  'gemini-nano-banana-2.1': {
    id: 'gemini-nano-banana-2.1',
    provider: 'google_gemini',
    label: 'Nano Banana 2.1',
    usdPerImage: { '1K': 0.0336, '2K': 0.0504, '4K': 0.0756 },
    priceSource: 'list',
  },
  'kling-v2-1': {
    id: 'kling-v2-1',
    provider: 'kling',
    label: 'Kling Image 2.1',
    usdPerImage: { '1K': 0.014, '2K': 0.014 },
    priceSource: 'list',
  },
  'kling-v3': {
    id: 'kling-v3',
    provider: 'kling',
    label: 'Kling Image 3.0',
    usdPerImage: { '1K': 0.028, '2K': 0.028 },
    priceSource: 'list',
  },
  'black-forest-labs/flux-schnell': {
    id: 'black-forest-labs/flux-schnell',
    provider: 'replicate',
    label: 'FLUX Schnell (Replicate)',
    usdPerImage: { '1K': 0.003 },
    priceSource: 'estimate',
  },
  'black-forest-labs/flux-dev': {
    id: 'black-forest-labs/flux-dev',
    provider: 'replicate',
    label: 'FLUX Dev (Replicate)',
    usdPerImage: { '1K': 0.025 },
    priceSource: 'estimate',
  },
  'flux-2-flex': {
    id: 'flux-2-flex',
    provider: 'azure_foundry',
    label: 'FLUX.2 Flex (Azure Foundry)',
    usdPerImage: { '1K': 0.05 },
    priceSource: 'estimate',
  },
  'gpt-image-1-mini': {
    id: 'gpt-image-1-mini',
    provider: 'azure_openai',
    label: 'GPT Image 1 Mini (Azure)',
    usdPerImage: { '1K': 0.02 },
    priceSource: 'estimate',
  },
  'nightmareai/real-esrgan': {
    id: 'nightmareai/real-esrgan',
    provider: 'replicate',
    label: 'Real-ESRGAN upscale (Replicate)',
    usdPerImage: { '1K': 0.002, '2K': 0.002, '4K': 0.004 },
    priceSource: 'estimate',
  },
}

/** Model id → date it stops serving (ISO, UTC). */
export const RETIRED_IMAGE_MODELS: Record<string, string> = {
  'imagen-4.0-fast-generate-001': '2026-08-17',
  'imagen-4.0-generate-001': '2026-08-17',
  'imagen-4.0-ultra-generate-001': '2026-08-17',
  'gpt-image-1': '2026-10-23',
  'gemini-3.1-flash-image': '2026-10-29',
}

const DAY_MS = 24 * 60 * 60 * 1000

export function isModelRetired(modelId: string, now: Date = new Date()): boolean {
  const date = RETIRED_IMAGE_MODELS[modelId]
  return Boolean(date) && Date.parse(date) <= now.getTime()
}

/** True when the model is retired or retires within `days` (used to refuse scheduling new work on it). */
export function isModelRetiringWithin(
  modelId: string,
  days: number,
  now: Date = new Date()
): boolean {
  const date = RETIRED_IMAGE_MODELS[modelId]
  return Boolean(date) && Date.parse(date) - now.getTime() <= days * DAY_MS
}

const warnedOverrides = new Set<string>()

/**
 * Env override wins unless it names a retired model — a stale `.env.local`
 * must never route traffic to a dead endpoint.
 */
export function pickModel(params: {
  envKey: string
  envValue: string | undefined
  fallback: string
  now?: Date
}): string {
  const value = params.envValue?.trim()
  if (!value) return params.fallback
  if (isModelRetired(value, params.now)) {
    if (!warnedOverrides.has(params.envKey)) {
      warnedOverrides.add(params.envKey)
      console.warn(
        `[image-models] ${params.envKey}=${value} is retired (${RETIRED_IMAGE_MODELS[value]}); using ${params.fallback}`
      )
    }
    return params.fallback
  }
  return value
}

/** `KEY=model` for every `*_MODEL*` env var that names a retired model. */
export function findRetiredModelOverrides(
  env: Record<string, string | undefined>,
  now: Date = new Date()
): string[] {
  return Object.entries(env)
    .filter(([key, value]) => key.includes('MODEL') && value && isModelRetired(value.trim(), now))
    .map(([key, value]) => `${key}=${value}`)
}

export function estimateImageCostUsd(
  modelId: string,
  resolution: ImageResolution = '1K'
): number | null {
  const spec = IMAGE_MODELS[modelId]
  if (!spec) return null
  return spec.usdPerImage[resolution] ?? spec.usdPerImage['1K'] ?? null
}
