import TowingDispatchDemo from "../components/towing-dispatch-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  {
    title: "雲端派遣",
    body: "從來電、保險公司、警政或停車場案件建立任務，快速指派司機與車輛。",
  },
  {
    title: "車隊狀態",
    body: "掌握拖吊車是否可派遣、出勤中或保養中，減少調度台反覆確認。",
  },
  {
    title: "手機回報",
    body: "司機可回報抵達、拖吊中、完成與照片紀錄，辦公室同步看得到。",
  },
  {
    title: "扣車管理",
    body: "違停移置、保管場入庫、車主聯繫與放行資料可串在同一任務。",
  },
  {
    title: "帳務收款",
    body: "道路救援、拖吊、保管與保險公司帳款集中追蹤，減少漏開單。",
  },
  {
    title: "營運報表",
    body: "查看每日接案、司機績效、車輛成本、應收帳款與服務類型分布。",
  },
];

const modules = [
  "接單派遣",
  "司機任務",
  "車隊定位",
  "扣車入庫",
  "帳務收款",
  "營運報表",
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
          <span>拖吊派遣與車隊管理平台</span>
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
          <p className="eyebrow">JVISION TOWING DISPATCH PLATFORM</p>
          <h1>把拖吊接單、派遣、車隊狀態、扣車與帳務整合成一個調度中心。</h1>
          <p>
            Jvision 協助拖吊公司、道路救援、保管場與車輛運送團隊，把來電接案、
            司機指派、車輛狀態、帳務收款與營運報表放在同一個雲端工作台。
          </p>
          <div className="hero-actions">
            <a href="#demo" className="primary-link">操作 Demo</a>
            <a href="#features" className="secondary-link">查看功能</a>
          </div>
        </div>
        <div className="hero-console" aria-label="Jvision 拖吊派遣指標">
          <div className="window-bar">
            <span />
            <span />
            <span />
            <strong>Jvision Dispatch Console</strong>
          </div>
          <div className="console-body">
            <div className="highlight-card">
              <span>今日派遣</span>
              <strong>24 件任務處理中</strong>
              <p>道路救援 9 件、事故拖吊 6 件、違停移置 5 件、車輛運送 4 件。</p>
            </div>
            <div className="console-grid">
              <div>
                <span>平均抵達</span>
                <strong>16 分</strong>
              </div>
              <div>
                <span>今日金額</span>
                <strong>NT$ 182K</strong>
              </div>
              <div>
                <span>可派遣車</span>
                <strong>5 台</strong>
              </div>
              <div>
                <span>帳務待辦</span>
                <strong>8 筆</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <p className="eyebrow">核心模組</p>
        <h2>讓調度台、司機、保管場與帳務都使用同一份最新任務資料。</h2>
        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-section">
        <div className="section intro-row">
          <div>
            <p className="eyebrow">可操作 Demo</p>
            <h2>新增救援任務、指派最近車輛、推進派遣流程、更新帳務與生成 AI 摘要。</h2>
          </div>
          <p>
            下方是可直接操作的拖吊派遣 Demo，不是靜態說明頁；
            適合展示給拖吊公司、道路救援、車隊調度與保管場團隊。
          </p>
        </div>
        <TowingDispatchDemo />
      </section>

      <section className="section" id="workflow">
        <p className="eyebrow">流程價值</p>
        <h2>把從接單到收款的每一步串成清楚可追蹤的服務流程。</h2>
        <div className="module-grid">
          {modules.map((module, index) => (
            <article key={module}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{module}</h3>
              <p>每個模組都連到同一筆任務資料，讓調度、司機、保管場與帳務不用重複輸入。</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <p className="eyebrow">JVISION DEMO</p>
          <h2>讓拖吊派遣更即時，讓車隊與帳務更透明。</h2>
        </div>
        <a href="#demo" className="primary-link">進入 Demo</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 拖吊派遣與車隊管理平台 Demo</span>
      </footer>
    </main>
  );
}
