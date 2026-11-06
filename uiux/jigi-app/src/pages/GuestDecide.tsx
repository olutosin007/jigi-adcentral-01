import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Clock, GitCompare, Link2Off, Loader2, MessageSquare, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AssetHeroPreview } from '@/components/decide/AssetHeroPreview'
import { DecideActions, type DecideAction } from '@/components/decide/DecideActions'
import { GuestDecisionDialog } from '@/components/decide/GuestDecisionDialog'
import { OnBrandCheckPanel } from '@/components/decide/OnBrandCheckPanel'
import { CompareToPrevious } from '@/components/decide/CompareToPrevious'
import { RoundChip } from '@/components/decide/RoundChip'
import {
  fetchGuestReview,
  submitGuestDecision,
  type GuestDecision,
  type GuestLinkState,
  type GuestReviewPayload,
} from '@/lib/guest-review-api'
import { trackDecision, trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { PageTitle } from '@/design-system'

type ViewState =
  | { kind: 'loading' }
  | { kind: 'error'; state: GuestLinkState; message: string }
  | { kind: 'ready'; data: GuestReviewPayload }
  | { kind: 'done'; data: GuestReviewPayload; decision: GuestDecision; by: string }

const DONE_COPY: Record<GuestDecision, { title: string; body: string; icon: typeof CheckCircle2; tone: string }> = {
  approve: {
    title: 'Approved',
    body: 'The team has been told it is cleared to use.',
    icon: CheckCircle2,
    tone: 'text-success bg-success/10',
  },
  request_changes: {
    title: 'Changes requested',
    body: 'The team has your notes and will send a new version.',
    icon: MessageSquare,
    tone: 'text-warning bg-warning/10',
  },
  reject: {
    title: 'Declined',
    body: 'The team has been told this is not moving forward.',
    icon: XCircle,
    tone: 'text-muted-foreground bg-muted',
  },
}

const ERROR_COPY: Partial<Record<GuestLinkState, { title: string; body: string }>> = {
  expired: {
    title: 'This Decide link has expired',
    body: 'Ask your agency for a new Decide link — the creative may already have a fresh round ready.',
  },
  revoked: {
    title: 'This Decide link was withdrawn',
    body: 'The team pulled it back. Ask them to send a new Decide link when ready.',
  },
  used_up: {
    title: 'This Decide link has already been used',
    body: 'Ask your agency for a fresh Decide link if you need to review again.',
  },
  not_found: {
    title: 'This Decide link isn’t active',
    body: 'Check the URL is complete, or ask your agency for a new Decide link.',
  },
}

function ShellHeader({ data }: { data?: GuestReviewPayload }) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 md:px-8">
        {data?.brand?.logo_url ? (
          <img src={data.brand.logo_url} alt="" className="h-9 w-9 rounded-md object-contain bg-card border border-border" />
        ) : data?.brand ? (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold text-white"
            style={{ backgroundColor: data.brand.primary_colour ?? '#0D9488' }}
            aria-hidden
          >
            {data.brand.name.slice(0, 1).toUpperCase()}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {data ? (
            <>
              <p className="truncate text-base font-semibold text-foreground">
                {data.brand?.name ?? data.campaign.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {data.brand ? `${data.campaign.name} · ` : ''}Version {data.asset.version ?? 1}
              </p>
            </>
          ) : (
            <div className="h-9" />
          )}
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card font-sans text-[10px] font-bold text-foreground">
            J
          </span>
          Jigi
        </span>
      </div>
    </header>
  )
}

function CenteredMessage({
  icon: Icon,
  title,
  body,
  tone = 'text-muted-foreground bg-muted',
  children,
}: {
  icon: typeof CheckCircle2
  title: string
  body: string
  tone?: string
  children?: ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <span className={cn('flex h-14 w-14 items-center justify-center rounded-full', tone)}>
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <PageTitle className="mt-5">{title}</PageTitle>
      <p className="mt-2 text-muted-foreground">{body}</p>
      {children}
    </div>
  )
}

export function GuestDecide() {
  const { token = '' } = useParams<{ token: string }>()
  const [view, setView] = useState<ViewState>({ kind: 'loading' })
  const [pendingAction, setPendingAction] = useState<DecideAction | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [comparing, setComparing] = useState(false)
  const opened = useRef(false)

  useEffect(() => {
    let cancelled = false
    fetchGuestReview(token).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setView({ kind: 'error', state: result.state, message: result.error })
        return
      }
      const { data } = result
      if (data.state === 'decided' && data.link.decision) {
        setView({ kind: 'done', data, decision: data.link.decision, by: data.link.guest_name ?? '' })
      } else {
        setView({ kind: 'ready', data })
      }
      if (!opened.current) {
        opened.current = true
        trackEvent('decide_opened', { via: 'guest', asset_type: data.asset.type, round: data.round ?? 1 })
      }
    })
    return () => {
      cancelled = true
    }
  }, [token])

  const handleConfirm = async ({ notes, identity }: { notes?: string; identity: { name: string; email: string } }) => {
    if (view.kind !== 'ready' || !pendingAction) return
    setSubmitting(true)
    setSubmitError(null)
    const result = await submitGuestDecision(token, {
      action: pendingAction,
      notes,
      guest_name: identity.name.trim(),
      guest_email: identity.email.trim() || undefined,
    })
    setSubmitting(false)
    if (!result.ok) {
      setSubmitError(result.error)
      return
    }
    trackDecision({
      via: 'guest',
      action: pendingAction,
      round: view.data.round ?? 1,
      sentAt: view.data.asset.updated_at,
      assetType: view.data.asset.type,
      candidateSource: view.data.asset.source,
    })
    setView({ kind: 'done', data: view.data, decision: pendingAction, by: identity.name.trim() })
    setPendingAction(null)
  }

  const data = view.kind === 'ready' || view.kind === 'done' ? view.data : undefined
  const round = data?.round ?? 1
  const canCompare = round >= 2 && !!data?.previous_content

  return (
    <div className="min-h-screen bg-background flex flex-col" data-tour="guest-decide">
      <ShellHeader data={data} />

      {view.kind === 'loading' && (
        <div className="flex flex-1 items-center justify-center" role="status" aria-label="Loading review">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {view.kind === 'error' && (
        <CenteredMessage
          icon={view.state === 'expired' ? Clock : Link2Off}
          title={ERROR_COPY[view.state]?.title ?? 'Something went wrong'}
          body={ERROR_COPY[view.state]?.body ?? view.message}
        >
          {view.state === 'active' && (
            <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          )}
        </CenteredMessage>
      )}

      {view.kind === 'done' && (
        <CenteredMessage
          icon={DONE_COPY[view.decision].icon}
          tone={DONE_COPY[view.decision].tone}
          title={DONE_COPY[view.decision].title}
          body={`${DONE_COPY[view.decision].body}${view.by ? ` Recorded for ${view.by}.` : ''}`}
        >
          <p className="mt-8 text-sm text-muted-foreground">
            Want every approval in one place?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Create a free Jigi account
            </Link>
          </p>
        </CenteredMessage>
      )}

      {view.kind === 'ready' && (
        <>
          <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 pb-44 pt-4 sm:px-4 md:px-8 md:pb-32 md:pt-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
              {comparing && canCompare ? (
                <CompareToPrevious
                  asset={view.data.asset}
                  previousContent={view.data.previous_content!}
                  round={round}
                  className="lg:w-[68%]"
                />
              ) : (
                <AssetHeroPreview asset={view.data.asset} className="lg:w-[68%]" />
              )}
              <aside className="lg:flex-1 space-y-4 sm:space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <RoundChip round={round} />
                  {canCompare && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      aria-pressed={comparing}
                      onClick={() => setComparing((c) => !c)}
                    >
                      <GitCompare className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      {comparing ? 'Show current only' : 'Compare to previous'}
                    </Button>
                  )}
                </div>
                {view.data.asset.submission_note && (
                  <section className="rounded-[10px] border border-border bg-card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Note from the team
                    </p>
                    <p className="mt-1.5 text-sm text-foreground whitespace-pre-line">
                      {view.data.asset.submission_note}
                    </p>
                  </section>
                )}
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    data-testid="guest-decide-eyebrow"
                  >
                    Needs your decision — recorded for the audit trail
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Brand Guardian flags palette and voice issues beside the creative. It guides — you still
                    make the call.
                  </p>
                </div>
                <OnBrandCheckPanel asset={view.data.asset} kit={view.data.brand_kit ?? 'none'} />
                <details className="group rounded-[10px] border border-border bg-card p-4">
                  <summary className="cursor-pointer list-none text-sm font-medium text-foreground flex items-center justify-between">
                    The brief
                    <span className="text-xs text-muted-foreground group-open:hidden">Show</span>
                    <span className="text-xs text-muted-foreground hidden group-open:inline">Hide</span>
                  </summary>
                  <dl className="mt-3 space-y-3 text-sm">
                    {view.data.campaign.brief.key_message && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Key message</dt>
                        <dd className="text-foreground">{view.data.campaign.brief.key_message}</dd>
                      </div>
                    )}
                    {view.data.campaign.brief.objective && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Objective</dt>
                        <dd className="text-foreground">{view.data.campaign.brief.objective}</dd>
                      </div>
                    )}
                    {view.data.campaign.brief.audience && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Audience</dt>
                        <dd className="text-foreground">{view.data.campaign.brief.audience}</dd>
                      </div>
                    )}
                    {view.data.campaign.brief.channels.length > 0 && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Channels</dt>
                        <dd className="text-foreground">{view.data.campaign.brief.channels.join(', ')}</dd>
                      </div>
                    )}
                  </dl>
                </details>
                <p className="text-xs text-muted-foreground">
                  Link works until{' '}
                  {new Date(view.data.link.expires_at).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'long',
                  })}
                  .
                </p>
              </aside>
            </div>
          </main>

          <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 safe-area-pb">
            <div className="mx-auto max-w-[1400px] px-3 py-3 sm:px-4 md:px-8">
              <DecideActions onAction={setPendingAction} disabled={submitting} />
            </div>
          </div>

          <GuestDecisionDialog
            action={pendingAction}
            onOpenChange={(open) => {
              if (!open) {
                setPendingAction(null)
                setSubmitError(null)
              }
            }}
            onConfirm={handleConfirm}
            isSubmitting={submitting}
            error={submitError}
            defaultName={view.data.link.recipient_name}
          />
        </>
      )}
    </div>
  )
}
