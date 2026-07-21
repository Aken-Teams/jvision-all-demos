import { StaffDispatchDemo } from "@/components/staff-dispatch-demo";

const modules = [
  ["派遣員工資料", "建立員工基本資料、工種、證照、聯絡方式與日薪/時薪規則。"],
  ["客戶與工地", "維護客戶、案場、派工地址、窗口、合約單價與請款條件。"],
  ["派工排班", "快速安排水電工、粗工、清潔、拆除、木工與臨時人力。"],
  ["出勤工時", "登錄外派日期、實際工時、加班、交通津貼與缺勤原因。"],
  ["結算調整", "依出勤資料自動試算薪資，支援扣款、津貼與補差額調整。"],
  ["薪資清冊", "批次產生派遣員工應發薪資、明細與發放狀態。"],
  ["請款報表", "依客戶、案場與日期彙整派工費用，快速產出請款資料。"],
  ["管理分析", "掌握人力利用率、未結工時、待發薪資與客戶毛利。"],
];

const trades = ["水電工", "粗工", "清潔工", "工廠作業員", "拆除工", "木工", "油漆工", "臨時工"];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含員工建檔、派工、出勤工時、薪資結算與清冊紀錄。"],
  ["手機可以使用嗎？", "可以。介面已做 RWD，手機會改成單欄派工與結算工作台。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#modules">系統模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">開始派工</a>
      </header>

      <section className="hero dispatch-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Workforce Dispatch</p>
          <h1>人力派遣、出勤工時、薪資結算與請款報表，一套完成。</h1>
          <p className="hero-text">
            Jvision 協助派遣公司管理臨時工、粗工、水電工、清潔工與各類工地人力，
            從員工建檔、客戶案場、派工排班到薪資清冊與請款資料，讓每日派工不再靠紙本與訊息拼湊。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看功能</a>
          </div>
        </div>

        <div className="dispatch-preview" aria-label="Jvision dispatch dashboard preview">
          <div className="preview-card main">
            <span>今日派工</span>
            <strong>38 人</strong>
            <p>5 個案場，待補工 4 人</p>
          </div>
          <div className="preview-card"><span>出勤完成</span><strong>31</strong></div>
          <div className="preview-card"><span>待結薪資</span><strong>NT$ 86K</strong></div>
          <div className="preview-card"><span>請款案件</span><strong>12</strong></div>
          <div className="preview-card"><span>缺勤異常</span><strong>3</strong></div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">系統模組</p>
          <h2>從接單派工到薪資清冊，建立可追蹤的人力派遣流程。</h2>
        </div>
        <div className="module-grid">
          {modules.map(([title, text], index) => (
            <article className="module-card" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scenario-band">
        <div className="section-heading">
          <p className="eyebrow">適用工種</p>
          <h2>不同工種、案場與計薪方式，都能用同一個工作台處理。</h2>
        </div>
        <div className="scenario-grid">
          {trades.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>直接測試派遣員工建檔、派工出勤與薪資結算。</h2>
          <p>可新增員工、建立派工單、更新出勤工時、加入津貼或扣款，並即時產生薪資清冊與請款摘要。</p>
        </div>
        <StaffDispatchDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">管理價值</p>
          <h2>把每天分散的工時與派工資訊，收回到同一份可結算資料。</h2>
        </div>
        <div className="review-grid">
          {[
            ["派工更快", "以工種、案場與可用人力快速安排人員，減少電話與群組追問。"],
            ["結薪更準", "工時、加班、津貼與扣款都能留存，月底批次產生薪資清冊。"],
            ["請款更清楚", "依客戶案場彙整派工天數與費用，方便核對請款明細。"],
          ].map(([title, text]) => (
            <article className="review-card" key={title}>
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
        <p>Jvision 人力派遣管理 Demo，示範派遣員工、派工出勤、薪資清冊與請款報表流程。</p>
      </footer>
    </main>
  );
}
