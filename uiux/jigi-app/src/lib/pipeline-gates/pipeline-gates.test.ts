import { describe, expect, it } from 'vitest'
import {
  canGenerateConcepts,
  canGenerateCopy,
  canGenerateImageExplore,
  canGenerateImageRecommended,
  evaluateStageGates,
  getNextPipelineAction,
} from './index'
import type { PipelineGateAsset, PipelineGateCampaign, PipelineGateInput } from './types'

const CAMPAIGN_ID = 'campaign-1'

function makeCampaign(overrides: Partial<PipelineGateCampaign> = {}): PipelineGateCampaign {
  return {
    id: CAMPAIGN_ID,
    journey_mode: 'brand_first',
    brief: {},
    status: 'draft',
    ...overrides,
  }
}

function makeAsset(overrides: Partial<PipelineGateAsset> & Pick<PipelineGateAsset, 'id' | 'type'>): PipelineGateAsset {
  return {
    campaign_id: CAMPAIGN_ID,
    parent_asset_id: null,
    ...overrides,
  }
}

function makeInput(
  campaignOverrides: Partial<PipelineGateCampaign> = {},
  assets: PipelineGateAsset[] = []
): PipelineGateInput {
  return {
    campaign: makeCampaign(campaignOverrides),
    assets,
  }
}

const completeBrandBrief = {
  objective: 'Launch summer campaign for refresh',
  audience: 'Young professionals aged 25 to 35',
  channels: ['instagram_post'],
  key_message: 'Stay refreshed all summer long',
}

describe('evaluateStageGates', () => {
  it('G1: empty brand-first campaign — brief in_progress, concepts available', () => {
    const gates = evaluateStageGates(makeInput())
    expect(gates.brief).toBe('in_progress')
    expect(gates.concepts).toBe('available')
  })

  it('G2: incomplete brand-first brief — concepts not complete', () => {
    const gates = evaluateStageGates(
      makeInput({
        brief: { objective: 'Too short', audience: 'Young professionals aged 25 to 35', channels: ['instagram_post'] },
      })
    )
    expect(gates.brief).toBe('in_progress')
    expect(gates.concepts).not.toBe('complete')
  })

  it('G3: idea-first with seed_idea and channels — brief complete', () => {
    const gates = evaluateStageGates(
      makeInput({
        journey_mode: 'idea_first',
        seed_idea: 'A beach vacation vibe for sunscreen launch',
        brief: { channels: ['facebook_post'] },
      })
    )
    expect(gates.brief).toBe('complete')
  })

  it('G4: concepts exist without selection — concepts in_progress', () => {
    const gates = evaluateStageGates(
      makeInput({}, [makeAsset({ id: 'c1', type: 'concept' })])
    )
    expect(gates.concepts).toBe('in_progress')
  })

  it('G5: selected concept — concepts complete, copy available', () => {
    const gates = evaluateStageGates(
      makeInput(
        { selected_concept_asset_id: 'c1' },
        [makeAsset({ id: 'c1', type: 'concept' })]
      )
    )
    expect(gates.concepts).toBe('complete')
    expect(gates.copy).toBe('available')
  })

  it('G6: copy exists for selected concept without copy selection — copy in_progress', () => {
    const gates = evaluateStageGates(
      makeInput(
        { selected_concept_asset_id: 'c1' },
        [
          makeAsset({ id: 'c1', type: 'concept' }),
          makeAsset({ id: 'copy-1', type: 'copy', parent_asset_id: 'c1' }),
        ]
      )
    )
    expect(gates.copy).toBe('in_progress')
  })

  it('G7: both selections set — copy complete, images available', () => {
    const gates = evaluateStageGates(
      makeInput(
        { selected_concept_asset_id: 'c1', selected_copy_asset_id: 'copy-1' },
        [
          makeAsset({ id: 'c1', type: 'concept' }),
          makeAsset({ id: 'copy-1', type: 'copy', parent_asset_id: 'c1' }),
        ]
      )
    )
    expect(gates.copy).toBe('complete')
    expect(gates.images).toBe('available')
  })

  it('G8: missing selected concept asset — concepts in_progress, copy selection ignored', () => {
    const gates = evaluateStageGates(
      makeInput(
        { selected_concept_asset_id: 'missing', selected_copy_asset_id: 'copy-1' },
        [
          makeAsset({ id: 'c2', type: 'concept' }),
          makeAsset({ id: 'copy-1', type: 'copy', parent_asset_id: 'missing' }),
        ]
      )
    )
    expect(gates.concepts).toBe('in_progress')
    expect(gates.copy).toBe('available')
  })

  it('G9: archived campaign — gates stay truthful without false complete', () => {
    const gates = evaluateStageGates(
      makeInput({ status: 'archived', brief: completeBrandBrief })
    )
    expect(gates.brief).toBe('complete')
    expect(gates.concepts).toBe('available')
    expect(gates.concepts).not.toBe('complete')
  })
})

describe('getNextPipelineAction', () => {
  it('G10: returns Complete brief when brief incomplete', () => {
    expect(getNextPipelineAction(makeInput())).toMatchObject({
      label: 'Complete brief',
      stage: 'brief',
      actionType: 'navigate',
    })
  })

  it('G10: returns Generate concepts when brief complete and no concepts', () => {
    expect(
      getNextPipelineAction(makeInput({ brief: completeBrandBrief }))
    ).toMatchObject({
      label: 'Generate concepts',
      stage: 'concepts',
      actionType: 'focus_generate',
    })
  })

  it('G10: returns Select a concept when concepts exist without selection', () => {
    expect(
      getNextPipelineAction(
        makeInput({ brief: completeBrandBrief }, [makeAsset({ id: 'c1', type: 'concept' })])
      )
    ).toMatchObject({
      label: 'Select a concept',
      stage: 'concepts',
      actionType: 'scroll_selection',
    })
  })

  it('G10: returns Generate copy when concept selected and no copy assets', () => {
    expect(
      getNextPipelineAction(
        makeInput(
          { brief: completeBrandBrief, selected_concept_asset_id: 'c1' },
          [makeAsset({ id: 'c1', type: 'concept' })]
        )
      )
    ).toMatchObject({
      label: 'Generate copy',
      stage: 'copy',
      actionType: 'focus_generate',
    })
  })

  it('G10: returns Select copy for key art when copy exists without selection', () => {
    expect(
      getNextPipelineAction(
        makeInput(
          { brief: completeBrandBrief, selected_concept_asset_id: 'c1' },
          [
            makeAsset({ id: 'c1', type: 'concept' }),
            makeAsset({ id: 'copy-1', type: 'copy', parent_asset_id: 'c1' }),
          ]
        )
      )
    ).toMatchObject({
      label: 'Select copy for key art',
      stage: 'copy',
      actionType: 'scroll_selection',
    })
  })

  it('G10: returns Generate image when both selections set', () => {
    expect(
      getNextPipelineAction(
        makeInput(
          {
            brief: completeBrandBrief,
            selected_concept_asset_id: 'c1',
            selected_copy_asset_id: 'copy-1',
          },
          [
            makeAsset({ id: 'c1', type: 'concept' }),
            makeAsset({ id: 'copy-1', type: 'copy', parent_asset_id: 'c1' }),
          ]
        )
      )
    ).toMatchObject({
      label: 'Generate image',
      stage: 'images',
      actionType: 'focus_generate',
    })
  })

  it('G9/G10: archived campaign returns View assets', () => {
    expect(
      getNextPipelineAction(
        makeInput({
          status: 'archived',
          brief: completeBrandBrief,
          selected_concept_asset_id: 'c1',
          selected_copy_asset_id: 'copy-1',
        })
      )
    ).toMatchObject({
      label: 'View assets',
      stage: 'assets',
      actionType: 'navigate',
    })
  })
})

describe('canGenerate helpers', () => {
  it('allows concept generation unless archived', () => {
    expect(canGenerateConcepts(makeInput())).toBe(true)
    expect(canGenerateConcepts(makeInput({ status: 'archived' }))).toBe(false)
  })

  it('requires resolved concept selection for copy generation', () => {
    expect(canGenerateCopy(makeInput())).toBe(false)
    expect(
      canGenerateCopy(
        makeInput(
          { selected_concept_asset_id: 'c1' },
          [makeAsset({ id: 'c1', type: 'concept' })]
        )
      )
    ).toBe(true)
  })

  it('requires resolved copy selection for recommended image generation', () => {
    expect(canGenerateImageRecommended(makeInput())).toBe(false)
    expect(
      canGenerateImageRecommended(
        makeInput(
          { selected_concept_asset_id: 'c1', selected_copy_asset_id: 'copy-1' },
          [
            makeAsset({ id: 'c1', type: 'concept' }),
            makeAsset({ id: 'copy-1', type: 'copy', parent_asset_id: 'c1' }),
          ]
        )
      )
    ).toBe(true)
  })

  it('allows explore image generation unless archived', () => {
    expect(canGenerateImageExplore(makeInput())).toBe(true)
    expect(canGenerateImageExplore(makeInput({ status: 'archived' }))).toBe(false)
  })
})
