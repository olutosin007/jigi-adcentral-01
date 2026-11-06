export interface DisplayableAsset {
  type: 'concept' | 'copy' | 'image'
  content: unknown
  original_filename?: string | null
}

export function getAssetTitle(asset: DisplayableAsset): string {
  const content = (asset.content ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
  if (asset.type === 'concept') return str(content.theme) ?? asset.original_filename ?? 'Untitled concept'
  if (asset.type === 'copy') return str(content.headline)?.slice(0, 60) ?? asset.original_filename ?? 'Untitled copy'
  if (asset.type === 'image') {
    return asset.original_filename ?? str(content.prompt_used)?.slice(0, 60) ?? 'Image'
  }
  return 'Asset'
}

export function getAssetImageUrl(asset: DisplayableAsset): string | null {
  if (asset.type !== 'image') return null
  const url = (asset.content as { url?: unknown } | null)?.url
  return typeof url === 'string' && url ? url : null
}
