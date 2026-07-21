import { SqmDemo } from "@/components/sqm-demo";

const features = [
  ["採購與收料", "串接採購訂單、供應商、料號與收料紀錄，讓品保、倉儲與採購看到同一份狀態。"],
  ["IQC 進料檢驗", "建立抽樣規則、檢驗項目與不良原因，讓檢驗結果直接回饋給供應商改善。"],
  ["供應商文件", "集中管理 COA、RoHS、承認書、ECN 與稽核文件，到期前主動提醒補件。"],
  ["綠色產品資料", "追蹤環保法規與材料證明，快速辨識高風險料件與缺件供應商。"],
  ["供應商評鑑", "用 QCDST 分數、交期、品質與服務紀錄建立公平透明的供應商等級。"],
  ["MRB 與改善", "不良品審查、矯正預防措施與會簽流程集中在同一個工作台。"],
  ["Web 協作平台", "供應商可直接上傳文件、回覆異常與查看待辦，減少來回信件。"],
  ["管理報表", "把品質趨勢、逾期文件、稽核結果與改善進度整理成主管可看的儀表板。"],
];

const flow = [
  "供應商建檔",
  "採購收料",
  "IQC 檢驗",
  "異常改善",
  "文件補件",
  "評鑑稽核",
];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含供應商新增、檢驗判定、文件補件、稽核排程與報表更新，用來展示實際流程。"],
  ["是否已統一 Jvision 品牌？", "是。頁面內已統一使用 Jvision 品牌與 Jvision logo。"],
  ["可以手機和平板看嗎？", "可以。版面以 RWD 設計，桌機是雙欄工作台，手機會改成單欄操作介面。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">功能架構</a>
          <a href="#demo">互動 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">開始測試</a>
      </header>

      <section className="hero sqm-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Supplier Quality Management</p>
          <h1>供應商品質管理平台，讓採購、品保、倉儲與供應商同步協作。</h1>
          <p className="hero-text">
            Jvision 把供應商資格、採購收料、IQC 進料檢驗、文件補件、綠色產品資料與供應商評鑑放進同一個工作流，
            協助中心廠降低進料風險、縮短異常處理時間，讓供應鏈品質管理不再靠人工追信。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#features">查看架構</a>
          </div>
        </div>

        <div className="sqm-preview" aria-label="Jvision SQM dashboard preview">
          <div className="preview-top">
            <span>Jvision 供應鏈品質中心</span>
            <strong>A 級供應商 68%</strong>
          </div>
          <div className="supplier-board">
            <span>
              今日收料
              <strong>126 批</strong>
            </span>
            <span>
              待檢驗
              <strong>18 批</strong>
            </span>
            <span>
              文件即將到期
              <strong>7 件</strong>
            </span>
            <span>
              改善案件
              <strong>5 件</strong>
            </span>
            <strong className="wide-card">
              本月供應商品質分數
              <br />
              91.6 / 100
            </strong>
          </div>
          <div className="preview-bottom">
            <span>準時交付率 96%</span>
            <span>進料合格率 98.4%</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">功能架構</p>
          <h2>從供應商建檔到評鑑改善，建立可追蹤的品質閉環。</h2>
          <p>
            參考供應商品質管理的常見流程，Jvision 將採購、品保、文件與供應商端協作整合在同一頁面，讓管理者能即時看到風險與待辦。
          </p>
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

      <section className="process-band" aria-label="SQM process">
        <div className="section-heading">
          <p className="eyebrow">流程視角</p>
          <h2>每個供應商狀態都能被看見、被提醒、被追蹤。</h2>
        </div>
        <div className="flow-row">
          {flow.map((item, index) => (
            <div className="flow-step" key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">互動展示</p>
          <h2>直接測試供應商品質管理工作台。</h2>
          <p>
            你可以新增供應商、執行收料檢驗、更新文件狀態、安排稽核，也能即時看到分數、待辦與風險清單變化。
          </p>
        </div>
        <SqmDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">導入價值</p>
          <h2>把供應商品質從事後追責，改成事前預警與共同改善。</h2>
        </div>
        <div className="reason-grid">
          {[
            ["降低進料風險", "檢驗標準、抽樣規則與歷史異常集中管理，讓高風險物料更早被攔截。"],
            ["加快補件速度", "供應商可在平台回覆與上傳文件，系統自動提醒到期、缺件與退回原因。"],
            ["評鑑更公平", "品質、成本、交期、服務與技術資料有紀錄可查，避免評鑑只靠印象。"],
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
        <p>Jvision 供應商品質管理 Demo，示範供應鏈品質協作、文件追蹤與評鑑改善流程。</p>
      </footer>
    </main>
  );
}
