import { CourseSuiteDemo } from "@/components/course-suite-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  ["課程上架", "建立課程、講師、售價、章節與影音單元。"],
  ["銷售頁與購課", "支援課程包、折扣活動、付款與購課名單。"],
  ["課表預約", "管理團課、私課、座位、候補與通知流程。"],
  ["學員管理", "追蹤學習進度、作業繳交、老師回饋與完課狀態。"],
  ["內容營運", "管理試看、直播、講義、作業與通知文案。"],
  ["營運報表", "追蹤營收、轉換率、完課率與候補需求。"],
];

const sources = [
  ["課程工具平台", "課表同步、線上預約、購課劃位、候補通知、電子合約與發票。"],
  ["線上課程平台", "課程上架、學員管理、銷售、學習進度與營運分析。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src={logoUrl} alt="Jvision logo" />
          <span>課程學習整合平台</span>
        </a>
        <nav aria-label="主選單">
          <a href="#features">功能模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#source">整合來源</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Course Learning Suite</p>
          <h1>把課程工具、線上課程、預約購課與學員進度整合成一個平台。</h1>
          <p className="hero-text">
            新整合版把課程工具平台與線上課程平台合併：課程上架、課表預約、候補劃位、
            購課銷售、影音單元、作業回饋、學員進度與 AI 營運摘要一次完成。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="hero-console" aria-label="Jvision 課程平台預覽">
          <div className="console-top"><span /><span /><span /><strong>Jvision Course Control</strong></div>
          <div className="preview-grid">
            <article><span>完課率</span><strong>72%</strong></article>
            <article><span>候補名單</span><strong>8</strong></article>
            <article><span>本月營收</span><strong>NT$ 482K</strong></article>
            <div className="timeline">{["上架", "銷售", "預約", "學習", "回饋", "報表"].map((item) => <b key={item}>{item}</b>)}</div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-heading">
          <p className="eyebrow">整合功能</p>
          <h2>從課程內容到學員交付，讓線上課與場館課程都能一起管理。</h2>
        </div>
        <div className="feature-grid">
          {features.map(([title, text]) => <article className="feature-card" key={title}><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">Live Demo</p>
          <h2>可以新增課程、發布上架、預約課表、加入候補、回覆作業與查看營運摘要。</h2>
          <p>這不是靜態介紹頁，而是可以直接操作的課程營運工作台。</p>
        </div>
        <CourseSuiteDemo />
      </section>

      <section className="section" id="source">
        <div className="section-heading">
          <p className="eyebrow">合併來源</p>
          <h2>整合既有流程，形成一個更完整的管理工作台。</h2>
        </div>
        <div className="source-grid">
          {sources.map(([title, text]) => <article key={title}><strong>{title}</strong><span>{text}</span></article>)}
        </div>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision logo" />
        <span>Jvision 課程學習整合平台 Demo</span>
      </footer>
    </main>
  );
}
