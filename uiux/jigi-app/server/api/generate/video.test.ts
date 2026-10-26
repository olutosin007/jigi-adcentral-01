import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const envState: Record<string, string | undefined> = {}

vi.mock('../lib/env.js', () => ({
  getBooleanEnv: (key: string, fallback = false) => {
    const v = envState[key]
    if (v === undefined) return fallback
    return v === 'true' || v === '1'
  },
}))

import handler from './video.js'

function mockRes() {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: unknown) {
      this.body = payload
      return this
    },
  }
  return res as unknown as VercelResponse & { statusCode: number; body: unknown }
}

describe('POST /api/generate/video scaffold', () => {
  beforeEach(() => {
    delete envState.VIDEO_ENABLED
  })

  it('returns 501 when VIDEO_ENABLED is false (default)', async () => {
    const res = mockRes()
    await handler({ method: 'POST', body: {} } as VercelRequest, res)
    expect(res.statusCode).toBe(501)
    expect(res.body).toEqual(
      expect.objectContaining({ code: 'VIDEO_DISABLED' })
    )
  })

  it('still 501 when flag on but provider missing', async () => {
    envState.VIDEO_ENABLED = 'true'
    const res = mockRes()
    await handler({ method: 'POST', body: {} } as VercelRequest, res)
    expect(res.statusCode).toBe(501)
    expect(res.body).toEqual(
      expect.objectContaining({ code: 'VIDEO_NOT_IMPLEMENTED' })
    )
  })
})
