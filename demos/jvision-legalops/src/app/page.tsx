import { LegalOpsDemo } from "@/components/legalops-demo";

const features = [
  ["案件主檔", "集中管理案號、當事人、案由、承辦律師、進度與重要文件。"],
  ["庭期管理", "記錄開庭日期、法院、股別、提醒時間與出庭人員。"],
  ["待辦回報", "分派工作事項、追蹤處理狀態、回報完成內容與附件備註。"],
  ["強制提醒", "對庭期、期限、待辦、契約與請款建立多層提醒，降低逾期風險。"],
  ["團隊行事曆", "用日曆視角整合個人、案件與團隊行程，方便主管查看負載。"],
  ["工時紀錄", "紀錄律師與助理投入時間，支援案件成本與收費依據。"],
  ["請款管理", "彙整委任費、階段款、代墊款與已收款，協助事務所對帳。"],
  ["行動工作台", "支援手機瀏覽與現場回報，讓外出開庭也能更新案件資訊。"],
];

const faqs = [
  ["Demo 可以操作什麼？", "可以新增案件、庭期、待辦、工時、提醒通知與請款紀錄。"],
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

      <section className="hero legal-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision 法律事務管理</p>
          <h1>法律案件管理平台，把案件、庭期、待辦、工時與請款整合到同一個工作台</h1>
          <p className="hero-text">
            面向律師事務所、法務部門與案件型服務團隊，集中管理案件主檔、庭期提醒、工作事項、團隊行事曆、工時紀錄與請款狀態，讓每個期限都有清楚負責人。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">進入 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision 法律案件儀表板">
          <div className="preview-top">
            <span>Jvision LegalOps</span>
            <strong>本週庭期 18</strong>
          </div>
          <div className="property-board">
            <span>進行中案件 64</span>
            <span>待辦逾期 3</span>
            <span>今日提醒 12</span>
            <span>待請款 7</span>
            <strong>
              案件事務總覽
              <br />
              準時完成率 94%
            </strong>
          </div>
          <div className="preview-bottom">
            <span>本月工時 326h</span>
            <span>應收 NT$ 1.28M</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">法律事務模組</p>
          <h2>Jvision 把事務所日常的案件、期限、工作回報與帳務整合為可操作流程</h2>
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
          <h2>直接操作 Jvision 法律案件工作台</h2>
          <p>新增案件、建立庭期、分派待辦、登錄工時、發送提醒與新增請款，展示不是靜態說明，而是可測試的事務所管理流程。</p>
        </div>
        <LegalOpsDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>適合法律事務所、公司法務與案件型服務團隊</h2>
        </div>
        <div className="reason-grid">
          {[
            ["期限控管", "庭期、答辯期限、合約到期與請款節點都能建立提醒。"],
            ["團隊協作", "主管可查看承辦律師、助理與案件待辦，降低資訊落差。"],
            ["案件收益", "工時、代墊與請款紀錄集中管理，讓案件成本與收入更透明。"],
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
        <p>Jvision 法律案件管理 Demo，提供線上展示與行銷素材。</p>
      </footer>
    </main>
  );
}
