/**
 * Drift guard: every provider the router can write must be accepted by the
 * DB CHECK constraint, or routing events fail to insert and daily caps stop counting.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ImageProvider } from './image-models.js'

/** Latest migration that defines the full image_provider CHECK list. */
const MIGRATION = path.resolve(
  __dirname,
  '../../../../../supabase/migrations/037_image_provider_fal.sql'
)

/** Compile-time exhaustive list of the ImageProvider union. */
const PROVIDERS: Record<ImageProvider, true> = {
  google_gemini: true,
  kling: true,
  fal: true,
  replicate: true,
  azure_openai: true,
  azure_foundry: true,
  google_imagen: true,
}

function checkLists(sql: string): string[][] {
  return [...sql.matchAll(/image_provider IN \(([^)]+)\)/gs)].map((m) =>
    m[1]
      .split(',')
      .map((v) => v.trim().replace(/'/g, '').replace(/\s+/g, ''))
      .filter(Boolean)
  )
}

describe('migration 037 image_provider CHECK', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8')
  const lists = checkLists(sql)

  it('constrains both generation_log and image_routing_events', () => {
    expect(lists).toHaveLength(2)
    expect(sql).toContain('ALTER TABLE generation_log')
    expect(sql).toContain('ALTER TABLE image_routing_events')
  })

  it('accepts exactly the ImageProvider union (includes fal)', () => {
    for (const list of lists) {
      expect([...list].sort()).toEqual(Object.keys(PROVIDERS).sort())
    }
  })
})
