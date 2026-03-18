/**
 * Imported Image Validation — PRD 08 Sprint 5
 * Same validation pipeline for uploaded images.
 */

import { fetchCCO } from '@/lib/cco'
import { supabase } from '@/lib/supabase'
import { validateImage } from './validation'
import type { ImageDisplayFormat } from './schema'

export interface ValidateImportedImageResult {
  normalized: ImageDisplayFormat
  validation: { valid: boolean; warnings: string[]; safe_zones_violated: boolean }
}

/**
 * Validate an uploaded image against campaign CCO.
 */
export async function validateImportedImage(
  imageContent: { url: string; [k: string]: unknown },
  campaignId: string
): Promise<ValidateImportedImageResult> {
  const url = imageContent.url as string
  if (!url) {
    return {
      normalized: { ...imageContent, url: '' } as ImageDisplayFormat,
      validation: { valid: false, warnings: ['No image URL'], safe_zones_violated: false },
    }
  }

  const { cco } = await fetchCCO(campaignId)
  const channelId = cco?.channel_constraints?.[0]?.channel_id
  const channelConstraint = cco?.channel_constraints?.find((c) => c.channel_id === channelId)
  const expectedDimensions = channelConstraint?.image_dimensions
    ? {
        width: channelConstraint.image_dimensions.width,
        height: channelConstraint.image_dimensions.height,
      }
    : undefined

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('brand_id')
    .eq('id', campaignId)
    .single()

  let brandColours: string[] = []
  if (campaign?.brand_id) {
    const { data: brand } = await supabase
      .from('brands')
      .select('identity')
      .eq('id', campaign.brand_id)
      .single()
    const colours = brand?.identity?.colours
    if (Array.isArray(colours)) {
      brandColours = (colours as Array<{ hex?: string }>)
        .map((c) => c.hex)
        .filter((h): h is string => !!h && /^#?[0-9a-fA-F]{6}$/.test(h))
    } else if (colours && typeof colours === 'object' && !Array.isArray(colours)) {
      brandColours = Object.values(colours).filter(
        (v): v is string => typeof v === 'string' && /^#?[0-9a-fA-F]{6}$/.test(v)
      )
    }
  }

  const validation = await validateImage(url, {
    expectedDimensions,
    brandColours: brandColours.length > 0 ? brandColours : undefined,
    parsedExclusions: cco?.hard_constraints?.parsed_exclusions,
  })

  const out: ImageDisplayFormat = {
    ...imageContent,
    url,
    colour_compliance: validation.colour_compliance,
    composition_check: validation.composition_check,
    validation_warnings:
      validation.warnings.length > 0 ? validation.warnings : undefined,
    safe_zones_violated: validation.safe_zones_violated,
  }

  return {
    normalized: out,
    validation: {
      valid: validation.valid,
      warnings: validation.warnings,
      safe_zones_violated: validation.safe_zones_violated,
    },
  }
}
