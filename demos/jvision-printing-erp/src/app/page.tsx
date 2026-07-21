import { PrintingDemo } from "@/components/printing-demo";

const modules = [
  ["快速估價與轉單", "依紙張、尺寸、色數、加工、數量與交期快速試算，報價核准後自動轉訂單與製令。"],
  ["設計圖與版模管理", "管理圖檔版本、客戶確認、印版、刀模與樣張狀態，避免版本錯用。"],
  ["排版與 ERP 整合", "支援排版資料匯入，將多張訂單合併成同一張製令，降低成本與重複登打。"],
  ["合版與生產排程", "依設備、交期、紙材與製程產能安排合版，處理急單插單與工序移轉。"],
  ["託外加工追蹤", "燙金、上光、軋型、裝訂等外包派工與完工回報集中管理。"],
  ["領料入庫與 WIP", "紙張、油墨、半成品、成品入庫與在製品進出站即時追蹤。"],
  ["實際成本計算", "彙整材料、工時、託外、製造費用與報廢，回饋報價與毛利分析。"],
  ["出貨與財務銜接", "訂單、工單、銷貨單、入庫單與應收帳款自動串接，降低人工轉單。"],
];

const flow = ["估價", "接單", "圖檔確認", "合版排程", "製令派工", "領料生產", "託外加工", "入庫出貨"];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含估價、轉單、圖檔確認、合版排程、託外、WIP、成本與出貨流程。"],
  ["手機可以使用嗎？", "可以。介面已做 RWD，手機會改成單欄印刷工務工作台。"],
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
        <a className="header-action" href="#demo">建立估價</a>
      </header>

      <section className="hero dispatch-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Printing ERP</p>
          <h1>印刷估價、圖檔版模、合版排程、託外與成本，一套串起來。</h1>
          <p className="hero-text">
            Jvision 協助印刷廠把少量多樣訂單、快速報價、設計圖確認、合版生產、託外加工、領料入庫與實際成本整合，
            讓業務能快回覆交期，工務能準確排產，財務能看清毛利。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看功能</a>
          </div>
        </div>

        <div className="dispatch-preview" aria-label="Jvision printing ERP dashboard preview">
          <div className="preview-card main">
            <span>今日印刷生產</span>
            <strong>128 張工單</strong>
            <p>急單 9 張，合版 14 批，託外待回 6 件，平均毛利 28.4%</p>
          </div>
          <div className="preview-card"><span>待報價</span><strong>23 筆</strong></div>
          <div className="preview-card"><span>待圖檔確認</span><strong>11 件</strong></div>
          <div className="preview-card"><span>在製品</span><strong>76 件</strong></div>
          <div className="preview-card"><span>低庫存紙材</span><strong>4 項</strong></div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>從報價到出貨，讓印刷廠的圖檔、製程、託外與成本不再分散。</h2>
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
          <h2>適合商業印刷、包裝紙器、貼紙標籤、合版印刷與含託外加工的印刷廠。</h2>
        </div>
        <div className="scenario-grid">
          {flow.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>直接測試估價轉單、圖檔確認、合版排程、託外追蹤與成本回算。</h2>
          <p>可新增印刷估價、核准轉訂單、確認圖檔版本、建立合版製令、更新製程進度、派託外加工、領料入庫並查看成本差異。</p>
        </div>
        <PrintingDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">管理價值</p>
          <h2>少量多樣也能快速反應，讓報價、排產與成本都有依據。</h2>
        </div>
        <div className="review-grid">
          {[
            ["報價更快", "尺寸、紙材、色數、加工與數量快速試算，報價核准後自動轉單。"],
            ["現場更準", "圖檔、版模、合版、製程移轉與託外完工狀態即時追蹤。"],
            ["成本更清楚", "材料、工時、託外、報廢與製造費用彙整，方便比對標準與實際成本。"],
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
        <p>Jvision 印刷業解決方案 Demo，示範估價轉單、圖檔版模、合版排程、託外加工、WIP、成本與出貨流程。</p>
      </footer>
    </main>
  );
}
