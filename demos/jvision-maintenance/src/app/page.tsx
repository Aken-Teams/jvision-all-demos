import MaintenanceDemo from "../components/maintenance-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const capabilities = [
  ["01", "預防保養", "依設備週期、稼動時間與故障紀錄，自動產生下次保養排程。"],
  ["02", "維修請求", "現場人員可建立異常單，維修團隊用看板追蹤處理狀態。"],
  ["03", "日曆排程", "把保養、巡檢、停機與人員班表放在同一個計畫視圖。"],
  ["04", "MTBF / MTTR", "即時計算平均故障間隔與平均修復時間，掌握設備可靠度。"],
  ["05", "停機管理", "記錄停機原因、影響產線與修復動作，協助降低損失。"],
  ["06", "備品追蹤", "維修工單可帶出所需備品與庫存提示，避免維修等待。"],
  ["07", "品質串接", "設備異常可連動品質警示與改善任務，避免問題重複發生。"],
  ["08", "AI 摘要", "整理高風險設備、逾期工單與今日優先處理清單。"]
];

const modules = [
  ["設備履歷", "集中管理設備型號、位置、責任人、保養週期與維修歷史。"],
  ["異常通報", "建立故障、噪音、震動、漏油、品質異常等現場維修請求。"],
  ["保養計畫", "以週期、使用時數或風險分數安排預防保養，不再只靠人記。"],
  ["維修看板", "用待派工、處理中、待驗收、已完成等狀態追蹤進度。"],
  ["日曆視圖", "檢查每日工單、人員負荷與預計停機時間，避免排程衝突。"],
  ["績效統計", "追蹤 MTBF、MTTR、停機時間與完成率，讓改善有數字依據。"],
  ["備品與成本", "記錄維修用料、外包費用與停機成本，掌握設備總成本。"],
  ["製造串接", "產線控制台可直接觸發維修請求，相關人員即時收到狀態。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
        </a>
        <nav aria-label="主選單">
          <a href="#features">功能</a>
          <a href="#demo">Demo</a>
          <a href="#modules">模組</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Maintenance / Equipment / MTBF</p>
          <h1>Jvision 智慧設備維護與預防保養平台</h1>
          <p className="hero-text">
            讓設備履歷、故障通報、預防保養、維修派工、日曆排程與設備績效統計在同一個工作台完成。Jvision 協助製造與營運團隊降低停機時間，讓維修不再只靠電話與紙本紀錄。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開啟功能 Demo</a>
            <a className="secondary-button" href="#features">查看平台能力</a>
          </div>
        </div>

        <div className="hero-console" aria-label="Jvision 設備維護示意畫面">
          <div className="console-top">
            <span />
            <span />
            <span />
            <strong>Jvision Maintenance Control</strong>
          </div>
          <div className="warehouse-board">
            <article className="hero-metric"><span>待處理工單</span><strong>18</strong></article>
            <article className="hero-metric"><span>保養完成率</span><strong>94%</strong></article>
            <article className="hero-metric"><span>平均修復</span><strong>2.6h</strong></article>
            <article className="stock-card">
              <div><b>CNC-03</b><span>主軸溫度偏高</span><i style={{ width: "82%" }} /></div>
              <div><b>PACK-02</b><span>本週預防保養</span><i style={{ width: "58%" }} /></div>
              <div><b>AOI-01</b><span>待驗收復機</span><i style={{ width: "72%" }} /></div>
            </article>
            <article className="route-card">
              <strong>今日排程</strong>
              <span>巡檢 7 台</span>
              <span>保養 4 台</span>
              <span>急修 2 件</span>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">平台能力</p>
          <h2>從故障通報到預防保養，把設備維護做成可追蹤的管理流程</h2>
          <p>
            參考現代維護管理產品的架構，Jvision 將設備履歷、維修看板、日曆排程、保養計畫與 MTBF / MTTR 指標整合成一個可互動 Demo。
          </p>
        </div>
        <div className="feature-grid">
          {capabilities.map(([index, title, text]) => (
            <article className="feature-card" key={title}>
              <b>{index}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="demo" className="demo-section">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>新增維修請求、流轉工單、安排保養、產生 AI 維護摘要都可以直接操作</h2>
          <p>
            這不是靜態介紹頁。你可以建立設備異常、調整維修狀態、查看保養排程與設備績效，並讓 AI 摘要整理今日最需要處理的停機風險。
          </p>
        </div>
        <MaintenanceDemo logoUrl={logoUrl} />
      </section>

      <section id="modules" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">系統模組</p>
          <h2>支援製造現場、總務設備、門市設備與維修團隊的日常管理</h2>
          <p>
            從設備履歷到保養績效，Jvision 讓團隊用一致的流程處理異常、派工、修復、驗收與改善追蹤。
          </p>
        </div>
        <div className="module-grid">
          {modules.map(([title, text]) => (
            <article className="module-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact">
        <div>
          <p className="eyebrow">Jvision Demo</p>
          <h2>把設備維護從被動救火，變成可預測、可追蹤的保養管理</h2>
          <p>適合工廠、物流、醫療設備、門市設備與維修服務團隊，用一套 Demo 展示從通報到改善的完整流程。</p>
        </div>
        <a className="primary-button" href="#demo">測試維護工作台</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 智慧設備維護與預防保養 Demo</span>
      </footer>
    </main>
  );
}
