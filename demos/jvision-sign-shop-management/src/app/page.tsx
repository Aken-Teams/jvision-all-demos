import SignShopDemo from "../components/sign-shop-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  {
    title: "銷售跟進",
    body: "把客戶需求、聯絡紀錄、提醒與下一步集中管理，避免漏追案。",
  },
  {
    title: "報價模板",
    body: "依招牌、燈箱、車貼、輸出施工快速建立報價，掌握成本與毛利。",
  },
  {
    title: "工單看板",
    body: "從洽談、報價、製作到安裝排程，讓每個人都看得到進度。",
  },
  {
    title: "檔案集中",
    body: "設計稿、丈量照片、施工圖與客戶確認文件都跟著案件走。",
  },
  {
    title: "團隊任務",
    body: "將設計、輸出、製作、安裝與客服任務指派給對的人。",
  },
  {
    title: "AI 店務摘要",
    body: "自動整理高風險案件、待報價、待安裝與收款提醒。",
  },
];

const modules = [
  "線索與客戶",
  "報價與合約",
  "製作工單",
  "安裝排程",
  "檔案資料庫",
  "營收與毛利",
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
          <span>招牌店務與工單管理平台</span>
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
          <p className="eyebrow">JVISION SIGN SHOP OPERATIONS PLATFORM</p>
          <h1>把線索、報價、製作、安裝與檔案整合成一個招牌店務工作台。</h1>
          <p>
            Jvision 協助招牌、廣告工程、輸出與車貼店，把客戶跟進、報價模板、工單看板、
            團隊任務與現場檔案集中管理，讓案子不再靠紙本和零散訊息追進度。
          </p>
          <div className="hero-actions">
            <a href="#demo" className="primary-link">操作 Demo</a>
            <a href="#features" className="secondary-link">查看功能</a>
          </div>
        </div>
        <div className="hero-console" aria-label="Jvision 招牌店務指標">
          <div className="window-bar">
            <span />
            <span />
            <span />
            <strong>Jvision Shop Console</strong>
          </div>
          <div className="console-body">
            <div className="highlight-card">
              <span>本週店務</span>
              <strong>18 件案件追蹤中</strong>
              <p>報價 6 件、製作 7 件、安裝排程 3 件、待回覆 2 件。</p>
            </div>
            <div className="console-grid">
              <div>
                <span>待報價</span>
                <strong>6</strong>
              </div>
              <div>
                <span>本月營收</span>
                <strong>NT$ 1.2M</strong>
              </div>
              <div>
                <span>平均毛利</span>
                <strong>31%</strong>
              </div>
              <div>
                <span>準時交付</span>
                <strong>92%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <p className="eyebrow">核心模組</p>
        <h2>讓招牌店從接案到交付都有人看、有人追、有資料可查。</h2>
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
            <h2>新增案件、產生報價提醒、推進工單、上傳檔案與生成 AI 摘要。</h2>
          </div>
          <p>
            下方不是靜態示意圖，而是一個可直接操作的店務管理 Demo，
            適合展示給招牌、輸出、廣告工程與車貼團隊。
          </p>
        </div>
        <SignShopDemo />
      </section>

      <section className="section" id="workflow">
        <p className="eyebrow">流程價值</p>
        <h2>把零散訊息收斂成一條清楚的交付流程。</h2>
        <div className="module-grid">
          {modules.map((module, index) => (
            <article key={module}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{module}</h3>
              <p>每個模組都能銜接到案件資料，讓業務、設計、製作與安裝同步掌握最新狀態。</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <p className="eyebrow">JVISION DEMO</p>
          <h2>讓招牌工程店少找資料、多準時交付。</h2>
        </div>
        <a href="#demo" className="primary-link">進入 Demo</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 招牌店務與工單管理平台 Demo</span>
      </footer>
    </main>
  );
}
