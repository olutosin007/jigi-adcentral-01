import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BriefSnippetBar } from './BriefSnippetBar'

vi.mock('@/store/campaignStore', () => ({
  CHANNEL_OPTIONS: [
    { value: 'instagram_post', label: 'Instagram Post' },
    { value: 'linkedin_post', label: 'LinkedIn Post' },
  ],
}))

describe('BriefSnippetBar', () => {
  it('renders objective, audience, and channels', () => {
    render(
      <BriefSnippetBar
        objective="Grow awareness"
        audience="Gen Z"
        channels={['instagram_post', 'linkedin_post']}
        onEditBrief={vi.fn()}
      />
    )
    expect(screen.getByText('Grow awareness')).toBeInTheDocument()
    expect(screen.getByText('Gen Z')).toBeInTheDocument()
    expect(screen.getByText('Instagram Post, LinkedIn Post')).toBeInTheDocument()
  })

  it('calls onEditBrief when edit clicked', async () => {
    const onEditBrief = vi.fn()
    const user = userEvent.setup()
    render(
      <BriefSnippetBar objective="Test" audience="Youth" channels={[]} onEditBrief={onEditBrief} />
    )
    await user.click(screen.getByRole('button', { name: 'Edit full brief' }))
    expect(onEditBrief).toHaveBeenCalledOnce()
  })

  it('renders nothing when hidden', () => {
    const { container } = render(
      <BriefSnippetBar objective="Test" onEditBrief={vi.fn()} hidden />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
