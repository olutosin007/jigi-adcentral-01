import { useEffect, useMemo, useState } from 'react'
import { Loader2, Send, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { canSubmitAssetForReview } from '@/lib/status'
import type { CreativeAsset } from '@/store/campaignStore'
import { summarizeBrandCheck, type BrandKitLevel, type BrandCheckState } from '@/lib/handoff'
import { cn } from '@/lib/utils'
import { JobAssetRow } from './JobAssetRow'

export type SendTarget = 'submitted' | 'agency_review'

export interface SendRecipient {
  name?: string
  email: string
}

interface JobSendStageProps {
  assets: CreativeAsset[]
  onSend: (
    assetIds: string[],
    target: SendTarget,
    note?: string,
    recipient?: SendRecipient
  ) => Promise<void>
  isSending: boolean
  onOpenAsset?: (asset: CreativeAsset) => void
  onGoToCreative?: () => void
  brandKit?: BrandKitLevel
  /** Hide the internal gate for orgs/contexts where it doesn't apply. */
  allowInternalCheck?: boolean
}

const TARGETS: { id: SendTarget; label: string; hint: string; icon: typeof Users }[] = [
  {
    id: 'submitted',
    label: 'Send to client',
    hint: 'Client is notified and can approve, request changes or decline.',
    icon: Users,
  },
  {
    id: 'agency_review',
    label: 'Internal check first',
    hint: 'Your team reviews it before the client sees anything.',
    icon: ShieldCheck,
  },
]

export function JobSendStage({
  assets,
  onSend,
  isSending,
  onOpenAsset,
  onGoToCreative,
  brandKit,
  allowInternalCheck = true,
}: JobSendStageProps) {
  const sendable = useMemo(() => assets.filter((a) => canSubmitAssetForReview(a.status)), [assets])
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [target, setTarget] = useState<SendTarget>('submitted')
  const [note, setNote] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')

  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(sendable.map((a) => a.id))
      const next = new Set([...prev].filter((id) => ids.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [sendable])

  const toggle = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const allSelected = sendable.length > 0 && selected.size === sendable.length
  const resends = sendable.filter((a) => a.status === 'changes_requested')
  const fresh = sendable.filter((a) => a.status !== 'changes_requested')
  const targets = allowInternalCheck ? TARGETS : TARGETS.filter((t) => t.id === 'submitted')
  const activeTarget = targets.find((t) => t.id === target) ?? targets[0]

  const brandStrip = useMemo(() => {
    if (!brandKit || brandKit === 'none' || selected.size === 0) return null
    const counts: Record<BrandCheckState, number> = { clear: 0, attention: 0, blocking: 0, unchecked: 0 }
    for (const a of sendable) if (selected.has(a.id)) counts[summarizeBrandCheck(a, brandKit).state] += 1
    const clearLabel = brandKit === 'complete' ? 'look on-brand' : 'no issues found'
    return [
      counts.blocking && `${counts.blocking} with brand issues`,
      counts.attention && `${counts.attention} need a look`,
      counts.clear && `${counts.clear} ${clearLabel}`,
      counts.unchecked && `${counts.unchecked} not checked`,
    ]
      .filter(Boolean)
      .join(' · ')
  }, [brandKit, selected, sendable])

  const handleSend = async () => {
    if (selected.size === 0) return
    const email = recipientEmail.trim()
    const recipient =
      activeTarget.id === 'submitted' && email
        ? { email, name: recipientName.trim() || undefined }
        : undefined
    await onSend([...selected], activeTarget.id, note.trim() || undefined, recipient)
    setSelected(new Set())
    setNote('')
  }

  if (sendable.length === 0) {
    return (
      <div className="p-6 overflow-y-auto h-full">
        <EmptyState
          icon={Send}
          title="Nothing to send yet"
          description="Generate or upload creative, then come back here to send it for a decision."
          action={onGoToCreative ? { label: 'Go to Creative', onClick: onGoToCreative } : undefined}
        />
      </div>
    )
  }

  const renderGroup = (title: string, items: CreativeAsset[]) =>
    items.length > 0 && (
      <section className="space-y-2" aria-label={title}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        {items.map((asset) => (
          <JobAssetRow
            key={asset.id}
            asset={asset}
            brandKit={brandKit}
            onOpen={onOpenAsset ? () => onOpenAsset(asset) : undefined}
            leading={
              <Checkbox
                checked={selected.has(asset.id)}
                onCheckedChange={(c) => toggle(asset.id, c === true)}
                aria-label={`Select ${asset.type}`}
              />
            }
          />
        ))}
      </section>
    )

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden" data-tour="send-stage">
      <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Send for approval</h2>
            <p className="text-sm text-muted-foreground">Pick what the client should decide on.</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setSelected(allSelected ? new Set() : new Set(sendable.map((a) => a.id)))
            }
          >
            {allSelected ? 'Clear' : 'Select all'}
          </Button>
        </div>
        {renderGroup('Fix & resend', resends)}
        {renderGroup('Ready to send', fresh)}
      </div>

      <aside className="lg:w-[320px] border-t lg:border-t-0 lg:border-l border-border bg-muted/40 p-6 space-y-5 overflow-y-auto">
        <fieldset className="space-y-2">
          <legend className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Send to
          </legend>
          {targets.map((t) => {
            const Icon = t.icon
            const active = activeTarget.id === t.id
            return (
              <label
                key={t.id}
                className={cn(
                  'flex gap-3 rounded-[10px] border px-3 py-2.5 cursor-pointer transition-colors',
                  active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
                )}
              >
                <input
                  type="radio"
                  name="send-target"
                  value={t.id}
                  checked={active}
                  onChange={() => setTarget(t.id)}
                  className="sr-only"
                />
                <Icon className={cn('h-4 w-4 mt-0.5', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                <span>
                  <span className="block text-sm font-medium text-foreground">{t.label}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{t.hint}</span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="send-note">Message (optional)</Label>
          <Textarea
            id="send-note"
            rows={3}
            className="resize-none bg-card"
            placeholder="What should they focus on?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {activeTarget.id === 'submitted' && (
          <div className="space-y-2" data-tour="send-email-link">
            <Label htmlFor="send-recipient-email">Email a review link (optional)</Label>
            <Input
              id="send-recipient-email"
              type="email"
              placeholder="client@brand.com"
              className="bg-card"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            {recipientEmail.trim() && (
              <Input
                aria-label="Client name"
                placeholder="Client name (optional)"
                className="bg-card"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
            )}
            <p className="text-xs text-muted-foreground">
              They can decide from the email — no account needed. Copy links later from Decisions.
            </p>
          </div>
        )}

        {brandKit && brandKit !== 'complete' && (
          <p className="text-xs text-[#B45309] dark:text-[#FBBF24]">
            {brandKit === 'none'
              ? 'No brand attached — nothing has been checked against a brand.'
              : 'Brand kit is incomplete — brand checks are guidance only.'}
          </p>
        )}

        {brandStrip && (
          <p className="text-xs text-muted-foreground" data-testid="send-brand-strip">
            Client will see: {brandStrip}
          </p>
        )}

        <Button
          className="w-full"
          disabled={selected.size === 0 || isSending}
          onClick={handleSend}
          data-tour="submit-action"
        >
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Send className="mr-2 h-4 w-4" aria-hidden />
          )}
          {selected.size === 0
            ? 'Select creative to send'
            : `Send ${selected.size} ${activeTarget.id === 'submitted' ? 'to client' : 'for internal check'}`}
        </Button>
      </aside>
    </div>
  )
}
