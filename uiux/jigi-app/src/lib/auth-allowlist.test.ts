import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isEmailAllowed, isAuthAllowlistEnabled } from './auth-allowlist'

describe('auth-allowlist', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AUTH_ALLOWLIST_ENABLED', 'false')
    vi.stubEnv('VITE_AUTH_ALLOWED_EMAILS', '')
    vi.stubEnv('VITE_AUTH_ALLOWED_DOMAINS', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows any email when allowlist disabled', () => {
    expect(isAuthAllowlistEnabled()).toBe(false)
    expect(isEmailAllowed('anyone@example.com')).toBe(true)
  })

  it('checks explicit emails and domains when enabled', () => {
    vi.stubEnv('VITE_AUTH_ALLOWLIST_ENABLED', 'true')
    vi.stubEnv('VITE_AUTH_ALLOWED_EMAILS', 'admin@jigi.com')
    vi.stubEnv('VITE_AUTH_ALLOWED_DOMAINS', 'neocept.com')

    expect(isEmailAllowed('admin@jigi.com')).toBe(true)
    expect(isEmailAllowed('creator@neocept.com')).toBe(true)
    expect(isEmailAllowed('stranger@gmail.com')).toBe(false)
  })
})
