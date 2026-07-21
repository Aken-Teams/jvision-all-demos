import { SupportDemo } from "@/components/support-demo";

const modules = [
  ["共享客服收件箱", "整合 Email、表單、聊天、社群與電商訊息，依優先度、狀態與負責人集中處理。"],
  ["AI 摘要與回覆草稿", "長對話自動摘要、建議下一步、產生回覆草稿、翻譯語氣調整，讓客服更快回覆。"],
  ["知識庫與自助服務", "建立常見問題、教學文章與產品文件，讓客戶先自助查詢，降低重複問題。"],
  ["網站支援入口", "在網站或產品內嵌支援入口，提供文章搜尋、聊天、留言與歷史對話查詢。"],
  ["工作流程自動化", "依關鍵字、客戶等級、問題類型與 SLA 自動分派、標籤、提醒與升級。"],
  ["主動訊息與調查", "發送上線提醒、NPS、滿意度調查、產品更新與重要公告，主動靠近客戶。"],
  ["客戶與公司檔案", "查看客戶歷史對話、公司資訊、方案、訂單、使用狀態與內部備註。"],
  ["客服洞察報表", "追蹤量體、首次回覆時間、解決時間、滿意度、AI 節省工時與團隊績效。"],
];

const flow = ["收到訊息", "AI 摘要", "自動分派", "查知識庫", "回覆客戶", "暫停追蹤", "滿意度調查", "報表改善"];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含客服收件箱、AI 草稿、知識庫、支援入口、工作流程、主動訊息與報表。"],
  ["手機可以使用嗎？", "可以。介面已做 RWD，手機會改成單欄客服工作台。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#modules">功能模組</a>
          <a href="#demo">互動 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">處理訊息</a>
      </header>

      <section className="hero dispatch-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Customer Support Platform</p>
          <h1>所有客服對話、知識庫、AI 回覆與報表，在同一個工作台完成。</h1>
          <p className="hero-text">
            Jvision 協助客服團隊把 Email、聊天、網站表單、社群訊息與客戶資料集中，
            透過 AI 摘要、回覆草稿、知識庫、自動分派與洞察報表，讓服務更快、更一致。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看功能</a>
          </div>
        </div>

        <div className="dispatch-preview" aria-label="Jvision support dashboard preview">
          <div className="preview-card main">
            <span>今日客服狀態</span>
            <strong>92% SLA</strong>
            <p>待回覆 24 件，AI 已草擬 18 則，知識庫解決 37%，滿意度 4.8/5</p>
          </div>
          <div className="preview-card"><span>平均首次回覆</span><strong>14m</strong></div>
          <div className="preview-card"><span>開啟對話</span><strong>86 件</strong></div>
          <div className="preview-card"><span>自助解決</span><strong>37%</strong></div>
          <div className="preview-card"><span>升級案件</span><strong>6 件</strong></div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>從收到問題到完成回覆，讓客服團隊保有脈絡、速度與品質。</h2>
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
          <p className="eyebrow">適用情境</p>
          <h2>適合 SaaS、電商、教育、物流、旅宿、製造、金融保險與專業服務團隊。</h2>
        </div>
        <div className="scenario-grid">
          {flow.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>直接測試共享收件箱、AI 草稿、知識庫建議、工作流程與客服報表。</h2>
          <p>可新增客服對話、分派負責人、產生 AI 回覆、套用知識庫文章、暫停追蹤、發送滿意度調查並查看團隊指標。</p>
        </div>
        <SupportDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">管理價值</p>
          <h2>讓客服不只是回信，而是看得懂客戶、幫得更快、改善得更準。</h2>
        </div>
        <div className="review-grid">
          {[
            ["回覆更快", "AI 摘要、草稿、常用回覆與知識庫建議，減少客服重複整理時間。"],
            ["協作更順", "共享收件箱、分派、內部備註與自動升級，讓跨部門案件不漏接。"],
            ["改善更清楚", "量體、回覆時間、滿意度、熱門問題與自助解決率都能即時追蹤。"],
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
        <p>Jvision 客服支援平台 Demo，示範共享收件箱、AI 回覆、知識庫、支援入口、自動化流程、主動訊息與客服報表。</p>
      </footer>
    </main>
  );
}
