import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import type { DecideAction } from './DecideActions'

const IDENTITY_KEY = 'jigi-guest-identity'

const COPY: Record<DecideAction, { title: string; description: string; cta: string; notesLabel: string }> = {
  approve: {
    title: 'Approve this creative',
    description: 'The team will be told it is cleared to use.',
    cta: 'Approve',
    notesLabel: 'Anything to add? (optional)',
  },
  request_changes: {
    title: 'Request changes',
    description: 'Be specific — the team will fix and resend.',
    cta: 'Send changes',
    notesLabel: 'What should change?',
  },
  reject: {
    title: 'Decline this creative',
    description: 'The team will be told this is not moving forward.',
    cta: 'Decline',
    notesLabel: 'Why? (optional, helps the team)',
  },
}

export interface GuestIdentity {
  name: string
  email: string
}

function loadIdentity(fallbackName?: string | null): GuestIdentity {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GuestIdentity>
      return { name: parsed.name ?? fallbackName ?? '', email: parsed.email ?? '' }
    }
  } catch {
    // storage unavailable (private mode) — fall through
  }
  return { name: fallbackName ?? '', email: '' }
}

interface GuestDecisionDialogProps {
  action: DecideAction | null
  onOpenChange: (open: boolean) => void
  onConfirm: (input: { notes?: string; identity: GuestIdentity }) => Promise<void>
  isSubmitting: boolean
  error?: string | null
  defaultName?: string | null
}

export function GuestDecisionDialog({
  action,
  onOpenChange,
  onConfirm,
  isSubmitting,
  error,
  defaultName,
}: GuestDecisionDialogProps) {
  const [identity, setIdentity] = useState<GuestIdentity>(() => loadIdentity(defaultName))
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (action) setNotes('')
  }, [action])

  if (!action) return null
  const copy = COPY[action]
  const notesRequired = action === 'request_changes'
  const canSubmit = identity.name.trim().length > 0 && (!notesRequired || notes.trim().length > 0)

  const submit = async () => {
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
    } catch {
      // ignore
    }
    await onConfirm({ notes: notes.trim() || undefined, identity })
  }

  return (
    <Dialog open={!!action} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="decide-notes">{copy.notesLabel}</Label>
            <Textarea
              id="decide-notes"
              rows={notesRequired ? 5 : 3}
              autoFocus={notesRequired}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              maxLength={5000}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="decide-name">Your name</Label>
              <Input
                id="decide-name"
                autoComplete="name"
                autoFocus={!notesRequired && !identity.name}
                value={identity.name}
                onChange={(e) => setIdentity((i) => ({ ...i, name: e.target.value }))}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="decide-email">Email (optional)</Label>
              <Input
                id="decide-email"
                type="email"
                autoComplete="email"
                value={identity.email}
                onChange={(e) => setIdentity((i) => ({ ...i, email: e.target.value }))}
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit || isSubmitting}
            variant={action === 'reject' ? 'destructive' : 'default'}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            {copy.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
