const loadedFonts = new Set<string>()

function normalizeFontFamily(fontName: string): string {
  return fontName.trim().replace(/\s+/g, '+')
}

export function loadGoogleFont(fontName?: string | null) {
  if (!fontName) return

  const trimmed = fontName.trim()
  if (!trimmed || loadedFonts.has(trimmed) || typeof document === 'undefined') {
    return
  }

  const family = normalizeFontFamily(trimmed)
  const href = `https://fonts.googleapis.com/css2?family=${family}:wght@400;500;600;700&display=swap`

  const existing = document.querySelector<HTMLLinkElement>(`link[data-google-font="${trimmed}"]`)
  if (existing) {
    loadedFonts.add(trimmed)
    return
  }

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.setAttribute('data-google-font', trimmed)
  document.head.appendChild(link)
  loadedFonts.add(trimmed)
}

