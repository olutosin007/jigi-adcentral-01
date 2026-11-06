import { useEffect, useState } from 'react'
import { Check, Copy, Loader2, Mail } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateReviewLink } from '@/hooks/useReviewLinks'
import { getAssetTitle } from '@/lib/handoff'
import { trackEvent } from '@/lib/analytics'
import { useActivationStore } from '@/store/activationStore'
import type { CreativeAsset } from '@/store/campaignStore'

interface ShareReviewLinkDialogProps {
  asset: CreativeAsset | null
  campaignId: string
  onOpenChange: (open: boolean) => void
}

export function ShareReviewLinkDialog({ asset, campaignId, onOpenChange }: ShareReviewLinkDialogProps) {
  const createLink = useCreateReviewLink(campaignId)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (asset) {
      setUrl(null)
      setCopied(false)
    }
  }, [asset])

  if (!asset) return null

  const create = async () => {
    try {
      const result = await createLink.mutateAsync({
        asset_id: asset.id,
        recipient_name: name.trim() || undefined,
        recipient_email: email.trim() || undefined,
        send_email: sendEmail && !!email.trim(),
      })
      setUrl(result.url)
      trackEvent('decide_link_created', { asset_id: asset.id, emailed: Boolean(result.email_sent) })
      useActivationStore.getState().markTick('decide_link_sent')
      if (result.email_sent) toast.success(`Decide link emailed to ${email.trim()}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create link')
    }
  }

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Decide link copied')
      useActivationStore.getState().markTick('decide_link_sent')
    } catch {
      toast.error('Copy failed — select the link and copy it manually')
    }
  }

  const openPreview = () => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={!!asset} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share for a decision</DialogTitle>
          <DialogDescription>
            Anyone with this Guest Decide link can approve, request changes or decline “{getAssetTitle(asset)}” —
            no account needed. Links expire after 14 days.
          </DialogDescription>
        </DialogHeader>

        {url ? (
          <div className="space-y-3">
            <Label htmlFor="share-url">Decide link</Label>
            <div className="flex gap-2">
              <Input id="share-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
              <Button variant="outline" onClick={copy} aria-label="Copy Decide link">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Practice tip: open the link yourself to complete activation — labelled as your decision either way.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="share-name">Client name (optional)</Label>
                <Input id="share-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="share-email">Client email (optional)</Label>
                <Input id="share-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            {email.trim() && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={sendEmail} onCheckedChange={(c) => setSendEmail(c === true)} />
                Email them the link
              </label>
            )}
          </div>
        )}

        <DialogFooter>
          {url ? (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Done
              </Button>
              <Button variant="outline" onClick={openPreview}>
                Open Decide preview
              </Button>
              <Button onClick={copy}>{copied ? 'Copied' : 'Copy Decide link'}</Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={create} disabled={createLink.isPending}>
                {createLink.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : sendEmail && email.trim() ? (
                  <Mail className="mr-2 h-4 w-4" aria-hidden />
                ) : null}
                {sendEmail && email.trim() ? 'Create & email link' : 'Create link'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
