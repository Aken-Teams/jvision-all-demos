import MaintenanceDemo from "../components/maintenance-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const capabilities = [
  ["01", "設備履歷", "集中管理設備位置、責任人、保養週期、維修紀錄與備品資訊。"],
  ["02", "故障通報", "現場可快速建立異常工單，主管能即時分派與追蹤狀態。"],
  ["03", "巡檢保養", "把例行巡檢、週期保養、停機窗口與人員班表放在同一個計畫視圖。"],
  ["04", "MTBF / MTTR", "即時計算平均故障間隔與平均修復時間，掌握設備可靠度。"],
  ["05", "備品管理", "追蹤維修用料、安全庫存、外包費用與停機成本。"],
  ["06", "AI 摘要", "整理高風險設備、逾期工單、今日優先處理清單與保養建議。"],
];

const sourceProjects = [
  ["設備維護", "報修、巡檢、保養與備品管理流程。"],
  ["智慧設備維護與預防保養", "設備履歷、維修請求、預防保養、MTBF / MTTR 與 AI 維護摘要。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
          <span>設備維護整合平台</span>
        </a>
        <nav aria-label="主選單">
          <a href="#features">功能模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#source">整合來源</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Equipment Maintenance Suite</p>
          <h1>把報修、巡檢、保養、備品與 AI 維護摘要整合成一個設備管理平台。</h1>
          <p className="hero-text">
            這個新版本合併「設備維護」與「智慧設備維護與預防保養」兩個方向，
            讓工廠、門市、物流與總務團隊可以在同一個工作台完成通報、派工、保養與績效追蹤。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>

        <div className="hero-console" aria-label="Jvision 設備維護示意畫面">
          <div className="console-top">
            <span />
            <span />
            <span />
            <strong>Jvision Maintenance Control</strong>
          </div>
          <div className="warehouse-board">
            <article className="hero-metric"><span>未完成工單</span><strong>18</strong></article>
            <article className="hero-metric"><span>保養完成率</span><strong>94%</strong></article>
            <article className="hero-metric"><span>平均修復</span><strong>2.6h</strong></article>
            <article className="stock-card">
              <div><b>CNC-03</b><span>主軸溫度異常</span><i style={{ width: "82%" }} /></div>
              <div><b>PACK-02</b><span>本週預防保養</span><i style={{ width: "58%" }} /></div>
              <div><b>AOI-01</b><span>光源校正完成</span><i style={{ width: "72%" }} /></div>
            </article>
            <article className="route-card">
              <strong>今日工作</strong>
              <span>巡檢 7 台</span>
              <span>保養 4 台</span>
              <span>驗收 2 單</span>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">整合功能</p>
          <h2>從設備異常到預防保養，把維護工作變成可追蹤的管理流程。</h2>
          <p>同時涵蓋日常報修、巡檢保養、備品成本、設備績效與 AI 摘要，不是只有靜態介紹。</p>
        </div>
        <div className="feature-grid">
          {capabilities.map(([index, title, text]) => (
            <article className="feature-card" key={title}>
              <b>{index}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="demo" className="demo-section">
        <div className="section-heading">
          <p className="eyebrow">Live Demo</p>
          <h2>新增維修通報、推進工單、安排保養、查看 MTBF / MTTR 與產生 AI 摘要。</h2>
          <p>你可以直接操作流程，測試設備異常從通報到驗收的完整管理方式。</p>
        </div>
        <MaintenanceDemo logoUrl={logoUrl} />
      </section>

      <section id="source" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">合併來源</p>
          <h2>整合既有流程，形成一個更完整的管理工作台。</h2>
        </div>
        <div className="module-grid source-grid">
          {sourceProjects.map(([title, text]) => (
            <article className="module-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 設備維護整合平台 Demo</span>
      </footer>
    </main>
  );
}
