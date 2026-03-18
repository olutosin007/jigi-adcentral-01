/**
 * Validates image assets against Meta Feed–style specs (dimensions, format, size).
 * Fetches each URL, parses dimensions with image-size, returns one result per asset.
 */

import { imageSize } from 'image-size'

const FETCH_TIMEOUT_MS = 15_000
const MAX_BODY_BYTES = 4 * 1024 * 1024 // 4MB
const MIN_WIDTH = 600
const MIN_HEIGHT = 600
const MIN_ASPECT = 1 / 1.91   // ~0.52
const MAX_ASPECT = 1.91       // 1.91:1

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export interface ValidateAsset {
  url: string
  placement: string
  aspectRatio?: string
}

export interface ValidateResult {
  valid: boolean
  issues: string[]
}

export async function validateAssets(assets: ValidateAsset[]): Promise<ValidateResult[]> {
  const results: ValidateResult[] = []

  for (const asset of assets) {
    const issues: string[] = []

    try {
      const res = await fetch(asset.url, {
        method: 'GET',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: 'image/*' },
      })

      if (!res.ok) {
        issues.push(`Failed to fetch image: ${res.status} ${res.statusText}`)
        results.push({ valid: issues.length === 0, issues })
        continue
      }

      const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
      if (!ALLOWED_TYPES.has(contentType)) {
        issues.push(`Unsupported format: ${contentType || 'unknown'}. Allowed: image/jpeg, image/png, image/webp`)
      }

      const buf = await res.arrayBuffer()
      if (buf.byteLength > MAX_BODY_BYTES) {
        issues.push(`Image too large: ${(buf.byteLength / 1024 / 1024).toFixed(2)}MB (max 4MB)`)
      }

      let width: number
      let height: number
      try {
        const size = imageSize(Buffer.from(buf))
        if (!size.width || !size.height) {
          issues.push('Could not read image dimensions')
        } else {
          width = size.width
          height = size.height
          if (width < MIN_WIDTH || height < MIN_HEIGHT) {
            issues.push(`Image too small: ${width}x${height}. Minimum 600x600 for feed`)
          }
          const aspect = width / height
          if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) {
            issues.push(`Aspect ratio ${aspect.toFixed(2)} out of range (supported ~0.52 to 1.91)`)
          }
        }
      } catch (dimErr) {
        const msg = dimErr instanceof Error ? dimErr.message : String(dimErr)
        issues.push(`Could not parse image dimensions: ${msg}`)
      }

      results.push({ valid: issues.length === 0, issues })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ valid: false, issues: [`Failed to fetch: ${msg}`] })
    }
  }

  return results
}
