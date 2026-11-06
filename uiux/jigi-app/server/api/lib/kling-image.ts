import { createHmac } from 'node:crypto'
import { getNumberEnv, getServerEnv } from './env.js'
import type { ImageResolution } from './image-models.js'
import type { GeneratedImage } from './google-gemini-image.js'

export interface KlingImageOptions {
  prompt: string
  model: string
  aspectRatio: string
  resolution?: ImageResolution
  /** Test seams; production uses env defaults. */
  pollIntervalMs?: number
  timeoutMs?: number
}

const KLING_ASPECT_RATIOS = new Set(['16:9', '9:16', '1:1', '4:3', '3:4', '3:2', '2:3', '21:9'])
const KLING_ASPECT_FALLBACK: Record<string, string> = { '4:5': '3:4', '5:4': '4:3' }
const KLING_2K_MODELS = new Set(['kling-v3'])
const PROMPT_MAX_CHARS = 2500

export function hasKlingConfig(): boolean {
  return Boolean(
    getServerEnv('KLING_API_KEY', false) ||
      (getServerEnv('KLING_ACCESS_KEY', false) && getServerEnv('KLING_SECRET_KEY', false))
  )
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

/** HS256 JWT for Kling's legacy Access Key / Secret Key auth. */
export function signKlingJwt(accessKey: string, secretKey: string, nowSec = Math.floor(Date.now() / 1000)): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({ iss: accessKey, exp: nowSec + 1800, nbf: nowSec - 5 }))
  const signature = createHmac('sha256', secretKey).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

export function getKlingAuthHeader(): string {
  const apiKey = getServerEnv('KLING_API_KEY', false)
  if (apiKey) return `Bearer ${apiKey}`
  const accessKey = getServerEnv('KLING_ACCESS_KEY', false)
  const secretKey = getServerEnv('KLING_SECRET_KEY', false)
  if (accessKey && secretKey) return `Bearer ${signKlingJwt(accessKey, secretKey)}`
  throw new Error('Missing Kling credentials: set KLING_API_KEY or KLING_ACCESS_KEY + KLING_SECRET_KEY')
}

export function buildKlingImageRequest(options: KlingImageOptions) {
  const aspect = KLING_ASPECT_RATIOS.has(options.aspectRatio)
    ? options.aspectRatio
    : KLING_ASPECT_FALLBACK[options.aspectRatio] ?? '1:1'
  return {
    model_name: options.model,
    prompt: options.prompt.slice(0, PROMPT_MAX_CHARS),
    aspect_ratio: aspect,
    n: 1,
    ...(options.resolution && options.resolution !== '1K' && KLING_2K_MODELS.has(options.model)
      ? { resolution: '2k' }
      : {}),
  }
}

interface KlingEnvelope {
  code?: number
  message?: string
  data?: {
    task_id?: string
    task_status?: 'submitted' | 'processing' | 'succeed' | 'failed'
    task_status_msg?: string
    task_result?: { images?: Array<{ url?: string }> }
  }
}

async function klingFetch(url: string, init: RequestInit): Promise<KlingEnvelope> {
  const response = await fetch(url, init)
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Kling API error: ${response.status} - ${text}`)
  }
  const body = JSON.parse(text) as KlingEnvelope
  if (body.code && body.code !== 0) {
    throw new Error(`Kling API error: code ${body.code} - ${body.message ?? 'unknown'}`)
  }
  return body
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function generateImageWithKling(options: KlingImageOptions): Promise<GeneratedImage> {
  const base = getServerEnv('KLING_API_BASE', false) || 'https://api-singapore.klingai.com'
  const timeoutMs = options.timeoutMs ?? getNumberEnv('KLING_POLL_TIMEOUT_MS', 40_000)
  const pollIntervalMs = options.pollIntervalMs ?? 2_000
  const headers = { 'Content-Type': 'application/json', Authorization: getKlingAuthHeader() }

  const created = await klingFetch(`${base}/v1/images/generations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(buildKlingImageRequest(options)),
  })
  const taskId = created.data?.task_id
  if (!taskId) throw new Error('Kling API did not return a task_id')

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await sleep(pollIntervalMs)
    const polled = await klingFetch(`${base}/v1/images/generations/${taskId}`, {
      method: 'GET',
      headers,
    })
    const status = polled.data?.task_status
    if (status === 'failed') {
      throw new Error(`Kling task failed: ${polled.data?.task_status_msg || 'no reason given'}`)
    }
    if (status === 'succeed') {
      const url = polled.data?.task_result?.images?.[0]?.url
      if (!url) throw new Error('Kling task succeeded without an image URL')
      // Kling purges results after 30 days, so the bytes are copied to our storage now.
      const imageResponse = await fetch(url)
      if (!imageResponse.ok) throw new Error('Failed to fetch Kling generated image')
      return {
        buffer: await imageResponse.arrayBuffer(),
        contentType: imageResponse.headers.get('content-type') || 'image/png',
        model: options.model,
      }
    }
  }
  // Worded to avoid "timeout": a same-provider retry would blow the function budget; fall through to the next lane instead.
  throw new Error(`Kling task ${taskId} did not finish within ${timeoutMs}ms`)
}
