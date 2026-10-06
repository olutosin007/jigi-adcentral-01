import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { CreativeAsset } from '@/store/campaignStore'
import { JobSendStage } from './JobSendStage'
import { JobDecisionsStage } from './JobDecisionsStage'
import { JobApprovedStage } from './JobApprovedStage'

function asset(id: string, status: CreativeAsset['status'], extra: Partial<CreativeAsset> = {}): CreativeAsset {
  return {
    id,
    campaign_id: 'c1',
    created_by: 'u1',
    type: 'copy',
    generation_mode: 'brand_grounded',
    content: { headline: `Headline ${id}`, body: 'b', cta: 'c' },
    version: 1,
    status,
    compliance_check: {} as CreativeAsset['compliance_check'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...extra,
  } as CreativeAsset
}

describe('JobSendStage', () => {
  it('shows empty state when nothing is sendable', () => {
    render(<JobSendStage assets={[asset('a', 'approved')]} onSend={vi.fn()} isSending={false} />)
    expect(screen.getByText('Nothing to send yet')).toBeInTheDocument()
  })

  it('sends selected drafts to client by default', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined)
    render(
      <JobSendStage
        assets={[asset('a', 'draft'), asset('b', 'draft'), asset('c', 'approved')]}
        onSend={onSend}
        isSending={false}
      />
    )
    expect(screen.getByRole('button', { name: /select creative to send/i })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: /select all/i }))
    fireEvent.click(screen.getByRole('button', { name: /send 2 to client/i }))
    await waitFor(() => expect(onSend).toHaveBeenCalledWith(['a', 'b'], 'submitted', undefined, undefined))
  })

  it('summarises what the client will see from the brand check', () => {
    render(
      <JobSendStage
        assets={[
          asset('a', 'draft', { validation_scores: { valid: true, blocking: false, validated_at: '2026-10-01' } }),
          asset('b', 'draft'),
        ]}
        onSend={vi.fn()}
        isSending={false}
        brandKit="complete"
      />
    )
    expect(screen.queryByTestId('send-brand-strip')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /select all/i }))
    expect(screen.getByTestId('send-brand-strip')).toHaveTextContent('1 look on-brand · 1 not checked')
  })

  it('passes an optional email recipient when sending to client', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined)
    render(<JobSendStage assets={[asset('a', 'draft')]} onSend={onSend} isSending={false} />)
    fireEvent.click(screen.getByRole('button', { name: /select all/i }))
    fireEvent.change(screen.getByLabelText(/email a review link/i), { target: { value: 'c@brand.co' } })
    fireEvent.change(screen.getByLabelText('Client name'), { target: { value: 'Cleo' } })
    fireEvent.click(screen.getByRole('button', { name: /send 1 to client/i }))
    await waitFor(() =>
      expect(onSend).toHaveBeenCalledWith(['a'], 'submitted', undefined, { email: 'c@brand.co', name: 'Cleo' })
    )
  })

  it('groups returned work under Fix & resend', () => {
    render(
      <JobSendStage
        assets={[asset('a', 'changes_requested'), asset('b', 'draft')]}
        onSend={vi.fn()}
        isSending={false}
      />
    )
    expect(screen.getByRole('region', { name: 'Fix & resend' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Ready to send' })).toBeInTheDocument()
  })
})

describe('JobDecisionsStage', () => {
  it('surfaces client notes on returned work and offers resend', () => {
    const onResend = vi.fn()
    render(
      <JobDecisionsStage
        assets={[
          asset('a', 'changes_requested', { review_notes: 'Make the logo bigger' }),
          asset('b', 'brand_review'),
        ]}
        onResend={onResend}
      />
    )
    expect(screen.getByText('Make the logo bigger')).toBeInTheDocument()
    expect(screen.getByText('1 needs your fix')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Waiting on client' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /resend/i }))
    expect(onResend).toHaveBeenCalled()
  })

  it('labels rounds, groups waiting work by round and offers the next round on resend', () => {
    const onResend = vi.fn()
    render(
      <JobDecisionsStage
        assets={[
          asset('a', 'changes_requested'),
          asset('b', 'brand_review'),
          asset('c', 'submitted'),
        ]}
        rounds={new Map([['a', 2], ['b', 3], ['c', 1]])}
        onResend={onResend}
      />
    )
    expect(screen.getByRole('button', { name: 'Resend as Round 3' })).toBeInTheDocument()
    const waiting = screen.getByRole('region', { name: 'Waiting on client' })
    expect(waiting).toHaveTextContent('Round 3')
    expect(waiting).toHaveTextContent('Round 1')
    expect(screen.getAllByTestId('round-meta').map((n) => n.textContent)).toEqual(['Round 2', 'Round 3'])
  })

  it('filters by source when AI and uploaded work are mixed', () => {
    render(
      <JobDecisionsStage
        assets={[
          asset('a', 'brand_review', { source: 'uploaded' }),
          asset('b', 'brand_review', { source: 'ai' }),
        ]}
      />
    )
    expect(screen.getByText('Headline a')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'AI' }))
    expect(screen.queryByText('Headline a')).not.toBeInTheDocument()
    expect(screen.getByText('Headline b')).toBeInTheDocument()
  })

  it('shows guidance-only brand check with an incomplete kit', () => {
    render(
      <JobDecisionsStage
        brandKit="partial"
        assets={[asset('a', 'brand_review', { validation_scores: { valid: true, blocking: false } })]}
      />
    )
    expect(screen.getByTestId('brand-check-chip')).toHaveTextContent('No issues found')
    expect(screen.queryByText(/on-brand/i)).not.toBeInTheDocument()
  })

  it('shows link status with share and revoke on waiting work', () => {
    const onShare = vi.fn()
    const onRevokeLink = vi.fn()
    const links = new Map([
      [
        'a',
        {
          id: 'l1',
          asset_id: 'a',
          created_at: '2026-10-01T00:00:00Z',
          expires_at: '2099-01-01T00:00:00Z',
          revoked_at: null,
          first_opened_at: '2026-10-02T00:00:00Z',
          decided_at: null,
          decision: null,
          guest_name: null,
          recipient_name: null,
          recipient_email: null,
        },
      ],
    ])
    render(
      <JobDecisionsStage
        assets={[asset('a', 'brand_review')]}
        links={links}
        onShare={onShare}
        onRevokeLink={onRevokeLink}
      />
    )
    expect(screen.getByTestId('link-status')).toHaveTextContent('Link opened')
    fireEvent.click(screen.getByRole('button', { name: /revoke/i }))
    expect(onRevokeLink).toHaveBeenCalledWith('l1')
    fireEvent.click(screen.getByRole('button', { name: /new link/i }))
    expect(onShare).toHaveBeenCalled()
  })

  it('shows empty state when nothing is in flight', () => {
    render(<JobDecisionsStage assets={[asset('a', 'draft')]} />)
    expect(screen.getByText('No decisions in flight')).toBeInTheDocument()
  })
})

describe('JobApprovedStage', () => {
  it('lists approved assets', () => {
    render(
      <MemoryRouter>
        <JobApprovedStage assets={[asset('a', 'approved')]} />
      </MemoryRouter>
    )
    expect(screen.getByText('1 asset cleared for use')).toBeInTheDocument()
    expect(screen.getByText('Headline a')).toBeInTheDocument()
  })
})
