#!/usr/bin/env node
/**
 * Live sanity checks for local API (run `pnpm dev:api` first).
 *
 * Usage:
 *   pnpm sanity:api
 *   API_BASE=http://127.0.0.1:3000 pnpm sanity:api
 *   SANITY_BEARER=<access_token> pnpm sanity:api   # optional: full POST smoke (real LLM + DB writes)
 *
 * Exit code 0 only if all required checks pass.
 */
const base = (process.env.API_BASE || 'http://localhost:3000').replace(/\/$/, '')

const results = []

function ok(name, detail) {
  results.push({ pass: true, name, detail })
  console.log(`✅ ${name}${detail ? `: ${detail}` : ''}`)
}

function fail(name, detail) {
  results.push({ pass: false, name, detail })
  console.error(`❌ ${name}: ${detail}`)
}

/** Node fetch often wraps network errors; surface code like ECONNREFUSED for clarity */
function formatFetchError(e) {
  if (!(e instanceof Error)) return String(e)
  const parts = [e.message]
  const c = e.cause
  if (c instanceof Error) parts.push(c.message)
  if (c && typeof c === 'object' && 'code' in c && c.code) parts.push(`(${String(c.code)})`)
  return parts.filter(Boolean).join(' ')
}

async function json(res) {
  const t = await res.text()
  try {
    return JSON.parse(t)
  } catch {
    return { _raw: t }
  }
}

async function main() {
  console.log(`Sanity API checks → ${base}\n`)

  // 1) Health
  try {
    const res = await fetch(`${base}/api/health`)
    const body = await json(res)
    if (res.ok && body.ok === true) {
      ok('GET /api/health', body.source ? `source=${body.source}` : 'ok')
    } else {
      fail('GET /api/health', `status=${res.status} body=${JSON.stringify(body)}`)
    }
  } catch (e) {
    fail('GET /api/health', formatFetchError(e))
    console.error(
      '\nHint: in a separate terminal keep `pnpm dev:api` running (do not Ctrl+C it). Or set API_BASE if the API uses another host/port.'
    )
    process.exit(1)
  }

  // 1b) Deep health — env vars, Supabase, Azure, schema, image providers
  try {
    const res = await fetch(`${base}/api/health/deep`)
    const body = await json(res)
    if (res.ok && body.ok === true) {
      ok('GET /api/health/deep', 'all dependency checks passed')
    } else if (res.ok || res.status === 503) {
      const failing = Object.entries(body.checks || {})
        .filter(([, v]) => !v.ok)
        .map(([k, v]) => `${k}: ${v.detail}`)
      if (failing.length) {
        fail('GET /api/health/deep', failing.join(' | '))
      } else {
        ok('GET /api/health/deep', 'no failures found')
      }
    } else {
      fail('GET /api/health/deep', `status=${res.status} body=${JSON.stringify(body).slice(0, 300)}`)
    }
  } catch (e) {
    fail('GET /api/health/deep', formatFetchError(e))
  }

  // 2) GET on generate paths should not look like a working generate call (browser mistake)
  for (const path of ['/api/generate/text', '/api/generate/image']) {
    try {
      const res = await fetch(`${base}${path}`)
      const body = await json(res)
      if (res.ok) {
        fail(`GET ${path}`, `unexpected 200 — generate routes must be POST, not opened in browser`)
      } else if (res.status === 405 && body.hint) {
        ok(`GET ${path}`, '405 Method Not Allowed (expected)')
      } else if (res.status === 404 && body.error === 'Not found') {
        ok(`GET ${path}`, '404 (older server-local; use POST from app or curl)')
      } else {
        ok(`GET ${path}`, `status=${res.status} (non-success as expected for GET)`)
      }
    } catch (e) {
      fail(`GET ${path}`, formatFetchError(e))
    }
  }

  // 3) POST without auth → 401
  for (const [path, payload] of [
    [
      '/api/generate/text',
      {
        type: 'concept',
        campaign_id: '00000000-0000-4000-8000-000000000001',
        prompt: 'Smoke test prompt for concepts.',
      },
    ],
    [
      '/api/generate/image',
      {
        prompt: 'A simple product photo',
        campaign_id: '00000000-0000-4000-8000-000000000001',
      },
    ],
  ]) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await json(res)
      if (res.status === 401) {
        ok(`POST ${path} (no bearer)`, '401 Unauthorized as expected')
      } else {
        fail(
          `POST ${path} (no bearer)`,
          `expected 401, got ${res.status}: ${JSON.stringify(body)}`
        )
        if (body?.hint) console.error(`\n${body.hint}`)
      }
    } catch (e) {
      fail(`POST ${path} (no bearer)`, formatFetchError(e))
    }
  }

  // 4) Optional authenticated smoke (costs tokens + writes generation_log)
  const bearer = process.env.SANITY_BEARER
  if (bearer) {
    const campaignId = process.env.SANITY_CAMPAIGN_ID || '00000000-0000-4000-8000-000000000001'
    try {
      const res = await fetch(`${base}/api/generate/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify({
          type: 'concept',
          campaign_id: campaignId,
          prompt: 'Return JSON with two minimal concept objects for a test campaign.',
        }),
      })
      const body = await json(res)
      if (res.ok && body.content?.concepts) {
        ok('POST /api/generate/text (authenticated)', `${body.model || 'model'} · concepts=${body.content.concepts.length}`)
      } else {
        fail(
          'POST /api/generate/text (authenticated)',
          `status=${res.status} ${JSON.stringify(body)}`
        )
      }
    } catch (e) {
      fail('POST /api/generate/text (authenticated)', formatFetchError(e))
    }
  } else {
    ok(
      'POST /api/generate/text (authenticated)',
      'skipped — set SANITY_BEARER to run (Supabase session access_token)'
    )
  }

  const failed = results.filter((r) => !r.pass)
  console.log('')
  if (failed.length) {
    console.error(`Failed ${failed.length}/${results.length} checks.`)
    process.exit(1)
  }
  console.log(`All ${results.length} checks passed.`)
}

main()
