import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CampaignPipelineRail } from './CampaignPipelineRail'
import type { StageGateMap } from '@/lib/pipeline-gates'

const baseGateMap: StageGateMap = {
  brief: 'in_progress',
  concepts: 'available',
  copy: 'available',
  images: 'available',
  assets: 'available',
}

describe('CampaignPipelineRail', () => {
  it('U2: marks concepts complete only when gateMap says complete', () => {
    const { container, rerender } = render(
      <CampaignPipelineRail
        activeStage="concepts"
        gateMap={{ ...baseGateMap, concepts: 'in_progress' }}
        onStageChange={() => {}}
      />
    )

    const conceptsButton = screen.getByRole('button', { name: 'Concepts' })
    expect(conceptsButton.className).not.toContain('text-success')

    rerender(
      <CampaignPipelineRail
        activeStage="copy"
        gateMap={{ ...baseGateMap, concepts: 'complete', copy: 'in_progress' }}
        onStageChange={() => {}}
      />
    )

    expect(screen.getByRole('button', { name: 'Concepts' }).className).toContain('text-success')
    expect(container.querySelectorAll('.bg-success').length).toBeGreaterThan(0)
  })

  it('U5: in_progress concepts does not show complete styling', () => {
    render(
      <CampaignPipelineRail
        activeStage="concepts"
        gateMap={{ ...baseGateMap, concepts: 'in_progress' }}
        onStageChange={() => {}}
      />
    )

    expect(screen.getByRole('button', { name: 'Concepts' }).className).not.toContain('text-success')
  })

  it('calls onStageChange when a stage is clicked', async () => {
    const user = userEvent.setup()
    const onStageChange = vi.fn()

    render(
      <CampaignPipelineRail
        activeStage="brief"
        gateMap={baseGateMap}
        onStageChange={onStageChange}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(onStageChange).toHaveBeenCalledWith('copy')
  })
})
