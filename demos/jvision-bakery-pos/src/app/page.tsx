import { BakeryDemo } from "@/components/bakery-demo";

const modules = [
  ["門市 POS", "快速結帳、會員優惠、電子發票、收銀交班與今日營收一次掌握。"],
  ["商品與價格", "管理麵包、甜點、飲品、禮盒與季節商品，支援多門市價格策略。"],
  ["禮盒預購", "處理節慶禮盒、自由組合、訂金收款、分批取貨與客戶通知。"],
  ["前店後廠", "銷售資料回饋中央廚房，建立生產批次、入庫與門市配送。"],
  ["庫存扣料", "原料安全庫存、商品入出庫、報廢扣料與補貨提醒。"],
  ["會員行銷", "會員累點、生日優惠、LINE 通知與回購名單追蹤。"],
  ["營運看板", "彙整熱銷商品、未收款、低庫存、報廢率與門市營收。"],
  ["AI 摘要", "自動整理今日銷售、庫存風險與建議補貨清單。"],
];

const flow = ["門市銷售", "禮盒預購", "訂金收款", "生產排程", "庫存入出", "報廢扣料", "會員通知", "營運摘要"];

const faqs = [
  ["這是單純的 POS 嗎？", "不是。這個 Demo 同時涵蓋門市收銀、禮盒預購、中央廚房生產、庫存與報廢扣料。"],
  ["可以套用 Jvision 品牌嗎？", "可以，頁面、海報與文件都已統一使用 Jvision 與 Jvision logo。"],
  ["手機和平板可以使用嗎？", "可以，版面支援 RWD，表單、看板、卡片與報表會依螢幕大小自動排列。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
          <span>烘焙 POS 與前店後廠管理</span>
        </a>
        <nav aria-label="主選單">
          <a href="#modules">功能模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero dispatch-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Bakery POS</p>
          <h1>門市結帳、禮盒預購、前店後廠與庫存管理，一套掌握烘焙營運。</h1>
          <p className="hero-text">
            Jvision 協助麵包店、甜點店、中央廚房與多門市烘焙品牌，把門市 POS、商品銷售、禮盒預購、訂金尾款、庫存入出、報廢扣料與 AI 銷售摘要整合成同一個工作台。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看功能</a>
          </div>
        </div>

        <div className="dispatch-preview" aria-label="Jvision bakery POS dashboard preview">
          <div className="preview-card main">
            <span>今日烘焙營收</span>
            <strong>NT$ 86K</strong>
            <p>禮盒預購 18 筆，生產批次 24 盤，報廢率 3.2%。</p>
          </div>
          <div className="preview-card"><span>門市訂單</span><strong>126 筆</strong></div>
          <div className="preview-card"><span>會員回購</span><strong>42%</strong></div>
          <div className="preview-card"><span>待入庫</span><strong>9 項</strong></div>
          <div className="preview-card"><span>低庫存</span><strong>5 項</strong></div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>從前台銷售到後場生產，把烘焙門市每天最容易混亂的流程整理清楚。</h2>
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
          <p className="eyebrow">營運流程</p>
          <h2>適合烘焙門市、甜點品牌、中央廚房與需要預購取貨的零售場景。</h2>
        </div>
        <div className="scenario-grid">
          {flow.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">互動 Demo</p>
          <h2>直接測試新增銷售、建立禮盒、開立生產批次與更新庫存。</h2>
          <p>這不是只有說明文字。你可以新增訂單、建立禮盒、產生生產批次、回收尾款、更新庫存與查看 AI 營運紀錄。</p>
        </div>
        <BakeryDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">營運價值</p>
          <h2>讓店長、收銀、烘焙師與管理者看到同一份最新狀態。</h2>
        </div>
        <div className="review-grid">
          {[
            ["結帳更快速", "門市 POS、會員折扣與禮盒預購整合，減少手寫單與重複輸入。"],
            ["庫存更透明", "銷售、入庫、報廢與扣料同步更新，降低缺貨與過量製作。"],
            ["營運更好追", "每日營收、低庫存、未收款與熱銷品項集中在同一個看板。"],
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
          <strong>Jvision 烘焙 POS 與前店後廠管理 Demo</strong>
        </div>
        <p>把烘焙門市日常流程轉成可測試、可追蹤、可提案的智慧工作台。</p>
      </footer>
    </main>
  );
}
