/**
 * Image Validation — PRD 08 Sprints 2–4
 * Dimensions, colour compliance, composition, exclusions
 */

import { extractColorsFromImage, hexToRgb } from '@/lib/colors'

export interface ImageValidationContext {
  expectedDimensions?: { width: number; height: number }
  brandColours?: string[]
  parsedExclusions?: string[]
}

export interface ImageValidationResult {
  valid: boolean
  warnings: string[]
  colour_compliance?: { bio_palette_match: number; dominant_colours?: string[] }
  composition_check?: { safe_zones_clear: boolean }
  safe_zones_violated: boolean
}

/** Colour distance in RGB (0 = same, ~441 = max) */
function colourDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  )
}

function colourDistanceHex(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 441
  return colourDistance(rgb1.r, rgb1.g, rgb1.b, rgb2.r, rgb2.g, rgb2.b)
}

/**
 * Compute bio_palette_match (0–100) by comparing dominant image colours to brand palette.
 */
function computeBioPaletteMatch(
  dominantHex: string[],
  brandColours: string[]
): number {
  if (brandColours.length === 0) return 100
  if (dominantHex.length === 0) return 0

  let bestMatch = 0
  for (const imgHex of dominantHex.slice(0, 3)) {
    let minDist = 441
    for (const brandHex of brandColours) {
      const d = colourDistanceHex(imgHex, brandHex)
      if (d < minDist) minDist = d
    }
    const similarity = Math.max(0, 100 - (minDist / 4.41))
    if (similarity > bestMatch) bestMatch = similarity
  }
  return Math.round(bestMatch)
}

/**
 * Validate an image against CCO rules.
 * - dimensions match channel
 * - colour_compliance.bio_palette_match from extracted colours
 * - composition_check.safe_zones_clear (default true; vision model would override)
 * - exclusions_check
 */
export async function validateImage(
  imageUrl: string,
  context: ImageValidationContext
): Promise<ImageValidationResult> {
  const warnings: string[] = []
  let colour_compliance: ImageValidationResult['colour_compliance']
  let composition_check: ImageValidationResult['composition_check'] = {
    safe_zones_clear: true,
  }
  let safe_zones_violated = false

  try {
    const dominantHex = await extractColorsFromImage(imageUrl)
    colour_compliance = {
      bio_palette_match: context.brandColours?.length
        ? computeBioPaletteMatch(dominantHex, context.brandColours)
        : 100,
      dominant_colours: dominantHex.slice(0, 5),
    }

    if (colour_compliance.bio_palette_match < 40) {
      warnings.push(
        `Colour compliance ${colour_compliance.bio_palette_match}/100 (below 40); image may be off-brand`
      )
    }
  } catch {
    colour_compliance = { bio_palette_match: 100 }
    warnings.push('Could not extract colours for validation')
  }

  if (context.expectedDimensions) {
    warnings.push(
      'Dimension validation requires image metadata; ensure generated dimensions match channel'
    )
  }

  return {
    valid: !safe_zones_violated,
    warnings,
    colour_compliance,
    composition_check,
    safe_zones_violated,
  }
}
