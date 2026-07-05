import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { TONE_OPTIONS } from '@/lib/validations/brand'
import { cn } from '@/lib/utils'

interface BrandToneEditorProps {
  tone: string[]
  onSave: (tone: string[]) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function BrandToneEditor({ tone, onSave, onCancel, isSaving }: BrandToneEditorProps) {
  const [selected, setSelected] = useState<string[]>(tone)

  const toggle = (value: string) => {
    setSelected((prev) => {
      if (prev.includes(value)) return prev.filter((t) => t !== value)
      if (prev.length >= 5) return prev
      return [...prev, value]
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Brand tone (3–5 recommended)</Label>
        <span className="text-xs text-muted-foreground">{selected.length}/5</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TONE_OPTIONS.map((toneOption) => {
          const isSelected = selected.includes(toneOption)
          const disabled = !isSelected && selected.length >= 5
          return (
            <button
              key={toneOption}
              type="button"
              disabled={disabled}
              onClick={() => toggle(toneOption)}
              className={cn(
                'relative px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSelected && <Check className="absolute top-1 right-1 h-3 w-3" />}
              {toneOption}
            </button>
          )
        })}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isSaving || selected.length === 0}
          onClick={() => void onSave(selected)}
        >
          {isSaving ? 'Saving…' : 'Save tone'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
