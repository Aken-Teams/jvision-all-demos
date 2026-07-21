import { ConstructionErpDemo } from "@/components/construction-erp-demo";

const features = [
  ["工程專案主檔", "集中管理建案、業主、預算、進度、合約狀態與專案負責人。"],
  ["採購與用料", "紀錄材料進貨、領料、供應商與已掛帳成本，避免採買資訊分散。"],
  ["工班出勤", "登錄每日出工、人數、工項與工時，快速回推人力成本與施工進度。"],
  ["報價與合約", "建立工程報價、追加減項、合約金額與收款節點，降低漏報漏收。"],
  ["成本控管", "把材料、工資、外包與雜支併入專案損益，掌握預算差異。"],
  ["現場回報", "用同一個工作台追蹤待處理項目、照片備註與施工狀態。"],
  ["會計銜接", "支援請款、應收、應付與掛帳紀錄，協助後台關帳。"],
  ["管理報表", "即時查看毛利率、待收款、進度落差與高風險工程案。"],
];

const faqs = [
  ["Demo 可以操作什麼？", "可以新增工程案、材料進貨、出工紀錄、報價單與收款結算，並即時更新成果數據。"],
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

      <section className="hero erp-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision 營建工程管理</p>
          <h1>營建工程 工程管理，把專案、採購、出工、報價與成本接成一條線</h1>
          <p className="hero-text">
            針對營造、裝修、機電與工程承攬團隊，整合建案主檔、材料進貨、工班出勤、報價合約、已掛帳成本與收款結算，讓現場與辦公室使用同一份資料。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">進入 Demo</a>
            <a className="secondary-button" href="#features">查看模組</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision 營建 工程管理 儀表板">
          <div className="preview-top">
            <span>Jvision BuildOps</span>
            <strong>預算使用 68%</strong>
          </div>
          <div className="property-board">
            <span>進行中建案 12</span>
            <span>今日出工 86</span>
            <span>採購待驗 9</span>
            <span>待請款 5</span>
            <strong>
              工程營運總覽
              <br />
              毛利率 24.8%
            </strong>
          </div>
          <div className="preview-bottom">
            <span>已掛帳 NT$ 8.6M</span>
            <span>本月請款 NT$ 12.4M</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">工程管理流程</p>
          <h2>Jvision 將營建公司的專案、料、工、報價與帳務整合為單一作業平台</h2>
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
          <h2>直接操作 Jvision 營建 工程管理 工作台</h2>
          <p>新增工程案、採購材料、登錄出工、建立報價與新增請款結算，成果數據會立即同步更新，展示完整的營建工程管理測試流程。</p>
        </div>
        <ConstructionErpDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>適合需要管控工地、採購、合約與成本的工程團隊</h2>
        </div>
        <div className="reason-grid">
          {[
            ["老闆看總表", "快速掌握每個建案的預算使用、毛利率、應收款與高風險項目。"],
            ["工務管現場", "每日出工、材料到貨、施工狀態與待處理事項可在同一處更新。"],
            ["會計對帳", "報價、合約、應收、應付與掛帳資料直接串接，縮短月底整理時間。"],
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
        <p>Jvision 營建 工程管理 Demo，提供線上展示與行銷素材。</p>
      </footer>
    </main>
  );
}
