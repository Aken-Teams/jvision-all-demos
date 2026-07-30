import { PropertyDemo } from "../components/property-demo";

const features = [
  ["房源集中管理", "整合物件、房型、房號、租金、狀態與出租率，快速掌握整體資產。"],
  ["租約與線上簽署", "合約模板、租期、押金、承租人資料與簽署狀態集中追蹤。"],
  ["帳單租金管理", "自動建立租金、管理費、水電與雜費帳單，追蹤待收與已收。"],
  ["修繕維護", "承租人報修、派工、狀態、費用與照片紀錄形成閉環。"],
  ["點交退租續約", "入住點交、現況確認、租約到期、退租與續約提醒。"],
  ["AI 現況確認", "以項目化方式模擬房況檢查，產出可追蹤的現況紀錄。"],
  ["權限與團隊協作", "代管公司、房東、業務、客服與維修角色可分工管理。"],
  ["租金對帳報表", "收款、匯款、押金、維修扣款與房東報表可視覺化。"]
];

const faqs = [
  ["可以直接測試嗎？", "可以。下方 demo 可新增房源、建立租約、收租、報修、點交與生成 AI 現況。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">代管功能</a>
          <a href="#demo">功能 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero property-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Property Operations</p>
          <h1>房產租賃代管平台，讓房源、租約、租金與修繕流程一站管理</h1>
          <p className="hero-text">
            參考租屋代管平台架構打造：房源列表、線上簽約、帳單租金、修繕、點退續約、AI 現況確認與租金對帳全部可展示。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能架構</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision 物業代管預覽">
          <div className="preview-top"><span>Jvision Rentals</span><strong>出租率 93%</strong></div>
          <div className="property-board">
            <span>房源 128</span><span>待收租 16</span><span>報修 9</span><span>到期 7</span>
            <strong>Rent Ops Center<br />NT$ 2.84M 月租金</strong>
          </div>
          <div className="preview-bottom"><span>線上簽約 24</span><span>對帳差異 2</span></div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">Property Management Stack</p>
          <h2>Jvision 把代管公司每天重複處理的租務流程變成可追蹤系統</h2>
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
          <h2>直接測試 Jvision 房產租賃代管流程</h2>
          <p>所有資料在瀏覽器即時模擬，可作為租屋代管、包租代管、資產管理與物業客服展示。</p>
        </div>
        <PropertyDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>從招租簽約到收租修繕，讓房東與代管團隊看見同一份狀態</h2>
        </div>
        <div className="reason-grid">
          {["房源招租", "租約帳務", "修繕點交"].map((title) => (
            <article className="reason-card" key={title}>
              <h3>{title}</h3>
              <p>用標準化流程降低漏收、漏修與到期未追蹤，讓租務營運更透明。</p>
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
        <p>Jvision 房產租賃代管 Demo。</p>
      </footer>
    </main>
  );
}
