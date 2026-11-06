import { getServerEnv } from './env.js'
import type { ImageResolution } from './image-models.js'

export interface GeminiImageOptions {
  prompt: string
  model: string
  aspectRatio: string
  resolution?: ImageResolution
}

export interface GeneratedImage {
  buffer: ArrayBuffer
  contentType: string
  model: string
}

/** Flash Lite Image only renders at 1K. */
const ONE_K_ONLY_MODELS = new Set(['gemini-3.1-flash-lite-image'])

export function buildGeminiImageRequest(options: GeminiImageOptions) {
  const imageSize = ONE_K_ONLY_MODELS.has(options.model) ? '1K' : options.resolution ?? '1K'
  return {
    contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: options.aspectRatio, imageSize },
    },
  }
}

interface InlineDataPart {
  inlineData?: { mimeType?: string; data?: string }
  inline_data?: { mime_type?: string; data?: string }
}

export function extractGeminiImage(
  payload: unknown
): { base64: string; mimeType: string } | null {
  const candidates = (payload as { candidates?: Array<{ content?: { parts?: InlineDataPart[] } }> })
    ?.candidates
  for (const candidate of candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const camel = part.inlineData
      if (camel?.data) return { base64: camel.data, mimeType: camel.mimeType || 'image/png' }
      const snake = part.inline_data
      if (snake?.data) return { base64: snake.data, mimeType: snake.mime_type || 'image/png' }
    }
  }
  return null
}

export async function generateImageWithGemini(
  options: GeminiImageOptions
): Promise<GeneratedImage> {
  const apiKey = getServerEnv('GOOGLE_AI_API_KEY')
  const base =
    getServerEnv('GOOGLE_IMAGE_ENDPOINT_BASE', false) ||
    getServerEnv('GOOGLE_IMAGEN_ENDPOINT_BASE', false) ||
    'https://generativelanguage.googleapis.com/v1beta'

  const response = await fetch(`${base}/models/${options.model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(buildGeminiImageRequest(options)),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Gemini image API error: ${response.status} - ${errorText}`)
  }

  const image = extractGeminiImage(await response.json())
  if (!image) {
    throw new Error('Google Gemini image API returned no image (prompt may have been blocked)')
  }

  const bytes = Buffer.from(image.base64, 'base64')
  return {
    buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    contentType: image.mimeType,
    model: options.model,
  }
}
