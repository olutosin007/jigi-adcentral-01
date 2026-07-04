import { useEffect, useMemo, useState } from 'react'
import { Sparkles, RefreshCw, AlertCircle, Lightbulb, FileText, Image, Wand2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ConceptCard } from './ConceptCard'
import { CopyCard } from './CopyCard'
import { ImageCard } from './ImageCard'
import { ImagePreviewModal } from './ImagePreviewModal'
import { ConceptDetailModal } from './ConceptDetailModal'
import { CopyDetailModal } from './CopyDetailModal'
import { GenerationLoadingState } from './GenerationLoadingState'
import { GenerationHistory } from './GenerationHistory'
import {
  useGenerateConcepts,
  useGenerateCopy,
  useGenerateImage,
  useCampaignAssets,
  useDeleteAsset,
  useBrand,
} from '@/hooks/useCampaignQueries'
import { UploadModal } from '@/components/upload/UploadModal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { generateText } from '@/lib/api-client'
import type { Campaign, CreativeAsset } from '@/store/campaignStore'
import type { BrandIncludeFlags, ConceptResult, CopyImageAnchor, CopyResult, ImageResult } from '@/lib/ai'
import { DEFAULT_BRAND_INCLUDE } from '@/lib/ai'
import { cn } from '@/lib/utils'
import { getPrimaryCopyBudgetChars } from '@/lib/channel-constraints'
import { toast } from 'sonner'
import type { GenerationStage } from '@/lib/campaign-workspace'

type GenerationType = GenerationStage
type ImageTier = 'draft' | 'refine' | 'final'

function copyAssetToImageAnchor(assetId: string, copy: CopyResult): CopyImageAnchor {
  const body = copy.body?.trim() || ''
  return {
    copy_asset_id: assetId,
    headline: copy.headline?.trim() || undefined,
    key_message: copy.key_message_delivery?.trim() || undefined,
    body_snippet: body ? body.slice(0, 280) : undefined,
  }
}

interface GenerationPanelProps {
  campaign: Campaign
  brandId?: string
  userId?: string
  onSubmitAsset?: (assetId: string) => void
  embeddedInWorkspace?: boolean
  stage?: GenerationStage
  onStageChange?: (stage: GenerationStage) => void
}

export function GenerationPanel({
  campaign,
  brandId,
  userId,
  onSubmitAsset,
  embeddedInWorkspace = false,
  stage,
  onStageChange,
}: GenerationPanelProps) {
  const [internalTab, setInternalTab] = useState<GenerationType>('concepts')
  const isControlled = stage !== undefined
  const activeTab = isControlled ? stage : internalTab

  const setActiveTab = (tab: GenerationType) => {
    if (isControlled) {
      onStageChange?.(tab)
    } else {
      setInternalTab(tab)
    }
  }

  const [activityOpen, setActivityOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [selectedConceptAssetId, setSelectedConceptAssetId] = useState<string | null>(null)
  const [imageTier, setImageTier] = useState<ImageTier>('draft')
  const [previewImage, setPreviewImage] = useState<ImageResult | null>(null)
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null)
  const [previewAssetStatus, setPreviewAssetStatus] = useState<string | undefined>(undefined)
  const [showPreview, setShowPreview] = useState(false)
  const [activeConceptForModal, setActiveConceptForModal] = useState<CreativeAsset | null>(null)
  const [activeCopyForModal, setActiveCopyForModal] = useState<CreativeAsset | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadInitialType, setUploadInitialType] = useState<'image' | 'copy' | 'concept'>('image')
  const [isRefining, setIsRefining] = useState(false)
  const [refinedPrompt, setRefinedPrompt] = useState<string | null>(null)
  const [brandInclude, setBrandInclude] = useState<BrandIncludeFlags>(() => ({ ...DEFAULT_BRAND_INCLUDE }))
  const [imageCopyAnchorId, setImageCopyAnchorId] = useState('')

  const refinedPromptStorageKey = `jigi-refined-image-prompt-${campaign.id}`

  const { data: brand } = useBrand(brandId)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(refinedPromptStorageKey)
      if (stored && stored.trim()) {
        setRefinedPrompt(stored)
      } else {
        setRefinedPrompt(null)
      }
    } catch {
      setRefinedPrompt(null)
    }
  }, [campaign.id])

  const { data: allAssets = [] } = useCampaignAssets(campaign.id)

  const generateConcepts = useGenerateConcepts()
  const generateCopy = useGenerateCopy()
  const generateImage = useGenerateImage()
  const deleteAsset = useDeleteAsset()

  const activeMutation =
    activeTab === 'concepts'
      ? generateConcepts
      : activeTab === 'copy'
      ? generateCopy
      : generateImage

  // Keep each tab's status independent so image provider failures
  // do not leak into concepts/copy experience.
  const isGenerating = activeMutation.isPending
  const hasError = activeMutation.isError
  const error = activeMutation.error
  const errorMessage = error instanceof Error ? error.message : 'The model encountered an error. Please try again.'

  const concepts = useMemo(
    () => allAssets.filter((a) => a.type === 'concept'),
    [allAssets]
  )
  const copyAssets = useMemo(
    () => allAssets.filter((a) => a.type === 'copy'),
    [allAssets]
  )
  const imageAssets = useMemo(
    () => allAssets.filter((a) => a.type === 'image'),
    [allAssets]
  )
  const latestImage = useMemo(
    () => (imageAssets.length ? (imageAssets[0].content as ImageResult) : null),
    [imageAssets]
  )
  const leadChannelId = campaign.brief?.channels?.[0]
  const copyCharBudgetHint = useMemo(() => getPrimaryCopyBudgetChars(leadChannelId), [leadChannelId])
  const activeAssets = useMemo(
    () => (activeTab === 'concepts' ? concepts : activeTab === 'copy' ? copyAssets : imageAssets),
    [activeTab, concepts, copyAssets, imageAssets]
  )
  const selectedConceptAsset = useMemo(
    () => concepts.find((asset) => asset.id === selectedConceptAssetId) || null,
    [concepts, selectedConceptAssetId]
  )
  const copyGroups = useMemo(() => {
    const conceptsById = new Map(concepts.map((asset) => [asset.id, asset]))
    const grouped = new Map<string, { title: string; assets: CreativeAsset[] }>()

    for (const asset of copyAssets) {
      const parentId = asset.parent_asset_id || '__unlinked__'
      if (!grouped.has(parentId)) {
        if (parentId === '__unlinked__') {
          grouped.set(parentId, { title: 'Unlinked Copy Variants', assets: [] })
        } else {
          const conceptTheme = (conceptsById.get(parentId)?.content as ConceptResult | undefined)?.theme || 'Unknown Concept'
          grouped.set(parentId, {
            title: `Variants for "${conceptTheme}"`,
            assets: [],
          })
        }
      }
      grouped.get(parentId)?.assets.push(asset)
    }

    return Array.from(grouped.entries()).map(([parentId, group]) => ({
      parentId,
      ...group,
    }))
  }, [copyAssets, concepts])

  useEffect(() => {
    if (activeTab === 'concepts') {
      generateCopy.reset()
      generateImage.reset()
      return
    }

    if (activeTab === 'copy') {
      generateConcepts.reset()
      generateImage.reset()
      return
    }

    generateConcepts.reset()
    generateCopy.reset()
  }, [activeTab, generateConcepts, generateCopy, generateImage])

  useEffect(() => {
    if (!concepts.length) {
      setSelectedConceptAssetId(null)
      return
    }

    if (!selectedConceptAssetId || !concepts.some((asset) => asset.id === selectedConceptAssetId)) {
      setSelectedConceptAssetId(concepts[0].id)
    }
  }, [concepts, selectedConceptAssetId])

  useEffect(() => {
    if (imageCopyAnchorId && !copyAssets.some((a) => a.id === imageCopyAnchorId)) {
      setImageCopyAnchorId('')
    }
  }, [copyAssets, imageCopyAnchorId])

  const handleGenerate = async () => {
    if (!userId) {
      toast.error('Session still loading — wait a moment and try again.')
      return
    }

    const brief = {
      ...campaign.brief,
      objective: prompt || campaign.brief?.objective || campaign.seed_idea,
    }

    try {
      if (activeTab === 'concepts') {
        await generateConcepts.mutateAsync({
          campaignId: campaign.id,
          brandId,
          brief,
          seedIdea: campaign.seed_idea,
          userId,
        })
        toast.success('Concepts generated successfully!')
      } else if (activeTab === 'copy') {
        if (!selectedConceptAsset) {
          toast.error('Select a concept first to generate copy variants.')
          return
        }

        const concept = selectedConceptAsset.content as ConceptResult
        await generateCopy.mutateAsync({
          campaignId: campaign.id,
          brandId,
          brief,
          seedIdea: campaign.seed_idea,
          format: campaign.brief?.channels?.[0] || 'social_post',
          conceptAssetId: selectedConceptAsset.id,
          conceptContext: {
            theme: concept.theme,
            headlines: concept.headlines,
            visual_direction: concept.visual_direction,
          },
          userId,
        })
        toast.success('Copy generated successfully!')
      } else if (activeTab === 'images') {
        const anchorAsset = imageCopyAnchorId
          ? copyAssets.find((a) => a.id === imageCopyAnchorId)
          : undefined
        const copyAnchor = anchorAsset
          ? copyAssetToImageAnchor(anchorAsset.id, anchorAsset.content as CopyResult)
          : undefined
        const conceptIdForImage = anchorAsset?.parent_asset_id ?? undefined

        const result = await generateImage.mutateAsync({
          campaignId: campaign.id,
          brandId,
          conceptId: conceptIdForImage,
          imageTier,
          visualDirection: prompt || campaign.brief?.objective || 'Professional advertising image',
          seedIdea: campaign.seed_idea,
          userId,
          brandInclude,
          channelId: campaign.brief?.channels?.[0],
          copyAnchor,
        })
        setPreviewImage(result.image)
        setPreviewAssetId(null)
        setPreviewAssetStatus(undefined)
        setShowPreview(true)
        toast.success('Image generated successfully!')
      }
      setPrompt('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.'
      toast.error(msg)
    }
  }

  const handleGenerateImageFromConcept = async (conceptAsset: CreativeAsset) => {
    const concept = conceptAsset.content as ConceptResult
    try {
      setShowPreview(true)
      setPreviewImage(null)
      setPreviewAssetId(null)
      setPreviewAssetStatus(undefined)
      const result = await generateImage.mutateAsync({
        campaignId: campaign.id,
        brandId,
        conceptId: conceptAsset.id,
        imageTier,
        visualDirection: concept.visual_direction,
        seedIdea: campaign.seed_idea,
        userId,
        brandInclude,
        channelId: campaign.brief?.channels?.[0],
      })
      setPreviewImage(result.image)
      toast.success('Image generated from concept!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image generation failed.')
      setShowPreview(false)
    }
  }

  const handleGenerateImageFromCopyAsset = async (copyAsset: CreativeAsset) => {
    const copy = copyAsset.content as CopyResult
    const copyAnchor = copyAssetToImageAnchor(copyAsset.id, copy)
    try {
      setActiveTab('images')
      setShowPreview(true)
      setPreviewImage(null)
      setPreviewAssetId(null)
      setPreviewAssetStatus(undefined)
      const result = await generateImage.mutateAsync({
        campaignId: campaign.id,
        brandId,
        conceptId: copyAsset.parent_asset_id ?? undefined,
        imageTier,
        visualDirection:
          prompt.trim() ||
          campaign.brief?.objective ||
          campaign.seed_idea ||
          'Professional advertising image',
        seedIdea: campaign.seed_idea,
        userId,
        brandInclude,
        channelId: campaign.brief?.channels?.[0],
        copyAnchor,
      })
      setPreviewImage(result.image)
      toast.success('Image generated from copy variant!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Image generation failed.')
      setShowPreview(false)
    }
  }

  const handleDelete = async (assetId: string) => {
    try {
      await deleteAsset.mutateAsync({ assetId, campaignId: campaign.id })
      toast.success('Asset deleted')
      if (selectedConceptAssetId === assetId) {
        setSelectedConceptAssetId(null)
      }
      if (activeConceptForModal?.id === assetId) {
        setActiveConceptForModal(null)
      }
      if (activeCopyForModal?.id === assetId) {
        setActiveCopyForModal(null)
      }
    } catch {
      toast.error('Failed to delete asset')
    }
  }

  const handleOpenImagePreview = (asset: CreativeAsset) => {
    setPreviewImage(asset.content as ImageResult)
    setPreviewAssetId(asset.id)
    setPreviewAssetStatus(asset.status)
    setShowPreview(true)
  }

  const handleSubmitAsset = (assetId: string) => {
    onSubmitAsset?.(assetId)
  }

  const handleOpenUpload = () => {
    if (!userId) {
      toast.error('You must be signed in to upload assets.')
      return
    }
    const type: 'image' | 'copy' | 'concept' =
      activeTab === 'images' ? 'image' : activeTab === 'copy' ? 'copy' : 'concept'
    setUploadInitialType(type)
    setShowUploadModal(true)
  }

  const handleRefinePrompt = async () => {
    const trimmed = prompt.trim()
    if (!trimmed) {
      toast.error('Enter a description first to refine.')
      return
    }
    setIsRefining(true)
    try {
      const response = await generateText({
        type: 'image_prompt_refine',
        campaign_id: campaign.id,
        brand_id: brandId,
        prompt: trimmed,
      })
      const refined = response.content?.refined_prompt
      if (typeof refined === 'string' && refined) {
        setRefinedPrompt(refined)
        try {
          localStorage.setItem(refinedPromptStorageKey, refined)
        } catch {
          // ignore localStorage errors
        }
        toast.success('Prompt refined')
      } else {
        toast.error('Could not refine prompt. Please try again.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not refine prompt. Please try again.')
    } finally {
      setIsRefining(false)
    }
  }

  const tabs: { id: GenerationType; label: string; icon: React.ElementType }[] = [
    { id: 'concepts', label: 'Concepts', icon: Lightbulb },
    { id: 'copy', label: 'Copy', icon: FileText },
    { id: 'images', label: 'Images', icon: Image },
  ]

  return (
    <div className={cn('flex h-full', embeddedInWorkspace && 'flex-col')} data-tour="generation-panel">
      {/* Main Generation Area */}
      <div
        className={cn(
          'flex-1 overflow-y-auto p-6 min-h-0',
          !embeddedInWorkspace && 'border-r border-border'
        )}
      >
        {/* Tab Selector — hidden when pipeline rail controls stage */}
        {!embeddedInWorkspace && (
          <div className="flex items-center gap-1.5 mb-6 bg-muted p-1.5 rounded-lg w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all',
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}

        {activeTab === 'copy' && selectedConceptAsset && (
          <div
            className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
            role="status"
            aria-live="polite"
          >
            <p className="text-foreground">
              <span className="font-medium">Generating from: </span>
              <span className="text-foreground">
                &quot;{(selectedConceptAsset.content as ConceptResult).theme}&quot;
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Typical flow: <span className="text-foreground/90">concept</span> →{' '}
              <span className="text-foreground/90">copy</span> →{' '}
              <span className="text-foreground/90">image</span>. You can still create images anytime from the Images tab or this concept&apos;s detail view.
            </p>
          </div>
        )}

        {/* Prompt Input */}
        <div className="bg-background rounded-xl border border-border p-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Textarea
              id="generation-prompt"
              aria-label="Generation prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'concepts'
                  ? 'Describe your campaign direction, target audience, and key themes...'
                  : activeTab === 'copy'
                  ? 'Describe the tone, message, and format for your copy...'
                  : 'Describe the visual style, subject, and mood for your image...'
              }
              rows={2}
              className="flex-1 border-0 focus-visible:ring-0 resize-none"
            />
            <div className="flex flex-col items-end gap-2">
              {activeTab === 'images' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={handleRefinePrompt}
                        disabled={isRefining || isGenerating}
                      >
                        {isRefining ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refine prompt</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !userId || (activeTab === 'copy' && !selectedConceptAsset)}
                className="flex-shrink-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating
                  ? 'Generating...'
                  : `Generate ${activeTab === 'images' ? 'Image' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                onClick={handleOpenUpload}
              >
                Upload {activeTab === 'images' ? 'image' : activeTab === 'copy' ? 'copy' : 'concept'}
              </Button>
              {activeTab === 'images' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => {
                    setPrompt('')
                  }}
                >
                  Clear prompt
                </Button>
              )}
            </div>
          </div>
          {activeTab === 'images' && copyAssets.length > 0 && (
            <div className="mt-3 max-w-md">
              <label htmlFor="image-copy-anchor" className="text-xs font-medium text-foreground block mb-1.5">
                Messaging anchor (optional)
              </label>
              <select
                id="image-copy-anchor"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={imageCopyAnchorId}
                onChange={(e) => setImageCopyAnchorId(e.target.value)}
              >
                <option value="">None — brief / prompt only</option>
                {copyAssets.map((a, index) => {
                  const c = a.content as CopyResult
                  const fallback = `Variant ${String.fromCharCode(65 + index)}`
                  const label = (c.variant_label?.trim() || c.headline?.trim() || fallback).slice(0, 72)
                  return (
                    <option key={a.id} value={a.id}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>
          )}
          {activeTab === 'images' && (
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <p>
                For messaging-aligned key art, generate or pick copy first when you can—you can still produce visuals from the brief or concept alone.
              </p>
              <p>Free-tier-first routing is enabled. Tier selection maps to draft/refine/final model lanes.</p>
            </div>
          )}
          {activeTab === 'images' && refinedPrompt && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-primary" />
                  Refined prompt
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 px-2"
                  onClick={() => {
                    setRefinedPrompt(null)
                    try {
                      localStorage.removeItem(refinedPromptStorageKey)
                    } catch {
                      // ignore
                    }
                  }}
                >
                  Dismiss
                </Button>
              </div>
              <div className="rounded-lg bg-muted p-3 text-sm text-foreground max-h-32 overflow-y-auto mb-3">
                {refinedPrompt}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setPrompt(refinedPrompt)
                  toast.success('Prompt applied')
                }}
              >
                Use this prompt
              </Button>
            </div>
          )}
          {activeTab === 'copy' && (
            <p className="text-xs text-muted-foreground mt-2">
              {selectedConceptAsset
                ? `Generating 2 variants for "${(selectedConceptAsset.content as ConceptResult).theme}".`
                : 'Select a concept first to generate copy variants.'}
            </p>
          )}
        </div>

        {/* Error State */}
        {hasError && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">Generation failed</p>
              <p className="text-xs text-destructive mt-0.5">
                {errorMessage}
              </p>
              <button
                onClick={handleGenerate}
                className="mt-2 text-xs font-medium text-destructive underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <GenerationLoadingState
            type={activeTab === 'concepts' ? 'concept' : activeTab === 'copy' ? 'copy' : 'image'}
            count={activeTab === 'images' ? 1 : 2}
          />
        )}

        {/* Concepts Tab */}
        {activeTab === 'concepts' && !isGenerating && (
          <div>
            {concepts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Lightbulb className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No concepts yet</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Describe your campaign direction above and generate concepts to get started.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleGenerate}
                >
                  Generate concepts
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-4">{concepts.length} concepts generated</p>
                <div className="grid grid-cols-2 gap-4">
              {concepts.map((asset) => (
                <ConceptCard
                  key={asset.id}
                  concept={asset.content as ConceptResult}
                  assetId={asset.id}
                  status={asset.status}
                  driftStatus={asset.drift_status}
                  selected={selectedConceptAssetId === asset.id}
                  onSelect={() => setSelectedConceptAssetId(asset.id)}
                  onView={() => setActiveConceptForModal(asset)}
                  onDelete={() => handleDelete(asset.id)}
                  onGenerateCopy={() => {
                    setSelectedConceptAssetId(asset.id)
                    setActiveTab('copy')
                  }}
                  onGenerateImage={() => handleGenerateImageFromConcept(asset)}
                  onSubmit={() => handleSubmitAsset(asset.id)}
                  showActions={true}
                />
              ))}
            </div>
                <button
                  onClick={handleGenerate}
                  className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate 2 more concepts
                </button>
              </>
            )}
          </div>
        )}

        {/* Copy Tab */}
        {activeTab === 'copy' && !isGenerating && (
          <div className="space-y-4">
            {copyAssets.length === 0 && concepts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No copy yet</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Generate concepts first, then select one to generate copy variants.
                </p>
              </div>
            ) : copyAssets.length === 0 && concepts.length > 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No copy yet</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Select a concept above and generate copy variants.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleGenerate}
                  disabled={!selectedConceptAsset}
                >
                  Generate copy
                </Button>
              </div>
            ) : (
              <>
            {concepts.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {concepts.map((asset) => {
                  const concept = asset.content as ConceptResult
                  const isSelected = selectedConceptAssetId === asset.id
                  return (
                    <Button
                      key={asset.id}
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      className={isSelected ? '' : ''}
                      onClick={() => setSelectedConceptAssetId(asset.id)}
                    >
                      {concept.theme}
                    </Button>
                  )
                })}
              </div>
            )}

            {copyGroups.map((group) => (
              <div key={group.parentId} className="space-y-3">
                <p className="text-xs text-muted-foreground">{group.title}</p>
                {group.assets.map((asset, index) => (
                  <CopyCard
                    key={asset.id}
                    copy={asset.content as CopyResult}
                    assetId={asset.id}
                    status={asset.status}
                    variantLabel={
                      (asset.content as CopyResult).variant_label?.trim() ||
                      `Variant ${String.fromCharCode(65 + index)}`
                    }
                    onView={() => setActiveCopyForModal(asset)}
                    onDelete={() => handleDelete(asset.id)}
                    onSubmit={() => handleSubmitAsset(asset.id)}
                    showActions={true}
                  />
                ))}
              </div>
            ))}
            {copyAssets.length > 0 && (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Generate 2 more variants
              </button>
            )}
              </>
            )}
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && !isGenerating && (
          <div>
            {brandId && (
              <div className="mb-4">
                <p className="text-xs text-foreground mb-2 font-medium">Include in image</p>
                <div className="flex flex-wrap gap-2">
                  {(['colours', 'tone', 'logo', 'text'] as const).map((key) => {
                    if (key === 'logo' && !brand?.identity?.logo_url) return null
                    const isSelected = brandInclude[key] !== false
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setBrandInclude((prev) => ({
                            ...prev,
                            [key]: !isSelected,
                          }))
                        }
                        className={cn(
                          'px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant={imageTier === 'draft' ? 'default' : 'outline'}
                className={imageTier === 'draft' ? '' : ''}
                onClick={() => setImageTier('draft')}
              >
                Draft (Free)
              </Button>
              <Button
                size="sm"
                variant={imageTier === 'refine' ? 'default' : 'outline'}
                className={imageTier === 'refine' ? '' : ''}
                onClick={() => setImageTier('refine')}
              >
                Refine (Free Limited)
              </Button>
              <Button
                size="sm"
                variant={imageTier === 'final' ? 'default' : 'outline'}
                className={imageTier === 'final' ? '' : ''}
                onClick={() => setImageTier('final')}
              >
                Final Polish (Very Limited)
              </Button>
            </div>
            {imageAssets.length > 0 && (
              <p className="text-xs text-muted-foreground mb-4">{imageAssets.length} images generated</p>
            )}
            {latestImage && (
              <div className="mb-4 rounded-lg border border-border bg-muted px-3 py-2">
                <p className="text-xs text-foreground">
                  Route: <span className="font-medium text-foreground">{latestImage.image_provider || latestImage.model}</span>
                  {latestImage.cost_bucket ? ` · ${latestImage.cost_bucket === 'free' ? 'Free lane' : 'Paid fallback'}` : ''}
                  {latestImage.image_tier ? ` · ${latestImage.image_tier}` : ''}
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {imageAssets.map((asset) => (
                <ImageCard
                  key={asset.id}
                  image={asset.content as ImageResult}
                  assetId={asset.id}
                  status={asset.status}
                  driftStatus={asset.drift_status}
                  onDelete={() => handleDelete(asset.id)}
                  onView={() => handleOpenImagePreview(asset)}
                  onSubmit={() => handleSubmitAsset(asset.id)}
                  onRegenerate={handleGenerate}
                  showActions={true}
                />
              ))}
            </div>
            {imageAssets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Image className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No images yet</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Generate images from the prompt above or upload existing campaign visuals to review alongside AI
                  work.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleOpenUpload}
                >
                  Upload image
                </Button>
              </div>
            )}
          </div>
        )}

        {embeddedInWorkspace && (
          <div className="mt-6 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setActivityOpen((open) => !open)}
              className="flex w-full items-center justify-between text-sm font-semibold text-foreground py-2"
              aria-expanded={activityOpen}
            >
              Activity
              <ChevronDown
                className={cn('w-4 h-4 text-muted-foreground transition-transform', activityOpen && 'rotate-180')}
              />
            </button>
            {activityOpen && (
              <div className="max-h-48 overflow-y-auto pb-2">
                <GenerationHistory campaignId={campaign.id} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar — standalone mode only */}
      {!embeddedInWorkspace && (
      <div className="w-72 flex-shrink-0 flex flex-col bg-background overflow-hidden">
        <div className="px-4 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Campaign Assets</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {activeAssets.length} {activeTab}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {activeAssets.map((asset) => {
            const content = asset.content as any
            const name = content?.theme || content?.headline || content?.prompt_used?.slice(0, 30) || 'Asset'
            return (
              <div
                key={asset.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (asset.type === 'image') {
                    handleOpenImagePreview(asset)
                  }
                  if (asset.type === 'concept') {
                    setActiveConceptForModal(asset)
                  }
                  if (asset.type === 'copy') {
                    setActiveCopyForModal(asset)
                  }
                }}
              >
                {asset.type === 'image' && content?.url ? (
                  <img
                    src={content.url}
                    alt=""
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {asset.type === 'concept' && <Lightbulb className="w-3.5 h-3.5 text-muted-foreground" />}
                    {asset.type === 'copy' && <FileText className="w-3.5 h-3.5 text-muted-foreground" />}
                    {asset.type === 'image' && <Image className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-foreground truncate">{name}</p>
                    {asset.drift_status === 'review_required' && (
                      <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium shrink-0" title="Brief updated; review recommended">
                        Review
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground capitalize">{asset.status.replace('_', ' ')}</p>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="border-t border-border p-4">
          <GenerationHistory campaignId={campaign.id} />
        </div>
      </div>
      )}

      <UploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        campaignId={campaign.id}
        userId={userId}
        initialType={uploadInitialType}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={showPreview}
        onOpenChange={(open) => {
          setShowPreview(open)
          if (!open) {
            setPreviewAssetId(null)
            setPreviewAssetStatus(undefined)
          }
        }}
        image={previewImage}
        status={previewAssetStatus}
        isGenerating={generateImage.isPending && !previewImage}
        onRegenerate={handleGenerate}
        isSaved={true}
        onSubmit={
          previewAssetId ? () => handleSubmitAsset(previewAssetId) : undefined
        }
      />

      <ConceptDetailModal
        open={!!activeConceptForModal}
        onOpenChange={(open) => {
          if (!open) setActiveConceptForModal(null)
        }}
        concept={activeConceptForModal ? (activeConceptForModal.content as ConceptResult) : null}
        status={activeConceptForModal?.status}
        onGoToCopy={
          activeConceptForModal
            ? () => {
                setSelectedConceptAssetId(activeConceptForModal.id)
                setActiveTab('copy')
                setActiveConceptForModal(null)
              }
            : undefined
        }
        onGenerateImage={
          activeConceptForModal
            ? () => {
                handleGenerateImageFromConcept(activeConceptForModal)
                setActiveConceptForModal(null)
              }
            : undefined
        }
        onDelete={
          activeConceptForModal
            ? () => {
                handleDelete(activeConceptForModal.id)
                setActiveConceptForModal(null)
              }
            : undefined
        }
        onSubmit={
          activeConceptForModal
            ? () => handleSubmitAsset(activeConceptForModal.id)
            : undefined
        }
      />

      <CopyDetailModal
        open={!!activeCopyForModal}
        onOpenChange={(open) => {
          if (!open) setActiveCopyForModal(null)
        }}
        copy={activeCopyForModal ? (activeCopyForModal.content as CopyResult) : null}
        status={activeCopyForModal?.status}
        channelMaxCharsHint={copyCharBudgetHint}
        variantLabel={
          activeCopyForModal
            ? (() => {
                const content = activeCopyForModal.content as CopyResult
                if (content.variant_label?.trim()) return content.variant_label.trim()
                const idx = Math.max(
                  0,
                  copyAssets
                    .filter((asset) => asset.parent_asset_id === activeCopyForModal.parent_asset_id)
                    .findIndex((asset) => asset.id === activeCopyForModal.id)
                )
                return `Variant ${String.fromCharCode(65 + idx)}`
              })()
            : undefined
        }
        onDelete={
          activeCopyForModal
            ? () => {
                handleDelete(activeCopyForModal.id)
                setActiveCopyForModal(null)
              }
            : undefined
        }
        onGenerateImage={
          activeCopyForModal
            ? () => {
                handleGenerateImageFromCopyAsset(activeCopyForModal)
                setActiveCopyForModal(null)
              }
            : undefined
        }
        isGeneratingImage={generateImage.isPending}
        onSubmit={
          activeCopyForModal
            ? () => handleSubmitAsset(activeCopyForModal.id)
            : undefined
        }
      />
    </div>
  )
}
