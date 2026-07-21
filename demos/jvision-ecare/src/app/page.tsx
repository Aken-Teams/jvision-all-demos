import { EcareDemo } from "@/components/ecare-demo";

const features = [
  ["長者與床位管理", "掌握入住、床位、照護等級、家屬聯絡與異動紀錄。"],
  ["照護紀錄", "整合生命徵象、用藥、飲食、復健與交班備註。"],
  ["護理交班", "班別交接、待追蹤事項、高風險提醒與即時通知。"],
  ["耗材庫存", "管理紙尿褲、手套、營養品與低庫存補貨提醒。"],
  ["班表人力", "排班、出勤、照服比與人力缺口一眼掌握。"],
  ["帳務收費", "月費、加購服務、耗材費與收款狀態集中管理。"],
  ["品質指標", "跌倒、壓傷、感染與待改善事項視覺化。"],
  ["家屬溝通", "紀錄聯絡、探訪、提醒與照護摘要。"]
];

const faqs = [
  ["為什麼使用長者？", "展示給客戶或家屬看時，「長者」比較直覺、親切，也更容易理解。"],
  ["可以直接測試嗎？", "可以。下方 Demo 可新增長者、建立照護紀錄、切換風險、補庫存、排班與新增帳務。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主選單">
          <a href="#features">功能模組</a>
          <a href="#demo">操作 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero care-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Care Platform</p>
          <h1>智慧照護管理系統，整合長者、照護、庫存與帳務營運</h1>
          <p className="hero-text">
            參考長照機構管理系統架構打造：長者床位、護理照護、跨專業紀錄、耗材庫存、班表人力、收費帳務與品質指標全部可展示。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能模組</a>
          </div>
        </div>
        <div className="clinic-preview" aria-label="Jvision 照護管理預覽">
          <div className="preview-top"><span>Jvision Care</span><strong>入住率 92%</strong></div>
          <div className="clinic-board">
            <span>長者 86</span><span>高風險 9</span><span>交班 14</span><span>低庫存 5</span>
            <strong>今日照護總覽<br />待處理 21</strong>
          </div>
          <div className="preview-bottom"><span>照護紀錄 94</span><span>待處理帳務 7</span></div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">照護管理流程</p>
          <h2>Jvision 將照護機構每日流程整合成一個營運工作台</h2>
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
          <h2>完整操作 Jvision 照護管理 Demo</h2>
          <p>可直接新增資料、切換照護風險、建立交班紀錄、補庫存、排班與新增帳務，呈現真實營運流程。</p>
        </div>
        <EcareDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>從長者入住到每日交班，讓照護資料成為營運決策依據</h2>
        </div>
        <div className="reason-grid">
          {[
            ["照護主管", "掌握高風險長者、班表人力、照服比與品質指標。"],
            ["護理與照服員", "快速建立照護紀錄、交班提醒與待追蹤事項。"],
            ["行政與帳務", "集中管理耗材庫存、月費收款與加購服務帳務。"]
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
          {faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 智慧照護管理 Demo。</p>
      </footer>
    </main>
  );
}
