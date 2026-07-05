import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Sparkles,
  Building2,
  Wand2,
  Lightbulb,
  Loader2,
  ChevronRight,
  Plus,
} from 'lucide-react'
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
import { useAuthStore } from '@/store/authStore'
import { BriefForm } from '@/components/campaigns/BriefForm'
import { QuickCreateBrandDialog } from '@/components/brands/QuickCreateBrandDialog'
import { BriefReadinessChecklist } from '@/components/campaign/BriefReadinessChecklist'
import { buildCreateChecklistItems } from '@/lib/brief-readiness'
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

const CREATE_STEPS = ['Basics', 'Brief', 'Channels'] as const

export function CampaignCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = location.state as LocationState | null
  const modeParam = searchParams.get('mode')

  const { createCampaign, updateCampaign, isLoading } = useCampaignStore()
  const { brands, fetchBrands } = useBrandStore()
  const { user } = useAuthStore()
  const [pendingReferenceFiles, setPendingReferenceFiles] = useState<File[]>([])
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const [step, setStep] = useState(0)

  const [journeyMode, setJourneyMode] = useState<'brand_first' | 'idea_first'>(
    state?.journeyMode || (modeParam === 'idea_first' ? 'idea_first' : 'brand_first')
  )

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      brand_id: undefined,
      journey_mode: state?.journeyMode || (modeParam === 'idea_first' ? 'idea_first' : 'brand_first'),
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

  useEffect(() => {
    if (modeParam === 'idea_first' && !state?.journeyMode) {
      setJourneyMode('idea_first')
      methods.setValue('journey_mode', 'idea_first')
    }
  }, [modeParam, state?.journeyMode, methods])

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
    if (data.journey_mode === 'brand_first' && !data.brand_id) {
      toast.error('Select a brand for brand-first campaigns')
      methods.setError('brand_id', { type: 'manual', message: 'Brand is required' })
      setStep(0)
      return
    }

    const brief = buildBrief(data)
    const campaignData = {
      name: data.name,
      brand_id: data.brand_id || undefined,
      created_by: user?.id,
      journey_mode: data.journey_mode,
      seed_idea: data.seed_idea,
      brief: { ...brief, reference_assets: brief.reference_assets ?? [] },
    }

    if (!user?.id) {
      toast.error('You must be signed in to create a campaign')
      return
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
      navigate(`/app/campaigns/${result.campaign.id}?stage=brief`)
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
      created_by: user?.id,
      journey_mode: data.journey_mode,
      seed_idea: data.seed_idea,
      brief: { ...brief, reference_assets: brief.reference_assets ?? [] },
    }

    if (!user?.id) {
      toast.error('You must be signed in to save a draft')
      return
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

  const validateBasicsStep = async (): Promise<boolean> => {
    const nameValid = await methods.trigger('name')
    if (!nameValid) return false

    if (journeyMode === 'brand_first') {
      if (!methods.getValues('brand_id')) {
        methods.setError('brand_id', { type: 'manual', message: 'Brand is required' })
        return false
      }
    } else {
      const seed = methods.getValues('seed_idea')?.trim() ?? ''
      if (seed.length < 10) {
        methods.setError('seed_idea', {
          type: 'manual',
          message: 'Your idea must be at least 10 characters',
        })
        return false
      }
    }
    return true
  }

  const handleNext = async () => {
    if (step === 0) {
      const ok = await validateBasicsStep()
      if (ok) setStep(1)
      return
    }
    if (step === 1) {
      const ok = await methods.trigger(['objective', 'audience', 'key_message'])
      if (ok) setStep(2)
      return
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmitWithValidation = methods.handleSubmit(
    onSubmit,
    () => {
      focusFirstInvalid()
    }
  )

  const checklistItems = buildCreateChecklistItems({
    name: methods.watch('name') ?? '',
    brandId: methods.watch('brand_id'),
    objective: methods.watch('objective') ?? '',
    audience: methods.watch('audience') ?? '',
    channels: methods.watch('channels') ?? [],
    keyMessage: methods.watch('key_message') ?? '',
    seedIdea: methods.watch('seed_idea') ?? '',
    journeyMode,
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmitWithValidation} className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Create Campaign</h1>
              <p className="text-muted-foreground">
                Step {step + 1} of {CREATE_STEPS.length} — {CREATE_STEPS[step]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {CREATE_STEPS.map((label, i) => (
              <span key={label} className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => i < step && setStep(i)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    i === step
                      ? 'bg-primary text-primary-foreground'
                      : i < step
                        ? 'bg-primary/20 text-primary hover:bg-primary/30'
                        : 'bg-muted text-muted-foreground'
                  } ${i < step ? 'cursor-pointer' : 'cursor-default'}`}
                  aria-current={i === step ? 'step' : undefined}
                >
                  {i + 1}
                </button>
                <span className={`text-sm ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {i < CREATE_STEPS.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {step === 0 && (
              <>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>Name your campaign and set the starting point</CardDescription>
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
                          className={methods.formState.errors.seed_idea ? 'border-destructive' : ''}
                        />
                        {methods.formState.errors.seed_idea && (
                          <p className="text-sm text-destructive">{methods.formState.errors.seed_idea.message}</p>
                        )}
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
                    <CardContent className="space-y-3">
                      {brands.length === 0 ? (
                        <div className="text-center py-6">
                          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground mb-3">No brands set up yet</p>
                          <Button type="button" variant="outline" size="sm" onClick={() => setQuickCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Quick create brand
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Select
                            value={methods.watch('brand_id') || ''}
                            onValueChange={(value) => methods.setValue('brand_id', value, { shouldValidate: true })}
                          >
                            <SelectTrigger className={methods.formState.errors.brand_id ? 'border-destructive' : ''}>
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
                                          backgroundColor: brand.identity?.colours?.primary || '#0D9488',
                                        }}
                                      />
                                    )}
                                    <span>{brand.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {methods.formState.errors.brand_id && (
                            <p className="text-sm text-destructive">{methods.formState.errors.brand_id.message}</p>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => setQuickCreateOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Quick create brand
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Campaign Brief
                  </CardTitle>
                  <CardDescription>Define objectives, audience, and key message</CardDescription>
                </CardHeader>
                <CardContent>
                  <BriefForm
                    showChannels={false}
                    onPendingReferenceFilesChange={setPendingReferenceFiles}
                  />
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Channels &amp; review</CardTitle>
                  <CardDescription>Select where this campaign will run, then create</CardDescription>
                </CardHeader>
                <CardContent>
                  <BriefForm channelsOnly />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-[76px] lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {step === 2 ? 'Ready to Create' : 'Progress'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {step === 2
                    ? 'Review your campaign settings and save to start generating creative assets.'
                    : 'Complete each step before moving on. You can save an incomplete draft anytime.'}
                </p>
                <BriefReadinessChecklist items={checklistItems} />
                <div className="flex flex-col gap-2">
                  {step > 0 && (
                    <Button type="button" variant="outline" className="w-full" onClick={handleBack} disabled={isLoading}>
                      Back
                    </Button>
                  )}
                  {step < 2 ? (
                    <Button type="button" className="w-full" size="lg" onClick={() => void handleNext()}>
                      Next: {CREATE_STEPS[step + 1]}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" className="w-full" disabled={isLoading} size="lg">
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
                  )}
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
                </div>
              </CardContent>
            </Card>

            {journeyMode === 'idea_first' && (
              <Card className="border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Idea-First Mode</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300/90 mt-1">
                        Assets will be generated without brand constraints. You can attach a brand profile later.
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
                        Generated assets will follow your brand&apos;s colors, tone, and guidelines.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <QuickCreateBrandDialog
          open={quickCreateOpen}
          onOpenChange={setQuickCreateOpen}
          onBrandCreated={(brandId) => {
            methods.setValue('brand_id', brandId, { shouldValidate: true })
            void fetchBrands()
          }}
        />
      </form>
    </FormProvider>
  )
}
