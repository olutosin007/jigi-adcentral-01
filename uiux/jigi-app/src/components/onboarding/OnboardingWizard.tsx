import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useBrandStore } from '@/store/brandStore'
import { useAuthStore } from '@/store/authStore'
import { DEFAULT_BRAND_COLOURS, DEFAULT_BRAND_FONTS } from '@/lib/brand-profile-status'

import { LogoUploadStep } from './steps/LogoUploadStep'
import { ColorPaletteStep } from './steps/ColorPaletteStep'
import { TypographyStep } from './steps/TypographyStep'
import { ToneStep } from './steps/ToneStep'
import { LanguageRulesStep } from './steps/LanguageRulesStep'
import { TeamStep } from './steps/TeamStep'

const onboardingSchema = z.object({
  brandName: z.string().min(2, 'Brand name must be at least 2 characters'),
  logoUrl: z.string().optional(),
  colours: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    neutral: z.string(),
  }),
  typography: z.object({
    heading: z.string(),
    body: z.string(),
    customHeading: z.string().optional(),
    customBody: z.string().optional(),
  }),
  tone: z.array(z.string()),
  preferredWords: z.array(z.string()),
  avoidedWords: z.array(z.string()),
  teamInvites: z.array(z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'approver', 'reviewer']),
  })),
  agencyEmail: z.string().optional(),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>

const STEPS = [
  { id: 1, name: 'Logo', description: 'Upload your brand logo' },
  { id: 2, name: 'Colors', description: 'Define your color palette' },
  { id: 3, name: 'Typography', description: 'Choose your fonts' },
  { id: 4, name: 'Tone', description: 'Define your brand voice' },
  { id: 5, name: 'Language', description: 'Set language preferences' },
  { id: 6, name: 'Team', description: 'Invite your team' },
]

interface OnboardingWizardProps {
  brandId?: string
  initialData?: Partial<OnboardingFormData>
  onComplete?: () => void
}

export function OnboardingWizard({ brandId, initialData, onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { createBrand, updateBrand, completeOnboarding, updateOnboardingStep } = useBrandStore()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdBrandId, setCreatedBrandId] = useState<string | undefined>(brandId)

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      brandName: initialData?.brandName || '',
      logoUrl: initialData?.logoUrl || '',
      colours: initialData?.colours || {
        primary: DEFAULT_BRAND_COLOURS.primary,
        secondary: DEFAULT_BRAND_COLOURS.secondary,
        accent: DEFAULT_BRAND_COLOURS.accent,
        neutral: DEFAULT_BRAND_COLOURS.neutral,
      },
      typography: initialData?.typography || {
        heading: DEFAULT_BRAND_FONTS.heading,
        body: DEFAULT_BRAND_FONTS.body,
        customHeading: '',
        customBody: '',
      },
      tone: initialData?.tone || [],
      preferredWords: initialData?.preferredWords || [],
      avoidedWords: initialData?.avoidedWords || [],
      teamInvites: initialData?.teamInvites || [],
      agencyEmail: initialData?.agencyEmail || '',
    },
    mode: 'onBlur',
  })

  const progress = (currentStep / STEPS.length) * 100

  const getFieldsForStep = (step: number): (keyof OnboardingFormData)[] => {
    switch (step) {
      case 1: return ['brandName', 'logoUrl']
      case 2: return ['colours']
      case 3: return ['typography']
      case 4: return ['tone']
      case 5: return ['preferredWords', 'avoidedWords']
      case 6: return ['teamInvites', 'agencyEmail']
      default: return []
    }
  }

  const saveStepProgress = async (step: number) => {
    const data = methods.getValues()
    
    if (!createdBrandId && step === 1) {
      if (!profile?.organisation_id) {
        toast.error('Organisation not set. Please complete organisation setup first.')
        return false
      }
      const logoUrl = data.logoUrl && !String(data.logoUrl).startsWith('blob:')
        ? data.logoUrl
        : undefined
      const result = await createBrand({
        name: data.brandName,
        organisation_id: profile.organisation_id,
        identity: {
          logo_url: logoUrl,
          colours: data.colours,
        },
        journey_mode: 'brand_first',
        brand_profile_status: 'partial',
      })
      
      if (result.success && result.brand) {
        setCreatedBrandId(result.brand.id)
      } else {
        toast.error(result.error ?? 'Failed to save progress')
      }
      return result.success
    }

    if (createdBrandId) {
      const updateData: Record<string, unknown> = {}
      
      if (step <= 3) {
        updateData.identity = {
          logo_url: data.logoUrl,
          colours: data.colours,
          fonts: data.typography,
        }
      }
      
      if (step >= 4 && step <= 5) {
        updateData.voice = {
          tone: data.tone,
          preferred_words: data.preferredWords,
          avoided_words: data.avoidedWords,
        }
      }

      await updateOnboardingStep(createdBrandId, step, updateData)
    }
    
    return true
  }

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep)
    const valid = await methods.trigger(fields)
    
    if (!valid) return

    setIsSubmitting(true)
    const saved = await saveStepProgress(currentStep)
    setIsSubmitting(false)

    if (!saved) {
      return
    }

    if (currentStep < STEPS.length) {
      setCurrentStep((s) => s + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
    }
  }

  const handleSkip = async () => {
    if (createdBrandId) {
      await updateBrand(createdBrandId, {
        brand_profile_status: 'partial',
      })
    }
    
    toast.info('You can complete your brand profile later')
    navigate('/app/dashboard')
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    
    try {
      await saveStepProgress(currentStep)
      
      if (createdBrandId) {
        await completeOnboarding(createdBrandId)
      }
      
      toast.success('Brand profile complete!')
      onComplete?.()
      navigate('/app/brands')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('Failed to complete onboarding')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentStepData = STEPS[currentStep - 1]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  i + 1 <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-foreground">
              {currentStepData.name}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">{currentStepData.name}</h1>
          <p className="text-muted-foreground mt-1">{currentStepData.description}</p>
        </div>

        <FormProvider {...methods}>
          <form
            className="space-y-8"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="min-h-[400px]">
              {currentStep === 1 && <LogoUploadStep />}
              {currentStep === 2 && <ColorPaletteStep />}
              {currentStep === 3 && <TypographyStep />}
              {currentStep === 4 && <ToneStep />}
              {currentStep === 5 && <LanguageRulesStep />}
              {currentStep === 6 && <TeamStep />}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-border">
              <div>
                {currentStep > 1 && (
                  <Button type="button" variant="ghost" onClick={prevStep} className="hover:bg-muted transition-colors">
                    Back
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="hover:bg-muted transition-colors"
                >
                  Skip for now
                </Button>
                
                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="transition-colors"
                  >
                    {isSubmitting ? 'Saving...' : 'Continue'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="transition-colors"
                  >
                    {isSubmitting ? 'Completing...' : 'Complete Setup'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
