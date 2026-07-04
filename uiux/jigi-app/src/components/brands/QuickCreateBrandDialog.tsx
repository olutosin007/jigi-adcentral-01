import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import { useBrandStore } from '@/store/brandStore'

interface QuickCreateBrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickCreateBrandDialog({ open, onOpenChange }: QuickCreateBrandDialogProps) {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { createBrand } = useBrandStore()
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      toast.error('Brand name must be at least 2 characters')
      return
    }
    if (!profile?.organisation_id) {
      toast.error('Organisation required before creating a brand')
      return
    }

    setIsCreating(true)
    const result = await createBrand({
      name: trimmed,
      organisation_id: profile.organisation_id,
      identity: {
        colours: { primary: '#0D9488', secondary: '#1C1917', accent: '#D97706', neutral: '#78716C' },
        fonts: { heading: 'Inter', body: 'Source Sans 3' },
      },
      voice: { tone: [], preferred_words: [], avoided_words: [] },
      brand_profile_status: 'starter',
      journey_mode: profile.journey_mode || 'brand_first',
    })
    setIsCreating(false)

    if (result.success && result.brand) {
      toast.success('Brand created — add your kit details next')
      onOpenChange(false)
      setName('')
      navigate(`/app/brands/${result.brand.id}`)
    } else {
      toast.error(result.error || 'Failed to create brand')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick create brand</DialogTitle>
          <DialogDescription>
            Add a name now and refine colors, fonts, and voice on the brand profile. No wizard required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="quick-brand-name">Brand name</Label>
          <Input
            id="quick-brand-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Co"
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreate()} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create brand'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
