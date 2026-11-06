#!/usr/bin/env node
/**
 * Live fal.ai smoke — draft Flux Schnell via queue.fal.run.
 * Requires FAL_KEY in .env.local. Never prints the key.
 *
 * Uses curl (honours HTTPS_PROXY in Cursor agent sandbox). Node's
 * built-in fetch does not use HTTP(S)_PROXY and DNS-fails in-sandbox.
 *
 *   node scripts/smoke-fal.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found')
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

function curlJson(args) {
  const res = spawnSync('curl', ['-sS', ...args], {
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 5 * 1024 * 1024,
  })
  if (res.error) throw res.error
  if (res.status !== 0) {
    throw new Error(`curl exit ${res.status}: ${(res.stderr || '').slice(0, 200)}`)
  }
  try {
    return JSON.parse(res.stdout || '{}')
  } catch {
    throw new Error(`curl non-JSON: ${(res.stdout || '').slice(0, 200)}`)
  }
}

loadEnv()

const key = process.env.FAL_KEY
if (!key) {
  console.error('FAIL: FAL_KEY missing in env')
  process.exit(1)
}
console.log(`FAL_KEY present (len=${key.length})`)

const model = 'fal-ai/flux/schnell'
const body = JSON.stringify({
  prompt: 'Smoke test: simple red ceramic mug on a white table, soft daylight, no text',
  image_size: 'square_hd',
  num_images: 1,
  enable_safety_checker: true,
  num_inference_steps: 4,
})

const started = Date.now()
console.log(`Submitting ${model}…`)
const submitted = curlJson([
  '-X',
  'POST',
  `https://queue.fal.run/${model}`,
  '-H',
  `Authorization: Key ${key}`,
  '-H',
  'Content-Type: application/json',
  '-d',
  body,
])

if (!submitted.request_id || !submitted.status_url || !submitted.response_url) {
  console.error('FAIL: submit missing request urls')
  process.exit(1)
}
console.log(`queued request_id=${submitted.request_id}`)

const deadline = Date.now() + 60_000
let status = 'IN_QUEUE'
while (Date.now() < deadline) {
  const st = curlJson(['-H', `Authorization: Key ${key}`, submitted.status_url])
  status = st.status || status
  if (status === 'COMPLETED') break
  if (status === 'FAILED' || st.error) {
    console.error(`FAIL: fal ${status}: ${st.error || ''}`)
    process.exit(1)
  }
  spawnSync('sleep', ['1'])
}
if (status !== 'COMPLETED') {
  console.error(`FAIL: timeout (last status=${status})`)
  process.exit(1)
}

const result = curlJson(['-H', `Authorization: Key ${key}`, submitted.response_url])
const urls = []
const push = (v) => {
  if (typeof v === 'string' && /^https?:\/\//i.test(v)) urls.push(v)
  else if (v && typeof v === 'object' && typeof v.url === 'string') urls.push(v.url)
}
if (Array.isArray(result.images)) result.images.forEach(push)
if (result.image) push(result.image)

if (!urls.length) {
  console.error('FAIL: no image urls in result')
  process.exit(1)
}

console.log(`OK: ${urls.length} image(s) in ${Date.now() - started}ms`)
console.log(`url_host=${new URL(urls[0]).host}`)
process.exit(0)
