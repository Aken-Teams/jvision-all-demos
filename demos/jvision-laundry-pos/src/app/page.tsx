import { LaundryDemo } from "@/components/laundry-demo";

const modules = [
  ["基本設定", "員工、衣服項目、會員類別、協力洗衣廠、收支科目與公司資料集中維護。"],
  ["客戶資料", "建立客戶姓名、電話、會員等級、地址、未收款與歷史送洗紀錄。"],
  ["送洗登錄", "快速建立收件單，記錄衣服類別、洗法、顏色、特徵、注意事項與加工處理。"],
  ["當日收件", "查核今日收件明細、件數、應收金額與待送洗廠狀態。"],
  ["入庫存放", "衣物完成後登錄架位與袋號，避免取件時找不到衣物。"],
  ["客戶取件", "取件付款、部分收款、未收帳款與會員到期提醒自動顯示。"],
  ["收支報表", "客戶付款、每日支出、業績統計、營業日報與月報表。"],
  ["資料維護", "資料備份、回存、重整與操作參數，降低門市資料風險。"],
];

const flow = ["客戶建檔", "送洗收件", "送洗廠處理", "入庫上架", "通知取件", "付款結帳", "日月報表"];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含客戶、送洗單、入庫、取件、付款、支出與報表指標。"],
  ["手機可以使用嗎？", "可以。介面已做 RWD，手機會改成單欄洗衣門市工作台。"],
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
        <a className="header-action" href="#demo">建立收件單</a>
      </header>

      <section className="hero dispatch-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Laundry Store Management</p>
          <h1>洗衣門市收件、入庫、取件、付款與日月報表，一套完成。</h1>
          <p className="hero-text">
            Jvision 協助洗衣門市管理客戶資料、送洗衣物、洗法特徵、協力洗衣廠、衣物入庫架位、取件付款與收支報表，
            讓衣物從收件到取回都有清楚紀錄。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看功能</a>
          </div>
        </div>

        <div className="dispatch-preview" aria-label="Jvision laundry dashboard preview">
          <div className="preview-card main">
            <span>今日收件</span>
            <strong>46 件</strong>
            <p>待入庫 12 件，待取件 18 件</p>
          </div>
          <div className="preview-card"><span>今日營收</span><strong>NT$ 24K</strong></div>
          <div className="preview-card"><span>未收帳款</span><strong>6 筆</strong></div>
          <div className="preview-card"><span>會員到期</span><strong>9 位</strong></div>
          <div className="preview-card"><span>協力廠待回</span><strong>14 件</strong></div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>從客戶送洗到衣物取回，建立清楚、快速、可追蹤的門市流程。</h2>
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
          <p className="eyebrow">流程視角</p>
          <h2>門市人員只要照流程點選，就能完成收件、入庫、取件與報表。</h2>
        </div>
        <div className="scenario-grid">
          {flow.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>直接測試客戶建檔、送洗登錄、入庫上架、取件付款與日報。</h2>
          <p>可新增客戶、建立送洗單、設定衣物類別與洗法、更新入庫/取件狀態、登錄付款與每日支出，並即時看到營業指標。</p>
        </div>
        <LaundryDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">管理價值</p>
          <h2>讓衣物不漏件、帳款不漏收、報表不重算。</h2>
        </div>
        <div className="review-grid">
          {[
            ["收件更快", "衣物類別、洗法、顏色、特徵與注意事項可快速點選。"],
            ["取件更準", "入庫架位、袋號、待取件與未收款一眼掌握。"],
            ["報表更清楚", "收款、支出、業績與營業日/月報表即時統計。"],
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
        <p>Jvision 洗衣門市管理 Demo，示範客戶建檔、送洗收件、衣物入庫、取件付款與營業報表流程。</p>
      </footer>
    </main>
  );
}
