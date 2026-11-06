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

export interface ChatCompletionResult {
  content: string
  usage: { prompt_tokens: number; completion_tokens: number }
  model: string
}

type LlmProvider = 'openrouter' | 'azure'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini'
const AZURE_API_VERSION = '2024-08-01-preview'

export function getLlmProvider(): LlmProvider {
  const raw = (getServerEnv('LLM_PROVIDER', false) || 'openrouter').trim().toLowerCase()
  return raw === 'azure' ? 'azure' : 'openrouter'
}

export function getLlmModelName(): string {
  if (getLlmProvider() === 'azure') {
    return getServerEnv('AZURE_OPENAI_DEPLOYMENT_GPT', false) || 'gpt-4o-mini'
  }
  return getServerEnv('OPENROUTER_MODEL', false) || DEFAULT_OPENROUTER_MODEL
}

async function openRouterChat(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const apiKey = getServerEnv('OPENROUTER_API_KEY')
  const model = getServerEnv('OPENROUTER_MODEL', false) || DEFAULT_OPENROUTER_MODEL

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
  // Optional attribution headers recommended by OpenRouter.
  const referer = getServerEnv('OPENROUTER_SITE_URL', false) || getServerEnv('VITE_APP_URL', false)
  if (referer) headers['HTTP-Referer'] = referer
  headers['X-Title'] = getServerEnv('OPENROUTER_APP_TITLE', false) || 'Jigi'

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1000,
      response_format: options.response_format,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
    },
    model: data.model || model,
  }
}

async function azureChat(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const endpoint = getServerEnv('AZURE_OPENAI_ENDPOINT')
  const apiKey = getServerEnv('AZURE_OPENAI_API_KEY')
  const deploymentName = getServerEnv('AZURE_OPENAI_DEPLOYMENT_GPT', false) || 'gpt-4o-mini'

  const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${AZURE_API_VERSION}`

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
    const errorText = await response.text().catch(() => '')
    throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
    },
    model: deploymentName,
  }
}

/**
 * Provider-agnostic chat completion.
 * Defaults to OpenRouter (LLM_PROVIDER=openrouter); set LLM_PROVIDER=azure to
 * use the legacy Azure OpenAI deployment while it remains available.
 */
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  return getLlmProvider() === 'azure'
    ? azureChat(options)
    : openRouterChat(options)
}
