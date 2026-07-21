import { BiAnalyticsDemo } from "@/components/bi-analytics-demo";

const features = [
  ["資料連接", "連接 ERP、CRM、電商、試算表與資料倉儲，建立跨部門資料集。"],
  ["語意模型", "用業務語言定義指標、維度、權限與計算邏輯，建立單一事實來源。"],
  ["AI 洞察", "用自然語言詢問資料、生成摘要、找出異常與建立分析敘事。"],
  ["互動報表", "用卡片、長條圖、趨勢圖、漏斗與地圖呈現 KPI，支援篩選與鑽取。"],
  ["自助 BI", "讓業務與主管可自行探索資料，不必每次都等待 IT 製作報表。"],
  ["報表分享", "發布儀表板、產生分享連結、嵌入內部系統或週會簡報。"],
  ["治理安全", "管理資料權限、敏感欄位、發布審核、刷新紀錄與使用者存取。"],
  ["行動決策", "讓主管在手機、平板與會議中即時查看最新數據與 AI 建議。"],
];

const faqs = [
  ["Demo 可以操作什麼？", "可以匯入資料集、切換指標、詢問 AI、產生報表、發布分享與建立治理紀錄。"],
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

      <section className="hero bi-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision BI Analytics</p>
          <h1>BI 分析平台，把資料連接、AI 洞察、互動報表與治理分享整合成決策中心</h1>
          <p className="hero-text">
            面向管理者、資料團隊、業務與營運部門，Jvision 將資料來源、語意模型、AI 問答、互動儀表板、報表分享與權限治理集中到同一個分析工作台。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">進入 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision BI 分析儀表板">
          <div className="preview-top">
            <span>Jvision Insight Hub</span>
            <strong>營收 +18%</strong>
          </div>
          <div className="property-board">
            <span>資料集 42</span>
            <span>報表 128</span>
            <span>AI 問答 306</span>
            <span>已發布 37</span>
            <strong>
              BI Command Center
              <br />
              決策命中率 92%
            </strong>
          </div>
          <div className="preview-bottom">
            <span>刷新成功 99.4%</span>
            <span>治理警示 3</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">Analytics Modules</p>
          <h2>Jvision 將企業數據從匯入、建模、分析到分享治理串成完整 BI 流程</h2>
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
          <p className="eyebrow">Live Demo</p>
          <h2>直接操作 Jvision BI 分析工作台</h2>
          <p>匯入資料集、切換 KPI 指標、詢問 AI、產生報表、發布分享與建立治理紀錄，展示完整可測試的商業智慧流程。</p>
        </div>
        <BiAnalyticsDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>適合想建立資料驅動文化與單一事實來源的企業團隊</h2>
        </div>
        <div className="reason-grid">
          {[
            ["主管決策", "用即時 KPI、AI 摘要與趨勢圖快速掌握營運變化。"],
            ["資料團隊", "將資料集、模型、刷新與治理集中管理，降低報表口徑不一致。"],
            ["業務營運", "自行探索客戶、銷售、庫存與行銷資料，縮短分析等待時間。"],
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
        <p>Jvision BI 分析平台 Demo，提供線上展示與行銷素材。</p>
      </footer>
    </main>
  );
}
