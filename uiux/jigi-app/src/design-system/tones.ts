import type { SecondaryKey } from './tokens'

/** Colours a tinted surface (badge, callout, chip) can take. */
export type ToneColor = 'neutral' | 'orchid' | 'sage' | Exclude<SecondaryKey, 'lavender' | 'sageMist'>

/**
 * Literal class strings — Tailwind only generates classes it can see in source,
 * so these must never be assembled from template strings.
 */
export const TONE_SURFACE_CLASSES: Record<ToneColor, string> = {
  neutral: 'bg-mist text-slate border-line',
  orchid: 'bg-orchid-3 text-orchid-11 border-orchid-6',
  sage: 'bg-sage-3 text-sage-11 border-sage-6',
  plum: 'bg-plum-soft text-plum-text border-plum/30',
  forest: 'bg-forest-soft text-forest-text border-forest/30',
  clay: 'bg-clay-soft text-clay-text border-clay/40',
  honey: 'bg-honey-soft text-honey-text border-honey/40',
  dusk: 'bg-dusk-soft text-dusk-text border-dusk/40',
  brick: 'bg-brick-soft text-brick-text border-brick/30',
  coral: 'bg-coral-soft text-coral-text border-coral/40',
}

/** Small solid indicator (status dots, legend keys, chart series). */
export const TONE_DOT_CLASSES: Record<ToneColor, string> = {
  neutral: 'bg-pewter',
  orchid: 'bg-orchid-9',
  sage: 'bg-sage-8',
  plum: 'bg-plum',
  forest: 'bg-forest',
  clay: 'bg-clay',
  honey: 'bg-honey',
  dusk: 'bg-dusk',
  brick: 'bg-brick',
  coral: 'bg-coral',
}

export type CalloutIntent = 'info' | 'success' | 'warning' | 'danger' | 'brand' | 'idea'

export const CALLOUT_TONES: Record<CalloutIntent, ToneColor> = {
  info: 'dusk',
  success: 'forest',
  warning: 'honey',
  danger: 'brick',
  brand: 'orchid',
  idea: 'clay',
}
