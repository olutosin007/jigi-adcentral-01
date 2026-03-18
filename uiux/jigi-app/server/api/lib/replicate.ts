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

export async function generateImageWithFlux(
  options: FluxGenerationOptions
): Promise<string[]> {
  return generateImageWithReplicateModel('black-forest-labs/flux-schnell', options)
}

export async function generateImageWithReplicateModel(
  model: string,
  options: FluxGenerationOptions
): Promise<string[]> {
  const replicate = getReplicateClient()
  const output = await replicate.run(model, {
    input: {
      prompt: options.prompt,
      aspect_ratio: options.aspect_ratio || '1:1',
      num_outputs: options.num_outputs || 1,
      output_format: options.output_format || 'webp',
      output_quality: options.output_quality || 90,
    },
  })

  return output as string[]
}

export async function generateImageWithFluxDev(
  options: FluxGenerationOptions
): Promise<string[]> {
  return generateImageWithReplicateModel('black-forest-labs/flux-dev', {
    ...options,
    output_quality: options.output_quality || 90,
  })
}

