import { BizBooksDemo } from "@/components/bizbooks-demo";

const features = [
  ["銀行明細匯入", "匯入銀行與金流交易，快速核對收入、支出、手續費與未分類項目。"],
  ["直覺記帳", "用收支情境、科目分類與備註快速建立分錄，降低會計門檻。"],
  ["三大財報", "即時查看損益表、資產負債表與現金流量，掌握公司財務健康度。"],
  ["應收應付", "追蹤客戶應收、供應商應付、到期日、逾期狀態與收付款進度。"],
  ["代墊款管理", "記錄員工代墊、憑證、專案歸屬與核銷狀態，避免漏報漏款。"],
  ["專案損益", "把收入、成本、代墊與工時歸到專案，快速看出毛利與盈虧。"],
  ["多人協作", "老闆、會計與專案負責人可用不同視角查看同一份財務資料。"],
  ["行業模板", "依服務業、顧問、電商、工程與創作者等情境快速套用常用科目。"],
];

const faqs = [
  ["Demo 可以操作什麼？", "可以匯入銀行明細、分類交易、建立應收付、代墊款、專案收入與產生財報。"],
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

      <section className="hero books-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Business Books</p>
          <h1>企業財務記帳平台，把銀行明細、應收付、代墊款與財報整合成一個工作台</h1>
          <p className="hero-text">
            面向中小企業、顧問服務、電商與專案型團隊，集中管理銀行金流、交易分類、應收應付、代墊核銷、專案損益與三大財報，讓老闆和會計都看得懂。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">進入 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision 企業財務儀表板">
          <div className="preview-top">
            <span>Jvision BizBooks</span>
            <strong>本月毛利 38%</strong>
          </div>
          <div className="property-board">
            <span>銀行交易 186</span>
            <span>未分類 9</span>
            <span>應收 NT$ 1.2M</span>
            <span>應付 NT$ 420K</span>
            <strong>
              財務營運總覽
              <br />
              現金流 +NT$ 680K
            </strong>
          </div>
          <div className="preview-bottom">
            <span>專案毛利 24%</span>
            <span>代墊待核 6</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">Accounting Modules</p>
          <h2>Jvision 把日常收支、專案損益與管理報表變成可操作的財務流程</h2>
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
          <h2>直接操作 Jvision 企業財務記帳流程</h2>
          <p>匯入銀行明細、分類交易、建立應收付、代墊款、專案收入與產生財報，展示完整可測試的財務工作台。</p>
        </div>
        <BizBooksDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>適合需要掌握金流、專案成本與管理報表的中小企業</h2>
        </div>
        <div className="reason-grid">
          {[
            ["老闆看營運", "快速掌握現金流、應收付、毛利與專案損益，不必等待月底報表。"],
            ["會計做帳", "銀行明細與交易分類集中處理，減少重複輸入與漏帳。"],
            ["專案管理", "收入、成本、代墊與請款回到專案，看見每案真實利潤。"],
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
        <p>Jvision 企業財務記帳 Demo，提供線上展示與行銷素材。</p>
      </footer>
    </main>
  );
}
