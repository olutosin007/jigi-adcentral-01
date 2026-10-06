import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { GuestDecide } from './GuestDecide'

const TOKEN = 'a'.repeat(43)

const payload = {
  state: 'active',
  link: { expires_at: '2026-10-20T00:00:00Z', recipient_name: 'Ada', decided_at: null, decision: null, guest_name: null },
  asset: {
    id: 'a1',
    type: 'copy',
    status: 'brand_review',
    source: 'uploaded',
    content: { headline: 'Summer is here', body: 'Body copy', cta: 'Shop now' },
    version: 2,
    submission_note: 'Check the CTA',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  campaign: { name: 'Summer launch', brief: { objective: 'Sales', key_message: 'Fresh', audience: null, channels: ['Instagram'] } },
  brand: { name: 'Acme', logo_url: null, primary_colour: '#123456' },
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/r/${TOKEN}`]}>
      <Routes>
        <Route path="/r/:token" element={<GuestDecide />} />
      </Routes>
    </MemoryRouter>
  )
}

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response)
}

describe('GuestDecide', () => {
  const fetchMock = vi.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    localStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('renders brand-first, asset-first decide view', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(payload))
    renderPage()
    expect(await screen.findByText('Summer is here')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText(/Summer launch · Version 2/)).toBeInTheDocument()
    expect(screen.getByText('Check the CTA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument()
  })

  it('approves with prefilled name and shows confirmation', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(payload)).mockReturnValueOnce(jsonResponse({ state: 'decided' }))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /^approve$/i }))
    expect(screen.getByLabelText('Your name')).toHaveValue('Ada')
    const dialogApprove = screen.getAllByRole('button', { name: /^approve$/i }).at(-1)!
    fireEvent.click(dialogApprove)
    expect(await screen.findByRole('heading', { name: 'Approved' })).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toContain('action=review')
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({ action: 'approve', guest_name: 'Ada' })
  })

  it('shows the round and compares copy to the previous round', async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({ ...payload, round: 2, previous_content: { headline: 'Spring is here', body: 'Body copy' } })
    )
    renderPage()
    expect(await screen.findByTestId('round-chip')).toHaveTextContent('Round 2 · Needs your decision')
    fireEvent.click(screen.getByRole('button', { name: /compare to previous/i }))
    const compare = screen.getByTestId('compare-fields')
    expect(compare).toHaveTextContent('Spring is here')
    expect(compare).toHaveTextContent('Summer is here')
    expect(compare).toHaveTextContent(/2 fields changed since Round 1/)
  })

  it('hides compare on the first round', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(payload))
    renderPage()
    expect(await screen.findByTestId('round-chip')).toHaveTextContent(/^Needs your decision$/)
    expect(screen.queryByRole('button', { name: /compare to previous/i })).not.toBeInTheDocument()
  })

  it('requires notes before requesting changes', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse(payload))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /request changes/i }))
    const send = screen.getByRole('button', { name: /send changes/i })
    expect(send).toBeDisabled()
    fireEvent.change(screen.getByLabelText('What should change?'), { target: { value: 'Bigger CTA' } })
    expect(send).not.toBeDisabled()
  })

  it('shows human copy for expired links', async () => {
    fetchMock.mockReturnValueOnce(jsonResponse({ state: 'expired', error: 'x' }, 410))
    renderPage()
    expect(await screen.findByText('This link has expired')).toBeInTheDocument()
  })

  it('shows the recorded decision when already decided', async () => {
    fetchMock.mockReturnValueOnce(
      jsonResponse({ ...payload, state: 'decided', link: { ...payload.link, decision: 'reject', guest_name: 'Bo' } })
    )
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Declined' })).toBeInTheDocument()
    expect(screen.getByText(/Recorded for Bo/)).toBeInTheDocument()
  })
})
