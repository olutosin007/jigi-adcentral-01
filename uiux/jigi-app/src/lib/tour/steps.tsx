/**
 * Guided-tour step registries — the machine-readable twin of
 * docs/06-persona-flows/anchor-inventory.md.
 *
 * Each step targets a `data-tour="…"` anchor added in build step 2. Keep the
 * order and selectors in sync with the anchor inventory.
 *
 * ROUTING: `nextRoute` uses static routes where possible. Campaign- and
 * asset-scoped steps need a concrete `:id`, which is resolved at tour start by
 * `useTourLauncher` and injected here via `buildTourSteps`. When an id is
 * missing the step simply doesn't navigate and highlights whatever is on the
 * current page.
 */
import type { Step } from 'onborda-rrd'

export const TOURS = {
  creative: 'agency-creative',
  approver: 'brand-approver',
} as const

export type TourName = (typeof TOURS)[keyof typeof TOURS]

/** Selector for the demo "view as" handoff step (see ViewAsSwitcher). */
export const ROLE_SWITCH_SELECTOR = '[data-tour="role-switch"]'

const sel = (id: string) => `[data-tour="${id}"]`

export interface BuildTourOptions {
  /** Most-recent campaign, used to reach the campaign detail (generation) page. */
  campaignId?: string | null
  /** A review-queue asset, used to reach the asset review page. */
  assetId?: string | null
}

function creativeSteps({ campaignId }: BuildTourOptions): Step[] {
  return [
    {
      icon: null,
      title: 'Work — ship decisions',
      content:
        'Your jobs live here. Outcome: on-brand drafts, a Guest Decide link, and a client yes — same place. Use the checklist until you send your first Decide link.',
      selector: sel('work-home'),
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 12,
      nextRoute: '/app/generate',
    },
    {
      icon: null,
      title: 'Generate or go idea-first',
      content:
        'Describe what you want and generate now, or attach a brand kit whenever you are ready. Brand Guardian still gates before the client sees it.',
      selector: sel('sidebar-nav'),
      side: 'right',
      pointerPadding: 8,
      pointerRadius: 12,
      nextRoute: '/app/brands',
    },
    {
      icon: null,
      title: 'Brand guidelines (optional early)',
      content:
        'Put guidelines in once — colours and voice drive Brand Guardian. Idea-first users can defer this without blocking a Decide link.',
      selector: sel('brand-create'),
      side: 'bottom',
      pointerPadding: 6,
      pointerRadius: 10,
      nextRoute: '/app/campaigns/new',
    },
    {
      icon: null,
      title: 'Brief or campaign',
      content: 'Describe the objective, audience, and channels when you need a structured job — or skip straight from Generate now.',
      selector: sel('brief-form'),
      side: 'right',
      pointerPadding: 8,
      pointerRadius: 12,
      ...(campaignId ? { nextRoute: `/app/campaigns/${campaignId}` } : {}),
    },
    {
      icon: null,
      title: 'Produce a candidate',
      content: 'Generate or upload. Everything stays draft until you send for a decision.',
      selector: sel('generation-panel'),
      side: 'left',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: null,
      title: 'Brand Guardian',
      content:
        'Machine checks sit beside the asset — flag, fix, then decide. Soft-gate on submit: warn or confirm, never hard-block the API.',
      selector: sel('compliance-panel'),
      side: 'top',
      pointerPadding: 6,
      pointerRadius: 10,
    },
    {
      icon: null,
      title: 'Send a Decide link',
      content:
        'Submit, then copy the Guest Decide link. That link is the decision — not a Drive folder. Clients need no account.',
      selector: sel('submit-action'),
      side: 'top',
      pointerPadding: 6,
      pointerRadius: 10,
      nextRoute: '/app/approved',
    },
    {
      icon: null,
      title: 'Approved = the clear yes',
      content: 'When the client approves, the asset lands here with an audit trail you can prove.',
      selector: sel('approved-assets'),
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: null,
      title: 'Walk the client side',
      content:
        'Switch to Brand Approver to see Decide / review — or open a Guest Decide link yourself to practice.',
      selector: sel('role-switch'),
      side: 'bottom',
      pointerPadding: 6,
      pointerRadius: 10,
    },
  ]
}

function approverSteps({ assetId }: BuildTourOptions): Step[] {
  return [
    {
      icon: null,
      title: 'Where you work',
      content: 'As a brand approver, your day starts from notifications and the review queue in this navigation.',
      selector: sel('sidebar-nav'),
      side: 'right',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: null,
      title: 'Review alerts land here',
      content: 'When a creative submits work, you are notified here. Open the bell to jump straight into what needs a decision.',
      selector: sel('notification-bell'),
      side: 'bottom',
      pointerPadding: 6,
      pointerRadius: 10,
      nextRoute: '/app/review',
    },
    {
      icon: null,
      title: 'The review queue',
      content: 'Everything submitted for brand review shows up here. Open any item to inspect it.',
      selector: sel('review-queue'),
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 12,
      ...(assetId ? { nextRoute: `/app/review/${assetId}` } : {}),
    },
    {
      icon: null,
      title: 'Inspect the asset',
      content: 'See the creative at full fidelity, with the generation mode it was produced in.',
      selector: sel('asset-preview'),
      side: 'right',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: null,
      title: 'The context to decide',
      content: 'Brief, brand context, compliance, and full status history — everything you need to judge on-brand fit without hunting.',
      selector: sel('asset-details'),
      side: 'left',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: null,
      title: 'Discuss inline',
      content: 'Leave threaded comments for the creative when something needs a conversation rather than a hard decision.',
      selector: sel('comments-sidebar'),
      side: 'left',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: null,
      title: 'Yes with confidence',
      content:
        'Approve, request changes, or decline. Brand Guardian flags issues beside the creative — you still make the call. Every action is audited.',
      selector: sel('review-actions'),
      side: 'top',
      pointerPadding: 6,
      pointerRadius: 10,
    },
  ]
}

/** Build both persona tours, injecting resolved ids into the scoped steps. */
export function buildTourSteps(opts: BuildTourOptions = {}) {
  return [
    { tour: TOURS.creative, steps: creativeSteps(opts) },
    { tour: TOURS.approver, steps: approverSteps(opts) },
  ]
}
