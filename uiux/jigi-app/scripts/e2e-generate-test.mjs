#!/usr/bin/env node
/**
 * End-to-end generation test via command line.
 * Requires `pnpm dev:api` running on API_BASE (default http://localhost:3000).
 *
 * Usage:
 *   node scripts/e2e-generate-test.mjs
 *   API_BASE=http://localhost:3000 node scripts/e2e-generate-test.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const TEST_EMAIL = 'e2e-test@jigi.local'
const TEST_PASSWORD = 'e2e-test-password-12345!'

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function getOrCreateTestUser() {
  const { data: list } = await adminClient.auth.admin.listUsers()
  const existing = list?.users?.find((u) => u.email === TEST_EMAIL)

  if (existing) {
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    if (error) {
      console.error(`Sign-in failed for ${TEST_EMAIL}:`, error.message)
      console.log('Trying to update password and retry...')
      await adminClient.auth.admin.updateUserById(existing.id, { password: TEST_PASSWORD })
      const retry = await anonClient.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      if (retry.error) throw new Error(`Cannot sign in as test user: ${retry.error.message}`)
      return { session: retry.data.session, userId: existing.id }
    }
    return { session: data.session, userId: existing.id }
  }

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (createErr) throw new Error(`Cannot create test user: ${createErr.message}`)

  const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (signInErr) throw new Error(`Cannot sign in as new test user: ${signInErr.message}`)
  return { session: signIn.session, userId: created.user.id }
}

async function getOrCreateCampaign(userId) {
  const { data: existing } = await adminClient
    .from('campaigns')
    .select('id,name')
    .limit(1)
    .single()

  if (existing) {
    console.log(`  Using campaign: "${existing.name}" (${existing.id})`)
    return existing.id
  }

  const { data: created, error } = await adminClient
    .from('campaigns')
    .insert({
      name: 'E2E Test Campaign',
      created_by: userId,
      generation_mode: 'idea_first',
      brief: {
        objective: 'Test campaign for e2e generation',
        audience: 'Test audience',
        channels: ['meta_feed'],
      },
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) throw new Error(`Cannot create campaign: ${error.message}`)
  console.log(`  Created campaign: ${created.id}`)
  return created.id
}

async function apiPost(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data }
}

async function main() {
  console.log(`\n🔬 E2E Generation Test → ${API_BASE}\n`)

  // Step 1: Get auth token
  console.log('1. Authenticating...')
  const { session, userId } = await getOrCreateTestUser()
  const token = session.access_token
  console.log(`   ✅ Signed in as ${TEST_EMAIL} (${userId.slice(0, 8)}...)`)

  // Step 2: Get a campaign
  console.log('\n2. Finding campaign...')
  const campaignId = await getOrCreateCampaign(userId)

  // Step 3: Generate concepts
  console.log('\n3. Generating concepts (POST /api/generate/text type=concept)...')
  const conceptStart = Date.now()
  const conceptResult = await apiPost('/api/generate/text', {
    type: 'concept',
    campaign_id: campaignId,
    prompt: 'Generate 2 creative concepts for a modern fitness app targeting millennials. Focus on community and personal achievement.',
  }, token)
  const conceptMs = Date.now() - conceptStart

  if (conceptResult.ok && conceptResult.data.content?.concepts?.length) {
    const concepts = conceptResult.data.content.concepts
    console.log(`   ✅ ${concepts.length} concepts generated in ${conceptMs}ms (model: ${conceptResult.data.model})`)
    for (const c of concepts) {
      console.log(`      • ${c.theme}: "${(c.headlines || [])[0] || 'no headline'}"`)
    }
  } else {
    console.error(`   ❌ Concept generation failed: ${conceptResult.status}`, JSON.stringify(conceptResult.data).slice(0, 300))
  }

  // Step 4: Generate copy
  console.log('\n4. Generating copy (POST /api/generate/text type=copy)...')
  const conceptCtx = conceptResult.data?.content?.concepts?.[0]
  const copyStart = Date.now()
  const copyResult = await apiPost('/api/generate/text', {
    type: 'copy',
    campaign_id: campaignId,
    prompt: 'Write social media copy for the following concept.',
    concept_context: conceptCtx ? {
      theme: conceptCtx.theme,
      headlines: conceptCtx.headlines || [],
      visual_direction: conceptCtx.visual_direction || '',
    } : undefined,
  }, token)
  const copyMs = Date.now() - copyStart

  if (copyResult.ok && copyResult.data.content?.variations?.length) {
    const variants = copyResult.data.content.variations
    console.log(`   ✅ ${variants.length} copy variants generated in ${copyMs}ms`)
    for (const v of variants) {
      const hl = v.content?.headline || v.headline || ''
      console.log(`      • Variant ${v.variant_label || '?'}: "${hl.slice(0, 60)}"`)
    }
  } else {
    console.error(`   ❌ Copy generation failed: ${copyResult.status}`, JSON.stringify(copyResult.data).slice(0, 300))
  }

  // Step 5: Generate image
  console.log('\n5. Generating image (POST /api/generate/image)...')
  const imageStart = Date.now()
  const imageResult = await apiPost('/api/generate/image', {
    prompt: 'A modern fitness app interface showing community features, clean minimalist design with vibrant accent colours',
    campaign_id: campaignId,
    image_tier: 'draft',
  }, token)
  const imageMs = Date.now() - imageStart

  if (imageResult.ok && imageResult.data.image_url) {
    console.log(`   ✅ Image generated in ${imageMs}ms`)
    console.log(`      Provider: ${imageResult.data.image_provider} (${imageResult.data.model})`)
    console.log(`      Tier: ${imageResult.data.image_tier} / Bucket: ${imageResult.data.cost_bucket}`)
    console.log(`      URL: ${imageResult.data.image_url.slice(0, 100)}...`)
  } else {
    console.error(`   ❌ Image generation failed: ${imageResult.status}`, JSON.stringify(imageResult.data).slice(0, 400))
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  const allPassed = conceptResult.ok && copyResult.ok && imageResult.ok
  if (allPassed) {
    console.log('✅ All generation types working on localhost!')
  } else {
    const failed = []
    if (!conceptResult.ok) failed.push('concept')
    if (!copyResult.ok) failed.push('copy')
    if (!imageResult.ok) failed.push('image')
    console.error(`❌ Failed: ${failed.join(', ')}`)
  }
  console.log('='.repeat(60) + '\n')
  process.exit(allPassed ? 0 : 1)
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err.message)
  process.exit(1)
})
