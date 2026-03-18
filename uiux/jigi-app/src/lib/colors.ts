export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  
  const { r, g, b } = rgb
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function getContrastColor(hex: string): string {
  return getLuminance(hex) > 0.5 ? '#000000' : '#ffffff'
}

export async function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl

    img.onload = async () => {
      try {
        const ColorThiefModule = await import('colorthief')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ColorThief = (ColorThiefModule as any).default || ColorThiefModule
        const colorThief = typeof ColorThief === 'function' ? new ColorThief() : ColorThief
        const palette = colorThief.getPalette(img, 6)
        const hexColors = palette.map(([r, g, b]: [number, number, number]) => rgbToHex(r, g, b))
        resolve(hexColors)
      } catch (error) {
        console.error('Color extraction error:', error)
        resolve(generateFallbackPalette())
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
  })
}

function generateFallbackPalette(): string[] {
  return ['#0D9488', '#6366F1', '#F59E0B', '#6B7280', '#EC4899', '#8B5CF6']
}

export function suggestColorRoles(colors: string[]): {
  primary: string
  secondary: string
  accent: string
  neutral: string
} {
  if (colors.length === 0) {
    return {
      primary: '#0D9488',
      secondary: '#6366F1',
      accent: '#F59E0B',
      neutral: '#6B7280',
    }
  }

  const sortedByLuminance = [...colors].sort(
    (a, b) => getLuminance(a) - getLuminance(b)
  )

  const midIndex = Math.floor(sortedByLuminance.length / 2)
  
  return {
    primary: colors[0] || '#0D9488',
    secondary: colors[1] || colors[0] || '#6366F1',
    accent: colors[2] || colors[0] || '#F59E0B',
    neutral: sortedByLuminance[midIndex] || '#6B7280',
  }
}
