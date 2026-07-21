import { CourseDemo } from "@/components/course-demo";

const features = [
  ["快速建立課程網站", "不用從零架站，快速建立品牌課程首頁、講師介紹與課程銷售頁。"],
  ["產品與銷售管理", "支援單堂課、課程組合、訂閱方案、折扣碼與限時活動。"],
  ["金流與電子發票", "模擬信用卡、轉帳、折扣結帳與發票資訊收集。"],
  ["影音串流與單元", "管理章節、影片單元、試看內容與學習進度。"],
  ["學習互動", "作業繳交、老師回饋、留言討論與學員通知。"],
  ["名單磁鐵", "免費講義、直播報名與訂閱表單可導入銷售漏斗。"],
  ["第三方整合", "可串接信件、自動化、社群像素與 CRM 流程。"],
  ["營運報表", "追蹤營收、轉換率、完課率與作業提交率。"]
];

const faqs = [
  ["可以直接測試嗎？", "可以。下方 demo 可新增課程、建立單元、套用折扣、結帳、送作業與回饋。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">平台功能</a>
          <a href="#demo">功能 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero course-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Creator Academy</p>
          <h1>線上課程與知識變現平台，從內容上架到學員互動一次完成</h1>
          <p className="hero-text">
            參考課程平台功能頁架構打造：課程網站、銷售頁、金流、影音單元、作業回饋、名單磁鐵與營運報表完整展示。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能架構</a>
          </div>
        </div>
        <div className="course-preview" aria-label="Jvision 課程平台預覽">
          <div className="browser-bar"><span /><span /><span /><strong>academy.jvision.ai</strong></div>
          <div className="course-screen">
            <p>Masterclass</p>
            <h2>AI 產品實戰課</h2>
            <div className="progress"><i style={{ width: "68%" }} /></div>
            <button>Continue Learning</button>
          </div>
          <div className="preview-products"><span>完課率 68%</span><span>學員 1,240</span><span>營收 NT$ 482K</span></div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">Course Commerce Stack</p>
          <h2>Jvision 把課程內容、銷售、金流與學習互動整合成一套平台</h2>
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
          <h2>直接測試 Jvision 課程平台流程</h2>
          <p>這不是靜態介紹。你可以建立課程、管理單元、套用折扣結帳、送出作業並回覆學員。</p>
        </div>
        <CourseDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Use Cases</p>
          <h2>從個人講師到品牌學院，讓知識產品可被銷售與持續交付</h2>
        </div>
        <div className="reason-grid">
          {["線上課程", "會員訂閱", "直播與名單"].map((title) => (
            <article className="reason-card" key={title}>
              <h3>{title}</h3>
              <p>用統一的內容、銷售與互動流程，把一次性內容變成可經營的產品。</p>
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
        <p>Jvision 線上課程平台 Demo。</p>
      </footer>
    </main>
  );
}
