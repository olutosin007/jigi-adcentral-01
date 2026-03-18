import Fastify from 'fastify'
import { validateAssets, type ValidateAsset } from './validate.js'

const PORT = Number(process.env.PORT) || 3002

const app = Fastify({ logger: true })

app.get('/health', async () => ({ status: 'ok' }))

app.post<{
  Body: { assets?: ValidateAsset[] }
}>('/creatives/validate', async (req, reply) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ') || auth.slice(7).trim() === '') {
    return reply.status(401).send({ error: 'Missing or invalid Authorization: Bearer <token>' })
  }

  const body = req.body
  if (!body || !Array.isArray(body.assets) || body.assets.length === 0) {
    return reply.status(400).send({ error: 'Body must contain a non-empty assets array' })
  }

  const assets = body.assets as ValidateAsset[]
  const invalid = assets.some(
    (a) => typeof a?.url !== 'string' || typeof a?.placement !== 'string'
  )
  if (invalid) {
    return reply.status(400).send({ error: 'Each asset must have url (string) and placement (string)' })
  }

  const results = await validateAssets(assets)
  return reply.send({ results })
})

async function main() {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
