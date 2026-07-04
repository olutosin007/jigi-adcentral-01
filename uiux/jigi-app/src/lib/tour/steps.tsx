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
      title: 'Your workspace',
      content: 'This is your navigation. Everything an agency creative needs — brands, campaigns, and approved assets — lives here.',
      selector: sel('sidebar-nav'),
      side: 'right',
      pointerPadding: 8,
      pointerRadius: 12,
      nextRoute: '/app/brands',
    },
    {
      icon: null,
      title: 'Start with a brand',
      content: 'Create or confirm the brand you are working for. Its colours, voice, and visual style ground every generation so results come back on-brand.',
      selector: sel('brand-create'),
      side: 'bottom',
      pointerPadding: 6,
      pointerRadius: 10,
      nextRoute: '/app/campaigns/new',
    },
    {
      icon: null,
      title: 'Write the brief',
      content: 'Describe the objective, audience, and channels. The brief drives the concept, copy, and image the AI produces.',
      selector: sel('brief-form'),
      side: 'right',
      pointerPadding: 8,
      pointerRadius: 12,
      // Jump to the seeded campaign's detail page where generation lives.
      ...(campaignId ? { nextRoute: `/app/campaigns/${campaignId}` } : {}),
    },
    {
      icon: null,
      title: 'Generate creative',
      content: 'Generate concepts, copy, and imagery here. Iterate freely — everything stays in draft until you submit.',
      selector: sel('generation-panel'),
      side: 'left',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: null,
      title: 'Check it is on-brand',
      content: 'Compliance and drift feedback tell you how well the output matches the brand before anyone reviews it.',
      selector: sel('compliance-panel'),
      side: 'top',
      pointerPadding: 6,
      pointerRadius: 10,
    },
    {
      icon: null,
      title: 'Submit for review',
      content: 'Happy with it? Submit to the brand for approval. Approvers are notified instantly.',
      selector: sel('submit-action'),
      side: 'top',
      pointerPadding: 6,
      pointerRadius: 10,
      nextRoute: '/app/approved',
    },
    {
      icon: null,
      title: 'Approved assets land here',
      content: 'Once a brand approves your work, it appears here ready to open and export.',
      selector: sel('approved-assets'),
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      icon: null,
      title: 'See the other side',
      content: 'That is the creative\u2019s journey. Switch to the Brand Approver view here to walk the review flow \u2014 we\u2019ll pick up that tour automatically.',
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
      title: 'Approve, request changes, or reject',
      content: 'Make the call. The creative is notified immediately, and every action is recorded for the audit trail.',
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
