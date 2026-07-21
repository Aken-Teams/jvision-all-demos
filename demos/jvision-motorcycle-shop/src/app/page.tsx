import { MotorcycleShopDemo } from "@/components/motorcycle-shop-demo";

const modules = [
  ["客戶車籍管理", "記錄客戶基本資料、車牌、廠牌車型、行照與保險到期日。"],
  ["維修保養單", "一個畫面完成維修項目、零件、工資、付款與歷史查詢。"],
  ["零件庫存", "零件可設定成本、定價、會員價與安全庫存，低於存量主動提醒。"],
  ["廠牌車型", "建立機車廠牌、車型與常用零件對照，減少手動輸入。"],
  ["付款沖銷", "管理現金、轉帳、賒帳與未收款，快速查詢客戶付款紀錄。"],
  ["員工管理", "記錄維修技師、工資分攤、服務件數與績效統計。"],
  ["報表列印", "日報、月報、維修明細、零件銷售與毛利分析。"],
  ["資料安全", "權限控管、資料備份與成本資料保密，門市經營更安心。"],
];

const scenarios = ["機車維修", "重機保養", "二手機車買賣", "機車改裝", "零件精品", "道路救援"];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含客戶車籍、維修單、零件庫存、付款與報表指標。"],
  ["手機可以使用嗎？", "可以。介面已做 RWD，手機會改成單欄維修工作台。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#modules">功能模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">建立維修單</a>
      </header>

      <section className="hero dispatch-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Motorcycle Shop</p>
          <h1>機車行維修、客戶車籍、零件庫存與毛利分析，一個畫面完成。</h1>
          <p className="hero-text">
            Jvision 協助機車行、重機保養、改裝店與零件精品門市管理客戶資料、車輛維修歷史、
            零件庫存、安全存量、付款沖銷與日月報表，讓櫃台與技師都能快速作業。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看功能</a>
          </div>
        </div>

        <div className="dispatch-preview" aria-label="Jvision motorcycle shop dashboard preview">
          <div className="preview-card main">
            <span>今日維修單</span>
            <strong>26 張</strong>
            <p>待取車 6 台，低庫存 4 項</p>
          </div>
          <div className="preview-card"><span>今日營收</span><strong>NT$ 58K</strong></div>
          <div className="preview-card"><span>毛利率</span><strong>38%</strong></div>
          <div className="preview-card"><span>未收款</span><strong>5 筆</strong></div>
          <div className="preview-card"><span>保險到期</span><strong>9 台</strong></div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>從客戶進店到維修結帳，建立可查詢、可結算、可分析的門市流程。</h2>
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
          <h2>一般機車、重機、改裝與零件門市都能共用同一套資料。</h2>
        </div>
        <div className="scenario-grid">
          {scenarios.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>直接測試客戶車籍、維修單、零件庫存與付款沖銷。</h2>
          <p>可新增客戶車輛、建立維修單、加入零件與工資、更新付款狀態，並即時看到庫存與毛利變化。</p>
        </div>
        <MotorcycleShopDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">經營價值</p>
          <h2>讓維修歷史不漏記、零件庫存不斷料、月底報表不再重算。</h2>
        </div>
        <div className="review-grid">
          {[
            ["接待更快速", "用電話、車牌或姓名查詢客戶，立即看到車輛與維修歷史。"],
            ["庫存更準確", "維修單扣庫存，低於安全量主動提醒補貨。"],
            ["毛利更清楚", "零件成本、工資與收款狀態集中統計，日報月報更快產出。"],
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
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 機車行管理 Demo，示範客戶車籍、維修單、零件庫存、付款沖銷與毛利報表流程。</p>
      </footer>
    </main>
  );
}
