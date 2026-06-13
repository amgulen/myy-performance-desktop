import { describe, expect, it } from 'vitest'
import { createAbcQueryService, type AbcClient } from './abc-query-service'

describe('createAbcQueryService', () => {
  it('tests connection through the configured ABC client', async () => {
    const client: AbcClient = {
      testConnection: async () => ({
        ok: true,
        latencyMs: 128,
        checkedAt: '2026-06-13T10:00:00+08:00'
      }),
      query: async () => ({
        statusCode: 200,
        latencyMs: 0,
        sizeBytes: 0,
        body: { code: 200, message: 'success', data: { rows: [] } }
      })
    }

    const service = createAbcQueryService(client)

    await expect(
      service.testConnection({
        endpoint: 'https://abc.example.cn/api/gateway',
        appId: 'app-1',
        appSecret: 'secret-1'
      })
    ).resolves.toEqual({
      ok: true,
      latencyMs: 128,
      checkedAt: '2026-06-13T10:00:00+08:00'
    })
  })

  it('queries staff data and returns raw response with normalized preview rows', async () => {
    const client: AbcClient = {
      testConnection: async () => ({ ok: true, latencyMs: 1, checkedAt: '2026-06-13T10:00:00+08:00' }),
      query: async () => ({
        statusCode: 200,
        latencyMs: 320,
        sizeBytes: 29400,
        body: {
          code: 200,
          message: 'success',
          data: {
            total: 2,
            rows: [
              {
                empId: '1001',
                empName: '敖日格乐',
                deptId: 'D001',
                deptName: '心身医学科',
                title: '主治医师',
                workNo: 'YG1001',
                entryDate: '2018-06-01',
                status: '在职'
              },
              {
                empId: '1002',
                empName: '包金花',
                deptId: 'D002',
                deptName: '内蒙古科',
                title: '医师',
                workNo: 'YG1002',
                entryDate: '2019-03-12',
                status: '在职'
              }
            ]
          }
        }
      })
    }

    const service = createAbcQueryService(client)

    const result = await service.query({
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

    expect(result.raw.statusCode).toBe(200)
    expect(result.raw.latencyMs).toBe(320)
    expect(result.normalizedRows).toEqual([
      {
        sourceType: 'ABC',
        sourceRecordId: '1001',
        staffId: '1001',
        staffName: '敖日格乐',
        departmentId: 'D001',
        departmentName: '心身医学科',
        positionName: '主治医师',
        workNo: 'YG1001',
        occurredAt: '2018-06-01',
        status: '在职'
      },
      {
        sourceType: 'ABC',
        sourceRecordId: '1002',
        staffId: '1002',
        staffName: '包金花',
        departmentId: 'D002',
        departmentName: '内蒙古科',
        positionName: '医师',
        workNo: 'YG1002',
        occurredAt: '2019-03-12',
        status: '在职'
      }
    ])
  })

  it('normalizes the official staff employeeList response shape', async () => {
    const client: AbcClient = {
      testConnection: async () => ({ ok: true, latencyMs: 1, checkedAt: '2026-06-13T10:00:00+08:00' }),
      query: async () => ({
        statusCode: 200,
        latencyMs: 12,
        sizeBytes: 512,
        body: {
          code: 200,
          data: {
            employeeList: [
              {
                id: 'staff-1',
                name: '张三',
                role: '医生',
                position: '主治医师'
              }
            ]
          }
        }
      })
    }
    const service = createAbcQueryService(client)

    const result = await service.query({
      config: { endpoint: 'https://abc.example.cn', appId: 'app-1', appSecret: 'secret-1' },
      type: 'STAFF',
      dateRange: { from: '2026-06-01', to: '2026-06-13' }
    })

    expect(result.normalizedRows).toEqual([
      {
        sourceType: 'ABC',
        sourceRecordId: 'staff-1',
        staffId: 'staff-1',
        staffName: '张三',
        positionName: '主治医师',
        status: '医生'
      }
    ])
  })

  it('normalizes official charge, outpatient, and lab preview rows', async () => {
    const bodies = {
      CHARGE: {
        code: 200,
        data: {
          chargeSheets: [
            {
              id: 'charge-1',
              doctorName: '张医生',
              created: '2026-06-01 09:00:00',
              status: 1
            }
          ]
        }
      },
      PRESCRIPTION: {
        code: 200,
        data: {
          rows: [
            {
              id: 'outpatient-1',
              doctorId: 'doctor-1',
              doctorName: '李医生',
              patientOrderNo: 'MZ0001',
              created: '2026-06-01 10:00:00',
              statusName: '已完成'
            }
          ]
        }
      },
      LAB: {
        code: 200,
        data: {
          rows: [
            {
              id: 'lab-1',
              doctorId: 'doctor-2',
              doctorName: '王医生',
              departmentId: 'dept-1',
              departmentName: '检验科',
              createdTime: '2026-06-01 11:00:00',
              statusName: '待检'
            }
          ]
        }
      }
    } as const

    const service = createAbcQueryService({
      testConnection: async () => ({ ok: true, latencyMs: 1, checkedAt: '2026-06-13T10:00:00+08:00' }),
      query: async (request) => ({
        statusCode: 200,
        latencyMs: 12,
        sizeBytes: 512,
        body: bodies[request.type as keyof typeof bodies]
      })
    })

    await expect(
      service.query({
        config: { endpoint: 'https://abc.example.cn', appId: 'app-1', appSecret: 'secret-1' },
        type: 'CHARGE',
        dateRange: { from: '2026-06-01', to: '2026-06-13' }
      })
    ).resolves.toMatchObject({
      normalizedRows: [
        {
          sourceRecordId: 'charge-1',
          staffName: '张医生',
          occurredAt: '2026-06-01 09:00:00',
          status: '1'
        }
      ]
    })

    await expect(
      service.query({
        config: { endpoint: 'https://abc.example.cn', appId: 'app-1', appSecret: 'secret-1' },
        type: 'PRESCRIPTION',
        dateRange: { from: '2026-06-01', to: '2026-06-13' }
      })
    ).resolves.toMatchObject({
      normalizedRows: [
        {
          sourceRecordId: 'outpatient-1',
          staffId: 'doctor-1',
          staffName: '李医生',
          occurredAt: '2026-06-01 10:00:00',
          status: '已完成'
        }
      ]
    })

    await expect(
      service.query({
        config: { endpoint: 'https://abc.example.cn', appId: 'app-1', appSecret: 'secret-1' },
        type: 'LAB',
        dateRange: { from: '2026-06-01', to: '2026-06-13' }
      })
    ).resolves.toMatchObject({
      normalizedRows: [
        {
          sourceRecordId: 'lab-1',
          staffId: 'doctor-2',
          staffName: '王医生',
          departmentId: 'dept-1',
          departmentName: '检验科',
          occurredAt: '2026-06-01 11:00:00',
          status: '待检'
        }
      ]
    })
  })
})
