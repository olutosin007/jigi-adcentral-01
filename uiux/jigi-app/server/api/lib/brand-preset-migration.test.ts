/**
 * Drift guard: migration 036 CHECK lists and length limits must match the
 * client catalog, or presets saved from the composer fail to insert.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { IMAGE_ASPECT_OPTIONS, IMAGE_TIER_OPTIONS } from '../../../src/lib/image-tiers'
import { PRESET_NAME_MAX, PRESET_STYLE_MAX } from '../../../src/lib/brand-presets'
import type { ImageTier } from './image-models.js'

const MIGRATION = path.resolve(
  __dirname,
  '../../../../../supabase/migrations/036_brand_image_presets.sql'
)

const SERVER_TIERS: Record<ImageTier, true> = { draft: true, refine: true, final: true }

function checkList(sql: string, column: string): string[] {
  const match = new RegExp(`${column} IN \\(([^)]+)\\)`).exec(sql)
  if (!match) throw new Error(`No CHECK list for ${column}`)
  return match[1].split(',').map((v) => v.trim().replace(/'/g, ''))
}

function lengthLimit(sql: string, column: string): number {
  const match = new RegExp(`char_length\\(btrim\\(${column}\\)\\) BETWEEN 1 AND (\\d+)`).exec(sql)
  if (!match) throw new Error(`No length CHECK for ${column}`)
  return Number(match[1])
}

describe('036_brand_image_presets migration drift', () => {
  const sql = fs.readFileSync(MIGRATION, 'utf8')

  it('image_tier CHECK matches server ImageTier and client tiers', () => {
    const allowed = checkList(sql, 'image_tier').sort()
    expect(allowed).toEqual(Object.keys(SERVER_TIERS).sort())
    expect(allowed).toEqual(IMAGE_TIER_OPTIONS.map((o) => o.id).sort())
  })

  it('aspect_ratio CHECK matches the client aspect options', () => {
    expect(checkList(sql, 'aspect_ratio').sort()).toEqual(IMAGE_ASPECT_OPTIONS.map((o) => o.id).sort())
  })

  it('length limits match client validation', () => {
    expect(lengthLimit(sql, 'name')).toBe(PRESET_NAME_MAX)
    expect(lengthLimit(sql, 'style_prompt')).toBe(PRESET_STYLE_MAX)
  })

  it('enables RLS with select/insert/update/delete policies', () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/)
    for (const op of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
      expect(sql).toMatch(new RegExp(`ON brand_image_presets FOR ${op}`))
    }
    expect(sql).toMatch(/agency_brand_access/)
    expect(sql).toMatch(/aba\.status = 'active'/)
  })
})
