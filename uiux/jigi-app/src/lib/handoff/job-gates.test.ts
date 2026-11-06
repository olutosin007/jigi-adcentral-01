import { describe, expect, it } from 'vitest'
import { EMPTY_JOB_COUNTS, evaluateHandoffGates, getJobHeaderAction } from './index'
import { getNextPipelineAction, type PipelineGateInput } from '@/lib/pipeline-gates'

function input(partial: Partial<PipelineGateInput['campaign']> = {}, assets: PipelineGateInput['assets'] = []): PipelineGateInput {
  return {
    campaign: {
      id: 'c1',
      journey_mode: 'brand_first',
      brief: { objective: 'Launch', audience: 'Gen Z', channels: ['instagram'], key_message: 'Go' },
      status: 'active',
      ...partial,
    },
    assets,
  }
}

describe('evaluateHandoffGates', () => {
  it('is all available with no assets', () => {
    expect(evaluateHandoffGates(EMPTY_JOB_COUNTS)).toEqual({
      send: 'available',
      decisions: 'available',
      approved: 'available',
    })
  })

  it('tracks sent, open and approved work', () => {
    expect(
      evaluateHandoffGates({ ...EMPTY_JOB_COUNTS, total: 3, draft: 1, waiting: 1, approved: 1 })
    ).toEqual({ send: 'in_progress', decisions: 'in_progress', approved: 'complete' })
    expect(evaluateHandoffGates({ ...EMPTY_JOB_COUNTS, total: 2, approved: 2 })).toEqual({
      send: 'complete',
      decisions: 'complete',
      approved: 'complete',
    })
  })
})

describe('getJobHeaderAction', () => {
  it('puts client changes first', () => {
    const action = getJobHeaderAction(input(), { ...EMPTY_JOB_COUNTS, total: 2, changes: 1, draft: 1 })
    expect(action).toMatchObject({ label: 'Fix 1 note', stage: 'decisions' })
  })

  it('follows the pipeline while generating', () => {
    expect(getJobHeaderAction(input(), EMPTY_JOB_COUNTS)).toEqual(getNextPipelineAction(input()))
  })

  it('offers send when uploaded drafts exist even if pipeline is incomplete', () => {
    const action = getJobHeaderAction(
      input(),
      { ...EMPTY_JOB_COUNTS, total: 1, draft: 1 },
      { hasUploaded: true }
    )
    expect(action).toMatchObject({ label: 'Send for approval', stage: 'send' })
  })

  it('routes archived jobs to approved', () => {
    expect(getJobHeaderAction(input({ status: 'archived' }), EMPTY_JOB_COUNTS).stage).toBe('approved')
  })
})
