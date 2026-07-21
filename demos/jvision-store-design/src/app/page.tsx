import { StoreDesignDemo } from "@/components/store-design-demo";

const features = [
  ["多樣化設計主題", "切換品牌色、版型與首屏文案，快速建立符合品牌調性的網店。"],
  ["直覺式頁面編輯", "用區塊方式調整主視覺、商品、活動、表單與安心購物資訊。"],
  ["手機與電腦都好逛", "桌機、平板、手機都能維持清楚的購物路徑與閱讀層級。"],
  ["快速加入購物車", "商品卡可直接加購、調整數量與完成試算。"],
  ["表單與名單管理", "活動表單、詢價、訂閱名單與會員資料統一收集。"],
  ["搜尋與分享設定", "可編輯搜尋標題、介紹與關鍵字，讓顧客更容易找到商店。"],
  ["商品與庫存", "商品價格、庫存、分類與上架狀態同步管理。"],
  ["訂單與金物流", "結帳、配送、付款與訂單紀錄形成完整營運流程。"]
];

const scenarios = [
  ["品牌官網", "用設計主題與內容區塊快速建立品牌第一印象。"],
  ["活動檔期", "即時換首屏、上活動商品、收集表單名單。"],
  ["行動購物", "手機版維持清楚 CTA，提升加入購物車與詢問轉換。"]
];

const faqs = [
  ["可以直接試著設計商店嗎？", "可以。下方體驗區能切換風格、改文案、加入商品、填寫表單並建立訂單。"],
  ["手機版也能正常購物嗎？", "可以。版面會依照手機、平板與電腦寬度自動調整。"],
  ["能設定搜尋結果顯示的內容嗎？", "可以直接修改商店標題與介紹，並即時預覽顧客在搜尋結果看到的樣子。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">設計功能</a>
          <a href="#demo">功能 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero design-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision 品牌開店工具</p>
          <h1>從品牌首頁到商品結帳，輕鬆建立好逛又好買的網路商店</h1>
          <p className="hero-text">
            選擇喜歡的風格、調整首頁內容、上架商品，再串起購物車、顧客名單與訂單管理，不需要懂程式也能快速開始。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能架構</a>
          </div>
        </div>
        <div className="site-preview" aria-label="Jvision 網店預覽">
          <div className="browser-bar"><span /><span /><span /><strong>jvision.store</strong></div>
          <div className="preview-hero">
            <p>本季新品</p>
            <h2>把自然生活帶回家</h2>
            <button>立即選購</button>
          </div>
          <div className="preview-products">
            <span>商品展示</span><span>顧客名單</span><span>搜尋設定</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">開店設計流程</p>
          <h2>Jvision 把品牌視覺、商品銷售與營運工具整合在同一個網店後台</h2>
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
          <p className="eyebrow">操作體驗</p>
          <h2>直接測試 Jvision 網店設計與開店流程</h2>
          <p>這不是靜態說明頁。你可以改品牌內容、切換風格、加商品到購物車、送出表單並建立訂單。</p>
        </div>
        <StoreDesignDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">適用情境</p>
          <h2>從品牌首頁到活動銷售，讓設計與交易在同一處完成</h2>
        </div>
        <div className="reason-grid">
          {scenarios.map(([title, text]) => (
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
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 網店設計與開店 Demo。</p>
      </footer>
    </main>
  );
}
