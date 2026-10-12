import type { ImageAspectRatio } from './ai/types'
import { IMAGE_ASPECT_OPTIONS, IMAGE_TIER_OPTIONS, type ImageTierId } from './image-tiers'

/** Limits mirror the CHECK constraints in `supabase/migrations/036_brand_image_presets.sql`. */
export const PRESET_NAME_MAX = 60
export const PRESET_STYLE_MAX = 500

export interface BrandImagePreset {
  id: string
  brand_id: string
  name: string
  style_prompt: string
  image_tier: ImageTierId
  aspect_ratio: ImageAspectRatio
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PresetInput {
  name: string
  style_prompt: string
  image_tier: ImageTierId
  aspect_ratio: ImageAspectRatio
}

export type PresetValidation =
  | { ok: true; value: PresetInput }
  | { ok: false; errors: Partial<Record<keyof PresetInput, string>> }

export function validatePresetInput(input: PresetInput): PresetValidation {
  const name = input.name.trim()
  const style = input.style_prompt.trim()
  const errors: Partial<Record<keyof PresetInput, string>> = {}

  if (!name) errors.name = 'Give the look a name'
  else if (name.length > PRESET_NAME_MAX) errors.name = `Keep the name under ${PRESET_NAME_MAX} characters`

  if (!style) errors.style_prompt = 'Add style words for this look'
  else if (style.length > PRESET_STYLE_MAX) errors.style_prompt = `Keep style words under ${PRESET_STYLE_MAX} characters`

  if (!IMAGE_TIER_OPTIONS.some((o) => o.id === input.image_tier)) errors.image_tier = 'Unknown tier'
  if (!IMAGE_ASPECT_OPTIONS.some((o) => o.id === input.aspect_ratio)) errors.aspect_ratio = 'Unsupported aspect ratio'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, value: { ...input, name, style_prompt: style } }
}

const STYLE_PREFIX = 'Style: '

/** Appends the preset's style once; re-applying the same or another preset replaces it. */
export function applyPresetToPrompt(prompt: string, preset: Pick<BrandImagePreset, 'style_prompt'>): string {
  const style = preset.style_prompt.trim()
  const base = stripPresetStyle(prompt)
  if (!style) return base
  return base ? `${base}\n\n${STYLE_PREFIX}${style}` : `${STYLE_PREFIX}${style}`
}

export function stripPresetStyle(prompt: string): string {
  const index = prompt.lastIndexOf(`\n\n${STYLE_PREFIX}`)
  if (index >= 0) return prompt.slice(0, index).trim()
  return prompt.startsWith(STYLE_PREFIX) ? '' : prompt.trim()
}

/** Pulls the applied style back out of the composer prompt (for "Save current look"). */
export function extractPresetStyle(prompt: string): string {
  const index = prompt.lastIndexOf(`\n\n${STYLE_PREFIX}`)
  if (index >= 0) return prompt.slice(index + STYLE_PREFIX.length + 2).trim()
  return prompt.startsWith(STYLE_PREFIX) ? prompt.slice(STYLE_PREFIX.length).trim() : prompt.trim()
}
