import { alphaOver } from './color'
import {
  FONT_STACKS,
  NEUTRAL_COLORS,
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  type PrimaryColor,
  type SecondaryColor,
} from './tokens'

export const THEME_CSS_PATH = 'src/styles/jigi-theme.css'

const LIGHT_ALPHA_BASE = '#FFFFFF'
const DARK_ALPHA_BASE = '#121113'

export function kebab(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}

function scaleVars(color: PrimaryColor, mode: 'light' | 'dark'): string[] {
  const scale = color[mode]
  const base = mode === 'light' ? LIGHT_ALPHA_BASE : DARK_ALPHA_BASE
  const radix = color.radixColor
  const lines: string[] = []
  scale.forEach((hex, i) => lines.push(`  --${color.key}-${i + 1}: ${hex};`))
  scale.forEach((_, i) => lines.push(`  --${radix}-${i + 1}: var(--${color.key}-${i + 1});`))
  scale.forEach((hex, i) => lines.push(`  --${radix}-a${i + 1}: ${alphaOver(hex, base)};`))
  lines.push(`  --${radix}-contrast: #FFFFFF;`)
  lines.push(`  --${radix}-surface: color-mix(in srgb, var(--${color.key}-2) ${mode === 'light' ? 80 : 50}%, transparent);`)
  lines.push(`  --${radix}-indicator: var(--${radix}-9);`)
  lines.push(`  --${radix}-track: var(--${radix}-9);`)
  return lines
}

function secondaryVars(color: SecondaryColor, mode: 'light' | 'dark'): string[] {
  const name = kebab(color.key)
  return [
    `  --jigi-${name}: ${color.solid};`,
    `  --jigi-${name}-soft: ${mode === 'light' ? color.soft : color.softDark};`,
    `  --jigi-${name}-text: ${mode === 'light' ? color.text : color.textDark};`,
  ]
}

function modeBlock(selector: string, mode: 'light' | 'dark'): string {
  const lines = [
    ...PRIMARY_COLORS.flatMap((c) => scaleVars(c, mode)),
    ...SECONDARY_COLORS.flatMap((c) => secondaryVars(c, mode)),
    ...NEUTRAL_COLORS.map((n) => `  --jigi-${n.key}: ${mode === 'light' ? n.hex : n.darkHex};`),
  ]
  return `${selector} {\n${lines.join('\n')}\n}`
}

function tailwindBlock(): string {
  const lines: string[] = [
    `  --font-display: ${FONT_STACKS.display};`,
    ...PRIMARY_COLORS.flatMap((c) => c.light.map((_, i) => `  --color-${c.key}-${i + 1}: var(--${c.key}-${i + 1});`)),
    ...SECONDARY_COLORS.flatMap((c) => {
      const name = kebab(c.key)
      return [
        `  --color-${name}: var(--jigi-${name});`,
        `  --color-${name}-soft: var(--jigi-${name}-soft);`,
        `  --color-${name}-text: var(--jigi-${name}-text);`,
      ]
    }),
    ...NEUTRAL_COLORS.map((n) => `  --color-${n.key}: var(--jigi-${n.key});`),
  ]
  return `@theme inline {\n${lines.join('\n')}\n}`
}

function radixFontsBlock(): string {
  return [
    '.radix-themes {',
    `  --default-font-family: ${FONT_STACKS.sans};`,
    `  --heading-font-family: ${FONT_STACKS.sans};`,
    `  --code-font-family: ${FONT_STACKS.mono};`,
    '}',
  ].join('\n')
}

/** Renders the full theme stylesheet. Pure, so the drift test can compare it to the file on disk. */
export function renderThemeCss(): string {
  return [
    '/* GENERATED from src/design-system/tokens.ts by `pnpm theme:build` — do not edit by hand. */',
    '',
    modeBlock(':root, .light, .light-theme', 'light'),
    '',
    modeBlock('.dark, .dark-theme', 'dark'),
    '',
    radixFontsBlock(),
    '',
    tailwindBlock(),
    '',
  ].join('\n')
}
