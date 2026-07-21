import { ClinicDemo } from "@/components/clinic-demo";

const features = [
  ["AI 數位助理", "彙整待辦、預約、回診提醒與營運異常，協助行政團隊快速處理。"],
  ["智慧預約候診", "管理初診、回診、候診狀態與診間分流，降低櫃台溝通成本。"],
  ["數位病歷摘要", "整理主訴、處置、醫囑與回診計畫，形成可追蹤紀錄。"],
  ["行動化管理", "醫師、護理師與行政可在不同裝置查看今日門診與任務。"],
  ["排班與薪資", "依診別、角色與工時模擬排班，產生薪資與人力概況。"],
  ["倉管與耗材", "追蹤藥品、材料、衛材庫存與低庫存提醒。"],
  ["財務與收款", "掛號、療程費、耗材費與收款紀錄集中管理。"],
  ["營運儀表板", "視覺化看診量、預約率、候診時間與回診追蹤。"]
];

const faqs = [
  ["這是醫療診斷工具嗎？", "不是。此 demo 聚焦診所行政、流程與營運管理，不提供診斷或治療建議。"],
  ["可以直接測試嗎？", "可以。下方 demo 可新增預約、切換候診狀態、建立病歷摘要、排班、補庫存與收款。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">產品功能</a>
          <a href="#demo">功能 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero clinic-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Clinic Assistant</p>
          <h1>智慧診所管理系統，讓預約、候診、病歷與營運數據更好協作</h1>
          <p className="hero-text">
            參考智慧診所助理架構打造：AI 待辦、預約候診、病歷摘要、排班薪資、財務收款、倉管耗材與營運儀表板全部可展示。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能架構</a>
          </div>
        </div>
        <div className="clinic-preview" aria-label="Jvision 診所管理預覽">
          <div className="preview-top"><span>Jvision Clinic</span><strong>今日預約 36</strong></div>
          <div className="clinic-board">
            <span>候診 8</span><span>看診中 3</span><span>待收款 5</span><span>低庫存 4</span>
            <strong>AI 小幫手<br />3 件待處理</strong>
          </div>
          <div className="preview-bottom"><span>平均候診 12 分</span><span>回診追蹤 18</span></div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">診所日常流程</p>
          <h2>Jvision 把診所每天反覆處理的流程整合成一套協作系統</h2>
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
          <p className="eyebrow">Live Demo</p>
          <h2>直接測試 Jvision 診所營運流程</h2>
          <p>所有資料都在瀏覽器即時模擬，可作為診所管理、行政流程與營運儀表板展示。</p>
        </div>
        <ClinicDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>從櫃台到診間，再到營運決策，減少人工追蹤落差</h2>
        </div>
        <div className="reason-grid">
          {["櫃台預約與候診", "診間病歷與回診", "人事財務與倉管"].map((title) => (
            <article className="reason-card" key={title}>
              <h3>{title}</h3>
              <p>用一致的流程資料讓團隊看見同一份狀態，縮短溝通與查找時間。</p>
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
          {faqs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 智慧診所管理 Demo。</p>
      </footer>
    </main>
  );
}
