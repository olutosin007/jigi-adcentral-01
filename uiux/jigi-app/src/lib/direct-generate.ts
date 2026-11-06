import type { ImageAspectRatio } from './ai/types'
import { IMAGE_ASPECT_OPTIONS, IMAGE_TIER_OPTIONS, type ImageTierId } from './image-tiers'

/**
 * Direct route (`/app/generate`): skip brand + brief, create a lightweight
 * idea-first campaign, and land in generation with the request auto-run.
 */

export type DirectGenerateKind = 'image' | 'concepts'

export interface DirectGenerateRequest {
  kind: DirectGenerateKind
  prompt: string
  imageTier: ImageTierId
  aspectRatio: ImageAspectRatio
}

export const DIRECT_PROMPT_MIN = 3
export const DIRECT_PROMPT_MAX = 2000
const NAME_MAX = 60

export function validateDirectPrompt(prompt: string): string | null {
  const trimmed = prompt.trim()
  if (trimmed.length < DIRECT_PROMPT_MIN) return 'Describe what you want to make'
  if (trimmed.length > DIRECT_PROMPT_MAX) return `Keep it under ${DIRECT_PROMPT_MAX.toLocaleString()} characters`
  return null
}

/** "A bold summer refresh for…" → "Quick: A bold summer refresh for" (word-safe, ≤ 60 chars). */
export function deriveQuickCampaignName(prompt: string): string {
  const words = prompt.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean)
  let name = 'Quick:'
  for (const word of words.slice(0, 8)) {
    if (`${name} ${word}`.length > NAME_MAX) break
    name = `${name} ${word}`
  }
  if (name === 'Quick:') return 'Quick creative'
  return name.replace(/[.,;:!?-]+$/, '')
}

export function buildDirectCampaignPayload(prompt: string, userId: string) {
  return {
    name: deriveQuickCampaignName(prompt),
    created_by: userId,
    journey_mode: 'idea_first' as const,
    seed_idea: prompt.trim(),
    brief: { channels: [] as string[], reference_assets: [] },
  }
}

export function directGenerateStage(kind: DirectGenerateKind): 'images' | 'concepts' {
  return kind === 'image' ? 'images' : 'concepts'
}

/** Router state is untyped; only accept a well-formed request (guards stale/forged history state). */
export function parseDirectGenerateState(state: unknown): DirectGenerateRequest | null {
  if (!state || typeof state !== 'object') return null
  const raw = (state as { directGenerate?: unknown }).directGenerate
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.kind !== 'image' && r.kind !== 'concepts') return null
  if (typeof r.prompt !== 'string' || validateDirectPrompt(r.prompt)) return null
  if (!IMAGE_TIER_OPTIONS.some((o) => o.id === r.imageTier)) return null
  if (!IMAGE_ASPECT_OPTIONS.some((o) => o.id === r.aspectRatio)) return null
  return {
    kind: r.kind,
    prompt: r.prompt.trim(),
    imageTier: r.imageTier as ImageTierId,
    aspectRatio: r.aspectRatio as ImageAspectRatio,
  }
}
