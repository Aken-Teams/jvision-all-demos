import { EducationCareDemo } from "@/components/education-care-demo";

const modules = [
  ["招生 CRM", "記錄家長諮詢、試讀、報名與追蹤狀態，讓招生流程不漏接。"],
  ["學童名冊", "集中管理學童資料、家長聯絡方式、班級與照護注意事項。"],
  ["排課出勤", "安排班級課表、老師教室與每日到校、請假、接送狀態。"],
  ["收費財務", "追蹤月費、材料費、餐點費與逾期款項，降低人工對帳負擔。"],
  ["電子聯絡簿", "快速產生日常通知、接送提醒與家長回覆紀錄。"],
  ["園務報表", "用儀表板看人數、出勤、未收款與待處理事項。"],
  ["人事薪資", "管理老師排班、工時與薪資試算，掌握人力配置。"],
  ["AI 摘要", "整理今天出勤、收費、聯絡簿與優先待辦，協助主任快速決策。"],
];

const scenarios = ["幼兒園", "安親班", "補習班", "才藝教室", "托育中心", "課後照顧"];

const faqs = [
  ["這是單純的課程平台嗎？", "不是。這個 Demo 聚焦在幼教、安親與課後照顧的日常營運，包含招生、班務、出勤接送、收費與家長溝通。"],
  ["可以把名稱改成 Jvision 嗎？", "可以，頁面已統一使用 Jvision 品牌與 Jvision logo。"],
  ["手機和平板可以操作嗎？", "可以，版面已支援 RWD，表單、卡片、看板與報表會依螢幕大小自動調整。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
          <span>幼教園務與安親管理平台</span>
        </a>
        <nav aria-label="主選單">
          <a href="#modules">功能模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero care-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Education Operations</p>
          <h1>招生、學童、排課、接送、收費與聯絡簿，一套掌握園務日常。</h1>
          <p className="hero-text">
            Jvision 協助幼兒園、安親班、補習班與課後照顧中心，把招生追蹤、學童名冊、出勤接送、班級排課、收費提醒、家長通知與 AI 摘要整合在同一個工作台。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看功能</a>
          </div>
        </div>

        <div className="care-preview" aria-label="Jvision 幼教園務儀表板預覽">
          <div className="preview-card main">
            <span>今日到校率</span>
            <strong>94%</strong>
            <p>32 位已到校，4 位請假，3 位等待接送確認。</p>
          </div>
          <div className="preview-card">
            <span>未收款項</span>
            <strong>18 筆</strong>
          </div>
          <div className="preview-card">
            <span>聯絡簿通知</span>
            <strong>42 則</strong>
          </div>
          <div className="preview-card">
            <span>今日課程</span>
            <strong>7 堂</strong>
          </div>
          <div className="preview-card">
            <span>待接送確認</span>
            <strong>5 位</strong>
          </div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>把園務、班務、收費與家長溝通放進同一個清楚可追蹤的工作流程。</h2>
        </div>
        <div className="module-grid">
          {modules.map(([title, text], index) => (
            <article className="module-card" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scenario-band">
        <div className="section-heading">
          <p className="eyebrow">適用場景</p>
          <h2>適合需要同時管理孩子、家長、老師與收費流程的教育服務單位。</h2>
        </div>
        <div className="scenario-grid">
          {scenarios.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">互動 Demo</p>
          <h2>直接測試新增學童、更新出勤、建立課程與發送家長通知。</h2>
          <p>這不是只有說明文字，而是可以操作的線上展示。你可以新增學童、變更到校狀態、建立課程、產生聯絡簿訊息，並即時看到 KPI 更新。</p>
        </div>
        <EducationCareDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">營運價值</p>
          <h2>讓主任、行政、老師與家長看到同一份最新狀態。</h2>
        </div>
        <div className="review-grid">
          {[
            ["行政更省時", "招生、收費與聯絡簿集中處理，減少重複輸入與人工查表。"],
            ["老師更清楚", "班級、出勤、接送與通知集中在看板上，每天要處理的事項一眼看懂。"],
            ["家長更安心", "到校、請假、接送與通知紀錄可以即時更新，溝通更透明。"],
          ].map(([title, text]) => (
            <article className="review-card" key={title}>
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
        <div className="footer-brand">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
          <strong>Jvision 幼教園務與安親管理平台 Demo</strong>
        </div>
        <p>把教育機構的日常流程轉成可操作、可追蹤、可提案的智慧工作台。</p>
      </footer>
    </main>
  );
}
