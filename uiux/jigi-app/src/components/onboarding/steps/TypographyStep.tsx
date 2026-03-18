import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Type } from 'lucide-react'

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { POPULAR_FONTS } from '@/lib/validations/brand'
import { cn } from '@/lib/utils'
import { loadGoogleFont } from '@/lib/fonts'

import type { OnboardingFormData } from '../OnboardingWizard'

export function TypographyStep() {
  const { control, watch, setValue } = useFormContext<OnboardingFormData>()
  
  const typography = watch('typography')
  const headingFont = typography?.customHeading?.trim() || typography?.heading
  const bodyFont = typography?.customBody?.trim() || typography?.body

  useEffect(() => {
    loadGoogleFont(headingFont)
  }, [headingFont])

  useEffect(() => {
    loadGoogleFont(bodyFont)
  }, [bodyFont])

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="typography.heading"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heading Font</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select heading font" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POPULAR_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used for titles and headings
              </p>
              <FormField
                control={control}
                name="typography.customHeading"
                render={({ field }) => (
                  <FormItem className="mt-3">
                    <FormLabel className="text-xs">Or specify a Google Font for headings</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="e.g. Manrope"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="typography.body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body Font</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select body font" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {POPULAR_FONTS.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used for body text and paragraphs
              </p>
              <FormField
                control={control}
                name="typography.customBody"
                render={({ field }) => (
                  <FormItem className="mt-3">
                    <FormLabel className="text-xs">Or specify a Google Font for body text</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="e.g. IBM Plex Sans"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Type className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Typography Preview</p>
          </div>
          
          <div className="space-y-4 border rounded-lg p-6 bg-muted/30">
            <h1
              className="text-3xl font-bold"
              style={{ fontFamily: headingFont }}
            >
              Welcome to Your Brand
            </h1>
            <h2
              className="text-xl font-semibold"
              style={{ fontFamily: headingFont }}
            >
              Creating Amazing Experiences
            </h2>
            <p
              className="text-base text-muted-foreground"
              style={{ fontFamily: bodyFont }}
            >
              This is how your body text will appear across your brand materials.
              The combination of your heading and body fonts creates a unique
              visual identity that helps communicate your brand's personality.
            </p>
            <p
              className="text-sm"
              style={{ fontFamily: bodyFont }}
            >
              <span className="font-semibold">Bold text</span> and{' '}
              <span className="italic">italic text</span> help emphasize
              important information while maintaining readability.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {POPULAR_FONTS.slice(0, 6).map((font) => (
          <Card
            key={font}
            className={cn(
              'cursor-pointer transition-all hover:border-primary',
              ((typography?.heading === font && !typography?.customHeading?.trim()) ||
                (typography?.body === font && !typography?.customBody?.trim())) &&
                'border-primary bg-primary/5'
            )}
            onClick={() => {
              setValue('typography.heading', font)
              setValue('typography.body', font)
              setValue('typography.customHeading', '')
              setValue('typography.customBody', '')
            }}
          >
            <CardContent className="p-4">
              <p className="text-lg font-medium" style={{ fontFamily: font }}>
                {font}
              </p>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: font }}>
                The quick brown fox jumps over the lazy dog
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
