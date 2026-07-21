import OpticalDemo from "../components/optical-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  ["01", "24H 雲端預約", "顧客可透過官網與 LINE 自助預約驗光、取件與保養服務，並自動避開排班衝突。"],
  ["02", "會員 CRM", "集中管理顧客度數、驗光紀錄、消費偏好、回購次數與保固資料。"],
  ["03", "回訪自動追蹤", "依取件日、配戴週期與商品類型，自動安排 30/90/180/365 天追蹤提醒。"],
  ["04", "LINE 會員經營", "分眾推播生日、回購、保養與好評邀請，取代無效群發。"],
  ["05", "門市品牌官網", "生成支援 SEO 的門市頁，串接地圖、預約與驗光師資訊。"],
  ["06", "驗光處方與工單", "數位化驗光處方、鏡片規格、加工工單與交付狀態。"],
  ["07", "AI 客服與好評", "即時回答常見問題，引導預約並在服務完成後邀請 Google 好評。"],
  ["08", "隱形眼鏡商城", "零庫存上架熱門隱形眼鏡，顧客下單後通路直送並自動對帳。"]
];

const modules = [
  ["預約排班", "驗光師班表、服務項目、候補名單、LINE 提醒與爽約追蹤。"],
  ["會員資料", "度數、處方、消費紀錄、品牌偏好、保固卡與生日標籤。"],
  ["回訪規則", "配鏡滿月、90 天保養、半年檢查、週年回訪自動觸發。"],
  ["LINE 推播", "分眾名單、訊息模板、開啟率、點擊率與推播上限管理。"],
  ["驗光工單", "Rx 處方、鏡片規格、加工進度、取件通知與電子簽核。"],
  ["好評引擎", "滿意顧客邀請、負評提醒、Google 商家資料與口碑追蹤。"],
  ["商城對帳", "隱形眼鏡商品、通路出貨、訂單狀態與月結報表。"],
  ["AI 助理", "今日預約、回訪名單、訊息建議與業績機會摘要。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">核心功能</a>
          <a href="#demo">功能 Demo</a>
          <a href="#modules">模組架構</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section id="top" className="hero">
        <div>
          <p className="eyebrow">眼鏡門市 / 預約 CRM / LINE 會員經營</p>
          <h1>Jvision 眼鏡門市預約會員經營平台</h1>
          <p className="hero-text">
            把 24H 預約、會員 CRM、驗光處方、回訪追蹤、LINE 推播、好評邀請與隱形眼鏡商城放進同一個門市經營工作台。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開啟功能 Demo</a>
            <a className="secondary-button" href="#features">查看核心功能</a>
          </div>
        </div>

        <div className="phone-frame" aria-label="Jvision LINE 會員經營預覽">
          <div className="phone-top">
            <span />
            <span />
            <span />
            <strong>Jvision 智能助理</strong>
          </div>
          <div className="chat-area">
            <div className="bubble store">王小姐您好，您的新眼鏡已配戴滿 30 天，適應狀況如何？</div>
            <div className="bubble customer">戴起來很舒服，不過看近時偶爾還是有點不習慣。</div>
            <div className="bubble ai">AI 建議：這是常見適應期，建議安排回店微調，並推送保養提醒。</div>
            <div className="mini-dashboard">
              <div><span>今日預約</span><strong>24</strong></div>
              <div><span>回訪名單</span><strong>16</strong></div>
              <div><span>好評邀請</span><strong>9</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">核心功能</p>
          <h2>從驗光預約到配鏡回訪，把顧客關係留下來</h2>
          <p>Jvision 協助眼鏡門市把電話預約、紙本處方、零散會員資料與 LINE 訊息整合成可追蹤、可自動化、可分析的經營流程。</p>
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
          <h2>新增驗光預約、追蹤配鏡回訪、發送 LINE 訊息</h2>
          <p>下方可以實際新增預約、更新服務狀態、查看回訪名單與優先提醒名單，並產生 AI 門市營運摘要。</p>
        </div>
        <OpticalDemo logoUrl={logoUrl} />
      </section>

      <section id="modules" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">模組架構</p>
          <h2>為眼鏡行打造的預約、會員與回訪系統</h2>
          <p>從 24H 預約與 LINE 提醒開始，逐步延伸到驗光處方、配鏡工單、口碑經營與隱形眼鏡商城。</p>
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
          <h2>讓眼鏡門市不只完成交易，也留下下一次回店的理由</h2>
          <p>適合展示眼鏡店預約管理、會員 CRM、驗光工單、LINE 行銷、回訪追蹤與 AI 客服。</p>
        </div>
        <a className="primary-button" href="#demo">立即測試</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 眼鏡門市預約會員經營 Demo</span>
      </footer>
    </main>
  );
}
