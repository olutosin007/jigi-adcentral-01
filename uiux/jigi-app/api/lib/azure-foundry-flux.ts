import { getServerEnv } from './env.js'

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4'

interface FoundryFluxOptions {
  prompt: string
  aspectRatio: AspectRatio
  width?: number
  height?: number
}

/** Flux-compatible dimensions (multiples of 64, within 256–1536). */
const ASPECT_RATIO_DIMENSIONS: Record<
  AspectRatio,
  { width: number; height: number }
> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1024, height: 768 },
  '3:4': { width: 768, height: 1024 },
}

export async function generateImageWithFoundryFlux(
  options: FoundryFluxOptions
): Promise<{
  buffer: ArrayBuffer
  contentType: string
  model: string
}> {
  const endpoint = getServerEnv('AZURE_FOUNDRY_FLUX_ENDPOINT')
  const apiKey = getServerEnv('AZURE_FOUNDRY_FLUX_API_KEY')

  const dims =
    options.width != null && options.height != null
      ? { width: options.width, height: options.height }
      : ASPECT_RATIO_DIMENSIONS[options.aspectRatio]

  const body = {
    prompt: options.prompt,
    width: dims.width,
    height: dims.height,
    model: 'flux-2-flex',
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Azure Foundry Flux API error: ${response.status} - ${errorText}`)
  }

  const data = (await response.json()) as {
    data?: Array<{ b64_json?: string }>
  }
  const first = data.data?.[0]
  if (!first?.b64_json) {
    throw new Error('Azure Foundry Flux API did not return image data')
  }

  const imageBuffer = Buffer.from(first.b64_json, 'base64')
  return {
    buffer: imageBuffer.buffer.slice(
      imageBuffer.byteOffset,
      imageBuffer.byteOffset + imageBuffer.byteLength
    ),
    contentType: 'image/png',
    model: 'flux-2-flex',
  }
}
