import OfficeDemo from "../components/office-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const capabilities = [
  ["01", "流程管理平台", "以視覺化流程設計、簽核規則、逾時提醒與行動簽核，讓請購、合約、公文與人事流程快速上線。"],
  ["02", "內容管理平台", "集中管理公告、制度文件、知識庫與圖文內容，支援分類、權限與全文搜尋。"],
  ["03", "門戶管理平台", "打造員工、主管、合作夥伴不同入口，將待辦、公告、數據與常用服務整合在同一畫面。"],
  ["04", "資料管理中心", "把表單資料、營運指標、報表查詢與資料視覺化集中管理，協助主管掌握決策現況。"],
  ["05", "服務管理平台", "以 API、事件、排程任務與 AI Agent 串接既有系統，讓 OA 不只辦公，也能驅動業務。"]
];

const apps = [
  ["公文管理", "收發文、會辦、簽核、歸檔與版次紀錄一次完成。"],
  ["人事管理", "請假、出勤、員工資料、職務異動與到職流程整合。"],
  ["會議管理", "會議室預約、議程、紀錄、待辦追蹤與行事曆同步。"],
  ["合約管理", "合約審核、到期提醒、用印流程與風險條款檢查。"],
  ["固定資產", "資產申請、領用、盤點、維修與報廢閉環追蹤。"],
  ["企業網盤", "部門文件、專案檔案與權限共享集中控管。"],
  ["工作管理", "任務指派、進度追蹤、跨部門協作與成果回報。"],
  ["AI 助手", "用自然語言查制度、產生摘要、判斷流程下一步。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#capabilities">核心能力</a>
          <a href="#demo">功能 Demo</a>
          <a href="#apps">業務應用</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section id="top" className="hero">
        <div>
          <p className="eyebrow">低代碼 / 協同辦公 / AI 自動化</p>
          <h1>Jvision 企業數位協同辦公中樞</h1>
          <p className="hero-text">
            以流程簽核、內容門戶、資料中心、行動辦公與 AI 助手為核心，協助企業把日常辦公、跨部門協作與管理決策放進同一個可擴充平台。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開啟功能 Demo</a>
            <a className="secondary-button" href="#capabilities">查看平台架構</a>
          </div>
        </div>

        <div className="hero-console" aria-label="Jvision 工作台預覽">
          <div className="console-top">
            <span />
            <span />
            <span />
            <strong>Jvision OA Console</strong>
          </div>
          <div className="console-grid">
            <article className="flow-card">
              <div className="flow-step"><b>1</b><strong>員工送出請購</strong><em className="pill">已送出</em></div>
              <div className="flow-step"><b>2</b><strong>主管簽核</strong><em className="pill">待處理</em></div>
              <div className="flow-step"><b>3</b><strong>財務覆核</strong><em className="pill">排程中</em></div>
            </article>
            <article className="approval-card">
              <span>今日待辦</span>
              <strong>28 件</strong>
              <p>流程、合約、會議紀錄與資產申請集中提醒。</p>
            </article>
            <article className="mobile-card">
              <div><strong>行動簽核</strong><span>手機即時完成</span></div>
              <div><strong>知識搜尋</strong><span>制度文件秒查</span></div>
              <div><strong>AI 摘要</strong><span>自動整理重點</span></div>
            </article>
          </div>
        </div>
      </section>

      <section id="capabilities" className="sections">
        <div className="section-heading">
          <p className="eyebrow">平台架構</p>
          <h2>五大核心能力，支撐企業從辦公協同到業務自動化</h2>
          <p>參考企業 OA 平台常見架構，Jvision 將流程、內容、門戶、資料與服務整合，讓每個部門都能用自己的節奏建立數位作業。</p>
        </div>
        <div className="capability-grid">
          {capabilities.map(([index, title, text]) => (
            <article className="capability-card" key={title}>
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
          <h2>直接測試流程送審、門戶公告、資料查詢與 AI 摘要</h2>
          <p>下方不是靜態說明，可以新增簽核單、推進流程、查詢企業內容，並讓 AI 助手產生今天的辦公摘要。</p>
        </div>
        <OfficeDemo logoUrl={logoUrl} />
      </section>

      <section id="apps" className="apps-section">
        <div className="section-heading">
          <p className="eyebrow">業務應用</p>
          <h2>常用辦公場景都能快速組合</h2>
          <p>從行政、人資、財務、法務到資訊部門，Jvision 可用低代碼方式延伸出符合企業流程的專屬應用。</p>
        </div>
        <div className="app-grid">
          {apps.map(([title, text]) => (
            <article className="app-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact">
        <div>
          <p className="eyebrow">Jvision Demo</p>
          <h2>把企業流程、文件、資料與 AI 服務放在同一個入口</h2>
          <p>適合展示企業內部 OA、低代碼流程、行動簽核、資料中心與 AI 協作的完整互動樣板。</p>
        </div>
        <a className="primary-button" href="#demo">立即測試</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 企業協同辦公平台 Demo</span>
      </footer>
    </main>
  );
}
