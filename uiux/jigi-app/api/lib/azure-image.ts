import { getServerEnv } from './env.js'

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4'

interface AzureImageOptions {
  prompt: string
  aspectRatio: AspectRatio
  deployment?: string
}

/** GPT Image family uses 1024×1024, 1536×1024, 1024×1536 (no 1792). */
const GPT_IMAGE_SIZES: Record<AspectRatio, '1024x1024' | '1536x1024' | '1024x1536'> = {
  '1:1': '1024x1024',
  '16:9': '1536x1024',
  '9:16': '1024x1536',
  '4:3': '1536x1024',
  '3:4': '1024x1536',
}

/** DALL·E 3 sizes (deprecated Mar 2026; use GPT Image instead). */
function dallESize(aspectRatio: AspectRatio): '1024x1024' | '1792x1024' | '1024x1792' {
  if (aspectRatio === '16:9' || aspectRatio === '4:3') return '1792x1024'
  if (aspectRatio === '9:16' || aspectRatio === '3:4') return '1024x1792'
  return '1024x1024'
}

function isGptImageDeployment(deployment: string): boolean {
  return /gpt-image/i.test(deployment)
}

export async function generateImageWithAzure(
  options: AzureImageOptions
): Promise<{ imageUrl: string; model: string; revisedPrompt?: string }> {
  const endpoint = getServerEnv('AZURE_OPENAI_ENDPOINT')
  const apiKey = getServerEnv('AZURE_OPENAI_API_KEY')
  const deployment =
    options.deployment ||
    getServerEnv('AZURE_OPENAI_DEPLOYMENT_DALLE', false) ||
    getServerEnv('AZURE_OPENAI_IMAGE_DEPLOYMENT', false) ||
    'gpt-image-1-mini'
  const apiVersion =
    getServerEnv('AZURE_OPENAI_IMAGE_API_VERSION', false) || '2025-04-01-preview'
  const useGptImage = isGptImageDeployment(deployment)
  const size = useGptImage ? GPT_IMAGE_SIZES[options.aspectRatio] : dallESize(options.aspectRatio)
  const quality = useGptImage ? 'medium' : 'standard'

  const url = `${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`

  const body = {
    prompt: options.prompt,
    size,
    quality,
    n: 1,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Azure image API error: ${response.status} - ${errorText}`)
  }

  const data = (await response.json()) as {
    data?: Array<{ url?: string; b64_json?: string; revised_prompt?: string }>
  }
  const first = data.data?.[0]
  if (!first) {
    throw new Error('Azure image API did not return image data')
  }

  let imageUrl: string
  if (first.url) {
    imageUrl = first.url
  } else if (first.b64_json) {
    imageUrl = `data:image/png;base64,${first.b64_json}`
  } else {
    throw new Error('Azure image API did not return an image URL or b64_json')
  }

  return {
    imageUrl,
    revisedPrompt: first.revised_prompt,
    model: deployment,
  }
}
