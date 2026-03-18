import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { extractColorsFromImage, suggestColorRoles, getContrastColor } from '@/lib/colors'

import type { OnboardingFormData } from '../OnboardingWizard'

const COLOR_FIELDS = [
  { name: 'primary', label: 'Primary', description: 'Main brand color' },
  { name: 'secondary', label: 'Secondary', description: 'Supporting color' },
  { name: 'accent', label: 'Accent', description: 'Highlight color' },
  { name: 'neutral', label: 'Neutral', description: 'Text and backgrounds' },
] as const

export function ColorPaletteStep() {
  const { control, setValue, watch } = useFormContext<OnboardingFormData>()
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedColors, setExtractedColors] = useState<string[]>([])
  
  const logoUrl = watch('logoUrl')
  const colours = watch('colours')

  useEffect(() => {
    if (logoUrl && !extractedColors.length) {
      extractColors()
    }
  }, [logoUrl])

  const extractColors = async () => {
    if (!logoUrl) return
    
    setIsExtracting(true)
    try {
      const colors = await extractColorsFromImage(logoUrl)
      setExtractedColors(colors)
      
      const suggested = suggestColorRoles(colors)
      setValue('colours.primary', suggested.primary)
      setValue('colours.secondary', suggested.secondary)
      setValue('colours.accent', suggested.accent)
      setValue('colours.neutral', suggested.neutral)
    } catch (error) {
      console.error('Failed to extract colors:', error)
    } finally {
      setIsExtracting(false)
    }
  }

  const applyExtractedColor = (color: string, field: keyof typeof colours) => {
    setValue(`colours.${field}`, color)
  }

  return (
    <div className="space-y-6">
      {logoUrl && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {isExtracting
                    ? 'Extracting colors from your logo...'
                    : 'Colors extracted from your logo'}
                </span>
              </div>
              {!isExtracting && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={extractColors}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Re-extract
                </Button>
              )}
            </div>
            
            {isExtracting && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {extractedColors.length > 0 && !isExtracting && (
              <div className="mt-4 flex flex-wrap gap-2">
                {extractedColors.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    className="h-10 w-10 rounded-lg border-2 border-transparent hover:border-primary transition-colors"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      const availableFields = COLOR_FIELDS.map((f) => f.name)
                      const nextField = availableFields[index % availableFields.length]
                      applyExtractedColor(color, nextField)
                    }}
                    title={`Click to use ${color}`}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {COLOR_FIELDS.map((field) => (
          <FormField
            key={field.name}
            control={control}
            name={`colours.${field.name}`}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-lg border flex-shrink-0 flex items-center justify-center text-xs font-mono"
                    style={{
                      backgroundColor: formField.value,
                      color: getContrastColor(formField.value),
                    }}
                  >
                    Aa
                  </div>
                  <div className="flex-1 flex gap-2">
                    <Input
                      type="color"
                      className="w-12 h-10 p-1 cursor-pointer"
                      value={formField.value}
                      onChange={(e) => formField.onChange(e.target.value)}
                      aria-label={`${field.label} color picker`}
                    />
                    <FormControl>
                      <Input
                        {...formField}
                        placeholder="#000000"
                        className="flex-1 font-mono"
                      />
                    </FormControl>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{field.description}</p>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-3">Preview</p>
          <div className="space-y-3">
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: colours?.primary }}
            >
              <p
                className="font-semibold"
                style={{ color: getContrastColor(colours?.primary || '#000') }}
              >
                Primary Background
              </p>
            </div>
            <div className="flex gap-3">
              <div
                className="flex-1 p-3 rounded-lg"
                style={{ backgroundColor: colours?.secondary }}
              >
                <p
                  className="text-sm"
                  style={{ color: getContrastColor(colours?.secondary || '#000') }}
                >
                  Secondary
                </p>
              </div>
              <div
                className="flex-1 p-3 rounded-lg"
                style={{ backgroundColor: colours?.accent }}
              >
                <p
                  className="text-sm"
                  style={{ color: getContrastColor(colours?.accent || '#000') }}
                >
                  Accent
                </p>
              </div>
              <div
                className="flex-1 p-3 rounded-lg"
                style={{ backgroundColor: colours?.neutral }}
              >
                <p
                  className="text-sm"
                  style={{ color: getContrastColor(colours?.neutral || '#000') }}
                >
                  Neutral
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
