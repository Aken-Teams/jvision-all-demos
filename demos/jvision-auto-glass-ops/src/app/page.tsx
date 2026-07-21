import AutoGlassDemo from "../components/auto-glass-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  { title: "預約工單", body: "從客戶預約、車型資料、VIN 或保險單位建立可追蹤工單。" },
  { title: "技師派工", body: "把到店、外出安裝、ADAS 校正與石擊修補排程交給合適技師。" },
  { title: "玻璃找料", body: "依車型與服務需求追蹤玻璃料號、供應商、訂購與到貨狀態。" },
  { title: "客戶簽名", body: "把施工確認、完工簽名與照片紀錄集中在同一筆工單。" },
  { title: "保險請款", body: "保險送件、開立發票、收款與應收追蹤不再散落各處。" },
  { title: "營運報表", body: "掌握每日工單、技師產能、零件等待、保險款與現金流。" },
];

const modules = ["預約排程", "工單管理", "技師任務", "玻璃訂購", "保險請款", "營運報表"];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
          <span>汽車玻璃維修與請款管理平台</span>
        </a>
        <nav>
          <a href="#features">功能模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#workflow">流程價值</a>
        </nav>
        <a className="header-cta" href="#demo">操作 Demo</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">JVISION AUTO GLASS OPERATIONS PLATFORM</p>
          <h1>把汽車玻璃預約、派工、找料、簽名、請款與收款整合成一個店務工作台。</h1>
          <p>
            Jvision 協助汽車玻璃店、行動安裝技師與保險理賠團隊，
            把車型資料、玻璃料號、工單進度、客戶簽名與保險請款集中管理。
          </p>
          <div className="hero-actions">
            <a href="#demo" className="primary-link">操作 Demo</a>
            <a href="#features" className="secondary-link">查看功能</a>
          </div>
        </div>
        <div className="hero-console" aria-label="Jvision 汽車玻璃店務指標">
          <div className="window-bar"><span /><span /><span /><strong>Jvision Glass Console</strong></div>
          <div className="console-body">
            <div className="highlight-card">
              <span>今日店務</span>
              <strong>32 張工單追蹤中</strong>
              <p>前擋更換 12 張、石擊修補 8 張、保險請款 7 張、待零件 5 張。</p>
            </div>
            <div className="console-grid">
              <div><span>待零件</span><strong>5</strong></div>
              <div><span>今日金額</span><strong>NT$ 286K</strong></div>
              <div><span>保險送件</span><strong>7</strong></div>
              <div><span>簽名完成</span><strong>91%</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <p className="eyebrow">核心模組</p>
        <h2>讓櫃台、技師、零件與請款都使用同一份最新工單資料。</h2>
        <div className="feature-grid">
          {features.map((feature) => <article key={feature.title}><h3>{feature.title}</h3><p>{feature.body}</p></article>)}
        </div>
      </section>

      <section className="demo-section">
        <div className="section intro-row">
          <div>
            <p className="eyebrow">可操作 Demo</p>
            <h2>新增玻璃工單、送出訂購、推進流程、更新請款與生成 AI 摘要。</h2>
          </div>
          <p>下方是可直接操作的汽車玻璃店務 Demo，不是靜態說明頁；適合展示給玻璃維修店、行動技師與保險請款團隊。</p>
        </div>
        <AutoGlassDemo />
      </section>

      <section className="section" id="workflow">
        <p className="eyebrow">流程價值</p>
        <h2>把從預約到收款的每一步串成清楚可追蹤的服務流程。</h2>
        <div className="module-grid">
          {modules.map((module, index) => (
            <article key={module}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{module}</h3>
              <p>每個模組都連到同一筆工單資料，讓櫃台、技師、零件與請款不用重複輸入。</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div><p className="eyebrow">JVISION DEMO</p><h2>讓汽車玻璃店少等零件、少漏請款、交付更快。</h2></div>
        <a href="#demo" className="primary-link">進入 Demo</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 汽車玻璃維修與請款管理平台 Demo</span>
      </footer>
    </main>
  );
}
