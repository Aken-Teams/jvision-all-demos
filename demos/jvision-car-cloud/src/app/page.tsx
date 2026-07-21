import { GarageDemo } from "@/components/garage-demo";

const modules = [
  ["預約管理", "線上預約、回廠提醒、車主資料與車牌查詢，減少電話來回確認。"],
  ["維修銷貨", "工單、估價、維修項目、結帳與發票紀錄集中管理。"],
  ["報價工單", "零件、工資、外包與折扣自動加總，一鍵轉正式工單。"],
  ["庫存管理", "零件入庫、低庫存提醒、供應商採購與領料紀錄。"],
  ["客戶經營", "LINE 通知、保養提醒、車歷紀錄與會員標籤。"],
  ["財務分析", "營收、毛利、未收款、技師績效與熱門服務即時彙整。"]
];

const scenarios = [
  ["汽車保養廠", "進廠預約、保養里程提醒、零件庫存與結帳。"],
  ["鈑烤維修", "估價、照片紀錄、外包項目、保險案件追蹤。"],
  ["汽車美容", "套票、會員次數、預約排程與服務提醒。"],
  ["機車維修", "快速開單、耗材控管、回修紀錄與簡訊通知。"],
  ["二手車商", "整備工單、成本追蹤、車輛銷售與庫存狀態。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#modules">系統功能</a>
          <a href="#demo">Demo 測試</a>
          <a href="#scenarios">適用場景</a>
          <a href="#contact">諮詢</a>
        </nav>
        <a className="header-action" href="#demo">立即試用</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow">Jvision Garage Cloud</p>
          <h1>車廠雲端管理系統</h1>
          <p className="hero-lead">功能完整、操作簡單，30 分鐘就能上手。預約、工單、庫存、報價、LINE 通知與營收分析，一個後台完成每日車廠管理。</p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作完整 Demo</a>
            <a className="secondary-button" href="#modules">查看六大功能</a>
          </div>
        </div>
        <div className="hero-card" aria-label="系統功能摘要">
          <strong>六大系統功能</strong>
          <span>預約管理</span>
          <span>維修銷貨</span>
          <span>報價工單</span>
          <span>庫存管理</span>
          <span>客戶經營</span>
          <span>財務分析</span>
        </div>
      </section>

      <section className="intro">
        <div>
          <p className="eyebrow">Project Structure</p>
          <h2>替汽修廠建立完整雲端管理流程</h2>
        </div>
        <p>參考車廠雲端系統的資訊架構，Jvision 版本把傳統長篇功能說明轉成可操作的產品頁與後台 demo，讓業主能直接測試每日流程：預約進廠、建立工單、加入零件、傳送 LINE 通知、完成收款，再看營收與庫存狀態。</p>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">Core Modules</p>
          <h2>六大系統功能，支援多種車廠經營模式</h2>
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

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">Live Demo</p>
          <h2>完整功能 Demo 測試區</h2>
          <p>這裡可以直接操作，不只是說明。請嘗試新增預約、建立工單、加入維修項目、扣庫存、送出 LINE 通知、結帳，並查看即時報表。</p>
        </div>
        <GarageDemo />
      </section>

      <section className="scenarios" id="scenarios">
        <div className="section-heading">
          <p className="eyebrow">Use Cases</p>
          <h2>同一套架構，對應不同汽修服務型態</h2>
        </div>
        <div className="scenario-grid">
          {scenarios.map(([title, text]) => (
            <article className="scenario-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact" id="contact">
        <div>
          <p className="eyebrow">Jvision AI</p>
          <h2>把車廠資料、工單與營收放進同一個雲端系統</h2>
          <p>可延伸串接 LINE、簡訊、發票、會員標籤、技師績效與多分店權限管理。</p>
        </div>
        <a className="primary-button" href="#demo">回到 Demo 後台</a>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 車廠雲端管理系統 Demo。</p>
      </footer>
    </main>
  );
}
