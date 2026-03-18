#!/usr/bin/env node
/**
 * Local API server - bypasses Vercel dev when it fails (e.g. NO_RESPONSE_FROM_FUNCTION).
 * Run: pnpm dev:api (or node scripts/server-local.mjs)
 * Vite proxies /api to localhost:3000, so run this on 3000.
 */
import http from 'node:http'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = Number(process.env.PORT) || 3000

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

/** Wrap Node ServerResponse with Vercel-like .status().json() for API handlers */
function wrapResponse(res) {
  if (res.status) return res
  res.status = function (code) {
    res.statusCode = code
    return res
  }
  res.json = function (body) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
    }
    return res
  }
  return res
}

const server = http.createServer(async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const pathname = url.pathname

  // Health - no imports, always works
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, timestamp: new Date().toISOString(), source: 'local' }))
    return
  }

  // Dynamic handler loading for other routes
  const routeMap = {
    'POST /api/generate/text': './api/generate/text.ts',
    'POST /api/generate/image': './api/generate/image.ts',
    'POST /api/creative-router/generate': './api/creative-router/generate.ts',
    'POST /api/assets/submit': './api/assets/submit.ts',
    'POST /api/assets/review': './api/assets/review.ts',
    'POST /api/notifications/send': './api/notifications/send.ts',
  }
  const key = `${req.method} ${pathname}`
  const modulePath = routeMap[key]
  if (!modulePath) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found', path: pathname }))
    return
  }

  try {
    const fullPath = path.resolve(ROOT, modulePath)
    const mod = await import(pathToFileURL(fullPath).href)
    const handler = mod.default
    if (typeof handler !== 'function') {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Handler not a function' }))
      return
    }
    // Attach body for POST; wrap res with Vercel-like .status().json()
    const body = await readBody(req)
    const vercelReq = Object.assign(req, { body, query: Object.fromEntries(url.searchParams) })
    await handler(vercelReq, wrapResponse(res))
  } catch (err) {
    console.error('[server-local]', key, err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: String(err?.message || err), stack: err?.stack }))
  }
})

server.listen(PORT, () => {
  console.log(`Local API at http://localhost:${PORT}`)
  console.log('  GET  /api/health')
  console.log('  POST /api/generate/text')
  console.log('  POST /api/generate/image')
  console.log('  ...')
})
