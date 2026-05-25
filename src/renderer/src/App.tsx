export function App(): React.JSX.Element {
  return (
    <main className="bootstrap-shell">
      <section aria-label="工程状态" className="bootstrap-panel">
        <h1>蒙医云绩效管理</h1>
        <p>工程骨架已建立，业务界面将在设计概念确认后实施。</p>
        <dl>
          <div>
            <dt>阶段</dt>
            <dd>编码准备</dd>
          </div>
          <div>
            <dt>核心约束</dt>
            <dd>规则配置化，计算可追溯</dd>
          </div>
          <div>
            <dt>运行平台</dt>
            <dd>{window.desktopInfo.platform}</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
