import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button, Callout, JigiTheme, JourneyBadge, PageTitle, ToneBadge, TONE_SURFACE_CLASSES } from '.'
import { kebab } from './theme-css'

const wrap = (ui: React.ReactNode) => render(<JigiTheme>{ui}</JigiTheme>)

describe('design-system components', () => {
  it('Button defaults to the primary (Orchid solid) variant', () => {
    wrap(<Button>Generate</Button>)
    const btn = screen.getByRole('button', { name: 'Generate' })
    expect(btn).toHaveAttribute('data-variant', 'primary')
    expect(btn.className).toContain('rt-variant-solid')
  })

  it('destructive Button uses Brick, not Radix red', () => {
    wrap(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('bg-brick')
  })

  it('ToneBadge applies the literal tone classes', () => {
    wrap(<ToneBadge tone="honey">Waiting</ToneBadge>)
    const badge = screen.getByText('Waiting')
    expect(badge).toHaveAttribute('data-tone', 'honey')
    expect(badge.className).toContain('bg-honey-soft')
  })

  it('JourneyBadge: idea-first is Clay, brand-first is Orchid', () => {
    wrap(
      <>
        <JourneyBadge journey="idea_first" />
        <JourneyBadge journey="brand_first" />
      </>
    )
    expect(screen.getByText('Idea-first')).toHaveAttribute('data-tone', 'clay')
    expect(screen.getByText('Brand-first')).toHaveAttribute('data-tone', 'orchid')
  })

  it('danger Callout is announced as an alert', () => {
    wrap(<Callout intent="danger">Failed</Callout>)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed')
  })

  it('PageTitle is an h1 in Krona One at normal weight', () => {
    wrap(<PageTitle>Work</PageTitle>)
    const h1 = screen.getByRole('heading', { level: 1, name: 'Work' })
    expect(h1.className).toContain('font-display')
    expect(h1.className).toContain('font-normal')
    expect(h1.className).not.toMatch(/font-(semibold|bold)/)
  })

  it('every tone class string references its own colour token', () => {
    for (const [tone, classes] of Object.entries(TONE_SURFACE_CLASSES)) {
      expect(classes).toContain(tone === 'neutral' ? 'bg-mist' : kebab(tone))
    }
  })
})
