import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function parseList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatList(items: string[]): string {
  return items.join(', ')
}

interface BrandStrategyEditorProps {
  positioning: string
  differentiators: string[]
  onSave: (positioning: string, differentiators: string[]) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function BrandStrategyEditor({
  positioning,
  differentiators,
  onSave,
  onCancel,
  isSaving,
}: BrandStrategyEditorProps) {
  const [positioningValue, setPositioningValue] = useState(positioning)
  const [differentiatorsValue, setDifferentiatorsValue] = useState(formatList(differentiators))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="brand-positioning">Brand positioning</Label>
        <Textarea
          id="brand-positioning"
          rows={2}
          value={positioningValue}
          onChange={(e) => setPositioningValue(e.target.value)}
          placeholder="One-line positioning statement, e.g. The refreshment choice for everyday moments of joy"
          maxLength={500}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="brand-differentiators">Differentiators</Label>
        <Textarea
          id="brand-differentiators"
          rows={3}
          value={differentiatorsValue}
          onChange={(e) => setDifferentiatorsValue(e.target.value)}
          placeholder="secret formula, iconic bottle shape, share a moment (comma or line separated)"
        />
        <p className="text-xs text-muted-foreground">
          Feeds concept and copy generation as value propositions.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isSaving}
          onClick={() =>
            void onSave(positioningValue.trim(), parseList(differentiatorsValue))
          }
        >
          {isSaving ? 'Saving…' : 'Save strategy'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
