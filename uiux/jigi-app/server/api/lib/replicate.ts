import Replicate from 'replicate'
import { getServerEnv } from './env.js'

let _replicate: Replicate | null = null

function getReplicateClient(): Replicate {
  if (!_replicate) {
    const replicateToken = getServerEnv('REPLICATE_API_TOKEN')

    _replicate = new Replicate({
      auth: replicateToken,
    })
  }
  return _replicate
}

export type ReplicateImageAspect = '1:1' | '4:5' | '16:9' | '9:16' | '4:3' | '3:4'
export type ReplicateImageTier = 'draft' | 'refine' | 'final'

export interface ReplicateImageRequest {
  model: string
  prompt: string
  aspectRatio: ReplicateImageAspect
  tier: ReplicateImageTier
}

type ReplicateImageFamily = 'nano_banana' | 'seedream' | 'flux'

export function replicateImageFamily(model: string): ReplicateImageFamily {
  if (model.startsWith('google/nano-banana')) return 'nano_banana'
  if (model.startsWith('bytedance/seedream')) return 'seedream'
  return 'flux'
}

/** Seedream has no 4:5; 3:4 is the nearest portrait. */
const SEEDREAM_ASPECT: Record<ReplicateImageAspect, string> = {
  '1:1': '1:1',
  '4:5': '3:4',
  '16:9': '16:9',
  '9:16': '9:16',
  '4:3': '4:3',
  '3:4': '3:4',
}

/**
 * Each model family validates a different input schema (enums checked Oct 2026);
 * sending one shape to all of them gets 422s.
 */
export function buildReplicateImageInput(request: ReplicateImageRequest): Record<string, unknown> {
  const { model, prompt, aspectRatio, tier } = request
  switch (replicateImageFamily(model)) {
    case 'nano_banana':
      // Default aspect is `match_input_image`, which is wrong for text-to-image.
      return { prompt, aspect_ratio: aspectRatio, output_format: 'png' }
    case 'seedream':
      // enhance_prompt off: brand prompts are already assembled and must not be rewritten.
      return {
        prompt,
        aspect_ratio: SEEDREAM_ASPECT[aspectRatio],
        size: '2K',
        max_images: 1,
        enhance_prompt: false,
      }
    case 'flux':
      return {
        prompt,
        aspect_ratio: aspectRatio,
        num_outputs: 1,
        output_format: 'webp',
        output_quality: tier === 'final' ? 95 : tier === 'refine' ? 90 : 82,
      }
  }
}

/** Stay inside the 60s function budget (vercel.json) with room for upload + DB writes. */
const DEFAULT_PREDICTION_TIMEOUT_MS = 45_000
const POLL_INTERVAL_MS = 1_000

type PredictionLike = { id: string; status: string; output?: unknown; error?: unknown }

interface ReplicatePredictionApi {
  predictions: {
    create(options: { model?: string; version?: string; input: Record<string, unknown> }): Promise<PredictionLike>
    get(id: string): Promise<PredictionLike>
  }
  models: {
    get(owner: string, name: string): Promise<{ latest_version?: { id: string } | null }>
  }
}

function predictionTimeoutMs(): number {
  const raw = Number(process.env.REPLICATE_PREDICTION_TIMEOUT_MS)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_PREDICTION_TIMEOUT_MS
}

/** `owner/name` → model endpoint; `owner/name:version` → version endpoint. */
export function predictionTarget(model: string): { model: string } | { version: string } {
  const colon = model.indexOf(':')
  return colon >= 0 ? { version: model.slice(colon + 1) } : { model }
}

/** Normalises string / string[] / FileOutput(-like) outputs to URLs. */
export function replicateOutputUrls(output: unknown): string[] {
  const items = Array.isArray(output) ? output : output == null ? [] : [output]
  const urls: string[] = []
  for (const item of items) {
    if (typeof item === 'string') {
      urls.push(item)
    } else if (item && typeof item === 'object' && 'url' in item) {
      const url = (item as { url: unknown }).url
      const value = typeof url === 'function' ? (url as () => unknown).call(item) : url
      if (value) urls.push(String(value))
    }
  }
  return urls
}

function isNotFound(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status
  return status === 404 || /\b404\b|not found/i.test(error instanceof Error ? error.message : '')
}

/** Official models accept `{ model }`; community models need a version, so resolve the latest on 404. */
async function createPrediction(
  client: ReplicatePredictionApi,
  model: string,
  input: Record<string, unknown>
): Promise<PredictionLike> {
  const target = predictionTarget(model)
  try {
    return await client.predictions.create({ ...target, input })
  } catch (error) {
    if (!('model' in target) || !isNotFound(error)) throw error
    const [owner, name] = model.split('/')
    const latest = (await client.models.get(owner, name)).latest_version?.id
    if (!latest) throw error
    return client.predictions.create({ version: latest, input })
  }
}

/**
 * Creates a prediction and polls it. `replicate.run()` (SDK 1.4) can resolve to
 * `null` even when the prediction succeeds, so it is not used.
 */
export async function runReplicatePrediction(
  model: string,
  input: Record<string, unknown>,
  options: { client?: ReplicatePredictionApi; timeoutMs?: number; intervalMs?: number } = {}
): Promise<unknown> {
  const client = options.client ?? (getReplicateClient() as unknown as ReplicatePredictionApi)
  const timeoutMs = options.timeoutMs ?? predictionTimeoutMs()
  const intervalMs = options.intervalMs ?? POLL_INTERVAL_MS
  const deadline = Date.now() + timeoutMs

  let prediction = await createPrediction(client, model, input)
  while (!['succeeded', 'failed', 'canceled'].includes(prediction.status)) {
    if (Date.now() >= deadline) {
      throw new Error(`Replicate ${model} did not finish within ${timeoutMs}ms`)
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    prediction = await client.predictions.get(prediction.id)
  }

  if (prediction.status !== 'succeeded') {
    const reason = prediction.error ? String(prediction.error) : prediction.status
    throw new Error(`Replicate ${model} ${prediction.status}: ${reason}`)
  }
  return prediction.output
}

const EXTENSION_CONTENT_TYPE: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

/** Output CDNs sometimes serve `application/octet-stream`; fall back to the URL's extension. */
export function replicateImageContentType(header: string | null, url: string): string {
  if (header?.startsWith('image/')) return header.split(';')[0]
  const ext = /\.([a-z0-9]+)(?:$|[?#])/i.exec(url)?.[1]?.toLowerCase()
  return (ext && EXTENSION_CONTENT_TYPE[ext]) || 'image/png'
}

export async function generateImageWithReplicate(request: ReplicateImageRequest): Promise<string[]> {
  const output = await runReplicatePrediction(request.model, buildReplicateImageInput(request))
  return replicateOutputUrls(output)
}

export async function runReplicateModel(
  model: string,
  input: Record<string, unknown>
): Promise<unknown> {
  return runReplicatePrediction(model, input)
}
