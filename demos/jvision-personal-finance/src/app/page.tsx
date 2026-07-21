import { PersonalFinanceDemo } from "@/components/personal-finance-demo";

const features = [
  ["全資產總覽", "整合現金、銀行、信用卡、投資與負債，快速掌握淨資產變化。"],
  ["自動記帳", "匯入交易後可依商家、金額與備註快速分類，降低手動整理時間。"],
  ["預算控管", "設定餐飲、交通、娛樂、購物等分類預算，追蹤本月剩餘額度。"],
  ["帳單提醒", "建立信用卡、保費、房租、貸款與訂閱制提醒，避免逾期付款。"],
  ["財務分析", "用收入、支出、儲蓄率、消費分類與趨勢圖掌握金流習慣。"],
  ["目標儲蓄", "設定旅遊、緊急預備金、投資本金等目標，追蹤達成進度。"],
  ["多帳戶管理", "支援不同帳戶間轉帳、餘額校正與交易紀錄對帳。"],
  ["隱私安全", "以清楚的權限與資料狀態呈現，讓使用者放心管理財務資料。"],
];

const faqs = [
  ["Demo 可以操作什麼？", "可以新增帳戶、匯入交易、自動分類、調整預算、建立帳單提醒與新增儲蓄目標。"],
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

      <section className="hero money-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Personal Finance</p>
          <h1>個人財務管理平台，把資產、記帳、預算、帳單與目標儲蓄放在同一處</h1>
          <p className="hero-text">
            以日常理財的核心流程為主，協助使用者集中掌握帳戶餘額、交易分類、月度預算、帳單提醒、支出分析與儲蓄目標，讓財務狀態更清楚。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">進入 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision 個人財務儀表板">
          <div className="preview-top">
            <span>Jvision MoneyOps</span>
            <strong>儲蓄率 32%</strong>
          </div>
          <div className="property-board">
            <span>淨資產 NT$ 842K</span>
            <span>本月支出 NT$ 38K</span>
            <span>帳單提醒 4</span>
            <span>預算剩餘 46%</span>
            <strong>
              我的財務總覽
              <br />
              目標達成 68%
            </strong>
          </div>
          <div className="preview-bottom">
            <span>已分類交易 128</span>
            <span>同步帳戶 6</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">Finance Modules</p>
          <h2>Jvision 把個人財務的帳戶、交易、預算與提醒整合成可操作的管理工作台</h2>
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
          <h2>直接操作 Jvision 個人財務管理流程</h2>
          <p>新增帳戶、匯入交易、自動分類、調整預算、建立帳單提醒與新增儲蓄目標，展示完整可測試的理財記帳流程。</p>
        </div>
        <PersonalFinanceDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>適合想要清楚掌握收支、帳單、預算與資產變化的使用者</h2>
        </div>
        <div className="reason-grid">
          {[
            ["日常記帳", "快速把消費交易分類，讓使用者知道錢花在哪裡。"],
            ["預算提醒", "用分類預算與帳單提醒降低超支與逾期付款風險。"],
            ["資產成長", "追蹤淨資產、儲蓄率與目標進度，讓理財方向更具體。"],
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
        <p>Jvision 個人財務管理 Demo，提供線上展示與行銷素材。</p>
      </footer>
    </main>
  );
}
