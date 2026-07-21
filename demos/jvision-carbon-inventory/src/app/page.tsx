import CarbonDemo from "../components/carbon-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  ["01", "盤查邊界管理", "建立公司、廠區、部門與營運邊界，清楚標示每筆資料由誰提供、誰審核。"],
  ["02", "國際標準對應", "保留 ISO 14064-1 與 GHG Protocol 等正式名稱，並用中文說明它們對應的盤查用途。"],
  ["03", "活動資料彙整", "集中管理用電、燃料、冷媒、運輸、差旅、廢棄物與採購活動資料。"],
  ["04", "排放係數管理", "維護係數版本、來源、單位與適用年度，讓每一次計算都有依據。"],
  ["05", "排放清冊與報告", "自動彙整範疇一、範疇二、範疇三排放量，產出盤查成果與報告資料。"],
  ["06", "熱點分析與減量", "用視覺化方式找出高排放來源，協助企業安排減量優先順序。"],
  ["07", "查證準備度", "保留附件、審核狀態、異常提醒與資料來源，方便第三方查證前整理。"],
  ["08", "系統介接與部署", "可串接 ERP、電表、車隊、採購與資料倉儲，支援雲端展示與企業導入情境。"]
];

const modules = [
  ["組織邊界", "管理公司、廠區、部門、營運控制權與資料責任分工。"],
  ["活動資料", "收集用電、燃料、冷媒、運輸、差旅、廢棄物等營運資料。"],
  ["係數資料庫", "維護排放係數、年度版本、來源與單位換算規則。"],
  ["排放清冊", "自動產出範疇分類、類別彙總與場域排放明細。"],
  ["報告輸出", "匯出盤查邊界、活動資料、係數來源與排放成果。"],
  ["AI 查核", "自動找出缺值、異常用量、單位不一致與高排放熱點。"],
  ["減量追蹤", "連結節能專案、再生能源與減量目標管理。"],
  ["權限稽核", "保留編輯紀錄、附件與審核狀態，提升資料可信度。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">平台能力</a>
          <a href="#demo">功能 Demo</a>
          <a href="#modules">模組架構</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section id="top" className="hero">
        <div>
          <p className="eyebrow">碳管理 / 組織盤查 / AI 查核</p>
          <h1>Jvision 組織溫室氣體盤查平台</h1>
          <p className="hero-text">
            讓分散的營運資料變成可追溯、可查證、可決策的碳排放管理基礎，協助企業完成年度盤查、排放清冊、報告輸出與減量熱點分析。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開啟盤查 Demo</a>
            <a className="secondary-button" href="#features">查看平台能力</a>
          </div>
        </div>

        <div className="hero-dashboard" aria-label="Jvision 碳盤查儀表板預覽">
          <div className="dashboard-top">
            <span />
            <span />
            <span />
            <strong>Jvision 碳盤查工作台</strong>
          </div>
          <div className="hero-metrics">
            <article className="hero-metric"><span>年度排放量</span><strong>8,426 公噸 CO2e</strong></article>
            <article className="hero-metric"><span>資料審核完成率</span><strong>86%</strong></article>
            <article className="hero-metric"><span>資料來源數</span><strong>42</strong></article>
            <article className="chart-card">
              <div className="bar"><strong>範疇一：直接排放</strong><i style={{ width: "42%" }} /><span>1,124</span></div>
              <div className="bar"><strong>範疇二：用電排放</strong><i style={{ width: "72%" }} /><span>4,208</span></div>
              <div className="bar"><strong>範疇三：其他間接排放</strong><i style={{ width: "58%" }} /><span>3,094</span></div>
            </article>
            <article className="standard-card">
              <div><strong>ISO 14064-1</strong><span>組織層級盤查與查證準備</span></div>
              <div><strong>GHG Protocol</strong><span>企業價值鏈排放管理標準</span></div>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">平台能力</p>
          <h2>從活動資料到排放清冊，建立可信的淨零起點</h2>
          <p>Jvision 將組織邊界、活動資料、係數版本、排放試算、報告輸出與查核軌跡整合，讓碳盤查不再只是年度填表。</p>
        </div>
        <div className="feature-grid">
          {features.map(([index, title, text]) => (
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
          <p className="eyebrow">可操作 Demo</p>
          <h2>新增活動資料，立即試算排放量與熱點分析</h2>
          <p>下方可以實際新增盤查資料、切換排放來源，系統會即時計算「公噸 CO2e」、更新清冊並產生 AI 查核摘要。</p>
        </div>
        <CarbonDemo logoUrl={logoUrl} />
      </section>

      <section id="modules" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">模組架構</p>
          <h2>支援企業長期碳管理，而不只是年度填表</h2>
          <p>從盤查準備、資料收集、計算、揭露到減量專案追蹤，Jvision 可依企業成熟度逐步導入。</p>
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
          <h2>讓碳盤查從資料整理，升級成管理決策系統</h2>
          <p>適合展示企業碳管理、ISO 盤查、ESG 揭露、查證準備與 AI 自動化資料檢核。</p>
        </div>
        <a className="primary-button" href="#demo">立即測試</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 組織溫室氣體盤查 Demo</span>
      </footer>
    </main>
  );
}
