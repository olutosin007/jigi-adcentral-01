import JSZip from 'jszip'
import type { CreativeAsset, ImageContent } from '@/store/campaignStore'

function sanitizePathSegment(value: string): string {
  return value.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'asset'
}

export interface ApprovedAssetExportItem {
  campaignName: string
  asset: CreativeAsset
  fileName: string
  getContentText: (asset: CreativeAsset) => string
  getFileExtension: (asset: CreativeAsset) => string
}

export async function buildApprovedAssetsZip(items: ApprovedAssetExportItem[]): Promise<Blob> {
  const zip = new JSZip()
  const manifest: { campaign: string; file: string; type: string; id: string }[] = []

  for (const { campaignName, asset, fileName, getContentText, getFileExtension } of items) {
    const folder = sanitizePathSegment(campaignName)
    const baseName = sanitizePathSegment(fileName)

    if (asset.type === 'image') {
      const url = (asset.content as ImageContent).url
      if (url) {
        const response = await fetch(url)
        if (!response.ok) continue
        const blob = await response.blob()
        const path = `${folder}/${baseName}.${getFileExtension(asset)}`
        zip.file(path, blob)
        manifest.push({ campaign: campaignName, file: path, type: asset.type, id: asset.id })
      }
    } else {
      const text = getContentText(asset)
      if (text) {
        const path = `${folder}/${baseName}.txt`
        zip.file(path, text)
        manifest.push({ campaign: campaignName, file: path, type: asset.type, id: asset.id })
      }
    }
  }

  if (manifest.length > 0) {
    zip.file('manifest.json', JSON.stringify({ exported_at: new Date().toISOString(), assets: manifest }, null, 2))
  }

  return zip.generateAsync({ type: 'blob' })
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
