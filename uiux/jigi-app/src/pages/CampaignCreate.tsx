import { useNavigate, useLocation } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Sparkles, Building2, Wand2, Lightbulb, Loader2, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useCampaignStore } from '@/store/campaignStore'
import { useBrandStore } from '@/store/brandStore'
import { BriefForm } from '@/components/campaigns/BriefForm'
import { uploadCampaignReference } from '@/lib/brief-reference-upload'
import { z } from 'zod'

interface LocationState {
  idea?: string
  journeyMode?: 'idea_first' | 'brand_first'
}

const briefReferenceAssetSchema = z.object({
  file_url: z.string().url(),
  filename: z.string().optional(),
})

const formSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  brand_id: z.string().optional(),
  journey_mode: z.enum(['brand_first', 'idea_first']),
  seed_idea: z.string().optional(),
  objective: z.string().min(10, 'Objective must be at least 10 characters').optional().or(z.literal('')),
  audience: z.string().min(10, 'Audience must be at least 10 characters').optional().or(z.literal('')),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
  requirements: z.string().optional(),
  key_message: z.string().min(1, 'Key message is required').max(500, 'Key message must be 500 characters or less'),
  tone_override: z.array(z.string()).optional(),
  reference_assets: z.array(briefReferenceAssetSchema).optional(),
  exclusions: z.string().max(1000).optional(),
})

type FormData = z.infer<typeof formSchema>

function ReadinessChecklist({
  name,
  brandId,
  objective,
  audience,
  channels,
  keyMessage,
  seedIdea,
  journeyMode,
}: {
  name: string
  brandId: string | undefined
  objective: string
  audience: string
  channels: string[]
  keyMessage: string
  seedIdea: string
  journeyMode: 'brand_first' | 'idea_first'
}) {
  const items: { label: string; done: boolean }[] = [
    { label: 'Campaign name', done: (name || '').trim().length >= 3 },
    ...(journeyMode === 'brand_first'
      ? [{ label: 'Brand selected', done: !!brandId }]
      : [{ label: 'Your idea', done: (seedIdea || '').trim().length >= 10 }]),
    { label: 'Objective', done: (objective || '').trim().length >= 10 },
    { label: 'Target audience', done: (audience || '').trim().length >= 10 },
    { label: 'Key message', done: (keyMessage || '').trim().length >= 1 },
    { label: 'Channels', done: (channels || []).length >= 1 },
  ]
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      {items.map(({ label, done }) => (
        <div key={label} className="flex items-center gap-2 text-sm">
          {done ? (
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
          ) : (
            <span className="h-4 w-4 rounded-full border border-muted-foreground/50 flex-shrink-0" />
          )}
          <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        </div>
      ))}
    </div>
  )
}

export function CampaignCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const { createCampaign, updateCampaign, isLoading } = useCampaignStore()
  const { brands, fetchBrands } = useBrandStore()
  const [pendingReferenceFiles, setPendingReferenceFiles] = useState<File[]>([])
  
  const [journeyMode, setJourneyMode] = useState<'brand_first' | 'idea_first'>(
    state?.journeyMode || 'brand_first'
  )

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      brand_id: undefined,
      journey_mode: state?.journeyMode || 'brand_first',
      seed_idea: state?.idea || '',
      objective: '',
      audience: '',
      channels: [],
      requirements: '',
      key_message: '',
      tone_override: [],
      reference_assets: [],
      exclusions: '',
    },
  })

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  useEffect(() => {
    if (state?.idea) {
      methods.setValue('seed_idea', state.idea)
      setJourneyMode('idea_first')
      methods.setValue('journey_mode', 'idea_first')
    }
  }, [state?.idea, methods])

  const handleJourneyModeChange = (mode: 'brand_first' | 'idea_first') => {
    setJourneyMode(mode)
    methods.setValue('journey_mode', mode)
    if (mode === 'idea_first') {
      methods.setValue('brand_id', undefined)
    }
  }

  const buildBrief = (data: FormData) => ({
    objective: data.objective,
    audience: data.audience,
    channels: data.channels,
    requirements: data.requirements,
    key_message: data.key_message,
    tone_override: data.tone_override,
    reference_assets: data.reference_assets,
    exclusions: data.exclusions,
  })

  const onSubmit = async (data: FormData) => {
    const brief = buildBrief(data)
    const campaignData = {
      name: data.name,
      brand_id: data.brand_id || undefined,
      journey_mode: data.journey_mode,
      seed_idea: data.seed_idea,
      brief: { ...brief, reference_assets: brief.reference_assets ?? [] },
    }

    const result = await createCampaign(campaignData)

    if (result.success && result.campaign) {
      if (pendingReferenceFiles.length > 0) {
        try {
          const refs = await Promise.all(
            pendingReferenceFiles.map(async (file) => {
              const url = await uploadCampaignReference(result.campaign!.id, file)
              return { file_url: url, filename: file.name }
            })
          )
          await updateCampaign(result.campaign.id, {
            brief: { ...brief, reference_assets: [...(brief.reference_assets ?? []), ...refs] },
          })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to upload reference assets')
        }
      }
      toast.success('Campaign created successfully')
      navigate(`/app/campaigns/${result.campaign.id}`)
    } else {
      toast.error(result.error || 'Failed to create campaign')
    }
  }

  const handleSaveDraft = async () => {
    const data = methods.getValues()
    const brief = buildBrief(data)
    const campaignData = {
      name: data.name || 'Untitled Campaign',
      brand_id: data.brand_id || undefined,
      journey_mode: data.journey_mode,
      seed_idea: data.seed_idea,
      brief: { ...brief, reference_assets: brief.reference_assets ?? [] },
    }

    const result = await createCampaign(campaignData)

    if (result.success && result.campaign) {
      if (pendingReferenceFiles.length > 0) {
        try {
          const refs = await Promise.all(
            pendingReferenceFiles.map(async (file) => {
              const url = await uploadCampaignReference(result.campaign!.id, file)
              return { file_url: url, filename: file.name }
            })
          )
          await updateCampaign(result.campaign.id, {
            brief: { ...brief, reference_assets: [...(brief.reference_assets ?? []), ...refs] },
          })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to upload reference assets')
        }
      }
      toast.success('Campaign saved as draft')
      navigate('/app/campaigns')
    } else {
      toast.error(result.error || 'Failed to save draft')
    }
  }

  const steps = ['Basics', 'Brief', 'Channels']
  const focusFirstInvalid = () => {
    const errors = methods.formState.errors
    const order = ['name', 'seed_idea', 'brand_id', 'objective', 'audience', 'key_message', 'channels'] as const
    for (const field of order) {
      if (errors[field]) {
        methods.setFocus(field)
        return
      }
    }
  }

  const handleSubmitWithValidation = methods.handleSubmit(
    onSubmit,
    () => { focusFirstInvalid() }
  )

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmitWithValidation} className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Create Campaign</h1>
              <p className="text-muted-foreground">
                {journeyMode === 'idea_first' ? 'Start from your idea' : 'Brand-first campaign'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((label, i) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground">{label}</span>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Section 1: Basics */}
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">1</span>
            <h2 className="text-lg font-semibold">Basics</h2>
          </div>

        {/* Journey Mode Selector */}
        <RadioGroup
          value={journeyMode}
          onValueChange={(v) => handleJourneyModeChange(v as 'brand_first' | 'idea_first')}
          className="flex gap-4"
          aria-label="Campaign journey mode"
        >
          <RadioGroupItem value="brand_first" id="journey-brand_first" asChild>
            <label
              className={`flex flex-1 flex-col p-4 rounded-lg border-2 transition-all text-left cursor-pointer ${
                journeyMode === 'brand_first'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Building2
                className={`h-6 w-6 mb-2 ${
                  journeyMode === 'brand_first' ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <h3 className="font-semibold">Brand-First</h3>
              <p className="text-sm text-muted-foreground">
                Start with your brand profile for consistent creative
              </p>
            </label>
          </RadioGroupItem>
          <RadioGroupItem value="idea_first" id="journey-idea_first" asChild>
            <label
              className={`flex flex-1 flex-col p-4 rounded-lg border-2 transition-all text-left cursor-pointer ${
                journeyMode === 'idea_first'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Lightbulb
                className={`h-6 w-6 mb-2 ${
                  journeyMode === 'idea_first' ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <h3 className="font-semibold">Idea-First</h3>
              <p className="text-sm text-muted-foreground">
                Start with your idea, add brand later
              </p>
            </label>
          </RadioGroupItem>
        </RadioGroup>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Basic information about your campaign (Step 1)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Campaign Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Summer Sale 2026"
                    {...methods.register('name')}
                    className={methods.formState.errors.name ? 'border-destructive' : ''}
                  />
                  {methods.formState.errors.name && (
                    <p className="text-sm text-destructive">{methods.formState.errors.name.message}</p>
                  )}
                </div>

                {journeyMode === 'idea_first' && (
                  <div className="space-y-2">
                    <Label htmlFor="seed_idea">
                      Your Idea <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="seed_idea"
                      placeholder="Describe your campaign idea, concept, or creative direction..."
                      {...methods.register('seed_idea')}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be used as the starting point for AI generation
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {journeyMode === 'brand_first' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Select Brand
                  </CardTitle>
                  <CardDescription>
                    Choose which brand profile to use for this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {brands.length === 0 ? (
                    <div className="text-center py-6">
                      <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        No brands set up yet
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/app/onboarding')}
                      >
                        Create a brand
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={methods.watch('brand_id') || ''}
                      onValueChange={(value) => methods.setValue('brand_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            <div className="flex items-center gap-2">
                              {brand.identity?.logo_url ? (
                                <img
                                  src={brand.identity.logo_url}
                                  alt={brand.name}
                                  className="h-5 w-5 rounded object-contain"
                                />
                              ) : (
                                <div 
                                  className="h-5 w-5 rounded"
                                  style={{ 
                                    backgroundColor: brand.identity?.colours?.primary || '#0D9488' 
                                  }}
                                />
                              )}
                              <span>{brand.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">2</span>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Campaign Brief
                  </CardTitle>
                </div>
                <CardDescription>
                  Define your campaign objectives and target audience (Brief and channels)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BriefForm showChannels={true} onPendingReferenceFilesChange={setPendingReferenceFiles} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-[76px] lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ready to Create
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Review your campaign settings and save to start generating creative assets.
                </p>
                <ReadinessChecklist
                  name={methods.watch('name') ?? ''}
                  brandId={methods.watch('brand_id')}
                  objective={methods.watch('objective') ?? ''}
                  audience={methods.watch('audience') ?? ''}
                  channels={methods.watch('channels') ?? []}
                  keyMessage={methods.watch('key_message') ?? ''}
                  seedIdea={methods.watch('seed_idea') ?? ''}
                  journeyMode={journeyMode}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Campaign
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => navigate('/app/campaigns')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {journeyMode === 'idea_first' && (
              <Card className="border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Idea-First Mode
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300/90 mt-1">
                        Assets will be generated without brand constraints. You can attach a brand
                        profile later for future consistency.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {journeyMode === 'brand_first' && methods.watch('brand_id') && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Brand-Grounded</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        All generated assets will follow your brand's colors, tone, and guidelines.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </div>
      </form>
    </FormProvider>
  )
}
