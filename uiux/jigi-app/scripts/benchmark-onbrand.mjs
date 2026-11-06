#!/usr/bin/env node
/**
 * On-brand creative benchmark.
 *
 * Drives the REAL generation pipeline (POST /api/generate/text + /image) using
 * the REAL prompt builders (src/lib/ai/prompts.ts) against a golden Coca-Cola
 * brand fixture, then scores each output with deterministic rules + an
 * LLM-as-judge (text and image vision). Writes a JSON scorecard to
 * scripts/benchmark/results/.
 *
 * Run (requires `pnpm dev:api` on API_BASE):
 *   pnpm benchmark:onbrand
 *   pnpm benchmark:onbrand -- --briefs=summer_refresh,genz_music --no-image
 *
 * Flags:
 *   --brand=coke|invented   which golden fixture to run (default: coke)
 *   --briefs=a,b            only run these brief ids (default: all)
 *   --no-image              skip image generation + vision judge
 *   --no-judge              skip the LLM-as-judge (deterministic scores only)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

import { buildConceptPrompt, buildCopyPrompt, buildImagePrompt } from '../src/lib/ai/prompts.ts'
import { DEFAULT_BRAND_INCLUDE } from '../src/lib/ai/types.ts'
import { cocaColaBrand, briefs as cocaBriefs, thresholds } from './benchmark/coca-cola.fixture.mjs'
import { inventedBrand, briefs as inventedBriefs } from './benchmark/invented-brand.fixture.mjs'
import { scoreConcept, scoreCopyVariant, aggregate, compositeOnBrand } from './benchmark/scoring.mjs'
import { judgeText, judgeImage } from './benchmark/judge.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Env + clients
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found')
  const result = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    result[trimmed.slice(0, eq).trim()] = val
  }
  return result
}

const env = loadEnv()
const API_BASE = (process.env.API_BASE || 'http://localhost:3000').replace(/\/$/, '')
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY
const JUDGE_MODEL = env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

const args = process.argv.slice(2)
const briefFilter = (args.find((a) => a.startsWith('--briefs=')) || '').replace('--briefs=', '')
const skipImage = args.includes('--no-image')
const skipJudge = args.includes('--no-judge') || !OPENROUTER_API_KEY

// --brand=coke|invented : pick which golden fixture to benchmark against.
const brandKey = ((args.find((a) => a.startsWith('--brand=')) || '').replace('--brand=', '') || 'coke').toLowerCase()
const BRAND_SETS = {
  coke: { brand: cocaColaBrand, briefs: cocaBriefs },
  invented: { brand: inventedBrand, briefs: inventedBriefs },
}
const brandSet = BRAND_SETS[brandKey] || BRAND_SETS.coke
const brand = brandSet.brand
const briefs = brandSet.briefs

const TEST_EMAIL = 'e2e-test@jigi.local'
const TEST_PASSWORD = 'e2e-test-password-12345!'

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// Auth + campaign
// ---------------------------------------------------------------------------
async function getOrCreateTestUser() {
  const { data: list } = await adminClient.auth.admin.listUsers()
  const existing = list?.users?.find((u) => u.email === TEST_EMAIL)
  if (existing) {
    const { data, error } = await anonClient.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD })
    if (error) {
      await adminClient.auth.admin.updateUserById(existing.id, { password: TEST_PASSWORD })
      const retry = await anonClient.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD })
      if (retry.error) throw new Error(`Cannot sign in: ${retry.error.message}`)
      return { session: retry.data.session, userId: existing.id }
    }
    return { session: data.session, userId: existing.id }
  }
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true,
  })
  if (createErr) throw new Error(`Cannot create test user: ${createErr.message}`)
  const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD })
  if (signInErr) throw new Error(`Cannot sign in new user: ${signInErr.message}`)
  return { session: signIn.session, userId: created.user.id }
}

async function getOrCreateBenchmarkCampaign(userId) {
  const NAME = `On-Brand Benchmark — ${brand.name}`
  const { data: existing } = await adminClient
    .from('campaigns').select('id').eq('name', NAME).limit(1).maybeSingle()
  if (existing?.id) return existing.id
  const { data: created, error } = await adminClient
    .from('campaigns')
    .insert({
      name: NAME,
      created_by: userId,
      generation_mode: 'idea_first',
      brief: { objective: 'On-brand benchmarking harness', audience: 'n/a', channels: ['meta_feed'] },
      status: 'draft',
    })
    .select('id').single()
  if (error) throw new Error(`Cannot create campaign: ${error.message}`)
  return created.id
}

// ---------------------------------------------------------------------------
// Brand context helpers (what the real client sends to the API)
// ---------------------------------------------------------------------------
function colourByRole(role) {
  return brand.identity.colours.find((c) => c.role === role)?.hex
}
const conceptBrandContext = {
  name: brand.name,
  voice: {
    tone: brand.voice.tone,
    preferred_words: brand.voice.preferred_words,
    avoided_words: brand.voice.avoided_words,
  },
  identity: { colours: { primary: colourByRole('primary'), secondary: colourByRole('secondary') } },
}
const imageBrandContext = {
  name: brand.name,
  voice: { tone: brand.voice.tone },
  identity: {
    colours: { primary: colourByRole('primary'), secondary: colourByRole('secondary'), accent: colourByRole('text') },
    logo_url: brand.identity.logo_url,
  },
}

async function apiPost(p, body, token) {
  const res = await fetch(`${API_BASE}${p}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data }
}

// ---------------------------------------------------------------------------
// Per-brief run
// ---------------------------------------------------------------------------
async function runBrief(brief, campaignId, token) {
  const out = { id: brief.id, label: brief.label, errors: [] }

  // 1. Concept (real brand-grounded prompt)
  const conceptPrompt = buildConceptPrompt(brand, brief.brief)
  const conceptRes = await apiPost('/api/generate/text', {
    type: 'concept', campaign_id: campaignId, prompt: conceptPrompt, brand_context: conceptBrandContext,
  }, token)
  const concepts = conceptRes.data?.content?.concepts || []
  if (!conceptRes.ok || !concepts.length) {
    out.errors.push(`concept: ${conceptRes.status} ${JSON.stringify(conceptRes.data).slice(0, 160)}`)
  }
  const conceptScores = concepts.map((c) => scoreConcept(c, brand, brief, thresholds))
  out.concepts = concepts.map((c, i) => ({
    theme: c.theme, headlines: c.headlines, visual_direction: c.visual_direction,
    brand_alignment_score: c.brand_alignment_score, score: conceptScores[i],
  }))
  out.conceptScore = aggregate(conceptScores)
  const topIdx = conceptScores.reduce((best, s, i, arr) => (s.score > arr[best].score ? i : best), 0)
  const topConcept = concepts[topIdx]

  // 2. Copy (real brand-grounded prompt, anchored to top concept).
  // Pass the brief's channel budget so the prompt targets the same limit we score against.
  const copyPrompt = buildCopyPrompt(brand, brief.brief, brief.copyFormat, undefined, {
    primaryMax: brief.channelCharLimit,
  })
  const copyRes = await apiPost('/api/generate/text', {
    type: 'copy', campaign_id: campaignId, prompt: copyPrompt, brand_context: conceptBrandContext,
    concept_context: topConcept
      ? { theme: topConcept.theme, headlines: topConcept.headlines || [], visual_direction: topConcept.visual_direction || '' }
      : undefined,
  }, token)
  const variants = copyRes.data?.content?.variations || copyRes.data?.content?.variants || []
  if (!copyRes.ok || !variants.length) {
    out.errors.push(`copy: ${copyRes.status} ${JSON.stringify(copyRes.data).slice(0, 160)}`)
  }
  const copyScores = variants.map((v) => scoreCopyVariant(v, brand, brief, thresholds))
  out.copy = variants.map((v, i) => {
    const content = v.content || v
    return { headline: content.headline, body: content.body, cta: content.cta, score: copyScores[i] }
  })
  out.copyScore = aggregate(copyScores)

  // 3. Image (real brand-grounded image prompt)
  if (!skipImage) {
    const scene = topConcept?.visual_direction || brief.imageDescription
    const imagePrompt = buildImagePrompt(brand, scene, undefined, DEFAULT_BRAND_INCLUDE)
    const imageRes = await apiPost('/api/generate/image', {
      prompt: imagePrompt, campaign_id: campaignId, image_tier: 'draft', brand_context: imageBrandContext,
    }, token)
    if (imageRes.ok && imageRes.data?.image_url) {
      out.image = { url: imageRes.data.image_url, provider: imageRes.data.image_provider, model: imageRes.data.model, prompt: imagePrompt }
    } else {
      out.errors.push(`image: ${imageRes.status} ${JSON.stringify(imageRes.data).slice(0, 160)}`)
    }
  }

  // 4. LLM-as-judge
  if (!skipJudge) {
    try {
      out.textJudge = await judgeText({
        apiKey: OPENROUTER_API_KEY, model: JUDGE_MODEL, brand, brief,
        concepts: out.concepts, copyVariants: out.copy,
      })
    } catch (e) { out.errors.push(`textJudge: ${e.message}`) }

    if (out.image?.url) {
      try {
        out.imageJudge = await judgeImage({
          apiKey: OPENROUTER_API_KEY, model: JUDGE_MODEL, brand, brief, imageUrl: out.image.url,
        })
      } catch (e) { out.errors.push(`imageJudge: ${e.message}`) }
    }
  }

  // 5. Composite (blend deterministic + judge where available)
  const conceptBlend = out.textJudge?.brand_fit != null
    ? Math.round((out.conceptScore + out.textJudge.brand_fit) / 2) : out.conceptScore
  const copyBlend = out.textJudge?.tone_fit != null
    ? Math.round((out.copyScore + out.textJudge.tone_fit) / 2) : out.copyScore
  const imageScore = out.imageJudge?.overall != null ? out.imageJudge.overall : (out.image ? null : undefined)
  out.composite = compositeOnBrand({
    conceptScore: conceptBlend, copyScore: copyBlend,
    imageScore: imageScore === undefined ? null : imageScore,
  })
  out.pass = out.composite >= thresholds.compositePass
  return out
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n🎯 On-Brand Benchmark (${brand.name}) → ${API_BASE}`)
  console.log(`   judge: ${skipJudge ? 'OFF' : JUDGE_MODEL} | image: ${skipImage ? 'OFF' : 'ON'}\n`)

  const { session, userId } = await getOrCreateTestUser()
  const token = session.access_token
  const campaignId = await getOrCreateBenchmarkCampaign(userId)
  console.log(`Auth ok (${userId.slice(0, 8)}…), campaign ${campaignId.slice(0, 8)}…\n`)

  const selected = briefFilter
    ? briefs.filter((b) => briefFilter.split(',').includes(b.id))
    : briefs

  const results = []
  for (const brief of selected) {
    process.stdout.write(`▶ ${brief.label} … `)
    const r = await runBrief(brief, campaignId, token)
    results.push(r)
    console.log(`composite ${r.composite}/100 ${r.pass ? '✅' : '❌'}${r.errors.length ? `  (${r.errors.length} err)` : ''}`)
  }

  const overall = results.length ? Math.round(results.reduce((s, r) => s + r.composite, 0) / results.length) : 0
  const report = {
    generated_at: new Date().toISOString(),
    api_base: API_BASE,
    judge_model: skipJudge ? null : JUDGE_MODEL,
    image_enabled: !skipImage,
    brand: brand.name,
    thresholds,
    overall_composite: overall,
    results,
  }

  const resultsDir = path.resolve(__dirname, 'benchmark', 'results')
  fs.mkdirSync(resultsDir, { recursive: true })
  const stamp = report.generated_at.replace(/[:.]/g, '-')
  fs.writeFileSync(path.join(resultsDir, `${stamp}.json`), JSON.stringify(report, null, 2))
  fs.writeFileSync(path.join(resultsDir, 'latest.json'), JSON.stringify(report, null, 2))

  console.log('\n' + '='.repeat(64))
  console.log(`OVERALL ON-BRAND: ${overall}/100  (pass mark ${thresholds.compositePass})`)
  console.log('='.repeat(64))
  for (const r of results) {
    console.log(`  ${r.pass ? '✅' : '❌'} ${r.label.padEnd(34)} concept ${String(r.conceptScore).padStart(3)} | copy ${String(r.copyScore).padStart(3)} | img ${r.imageJudge?.overall ?? '—'} | comp ${r.composite}`)
  }
  console.log(`\nReport: scripts/benchmark/results/latest.json\n`)
}

main().catch((err) => {
  console.error('\n💥 Fatal:', err.message)
  process.exit(1)
})
