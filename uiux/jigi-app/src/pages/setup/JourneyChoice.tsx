import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, Palette, Sparkles, ArrowRight } from 'lucide-react'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useAppStore, type JourneyMode } from '@/store'
import { cn } from '@/lib/utils'

export function JourneyChoice() {
  const navigate = useNavigate()
  const { updateProfile } = useAuthStore()
  const { setJourneyMode } = useAppStore()
  const [selectedJourney, setSelectedJourney] = useState<JourneyMode | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContinue = async () => {
    if (!selectedJourney) return

    setIsSubmitting(true)

    try {
      const result = await updateProfile({ journey_mode: selectedJourney })
      
      if (!result.success) {
        throw new Error(result.error)
      }

      setJourneyMode(selectedJourney)

      toast.success('Setup complete!')
      
      if (selectedJourney === 'brand_first') {
        navigate('/app/onboarding')
      } else {
        navigate('/app/quick-start')
      }
    } catch (error) {
      console.error('Journey choice error:', error)
      toast.error('Failed to save preference')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="How do you want to start?"
      subtitle="Choose your creative workflow approach"
    >
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">2</span>
        <span className="font-medium text-foreground">Step 2 of 2</span>
        <span>— Journey choice</span>
      </div>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedJourney('brand_first')}
          className={cn(
            'w-full flex items-start gap-4 rounded-xl border-2 p-6 text-left transition-all',
            selectedJourney === 'brand_first'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          )}
        >
          <div className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
            selectedJourney === 'brand_first' ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Palette className={cn(
              'h-6 w-6',
              selectedJourney === 'brand_first' ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Start with Brand Setup</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your logo, colours, and brand voice before generating. Best for teams with existing brand guidelines.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedJourney('idea_first')}
          className={cn(
            'w-full flex items-start gap-4 rounded-xl border-2 p-6 text-left transition-all',
            selectedJourney === 'idea_first'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          )}
        >
          <div className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
            selectedJourney === 'idea_first' ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Sparkles className={cn(
              'h-6 w-6',
              selectedJourney === 'idea_first' ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Generate from Idea First</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with a text brief and generate immediately. Add brand elements later. Perfect for quick exploration.
            </p>
          </div>
        </button>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Don't worry</strong> — you can always add or change brand settings later. Both workflows lead to the same powerful creative tools.
        </p>
      </div>

      <Button
        className="w-full mt-6 transition-colors"
        onClick={handleContinue}
        disabled={!selectedJourney || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </AuthLayout>
  )
}
