import { WorkDemo } from "@/components/work-demo";

const features = [
  ["AI 工作摘要", "自動整理專案進度、待處理事項與風險提醒，讓主管快速掌握現況。"],
  ["任務與負責人", "集中管理任務、負責人、截止日、優先順序與工時，降低漏追蹤的機率。"],
  ["專案看板", "用拖拉式流程呈現任務狀態，團隊可以清楚知道每件事卡在哪裡。"],
  ["目標追蹤", "把日常任務連到季度目標，進度更新時自動同步成果數據。"],
  ["工作負荷", "查看每位成員的工時分配，及早調整過載或閒置狀態。"],
  ["自動化規則", "高優先任務、逾期提醒與狀態變更可自動觸發通知或專案更新。"],
  ["報告輸出", "將專案進度、完成率與風險整理成可分享的管理報告。"],
  ["整合工具", "可延伸串接 Google、Microsoft、Slack、Zoom、Jira 與 BI 報表。"]
];

const views = [
  ["清單", "適合快速瀏覽所有任務、負責人、截止日與優先順序。"],
  ["看板", "用欄位呈現任務流程，清楚看到待整理、進行中、審核中與已完成。"],
  ["行事曆", "依日期查看任務與里程碑，方便安排會議、交付與上線時程。"],
  ["時程表", "把任務依週期排開，協助團隊看見相依關係與交付順序。"],
  ["目標", "追蹤專案成果、完成率與工作負荷，讓日常工作連到團隊目標。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主選單">
          <a href="#features">功能</a>
          <a href="#demo">Demo</a>
          <a href="#views">檢視</a>
          <a href="#contact">諮詢</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Work Management</p>
          <h1>讓團隊任務、專案進度與目標管理更清楚</h1>
          <p className="hero-text">
            Jvision 工作管理平台協助團隊集中管理任務、看板、目標、工作負荷與 AI 摘要，讓每個人都知道下一步該做什麼。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能模組</a>
          </div>
        </div>
        <div className="hero-board" aria-label="Jvision 專案看板預覽">
          <div className="board-top">
            <span />
            <span />
            <span />
            <strong>Jvision 專案計畫</strong>
          </div>
          <div className="board-grid">
            {[
              ["待整理", "需求盤點", "客戶回饋整理"],
              ["進行中", "首頁設計", "任務自動化"],
              ["審核中", "AI 摘要", "報告內容校對"],
              ["已完成", "上線檢查", "權限設定"]
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
          <p className="eyebrow">完整功能</p>
          <h2>把任務、專案、目標與工作負荷放在同一個工作台</h2>
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
          <h2>完整功能 Demo 測試</h2>
          <p>可新增任務、移動看板卡片、生成 AI 摘要、平衡工作量，所有數據都會即時更新。</p>
        </div>
        <WorkDemo />
      </section>

      <section className="views" id="views">
        <div className="section-heading">
          <p className="eyebrow">專案檢視</p>
          <h2>依照不同工作情境切換檢視方式</h2>
        </div>
        <div className="view-grid">
          {views.map(([view, text]) => (
            <article className="view-card" key={view}>
              <strong>{view}</strong>
              <span>{text}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="contact" id="contact">
        <div>
          <p className="eyebrow">Jvision AI</p>
          <h2>讓專案管理更適合你的團隊</h2>
          <p>可依團隊流程調整任務欄位、通知規則、報告格式與 AI 摘要內容。</p>
        </div>
        <a className="primary-button" href="#demo">回到 Demo</a>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 工作管理平台 Demo，協助團隊更清楚地協作、追蹤與完成目標。</p>
      </footer>
    </main>
  );
}
