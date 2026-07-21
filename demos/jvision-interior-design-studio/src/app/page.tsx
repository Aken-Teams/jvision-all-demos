import { InteriorDesignDemo } from "../components/interior-design-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  ["設計提案", "建立品牌化提案，整合空間、預算、項目與客戶確認流程。"],
  ["選品板", "依房間、材質、家具與燈具整理選品，讓客戶可以快速核准或留言。"],
  ["商品資料庫", "把供應商、價格、規格與圖片資料集中管理，減少重複整理。"],
  ["採購追蹤", "從已核准選品建立採購清單，追蹤下單、運送與到貨狀態。"],
  ["客戶儀表板", "把提案、選品、採購與留言同步到一個客戶可看的工作台。"],
  ["Jvision AI", "整理專案風險、待處理選品、採購狀態與下一步建議。"],
];

const modules = [
  ["規劃與提案", "從初步需求、空間區域、預算到正式提案一次整理。"],
  ["風格靈感板", "把色彩、材質、家具與燈具組成客戶容易理解的視覺方向。"],
  ["選品確認板", "將選品依房間與類別分類，支援核准、替換與採購轉換。"],
  ["採購與供應商", "管理供應商、到貨日、付款資訊與採購進度。"],
  ["客戶協作", "集中留言、核准紀錄、提案與選品狀態，減少來回溝通。"],
  ["財務摘要", "彙整預算、選品金額、已核准項目與採購風險。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision 室內設計專案管理平台">
          <img src={logoUrl} alt="Jvision logo" />
          <span>室內設計專案管理平台</span>
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
          <p className="eyebrow">Jvision Interior Design Studio</p>
          <h1>把提案、選品、採購、客戶溝通與 AI 摘要整合成一個設計工作台。</h1>
          <p className="hero-text">
            Jvision 協助室內設計與軟裝團隊把設計提案、選品確認板、商品資料庫、採購追蹤、客戶儀表板與財務狀態集中管理，
            讓每個空間從概念到交付都有清楚流程。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>

        <div className="hero-dashboard" aria-label="Jvision 室內設計平台預覽">
          <div className="dashboard-top">
            <span />
            <span />
            <span />
            <strong>Jvision 設計工作台</strong>
          </div>
          <div className="preview-board">
            <article className="main-preview">
              <span>本週專案摘要</span>
              <strong>4 個提案待確認</strong>
              <p>客廳選品 72% 核准，餐廳採購已下單，主臥窗簾需替換。</p>
            </article>
            <article><span>提案總額</span><strong>NT$ 1.38M</strong></article>
            <article><span>已核准選品</span><strong>12</strong></article>
            <article><span>採購追蹤</span><strong>6</strong></article>
            <article><span>客戶留言</span><strong>9</strong></article>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>讓設計團隊少一點行政整理，多一點時間放在作品與客戶體驗。</h2>
          <p>Jvision 將室內設計常見的提案、選品、採購、客戶儀表板與 AI 摘要做成可操作的展示平台。</p>
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
          <h2>可以新增提案、核准選品、建立採購、更新到貨狀態與生成 AI 摘要。</h2>
          <p>下方不是靜態說明，而是可直接操作的室內設計專案管理 Demo。</p>
        </div>
        <InteriorDesignDemo />
      </section>

      <section id="modules" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">平台架構</p>
          <h2>從靈感板到採購交付，讓設計專案資訊不再分散。</h2>
          <p>每個模組都對應設計公司日常流程，讓業主、設計師、採購與財務可以用同一份資料協作。</p>
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
          <h2>讓室內設計專案從提案到採購都看得見。</h2>
          <p>把設計溝通、商品資料、客戶核准、採購狀態與 AI 專案提醒集中成一個可展示的平台。</p>
        </div>
        <a className="primary-button" href="#demo">進入 Demo</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision logo" />
        <span>Jvision 室內設計專案管理平台 Demo</span>
      </footer>
    </main>
  );
}
