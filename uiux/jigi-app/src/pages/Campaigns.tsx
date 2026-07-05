import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, LayoutGrid, List, Sparkles, Lightbulb, ArrowUpDown, MoreVertical, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteCampaignDialog } from '@/components/campaigns/DeleteCampaignDialog'
import { useCampaignStore, CAMPAIGN_STATUS_OPTIONS } from '@/store/campaignStore'
import { useBrandStore } from '@/store/brandStore'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { evaluateBriefReadiness } from '@/lib/brief-readiness'
import { BriefIncompleteBanner } from '@/components/campaign/BriefIncompleteBanner'
import type { Campaign } from '@/store/campaignStore'

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'updated', label: 'Date updated' },
  { value: 'status', label: 'Status' },
] as const

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

export function Campaigns() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('updated')

  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const {
    campaigns,
    isLoading,
    error: campaignsError,
    fetchCampaigns,
    updateCampaign,
    deleteCampaign,
  } = useCampaignStore()
  const { brands, fetchBrands } = useBrandStore()
  const [deleteTargetCampaign, setDeleteTargetCampaign] = useState<Campaign | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [archivingCampaignId, setArchivingCampaignId] = useState<string | null>(null)

  useEffect(() => {
    fetchCampaigns()
    fetchBrands()
  }, [fetchCampaigns, fetchBrands])

  const getBrandName = (brandId: string | null | undefined) => {
    if (!brandId) return null
    const brand = brands.find(b => b.id === brandId)
    return brand?.name || null
  }

  const getStatusStyle = (status: string) => {
    const option = CAMPAIGN_STATUS_OPTIONS.find(o => o.value === status)
    return option?.color || 'bg-muted text-muted-foreground'
  }

  const filteredAndSortedCampaigns = useMemo(() => {
    let result = campaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'status') return a.status.localeCompare(b.status)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
    return result
  }, [campaigns, debouncedSearch, statusFilter, sortBy])

  const incompleteBriefCount = useMemo(
    () =>
      filteredAndSortedCampaigns.filter((c) =>
        !evaluateBriefReadiness(c.brief ?? {}, {
          journey_mode: c.journey_mode,
          seed_idea: c.seed_idea ?? null,
        }).ready
      ).length,
    [filteredAndSortedCampaigns]
  )

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (campaignsError && campaigns.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        <EmptyState
          icon={Sparkles}
          title="Couldn’t load campaigns"
          description={campaignsError}
          action={{ label: 'Try again', onClick: () => void fetchCampaigns() }}
        />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Campaigns
          </h1>
          <p className="text-muted-foreground">View and manage your creative campaigns</p>
        </div>
        <Button
          onClick={() => navigate('/app/campaigns/new')}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          New campaign
        </Button>
      </div>

      {incompleteBriefCount > 0 && (
        <BriefIncompleteBanner
          readiness={{
            ready: false,
            missing: [`${incompleteBriefCount} campaign${incompleteBriefCount === 1 ? '' : 's'} with incomplete briefs`],
            warnings: [],
          }}
        />
      )}

      {campaigns.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-1.5 shrink-0" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {CAMPAIGN_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <ArrowUpDown className="h-4 w-4 mr-1.5 shrink-0" />
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
      )}

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No campaigns yet"
          description="Create your first campaign to start generating creative assets."
          action={{
            label: 'Create campaign',
            onClick: () => navigate('/app/campaigns/new'),
          }}
        />
      ) : filteredAndSortedCampaigns.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No campaigns found"
          description="Try adjusting your search or filter."
          action={{
            label: 'Clear filters',
            onClick: () => {
              setSearchQuery('')
              setStatusFilter('all')
            },
          }}
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
          {filteredAndSortedCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              getBrandName={getBrandName}
              getStatusStyle={getStatusStyle}
              onNavigate={() => navigate(`/app/campaigns/${campaign.id}`)}
              onArchive={async () => {
                setArchivingCampaignId(campaign.id)
                const result = await updateCampaign(campaign.id, { status: 'archived' })
                setArchivingCampaignId(null)
                if (result.success) toast.success('Campaign archived')
                else toast.error(result.error ?? 'Failed to archive')
              }}
              onUnarchive={async () => {
                setArchivingCampaignId(campaign.id)
                const result = await updateCampaign(campaign.id, { status: 'draft' })
                setArchivingCampaignId(null)
                if (result.success) toast.success('Campaign unarchived')
                else toast.error(result.error ?? 'Failed to unarchive')
              }}
              onDeleteRequest={() => setDeleteTargetCampaign(campaign)}
              isArchiving={archivingCampaignId === campaign.id}
            />
          ))}
        </div>
      )}

      {deleteTargetCampaign && (
        <DeleteCampaignDialog
          open={!!deleteTargetCampaign}
          onOpenChange={(open) => !open && setDeleteTargetCampaign(null)}
          campaignName={deleteTargetCampaign.name}
          onConfirm={async () => {
            setIsDeleting(true)
            const result = await deleteCampaign(deleteTargetCampaign.id)
            setIsDeleting(false)
            if (result.success) {
              toast.success('Campaign deleted')
              setDeleteTargetCampaign(null)
            } else {
              toast.error(result.error ?? 'Failed to delete campaign')
            }
          }}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}

interface CampaignCardProps {
  campaign: Campaign
  getBrandName: (id: string | null | undefined) => string | null
  getStatusStyle: (status: string) => string
  onNavigate: () => void
  onArchive: () => Promise<void>
  onUnarchive: () => Promise<void>
  onDeleteRequest: () => void
  isArchiving?: boolean
}

function CampaignCard({ campaign, getBrandName, getStatusStyle, onNavigate, onArchive, onUnarchive, onDeleteRequest, isArchiving = false }: CampaignCardProps) {
  const briefReadiness = evaluateBriefReadiness(campaign.brief ?? {}, {
    journey_mode: campaign.journey_mode,
    seed_idea: campaign.seed_idea ?? null,
  })

  return (
    <Card
      className="cursor-pointer shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow duration-200 border-border rounded-xl"
      onClick={onNavigate}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{campaign.name}</CardTitle>
            <CardDescription className="truncate">
              {getBrandName(campaign.brand_id) || 'No brand attached'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Campaign actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {campaign.status === 'archived' ? (
                  <DropdownMenuItem
                    onSelect={() => onUnarchive()}
                    disabled={isArchiving}
                  >
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    {isArchiving ? 'Unarchiving...' : 'Unarchive'}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() => onArchive()}
                    disabled={isArchiving}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    {isArchiving ? 'Archiving...' : 'Archive'}
                  </DropdownMenuItem>
                )}
                {campaign.status === 'draft' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => onDeleteRequest()}
                      className="text-destructive"
                      disabled={isArchiving}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="secondary" className={getStatusStyle(campaign.status)}>
              {campaign.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {campaign.updated_at && formatDistanceToNow(new Date(campaign.updated_at), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-1">
            {campaign.journey_mode === 'idea_first' ? (
              <>
                <Lightbulb className="h-3.5 w-3.5" />
                <span>Quick start</span>
              </>
            ) : (
              <span>Brand-first</span>
            )}
          </div>
        </div>
        {campaign.seed_idea && campaign.journey_mode === 'idea_first' && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic">
            &quot;{campaign.seed_idea}&quot;
          </p>
        )}
        {!briefReadiness.ready && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <BriefIncompleteBanner readiness={briefReadiness} compact />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
