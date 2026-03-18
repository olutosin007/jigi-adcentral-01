import { useFormContext } from 'react-hook-form'
import { Check } from 'lucide-react'

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { TONE_OPTIONS } from '@/lib/validations/brand'
import { cn } from '@/lib/utils'

import type { OnboardingFormData } from '../OnboardingWizard'

export function ToneStep() {
  const { control, watch, setValue } = useFormContext<OnboardingFormData>()
  
  const selectedTones = watch('tone') || []

  const toggleTone = (tone: string) => {
    if (selectedTones.includes(tone)) {
      setValue('tone', selectedTones.filter((t) => t !== tone))
    } else if (selectedTones.length < 5) {
      setValue('tone', [...selectedTones, tone])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Select 3-5 words that best describe your brand's tone of voice.
          These will guide the AI in generating copy that matches your brand.
        </p>
      </div>

      <FormField
        control={control}
        name="tone"
        render={() => (
          <FormItem>
            <FormLabel className="flex items-center justify-between">
              <span>Brand Tone</span>
              <span className="text-xs text-muted-foreground font-normal">
                {selectedTones.length}/5 selected
              </span>
            </FormLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TONE_OPTIONS.map((tone) => {
                const isSelected = selectedTones.includes(tone)
                const isDisabled = !isSelected && selectedTones.length >= 5
                
                return (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => toggleTone(tone)}
                    disabled={isDisabled}
                    className={cn(
                      'relative flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50',
                      isDisabled && 'opacity-50 cursor-not-allowed hover:border-border'
                    )}
                  >
                    {isSelected && (
                      <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                    )}
                    {tone}
                  </button>
                )
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedTones.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Your Brand Voice</p>
            <div className="flex flex-wrap gap-2">
              {selectedTones.map((tone) => (
                <span
                  key={tone}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {tone}
                  <button
                    type="button"
                    onClick={() => toggleTone(tone)}
                    className="hover:text-primary/70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Your brand speaks in a{' '}
              {selectedTones.slice(0, -1).join(', ')}
              {selectedTones.length > 1 && ' and '}
              {selectedTones[selectedTones.length - 1]} voice.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">How this helps</p>
          <p className="text-sm text-muted-foreground">
            Your tone selections inform the AI about your brand's personality.
            A "Professional" and "Trustworthy" brand will receive different copy
            suggestions than a "Playful" and "Bold" brand.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
