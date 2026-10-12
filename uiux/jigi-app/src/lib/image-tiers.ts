/**
 * Client-side image tier catalog. Must mirror the server registry
 * (`server/api/lib/image-models.ts` + `PRIMARY_PROVIDER_ORDER`); enforced by
 * `server/api/lib/image-catalog-drift.test.ts`.
 */

import type { ImageAspectRatio } from './ai/types'

export type ImageTierId = 'draft' | 'refine' | 'final'

export interface ImageTierOption {
  id: ImageTierId
  label: string
  /** Primary model id when its provider is configured. */
  model: string
  modelLabel: string
  estCostUsd: number
  speed: 'Fast' | 'Medium' | 'Slower'
  description: string
}

export const IMAGE_TIER_OPTIONS: readonly ImageTierOption[] = [
  {
    id: 'draft',
    label: 'Draft',
    model: 'kling-v2-1',
    modelLabel: 'Kling Image 2.1',
    estCostUsd: 0.014,
    speed: 'Fast',
    description: 'Explore directions cheaply',
  },
  {
    id: 'refine',
    label: 'Refine',
    model: 'kling-v3',
    modelLabel: 'Kling Image 3.0',
    estCostUsd: 0.028,
    speed: 'Medium',
    description: 'Higher fidelity for a shortlist',
  },
  {
    id: 'final',
    label: 'Final',
    model: 'gemini-nano-banana-2.1',
    modelLabel: 'Nano Banana 2.1 · 2K',
    estCostUsd: 0.0504,
    speed: 'Slower',
    description: 'Client-ready, sharpest in-image text',
  },
]

export const IMAGE_ASPECT_OPTIONS: readonly { id: ImageAspectRatio; label: string }[] = [
  { id: '1:1', label: 'Square 1:1' },
  { id: '4:5', label: 'Portrait 4:5' },
  { id: '9:16', label: 'Story 9:16' },
  { id: '16:9', label: 'Landscape 16:9' },
]

export function formatCostUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return ''
  if (value < 0.01) return '<$0.01'
  return `~$${value.toFixed(value < 0.1 ? 3 : 2)}`
}

/** `free` is the stored bucket for primary lanes; all lanes are paid since Oct 2026. */
export function formatLaneLabel(costBucket: 'free' | 'paid_fallback' | null | undefined): string {
  if (!costBucket) return ''
  return costBucket === 'free' ? 'Primary lane' : 'Fallback'
}
