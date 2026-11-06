import { Checkbox, SegmentedControl, Select, Switch, TextArea, TextField } from '@radix-ui/themes'
import { CheckCircle2, ImageIcon, Info, Lightbulb, Sparkles, TriangleAlert, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Button,
  Callout,
  DISPLAY_MIN_PX,
  Eyebrow,
  JOURNEY_COLORS,
  JourneyBadge,
  NEUTRAL_COLORS,
  PageTitle,
  Panel,
  PRIMARY_COLORS,
  SCALE_STEP_USES,
  SECONDARY_COLORS,
  SectionTitle,
  TONE_COLORS,
  TYPE_SCALE,
  ToneBadge,
  contrastRatio,
  type ToneColor,
} from '@/design-system'
import { humanStatusTone } from '@/lib/handoff'
import type { AssetStatus } from '@/lib/status'
import { STATUS_CONFIG } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const SECTIONS = [
  { id: 'colour', label: 'Colour' },
  { id: 'type', label: 'Typography' },
  { id: 'components', label: 'Components' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'rules', label: 'Do & don’t' },
] as const

const TONES: ToneColor[] = ['neutral', 'orchid', 'sage', 'plum', 'forest', 'clay', 'honey', 'dusk', 'brick', 'coral']

function ratio(a: string, b: string) {
  return `${contrastRatio(a, b).toFixed(1)}:1`
}

function Section({ id, title, intro, children }: { id: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 space-y-6 border-t border-border pt-10">
      <div className="space-y-1">
        <h2 id={`${id}-title`} className="font-display text-xl font-normal tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{intro}</p>
      </div>
      {children}
    </section>
  )
}

function Hex({ children }: { children: string }) {
  return <code className="font-mono text-[0.6875rem] text-muted-foreground">{children}</code>
}

function PrimaryScales() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {PRIMARY_COLORS.map((c) => (
        <Panel key={c.key} className="space-y-4 p-5" data-testid={`primary-${c.key}`}>
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 shrink-0 rounded-lg" style={{ background: c.hex }} aria-hidden />
            <div className="min-w-0 space-y-1">
              <SectionTitle>{c.name}</SectionTitle>
              <Hex>{`${c.hex} · step 8 · Radix “${c.radixColor}”`}</Hex>
              <ul className="list-disc pl-4 text-sm text-foreground">
                {c.uses.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          </div>
          <ol className="grid grid-cols-12 overflow-hidden rounded-md border border-border" aria-label={`${c.name} scale`}>
            {c.light.map((hex, i) => (
              <li
                key={hex}
                title={`${c.key}-${i + 1} ${hex} — ${SCALE_STEP_USES[i]}`}
                className="flex h-12 items-end justify-center pb-1 text-[0.625rem] font-semibold"
                style={{ background: hex, color: i < 7 ? c.light[11] : '#FFFFFF' }}
              >
                {i + 1}
              </li>
            ))}
          </ol>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Step 9 (buttons) with white text</dt>
            <dd className="text-right font-mono">{ratio(c.light[8], '#FFFFFF')}</dd>
            <dt className="text-muted-foreground">Step 11 (text) on step 2</dt>
            <dd className="text-right font-mono">{ratio(c.light[10], c.light[1])}</dd>
          </dl>
        </Panel>
      ))}
      <Panel elevation="flat" className="p-5 lg:col-span-2">
        <Eyebrow className="mb-3">What each step is for</Eyebrow>
        <ol className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {SCALE_STEP_USES.map((use, i) => (
            <li key={use} className="flex gap-2">
              <span className="w-6 font-mono text-muted-foreground">{i + 1}</span>
              {use}
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  )
}

function SecondaryGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {SECONDARY_COLORS.map((c) => (
        <Panel key={c.key} elevation="flat" className="overflow-hidden p-0" data-testid={`secondary-${c.key}`}>
          <div className="flex h-16">
            <div className="flex-1" style={{ background: c.solid }} aria-hidden />
            <div className="flex flex-1 items-center justify-center text-sm font-semibold" style={{ background: c.soft, color: c.text }}>
              Aa text
            </div>
          </div>
          <div className="space-y-2 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold">{c.name}</p>
              <Hex>{c.solid}</Hex>
            </div>
            <ul className="space-y-0.5 text-sm text-muted-foreground">
              {c.uses.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Soft <Hex>{c.soft}</Hex> · Text <Hex>{c.text}</Hex> · {ratio(c.text, c.soft)}
            </p>
          </div>
        </Panel>
      ))}
    </div>
  )
}

function NeutralRow() {
  return (
    <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {NEUTRAL_COLORS.map((n) => (
        <div key={n.key} className="space-y-2" data-testid={`neutral-${n.key}`}>
          <div className="flex h-16 overflow-hidden rounded-lg border border-border">
            <div className="flex-1" style={{ background: n.hex }} aria-hidden />
            <div className="w-1/3" style={{ background: n.darkHex }} aria-hidden title="Dark mode" />
          </div>
          <p className="text-sm font-semibold">{n.name}</p>
          <Hex>{`${n.hex} / ${n.darkHex}`}</Hex>
          <p className="text-xs text-muted-foreground">{n.uses.join(' · ')}</p>
        </div>
      ))}
    </div>
  )
}

const STATUSES = Object.keys(STATUS_CONFIG) as AssetStatus[]

function SemanticMap() {
  return (
    <Panel elevation="flat" className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            {['State', 'Creator sees', 'Client sees', 'Colour'].map((h) => (
              <th key={h} className="px-4 py-2">
                <Eyebrow>{h}</Eyebrow>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STATUSES.map((s) => (
            <tr key={s} className="border-b border-border last:border-0">
              <td className="px-4 py-2 font-mono text-xs">{s}</td>
              <td className="px-4 py-2">
                <StatusBadge status={s} />
              </td>
              <td className="px-4 py-2">
                <StatusBadge status={s} audience="client" />
              </td>
              <td className="px-4 py-2 capitalize text-muted-foreground">{TONE_COLORS[humanStatusTone(s)]}</td>
            </tr>
          ))}
          {(Object.keys(JOURNEY_COLORS) as (keyof typeof JOURNEY_COLORS)[]).map((j) => (
            <tr key={j} className="border-b border-border last:border-0">
              <td className="px-4 py-2 font-mono text-xs">{j}</td>
              <td className="px-4 py-2" colSpan={2}>
                <JourneyBadge journey={j} />
              </td>
              <td className="px-4 py-2 capitalize text-muted-foreground">{JOURNEY_COLORS[j]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  )
}

function TypeScale() {
  return (
    <Panel elevation="flat" className="divide-y divide-border p-0">
      {TYPE_SCALE.map((t) => (
        <div key={t.token} className="grid gap-2 px-5 py-4 sm:grid-cols-[10rem_1fr] sm:items-baseline">
          <div className="space-y-0.5">
            <p className="font-mono text-xs">{t.token}</p>
            <p className="text-xs text-muted-foreground">
              {t.size} · {t.font === 'display' ? 'Krona One' : 'Source Sans 3'} {t.weight}
            </p>
          </div>
          <p
            className={cn(
              'truncate text-foreground',
              t.font === 'display' ? 'font-display tracking-[-0.02em]' : 'font-sans',
              t.token === 'text-label' && 'uppercase tracking-[0.08em]'
            )}
            style={{ fontSize: t.size, fontWeight: t.weight }}
          >
            {t.use}
          </p>
        </div>
      ))}
      <div className="px-5 py-4 text-sm text-muted-foreground">
        Krona One is single-weight and wide: use it at {DISPLAY_MIN_PX}px and above, never bold, never in tables,
        buttons or form labels. Prompts and logs use <span className="font-mono">Geist Mono</span>.
      </div>
    </Panel>
  )
}

function ComponentsShowcase() {
  return (
    <div className="space-y-6">
      <Panel className="space-y-4 p-5">
        <Eyebrow>Buttons</Eyebrow>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Generate</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="outline">Remix</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Delete</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">
            <Sparkles className="h-4 w-4" aria-hidden /> Large with icon
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          One primary button per view. Orchid is the only action colour; destructive actions use Brick and confirm first.
        </p>
      </Panel>

      <Panel className="space-y-4 p-5">
        <Eyebrow>Tone badges</Eyebrow>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <ToneBadge key={t} tone={t} dot>
              {t}
            </ToneBadge>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Callout intent="info" icon={<Info className="h-4 w-4" />} title="Tip">
          Presets keep tier, aspect and style together.
        </Callout>
        <Callout intent="success" icon={<CheckCircle2 className="h-4 w-4" />} title="Approved">
          The client approved 3 assets.
        </Callout>
        <Callout intent="warning" icon={<TriangleAlert className="h-4 w-4" />} title="Waiting on client">
          Nudge sent 2 days ago.
        </Callout>
        <Callout intent="danger" icon={<XCircle className="h-4 w-4" />} title="Generation failed">
          Every route is out of quota. Try again shortly.
        </Callout>
        <Callout intent="brand" icon={<Sparkles className="h-4 w-4" />} title="On brand">
          Uses the Acme palette and tone of voice.
        </Callout>
        <Callout intent="idea" icon={<Lightbulb className="h-4 w-4" />} title="Seed idea">
          “Linen summer drop, sunlit and unhurried.”
        </Callout>
      </div>

      <Panel className="grid gap-4 p-5 md:grid-cols-2">
        <Eyebrow className="md:col-span-2">Form controls (Radix Themes)</Eyebrow>
        <label className="space-y-1.5">
          <Eyebrow>Campaign name</Eyebrow>
          <TextField.Root placeholder="Summer linen drop" />
        </label>
        <label className="space-y-1.5">
          <Eyebrow>Channel</Eyebrow>
          <Select.Root defaultValue="instagram">
            <Select.Trigger className="w-full" />
            <Select.Content>
              <Select.Item value="instagram">Instagram feed</Select.Item>
              <Select.Item value="linkedin">LinkedIn</Select.Item>
              <Select.Item value="display">Display banner</Select.Item>
            </Select.Content>
          </Select.Root>
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <Eyebrow>Prompt</Eyebrow>
          <TextArea placeholder="Describe the image…" className="font-mono" />
        </label>
        <div className="flex flex-wrap items-center gap-6 md:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch defaultChecked /> Use brand preset
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked /> Notify client
          </label>
          <SegmentedControl.Root defaultValue="refine">
            <SegmentedControl.Item value="draft">Draft</SegmentedControl.Item>
            <SegmentedControl.Item value="refine">Refine</SegmentedControl.Item>
            <SegmentedControl.Item value="final">Final</SegmentedControl.Item>
          </SegmentedControl.Root>
        </div>
      </Panel>
    </div>
  )
}

function PatternsShowcase() {
  return (
    <div className="space-y-6">
      <Panel elevation="flat" className="space-y-3 p-5">
        <Eyebrow>Page header</Eyebrow>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Eyebrow>Campaign</Eyebrow>
            <PageTitle>Summer linen drop</PageTitle>
            <div className="flex gap-2">
              <JourneyBadge journey="idea_first" />
              <StatusBadge status="brand_review" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">Share</Button>
            <Button>Generate</Button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {(['approved', 'changes_requested', 'submitted'] as const).map((status) => (
          <Panel key={status} className="overflow-hidden p-0" data-testid={`pattern-asset-${status}`}>
            <div className="flex aspect-[4/5] items-center justify-center bg-orchid-2 text-orchid-8">
              <ImageIcon className="h-10 w-10" aria-hidden />
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">Hero · Instagram 4:5</p>
                <StatusBadge status={status} />
              </div>
              <p className="text-xs text-muted-foreground">Refine · Seedream 4 · 2K</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Remix
                </Button>
                <Button size="sm" variant="ghost">
                  Download
                </Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Panel elevation="flat" className="p-0">
        <EmptyState
          icon={Sparkles}
          title="No creative yet"
          description="Describe what you need and Jigi drafts it on brand."
          action={{ label: 'Generate now', onClick: () => undefined }}
        />
      </Panel>
    </div>
  )
}

const RULES: { do: string; dont: string }[] = [
  { do: 'Use Orchid step 9 for the single primary action on a view.', dont: 'Use raw #A47DAB behind white text — it fails contrast.' },
  { do: 'Use Sage/Forest for approval and success only.', dont: 'Use Sage for buttons that are not confirmations.' },
  { do: 'Use Krona One for page and campaign titles at 20px+.', dont: 'Bold Krona One or use it in tables, buttons or labels.' },
  { do: 'Pick tone colours by meaning: Honey waits, Coral needs a fix, Brick stops.', dont: 'Use raw Tailwind palette classes (teal, amber, red …).' },
  { do: 'Import components from @/design-system.', dont: 'Hard-code hex values in className.' },
  { do: 'Let creative be the hero — neutral chrome around assets.', dont: 'Put gradients or saturated fills behind asset previews.' },
]

export function DesignSystem() {
  const role = useAuthStore((s) => s.profile?.role)
  if (!import.meta.env.DEV && role !== 'admin') return <Navigate to="/app/work" replace />

  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-24" data-testid="design-system-page">
      <header className="space-y-3">
        <Eyebrow>Jigi design patterns</Eyebrow>
        <PageTitle>Design system</PageTitle>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every colour, type style and component here is rendered from <code className="font-mono">src/design-system</code>.
          If it looks wrong here, it is wrong everywhere — fix the token, not the screen.
        </p>
        <nav aria-label="Sections" className="flex flex-wrap gap-2 pt-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:border-orchid-7 hover:text-orchid-11"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      <Section id="colour" title="Colour" intro="Two primaries from the brand, nine secondaries with fixed meanings, and mauve-tinted neutrals. All pairings are contrast-tested in CI.">
        <SectionTitle>Primary</SectionTitle>
        <PrimaryScales />
        <SectionTitle>Secondary</SectionTitle>
        <SecondaryGrid />
        <SectionTitle>Neutral</SectionTitle>
        <NeutralRow />
        <SectionTitle>States and journeys</SectionTitle>
        <SemanticMap />
      </Section>

      <Section id="type" title="Typography" intro="Krona One for display, Source Sans 3 for everything you read or click, Geist Mono for prompts.">
        <TypeScale />
      </Section>

      <Section id="components" title="Components" intro="Radix Themes components wrapped in @/design-system so screens never style them directly.">
        <ComponentsShowcase />
      </Section>

      <Section id="patterns" title="Patterns" intro="Recurring layouts built from the components above.">
        <PatternsShowcase />
      </Section>

      <Section id="rules" title="Do & don’t" intro="The short list reviewers check against.">
        <Panel elevation="flat" className="divide-y divide-border p-0">
          {RULES.map((r) => (
            <div key={r.do} className="grid gap-3 p-4 text-sm md:grid-cols-2">
              <p className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-text" aria-hidden /> {r.do}
              </p>
              <p className="flex gap-2 text-muted-foreground">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-brick-text" aria-hidden /> {r.dont}
              </p>
            </div>
          ))}
        </Panel>
      </Section>
    </div>
  )
}
