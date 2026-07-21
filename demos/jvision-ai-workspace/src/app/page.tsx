import { AiWorkspaceDemo } from "@/components/ai-workspace-demo";

const features = [
  ["AI 文件", "把需求、規格、研究筆記與 SOP 寫在同一個工作區，支援摘要與改寫。"],
  ["知識庫搜尋", "集中整理公司知識、會議紀錄與專案文件，讓團隊快速找到答案。"],
  ["專案任務", "用看板、狀態、負責人與截止日追蹤任務，讓文件與執行保持連動。"],
  ["會議筆記", "建立會議摘要、決議事項、待辦清單與追蹤人，減少會後整理時間。"],
  ["AI 代理人", "依任務類型派出研究、整理、報告與提醒代理人，自動產出可用內容。"],
  ["自動化流程", "當文件更新、任務到期或會議完成時，自動建立提醒與工作項目。"],
  ["整合連線", "把文件、任務、知識庫與外部工具串在一起，維持單一資訊入口。"],
  ["企業治理", "用權限、工作區、審核紀錄與資料狀態支援團隊治理。"],
];

const faqs = [
  ["Demo 可以操作什麼？", "可以新增文件、任務、會議筆記、知識庫問答、AI 代理人指派與專案報告。"],
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

      <section className="hero workspace-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision AI Workspace</p>
          <h1>AI 工作區，把文件、知識、專案、會議與代理人整合成團隊作業中心</h1>
          <p className="hero-text">
            面向知識型團隊、產品、營運、顧問與跨部門協作，Jvision 將文件、任務、會議筆記、知識庫搜尋、AI 代理人與自動化流程集中在同一個工作區。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">進入 Demo</a>
            <a className="secondary-button" href="#features">查看功能</a>
          </div>
        </div>
        <div className="property-preview" aria-label="Jvision AI 工作區儀表板">
          <div className="preview-top">
            <span>Jvision Workspace</span>
            <strong>AI 摘要 42</strong>
          </div>
          <div className="property-board">
            <span>文件 128</span>
            <span>任務進行 36</span>
            <span>會議筆記 18</span>
            <span>代理人 7</span>
            <strong>
              Knowledge Command Center
              <br />
              專案準時率 91%
            </strong>
          </div>
          <div className="preview-bottom">
            <span>知識庫命中 86%</span>
            <span>自動化流程 24</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">Workspace Modules</p>
          <h2>Jvision 把團隊每天需要的文字、任務、會議與 AI 協作流程放進同一個工作台</h2>
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
          <h2>直接操作 Jvision AI 工作區流程</h2>
          <p>新增文件、任務、會議筆記、知識庫問答、AI 代理人與專案報告，展示完整可測試的團隊協作工作台。</p>
        </div>
        <AiWorkspaceDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Scenarios</p>
          <h2>適合需要把知識、執行與 AI 自動化放在一起的團隊</h2>
        </div>
        <div className="reason-grid">
          {[
            ["產品與研發", "把 PRD、規格、決策紀錄與任務看板連動，減少資訊斷裂。"],
            ["營運與顧問", "把客戶筆記、會議摘要、交付物與追蹤項目集中管理。"],
            ["主管與團隊", "用 AI 摘要、專案報告與自動提醒快速掌握團隊狀態。"],
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
        <p>Jvision AI 工作區 Demo，提供線上展示與行銷素材。</p>
      </footer>
    </main>
  );
}
