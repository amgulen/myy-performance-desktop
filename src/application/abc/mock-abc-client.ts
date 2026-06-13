import type { AbcClient, AbcConnectionConfig, AbcConnectionResult, AbcQueryRequest, AbcRawResponse } from './abc-query-service'

const staffRows = [
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
  },
  {
    empId: '1003',
    empName: '苏日娜',
    deptId: 'D001',
    deptName: '心身医学科',
    title: '主管护师',
    workNo: 'HG1003',
    entryDate: '2017-11-20',
    status: '在职'
  },
  {
    empId: '1004',
    empName: '特木其乐',
    deptId: 'D003',
    deptName: '针灸推拿科',
    title: '主治医师',
    workNo: 'YG1004',
    entryDate: '2016-08-15',
    status: '在职'
  },
  {
    empId: '1005',
    empName: '其其格',
    deptId: 'D002',
    deptName: '内蒙古科',
    title: '医师',
    workNo: 'YG1005',
    entryDate: '2020-01-05',
    status: '在职'
  },
  {
    empId: '1006',
    empName: '乌云巴特尔',
    deptId: 'D004',
    deptName: '外科',
    title: '副主任医师',
    workNo: 'YG1006',
    entryDate: '2015-05-18',
    status: '在职'
  },
  {
    empId: '1007',
    empName: '朝鲁门',
    deptId: 'D001',
    deptName: '心身医学科',
    title: '治疗师',
    workNo: 'ZG1007',
    entryDate: '2021-07-01',
    status: '在职'
  },
  {
    empId: '1008',
    empName: '额尔敦',
    deptId: 'D003',
    deptName: '针灸推拿科',
    title: '医师',
    workNo: 'YG1008',
    entryDate: '2019-09-09',
    status: '在职'
  }
]

function nowIso(): string {
  return new Date().toISOString()
}

function validateConfig(config: AbcConnectionConfig): AbcConnectionResult | undefined {
  if (!config.endpoint.trim() || !config.appId.trim() || !config.appSecret.trim()) {
    return {
      ok: false,
      latencyMs: 0,
      checkedAt: nowIso(),
      message: '请填写接口地址、AppId 和 AppSecret'
    }
  }

  return undefined
}

export function createMockAbcClient(): AbcClient {
  return {
    async testConnection(config): Promise<AbcConnectionResult> {
      const invalid = validateConfig(config)

      if (invalid) {
        return invalid
      }

      return {
        ok: true,
        latencyMs: 128,
        checkedAt: nowIso(),
        message: '模拟连接成功，等待替换为真实 ABC 客户端'
      }
    },

    async query(request: AbcQueryRequest): Promise<AbcRawResponse> {
      return {
        statusCode: 200,
        latencyMs: 320,
        sizeBytes: 29400,
        body: {
          code: 200,
          message: 'success',
          data: {
            endpointType: request.type,
            dateRange: request.dateRange,
            total: staffRows.length,
            page: 1,
            pageSize: 50,
            rows: staffRows
          }
        }
      }
    }
  }
}
