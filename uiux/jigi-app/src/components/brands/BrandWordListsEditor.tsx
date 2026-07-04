import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

function parseWords(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((w) => w.trim())
    .filter(Boolean)
}

function formatWords(words: string[]): string {
  return words.join(', ')
}

interface BrandWordListsEditorProps {
  preferredWords: string[]
  avoidedWords: string[]
  onSave: (preferred: string[], avoided: string[]) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function BrandWordListsEditor({
  preferredWords,
  avoidedWords,
  onSave,
  onCancel,
  isSaving,
}: BrandWordListsEditorProps) {
  const [preferred, setPreferred] = useState(formatWords(preferredWords))
  const [avoided, setAvoided] = useState(formatWords(avoidedWords))

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="preferred-words">Preferred words</Label>
        <Textarea
          id="preferred-words"
          rows={3}
          value={preferred}
          onChange={(e) => setPreferred(e.target.value)}
          placeholder="innovative, trusted, bold (comma or line separated)"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avoided-words">Avoided words</Label>
        <Textarea
          id="avoided-words"
          rows={3}
          value={avoided}
          onChange={(e) => setAvoided(e.target.value)}
          placeholder="cheap, synergy, disruptive"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isSaving}
          onClick={() => void onSave(parseWords(preferred), parseWords(avoided))}
        >
          {isSaving ? 'Saving…' : 'Save word lists'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
