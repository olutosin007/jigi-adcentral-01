import { getServerEnv } from './env.js'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  response_format?: { type: 'json_object' } | { type: 'text' }
}

export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const endpoint = getServerEnv('AZURE_OPENAI_ENDPOINT')
  const apiKey = getServerEnv('AZURE_OPENAI_API_KEY')
  const deploymentName = getServerEnv('AZURE_OPENAI_DEPLOYMENT_GPT', false) || 'gpt-4o-mini'

  const apiVersion = '2024-08-01-preview'
  const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1000,
      response_format: options.response_format,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
    },
  }
}
