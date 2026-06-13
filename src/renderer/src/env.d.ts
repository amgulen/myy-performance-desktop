/// <reference types="vite/client" />

interface DesktopInfo {
  platform: string
}

type AbcEndpointType = 'STAFF' | 'CHARGE' | 'PRESCRIPTION' | 'LAB' | 'REFUND'

interface AbcConnectionConfig {
  endpoint: string
  appId: string
  appSecret: string
}

interface AbcConnectionResult {
  ok: boolean
  latencyMs: number
  checkedAt: string
  message?: string
}

interface AbcQueryResult {
  raw: {
    statusCode: number
    latencyMs: number
    sizeBytes: number
    body: unknown
  }
  normalizedRows: Array<{
    sourceType: 'ABC'
    sourceRecordId: string
    staffId?: string
    staffName?: string
    departmentId?: string
    departmentName?: string
    positionName?: string
    workNo?: string
    occurredAt?: string
    status?: string
  }>
}

interface AbcApi {
  testConnection(config: AbcConnectionConfig): Promise<AbcConnectionResult>
  query(request: {
    config: AbcConnectionConfig
    type: AbcEndpointType
    path?: string
    dateRange: {
      from: string
      to: string
    }
  }): Promise<AbcQueryResult>
}

interface Window {
  desktopInfo: DesktopInfo
  abcApi: AbcApi
}
