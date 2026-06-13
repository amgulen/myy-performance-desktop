export type AbcEndpointType = 'STAFF' | 'CHARGE' | 'PRESCRIPTION' | 'LAB' | 'REFUND'

export interface AbcConnectionConfig {
  endpoint: string
  appId: string
  appSecret: string
}

export interface AbcDateRange {
  from: string
  to: string
}

export interface AbcConnectionResult {
  ok: boolean
  latencyMs: number
  checkedAt: string
  message?: string
}

export interface AbcQueryRequest {
  config: AbcConnectionConfig
  type: AbcEndpointType
  path?: string
  dateRange: AbcDateRange
}

export interface AbcRawResponse {
  statusCode: number
  latencyMs: number
  sizeBytes: number
  body: unknown
}

export interface AbcStandardPreviewRow {
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
}

export interface AbcQueryResult {
  raw: AbcRawResponse
  normalizedRows: AbcStandardPreviewRow[]
}

export interface AbcClient {
  testConnection(config: AbcConnectionConfig): Promise<AbcConnectionResult>
  query(request: AbcQueryRequest): Promise<AbcRawResponse>
}

interface StaffRowLike {
  id?: unknown
  name?: unknown
  role?: unknown
  position?: unknown
  empId?: unknown
  empName?: unknown
  deptId?: unknown
  deptName?: unknown
  title?: unknown
  workNo?: unknown
  entryDate?: unknown
  status?: unknown
}

interface RowsContainer {
  data?: {
    employeeList?: unknown
    chargeSheets?: unknown
    rows?: unknown
  }
}

function text(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.trim().length > 0 ? value : undefined
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return undefined
}

function rowsFrom(type: AbcEndpointType, rawBody: unknown): unknown[] {
  const body = rawBody as RowsContainer

  if (type === 'STAFF' && Array.isArray(body.data?.employeeList)) {
    return body.data.employeeList
  }

  if ((type === 'CHARGE' || type === 'REFUND') && Array.isArray(body.data?.chargeSheets)) {
    return body.data.chargeSheets
  }

  return Array.isArray(body.data?.rows) ? body.data.rows : []
}

function normalizeStaffRows(rawBody: unknown): AbcStandardPreviewRow[] {
  return rowsFrom('STAFF', rawBody).map((row) => {
    const source = row as StaffRowLike
    const staffId = text(source.empId) ?? text(source.id)

    return {
      sourceType: 'ABC',
      sourceRecordId: staffId ?? '',
      staffId,
      staffName: text(source.empName) ?? text(source.name),
      departmentId: text(source.deptId),
      departmentName: text(source.deptName),
      positionName: text(source.title) ?? text(source.position),
      workNo: text(source.workNo),
      occurredAt: text(source.entryDate),
      status: text(source.status) ?? text(source.role)
    }
  })
}

function normalizeRows(type: AbcEndpointType, rawBody: unknown): AbcStandardPreviewRow[] {
  if (type === 'STAFF') {
    return normalizeStaffRows(rawBody)
  }

  return rowsFrom(type, rawBody).map((row, index) => {
    const source = row as {
      id?: unknown
      patientOrderNo?: unknown
      doctorId?: unknown
      doctorName?: unknown
      sellerId?: unknown
      sellerName?: unknown
      departmentId?: unknown
      departmentName?: unknown
      created?: unknown
      createdTime?: unknown
      chargedTime?: unknown
      status?: unknown
      statusName?: unknown
    }

    return {
      sourceType: 'ABC',
      sourceRecordId: text(source.id) ?? text(source.patientOrderNo) ?? `abc-row-${index + 1}`,
      staffId: text(source.doctorId) ?? text(source.sellerId),
      staffName: text(source.doctorName) ?? text(source.sellerName),
      departmentId: text(source.departmentId),
      departmentName: text(source.departmentName),
      occurredAt: text(source.created) ?? text(source.createdTime) ?? text(source.chargedTime),
      status: text(source.statusName) ?? text(source.status)
    }
  })
}

export function createAbcQueryService(client: AbcClient) {
  return {
    testConnection(config: AbcConnectionConfig): Promise<AbcConnectionResult> {
      return client.testConnection(config)
    },

    async query(request: AbcQueryRequest): Promise<AbcQueryResult> {
      const raw = await client.query(request)

      return {
        raw,
        normalizedRows: normalizeRows(request.type, raw.body)
      }
    }
  }
}
