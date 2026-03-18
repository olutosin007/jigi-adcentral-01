import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, getAuthenticatedUser } from '../lib/supabase.js'

// Log uncaught errors to help debug 502s (errors before response is sent)
process.once('uncaughtException', (err) => {
  console.error('[api/generate/text] uncaughtException:', err?.message, err?.stack)
})
process.once('unhandledRejection', (reason) => {
  console.error('[api/generate/text] unhandledRejection:', reason)
})
import { createChatCompletion, type ChatMessage } from '../lib/azure-openai.js'
import { ensureDatabaseContract } from '../lib/schema-contract.js'

type GenerationType = 'concept' | 'copy' | 'compliance' | 'image_prompt_refine'

interface GenerateTextRequest {
  type: GenerationType
  campaign_id: string
  brand_id?: string
  prompt: string
  brand_context?: {
    name: string
    voice?: {
      tone?: string[]
      preferred_words?: string[]
      avoided_words?: string[]
    }
    identity?: {
      colours?: { primary?: string; secondary?: string }
    }
  }
  seed_idea?: string
  concept_context?: {
    theme: string
    headlines: string[]
    visual_direction: string
  }
  /** Prompt hash for audit; stored in generation_log when provided */
  prompt_hash?: string
  /** When true (concept/copy), use prompt as system message instead of user message */
  use_prompt_as_system?: boolean
}

const SYSTEM_PROMPTS: Record<GenerationType, string> = {
  concept: `You are a creative strategist for brand campaigns. Generate creative concepts that are:
- On-brand and aligned with the provided brand voice
- Fresh, memorable, and strategically sound
- Actionable with clear visual and copy directions

Respond in JSON format with this structure:
{
  "concepts": [
    {
      "theme": "string - the core creative theme",
      "headlines": ["string - 3 headline options"],
      "visual_direction": "string - guidance for visual execution",
      "rationale": "string - why this concept works for the brand"
    }
  ]
}`,

  copy: `You are a senior copywriter specializing in brand-aligned content. Generate copy that:
- Matches the brand's tone of voice exactly
- Uses preferred words and avoids restricted terms
- Is compelling, clear, and action-oriented

Respond in JSON format with this structure:
{
  "variations": [
    {
      "headline": "string - the main headline",
      "body": "string - supporting body copy",
      "cta": "string - call to action"
    }
  ]
}`,

  compliance: `You are a brand compliance checker. Review the provided content against brand guidelines and check for:
- Tone alignment with brand voice
- Use of preferred/avoided words
- Overall brand consistency
- Potential issues or concerns

Respond in JSON format with this structure:
{
  "passed": boolean,
  "score": number (0-100),
  "checks": [
    {
      "name": "string - check name",
      "status": "pass" | "warning" | "fail",
      "message": "string - explanation"
    }
  ],
  "suggestions": ["string - improvement suggestions"]
}`,

  image_prompt_refine: `You are an expert at writing professional image-generation prompts for advertising and brand creative.
Given a brief user description, expand it into a comprehensive prompt that:
- Preserves the user's intent exactly
- Adds professional image-generation details: composition, lighting, mood, style, quality
- Uses terminology suitable for models like Imagen, Flux, DALL-E
- Keeps the output concise (2-4 sentences) but specific enough for high-quality results
- If brand context is provided, subtly align style/mood with brand tone

Respond in JSON format:
{ "refined_prompt": "string - the expanded prompt" }`,
}

function buildUserPrompt(request: GenerateTextRequest): string {
  let prompt = request.prompt

  if (request.brand_context) {
    prompt += `\n\nBrand Context:
- Brand Name: ${request.brand_context.name}
- Tone: ${request.brand_context.voice?.tone?.join(', ') || 'Not specified'}
- Preferred Words: ${request.brand_context.voice?.preferred_words?.join(', ') || 'None specified'}
- Avoided Words: ${request.brand_context.voice?.avoided_words?.join(', ') || 'None specified'}`
  }

  if (request.seed_idea) {
    prompt += `\n\nStarting Idea: ${request.seed_idea}`
  }

  if (request.concept_context) {
    prompt += `\n\nConcept Context:
- Theme: ${request.concept_context.theme}
- Headlines: ${request.concept_context.headlines.join(', ')}
- Visual Direction: ${request.concept_context.visual_direction}`
  }

  return prompt
}

function normalizeParsedContent(
  type: GenerationType,
  parsed: unknown,
  originalPrompt?: string
): Record<string, unknown> {
  const content = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>

  if (type === 'concept') {
    const concepts = Array.isArray(content.concepts)
      ? content.concepts.slice(0, 2)
      : []
    return { concepts }
  }

  if (type === 'copy') {
    const source =
      Array.isArray(content.variations)
        ? content.variations
        : Array.isArray(content.variants)
        ? content.variants
        : []
    return { variations: source.slice(0, 2) }
  }

  if (type === 'image_prompt_refine') {
    const refined =
      typeof content.refined_prompt === 'string'
        ? content.refined_prompt
        : typeof content.raw === 'string'
        ? content.raw
        : originalPrompt || ''
    return { refined_prompt: refined }
  }

  return content
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    return await handleRequest(req, res)
  } catch (err) {
    console.error('[api/generate/text] Unhandled error:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Text generation failed',
    })
  }
}

async function handleRequest(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user, error: authError } = await getAuthenticatedUser(
    req.headers.authorization as string
  )

  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  const body = req.body as GenerateTextRequest

  if (!body.type || !body.campaign_id || !body.prompt) {
    return res.status(400).json({
      error: 'Missing required fields: type, campaign_id, prompt',
    })
  }

  if (!['concept', 'copy', 'compliance', 'image_prompt_refine'].includes(body.type)) {
    return res.status(400).json({
      error: 'Invalid type. Must be: concept, copy, compliance, or image_prompt_refine',
    })
  }

  const startTime = Date.now()
  const supabaseAdmin = getSupabaseAdmin()

  try {
    await ensureDatabaseContract(supabaseAdmin)

    const usePromptAsSystem =
      body.use_prompt_as_system === true && (body.type === 'concept' || body.type === 'copy')
    const userPrompt =
      body.type === 'concept'
        ? 'Generate 2 concepts per the instructions above. Return valid JSON.'
        : body.type === 'copy'
        ? 'Generate 2 copy variants per the instructions above. Return valid JSON with a "variations" array.'
        : ''
    const messages: ChatMessage[] = usePromptAsSystem
      ? [
          { role: 'system', content: body.prompt },
          { role: 'user', content: userPrompt || 'Generate per the instructions above. Return valid JSON.' },
        ]
      : [
          { role: 'system', content: SYSTEM_PROMPTS[body.type] },
          { role: 'user', content: buildUserPrompt(body) },
        ]

    const { content, usage } = await createChatCompletion({
      messages,
      temperature: body.type === 'compliance' ? 0.3 : 0.7,
      max_tokens:
        body.type === 'concept'
          ? 1500
          : body.type === 'image_prompt_refine'
          ? 500
          : 1000,
      response_format: { type: 'json_object' },
    })

    const latencyMs = Date.now() - startTime

    let parsedContent: Record<string, unknown>
    try {
      parsedContent = normalizeParsedContent(body.type, JSON.parse(content), body.prompt)
    } catch {
      parsedContent =
        body.type === 'image_prompt_refine'
          ? { refined_prompt: content || body.prompt }
          : { raw: content }
    }

    await supabaseAdmin.from('generation_log').insert({
      user_id: user.id,
      brand_id: body.brand_id || null,
      campaign_id: body.campaign_id,
      type: body.type,
      model: 'gpt-4o-mini',
      generation_mode: body.brand_id ? 'brand_grounded' : 'idea_first',
      status: 'success',
      latency_ms: latencyMs,
      tokens_used: usage.prompt_tokens + usage.completion_tokens,
      prompt_hash: body.prompt_hash || null,
    })

    return res.json({
      content: parsedContent,
      type: body.type,
      model: 'gpt-4o-mini',
      latency_ms: latencyMs,
      tokens_used: usage.prompt_tokens + usage.completion_tokens,
    })
  } catch (error) {
    const latencyMs = Date.now() - startTime

    await supabaseAdmin.from('generation_log').insert({
      user_id: user.id,
      brand_id: body.brand_id || null,
      campaign_id: body.campaign_id,
      type: body.type,
      model: 'gpt-4o-mini',
      generation_mode: body.brand_id ? 'brand_grounded' : 'idea_first',
      status: 'error',
      latency_ms: latencyMs,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      prompt_hash: body.prompt_hash || null,
    })

    console.error('Text generation error:', error)

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Text generation failed',
    })
  }
}

