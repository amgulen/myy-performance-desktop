import { createHash } from 'node:crypto'
import type {
  AbcClient,
  AbcConnectionConfig,
  AbcConnectionResult,
  AbcEndpointType,
  AbcQueryRequest,
  AbcRawResponse
} from './abc-query-service'

export type AbcFetch = (url: string | URL, init?: RequestInit) => Promise<Response>

interface RealAbcClientOptions {
  fetch?: AbcFetch
  now?: () => number
}

interface BuildSignInput {
  appId: string
  appSecret: string
  path: string
  ts: string
  query?: Record<string, string>
}

interface TokenCacheEntry {
  accessToken: string
  expiresAt: number
}

interface TokenResponseBody {
  code?: number
  message?: string
  data?: {
    accessToken?: string
    expiresIn?: number
    expireIn?: number
  }
}

const endpointPaths: Partial<Record<AbcEndpointType, string>> = {
  STAFF: '/api/v2/open-agency/clinics/employees',
  CHARGE: '/api/v2/open-agency/charge/query-by-date',
  PRESCRIPTION: '/api/v2/open-agency/outpatient/query-by-date',
  LAB: '/api/v2/open-agency/examination/all/query-by-date',
  REFUND: '/api/v2/open-agency/charge/query-by-date'
}

function normalizeBaseUrl(endpoint: string): string {
  return endpoint.replace(/\/+$/, '')
}

function encodeQuery(query: Record<string, string>): string {
  return Object.entries(query)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

function dateStart(date: string): string {
  return `${date} 00:00:00`
}

function dateEnd(date: string): string {
  return `${date} 23:59:59`
}

export function buildAbcSign(input: BuildSignInput): string {
  const parameters: Record<string, string> = {
    appId: input.appId,
    path: input.path,
    ts: input.ts,
    ...(input.query ?? {})
  }

  const source = Object.keys(parameters)
    .sort()
    .map((key) => `${key}=${parameters[key]}`)
    .join('&')

  return createHash('md5')
    .update(`${source}&appSecret=${input.appSecret}`)
    .digest('hex')
    .toUpperCase()
}

function sizeBytes(text: string): number {
  return Buffer.byteLength(text, 'utf8')
}

function extractToken(body: TokenResponseBody): { accessToken: string; expireInSeconds: number } {
  const accessToken = body.data?.accessToken

  if (!accessToken) {
    throw new Error(body.message ?? 'ABC token response did not include accessToken.')
  }

  return {
    accessToken,
    expireInSeconds: body.data?.expiresIn ?? body.data?.expireIn ?? 3600
  }
}

function pathFor(type: AbcEndpointType, override?: string): string {
  if (override?.trim()) {
    return override.trim().startsWith('/') ? override.trim() : `/${override.trim()}`
  }

  const path = endpointPaths[type]

  if (!path) {
    throw new Error(`ABC endpoint type ${type} is not bound to an official API path yet.`)
  }

  return path
}

export function createRealAbcClient(options: RealAbcClientOptions = {}): AbcClient {
  const fetcher = options.fetch ?? fetch
  const now = options.now ?? Date.now
  const tokenCache = new Map<string, TokenCacheEntry>()

  async function getAccessToken(config: AbcConnectionConfig): Promise<string> {
    const cacheKey = `${normalizeBaseUrl(config.endpoint)}:${config.appId}`
    const cached = tokenCache.get(cacheKey)

    if (cached && cached.expiresAt > now() + 60_000) {
      return cached.accessToken
    }

    const tokenUrl = `${normalizeBaseUrl(config.endpoint)}/api/v2/auth/token`
    const startedAt = now()
    const response = await fetcher(tokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        grantType: 'client_credentials',
        appId: config.appId,
        appSecret: config.appSecret
      })
    })
    const text = await response.text()
    const parsed = JSON.parse(text) as TokenResponseBody
    const token = extractToken(parsed)

    tokenCache.set(cacheKey, {
      accessToken: token.accessToken,
      expiresAt: startedAt + token.expireInSeconds * 1000
    })

    return token.accessToken
  }

  async function signedGet(config: AbcConnectionConfig, path: string, query: Record<string, string>): Promise<AbcRawResponse> {
    const accessToken = await getAccessToken(config)
    const ts = String(Math.floor(now() / 1000))
    const sign = buildAbcSign({
      appId: config.appId,
      appSecret: config.appSecret,
      path,
      ts,
      query
    })
    const queryString = encodeQuery(query)
    const url = `${normalizeBaseUrl(config.endpoint)}${path}${queryString ? `?${queryString}` : ''}`
    const startedAt = now()
    const response = await fetcher(url, {
      method: 'GET',
      headers: {
        appId: config.appId,
        authorization: accessToken,
        sign,
        ts
      }
    })
    const text = await response.text()

    return {
      statusCode: response.status,
      latencyMs: Math.max(0, now() - startedAt),
      sizeBytes: sizeBytes(text),
      body: JSON.parse(text)
    }
  }

  return {
    async testConnection(config): Promise<AbcConnectionResult> {
      const startedAt = now()

      try {
        await getAccessToken(config)

        return {
          ok: true,
          latencyMs: Math.max(0, now() - startedAt),
          checkedAt: new Date(now()).toISOString(),
          message: 'ABC授权连接成功'
        }
      } catch (error) {
        return {
          ok: false,
          latencyMs: Math.max(0, now() - startedAt),
          checkedAt: new Date(now()).toISOString(),
          message: error instanceof Error ? error.message : 'ABC授权连接失败'
        }
      }
    },

    async query(request: AbcQueryRequest): Promise<AbcRawResponse> {
      const path = pathFor(request.type, request.path)
      const query: Record<string, string> =
        request.type === 'STAFF'
          ? {}
          : request.type === 'LAB'
            ? {
                dateFieldType: '1',
                endTime: dateEnd(request.dateRange.to),
                limit: '100',
                offset: '0',
                startTime: dateStart(request.dateRange.from)
              }
            : {
                date: request.dateRange.from,
                limit: request.type === 'PRESCRIPTION' ? '100' : '500',
                offset: '0'
              }

      return signedGet(request.config, path, query)
    }
  }
}
