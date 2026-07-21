import { EmsDemo } from "@/components/ems-demo";

const features = [
  ["智慧電表監測", "即時掌握每個場域目前用電、今日累計用電與設備是否正常在線。"],
  ["能源儀表板", "用大樓、樓層、設備與時段查看用電趨勢、尖峰需量與節電成效。"],
  ["節能策略", "設定空調、照明與設備排程，遇到尖峰時自動提醒或啟用節能模式。"],
  ["異常告警", "自動提醒需量超標、設備離線、用電突然升高與設定被異動的狀況。"],
  ["碳排估算", "依照用電量換算碳排放量，協助整理碳盤查與永續報告需要的資料。"],
  ["能源報表", "自動產出每日、每月、節電比較與設備耗能排行，讓改善成果看得見。"],
  ["多場域管理", "適合校園、大樓、工廠、連鎖門市與社區一次管理多個用電場域。"],
  ["系統串接", "可串接碳管理、設備控制、現場看板與企業內部管理系統。"],
];

const faqs = [
  ["Demo 可以操作什麼？", "可以新增電表、更新讀值、建立告警、套用節能策略、計算碳排與產生能源報表。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主選單">
          <a href="#features">功能架構</a>
          <a href="#demo">互動 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">開始測試</a>
      </header>

      <section className="hero ems-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision 能源管理</p>
          <h1>能源管理系統，整合智慧電表、用電趨勢、節能控制與碳排管理</h1>
          <p className="hero-text">
            面向校園、大樓、工廠、連鎖門市與社區場域，Jvision 以智慧電表與感測資料為核心，集中監控用電、告警、節能策略、碳排估算與能源報表。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">進入 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision 能源管理儀表板">
          <div className="preview-top">
            <span>Jvision 能源營運中心</span>
            <strong>節電率 14.8%</strong>
          </div>
          <div className="property-board">
            <span>目前總用電 428 kW</span>
            <span>今日累計 3,860 度</span>
            <span>待處理告警 5 件</span>
            <span>今日碳排 1.92 公噸 CO2e</span>
            <strong>
              能源營運總覽
              <br />
              今日最高需量 612 kW
            </strong>
          </div>
          <div className="preview-bottom">
            <span>設備在線率 98%</span>
            <span>預估本月省 NT$ 186,000</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">能源管理模組</p>
          <h2>Jvision 把能源資料從量測、分析、控制到碳排報告串成完整淨零管理流程</h2>
        </div>
        <div className="tech-grid">
          {features.map(([title, text], index) => (
            <article className="tech-card" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">互動展示</p>
          <h2>直接操作 Jvision 能源管理工作台</h2>
          <p>新增電表、更新用電讀值、建立告警、套用節能策略、估算碳排與產生能源報表。頁面中的 kW 代表目前用電負載，度代表累計用電量。</p>
        </div>
        <EmsDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">適用場景</p>
          <h2>適合需要節能、需量控制與碳盤查資料的企業場域</h2>
        </div>
        <div className="reason-grid">
          {[
            ["設備管理", "即時查看電表與設備狀態，掌握異常耗能與連線問題。"],
            ["節能營運", "用排程與需量策略降低尖峰用電，讓節電成效可視化。"],
            ["永續報告", "將用電與碳排資料自動化整理，支援盤查與管理報告。"],
          ].map(([title, text]) => (
            <article className="reason-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="faq" id="faq">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h2>常見問題</h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 能源管理系統 Demo，提供線上展示與行銷素材。</p>
      </footer>
    </main>
  );
}
