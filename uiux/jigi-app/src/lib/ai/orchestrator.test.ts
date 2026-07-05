import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CampaignBrief } from './types'

const generateTextMock = vi.fn()
const assemblePromptMock = vi.fn()
const supabaseFromMock = vi.fn()

vi.mock('@/lib/api-client', () => ({
  generateText: (...args: unknown[]) => generateTextMock(...args),
  generateImage: vi.fn(),
}))

vi.mock('@/lib/prompt-assembly', () => ({
  assemblePrompt: (...args: unknown[]) => assemblePromptMock(...args),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => supabaseFromMock(...args),
  },
}))

import { AIOrchestrator } from './orchestrator'

const brief: CampaignBrief = {
  objective: 'Launch summer refresh',
  audience: 'Young professionals',
  channels: ['instagram_post'],
  key_message: 'Stay refreshed all summer',
}

function mockCopyResponse() {
  generateTextMock.mockResolvedValue({
    content: {
      variants: [{ headline: 'Hi', body: 'Body', cta: 'Go' }],
    },
    model: 'gpt-test',
    latency_ms: 100,
  })
}

describe('AIOrchestrator.generateCopy', () => {
  const orchestrator = new AIOrchestrator()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCopyResponse()
    assemblePromptMock.mockResolvedValue(null)
    supabaseFromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })
  })

  it('H1: fallback copy prompt embeds concept context when provided', async () => {
    await orchestrator.generateCopy(
      undefined,
      brief,
      'instagram_post',
      { seed_idea: 'Summer vibes' },
      undefined,
      undefined,
      'campaign-1',
      {
        theme: 'Sunrise Energy',
        headlines: ['Wake up refreshed'],
        visual_direction: 'Golden hour lifestyle photography',
      }
    )

    expect(generateTextMock).toHaveBeenCalledOnce()
    const call = generateTextMock.mock.calls[0][0]
    expect(call.prompt).toContain('SELECTED CONCEPT CONTEXT')
    expect(call.prompt).toContain('Sunrise Energy')
    expect(call.prompt).toContain('Stay refreshed all summer')
    expect(call.use_prompt_as_system).toBe(false)
  })

  it('H2: assembled copy prompt receives concept context via assemblePrompt', async () => {
    assemblePromptMock.mockResolvedValue({
      prompt: 'ROLE: You are a senior copywriter',
      hash: 'abc123',
      cco_version: 1,
      cco: {
        strategic_context: { key_message: 'Stay refreshed all summer' },
      },
    })

    await orchestrator.generateCopy(
      undefined,
      brief,
      'instagram_post',
      undefined,
      undefined,
      undefined,
      'campaign-1',
      {
        theme: 'Poolside Cool',
        headlines: ['Dive in'],
        visual_direction: 'Bright poolside scenes',
      }
    )

    expect(assemblePromptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        track: 'copy',
        conceptContext: expect.objectContaining({ theme: 'Poolside Cool' }),
      })
    )

    const call = generateTextMock.mock.calls[0][0]
    expect(call.prompt).toContain('ROLE: You are a senior copywriter')
    expect(call.use_prompt_as_system).toBe(true)
  })

  it('H3: resolves concept from campaign selection when UI context omitted', async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: { selected_concept_asset_id: 'concept-99' } })
      .mockResolvedValueOnce({
        data: {
          content: {
            theme: 'Persisted Concept',
            headlines: ['Line one'],
            visual_direction: 'Bold typography on colour blocks',
            key_message_link: 'Delivers refresh promise directly',
          },
        },
      })

    supabaseFromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
    })

    await orchestrator.generateCopy(
      undefined,
      brief,
      'instagram_post',
      undefined,
      undefined,
      undefined,
      'campaign-1'
    )

    const call = generateTextMock.mock.calls[0][0]
    expect(call.prompt).toContain('Persisted Concept')
    expect(call.prompt).toContain('Delivers refresh promise directly')
  })
})
