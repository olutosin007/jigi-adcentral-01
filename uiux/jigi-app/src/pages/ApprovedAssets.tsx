import { useState, useMemo } from 'react'
import {
  Download,
  Search,
  LayoutGrid,
  List,
  FolderOpen,
  CheckCircle,
  Loader2,
  Image as ImageIcon,
  FileText,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { buildApprovedAssetsZip, triggerBlobDownload } from '@/lib/export-approved-zip'
import { useApprovedAssets } from '@/hooks/useDashboardQueries'
import { ApprovedAssetCard, AssetDetailModal } from '@/components/approved'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CreativeAsset, ConceptContent, CopyContent, ImageContent } from '@/store/campaignStore'

const ASSET_TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'concept', label: 'Concept' },
  { value: 'copy', label: 'Copy' },
  { value: 'image', label: 'Image' },
] as const

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'type', label: 'Type' },
] as const

function getAssetName(asset: CreativeAsset): string {
  if (asset.type === 'concept' && 'theme' in asset.content) {
    return (asset.content as ConceptContent).theme || 'Untitled Concept'
  }
  if (asset.type === 'copy' && 'headline' in asset.content) {
    return (asset.content as CopyContent).headline || 'Untitled Copy'
  }
  if (asset.type === 'image' && 'prompt_used' in asset.content) {
    return (asset.content as ImageContent).prompt_used?.slice(0, 40) || 'Generated Image'
  }
  return `Asset ${asset.id.slice(0, 8)}`
}

function getContentText(asset: CreativeAsset): string {
  if (asset.type === 'concept' && 'theme' in asset.content) {
    const c = asset.content as ConceptContent
    return `Theme: ${c.theme}\n\nHeadlines:\n${c.headlines?.join('\n') ?? ''}\n\nVisual Direction: ${c.visual_direction}\n\nRationale: ${c.rationale}`
  }
  if (asset.type === 'copy' && 'headline' in asset.content) {
    const c = asset.content as CopyContent
    return `${c.headline}\n\n${c.body}\n\nCTA: ${c.cta}`
  }
  if (asset.type === 'image' && 'prompt_used' in asset.content) {
    return (asset.content as ImageContent).prompt_used ?? ''
  }
  return ''
}

export function ApprovedAssets() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [selectedAsset, setSelectedAsset] = useState<CreativeAsset | null>(null)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [isExportingZip, setIsExportingZip] = useState(false)

  const { data: groupedAssets, isLoading } = useApprovedAssets()

  const filteredGroups = useMemo(() => {
    if (!groupedAssets) return []
    const query = searchQuery.trim().toLowerCase()
    const type = typeFilter === 'all' ? null : typeFilter

    let groups = groupedAssets.map((group) => ({
      ...group,
      assets: group.assets.filter((asset) => {
        const matchesSearch =
          !query ||
          getAssetName(asset).toLowerCase().includes(query) ||
          group.campaignName.toLowerCase().includes(query)
        const matchesType = !type || asset.type === type
        return matchesSearch && matchesType
      }),
    }))
    groups = groups.filter((g) => g.assets.length > 0)

    if (sortBy === 'campaign') {
      groups.sort((a, b) => a.campaignName.localeCompare(b.campaignName))
    } else if (sortBy === 'type') {
      groups.sort((a, b) => {
        const typeA = a.assets[0]?.type ?? ''
        const typeB = b.assets[0]?.type ?? ''
        return typeA.localeCompare(typeB)
      })
    } else {
      groups.sort((a, b) => {
        const dateA = a.assets[0]?.updated_at ?? ''
        const dateB = b.assets[0]?.updated_at ?? ''
        return new Date(dateB).getTime() - new Date(dateA).getTime()
      })
    }

    return groups
  }, [groupedAssets, searchQuery, typeFilter, sortBy])

  const totalAssets = useMemo(() => {
    return filteredGroups.reduce((acc, group) => acc + group.assets.length, 0)
  }, [filteredGroups])

  const handleDownload = async (asset: CreativeAsset) => {
    setIsDownloading(asset.id)
    try {
      const imageContent = asset.type === 'image' ? (asset.content as ImageContent) : null
      
      if (imageContent?.url) {
        const response = await fetch(imageContent.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${getAssetName(asset)}.${getFileExtension(asset)}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Asset downloaded')
      } else {
        const contentText = getContentText(asset)
        if (contentText) {
          const blob = new Blob([contentText], { type: 'text/plain' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${getAssetName(asset)}.txt`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          toast.success('Content downloaded')
        } else {
          toast.error('No downloadable content available')
        }
      }
    } catch {
      toast.error('Download failed')
    } finally {
      setIsDownloading(null)
    }
  }

  const handleExportAll = async () => {
    if (totalAssets === 0) return
    setIsExportingZip(true)
    toast.info('Building zip archive…', { duration: 3000 })
    try {
      const items = filteredGroups.flatMap((group) =>
        group.assets.map((asset) => ({
          campaignName: group.campaignName,
          asset,
          fileName: getAssetName(asset),
          getContentText,
          getFileExtension,
        }))
      )
      const blob = await buildApprovedAssetsZip(items)
      const stamp = new Date().toISOString().slice(0, 10)
      triggerBlobDownload(blob, `jigi-approved-assets-${stamp}.zip`)
      toast.success('Zip download started')
    } catch {
      toast.error('Export failed — try downloading individual assets')
    } finally {
      setIsExportingZip(false)
    }
  }

  const getSelectedCampaignName = () => {
    if (!selectedAsset) return undefined
    const group = groupedAssets?.find((g) => g.assets.some((a) => a.id === selectedAsset.id))
    return group?.campaignName
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6" data-tour="approved-assets">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Approved Assets</h1>
          <p className="text-muted-foreground">
            {totalAssets} approved asset{totalAssets !== 1 ? 's' : ''} ready for use
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportAll}
          disabled={totalAssets === 0 || isExportingZip}
        >
          {isExportingZip ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export all
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {ASSET_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            className="rounded-none border-r border-border"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            className="rounded-none"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {totalAssets === 0 && (
        <EmptyState
          icon={<CheckCircle className="h-12 w-12 text-primary" />}
          title={searchQuery ? 'No assets found' : 'No approved assets yet'}
          description={
            searchQuery
              ? 'No assets match your search. Try a different term.'
              : "Assets will appear here once they've been approved in the review queue."
          }
        />
      )}

      {/* Grouped Assets */}
      {filteredGroups.map((group) => (
        <Card key={group.campaignId} className="overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl">
          <CardHeader className="bg-muted/50 dark:bg-muted/20 py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">{group.campaignName}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {group.assets.length} asset{group.assets.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {viewMode === 'grid' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.assets.map((asset) => (
                  <ApprovedAssetCard
                    key={asset.id}
                    asset={asset}
                    onView={setSelectedAsset}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {group.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200 cursor-pointer"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-background rounded border border-border">
                        {asset.type === 'image' && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                        {asset.type === 'copy' && <FileText className="h-4 w-4 text-muted-foreground" />}
                        {asset.type === 'concept' && <Lightbulb className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getAssetName(asset)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{asset.type}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(asset)
                      }}
                      disabled={isDownloading === asset.id}
                    >
                      {isDownloading === asset.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Asset Detail Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        open={!!selectedAsset}
        onOpenChange={(open) => !open && setSelectedAsset(null)}
        onDownload={handleDownload}
        campaignName={getSelectedCampaignName()}
      />
    </div>
  )
}

function getFileExtension(asset: CreativeAsset): string {
  if (asset.type === 'image') {
    const imageContent = asset.content as ImageContent
    if (imageContent?.url) {
      const match = imageContent.url.match(/\.(\w+)(?:\?|$)/)
      if (match) return match[1]
    }
    return 'png'
  }
  return 'txt'
}
