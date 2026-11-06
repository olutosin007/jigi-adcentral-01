import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { HANDOFF_TONE_CLASSES } from '@/lib/handoff/human-status'
import { alphaOver, contrastRatio, hexToRgb } from './color'
import { renderThemeCss, THEME_CSS_PATH } from './theme-css'
import {
  DISPLAY_MIN_PX,
  JOURNEY_COLORS,
  NEUTRAL_COLORS,
  ORCHID,
  PRIMARY_COLORS,
  SAGE,
  SECONDARY_COLORS,
  TONE_COLORS,
  TYPE_SCALE,
  neutralColor,
} from './tokens'

const AA = 4.5
const AAA = 7
const UI = 3
const HEX = /^#[0-9A-F]{6}$/
const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')

describe('primary colours', () => {
  it('anchor the supplied brand hexes at step 8', () => {
    expect(ORCHID.hex).toBe('#A47DAB')
    expect(SAGE.hex).toBe('#84AB7D')
    for (const c of PRIMARY_COLORS) expect(c.light[7]).toBe(c.hex)
  })

  it.each(PRIMARY_COLORS.map((c) => [c.name, c] as const))('%s scales are well-formed', (_, c) => {
    for (const hex of [...c.light, ...c.dark]) expect(hex).toMatch(HEX)
    expect(c.uses.length).toBeGreaterThan(0)
  })

  it.each(PRIMARY_COLORS.map((c) => [c.name, c] as const))('%s solid fill carries white text (AA)', (_, c) => {
    expect(contrastRatio(c.light[8], '#FFFFFF')).toBeGreaterThanOrEqual(AA)
    expect(contrastRatio(c.dark[8], '#FFFFFF')).toBeGreaterThanOrEqual(AA)
  })

  it.each(PRIMARY_COLORS.map((c) => [c.name, c] as const))('%s text steps read on its own backgrounds', (_, c) => {
    for (const mode of ['light', 'dark'] as const) {
      const s = c[mode]
      for (const bg of [s[0], s[1], s[2]]) {
        expect(contrastRatio(s[10], bg)).toBeGreaterThanOrEqual(AA)
        expect(contrastRatio(s[11], bg)).toBeGreaterThanOrEqual(AAA)
      }
    }
  })

  it('primary text steps read on the app canvas', () => {
    for (const c of PRIMARY_COLORS) {
      expect(contrastRatio(c.light[10], neutralColor('paper').hex)).toBeGreaterThanOrEqual(AA)
      expect(contrastRatio(c.dark[10], neutralColor('paper').darkHex)).toBeGreaterThanOrEqual(AA)
    }
  })
})

describe('secondary colours', () => {
  it('has at least 8, each with a stated use', () => {
    expect(SECONDARY_COLORS.length).toBeGreaterThanOrEqual(8)
    for (const c of SECONDARY_COLORS) expect(c.uses.length).toBeGreaterThan(0)
    expect(new Set(SECONDARY_COLORS.map((c) => c.key)).size).toBe(SECONDARY_COLORS.length)
  })

  it.each(SECONDARY_COLORS.map((c) => [c.name, c] as const))('%s text is AA on its soft tint in both modes', (_, c) => {
    for (const hex of [c.solid, c.soft, c.text, c.softDark, c.textDark]) expect(hex).toMatch(HEX)
    expect(contrastRatio(c.text, c.soft)).toBeGreaterThanOrEqual(AA)
    expect(contrastRatio(c.text, neutralColor('surface').hex)).toBeGreaterThanOrEqual(AA)
    expect(contrastRatio(c.textDark, c.softDark)).toBeGreaterThanOrEqual(AA)
    expect(contrastRatio(c.textDark, neutralColor('surface').darkHex)).toBeGreaterThanOrEqual(AA)
  })

  it('brick (destructive) can carry white button text', () => {
    const brick = SECONDARY_COLORS.find((c) => c.key === 'brick')!
    expect(contrastRatio(brick.solid, '#FFFFFF')).toBeGreaterThanOrEqual(AA)
  })
})

describe('neutral colours', () => {
  it('has at least 4, each with a stated use', () => {
    expect(NEUTRAL_COLORS.length).toBeGreaterThanOrEqual(4)
    for (const n of NEUTRAL_COLORS) {
      expect(n.hex).toMatch(HEX)
      expect(n.darkHex).toMatch(HEX)
      expect(n.uses.length).toBeGreaterThan(0)
    }
  })

  it('text neutrals meet contrast on every surface neutral, light and dark', () => {
    const surfaces = (['paper', 'surface', 'mist'] as const).map(neutralColor)
    for (const s of surfaces) {
      expect(contrastRatio(neutralColor('ink').hex, s.hex)).toBeGreaterThanOrEqual(AAA)
      expect(contrastRatio(neutralColor('slate').hex, s.hex)).toBeGreaterThanOrEqual(AA)
      expect(contrastRatio(neutralColor('pewter').hex, s.hex)).toBeGreaterThanOrEqual(UI)
      expect(contrastRatio(neutralColor('ink').darkHex, s.darkHex)).toBeGreaterThanOrEqual(AAA)
      expect(contrastRatio(neutralColor('slate').darkHex, s.darkHex)).toBeGreaterThanOrEqual(AA)
    }
  })

  it('mirror the installed Radix mauve scale (guards Radix upgrades)', () => {
    const radix = read('node_modules/@radix-ui/themes/styles.css')
    const light = radix.slice(radix.indexOf(':root, .light, .light-theme'))
    const dark = radix.slice(radix.indexOf('.dark, .dark-theme'))
    for (const n of NEUTRAL_COLORS) {
      if (n.radixStep === null) continue
      const pattern = new RegExp(`--mauve-${n.radixStep}: (#[0-9a-f]{6});`, 'i')
      expect(light.match(pattern)?.[1].toUpperCase()).toBe(n.hex)
      const darkPattern = new RegExp(`--mauve-${n.radixDarkStep ?? n.radixStep}: (#[0-9a-f]{6});`, 'i')
      expect(dark.match(darkPattern)?.[1].toUpperCase()).toBe(n.darkHex)
    }
  })
})

describe('semantic mappings', () => {
  it('every review tone has a colour', () => {
    expect(Object.keys(TONE_COLORS).sort()).toEqual(Object.keys(HANDOFF_TONE_CLASSES).sort())
  })

  it('journeys stay visually distinct', () => {
    expect(JOURNEY_COLORS.brand_first).not.toBe(JOURNEY_COLORS.idea_first)
  })

  it('Honey is pending; Clay is idea-first', () => {
    expect(TONE_COLORS.pending).toBe('honey')
    expect(JOURNEY_COLORS.idea_first).toBe('clay')
    expect(HANDOFF_TONE_CLASSES.pending).toContain('honey')
  })

  it('Krona One is only used at display sizes', () => {
    for (const t of TYPE_SCALE.filter((t) => t.font === 'display')) {
      expect(parseFloat(t.size) * 16).toBeGreaterThanOrEqual(DISPLAY_MIN_PX)
    }
  })
})

describe('alphaOver', () => {
  it.each([
    ['#835D8A', '#FFFFFF'],
    ['#F5EEF6', '#FFFFFF'],
    ['#D0B1D6', '#121113'],
    ['#151115', '#121113'],
  ])('%s over %s composites back to the solid', (solid, bg) => {
    const out = alphaOver(solid, bg)
    const a = parseInt(out.slice(7, 9), 16) / 255
    const fg = hexToRgb(out.slice(0, 7))
    const base = hexToRgb(bg)
    const composite = fg.map((c, i) => Math.round(c * a + base[i] * (1 - a)))
    hexToRgb(solid).forEach((c, i) => expect(Math.abs(c - composite[i])).toBeLessThanOrEqual(1))
  })
})

describe('generated stylesheet', () => {
  it('jigi-theme.css is in sync with tokens.ts (run `pnpm theme:build`)', () => {
    expect(read(THEME_CSS_PATH)).toBe(renderThemeCss())
  })

  it('globals.css aliases point at tokens, not raw hex', () => {
    const globals = read('src/styles/globals.css')
    const root = globals.slice(globals.indexOf(':root {'), globals.indexOf('}', globals.indexOf(':root {')))
    const raw = root.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []
    expect(raw.filter((h) => h.toUpperCase() !== '#FFFFFF')).toEqual([])
  })

  it('loads Radix Themes into a layer below Tailwind utilities', () => {
    const globals = read('src/styles/globals.css')
    expect(globals).toMatch(/@layer theme, base, radix, components, utilities;/)
    expect(globals).toMatch(/@import '@radix-ui\/themes\/styles\.css' layer\(radix\);/)
  })

  it('loads Krona One and no longer loads Fraunces', () => {
    const html = read('index.html')
    expect(html).toContain('family=Krona+One')
    expect(html).not.toContain('Fraunces')
  })
})
