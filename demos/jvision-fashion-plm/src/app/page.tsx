import { FashionPlmDemo } from "../components/fashion-plm-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  ["系列企劃", "建立季別、款式、品類、負責人與上市目標，讓開發方向更清楚。"],
  ["款式監控", "即時追蹤企劃、打樣、試穿修正與核准量產狀態。"],
  ["物料與 BOM", "集中管理布料、供應商、成本、替代料與詢價狀態。"],
  ["雲端檔案", "保存技術包、試穿紀錄、版型資料與會議文件。"],
  ["動態報表", "彙整上市風險、成本、物料狀態與部門進度。"],
  ["Jvision AI", "自動整理款式風險、物料瓶頸與上市前待處理事項。"],
];

const modules = [
  ["商品企劃", "統一管理季別、系列故事、款式目標與開發節點。"],
  ["款式資料庫", "集中款式編號、圖稿、品類、成本與負責人資訊。"],
  ["打樣進度", "追蹤打樣、試穿、修正、核准量產與跨部門待辦。"],
  ["物料資料", "管理布料、輔料、供應商、詢價與替代料。"],
  ["雲端檔案", "讓技術包、版型、試穿紀錄與會議資料可追溯。"],
  ["決策報表", "提供上市時間、成本風險與系列完整度分析。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision 服裝系列開發 PLM 平台">
          <img src={logoUrl} alt="Jvision logo" />
          <span>服裝系列開發 PLM 平台</span>
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">功能模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#modules">平台架構</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section id="top" className="hero">
        <div>
          <p className="eyebrow">Jvision Fashion PLM</p>
          <h1>即時規劃與管理服裝系列，讓商品開發、打樣、物料與上市決策同步前進。</h1>
          <p className="hero-text">
            Jvision 協助服裝品牌把系列企劃、款式資料、BOM 物料、打樣進度、雲端檔案與 AI 風險摘要集中在同一個平台，
            讓設計、商品、版師、採購與生產部門都能看見最新狀態。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>

        <div className="hero-dashboard" aria-label="Jvision Fashion PLM 預覽">
          <div className="dashboard-top">
            <span />
            <span />
            <span />
            <strong>Jvision Collection Console</strong>
          </div>
          <div className="preview-board">
            <article className="main-preview">
              <span>SS26 Collection</span>
              <strong>32 款商品進行打樣與量產準備</strong>
              <p>本季商品準備度 68%，物料風險 5 筆，預估上市時間縮短 30%。</p>
            </article>
            <article><span>本季商品款式</span><strong>32</strong></article>
            <article><span>物料風險</span><strong>5</strong></article>
            <article><span>雲端檔案</span><strong>128</strong></article>
            <article><span>上市準備度</span><strong>68%</strong></article>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>把服裝系列從靈感、打樣、物料到上市決策接成一條清楚流程。</h2>
          <p>Jvision 將 Fashion PLM 常見的系列管理、款式監控、資料集中、雲端檔案與動態報表做成可操作展示平台。</p>
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

      <section id="demo" className="demo-section">
        <div className="section-heading">
          <p className="eyebrow">Live Demo</p>
          <h2>可以新增款式、更新打樣階段、追蹤物料成本、上傳技術包與生成 AI 摘要。</h2>
          <p>下方不是靜態說明，而是可直接操作的服裝 PLM 工作台。</p>
        </div>
        <FashionPlmDemo />
      </section>

      <section id="modules" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">平台架構</p>
          <h2>讓設計、商品、採購與生產使用同一份最新資料。</h2>
          <p>每個模組都對應服裝系列開發流程，降低來回整理、版本落差與上市延誤。</p>
        </div>
        <div className="module-grid">
          {modules.map(([title, text]) => (
            <article className="module-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact">
        <div>
          <p className="eyebrow">Jvision Demo</p>
          <h2>讓服裝系列開發更快、更透明、更可追蹤。</h2>
          <p>集中款式、物料、檔案、打樣進度與 AI 風險摘要，協助品牌掌握每一季上市節奏。</p>
        </div>
        <a className="primary-button" href="#demo">進入 Demo</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision logo" />
        <span>Jvision 服裝系列開發 PLM 平台 Demo</span>
      </footer>
    </main>
  );
}
