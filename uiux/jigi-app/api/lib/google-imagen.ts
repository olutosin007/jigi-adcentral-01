import { getServerEnv } from './env.js'

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4'

interface GoogleImagenOptions {
  prompt: string
  model: string
  aspectRatio: AspectRatio
}

interface GoogleImagenResponse {
  imageBase64?: string
  imageUrl?: string
  revisedPrompt?: string
}

function extractImageFromPrediction(prediction: unknown): GoogleImagenResponse {
  if (!prediction || typeof prediction !== 'object') {
    return {}
  }

  const payload = prediction as Record<string, unknown>
  const bytesCandidate =
    payload.bytesBase64Encoded ||
    payload.imageBytes ||
    payload.b64_json
  const urlCandidate =
    payload.uri ||
    payload.url ||
    payload.imageUrl
  const revisedPrompt =
    typeof payload.enhancedPrompt === 'string'
      ? payload.enhancedPrompt
      : typeof payload.revisedPrompt === 'string'
      ? payload.revisedPrompt
      : undefined

  return {
    imageBase64:
      typeof bytesCandidate === 'string' ? bytesCandidate : undefined,
    imageUrl: typeof urlCandidate === 'string' ? urlCandidate : undefined,
    revisedPrompt,
  }
}

async function fetchGoogleImagenResult(
  options: GoogleImagenOptions
): Promise<GoogleImagenResponse> {
  const apiKey = getServerEnv('GOOGLE_AI_API_KEY')
  const endpointBase =
    getServerEnv('GOOGLE_IMAGEN_ENDPOINT_BASE', false) ||
    'https://generativelanguage.googleapis.com/v1beta'
  const url = `${endpointBase}/models/${options.model}:predict?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt: options.prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: options.aspectRatio,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Imagen API error: ${response.status} - ${errorText}`)
  }

  const data = (await response.json()) as Record<string, unknown>
  const predictions = Array.isArray(data.predictions) ? data.predictions : []
  const firstPrediction = predictions[0]
  const parsed = extractImageFromPrediction(firstPrediction)

  if (!parsed.imageBase64 && !parsed.imageUrl) {
    throw new Error('Google Imagen API did not return an image payload')
  }

  return parsed
}

export async function generateImageWithGoogleImagen(
  options: GoogleImagenOptions
): Promise<{
  buffer: ArrayBuffer
  contentType: string
  model: string
  revisedPrompt?: string
}> {
  const result = await fetchGoogleImagenResult(options)

  if (result.imageBase64) {
    const imageBuffer = Buffer.from(result.imageBase64, 'base64')
    return {
      buffer: imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength
      ),
      contentType: 'image/png',
      model: options.model,
      revisedPrompt: result.revisedPrompt,
    }
  }

  const imageUrl = result.imageUrl as string
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error('Failed to fetch Google Imagen generated image')
  }

  return {
    buffer: await imageResponse.arrayBuffer(),
    contentType: imageResponse.headers.get('content-type') || 'image/png',
    model: options.model,
    revisedPrompt: result.revisedPrompt,
  }
}
