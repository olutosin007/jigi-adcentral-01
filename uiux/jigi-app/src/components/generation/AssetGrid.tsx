import { useState } from 'react'
import { Search, Filter, Trash2, Send, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { AssetCard } from './AssetCard'
import { toast } from 'sonner'
import type { CreativeAsset } from '@/store/campaignStore'

interface AssetGridProps {
  assets: CreativeAsset[]
  campaignId?: string
  onDeleteAsset?: (assetId: string) => void
  onSubmitAsset?: (assetId: string) => void
  onViewAsset?: (asset: CreativeAsset) => void
  onUploadAsset?: () => void
  /** PRD 10: Batch re-validation. When provided, shows Re-validate actions. */
  onRevalidateAll?: () => Promise<void>
  onRevalidateSelected?: (assetIds: string[]) => Promise<void>
  isRevalidating?: boolean
}

export function AssetGrid({
  assets,
  campaignId,
  onDeleteAsset,
  onSubmitAsset,
  onViewAsset,
  onUploadAsset,
  onRevalidateAll,
  onRevalidateSelected,
  isRevalidating = false,
}: AssetGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [driftFilter, setDriftFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredAssets = assets.filter((asset) => {
    const content = asset.content as any
    const name = content?.theme || content?.headline || content?.prompt_used || ''
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || asset.type === typeFilter
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
    const matchesSource =
      sourceFilter === 'all' ||
      (sourceFilter === 'ai' && (!asset.source || asset.source === 'ai')) ||
      (sourceFilter === 'uploaded' && asset.source === 'uploaded')
    const matchesDrift =
      driftFilter === 'all' ||
      (driftFilter === 'review_required' && asset.drift_status === 'review_required')
    return matchesSearch && matchesType && matchesStatus && matchesSource && matchesDrift
  })

  const driftCount = assets.filter((a) => a.drift_status === 'review_required').length

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const selectAll = () => {
    const draftIds = filteredAssets.filter((a) => a.status === 'draft').map((a) => a.id)
    setSelectedIds(new Set(draftIds))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    const draftIds = filteredAssets.filter((a) => a.status === 'draft').map((a) => a.id)
    const toDelete = [...selectedIds].filter((id) => draftIds.includes(id))
    const nonDraftSelected = [...selectedIds].some((id) => !draftIds.includes(id))
    if (nonDraftSelected) {
      toast('Only draft assets can be deleted.')
    }
    toDelete.forEach((id) => onDeleteAsset?.(id))
    clearSelection()
  }

  const handleBulkSubmit = () => {
    selectedIds.forEach((id) => onSubmitAsset?.(id))
    clearSelection()
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search assets..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="concept">Concepts</SelectItem>
            <SelectItem value="copy">Copy</SelectItem>
            <SelectItem value="image">Images</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="agency_review">Agency Review</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="brand_review">Brand Review</SelectItem>
            <SelectItem value="changes_requested">Changes Requested</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="ai">AI</SelectItem>
            <SelectItem value="uploaded">Uploaded</SelectItem>
          </SelectContent>
        </Select>

        <Select value={driftFilter} onValueChange={setDriftFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Drift" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            <SelectItem value="review_required">
              Review Required
              {driftCount > 0 && ` (${driftCount})`}
            </SelectItem>
          </SelectContent>
        </Select>

        {onRevalidateAll && campaignId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRevalidateAll}
            disabled={isRevalidating || assets.length === 0}
          >
            {isRevalidating ? (
              <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
            )}
            Re-validate All
          </Button>
        )}

        {onUploadAsset && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUploadAsset}
          >
            Upload asset
          </Button>
        )}
      </div>

      {/* Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          {onRevalidateSelected && campaignId && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await onRevalidateSelected([...selectedIds])
                clearSelection()
              }}
              disabled={isRevalidating}
            >
              {isRevalidating ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
              )}
              Re-validate Selected
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleBulkSubmit}>
            <Send className="w-3.5 h-3.5 mr-1" />
            Submit Selected
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-destructive hover:text-destructive/90">
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection} aria-label="Clear selection">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Grid */}
      {filteredAssets.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-12 w-12 text-muted-foreground" />}
          title={assets.length === 0 ? 'No assets yet' : 'No matching assets'}
          description={
            assets.length === 0
              ? 'Generate some concepts or copy to get started.'
              : 'Try adjusting your filters.'
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              selected={selectedIds.has(asset.id)}
              onSelect={(checked) => toggleSelect(asset.id, checked)}
              onView={() => onViewAsset?.(asset)}
              onDelete={() => onDeleteAsset?.(asset.id)}
              onSubmit={() => onSubmitAsset?.(asset.id)}
            />
          ))}
        </div>
      )}

      {/* Select All */}
      {filteredAssets.length > 0 && selectedIds.size === 0 && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select all drafts ({filteredAssets.filter((a) => a.status === 'draft').length})
          </Button>
        </div>
      )}
    </div>
  )
}
