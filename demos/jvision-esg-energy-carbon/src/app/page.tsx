import { EsgEnergyCarbonDemo } from "../components/esg-energy-carbon-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  ["能源監控", "整合電表、設備與場域用電，快速掌握即時 kW、月用電與異常狀態。"],
  ["碳盤查資料", "把活動數據、排放係數、直接排放、外購能源排放與供應鏈排放集中管理。"],
  ["ESG 報表", "以 ISO 14064-1 與 GHG Protocol 的邏輯整理排放熱點與查核資料。"],
  ["減碳任務", "從排放來源直接建立改善任務，追蹤節能率、負責人與完成狀態。"],
  ["AI 摘要", "自動整理能源風險、碳排熱點、節能建議與下一步行動。"],
  ["管理儀表板", "讓主管、廠務、行政與永續團隊在同一個畫面協作。"],
];

const modules = [
  ["能源資料中心", "接入設備用電、場域資訊、尖離峰狀態與每月用電。"],
  ["溫室氣體盤查", "管理燃料、外購電力、運輸、廢棄物等活動數據。"],
  ["排放係數管理", "依來源套用係數，清楚標示單位、Scope 與計算結果。"],
  ["改善任務看板", "把高排放來源轉成節能行動，追蹤待評估、執行中與完成。"],
  ["查核資料整理", "彙整場域、負責單位、來源、數據、係數與備查紀錄。"],
  ["AI 決策建議", "快速指出最大排放來源、Scope 佔比與可優先改善的設備。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision ESG 能源與碳管理平台">
          <img src={logoUrl} alt="Jvision logo" />
          <span>ESG 能源與碳管理平台</span>
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">功能模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#modules">平台架構</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section id="top" className="hero">
        <div>
          <p className="eyebrow">Jvision ESG Energy & Carbon Platform</p>
          <h1>把能源監控、碳盤查、減碳任務與 AI 摘要整合成一個管理平台。</h1>
          <p className="hero-text">
            Jvision 協助企業把電表設備、用電異常、活動數據、排放分類、查核資料與節能改善任務放在同一個工作台，
            讓 ESG、廠務、行政與管理團隊可以一起看見風險並追蹤改善。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>

        <div className="hero-dashboard" aria-label="Jvision ESG 儀表板預覽">
          <div className="dashboard-top">
            <span />
            <span />
            <span />
            <strong>Jvision ESG Console</strong>
          </div>
          <div className="hero-metrics">
            <article className="hero-metric"><span>年度排放量</span><strong>29.62 tCO2e</strong></article>
            <article className="hero-metric"><span>即時用電</span><strong>314 kW</strong></article>
            <article className="hero-metric"><span>預估節能</span><strong>13%</strong></article>
            <article className="chart-card">
              <div className="bar"><strong>直接排放</strong><i style={{ width: "38%" }} /><span>6.01</span></div>
              <div className="bar"><strong>外購能源排放</strong><i style={{ width: "86%" }} /><span>21.14</span></div>
              <div className="bar"><strong>供應鏈排放</strong><i style={{ width: "28%" }} /><span>2.47</span></div>
            </article>
            <article className="standard-card">
              <div><strong>ISO 14064-1</strong><span>盤查資料與查核準備</span></div>
              <div><strong>能源熱點</strong><span>空調、空壓、照明與尖峰負載</span></div>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>從用電數據到碳排決策，讓永續管理更容易落地。</h2>
          <p>這個整合版把「組織溫室氣體盤查平台」與「能源管理系統」合併成新的獨立 Demo，原有展示仍保留。</p>
        </div>
        <div className="feature-grid">
          {features.map(([title, text]) => (
            <article className="feature-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="demo" className="demo-section">
        <div className="section-heading">
          <p className="eyebrow">Live Demo</p>
          <h2>可以新增盤查資料、接入能源設備、切換狀態、建立節能任務與生成 AI 摘要。</h2>
          <p>下方不是靜態說明，而是可直接操作的線上展示工作台。</p>
        </div>
        <EsgEnergyCarbonDemo />
      </section>

      <section id="modules" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">平台架構</p>
          <h2>適合 ESG、廠務、行政與營運主管共同使用。</h2>
          <p>每個模組都圍繞真實工作流程設計，讓資料蒐集、排放計算、能源改善和管理決策能接在一起。</p>
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
          <h2>讓能源管理和碳管理不再分開做。</h2>
          <p>透過同一個平台掌握用電、排放、熱點、任務與 AI 建議，協助企業更快完成 ESG 管理閉環。</p>
        </div>
        <a className="primary-button" href="#demo">進入 Demo</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision logo" />
        <span>Jvision ESG 能源與碳管理平台 Demo</span>
      </footer>
    </main>
  );
}
