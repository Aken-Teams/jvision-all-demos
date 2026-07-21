import { ConstructionSuiteDemo } from "@/components/construction-suite-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  ["工程估價", "建立工程項目、業主、預算與報價簽核流程。"],
  ["轉工程專案", "報價核准後帶入預算、進度、工項與成本控管。"],
  ["工地日報", "回報人力、機具、天候、照片與施工重點。"],
  ["品質安衛", "缺失拍照、派工改善、查驗追蹤與稽核紀錄。"],
  ["材料成本", "管理材料進貨、領用、追加與已掛帳成本。"],
  ["估驗請款", "串接估驗、請款、收款與毛利分析。"],
  ["圖說送審", "追蹤圖說、文件、會議待辦與送審狀態。"],
  ["AI 工程摘要", "整理逾期、超支、品質風險與今日優先事項。"],
];

const sources = [
  ["營建工程", "日報、品質安衛、材料成本、審批與工程績效。"],
  ["營建工程管理", "專案、採購、出工、報價、合約成本與收款結算。"],
  ["估價與工程管理", "估價、報價簽核、轉專案、進度品質、圖說送審與估驗請款。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src={logoUrl} alt="Jvision logo" />
          <span>營建工程整合平台</span>
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
          <p className="eyebrow">Jvision Construction Management Suite</p>
          <h1>把營建工程、工程管理、估價與 PMIS 串成一個營運平台。</h1>
          <p className="hero-text">
            新整合版把三個 Demo 的重點合併：工程估價、報價簽核、轉專案、工地日報、品質安衛、
            材料成本、出工、估驗請款與 AI 工程摘要，讓工程狀態更好追蹤。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="hero-console" aria-label="Jvision 營建工程儀表板">
          <div className="console-top">
            <span />
            <span />
            <span />
            <strong>Jvision Construction Control</strong>
          </div>
          <div className="preview-grid">
            <article><span>工程進度</span><strong>62%</strong></article>
            <article><span>待審報價</span><strong>5</strong></article>
            <article><span>估驗請款</span><strong>NT$ 312萬</strong></article>
            <div className="timeline">
              {["詢價", "估價", "簽核", "轉工程", "施工", "請款"].map((item) => <b key={item}>{item}</b>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-heading">
          <p className="eyebrow">整合功能</p>
          <h2>從業主詢價到工程驗收，讓估價、現場與財務都在同一條流程裡。</h2>
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
          <h2>可以新增估價、推進報價流程、轉工程、更新進度成本與新增現場待辦。</h2>
          <p>這不是靜態說明頁，而是可直接測試的營建工程管理工作台。</p>
        </div>
        <ConstructionSuiteDemo />
      </section>

      <section className="section" id="source">
        <div className="section-heading">
          <p className="eyebrow">合併來源</p>
          <h2>整合多個工程流程，形成一個更完整的管理工作台。</h2>
        </div>
        <div className="source-grid">
          {sources.map(([title, text]) => (
            <article key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision logo" />
        <span>Jvision 營建工程整合平台 Demo</span>
      </footer>
    </main>
  );
}
