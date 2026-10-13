import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { JigiTheme, NEUTRAL_COLORS, PRIMARY_COLORS, SECONDARY_COLORS } from '@/design-system'
import { useAuthStore } from '@/store/authStore'
import { DesignSystem } from './DesignSystem'

function renderPage() {
  return render(
    <JigiTheme>
      <MemoryRouter initialEntries={['/app/design-system']}>
        <Routes>
          <Route path="/app/design-system" element={<DesignSystem />} />
          <Route path="/app/work" element={<p>work page</p>} />
        </Routes>
      </MemoryRouter>
    </JigiTheme>
  )
}

describe('DesignSystem page', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    useAuthStore.setState({ profile: null })
  })

  it('renders every token from tokens.ts', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Design system' })).toBeInTheDocument()
    for (const c of PRIMARY_COLORS) expect(screen.getByTestId(`primary-${c.key}`)).toBeInTheDocument()
    for (const c of SECONDARY_COLORS) expect(screen.getByTestId(`secondary-${c.key}`)).toBeInTheDocument()
    for (const n of NEUTRAL_COLORS) expect(screen.getByTestId(`neutral-${n.key}`)).toBeInTheDocument()
  })

  it('has the five library sections', () => {
    renderPage()
    for (const name of ['Colour', 'Typography', 'Components', 'Patterns', 'Do & don’t']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
  })

  it('redirects non-admins outside dev', () => {
    vi.stubEnv('DEV', false)
    useAuthStore.setState({ profile: { role: 'creator' } as never })
    renderPage()
    expect(screen.getByText('work page')).toBeInTheDocument()
  })

  it('admins can open it outside dev', () => {
    vi.stubEnv('DEV', false)
    useAuthStore.setState({ profile: { role: 'admin' } as never })
    renderPage()
    expect(screen.getByTestId('design-system-page')).toBeInTheDocument()
  })
})
