import { CrmDemo } from "@/components/crm-demo";

const features = [
  ["客戶名單管理", "集中管理公司、聯絡人、互動紀錄與下一步行動。"],
  ["銷售進度追蹤", "用可視化管線追蹤商機階段、金額、負責人與成交率。"],
  ["任務與活動", "建立待辦、通話紀錄、Email 追蹤與回訪提醒。"],
  ["銷售報表", "即時查看預估營收、成交率、逾期待辦與團隊績效。"],
  ["自動化流程", "依商機階段自動建立任務、更新狀態與提醒業務跟進。"],
  ["系統整合", "可延伸串接表單、信箱、客服、行銷活動與資料匯入流程。"]
];

const useCases = [
  ["新創業務團隊", "從第一位潛在客戶開始，建立一致的跟進節奏。"],
  ["B2B 銷售", "追蹤需求訪談、提案、報價與成交機會。"],
  ["客服與續約", "把客戶需求、問題紀錄與續約機會放在同一處。"],
  ["主管報表", "快速掌握商機金額、成交預測與待辦風險。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主選單">
          <a href="#features">功能</a>
          <a href="#demo">Demo</a>
          <a href="#use-cases">情境</a>
          <a href="#contact">諮詢</a>
        </nav>
        <a className="header-action" href="#demo">立即試用</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision CRM Platform</p>
          <h1>客戶關係管理平台，讓業務追蹤更清楚</h1>
          <p className="hero-text">
            用一套簡單但完整的 CRM，把客戶資料、銷售管線、任務跟進與報表分析放在同一個工作台。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能模組</a>
          </div>
        </div>
        <div className="hero-ui" aria-label="Jvision CRM 預覽">
          <div className="ui-toolbar">
            <span />
            <span />
            <span />
            <strong>Jvision CRM</strong>
          </div>
          <div className="ui-grid">
            <aside>
              <b>業務總覽</b>
              <span>客戶 1,248</span>
              <span>進行中商機 38</span>
              <span>預估業績 NT$ 4.8M</span>
            </aside>
            <div className="pipeline-preview">
              {["新商機", "已確認", "提案中", "已成交"].map((stage, index) => (
                <div key={stage}>
                  <strong>{stage}</strong>
                  <span>{[12, 9, 6, 3][index]} 筆</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <span>客戶資料</span>
        <span>銷售管線</span>
        <span>任務追蹤</span>
        <span>報表分析</span>
        <span>自動化流程</span>
      </section>

      <section className="features" id="features">
        <div className="section-heading">
          <p className="eyebrow">CRM Toolkit</p>
          <h2>管理客戶關係需要的工具，都集中在同一個工作台</h2>
          <p>Jvision CRM 以客戶資料為中心，串接銷售、任務、活動紀錄、自動化與分析報表。</p>
        </div>
        <div className="feature-grid">
          {features.map(([title, text]) => (
            <article className="feature-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">Live Demo</p>
          <h2>完整功能 Demo 測試</h2>
          <p>直接新增客戶、建立商機、推進管線、建立任務、記錄活動與標記成交，所有成果數據會即時更新。</p>
        </div>
        <CrmDemo />
      </section>

      <section className="use-cases" id="use-cases">
        <div className="section-heading">
          <p className="eyebrow">Use Cases</p>
          <h2>把客戶關係、銷售流程與團隊行動整合起來</h2>
        </div>
        <div className="case-grid">
          {useCases.map(([title, text]) => (
            <article className="case-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact" id="contact">
        <div>
          <p className="eyebrow">Jvision AI</p>
          <h2>讓客戶跟進、銷售流程與團隊協作更有節奏</h2>
          <p>可延伸串接官網表單、Email、客服紀錄、行銷活動與 AI 客戶摘要。</p>
        </div>
        <a className="primary-button" href="#demo">回到 Demo</a>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision CRM Demo，協助團隊集中管理客戶、商機與業務跟進。</p>
      </footer>
    </main>
  );
}
