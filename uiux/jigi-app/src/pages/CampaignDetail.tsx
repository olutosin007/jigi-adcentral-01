import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Loader2,
  Building2,
  Lightbulb,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GenerationPanel } from '@/components/generation'
import { ConceptDetailModal } from '@/components/generation/ConceptDetailModal'
import { CopyDetailModal } from '@/components/generation/CopyDetailModal'
import { ImagePreviewModal } from '@/components/generation/ImagePreviewModal'
import { AssetGrid } from '@/components/generation/AssetGrid'
import { UploadModal } from '@/components/upload/UploadModal'
import { CampaignWorkspace } from '@/components/campaign/CampaignWorkspace'
import { BriefSnippetBar } from '@/components/campaign/BriefSnippetBar'
import { CampaignBriefStage, type BriefFormData } from '@/components/campaign/CampaignBriefStage'
import {
  useCampaign,
  useBrand,
  useCampaignAssets,
  useDeleteAsset,
  useSubmitAsset,
  useValidateAssets,
} from '@/hooks/useCampaignQueries'
import { useCampaignStore } from '@/store/campaignStore'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { DeleteCampaignDialog } from '@/components/campaigns/DeleteCampaignDialog'
import { SubmitModal } from '@/components/review/SubmitModal'
import { getValidTransitions, type AssetStatus } from '@/lib/status'
import { shouldOpenAssetReview } from '@/lib/roles'
import {
  parseLegacyTab,
  parsePipelineStage,
  type PipelineStage,
  isGenerationStage,
} from '@/lib/campaign-workspace'
import type { ConceptResult, CopyResult, ImageResult } from '@/lib/ai'
import type { CreativeAsset } from '@/store/campaignStore'

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  active: 'bg-success/10 text-success border-success/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  archived: 'bg-muted text-muted-foreground border-border',
}

const STAGE_PRIMARY_CTA: Record<
  PipelineStage,
  { label: string; stage: PipelineStage }
> = {
  brief: { label: 'Generate concepts', stage: 'concepts' },
  concepts: { label: 'Generate concepts', stage: 'concepts' },
  copy: { label: 'Generate copy', stage: 'copy' },
  images: { label: 'Generate images', stage: 'images' },
  assets: { label: 'Generate concepts', stage: 'concepts' },
}

function getAssetDisplayName(asset: CreativeAsset): string {
  const content = asset.content as unknown as Record<string, unknown>
  if (asset.type === 'concept') return (content?.theme as string) || 'Untitled Concept'
  if (asset.type === 'copy') return ((content?.headline as string)?.slice(0, 40)) || 'Untitled Copy'
  if (asset.type === 'image') return ((content?.prompt_used as string)?.slice(0, 40)) || 'Generated Image'
  return 'Asset'
}

function resolveStage(searchParams: URLSearchParams): PipelineStage {
  const legacy = parseLegacyTab(searchParams.get('tab'))
  if (legacy) return legacy
  return parsePipelineStage(searchParams.get('stage'))
}

export function CampaignDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const stage = resolveStage(searchParams)

  const [isEditingBrief, setIsEditingBrief] = useState(false)
  const [briefData, setBriefData] = useState<BriefFormData | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [viewAsset, setViewAsset] = useState<CreativeAsset | null>(null)
  const [submitModalAsset, setSubmitModalAsset] = useState<{
    id: string
    name: string
    type: string
  } | null>(null)

  const queryClient = useQueryClient()
  const { user, profile } = useAuthStore()
  const { updateCampaign, deleteCampaign } = useCampaignStore()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)

  const { data: campaign, isLoading: campaignLoading } = useCampaign(id || '')
  const { data: brand } = useBrand(campaign?.brand_id ?? undefined)
  const { data: allAssets = [] } = useCampaignAssets(id || '')
  const deleteAsset = useDeleteAsset()
  const submitAsset = useSubmitAsset()
  const validateAssetsMutation = useValidateAssets()

  useEffect(() => {
    const tab = searchParams.get('tab')
    const legacy = parseLegacyTab(tab)
    if (legacy && !searchParams.get('stage')) {
      const next = new URLSearchParams(searchParams)
      next.delete('tab')
      next.set('stage', legacy)
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const setStage = (next: PipelineStage) => {
    const params = new URLSearchParams(searchParams)
    params.delete('tab')
    params.set('stage', next)
    setSearchParams(params, { replace: true })
  }

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

  const startBriefEdit = () => {
    if (!campaign) return
    const b = campaign.brief || {}
    setBriefData({
      objective: b.objective || '',
      audience: b.audience || '',
      channels: b.channels || [],
      requirements: b.requirements || '',
      key_message: b.key_message || '',
      tone_override: b.tone_override || [],
      reference_assets: b.reference_assets || [],
      exclusions: b.exclusions || '',
    })
    setIsEditingBrief(true)
    setStage('brief')
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
    if (shouldOpenAssetReview(profile?.role, asset.status as AssetStatus)) {
      navigate(`/app/review/${asset.id}`)
      return
    }
    setViewAsset(asset)
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
      {/* Campaign Header — page owns chrome (no AppLayout title) */}
      <div className="bg-background border-b border-border px-6 md:px-8 pt-5 pb-4 flex-shrink-0">
        <nav className="flex items-center gap-2 mb-2" aria-label="Breadcrumb">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Campaigns
          </button>
          <span className="text-muted-foreground/50 text-xs">/</span>
          <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
            {campaign.name}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
              {campaign.name}
            </h1>
            <div className="flex items-center gap-2.5 flex-wrap text-[13px] mt-2">
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
              {campaign.journey_mode === 'idea_first' ? (
                <Badge
                  variant="secondary"
                  className="bg-[#FEF3C7] text-[#D97706] dark:bg-[#422006] dark:text-[#FBBF24] border-transparent text-[10px] font-semibold"
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Idea-first
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-transparent text-[10px] font-semibold"
                >
                  Brand-grounded
                </Badge>
              )}
              <span className="text-muted-foreground">
                {approvedCount}/{totalCount} assets approved
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {campaign.status === 'archived' ? (
              <Button variant="ghost" size="sm" onClick={handleUnarchive} disabled={isArchiving}>
                {isArchiving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <ArchiveRestore className="w-3.5 h-3.5 mr-1" />
                )}
                {isArchiving ? 'Unarchiving…' : 'Unarchive'}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleArchive} disabled={isArchiving}>
                {isArchiving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Archive className="w-3.5 h-3.5 mr-1" />
                )}
                {isArchiving ? 'Archiving…' : 'Archive'}
              </Button>
            )}
            {campaign.status === 'draft' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:bg-destructive/10"
                aria-label="Delete campaign"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            )}
            <Badge
              variant="outline"
              className={statusStyles[campaign.status] || statusStyles.draft}
            >
              {campaign.status}
            </Badge>
            <Button
              size="sm"
              onClick={() => {
                const cta = STAGE_PRIMARY_CTA[stage]
                if (cta.stage !== stage) setStage(cta.stage)
              }}
            >
              {STAGE_PRIMARY_CTA[stage].label}
            </Button>
          </div>
        </div>
      </div>

      <BriefSnippetBar
        objective={brief.objective}
        audience={brief.audience}
        channels={brief.channels}
        onEditBrief={startBriefEdit}
        hidden={stage === 'brief'}
      />

      <CampaignWorkspace
        activeStage={stage}
        onStageChange={setStage}
        briefStage={
          <CampaignBriefStage
            campaign={campaign}
            campaignId={id || ''}
            brief={brief}
            isEditing={isEditingBrief}
            briefData={briefData}
            onStartEdit={() => {
              const b = campaign.brief || {}
              setBriefData({
                objective: b.objective || '',
                audience: b.audience || '',
                channels: b.channels || [],
                requirements: b.requirements || '',
                key_message: b.key_message || '',
                tone_override: b.tone_override || [],
                reference_assets: b.reference_assets || [],
                exclusions: b.exclusions || '',
              })
              setIsEditingBrief(true)
            }}
            onCancelEdit={() => setIsEditingBrief(false)}
            onSave={handleSaveBrief}
            onBriefDataChange={setBriefData}
          />
        }
        generationStage={
          isGenerationStage(stage) ? (
            <GenerationPanel
              campaign={campaign}
              brandId={campaign.brand_id || undefined}
              userId={user?.id}
              onSubmitAsset={handleSubmitAsset}
              embeddedInWorkspace
              stage={stage}
              onStageChange={(s) => setStage(s)}
            />
          ) : null
        }
        assetsStage={
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
        }
      />

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

      {viewAsset?.type === 'concept' && (
        <ConceptDetailModal
          open
          onOpenChange={(open) => !open && setViewAsset(null)}
          concept={viewAsset.content as ConceptResult}
          status={viewAsset.status}
          onSubmit={() => {
            handleSubmitAsset(viewAsset.id)
            setViewAsset(null)
          }}
        />
      )}

      {viewAsset?.type === 'copy' && (
        <CopyDetailModal
          open
          onOpenChange={(open) => !open && setViewAsset(null)}
          copy={viewAsset.content as CopyResult}
          status={viewAsset.status}
          onSubmit={() => {
            handleSubmitAsset(viewAsset.id)
            setViewAsset(null)
          }}
        />
      )}

      {viewAsset?.type === 'image' && (
        <ImagePreviewModal
          open
          onOpenChange={(open) => !open && setViewAsset(null)}
          image={viewAsset.content as ImageResult}
          isSaved
          status={viewAsset.status}
          onSubmit={() => {
            handleSubmitAsset(viewAsset.id)
            setViewAsset(null)
          }}
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
