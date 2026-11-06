export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`Expected #RRGGBB, got ${hex}`)
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function channelToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(channelToLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.x contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Most transparent `#RRGGBBAA` that renders as `hex` over `background`.
 * Used for Radix alpha scales (`--iris-a1` …).
 */
export function alphaOver(hex: string, background: string): string {
  const fg = hexToRgb(hex)
  const bg = hexToRgb(background)
  let alpha = 0
  for (let i = 0; i < 3; i++) {
    const d = fg[i] - bg[i]
    if (d === 0) continue
    const limit = d > 0 ? 255 - bg[i] : bg[i]
    alpha = Math.max(alpha, Math.abs(d) / limit)
  }
  alpha = Math.min(1, Math.ceil(alpha * 255) / 255)
  if (alpha === 0) return `${background.toUpperCase()}00`
  const channels = fg.map((c, i) => Math.round(Math.min(255, Math.max(0, (c - bg[i] * (1 - alpha)) / alpha))))
  const toHex = (v: number) => v.toString(16).padStart(2, '0').toUpperCase()
  return `#${channels.map(toHex).join('')}${toHex(Math.round(alpha * 255))}`
}
