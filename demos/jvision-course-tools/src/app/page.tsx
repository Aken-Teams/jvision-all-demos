import { CourseToolsDemo } from "@/components/course-tools-demo";

const featureBlocks = [
  {
    eyebrow: "課表同步",
    title: "排課狀態一次看懂",
    text: "團課、私教、場地與教練時段集中在同一個工作台，支援複製週課表、衝突提醒與權限分級。",
    points: ["一鍵複製上週課表", "教練與教室衝突偵測", "草稿、已發布、滿班狀態清楚標示"]
  },
  {
    eyebrow: "預約購課",
    title: "預約、購課、劃位全年自動",
    text: "會員可以用手機完成選課、付款與候補，管理端即時看到名額變化，降低櫃台與客服負擔。",
    points: ["課程分類與老師篩選", "候補遞補與通知", "座位圖即時鎖定"]
  },
  {
    eyebrow: "合約發票",
    title: "結帳後自動生成合約與發票",
    text: "依方案、金額與購買日期產生電子合約，並保留付款紀錄與發票狀態，讓對帳更輕鬆。",
    points: ["電子合約簽署", "發票開立與寄送", "退款與折讓紀錄"]
  }
];

const reserveItems = [
  ["簡單易懂的預約介面", "清楚顯示每日課程，點選即可預約或購買。"],
  ["團課 / 師資直覺分類", "依課程類型、時段或老師快速切換。"],
  ["團課候補自動遞補", "滿班也能候補，釋出名額後自動通知。"],
  ["篩選課程類別 / 時段", "快速找到會員真正想上的課。"],
  ["老師資訊與課程包", "講師專長、可預約時段與購課方案一次看。"],
  ["依喜好預先劃位", "前排、角落或器材區都能即時鎖定。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">功能架構</a>
          <a href="#reserve">會員體驗</a>
          <a href="#demo">Demo 測試</a>
          <a href="#contact">諮詢</a>
        </nav>
        <a className="header-action" href="#demo">立即試用</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Course Operations</p>
          <h1>
            將課程預約管理變為
            <span>經營優勢</span>
          </h1>
          <p className="hero-text">團課、私課排程，排課及購課一目瞭然。從課表同步、線上預約、候補劃位到電子合約與發票，讓運動場館把日常營運流程自動化。</p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#features">了解系統架構</a>
          </div>
        </div>
        <div className="hero-product" aria-label="Jvision 課程工具介面預覽">
          <div className="product-window">
            <div className="window-toolbar">
              <span />
              <span />
              <span />
              <strong>Jvision 課程工具</strong>
            </div>
            <div className="course-preview">
              <aside>
                <b>今日課表</b>
                <span>8 堂課</span>
                <span>92% 出席率</span>
                <span>3 位候補</span>
              </aside>
              <div className="preview-calendar">
                {["瑜珈基礎", "拳擊燃脂", "TRX 核心", "皮拉提斯"].map((name, index) => (
                  <div className="preview-class" key={name}>
                    <span>{index + 9}:00</span>
                    <strong>{name}</strong>
                    <small>{index === 1 ? "滿班候補" : "可預約"}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="section-heading">
          <p className="eyebrow">Operations Stack</p>
          <h2>Jvision 依照場館每日流程設計，從排課到收款都能串在一起</h2>
        </div>
        <div className="feature-grid">
          {featureBlocks.map((block) => (
            <article className="feature-card" key={block.title}>
              <span>{block.eyebrow}</span>
              <h3>{block.title}</h3>
              <p>{block.text}</p>
              <ul>
                {block.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="reserve" id="reserve">
        <div className="section-heading">
          <p className="eyebrow">Member Journey</p>
          <h2>
            預約 / 購課 / 劃位
            <br />
            全年服務<span>無需人力</span>
          </h2>
        </div>
        <div className="reserve-grid">
          {reserveItems.map(([title, text], index) => (
            <article className="reserve-card" key={title}>
              <div className="phone-mock">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">Live Demo</p>
          <h2>完整功能 Demo 測試區</h2>
          <p>這裡不是靜態說明。你可以新增課程、複製週課表、模擬會員購課、預約候補、選座位、簽電子合約並產生發票紀錄。</p>
        </div>
        <CourseToolsDemo />
      </section>

      <section className="contact" id="contact">
        <div>
          <p className="eyebrow">Jvision AI</p>
          <h2>為你的場館設計專屬課程營運流程</h2>
          <p>適用於健身房、瑜珈教室、舞蹈教室、拳館、皮拉提斯與複合式運動場館。</p>
        </div>
        <a className="primary-button" href="#demo">返回 Demo</a>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 課程工具 Demo。</p>
      </footer>
    </main>
  );
}
