import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Pencil,
  Loader2,
  Building2,
  Lightbulb,
  Save,
  Sparkles,
  X,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { GenerationPanel } from '@/components/generation'
import { AssetGrid } from '@/components/generation/AssetGrid'
import { UploadModal } from '@/components/upload/UploadModal'
import { useCampaign, useBrand, useCampaignAssets, useDeleteAsset, useSubmitAsset, useValidateAssets } from '@/hooks/useCampaignQueries'
import { useCampaignStore, CHANNEL_OPTIONS, TONE_OPTIONS } from '@/store/campaignStore'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { generateCreativesViaRouter, type CreativeRouterVariant } from '@/lib/api-client'
import { DeleteCampaignDialog } from '@/components/campaigns/DeleteCampaignDialog'
import { ReferenceAssetUploadInline } from '@/components/campaigns/ReferenceAssetUploadInline'
import { SubmitModal } from '@/components/review/SubmitModal'
import { getValidTransitions, type AssetStatus } from '@/lib/status'
import type { CreativeAsset } from '@/store/campaignStore'

type MainTab = 'brief' | 'generated' | 'assets'

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-success/10 text-success',
  completed: 'bg-primary/10 text-primary',
  archived: 'bg-amber-100 text-amber-800',
}

function getAssetDisplayName(asset: CreativeAsset): string {
  const content = asset.content as unknown as Record<string, unknown>
  if (asset.type === 'concept') return (content?.theme as string) || 'Untitled Concept'
  if (asset.type === 'copy') return ((content?.headline as string)?.slice(0, 40)) || 'Untitled Copy'
  if (asset.type === 'image') return ((content?.prompt_used as string)?.slice(0, 40)) || 'Generated Image'
  return 'Asset'
}

export function CampaignDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [mainTab, setMainTab] = useState<MainTab>('generated')
  const [isEditingBrief, setIsEditingBrief] = useState(false)
  const [briefData, setBriefData] = useState<{
    objective: string
    audience: string
    channels: string[]
    requirements: string
    key_message: string
    tone_override: string[]
    reference_assets: { file_url: string; filename?: string }[]
    exclusions: string
  } | null>(null)
  const [routerLoading, setRouterLoading] = useState(false)
  const [routerVariants, setRouterVariants] = useState<CreativeRouterVariant[] | null>(null)
  const [routerJobId, setRouterJobId] = useState<string | null>(null)
  const [submitModalAsset, setSubmitModalAsset] = useState<{
    id: string
    name: string
    type: string
  } | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { updateCampaign, deleteCampaign } = useCampaignStore()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  const { data: campaign, isLoading: campaignLoading } = useCampaign(id || '')
  const { data: brand } = useBrand(campaign?.brand_id)
  const { data: allAssets = [] } = useCampaignAssets(id || '')
  const deleteAsset = useDeleteAsset()
  const submitAsset = useSubmitAsset()
  const validateAssetsMutation = useValidateAssets()

  const goBack = () => navigate('/app/campaigns')

  const handleArchive = async () => {
    if (!campaign) return
    setIsArchiving(true)
    const result = await updateCampaign(campaign.id, { status: 'archived' })
    setIsArchiving(false)
    if (result.success) {
      toast.success('Campaign archived')
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    } else {
      toast.error(result.error ?? 'Failed to archive')
    }
  }

  const handleUnarchive = async () => {
    if (!campaign) return
    setIsArchiving(true)
    const result = await updateCampaign(campaign.id, { status: 'draft' })
    setIsArchiving(false)
    if (result.success) {
      toast.success('Campaign unarchived')
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    } else {
      toast.error(result.error ?? 'Failed to unarchive')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!campaign) return
    setIsDeleting(true)
    const result = await deleteCampaign(campaign.id)
    setIsDeleting(false)
    if (result.success) {
      toast.success('Campaign deleted')
      navigate('/app/campaigns')
      setShowDeleteDialog(false)
    } else {
      toast.error(result.error ?? 'Failed to delete campaign')
    }
  }

  const handleSaveBrief = async () => {
    if (!campaign || !briefData) return

    const result = await updateCampaign(campaign.id, {
      brief: briefData,
    })

    if (result.success) {
      toast.success('Brief saved')
      setIsEditingBrief(false)
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    } else {
      toast.error('Failed to save brief')
    }
  }

  const handleDeleteAsset = async (assetId: string) => {
    if (!id) return
    try {
      await deleteAsset.mutateAsync({ assetId, campaignId: id })
      toast.success('Asset deleted')
    } catch {
      toast.error('Failed to delete asset')
    }
  }

  const handleViewAsset = (asset: CreativeAsset) => {
    navigate(`/app/review/${asset.id}`)
  }

  const handleSubmitAsset = (assetId: string) => {
    if (!id || !user) return
    const asset = allAssets.find((a) => a.id === assetId)
    if (!asset) return
    const valid = getValidTransitions(asset.status as AssetStatus)
    if (valid.length === 0) {
      toast.error('This asset cannot be submitted for review in its current status')
      return
    }
    setSubmitModalAsset({
      id: asset.id,
      name: getAssetDisplayName(asset),
      type: asset.type,
    })
  }

  const handleSubmitModalConfirm = async (targetStatus: AssetStatus, note?: string) => {
    if (!submitModalAsset || !id || !user) return
    try {
      await submitAsset.mutateAsync({
        assetId: submitModalAsset.id,
        campaignId: id,
        userId: user.id,
        targetStatus,
        note,
      })
      setSubmitModalAsset(null)
      toast.success('Asset submitted for review')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit asset')
    }
  }

  const handleGenerateCreativesBeta = async () => {
    if (!id) return
    setRouterLoading(true)
    setRouterVariants(null)
    setRouterJobId(null)
    try {
      const result = await generateCreativesViaRouter(id)
      setRouterJobId(result.jobId)
      setRouterVariants(result.variants)
      toast.success(`Generated ${result.variants.length} creative variants`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate creatives')
    } finally {
      setRouterLoading(false)
    }
  }

  if (campaignLoading) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <span className="text-muted-foreground">/</span>
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-32 rounded-xl bg-muted animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Campaign not found</p>
        <Button variant="link" onClick={goBack} className="mt-4">
          Back to campaigns
        </Button>
      </div>
    )
  }

  const brief = campaign.brief || {}
  const approvedCount = allAssets.filter((a) => a.status === 'approved').length
  const totalCount = allAssets.length

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Campaign Header */}
      <div className="bg-background border-b border-border px-6 md:px-8 py-5 flex-shrink-0">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-4" aria-label="Breadcrumb">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Campaigns
          </button>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
            {campaign.name}
          </span>
        </nav>

        {/* Summary Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-2">{campaign.name}</h1>
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <span className="text-muted-foreground">
                Last updated {formatDistanceToNow(new Date(campaign.updated_at), { addSuffix: true })}
              </span>
              {brand ? (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{brand.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground italic">No brand attached</span>
              )}
              {campaign.journey_mode === 'idea_first' && (
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px]">
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Idea-first
                </Badge>
              )}
              <span className="text-muted-foreground">
                {approvedCount}/{totalCount} assets approved
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateCreativesBeta}
              disabled={routerLoading}
            >
              {routerLoading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1" />
              )}
              Generate Creatives (Beta)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMainTab('brief')}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Edit Brief
            </Button>
            {campaign.status === 'archived' ? (
              <Button variant="outline" size="sm" onClick={handleUnarchive} disabled={isArchiving}>
                {isArchiving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <ArchiveRestore className="w-3.5 h-3.5 mr-1" />
                )}
                {isArchiving ? 'Unarchiving...' : 'Unarchive'}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleArchive} disabled={isArchiving}>
                {isArchiving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Archive className="w-3.5 h-3.5 mr-1" />
                )}
                {isArchiving ? 'Archiving...' : 'Archive'}
              </Button>
            )}
            {campaign.status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
                aria-label="Delete campaign"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            )}
            <Badge className={statusStyles[campaign.status] || statusStyles.draft}>
              {campaign.status}
            </Badge>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex items-center gap-1 border-b border-border -mb-px">
          {(['brief', 'generated', 'assets'] as MainTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                mainTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'generated' ? 'Generated' : tab === 'assets' ? 'All Assets' : 'Brief'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* Brief Tab */}
        {mainTab === 'brief' && (
          <div className="p-6 md:p-8 overflow-y-auto h-full">
            <div className="max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Campaign Brief</h2>
                {isEditingBrief ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingBrief(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveBrief}>
                      <Save className="w-3.5 h-3.5 mr-1" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBriefData({
                        objective: brief.objective || '',
                        audience: brief.audience || '',
                        channels: brief.channels || [],
                        requirements: brief.requirements || '',
                        key_message: brief.key_message || '',
                        tone_override: brief.tone_override || [],
                        reference_assets: brief.reference_assets || [],
                        exclusions: brief.exclusions || '',
                      })
                      setIsEditingBrief(true)
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {campaign.seed_idea && (
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Seed Idea
                  </label>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900 italic">"{campaign.seed_idea}"</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Objective
                </label>
                {isEditingBrief ? (
                  <Textarea
                    value={briefData?.objective || ''}
                    onChange={(e) =>
                      setBriefData((prev) => prev && { ...prev, objective: e.target.value })
                    }
                    placeholder="What do you want this campaign to achieve?"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-foreground">
                    {brief.objective || <span className="text-muted-foreground italic">Not specified</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Target Audience
                </label>
                {isEditingBrief ? (
                  <Textarea
                    value={briefData?.audience || ''}
                    onChange={(e) =>
                      setBriefData((prev) => prev && { ...prev, audience: e.target.value })
                    }
                    placeholder="Describe your target audience"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-foreground">
                    {brief.audience || <span className="text-muted-foreground italic">Not specified</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Key Message
                </label>
                {isEditingBrief ? (
                  <Textarea
                    value={briefData?.key_message || ''}
                    onChange={(e) =>
                      setBriefData((prev) => prev && { ...prev, key_message: e.target.value })
                    }
                    placeholder="The single message this campaign must communicate"
                    rows={2}
                    maxLength={500}
                  />
                ) : (
                  <p className="text-sm text-foreground">
                    {brief.key_message || <span className="text-muted-foreground italic">Not specified</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Tone Override
                </label>
                {isEditingBrief ? (
                  <div className="flex flex-wrap gap-3">
                    {TONE_OPTIONS.map((tone) => (
                      <label key={tone.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={briefData?.tone_override?.includes(tone.value)}
                          onCheckedChange={(checked) => {
                            setBriefData((prev) => {
                              if (!prev) return prev
                              const tones = checked
                                ? [...(prev.tone_override || []), tone.value]
                                : prev.tone_override?.filter((t) => t !== tone.value) || []
                              return { ...prev, tone_override: tones }
                            })
                          }}
                        />
                        <span className="text-sm text-foreground">{tone.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {brief.tone_override?.length ? (
                      brief.tone_override.map((t) => {
                        const opt = TONE_OPTIONS.find((o) => o.value === t)
                        return (
                          <Badge key={t} variant="secondary">
                            {opt?.label || t}
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground italic">None selected</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Channels
                </label>
                {isEditingBrief ? (
                  <div className="flex flex-wrap gap-3">
                    {CHANNEL_OPTIONS.map((ch) => (
                      <label key={ch.value} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={briefData?.channels?.includes(ch.value)}
                          onCheckedChange={(checked) => {
                            setBriefData((prev) => {
                              if (!prev) return prev
                              const channels = checked
                                ? [...(prev.channels || []), ch.value]
                                : prev.channels?.filter((c) => c !== ch.value) || []
                              return { ...prev, channels }
                            })
                          }}
                        />
                        <span className="text-sm text-foreground">{ch.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {brief.channels?.length ? (
                      brief.channels.map((ch: string) => {
                        const channel = CHANNEL_OPTIONS.find((c) => c.value === ch)
                        return (
                          <Badge key={ch} variant="secondary">
                            {channel?.label || ch}
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-sm text-muted-foreground italic">None selected</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Additional Requirements
                </label>
                {isEditingBrief ? (
                  <Textarea
                    value={briefData?.requirements || ''}
                    onChange={(e) =>
                      setBriefData((prev) => prev && { ...prev, requirements: e.target.value })
                    }
                    placeholder="Any specific constraints or guidelines"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-foreground">
                    {brief.requirements || (
                      <span className="text-muted-foreground italic">None specified</span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Reference Assets
                </label>
                {isEditingBrief ? (
                  <ReferenceAssetUploadInline
                    campaignId={id || ''}
                    value={briefData?.reference_assets || []}
                    onChange={(assets) =>
                      setBriefData((prev) => prev && { ...prev, reference_assets: assets })
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    {brief.reference_assets?.length ? (
                      brief.reference_assets.map((a) => (
                        <a
                          key={a.file_url}
                          href={a.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-primary hover:underline truncate"
                        >
                          {a.filename || 'Reference'}
                        </a>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground italic">None uploaded</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Exclusions
                </label>
                {isEditingBrief ? (
                  <Textarea
                    value={briefData?.exclusions || ''}
                    onChange={(e) =>
                      setBriefData((prev) => prev && { ...prev, exclusions: e.target.value })
                    }
                    placeholder="Things to avoid: competitor names, clichés, banned phrases..."
                    rows={2}
                    maxLength={1000}
                  />
                ) : (
                  <p className="text-sm text-foreground">
                    {brief.exclusions || (
                      <span className="text-muted-foreground italic">None specified</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Generated Tab */}
        {mainTab === 'generated' && (
          <div className="flex flex-col h-full overflow-hidden">
            {routerVariants && routerVariants.length > 0 && (
              <div className="flex-shrink-0 p-4 bg-primary/10 border-b border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Template creatives (Beta) — Job {routerJobId ?? ''}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRouterVariants(null)
                      setRouterJobId(null)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {routerVariants.map((v) => (
                    <a
                      key={v.id}
                      href={v.assetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border bg-background overflow-hidden hover:border-primary hover:shadow-md transition-all"
                    >
                      {v.assetUrl ? (
                        <img
                          src={v.assetUrl}
                          alt={`Creative ${v.id}`}
                          className="w-full aspect-square object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          No preview
                        </div>
                      )}
                      <div className="p-1.5 text-[10px] text-muted-foreground truncate" title={v.id}>
                        {v.provider} · {v.placements.join(', ')}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <GenerationPanel
                campaign={campaign}
                brandId={campaign.brand_id || undefined}
                userId={user?.id}
              />
            </div>
          </div>
        )}

        {/* All Assets Tab */}
        {mainTab === 'assets' && (
          <div className="p-6 overflow-y-auto h-full">
            <AssetGrid
              assets={allAssets}
              campaignId={id}
              onViewAsset={handleViewAsset}
              onDeleteAsset={handleDeleteAsset}
              onSubmitAsset={handleSubmitAsset}
              onUploadAsset={() => setShowUploadModal(true)}
              onRevalidateAll={
                id
                  ? async () => {
                      try {
                        const assetIds = allAssets.map((a) => a.id)
                        if (assetIds.length === 0) return
                        await validateAssetsMutation.mutateAsync({
                          campaignId: id,
                          assetIds,
                        })
                        toast.success('Re-validation complete')
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Re-validation failed')
                      }
                    }
                  : undefined
              }
              onRevalidateSelected={
                id
                  ? async (assetIds) => {
                      try {
                        await validateAssetsMutation.mutateAsync({
                          campaignId: id,
                          assetIds,
                        })
                        toast.success('Re-validation complete')
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Re-validation failed')
                      }
                    }
                  : undefined
              }
              isRevalidating={validateAssetsMutation.isPending}
            />
          </div>
        )}
      </div>

      <SubmitModal
        open={!!submitModalAsset}
        onOpenChange={(open) => !open && setSubmitModalAsset(null)}
        assetName={submitModalAsset?.name ?? ''}
        assetType={submitModalAsset?.type ?? ''}
        onSubmit={handleSubmitModalConfirm}
        isSubmitting={submitAsset.isPending}
        allowAgencyReview={true}
      />

      {id && (
        <UploadModal
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          campaignId={id}
          userId={user?.id}
        />
      )}

      <DeleteCampaignDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        campaignName={campaign?.name ?? ''}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  )
}
