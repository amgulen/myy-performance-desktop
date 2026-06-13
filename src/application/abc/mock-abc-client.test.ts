import { describe, expect, it } from 'vitest'
import { createMockAbcClient } from './mock-abc-client'

describe('createMockAbcClient', () => {
  it('returns connection health without exposing the configured secret', async () => {
    const client = createMockAbcClient()

    const result = await client.testConnection({
      endpoint: 'https://abc.example.cn/api/gateway',
      appId: 'app-1',
      appSecret: 'secret-1'
    })

    expect(result.ok).toBe(true)
    expect(result.latencyMs).toBeGreaterThan(0)
    expect(JSON.stringify(result)).not.toContain('secret-1')
  })

  it('returns staff-shaped ABC payload for direct query preview', async () => {
    const client = createMockAbcClient()

    const result = await client.query({
      config: {
        endpoint: 'https://abc.example.cn/api/gateway',
        appId: 'app-1',
        appSecret: 'secret-1'
      },
      type: 'STAFF',
      dateRange: {
        from: '2026-06-01',
        to: '2026-06-13'
      }
    })

    expect(result.statusCode).toBe(200)
    expect(result.body).toMatchObject({
      code: 200,
      message: 'success',
      data: {
        total: 8
      }
    })
    expect(JSON.stringify(result.body)).not.toContain('secret-1')
  })
})
