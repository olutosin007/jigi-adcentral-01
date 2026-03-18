/**
 * Upload reference assets (mood boards, competitor examples) for campaign brief.
 * Stores in campaign_references bucket. Path: {campaign_id}/{uuid}.{ext}
 */

import { supabase } from './supabase'

const BUCKET = 'campaign-references'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]

export function isAllowedReferenceType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType)
}

export function validateReferenceFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit')
  }
  if (!isAllowedReferenceType(file.type)) {
    throw new Error(
      `File type not allowed. Use: JPEG, PNG, WebP, SVG, or PDF.`
    )
  }
}

/**
 * Upload a reference asset to campaign_references bucket.
 * Returns the public URL.
 */
export async function uploadCampaignReference(
  campaignId: string,
  file: File
): Promise<string> {
  validateReferenceFile(file)

  const ext = file.name.split('.').pop() || 'bin'
  const safeName = `${crypto.randomUUID()}.${ext}`
  const path = `${campaignId}/${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
