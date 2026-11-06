import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const EXAMPLE_SNIPPETS = [
  'Warm lifestyle photography, natural light, diverse casting',
  'Minimal product shots on cream backgrounds, soft shadows',
  'Bold graphic illustration, flat colour blocks, no photography',
]

interface BrandVisualStyleEditorProps {
  visualStyle: string
  onSave: (visualStyle: string) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function BrandVisualStyleEditor({
  visualStyle,
  onSave,
  onCancel,
  isSaving,
}: BrandVisualStyleEditorProps) {
  const [value, setValue] = useState(visualStyle)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="visual-style">Visual &amp; photography direction</Label>
        <Textarea
          id="visual-style"
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe mood, lighting, composition, and what to avoid in imagery…"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          Used in image generation prompts. Aim for at least 20 characters.
        </p>
      </div>
      <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Examples</p>
        {EXAMPLE_SNIPPETS.map((example) => (
          <button
            key={example}
            type="button"
            className="block w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setValue(example)}
          >
            {example}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={isSaving} onClick={() => void onSave(value.trim())}>
          {isSaving ? 'Saving…' : 'Save visual style'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
