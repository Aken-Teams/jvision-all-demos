import { AttendanceDemo } from "@/components/attendance-demo";

const features = [
  ["雲端打卡", "支援手機、網頁、IP、GPS 與門禁硬體整合，集中記錄上下班時間。"],
  ["外勤定位", "員工可在外勤地點打卡與回報任務，主管可查看 GPS 狀態與備註。"],
  ["異常判斷", "自動標記遲到、早退、漏打卡、超時與地點異常，減少人工檢查。"],
  ["請假簽核", "支援假別、天數、代理人與主管簽核流程，請假紀錄自動回寫出勤。"],
  ["排班管理", "設定班別、休息時間、彈性工時與輪班規則，適合多據點團隊。"],
  ["工時計薪", "依出勤、加班、請假與異常資料試算工時，協助薪資前置作業。"],
  ["主管儀表板", "即時查看今日到班率、異常件數、待簽核申請與外勤人員。"],
  ["BI 分析", "分析部門出勤、加班趨勢、假別使用與人力投入狀況。"],
];

const faqs = [
  ["Demo 可以操作什麼？", "可以新增員工、上下班打卡、建立外勤回報、標記異常、送出請假與主管簽核。"],
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

      <section className="hero attendance-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Attendance Cloud</p>
          <h1>出勤差勤管理平台，整合打卡、外勤、請假、簽核與工時計算</h1>
          <p className="hero-text">
            適合辦公室、門市、製造、外勤與多據點團隊，將上下班打卡、GPS 外勤回報、出勤異常、請假簽核、排班與工時計薪集中到同一個工作台。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">進入 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision 出勤差勤儀表板">
          <div className="preview-top">
            <span>Jvision AttendanceOps</span>
            <strong>到班率 96%</strong>
          </div>
          <div className="property-board">
            <span>今日打卡 184</span>
            <span>異常 7</span>
            <span>外勤 23</span>
            <span>待簽核 11</span>
            <strong>
              出勤人力總覽
              <br />
              加班時數 42h
            </strong>
          </div>
          <div className="preview-bottom">
            <span>漏打卡 3</span>
            <span>請假申請 8</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">HR Attendance Modules</p>
          <h2>Jvision 把每日打卡、異常、請假簽核與工時計算整合成 HR 工作流</h2>
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
          <h2>直接操作 Jvision 出勤差勤工作台</h2>
          <p>新增員工、上下班打卡、外勤回報、建立異常、送出請假、主管簽核與工時計算，展示完整可測試的人資出勤流程。</p>
        </div>
        <AttendanceDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>適合需要管控多地點出勤、外勤與薪資前置資料的企業</h2>
        </div>
        <div className="reason-grid">
          {[
            ["HR 管理", "快速彙整打卡、請假、加班與異常，減少月底人工核對。"],
            ["主管簽核", "掌握部門今日到班與待簽核申請，異常即時處理。"],
            ["外勤團隊", "外出人員可回報定位、任務與打卡狀態，降低資訊落差。"],
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
        <p>Jvision 出勤差勤管理 Demo，提供線上展示與行銷素材。</p>
      </footer>
    </main>
  );
}
