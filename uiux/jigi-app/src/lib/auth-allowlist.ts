function parseCsv(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
}

export function isAuthAllowlistEnabled(): boolean {
  return import.meta.env.VITE_AUTH_ALLOWLIST_ENABLED === 'true'
}

function allowedEmails(): Set<string> {
  return new Set(parseCsv(import.meta.env.VITE_AUTH_ALLOWED_EMAILS))
}

function allowedDomains(): Set<string> {
  return new Set(parseCsv(import.meta.env.VITE_AUTH_ALLOWED_DOMAINS))
}

/** When allowlist is off, all emails are permitted (local dev). */
export function isEmailAllowed(email: string | undefined | null): boolean {
  if (!email?.trim()) return false
  if (!isAuthAllowlistEnabled()) return true

  const normalized = email.trim().toLowerCase()
  if (allowedEmails().has(normalized)) return true

  const domain = normalized.split('@')[1]
  if (!domain) return false
  return allowedDomains().has(domain)
}

export function authAllowlistDeniedMessage(): string {
  return 'Sign-in is invite-only. Use an approved email or contact your administrator.'
}
