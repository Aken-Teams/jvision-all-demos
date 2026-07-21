import { WorkProjectDemo } from "@/components/work-project-demo";

const features = [
  ["專案排程", "管理里程碑、截止日與交付風險，讓每個專案都有清楚節奏。"],
  ["任務看板", "用待辦、進行中、審核與完成狀態追蹤工作，不再散落在聊天紀錄裡。"],
  ["工作負荷", "即時看見每位成員的工時與壓力，協助主管重新分派。"],
  ["目標追蹤", "把 KPI、交付成果與進度放在同一個工作畫面。"],
  ["AI 摘要", "自動整理高風險任務、延期原因、下一步建議與會議摘要。"],
  ["自動化規則", "依照任務狀態、截止日與優先級觸發提醒與流程推進。"],
  ["管理報告", "彙整專案、任務、資源與績效，快速輸出週報與主管視圖。"],
  ["跨部門協作", "讓 PM、業務、設計、工程與客服在同一個節奏裡工作。"],
];

const sourceProjects = [
  ["專案管理", "排程、預算、簽核、現場與跨部門追蹤。"],
  ["任務管理", "待辦清單、看板、甘特、依賴關係與進度回報。"],
  ["工作管理平台", "工作負荷、目標、規則、自動化與 AI 摘要。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
          <span>工作與專案管理平台</span>
        </a>
        <nav aria-label="主選單">
          <a href="#features">功能模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#source">整合來源</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Work & Project Suite</p>
          <h1>把專案、任務、目標與工作負荷，整合成一個 AI 工作管理平台。</h1>
          <p className="hero-text">
            Jvision 將專案管理、任務管理與工作管理平台合併成完整 Demo，
            讓團隊可以從同一個畫面掌握排程、看板、工時、目標、提醒與 AI 摘要。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="hero-board" aria-label="Jvision 工作管理預覽">
          <div className="board-top">
            <span />
            <span />
            <span />
            <strong>Jvision Launch Plan</strong>
          </div>
          <div className="board-grid">
            {[
              ["準備處理", "需求盤點", "資料整備"],
              ["正在進行", "首頁設計", "流程串接"],
              ["等待確認", "AI 摘要規則", "QA 檢查"],
              ["已完成", "上線檢查", "報表輸出"],
            ].map(([stage, first, second]) => (
              <div key={stage}>
                <b>{stage}</b>
                <article>{first}</article>
                <article>{second}</article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="section-heading">
          <p className="eyebrow">整合功能</p>
          <h2>從專案啟動到每日工作推進，主管與團隊都能看懂下一步。</h2>
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

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">Live Demo</p>
          <h2>可以新增任務、推進看板、平衡工時、更新目標與產生 AI 摘要。</h2>
          <p>這不是單純說明頁，而是可直接操作的線上展示。</p>
        </div>
        <WorkProjectDemo />
      </section>

      <section className="source-section" id="source">
        <div className="section-heading">
          <p className="eyebrow">合併來源</p>
          <h2>整合多個工程流程，形成一個更完整的管理工作台。</h2>
        </div>
        <div className="source-grid">
          {sourceProjects.map(([title, text]) => (
            <article key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
          <strong>Jvision 工作與專案管理平台 Demo</strong>
        </div>
        <p>整合專案、任務、工作負荷、目標、自動化與 AI 摘要的展示平台。</p>
      </footer>
    </main>
  );
}
