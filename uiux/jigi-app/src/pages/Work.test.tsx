import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Work } from './Work'
import { EMPTY_JOB_COUNTS, getJobNextAction } from '@/lib/handoff'
import type { WorkJob } from '@/hooks/useWorkQueries'

const { mockJobs } = vi.hoisted(() => ({ mockJobs: { current: [] as WorkJob[] } }))

vi.mock('@/hooks/useWorkQueries', () => ({
  useWorkJobs: () => ({ data: mockJobs.current, isLoading: false, error: null, refetch: vi.fn() }),
}))

function job(partial: Partial<WorkJob> & Pick<WorkJob, 'id' | 'name'>): WorkJob {
  const counts = partial.counts ?? EMPTY_JOB_COUNTS
  const briefReady = partial.briefReady ?? true
  return {
    status: 'active',
    journeyMode: 'brand_first',
    updatedAt: new Date().toISOString(),
    brandName: 'Acme',
    counts,
    briefReady,
    nextAction: getJobNextAction({ counts, briefReady, archived: partial.status === 'archived' }),
    ...partial,
  }
}

function renderWork() {
  return render(
    <MemoryRouter>
      <Work />
    </MemoryRouter>
  )
}

describe('Work', () => {
  beforeEach(() => {
    mockJobs.current = []
  })

  it('shows empty state with a new job CTA', () => {
    renderWork()
    expect(screen.getByText('Start your first job')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New job' })).toBeInTheDocument()
  })

  it('shows exactly one next action per job and links to the target stage', () => {
    mockJobs.current = [
      job({ id: 'a', name: 'Spring launch', counts: { ...EMPTY_JOB_COUNTS, total: 2, changes: 2 } }),
      job({ id: 'b', name: 'Summer promo', counts: { ...EMPTY_JOB_COUNTS, total: 1, draft: 1 } }),
    ]
    renderWork()

    const actions = screen.getAllByTestId('work-next-action')
    expect(actions).toHaveLength(2)
    expect(actions[0]).toHaveTextContent('Fix 2 notes')
    expect(actions[1]).toHaveTextContent('Send for approval')
    expect(screen.getByRole('link', { name: /Spring launch/ })).toHaveAttribute(
      'href',
      '/app/campaigns/a?stage=decisions'
    )
    expect(screen.getByText('2 jobs need you')).toBeInTheDocument()
  })

  it('hides archived jobs until toggled', async () => {
    const user = userEvent.setup()
    mockJobs.current = [
      job({ id: 'a', name: 'Live job' }),
      job({ id: 'b', name: 'Old job', status: 'archived' }),
    ]
    renderWork()

    expect(screen.queryByText('Old job')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Show archived (1)' }))
    expect(screen.getByText('Old job')).toBeInTheDocument()
  })
})
