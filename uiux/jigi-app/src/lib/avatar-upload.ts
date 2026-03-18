/**
 * Avatar upload utilities for user profile pictures.
 * Uploads to Supabase Storage (avatars bucket).
 */

import { supabase } from './supabase'

const BUCKET = 'avatars'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function isAllowedAvatarType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType)
}

/**
 * Upload an avatar image for a user.
 * Path: {userId}/avatar.{ext}
 * Returns the public URL.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Avatar must be under 2MB')
  }
  if (!isAllowedAvatarType(file.type)) {
    throw new Error('Avatar must be JPEG, PNG, or WebP')
  }

  const ext = file.name.split('.').pop() || 'png'
  const safeExt = ['jpeg', 'jpg', 'png', 'webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : 'png'
  const path = `${userId}/avatar.${safeExt === 'jpg' ? 'jpeg' : safeExt}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
