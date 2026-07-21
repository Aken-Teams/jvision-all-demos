import { TmsDemo } from "@/components/tms-demo";

const features = [
  ["訂單整合", "集中管理配送訂單、客戶、收件地址、溫層、件數與時段需求。"],
  ["智慧調度", "依司機、車輛、區域、載重與時窗快速建立派車任務。"],
  ["路線優化", "用配送順序、公里數與任務密度輔助規劃路線，降低繞路成本。"],
  ["車隊追蹤", "即時查看車輛狀態、配送進度、回報時間與異常事件。"],
  ["電子簽收", "支援簽名、簽單影像、收貨備註與客戶回傳紀錄。"],
  ["行動作業", "司機可在行動端更新取貨、配送中、已簽收與異常狀態。"],
  ["運費結算", "依客戶、區域、件數、里程與加價條件試算運費與應收帳款。"],
  ["管理報表", "掌握準時率、配送量、異常率、車輛利用率與營收趨勢。"],
];

const faqs = [
  ["Demo 可以實際測試嗎？", "可以，Demo 可新增配送單、指派車輛、更新貨態、簽收回傳、建立異常與新增結算。"],
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

      <section className="hero tms-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Transport Management</p>
          <h1>物流派車 物流運輸管理，讓訂單、派車、路線、簽收與結算同步運作</h1>
          <p className="hero-text">
            針對物流、宅配、冷鏈、批發配送與自有車隊，整合配送訂單、任務派遣、路線規劃、貨態回報、電子簽收與運費結算，讓調度中心和司機現場即時同步。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">進入 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision 物流派車儀表板">
          <div className="preview-top">
            <span>Jvision FleetOps</span>
            <strong>準時率 96.4%</strong>
          </div>
          <div className="property-board">
            <span>今日配送 148</span>
            <span>派車中 23</span>
            <span>異常待處理 4</span>
            <span>簽收回傳 112</span>
            <strong>
              配送營運總覽
              <br />
              車輛利用率 82%
            </strong>
          </div>
          <div className="preview-bottom">
            <span>預估里程 1,284 km</span>
            <span>本日運費 NT$ 386K</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">物流管理流程</p>
          <h2>Jvision 把物流訂單、車隊任務、簽收回傳與帳務結算整合成調度工作台</h2>
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
          <h2>直接操作 Jvision 物流派車調度中心</h2>
          <p>新增配送訂單、指派車輛、更新貨態、建立電子簽收、回報異常與新增運費結算，展示完整可測試的 物流派車 工作流程。</p>
        </div>
        <TmsDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>適合需要提高配送透明度與降低調度成本的物流團隊</h2>
        </div>
        <div className="reason-grid">
          {[
            ["調度中心", "快速掌握每台車任務、里程、貨態與異常，減少電話往返確認。"],
            ["司機現場", "在行動端更新取貨、配送、簽收與異常，讓客戶服務同步取得資訊。"],
            ["財務結算", "將客戶、件數、里程與附加費用串接成運費應收資料，縮短對帳時間。"],
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
        <p>Jvision 物流派車管理 Demo，提供線上展示與行銷素材。</p>
      </footer>
    </main>
  );
}
