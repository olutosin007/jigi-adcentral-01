import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getContrastColor } from '@/lib/colors'

const COLOR_FIELDS = [
  { key: 'primary' as const, label: 'Primary' },
  { key: 'secondary' as const, label: 'Secondary' },
  { key: 'accent' as const, label: 'Accent' },
  { key: 'neutral' as const, label: 'Neutral' },
]

export interface BrandColours {
  primary?: string
  secondary?: string
  accent?: string
  neutral?: string
}

interface BrandColorsEditorProps {
  colours: BrandColours
  onSave: (colours: BrandColours) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function BrandColorsEditor({ colours, onSave, onCancel, isSaving }: BrandColorsEditorProps) {
  const [draft, setDraft] = useState<BrandColours>({
    primary: colours.primary || '#0D9488',
    secondary: colours.secondary || '#1C1917',
    accent: colours.accent || '#D97706',
    neutral: colours.neutral || '#78716C',
  })

  const update = (key: keyof BrandColours, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {COLOR_FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`brand-color-${key}`}>{label}</Label>
            <div className="flex gap-2">
              <div
                className="h-10 w-10 rounded-lg border flex-shrink-0 flex items-center justify-center text-xs font-mono"
                style={{
                  backgroundColor: draft[key],
                  color: getContrastColor(draft[key] || '#000'),
                }}
              >
                Aa
              </div>
              <Input
                id={`brand-color-${key}`}
                type="color"
                className="w-12 h-10 p-1 cursor-pointer"
                value={draft[key] || '#000000'}
                onChange={(e) => update(key, e.target.value)}
                aria-label={`${label} color picker`}
              />
              <Input
                value={draft[key] || ''}
                onChange={(e) => update(key, e.target.value)}
                className="font-mono flex-1"
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isSaving || !draft.primary?.trim()}
          onClick={() => void onSave(draft)}
        >
          {isSaving ? 'Saving…' : 'Save colors'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
