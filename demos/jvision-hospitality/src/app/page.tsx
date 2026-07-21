import { HospitalityDemo } from "@/components/hospitality-demo";

const features = [
  ["房況管理 房況管理", "用日曆視角掌握可售、已入住、待清潔與維修房間，櫃台和房務同步更新。"],
  ["官網訂房引擎", "讓旅客從品牌官網直接下單，支援房型、房價、加購與入住資料管理。"],
  ["訂房平台 控房同步", "集中管理平台通路庫存與房價，降低超賣與人工重複輸入的風險。"],
  ["動態房價", "依旺日、入住率、通路表現與活動檔期快速調整銷售價格。"],
  ["訂單與入住", "從預訂、Check-in、Check-out 到狀態追蹤，所有流程可在 Demo 中互動測試。"],
  ["加購與票券", "接駁、早餐、票券、體驗活動等服務可與訂單一起追蹤。"],
  ["金流與結算", "記錄付款、訂金、尾款與 訂房平台 佣金，輔助每日關帳與營收檢核。"],
  ["營運報表", "即時掌握入住率、每房收益、平均房價、通路表現與待處理房務任務。"],
];

const faqs = [
  ["可以實際測試流程嗎？", "可以，Demo 可新增訂房、切換房況、調整房價、同步 訂房平台、建立加購服務與新增結算紀錄。"],
  ["是否保留原品牌名稱？", "沒有，頁面與素材都以 Jvision 呈現，並使用 Jvision logo。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主選單">
          <a href="#features">功能架構</a>
          <a href="#demo">互動 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">開始測試</a>
      </header>

      <section className="hero hospitality-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Hospitality Cloud</p>
          <h1>旅宿營運管理平台，整合 房況管理、官網訂房與 訂房平台 控房</h1>
          <p className="hero-text">
            以旅宿櫃台的日常流程為核心，將房況控房、官網訂單、訂房平台 同步、房價策略、加購服務、入住狀態與營收結算集中在同一個工作台。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">進入 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision 旅宿營運儀表板">
          <div className="preview-top">
            <span>Jvision StayOps</span>
            <strong>入住率 78%</strong>
          </div>
          <div className="property-board">
            <span>今晚入住 24</span>
            <span>待清潔 8</span>
            <span>訂房平台 訂單 17</span>
            <span>待結算 5</span>
            <strong>
              旅宿營運總覽
              <br />
              每房收益 NT$ 3,420
            </strong>
          </div>
          <div className="preview-bottom">
            <span>官網轉換 42%</span>
            <span>同步通路 6</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">旅宿日常流程</p>
          <h2>Jvision 把訂房、控房、入住與營收資料整合成一套旅宿工作流</h2>
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
          <h2>直接操作 Jvision 旅宿營運流程</h2>
          <p>新增訂房、切換房況、調整旺日房價、同步 訂房平台、建立加購服務與新增結算紀錄，展示的不是靜態說明，而是可測試的管理工作台。</p>
        </div>
        <HospitalityDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>適合需要多通路控房與現場櫃台協作的旅宿團隊</h2>
        </div>
        <div className="reason-grid">
          {[
            ["訂房控房", "把官網與 訂房平台 訂單集中管理，快速處理超賣、改期與入住狀態。"],
            ["房務協作", "前台更新入住與退房後，房務可立即看到待清潔與維修房間。"],
            ["營收結算", "用加購、房價與通路佣金紀錄，支援每日關帳與管理報表。"],
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
        <p>Jvision 旅宿營運管理 Demo，提供線上展示與行銷素材。</p>
      </footer>
    </main>
  );
}
