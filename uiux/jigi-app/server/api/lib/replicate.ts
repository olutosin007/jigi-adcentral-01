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

export interface FluxGenerationOptions {
  prompt: string
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21'
  num_outputs?: number
  output_format?: 'webp' | 'jpg' | 'png'
  output_quality?: number
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

export async function generateImageWithFlux(
  options: FluxGenerationOptions
): Promise<string[]> {
  return generateImageWithReplicateModel('black-forest-labs/flux-schnell', options)
}

export async function generateImageWithReplicateModel(
  model: string,
  options: FluxGenerationOptions
): Promise<string[]> {
  const output = await runReplicatePrediction(model, {
    prompt: options.prompt,
    aspect_ratio: options.aspect_ratio || '1:1',
    num_outputs: options.num_outputs || 1,
    output_format: options.output_format || 'webp',
    output_quality: options.output_quality || 90,
  })
  return replicateOutputUrls(output)
}

export async function runReplicateModel(
  model: string,
  input: Record<string, unknown>
): Promise<unknown> {
  return runReplicatePrediction(model, input)
}

export async function generateImageWithFluxDev(
  options: FluxGenerationOptions
): Promise<string[]> {
  return generateImageWithReplicateModel('black-forest-labs/flux-dev', {
    ...options,
    output_quality: options.output_quality || 90,
  })
}
