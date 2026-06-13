import { describe, expect, it } from 'vitest'
import { buildAbcSign, createRealAbcClient, type AbcFetch } from './real-abc-client'

describe('buildAbcSign', () => {
  it('matches the official GET signing example', () => {
    expect(
      buildAbcSign({
        appId: '1',
        appSecret: 'qwer',
        path: '/api/v2/open-agency/patient',
        ts: '1648713476',
        query: {
          param1: '2',
          param2: '3'
        }
      })
    ).toBe('0357972C991648DD192427C6C9FD3A78')
  })

  it('sorts request parameters and uppercases the MD5 signature', () => {
    const sign = buildAbcSign({
      appId: 'app-1',
      appSecret: 'secret-1',
      path: '/api/v2/clinics/employees',
      ts: '1700000000000',
      query: {
        pageNo: '1',
        pageSize: '50'
      }
    })

    expect(sign).toMatch(/^[A-F0-9]{32}$/)
    expect(sign).toBe(
      buildAbcSign({
        appId: 'app-1',
        appSecret: 'secret-1',
        path: '/api/v2/clinics/employees',
        ts: '1700000000000',
        query: {
          pageSize: '50',
          pageNo: '1'
        }
      })
    )
  })
})

describe('createRealAbcClient', () => {
  it('requests an access token and tests connection without exposing the secret', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fakeFetch: AbcFetch = async (url, init) => {
      requests.push({ url: String(url), init })

      return new Response(
        JSON.stringify({
          code: 200,
          message: 'success',
          data: {
            accessToken: 'token-1',
            expiresIn: 7200
          }
        }),
        { status: 200 }
      )
    }

    const client = createRealAbcClient({ fetch: fakeFetch, now: () => 1_700_000_000_000 })
    const result = await client.testConnection({
      endpoint: 'https://open.abcyun.cn',
      appId: 'app-1',
      appSecret: 'secret-1'
    })

    expect(result.ok).toBe(true)
    expect(requests[0].url).toBe('https://open.abcyun.cn/api/v2/auth/token')
    expect(String(requests[0].init?.body)).toContain('secret-1')
    expect(JSON.stringify(result)).not.toContain('secret-1')
  })

  it('queries employees with token, signature, timestamp, and app id headers', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fakeFetch: AbcFetch = async (url, init) => {
      requests.push({ url: String(url), init })

      if (String(url).endsWith('/api/v2/auth/token')) {
        return new Response(JSON.stringify({ code: 200, data: { accessToken: 'token-1', expiresIn: 7200 } }), {
          status: 200
        })
      }

      return new Response(
        JSON.stringify({
          code: 200,
          message: 'success',
          data: {
            total: 1,
            rows: [{ empId: '1001', empName: '敖日格乐' }]
          }
        }),
        { status: 200 }
      )
    }

    const client = createRealAbcClient({ fetch: fakeFetch, now: () => 1_700_000_000_000 })
    const result = await client.query({
      config: {
        endpoint: 'https://open.abcyun.cn',
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
    expect(requests[1].url).toBe('https://open.abcyun.cn/api/v2/open-agency/clinics/employees')
    expect(requests[1].init?.headers).toMatchObject({
      appId: 'app-1',
      authorization: 'token-1',
      ts: '1700000000'
    })
    expect(JSON.stringify(requests[1])).not.toContain('secret-1')
    expect((requests[1].init?.headers as Record<string, string>).sign).toMatch(/^[A-F0-9]{32}$/)
  })

  it('queries charge sheets by the official date endpoint and query names', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fakeFetch: AbcFetch = async (url, init) => {
      requests.push({ url: String(url), init })

      if (String(url).endsWith('/api/v2/auth/token')) {
        return new Response(JSON.stringify({ code: 200, data: { accessToken: 'token-1', expiresIn: 7200 } }), {
          status: 200
        })
      }

      return new Response(JSON.stringify({ code: 200, data: { chargeSheets: [] } }), { status: 200 })
    }

    const client = createRealAbcClient({ fetch: fakeFetch, now: () => 1_700_000_000_000 })

    await client.query({
      config: {
        endpoint: 'https://open.abcyun.cn',
        appId: 'app-1',
        appSecret: 'secret-1'
      },
      type: 'CHARGE',
      dateRange: {
        from: '2026-06-01',
        to: '2026-06-13'
      }
    })

    expect(requests[1].url).toBe(
      'https://open.abcyun.cn/api/v2/open-agency/charge/query-by-date?date=2026-06-01&limit=500&offset=0'
    )
  })

  it('queries outpatient prescriptions by the official date endpoint and query names', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fakeFetch: AbcFetch = async (url, init) => {
      requests.push({ url: String(url), init })

      if (String(url).endsWith('/api/v2/auth/token')) {
        return new Response(JSON.stringify({ code: 200, data: { accessToken: 'token-1', expiresIn: 7200 } }), {
          status: 200
        })
      }

      return new Response(JSON.stringify({ code: 200, data: { rows: [] } }), { status: 200 })
    }

    const client = createRealAbcClient({ fetch: fakeFetch, now: () => 1_700_000_000_000 })

    await client.query({
      config: {
        endpoint: 'https://open.abcyun.cn',
        appId: 'app-1',
        appSecret: 'secret-1'
      },
      type: 'PRESCRIPTION',
      dateRange: {
        from: '2026-06-01',
        to: '2026-06-13'
      }
    })

    expect(requests[1].url).toBe(
      'https://open.abcyun.cn/api/v2/open-agency/outpatient/query-by-date?date=2026-06-01&limit=100&offset=0'
    )
  })

  it('queries lab sheets by the official time range endpoint and query names', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fakeFetch: AbcFetch = async (url, init) => {
      requests.push({ url: String(url), init })

      if (String(url).endsWith('/api/v2/auth/token')) {
        return new Response(JSON.stringify({ code: 200, data: { accessToken: 'token-1', expiresIn: 7200 } }), {
          status: 200
        })
      }

      return new Response(JSON.stringify({ code: 200, data: { rows: [] } }), { status: 200 })
    }

    const client = createRealAbcClient({ fetch: fakeFetch, now: () => 1_700_000_000_000 })

    await client.query({
      config: {
        endpoint: 'https://open.abcyun.cn',
        appId: 'app-1',
        appSecret: 'secret-1'
      },
      type: 'LAB',
      dateRange: {
        from: '2026-06-01',
        to: '2026-06-13'
      }
    })

    expect(requests[1].url).toBe(
      'https://open.abcyun.cn/api/v2/open-agency/examination/all/query-by-date?dateFieldType=1&endTime=2026-06-13%2023%3A59%3A59&limit=100&offset=0&startTime=2026-06-01%2000%3A00%3A00'
    )
  })

  it('uses configured official path overrides for non-staff endpoint types', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fakeFetch: AbcFetch = async (url, init) => {
      requests.push({ url: String(url), init })

      if (String(url).endsWith('/api/v2/auth/token')) {
        return new Response(JSON.stringify({ code: 200, data: { accessToken: 'token-1', expiresIn: 7200 } }), {
          status: 200
        })
      }

      return new Response(JSON.stringify({ code: 200, data: { total: 0, rows: [] } }), { status: 200 })
    }

    const client = createRealAbcClient({ fetch: fakeFetch, now: () => 1_700_000_000_000 })

    await client.query({
      config: {
        endpoint: 'https://open.abcyun.cn',
        appId: 'app-1',
        appSecret: 'secret-1'
      },
      type: 'CHARGE',
      path: '/api/v2/official-charge-path',
      dateRange: {
        from: '2026-06-01',
        to: '2026-06-13'
      }
    })

    expect(requests[1].url).toBe(
      'https://open.abcyun.cn/api/v2/official-charge-path?date=2026-06-01&limit=500&offset=0'
    )
    expect((requests[1].init?.headers as Record<string, string>).sign).toMatch(/^[A-F0-9]{32}$/)
  })
})
