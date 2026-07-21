import { EstimatePmisDemo } from "@/components/estimate-pmis-demo";

const modules = [
  ["估價模板", "建立工程類型、施工區域、材料、人工、機具、間接費與利潤率模板。"],
  ["報價單管理", "快速產生客戶報價、版本比較、收款追蹤、追加金額與線上簽核紀錄。"],
  ["轉專案執行", "報價核准後一鍵轉工程專案，帶入預算、工項與里程碑。"],
  ["進度管理", "甘特里程碑、S-Curve、施工進度回報與逾期預警。"],
  ["品質安全", "自主檢查表、監造查驗、職安衛抽查與缺失改善追蹤。"],
  ["工程財務", "預算、採購發包、估驗計價、收支成本與毛利分析。"],
  ["圖說送審", "圖面文件版本、送審狀態、回覆紀錄與權限控管。"],
  ["行動回報", "現場照片、施工日誌、行動簽核與會議待辦同步。"],
];

const flow = ["詢價需求", "工程估價", "報價簽核", "轉專案", "施工回報", "估驗請款", "驗收維保"];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含估價、報價、轉專案、進度、品質、圖說與財務狀態。"],
  ["手機可以使用嗎？", "可以。介面已做 RWD，手機會改成單欄工程工作台。"],
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
        <a className="header-action" href="#demo">開始估價</a>
      </header>

      <section className="hero dispatch-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Estimate + PMIS</p>
          <h1>從工程估價、報價簽核到施工管理，一套平台接起來。</h1>
          <p className="hero-text">
            Jvision 將報價估算與工程專案管理整合，從客戶詢價、估價明細、報價版本、簽核轉專案，
            到進度、品質、圖說、施工日誌、估驗計價與驗收維保，讓業主、監造、承包商都能在同一平台協作。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看模組</a>
          </div>
        </div>

        <div className="dispatch-preview" aria-label="Jvision estimate PMIS dashboard preview">
          <div className="preview-card main">
            <span>估價轉工程</span>
            <strong>73%</strong>
            <p>5 件報價簽核中，3 件工程逾期預警</p>
          </div>
          <div className="preview-card"><span>報價總額</span><strong>NT$ 18.6M</strong></div>
          <div className="preview-card"><span>工程進度</span><strong>62%</strong></div>
          <div className="preview-card"><span>待送審</span><strong>14 件</strong></div>
          <div className="preview-card"><span>缺失改善</span><strong>8 項</strong></div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">合併架構</p>
          <h2>報價不是結束，而是工程預算、進度、品質與請款的起點。</h2>
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
          <h2>從商機估價一路延伸到專案執行與驗收維保。</h2>
        </div>
        <div className="scenario-grid">
          {flow.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>直接測試估價明細、報價簽核、轉工程與現場管理。</h2>
          <p>可新增報價、選擇工程類型與施工區域、追蹤已收款與未收金額、列印報價單、核准轉專案、回報進度與產生估驗請款。</p>
        </div>
        <EstimatePmisDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">導入價值</p>
          <h2>讓估價、預算與工程執行不再各做各的表。</h2>
        </div>
        <div className="review-grid">
          {[
            ["報價更快", "常用工項與費率模板化，報價版本與毛利清楚可追。"],
            ["工程更穩", "進度、品質、送審、圖說與會議待辦集中管理。"],
            ["財務更準", "估價預算可延伸到採購、發包、估驗計價與收支毛利。"],
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
        <p>Jvision 估價與工程管理 Demo，示範報價簽核、轉專案、進度品質、圖說送審與估驗請款流程。</p>
      </footer>
    </main>
  );
}
