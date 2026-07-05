import { getServerEnv } from './env.js'
import { getSupabaseAdmin } from './supabase.js'
import { hasFoundryFluxConfig, hasAzureImageConfig, getImageRoutingProviderMode } from './image-routing.js'
import { getLlmProvider, getLlmModelName, createChatCompletion } from './llm.js'

interface CheckResult {
  ok: boolean
  detail?: string
}

interface DeepHealthResult {
  ok: boolean
  timestamp: string
  checks: Record<string, CheckResult>
}

function envPresent(key: string): CheckResult {
  try {
    const val = getServerEnv(key, false)
    return { ok: !!val, detail: val ? 'set' : 'missing' }
  } catch {
    return { ok: false, detail: 'error reading' }
  }
}

async function checkSupabase(): Promise<CheckResult> {
  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin.from('campaigns').select('id').limit(1)
    if (error) return { ok: false, detail: `query error: ${error.message}` }
    return { ok: true, detail: 'reachable' }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

async function checkDbSchema(): Promise<CheckResult> {
  try {
    const admin = getSupabaseAdmin()

    const checks = await Promise.all([
      admin.from('campaigns').select('id,generation_mode').limit(1),
      admin.from('generation_log').select('id,image_provider,image_tier,routing_reason,cost_bucket,copy_prompt_revision').limit(1),
      admin.from('image_routing_events').select('id').limit(1),
      admin.from('creative_assets').select('id,generation_mode').limit(1),
    ])

    const failures = checks
      .map((r, i) => ({ table: ['campaigns', 'generation_log', 'image_routing_events', 'creative_assets'][i], error: r.error }))
      .filter((c) => c.error)

    if (failures.length) {
      return {
        ok: false,
        detail: failures.map((f) => `${f.table}: ${f.error!.message}`).join('; '),
      }
    }
    return { ok: true, detail: 'all tables/columns present' }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

async function checkStorageBucket(): Promise<CheckResult> {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.storage.listBuckets()
    if (error) return { ok: false, detail: `listBuckets error: ${error.message}` }
    const bucket = data?.find((b) => b.name === 'generated-images')
    return bucket
      ? { ok: true, detail: 'generated-images bucket exists' }
      : { ok: false, detail: 'generated-images bucket not found' }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

async function checkLlm(): Promise<CheckResult> {
  const provider = getLlmProvider()

  if (provider === 'azure') {
    const endpoint = getServerEnv('AZURE_OPENAI_ENDPOINT', false)
    const apiKey = getServerEnv('AZURE_OPENAI_API_KEY', false)
    if (!endpoint || !apiKey) {
      return { ok: false, detail: 'azure: missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY' }
    }
  } else if (!getServerEnv('OPENROUTER_API_KEY', false)) {
    return { ok: false, detail: 'openrouter: missing OPENROUTER_API_KEY' }
  }

  try {
    const result = await createChatCompletion({
      messages: [{ role: 'user', content: 'Say "ok"' }],
      max_tokens: 3,
    })
    return { ok: true, detail: `${provider} model=${result.model} reachable` }
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) }
  }
}

export async function runDeepHealthCheck(): Promise<DeepHealthResult> {
  const checks: Record<string, CheckResult> = {}

  checks['env_SUPABASE_URL'] = envPresent('SUPABASE_URL')
  checks['env_SUPABASE_SERVICE_ROLE_KEY'] = envPresent('SUPABASE_SERVICE_ROLE_KEY')
  const llmProvider = getLlmProvider()
  checks['env_LLM_PROVIDER'] = { ok: true, detail: llmProvider }
  if (llmProvider === 'azure') {
    checks['env_AZURE_OPENAI_ENDPOINT'] = envPresent('AZURE_OPENAI_ENDPOINT')
    checks['env_AZURE_OPENAI_API_KEY'] = envPresent('AZURE_OPENAI_API_KEY')
  } else {
    checks['env_OPENROUTER_API_KEY'] = envPresent('OPENROUTER_API_KEY')
    checks['llm_model'] = { ok: true, detail: getLlmModelName() }
  }

  checks['supabase_connectivity'] = await checkSupabase()
  checks['db_schema'] = await checkDbSchema()
  checks['storage_bucket'] = await checkStorageBucket()
  checks['llm_chat'] = await checkLlm()

  const mode = getImageRoutingProviderMode()
  checks['image_routing_mode'] = { ok: true, detail: mode }
  checks['image_provider_foundry_flux'] = {
    ok: hasFoundryFluxConfig(),
    detail: hasFoundryFluxConfig() ? 'configured' : 'missing env vars',
  }
  checks['image_provider_azure_openai'] = {
    ok: hasAzureImageConfig(),
    detail: hasAzureImageConfig() ? 'configured' : 'missing env vars',
  }

  const googleKey = getServerEnv('GOOGLE_AI_API_KEY', false)
  checks['image_provider_google_imagen'] = {
    ok: !!googleKey,
    detail: googleKey ? 'configured' : 'missing GOOGLE_AI_API_KEY',
  }

  const replicateToken = getServerEnv('REPLICATE_API_TOKEN', false)
  checks['image_provider_replicate'] = {
    ok: !!replicateToken,
    detail: replicateToken ? 'configured' : 'missing REPLICATE_API_TOKEN',
  }

  const allOk = Object.values(checks).every((c) => c.ok)
  return { ok: allOk, timestamp: new Date().toISOString(), checks }
}
