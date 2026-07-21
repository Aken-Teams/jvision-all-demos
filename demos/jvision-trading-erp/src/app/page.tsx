import { TradingDemo } from "@/components/trading-demo";

const modules = [
  ["客戶與產品資料", "管理客戶等級、信用額度、產品圖片、包裝方式、客戶別品名與供應商對應資料。"],
  ["報價與訂單", "報價單與銷售確認單一氣呵成，支援報價追蹤、利潤分析與分批出貨排程。"],
  ["採購與供應商", "由訂單自動產生採購單，支援合併下單、供應商歷史價格與訂金付款。"],
  ["裝箱單與商業發票", "由出貨資料產生裝箱單與商業發票，並同步回沖訂單與採購交貨量。"],
  ["應收應付帳款", "商業發票自動產生應收與應付明細，支援對帳單、分批收付款、訂金沖銷與其它費用。"],
  ["外箱標示與出貨嘜頭", "可設計外箱標示並帶入出貨表單，協助供應商包裝與出口文件一致。"],
  ["多公司與權限", "多公司抬頭、簡繁英介面、權限控管與表單核准，適合跨地區貿易團隊。"],
  ["統計分析報表", "依客戶、產品、供應商、業務員與出貨日期分析營收、利潤、交易歷史與異常出貨。"],
];

const flow = ["報價", "接單", "採購", "訂金", "分批出貨", "裝箱單", "商業發票", "帳款對帳"];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含報價、訂單、採購、出貨、商業發票、應收應付與利潤分析流程。"],
  ["手機可以使用嗎？", "可以。介面已做 RWD，手機會改成單欄貿易業務工作台。"],
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
        <a className="header-action" href="#demo">建立報價</a>
      </header>

      <section className="hero dispatch-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Trading ERP</p>
          <h1>貿易報價、訂單、採購、出貨、發票與帳款，一套串起來。</h1>
          <p className="hero-text">
            Jvision 協助進出口貿易商從產品電子型錄、客戶報價、銷售確認單、採購單、裝箱單、
            商業發票到應收應付對帳完整連貫，讓業務、採購、船務與財務使用同一份即時資料。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看功能</a>
          </div>
        </div>

        <div className="dispatch-preview" aria-label="Jvision trading ERP dashboard preview">
          <div className="preview-card main">
            <span>今日貿易營運</span>
            <strong>US$ 428K</strong>
            <p>待報價 18 筆，待採購 9 張，分批出貨 12 批，平均毛利 24.6%</p>
          </div>
          <div className="preview-card"><span>未出貨訂單</span><strong>36 筆</strong></div>
          <div className="preview-card"><span>待收款</span><strong>US$ 96K</strong></div>
          <div className="preview-card"><span>待付供應商</span><strong>US$ 64K</strong></div>
          <div className="preview-card"><span>異常出貨</span><strong>3 件</strong></div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>從開發信、報價、採購到出口文件與帳款，建立貿易商完整作業閉環。</h2>
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
          <h2>適合一般貿易商、製造業貿易部、兩岸多地公司與出口型業務團隊。</h2>
        </div>
        <div className="scenario-grid">
          {flow.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>直接測試報價轉訂單、訂單轉採購、裝箱單 / 商業發票與帳款對帳。</h2>
          <p>可新增報價、核准轉銷售確認單、自動產生採購單、安排分批出貨、產生商業發票、沖銷應收應付並查看利潤。</p>
        </div>
        <TradingDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">管理價值</p>
          <h2>讓報價、採購、出貨與帳款不斷線，貿易流程更快也更準。</h2>
        </div>
        <div className="review-grid">
          {[
            ["業務更快", "產品圖片、客戶別價格、報價與訂單追蹤集中管理，快速回覆客戶。"],
            ["採購更準", "訂單自動產生採購需求，供應商價格與交易歷史方便議價。"],
            ["財務更清楚", "裝箱單、商業發票、應收、應付與費用自動串接，利潤與對帳一眼掌握。"],
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
        <p>Jvision 貿易 ERP Demo，示範報價、訂單、採購、出貨、商業發票、應收應付、出貨嘜頭與利潤分析流程。</p>
      </footer>
    </main>
  );
}
