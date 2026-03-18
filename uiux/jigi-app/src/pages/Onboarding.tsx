import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight, CheckCircle2, Image, Palette, Type, MessageSquare, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

type StepStatus = 'upcoming' | 'in_progress' | 'complete'

interface OnboardingStep {
  icon: typeof Building2
  title: string
  description: string
  status: StepStatus
}

const steps: OnboardingStep[] = [
  {
    icon: Image,
    title: 'Upload Logo',
    description: 'Add your brand logo for color extraction',
    status: 'upcoming',
  },
  {
    icon: Palette,
    title: 'Define Colors',
    description: 'Set your brand color palette',
    status: 'upcoming',
  },
  {
    icon: Type,
    title: 'Choose Typography',
    description: 'Select heading and body fonts',
    status: 'upcoming',
  },
  {
    icon: MessageSquare,
    title: 'Set Brand Voice',
    description: 'Define tone and language preferences',
    status: 'upcoming',
  },
  {
    icon: Users,
    title: 'Invite Team',
    description: 'Add team members and connect agencies',
    status: 'upcoming',
  },
]

export function Onboarding() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [showWizard, setShowWizard] = useState(false)

  const handleBeginSetup = () => {
    if (!profile?.organisation_id) {
      navigate('/setup/organisation')
      return
    }
    setShowWizard(true)
  }

  if (showWizard) {
    return <OnboardingWizard onComplete={() => navigate('/app/brands')} />
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Brand</CardTitle>
          <CardDescription className="text-base">
            Complete these steps to unlock brand-consistent creative generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex items-start gap-4 rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  {step.status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <step.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 hover:bg-muted transition-colors"
              onClick={() => navigate('/app/quick-start')}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1 transition-colors"
              onClick={handleBeginSetup}
            >
              Begin setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            You can always complete or edit your brand profile later.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
