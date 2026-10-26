import { getServerEnv } from './env.js'

export type FalImageAspect = '1:1' | '4:5' | '16:9' | '9:16' | '4:3' | '3:4'
export type FalImageTier = 'draft' | 'refine' | 'final'

export interface FalImageRequest {
  model: string
  prompt: string
  aspectRatio: FalImageAspect
  tier: FalImageTier
}

type FalImageFamily = 'flux' | 'seedream' | 'nano_banana'

const DEFAULT_TIMEOUT_MS = 45_000
const POLL_INTERVAL_MS = 1_000
const QUEUE_BASE = 'https://queue.fal.run'

export function hasFalConfig(): boolean {
  return Boolean(getServerEnv('FAL_KEY', false))
}

export function falImageFamily(model: string): FalImageFamily {
  if (model.includes('seedream')) return 'seedream'
  if (model.includes('nano-banana') || model.includes('nano_banana')) return 'nano_banana'
  return 'flux'
}

/** Seedream endpoints often omit 4:5; map to nearest portrait. */
const SEEDREAM_ASPECT: Record<FalImageAspect, string> = {
  '1:1': '1:1',
  '4:5': '3:4',
  '16:9': '16:9',
  '9:16': '9:16',
  '4:3': '4:3',
  '3:4': '3:4',
}

/**
 * Model-family inputs for fal gallery endpoints (drift-tested against app aspects).
 * Endpoint paths are the registry model ids (e.g. fal-ai/flux/schnell).
 */
export function buildFalImageInput(request: FalImageRequest): Record<string, unknown> {
  const { model, prompt, aspectRatio, tier } = request
  switch (falImageFamily(model)) {
    case 'nano_banana':
      return { prompt, aspect_ratio: aspectRatio, num_images: 1, output_format: 'png' }
    case 'seedream':
      return {
        prompt,
        aspect_ratio: SEEDREAM_ASPECT[aspectRatio],
        num_images: 1,
        enable_safety_checker: true,
      }
    case 'flux':
      return {
        prompt,
        image_size: fluxImageSize(aspectRatio),
        num_images: 1,
        enable_safety_checker: true,
        num_inference_steps: tier === 'draft' ? 4 : 28,
      }
  }
}

/** fal Flux uses named sizes rather than free-form aspect strings. */
export function fluxImageSize(aspect: FalImageAspect): string {
  switch (aspect) {
    case '1:1':
      return 'square_hd'
    case '16:9':
    case '4:3':
      return 'landscape_16_9'
    case '9:16':
    case '4:5':
    case '3:4':
      return 'portrait_16_9'
  }
}

export function falImageContentType(header: string | null, url: string): string {
  if (header?.startsWith('image/')) return header.split(';')[0]!.trim()
  if (/\.jpe?g(\?|$)/i.test(url)) return 'image/jpeg'
  if (/\.webp(\?|$)/i.test(url)) return 'image/webp'
  return 'image/png'
}

function falAuthHeader(): string {
  const key = getServerEnv('FAL_KEY')
  return `Key ${key}`
}

function predictionTimeoutMs(): number {
  const raw = Number(process.env.FAL_PREDICTION_TIMEOUT_MS)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS
}

interface FalSubmitResponse {
  request_id: string
  status_url?: string
  response_url?: string
}

interface FalStatusResponse {
  status: string
  error?: string
}

/** Extract https image URLs from fal result payloads (images[] or image.url). */
export function falOutputUrls(data: unknown): string[] {
  if (!data || typeof data !== 'object') return []
  const root = data as Record<string, unknown>
  const urls: string[] = []
  const push = (v: unknown) => {
    if (typeof v === 'string' && /^https?:\/\//i.test(v)) urls.push(v)
    else if (v && typeof v === 'object' && 'url' in v) {
      const u = (v as { url: unknown }).url
      if (typeof u === 'string') urls.push(u)
    }
  }
  if (Array.isArray(root.images)) root.images.forEach(push)
  if (root.image) push(root.image)
  if (typeof root.url === 'string') push(root.url)
  return urls
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

/**
 * Submit to fal queue and poll until COMPLETED (or timeout).
 * Uses REST only — no SDK — so serverless cold starts stay light.
 */
export async function generateImageWithFal(request: FalImageRequest): Promise<string[]> {
  if (!hasFalConfig()) {
    throw new Error('FAL_KEY is not configured')
  }
  const input = buildFalImageInput(request)
  const submitRes = await fetch(`${QUEUE_BASE}/${request.model}`, {
    method: 'POST',
    headers: {
      Authorization: falAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => '')
    throw new Error(`fal submit ${request.model} ${submitRes.status}: ${body.slice(0, 200)}`)
  }
  const submitted = (await submitRes.json()) as FalSubmitResponse
  if (!submitted.request_id || !submitted.status_url || !submitted.response_url) {
    throw new Error(`fal submit missing request urls for ${request.model}`)
  }

  const deadline = Date.now() + predictionTimeoutMs()
  while (Date.now() < deadline) {
    const statusRes = await fetch(submitted.status_url, {
      headers: { Authorization: falAuthHeader() },
    })
    // fal returns 202 while queued/in progress
    const statusBody = (await statusRes.json()) as FalStatusResponse
    if (statusBody.status === 'COMPLETED') {
      const resultRes = await fetch(submitted.response_url, {
        headers: { Authorization: falAuthHeader() },
      })
      if (!resultRes.ok) {
        const body = await resultRes.text().catch(() => '')
        throw new Error(`fal result ${request.model} ${resultRes.status}: ${body.slice(0, 200)}`)
      }
      const payload = await resultRes.json()
      // Some responses nest under `data`
      const data =
        payload && typeof payload === 'object' && 'data' in (payload as object)
          ? (payload as { data: unknown }).data
          : payload
      const urls = falOutputUrls(data)
      if (urls.length === 0) {
        throw new Error(`fal ${request.model} completed with no image URLs`)
      }
      return urls
    }
    if (statusBody.status === 'FAILED' || statusBody.error) {
      throw new Error(`fal ${request.model} failed: ${statusBody.error ?? statusBody.status}`)
    }
    await sleep(POLL_INTERVAL_MS)
  }
  throw new Error(`fal ${request.model} did not finish within ${predictionTimeoutMs()}ms`)
}
