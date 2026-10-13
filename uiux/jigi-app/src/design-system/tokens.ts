/**
 * Jigi design tokens — the single source of truth for colour and type.
 *
 * `src/styles/jigi-theme.css` is generated from this file (`pnpm theme:build`);
 * `tokens.test.ts` fails if the two drift or if any pairing loses contrast.
 */

export type Scale = readonly [string, string, string, string, string, string, string, string, string, string, string, string]

/** What each step of a 12-step scale is for (Radix convention). */
export const SCALE_STEP_USES = [
  'App background tint',
  'Subtle background',
  'Element background',
  'Hovered element background',
  'Active / selected background',
  'Subtle borders',
  'Element borders, focus rings',
  'Identity colour, strong borders',
  'Solid fills — buttons, active nav',
  'Hovered solid fills',
  'Low-contrast text, links',
  'High-contrast text',
] as const

export interface PrimaryColor {
  key: 'orchid' | 'sage'
  name: string
  /** The brand hex as supplied — always step 8 of the scale. */
  hex: string
  /** Radix palette this scale replaces, so Radix components pick it up. */
  radixColor: 'iris' | 'green'
  light: Scale
  dark: Scale
  uses: readonly string[]
}

export const ORCHID: PrimaryColor = {
  key: 'orchid',
  name: 'Orchid',
  hex: '#A47DAB',
  radixColor: 'iris',
  light: ['#FDFCFE', '#FBF7FB', '#F5EEF6', '#EFE4F1', '#E9DAEB', '#E1CDE4', '#D6BBDB', '#A47DAB', '#835D8A', '#78537F', '#6E4D73', '#37273A'],
  dark: ['#151115', '#1B161C', '#2B212D', '#372939', '#433345', '#503D53', '#624C66', '#806385', '#835D8A', '#906A97', '#D0B1D6', '#F0E3F2'],
  uses: [
    'Primary actions (solid buttons use step 9)',
    'Active navigation and selected tabs',
    'Focus rings and links',
    'Brand-first journey cues',
  ],
}

export const SAGE: PrimaryColor = {
  key: 'sage',
  name: 'Sage',
  hex: '#84AB7D',
  radixColor: 'green',
  light: ['#FBFDFB', '#F7FAF6', '#ECF3EB', '#E1ECDF', '#D6E5D4', '#C9DBC5', '#B4CFAF', '#84AB7D', '#54794D', '#4A6E43', '#44653F', '#233320'],
  dark: ['#101410', '#151A14', '#1F281D', '#263324', '#2F3E2C', '#394B35', '#475C43', '#5B7856', '#54794D', '#61865A', '#AAC8A4', '#E0ECDD'],
  uses: [
    'Approval and success paths',
    '“On brand” signals and positive confirmations',
    'Secondary brand moments alongside Orchid',
  ],
}

export const PRIMARY_COLORS = [ORCHID, SAGE] as const

export type SecondaryKey =
  | 'plum'
  | 'lavender'
  | 'forest'
  | 'sageMist'
  | 'clay'
  | 'honey'
  | 'dusk'
  | 'brick'
  | 'coral'

export interface SecondaryColor {
  key: SecondaryKey
  name: string
  /** Swatch / fill colour. */
  solid: string
  /** Tinted background for badges, banners and callouts. */
  soft: string
  /** Text and icons placed on `soft`. */
  text: string
  softDark: string
  textDark: string
  uses: readonly string[]
}

export const SECONDARY_COLORS: readonly SecondaryColor[] = [
  {
    key: 'plum', name: 'Plum', solid: '#5E3D66', soft: '#F5EDF8', text: '#684770', softDark: '#2F2531', textDark: '#D5BEDB',
    uses: ['Deep accent for display moments', 'Dark studio surfaces', 'Selected navigation on dark'],
  },
  {
    key: 'lavender', name: 'Lavender mist', solid: '#EFE4F1', soft: '#FBF7FB', text: '#6E4D73', softDark: '#322334', textDark: '#DCBAE2',
    uses: ['Selected rows and cards', 'Brand callouts and Orchid-tinted panels'],
  },
  {
    key: 'forest', name: 'Forest', solid: '#3F6B3A', soft: '#E9F4E7', text: '#366231', softDark: '#202D1E', textDark: '#B4D1B0',
    uses: ['Approved status', 'Success icons and confirmation text'],
  },
  {
    key: 'sageMist', name: 'Sage mist', solid: '#E1ECDF', soft: '#F7FAF6', text: '#44653F', softDark: '#202D1E', textDark: '#B5D1B0',
    uses: ['Success and approved backgrounds', 'On-brand check panels'],
  },
  {
    key: 'clay', name: 'Clay', solid: '#C47A5A', soft: '#FEECE4', text: '#833F20', softDark: '#38231A', textDark: '#EBBBA7',
    uses: ['Idea-first journey', 'Seed-idea callouts'],
  },
  {
    key: 'honey', name: 'Honey', solid: '#D4A03F', soft: '#FAEFDC', text: '#794A00', softDark: '#34260D', textDark: '#E2C28F',
    uses: ['Waiting on client / pending review', 'Warnings and nudges'],
  },
  {
    key: 'dusk', name: 'Dusk', solid: '#6B7FB0', soft: '#EBF0FC', text: '#415381', softDark: '#232937', textDark: '#B9C7E7',
    uses: ['Information banners and tips', 'Links in long-form text', 'Neutral data-viz series'],
  },
  {
    key: 'brick', name: 'Brick', solid: '#B04A5A', soft: '#FFE9EA', text: '#902D40', softDark: '#3D1F22', textDark: '#F7B2B8',
    uses: ['Rejected / declined status', 'Destructive actions and errors'],
  },
  {
    key: 'coral', name: 'Coral', solid: '#D9826B', soft: '#FFEBE5', text: '#883A25', softDark: '#3A221B', textDark: '#F0B8A9',
    uses: ['Changes requested (“Fix & resend”)', 'Attention states that are not errors'],
  },
]

export interface NeutralColor {
  key: 'paper' | 'surface' | 'mist' | 'line' | 'pewter' | 'slate' | 'ink'
  name: string
  hex: string
  darkHex: string
  /** Radix mauve step this mirrors, if any. */
  radixStep: number | null
  /** Dark-mode Radix step when it differs from `radixStep`. */
  radixDarkStep?: number
  uses: readonly string[]
}

/** Neutrals follow Radix `mauve`, so greys sit naturally beside Orchid. */
export const NEUTRAL_COLORS: readonly NeutralColor[] = [
  { key: 'paper', name: 'Paper', hex: '#FAF9FB', darkHex: '#121113', radixStep: 2, radixDarkStep: 1, uses: ['App canvas'] },
  { key: 'surface', name: 'Surface', hex: '#FFFFFF', darkHex: '#1A191B', radixStep: null, uses: ['Cards, dialogs, popovers'] },
  { key: 'mist', name: 'Mist', hex: '#F2EFF3', darkHex: '#232225', radixStep: 3, uses: ['Muted panels', 'Input and secondary button backgrounds'] },
  { key: 'line', name: 'Line', hex: '#DBD8E0', darkHex: '#3C393F', radixStep: 6, uses: ['Borders, dividers, input outlines'] },
  { key: 'pewter', name: 'Pewter', hex: '#84828E', darkHex: '#7C7A85', radixStep: 10, uses: ['Disabled text and icons', 'Decorative strokes'] },
  { key: 'slate', name: 'Slate', hex: '#65636D', darkHex: '#B5B2BC', radixStep: 11, uses: ['Secondary text, captions, metadata'] },
  { key: 'ink', name: 'Ink', hex: '#211F26', darkHex: '#EEEEF0', radixStep: 12, uses: ['Primary text and headings'] },
]

/** Review tone → colour. Tones come from `src/lib/handoff/human-status.ts`. */
export const TONE_COLORS = {
  muted: 'neutral',
  primary: 'orchid',
  pending: 'honey',
  warning: 'coral',
  success: 'forest',
  destructive: 'brick',
} as const satisfies Record<string, 'neutral' | 'orchid' | SecondaryKey>

export const JOURNEY_COLORS = {
  brand_first: 'orchid',
  idea_first: 'clay',
} as const

export const FONT_STACKS = {
  display: "'Krona One', 'Source Sans 3', system-ui, sans-serif",
  sans: "'Source Sans 3', 'Source Sans 3 Fallback', system-ui, sans-serif",
  mono: "'Geist Mono', 'Geist Mono Fallback', monospace",
} as const

export interface TypeToken {
  token: string
  size: string
  font: keyof typeof FONT_STACKS
  weight: number
  use: string
}

/** Krona One is single-weight and very wide: display roles at ≥20px only. */
export const TYPE_SCALE: readonly TypeToken[] = [
  { token: 'text-display', size: '2.25rem', font: 'display', weight: 400, use: 'Landing hero, campaign title' },
  { token: 'text-h1', size: '1.5rem', font: 'display', weight: 400, use: 'Page titles' },
  { token: 'text-h2', size: '1.125rem', font: 'sans', weight: 600, use: 'Section headers' },
  { token: 'text-body', size: '0.875rem', font: 'sans', weight: 400, use: 'Default body' },
  { token: 'text-small', size: '0.75rem', font: 'sans', weight: 500, use: 'Meta, timestamps, badges' },
  { token: 'text-label', size: '0.6875rem', font: 'sans', weight: 600, use: 'Form labels, table headers (uppercase)' },
]

export const DISPLAY_MIN_PX = 20

export function secondaryColor(key: SecondaryKey): SecondaryColor {
  const found = SECONDARY_COLORS.find((c) => c.key === key)
  if (!found) throw new Error(`Unknown secondary colour: ${key}`)
  return found
}

export function neutralColor(key: NeutralColor['key']): NeutralColor {
  const found = NEUTRAL_COLORS.find((c) => c.key === key)
  if (!found) throw new Error(`Unknown neutral colour: ${key}`)
  return found
}
