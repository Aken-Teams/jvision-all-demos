import SrmDemo from "../components/srm-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  ["01", "供應商生命週期", "從註冊、資格文件、等級評鑑到資料異動，建立集中化供應商主檔。"],
  ["02", "請購與採購流程", "管理請購申請、採購立案、案件分派、審核追蹤與預算控管。"],
  ["03", "詢報價與競標", "把詢價、比價、議價、線上投標、開標與決標流程系統化。"],
  ["04", "訂單交期管理", "串接採購訂單、供應商確認、交貨計畫、出貨通知與驗收追蹤。"],
  ["05", "履約與文件管理", "集中管理合約、驗收文件、付款條件、改善要求與往來紀錄。"],
  ["06", "供應商品質管理", "追蹤評鑑、稽核、異常改善、分級策略與供應商績效。"],
  ["07", "ERP 與系統整合", "銜接供應商主檔、料品、請購單、採購單、驗收與財務資料。"],
  ["08", "AI 採購協作", "自動整理報價差異、交期風險、履約狀態與採購摘要。"]
];

const modules = [
  ["供應商入口", "供應商登入、資料維護、文件上傳、報價回覆、訂單確認與交期回覆。"],
  ["採購案件管理", "採購立案、公告發布、簽核控管、案件進度與資料歸檔。"],
  ["電子競標", "線上出價、競價大廳、截止時間、報價紀錄與決標流程。"],
  ["訂單交期", "PO 確認、交貨計畫、出貨通知、收退貨查詢與驗收追蹤。"],
  ["履約管理", "合約里程碑、驗收文件、付款條件、變更紀錄與履約狀態。"],
  ["品質管理", "資格審查、供應商評鑑、稽核改善與績效分級。"],
  ["支出分析", "依品類、部門、專案與供應商角度掌握採購成本。"],
  ["風險管理", "追蹤供應集中度、關鍵物料依賴、交期延遲與文件效期。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">平台能力</a>
          <a href="#demo">功能 Demo</a>
          <a href="#modules">模組架構</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section id="top" className="hero">
        <div>
          <p className="eyebrow">SRM / 採購協作 / 供應商入口</p>
          <h1>Jvision 採購供應商協作平台</h1>
          <p className="hero-text">
            把供應商資料、詢報價、電子競標、訂單交期、履約驗收與 ERP 資料串接成同一條採購協作流程，降低 Email、Excel 與人工追蹤成本。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開啟採購 Demo</a>
            <a className="secondary-button" href="#features">查看平台能力</a>
          </div>
        </div>

        <div className="hero-console" aria-label="Jvision 採購協作工作台預覽">
          <div className="console-top">
            <span />
            <span />
            <span />
            <strong>Jvision 採購協作工作台</strong>
          </div>
          <div className="hero-grid">
            <article className="hero-metric"><span>進行中案件</span><strong>36</strong></article>
            <article className="hero-metric"><span>供應商回覆率</span><strong>92%</strong></article>
            <article className="hero-metric"><span>交期風險</span><strong>7</strong></article>
            <article className="flow-card">
              <div className="flow-row"><strong>詢價回覆</strong><div className="flow-track"><i style={{ width: "82%" }} /></div><span>82%</span></div>
              <div className="flow-row"><strong>訂單確認</strong><div className="flow-track"><i style={{ width: "68%" }} /></div><span>68%</span></div>
              <div className="flow-row"><strong>履約驗收</strong><div className="flow-track"><i style={{ width: "54%" }} /></div><span>54%</span></div>
            </article>
            <article className="supplier-card">
              <div><strong>供應商入口</strong><span>報價、文件、交期回覆</span></div>
              <div><strong>採購內控</strong><span>簽核、稽核、紀錄追溯</span></div>
              <div><strong>AI 摘要</strong><span>差異、風險、建議</span></div>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">平台能力</p>
          <h2>從採購立案到履約驗收，讓內外部協作都有紀錄可追</h2>
          <p>Jvision 將供應商管理、採購案件、詢報價競標、訂單交期、履約文件、風險提醒與系統介接整合，補足 ERP 在外部供應商協作上的缺口。</p>
        </div>
        <div className="feature-grid">
          {features.map(([index, title, text]) => (
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
          <p className="eyebrow">可操作 Demo</p>
          <h2>建立採購案件、比較供應商報價、追蹤交期風險</h2>
          <p>下方可以新增採購案件、推進案件狀態、查看報價比較與風險排序，並讓 AI 產生今日採購協作摘要。</p>
        </div>
        <SrmDemo logoUrl={logoUrl} />
      </section>

      <section id="modules" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">模組架構</p>
          <h2>依企業採購成熟度分階段導入</h2>
          <p>可從供應商入口與採購案件開始，逐步延伸到電子競標、訂單交期、履約管理、品質評鑑、支出分析與供應鏈風險管理。</p>
        </div>
        <div className="module-grid">
          {modules.map(([title, text]) => (
            <article className="module-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact">
        <div>
          <p className="eyebrow">Jvision Demo</p>
          <h2>把採購流程從人工追蹤，升級成供應商協作網路</h2>
          <p>適合展示電子採購、供應商入口、詢報價競標、訂單交期、履約驗收與 AI 採購協作。</p>
        </div>
        <a className="primary-button" href="#demo">立即測試</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 採購供應商協作平台 Demo</span>
      </footer>
    </main>
  );
}
