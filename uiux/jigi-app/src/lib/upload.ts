/**
 * Client-side upload utilities for the Unified Creative Pipeline.
 * Uploads files to Supabase Storage (creative-assets bucket).
 */

import { supabase } from './supabase'

const BUCKET = 'creative-assets'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const ALLOWED_CONCEPT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ALLOWED_COPY_TYPES = ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export function getAllowedMimeTypes(type: 'concept' | 'copy' | 'image'): string[] {
  switch (type) {
    case 'image':
      return ALLOWED_IMAGE_TYPES
    case 'concept':
      return ALLOWED_CONCEPT_TYPES
    case 'copy':
      return ALLOWED_COPY_TYPES
    default:
      return []
  }
}

export function isAllowedMimeType(mimeType: string, assetType: 'concept' | 'copy' | 'image'): boolean {
  return getAllowedMimeTypes(assetType).includes(mimeType)
}

export function validateFileSize(size: number): void {
  if (size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 10MB limit`)
  }
}

/**
 * Upload a file to the creative-assets bucket.
 * Path: {campaign_id}/{asset_id}/{filename}
 */
export async function uploadFileToStorage(
  campaignId: string,
  assetId: string,
  file: File
): Promise<string> {
  validateFileSize(file.size)

  const ext = file.name.split('.').pop() || 'bin'
  const safeName = `${assetId}.${ext}`
  const path = `${campaignId}/${assetId}/${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
