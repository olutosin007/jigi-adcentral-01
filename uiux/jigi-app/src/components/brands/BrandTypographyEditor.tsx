import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { POPULAR_FONTS } from '@/lib/validations/brand'
import { loadGoogleFont } from '@/lib/fonts'

interface BrandFonts {
  heading?: string
  body?: string
}

interface BrandTypographyEditorProps {
  fonts: BrandFonts
  onSave: (fonts: BrandFonts) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function BrandTypographyEditor({ fonts, onSave, onCancel, isSaving }: BrandTypographyEditorProps) {
  const [heading, setHeading] = useState(fonts.heading || 'Inter')
  const [body, setBody] = useState(fonts.body || 'Inter')

  useEffect(() => {
    loadGoogleFont(heading)
    loadGoogleFont(body)
  }, [heading, body])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Heading font</Label>
          <Select value={heading} onValueChange={setHeading}>
            <SelectTrigger>
              <SelectValue placeholder="Select heading font" />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_FONTS.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Or type a Google Font name"
          />
        </div>
        <div className="space-y-2">
          <Label>Body font</Label>
          <Select value={body} onValueChange={setBody}>
            <SelectTrigger>
              <SelectValue placeholder="Select body font" />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_FONTS.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Or type a Google Font name"
          />
        </div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <p className="text-lg font-semibold" style={{ fontFamily: heading }}>
          Heading preview
        </p>
        <p className="text-sm text-muted-foreground" style={{ fontFamily: body }}>
          Body preview — the quick brown fox jumps over the lazy dog.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={isSaving || !heading.trim() || !body.trim()}
          onClick={() => void onSave({ heading: heading.trim(), body: body.trim() })}
        >
          {isSaving ? 'Saving…' : 'Save typography'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
