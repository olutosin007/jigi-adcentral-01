import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

/** Marketing pages carry their own dark theme (landing-v2.css) and are migrated separately. */
const OUT_OF_SCOPE = [
  /^src\/design-system\//,
  /^src\/styles\//,
  /^src\/components\/landing(-v2)?\//,
  /^src\/pages\/Landing/,
  /\.test\.tsx?$/,
]

const HARD_CODED_COLOUR =
  /\b(?:teal|amber|emerald|cyan|green|red|yellow|orange|blue|purple|violet|indigo|sky|lime|rose|pink|fuchsia|slate|stone|zinc|gray|neutral)-\d{2,3}\b|-\[#[0-9a-fA-F]{3,8}\]|\bjigi-(?:teal|charcoal|stone|cream|muted|border|success|warning|error)/g

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.(tsx?|css)$/.test(name) ? [relative(ROOT, full)] : []
  })
}

const files = sourceFiles(SRC).filter((f) => !OUT_OF_SCOPE.some((re) => re.test(f)))
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8')

describe('design drift guards', () => {
  it('app code has no hard-coded colours — use tokens (orchid-*, sage-*, honey-soft …)', () => {
    const offenders = files.flatMap((f) => {
      const hits = read(f).match(HARD_CODED_COLOUR)
      return hits ? [`${f}: ${[...new Set(hits)].join(', ')}`] : []
    })
    expect(offenders).toEqual([])
  })

  it('app code uses font-display, not the retired font-serif', () => {
    expect(files.filter((f) => /\bfont-serif\b/.test(read(f)))).toEqual([])
  })

  it('Krona One is never bolded (single-weight font → faux bold)', () => {
    const offenders = files.filter((f) =>
      (read(f).match(/className=["'`{][^"'`]*/g) ?? []).some(
        (cls) => /\bfont-display\b/.test(cls) && /\bfont-(?:medium|semibold|bold|extrabold|black)\b/.test(cls)
      )
    )
    expect(offenders).toEqual([])
  })
})
