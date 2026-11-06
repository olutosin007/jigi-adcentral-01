import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useBrandPresets, useCreateBrandPreset, useDeleteBrandPreset } from '@/hooks/useBrandPresets'
import {
  PRESET_NAME_MAX,
  extractPresetStyle,
  validatePresetInput,
  type BrandImagePreset,
} from '@/lib/brand-presets'
import type { ImageTierId } from '@/lib/image-tiers'
import type { ImageAspectRatio } from '@/lib/ai'

interface BrandPresetBarProps {
  brandId?: string
  userId?: string
  prompt: string
  tier: ImageTierId
  aspectRatio: ImageAspectRatio
  onApply: (preset: BrandImagePreset) => void
}

export function BrandPresetBar({ brandId, userId, prompt, tier, aspectRatio, onApply }: BrandPresetBarProps) {
  const { data: presets = [] } = useBrandPresets(brandId)
  const createPreset = useCreateBrandPreset(brandId)
  const deletePreset = useDeleteBrandPreset(brandId)
  const [saveOpen, setSaveOpen] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  if (!brandId) return null

  const style = extractPresetStyle(prompt)

  const handleSave = async () => {
    const validation = validatePresetInput({ name, style_prompt: style, image_tier: tier, aspect_ratio: aspectRatio })
    if (!validation.ok) {
      setNameError(validation.errors.name ?? validation.errors.style_prompt ?? 'Check the look details')
      return
    }
    if (!userId) {
      setNameError('Sign in to save looks')
      return
    }
    try {
      await createPreset.mutateAsync({ input: validation.value, userId })
      toast.success(`Saved “${validation.value.name}” for this brand`)
      setSaveOpen(false)
      setName('')
      setNameError(null)
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Could not save look')
    }
  }

  const handleDelete = async (preset: BrandImagePreset) => {
    try {
      await deletePreset.mutateAsync(preset.id)
      toast.success(`Removed “${preset.name}”`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove look')
    }
  }

  return (
    <div className="mb-4" data-testid="brand-preset-bar">
      <p className="text-xs text-foreground mb-2 font-medium">Brand looks</p>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <span
            key={preset.id}
            className="inline-flex items-center rounded-lg border border-border bg-card text-sm"
          >
            <button
              type="button"
              onClick={() => onApply(preset)}
              title={preset.style_prompt}
              className="px-3 py-1.5 font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            >
              {preset.name}
              <span className="ml-1.5 text-[11px] text-muted-foreground">
                {preset.image_tier} · {preset.aspect_ratio}
              </span>
            </button>
            {preset.created_by === userId && (
              <button
                type="button"
                aria-label={`Remove ${preset.name}`}
                onClick={() => void handleDelete(preset)}
                className="pr-2 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </span>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          disabled={!style}
          title={style ? undefined : 'Write a prompt first, then save it as a look'}
          onClick={() => {
            setNameError(null)
            setSaveOpen(true)
          }}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          Save current look
        </Button>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save brand look</DialogTitle>
            <DialogDescription>
              Everyone working on this brand can apply it — style words, {tier} tier, {aspectRatio}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="brand-preset-name">Name</Label>
            <Input
              id="brand-preset-name"
              value={name}
              maxLength={PRESET_NAME_MAX + 10}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(null)
              }}
              placeholder="e.g. Sunlit linen"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'brand-preset-name-error' : undefined}
            />
            {nameError && (
              <p id="brand-preset-name-error" className="text-xs text-destructive">
                {nameError}
              </p>
            )}
            <p className="text-xs text-muted-foreground line-clamp-3">{style}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={createPreset.isPending}>
              Save look
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
