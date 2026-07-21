import { ConstructionDemo } from "@/components/construction-demo";

const modules = [
  ["專案總覽", "掌握工期、預算、風險與待辦，主管一眼知道今天該處理什麼。"],
  ["工地日報", "手機填報人力、機具、天候、照片與施工項目，資料即時回到辦公室。"],
  ["品質安衛", "缺失拍照、定位、派工、追蹤改善，形成可稽核的閉環紀錄。"],
  ["材料成本", "進料、庫存、領用、追加與請款關聯，降低超支與漏報。"],
  ["審批流程", "變更單、採購單、估驗請款自動跑簽核，保留版本與決策歷程。"],
  ["報表儀表板", "把專案績效、分包表現與現場異常轉成可行動的管理訊號。"]
];

const faqs = [
  ["可以用手機在工地填資料嗎？", "可以。Demo 可模擬日報新增、缺失建立與狀態追蹤。"],
  ["能管理多個建案嗎？", "可以。專案總覽可跨案比較進度、預算、缺失與待簽事項。"],
  ["這個頁面可以直接測試嗎？", "可以。下方工作區可新增日報、建立缺失、切換狀態、送出審批。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#technology">專案架構</a>
          <a href="#demo">功能 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Construction Cloud</p>
          <h1>建築工程專案管理，從現場回報到成本決策一次完成</h1>
          <p className="hero-text">
            工地日報、品質安衛、材料成本、變更追加、估驗請款與專案儀表板全部整合成可直接測試的線上 demo。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#technology">查看架構</a>
          </div>
        </div>
        <div className="hero-device" aria-label="Jvision 建築管理預覽">
          <div className="device-top">
            <span>台北商辦新建工程</span>
            <strong>進度 68%</strong>
          </div>
          <div className="table-map">
            <span className="table busy">日報 18</span>
            <span className="table">缺失 12</span>
            <span className="table paid">待簽 7</span>
            <span className="table busy">成本 92%</span>
            <span className="kitchen">Project Control Center</span>
          </div>
          <div className="device-bottom">
            <span>工期 +2 天</span>
            <span>材料警示 3</span>
            <span>改善率 81%</span>
          </div>
        </div>
      </section>

      <section className="technology" id="technology">
        <div className="section-heading">
          <p className="eyebrow">Project Architecture</p>
          <h2>Jvision 把建築現場的分散資料變成可追蹤流程</h2>
        </div>
        <div className="tech-grid">
          {modules.map(([title, text], index) => (
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
          <h2>直接測試 Jvision 工程流程</h2>
          <p>所有互動都在瀏覽器中即時運算，可用來展示產品流程與銷售情境。</p>
        </div>
        <ConstructionDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">導入路徑</p>
          <h2>從一個工地開始，逐步擴展到企業級工程管理</h2>
        </div>
        <div className="reason-grid">
          {["盤點表單與簽核流程", "建立日報與材料資料模型", "串接通知與儀表板"].map((item) => (
            <article className="reason-card" key={item}><h3>{item}</h3><p>用標準化模組降低導入阻力，讓現場先用得起來，再逐步擴大。</p></article>
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
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 建築工程管理 Demo。工程流程、品質安衛與成本追蹤一站整合。</p>
      </footer>
    </main>
  );
}
