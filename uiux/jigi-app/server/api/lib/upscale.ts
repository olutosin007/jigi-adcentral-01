import { estimateImageCostUsd, pickModel, type ImageResolution } from './image-models.js'
import { getServerEnv } from './env.js'

export const DEFAULT_UPSCALE_MODEL = 'nightmareai/real-esrgan'
export const UPSCALE_SCALES = [2, 4] as const
export type UpscaleScale = (typeof UPSCALE_SCALES)[number]

export interface UpscaleRequestBody {
  asset_id?: unknown
  scale?: unknown
}

export interface SourceImageAsset {
  id: string
  campaign_id: string
  type: string
  version: number | null
  content: Record<string, unknown> | null
  created_by?: string | null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function getUpscaleModel(): string {
  return pickModel({
    envKey: 'REPLICATE_UPSCALE_MODEL',
    envValue: getServerEnv('REPLICATE_UPSCALE_MODEL', false),
    fallback: DEFAULT_UPSCALE_MODEL,
  })
}

export function validateUpscaleRequest(
  body: UpscaleRequestBody | null | undefined
): { ok: true; assetId: string; scale: UpscaleScale } | { ok: false; error: string } {
  if (!body || typeof body.asset_id !== 'string' || !UUID_RE.test(body.asset_id)) {
    return { ok: false, error: 'asset_id must be a UUID' }
  }
  const scale = body.scale ?? 2
  if (!UPSCALE_SCALES.includes(scale as UpscaleScale)) {
    return { ok: false, error: 'scale must be 2 or 4' }
  }
  return { ok: true, assetId: body.asset_id, scale: scale as UpscaleScale }
}

/** Returns an error message when the asset can't be upscaled, otherwise null. */
export function checkUpscalable(asset: SourceImageAsset): string | null {
  if (asset.type !== 'image') return 'Only image assets can be upscaled'
  if (typeof asset.content?.url !== 'string' || !asset.content.url) return 'Source image has no URL'
  if (asset.content.upscaled_from) return 'This image is already an upscaled version'
  return null
}

export function upscaleResolution(scale: UpscaleScale): ImageResolution {
  return scale === 4 ? '4K' : '2K'
}

/**
 * Child asset row: same lineage and prompt, new URL, next version, fresh draft.
 * Review state (status history, notes, scores) is deliberately not copied.
 */
export function buildUpscaledAssetInsert(params: {
  source: SourceImageAsset
  userId: string
  url: string
  scale: UpscaleScale
  model: string
}): Record<string, unknown> {
  const { source, userId, url, scale, model } = params
  const sourceContent = source.content ?? {}
  return {
    campaign_id: source.campaign_id,
    created_by: userId,
    type: 'image',
    status: 'draft',
    parent_asset_id: source.id,
    version: (source.version ?? 1) + 1,
    content: {
      ...sourceContent,
      url,
      upscaled_from: source.id,
      upscale_scale: scale,
      upscale_model: model,
      image_tier: 'final',
      image_resolution: upscaleResolution(scale),
      estimated_cost_usd: estimateImageCostUsd(model, upscaleResolution(scale)),
    },
  }
}

/** Replicate SDK 1.x returns FileOutput objects (or arrays of them); normalise to a URL string. */
export function replicateOutputToUrl(output: unknown): string | null {
  const first = Array.isArray(output) ? output[0] : output
  if (!first) return null
  if (typeof first === 'string') return first
  if (typeof first === 'object' && first !== null && 'url' in first) {
    const url = (first as { url: unknown }).url
    const value = typeof url === 'function' ? (url as () => unknown).call(first) : url
    return value ? String(value) : null
  }
  return null
}
