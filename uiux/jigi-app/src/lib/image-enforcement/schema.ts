/**
 * Image Output Schema — PRD 08
 * From Jigi_Campaign_Context_Object_Spec §4.4
 */

export interface ColourCompliance {
  bio_palette_match: number
  dominant_colours?: string[]
}

export interface CompositionCheck {
  safe_zones_clear: boolean
  logo_area_available?: boolean
  text_overlay_area?: boolean
}

/** Display format for image assets (stored in content) */
export interface ImageDisplayFormat {
  url: string
  prompt_used?: string
  model?: string
  /** PRD 08: New schema fields */
  image_id?: string
  channel?: string
  dimensions?: { width: number; height: number }
  colour_compliance?: ColourCompliance
  composition_check?: CompositionCheck
  mood_alignment?: string
  style_adherence?: string
  key_message_support?: string
  exclusions_check?: Array<{ exclusion: string; violated: boolean }>
  /** Validation */
  validation_warnings?: string[]
  safe_zones_violated?: boolean
}
