import { useMemo, useState } from 'react'

const endpointTypes: Array<{ value: AbcEndpointType; label: string }> = [
  { value: 'STAFF', label: '人员' },
  { value: 'CHARGE', label: '收费' },
  { value: 'PRESCRIPTION', label: '处方' },
  { value: 'LAB', label: '检验' },
  { value: 'REFUND', label: '退费' }
]

const navigationItems = ['接口中心', '数据看板', '绩效指标', '数据任务', '数据质量', '日志中心', '系统设置']

const defaultConfig: AbcConnectionConfig = {
  endpoint: 'https://open-region2.abcyun.cn',
  appId: '',
  appSecret: ''
}

const defaultEndpointPaths: Record<AbcEndpointType, string> = {
  STAFF: '/api/v2/open-agency/clinics/employees',
  CHARGE: '/api/v2/open-agency/charge/query-by-date',
  PRESCRIPTION: '/api/v2/open-agency/outpatient/query-by-date',
  LAB: '/api/v2/open-agency/examination/all/query-by-date',
  REFUND: '/api/v2/open-agency/charge/query-by-date'
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  return `${(bytes / 1024).toFixed(1)} KB`
}

export function App(): React.JSX.Element {
  const [config, setConfig] = useState<AbcConnectionConfig>(defaultConfig)
  const [endpointType, setEndpointType] = useState<AbcEndpointType>('STAFF')
  const [endpointPaths, setEndpointPaths] = useState(defaultEndpointPaths)
  const [dateRange, setDateRange] = useState({ from: '2026-06-01', to: '2026-06-13' })
  const [connection, setConnection] = useState<AbcConnectionResult | null>(null)
  const [queryResult, setQueryResult] = useState<AbcQueryResult | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [isQuerying, setIsQuerying] = useState(false)

  const rawJson = useMemo(() => formatJson(queryResult?.raw.body ?? { code: null, message: '等待查询' }), [queryResult])

  async function testConnection(): Promise<void> {
    setIsTesting(true)
    setOperationError(null)
    try {
      const result = await window.abcApi.testConnection(config)
      setConnection(result)
      if (!result.ok) {
        setOperationError(result.message ?? 'ABC连接测试失败')
      }
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'ABC连接测试失败')
    } finally {
      setIsTesting(false)
    }
  }

  async function queryAbc(): Promise<void> {
    setIsQuerying(true)
    setOperationError(null)
    try {
      const result = await window.abcApi.query({
        config,
        type: endpointType,
        path: endpointPaths[endpointType],
        dateRange
      })
      setQueryResult(result)
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'ABC接口查询失败')
    } finally {
      setIsQuerying(false)
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="window-controls" aria-hidden="true">
          <span className="control red" />
          <span className="control amber" />
          <span className="control green" />
        </div>
        <div className="brand">
          <span className="brand-mark">云</span>
          <strong>蒙医云绩效管理</strong>
        </div>
        <nav className="nav-list" aria-label="主导航">
          {navigationItems.map((item) => (
            <button className={item === '接口中心' ? 'nav-item active' : 'nav-item'} key={item}>
              <span className="nav-dot" />
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="hospital-selector">内蒙古国际蒙医医院</button>
          <button className="admin-selector">管理员</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <button className="menu-button" aria-label="折叠菜单">
              <span />
              <span />
              <span />
            </button>
            <h1>接口中心</h1>
          </div>
          <div className="top-actions">
            <button className="ghost-button">刷新</button>
            <button className="ghost-button">历史记录</button>
            <button className="ghost-button">接口文档</button>
            <button className="ghost-button">消息</button>
            <button className="account-button">管理员</button>
          </div>
        </header>

        <section className="panel connection-panel" aria-labelledby="abc-connect-title">
          <div className="panel-heading">
            <h2 id="abc-connect-title">ABC连接</h2>
            <span className="collapse-mark">⌃</span>
          </div>
          <div className="connection-grid">
            <label className="field wide">
              <span>Endpoint</span>
              <input
                value={config.endpoint}
                placeholder="https://open-region2.abcyun.cn"
                onChange={(event) => setConfig({ ...config, endpoint: event.target.value })}
                spellCheck={false}
              />
            </label>
            <label className="field">
              <span>AppId</span>
              <input
                value={config.appId}
                placeholder="请输入 ABC AppId"
                onChange={(event) => setConfig({ ...config, appId: event.target.value })}
              />
            </label>
            <label className="field">
              <span>AppSecret</span>
              <input
                type="password"
                value={config.appSecret}
                placeholder="请输入 ABC AppSecret"
                onChange={(event) => setConfig({ ...config, appSecret: event.target.value })}
              />
            </label>
            <div className="status-block">
              <span>状态</span>
              <strong className={connection?.ok ? 'status ok' : 'status idle'}>
                {connection?.ok ? '已连接' : '未测试'}
              </strong>
            </div>
            <button className="primary-button" disabled={isTesting} onClick={() => void testConnection()}>
              {isTesting ? '测试中' : '测试连接'}
            </button>
          </div>
        </section>

        <section className="panel query-panel" aria-labelledby="query-title">
          <div className="panel-heading">
            <h2 id="query-title">接口查询</h2>
            <span className="collapse-mark">⌃</span>
          </div>
          <div className="query-grid">
            <div className="endpoint-selector">
              <span>Endpoint 类型</span>
              <div className="endpoint-tabs" role="tablist" aria-label="Endpoint 类型">
                {endpointTypes.map((type) => (
                  <button
                    className={endpointType === type.value ? 'endpoint-tab active' : 'endpoint-tab'}
                    key={type.value}
                    onClick={() => setEndpointType(type.value)}
                    type="button"
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="field path-field">
              <span>官方接口 Path</span>
              <input
                value={endpointPaths[endpointType]}
                placeholder="按 ABC 官方文档填写，例如 /api/v2/..."
                onChange={(event) => setEndpointPaths({ ...endpointPaths, [endpointType]: event.target.value })}
                spellCheck={false}
              />
            </label>
            <label className="field">
              <span>开始日期</span>
              <input
                type="date"
                value={dateRange.from}
                onChange={(event) => setDateRange({ ...dateRange, from: event.target.value })}
              />
            </label>
            <label className="field">
              <span>结束日期</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(event) => setDateRange({ ...dateRange, to: event.target.value })}
              />
            </label>
            <button className="primary-button" disabled={isQuerying} onClick={() => void queryAbc()}>
              {isQuerying ? '查询中' : '立即查询'}
            </button>
          </div>
        </section>

        <section className="data-grid">
          <section className="panel data-panel" aria-labelledby="raw-title">
            <div className="panel-heading">
              <h2 id="raw-title">返回数据</h2>
              <div className="segmented">
                <button className="active">JSON</button>
                <button>摘要</button>
                <button>原始文本</button>
              </div>
            </div>
            <div className="response-meta">
              <span>
                状态码: <strong>{queryResult?.raw.statusCode ?? '--'}</strong>
              </span>
              <span>耗时: {queryResult?.raw.latencyMs ?? '--'} ms</span>
              <span>大小: {queryResult ? formatBytes(queryResult.raw.sizeBytes) : '--'}</span>
            </div>
            {operationError ? <div className="error-banner">{operationError}</div> : null}
            <pre className="json-view">{rawJson}</pre>
          </section>

          <section className="panel table-panel" aria-labelledby="normalized-title">
            <div className="panel-heading">
              <h2 id="normalized-title">标准化预览</h2>
              <div className="table-actions">
                <button className="ghost-button compact">导出</button>
                <button className="ghost-button compact">设置</button>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>staff_id</th>
                    <th>staff_name</th>
                    <th>dept_id</th>
                    <th>dept_name</th>
                    <th>title</th>
                    <th>work_no</th>
                    <th>status</th>
                  </tr>
                </thead>
                <tbody>
                  {(queryResult?.normalizedRows ?? []).map((row, index) => (
                    <tr key={row.sourceRecordId || index}>
                      <td>{index + 1}</td>
                      <td>{row.staffId}</td>
                      <td>{row.staffName}</td>
                      <td>{row.departmentId}</td>
                      <td>{row.departmentName}</td>
                      <td>{row.positionName}</td>
                      <td>{row.workNo}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!queryResult ? <div className="empty-state">连接 ABC 后查询接口，标准化结果会显示在这里。</div> : null}
            </div>
            <footer className="pager">
              <span>共 {queryResult?.normalizedRows.length ?? 0} 条</span>
              <button>50 条/页</button>
              <button disabled>上一页</button>
              <strong>1</strong>
              <button disabled>下一页</button>
            </footer>
          </section>
        </section>
      </section>
    </main>
  )
}
