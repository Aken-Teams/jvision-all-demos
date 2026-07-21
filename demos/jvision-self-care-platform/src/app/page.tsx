import { SelfCareDemo } from "@/components/self-care-demo";

const modules = [
  ["自助預約體驗", "讓客戶依服務、員工、地點與可用時段自行預約，支援候補、改期與預約提醒。"],
  ["智慧排班行事曆", "依員工專長、服務時長、房間設備與緩衝時間安排預約，降低空檔與撞期。"],
  ["客戶檔案與偏好", "集中管理消費紀錄、過敏資訊、服務偏好、表單紀錄、照片與下次回訪。"],
  ["POS 結帳與付款", "療程、商品、加購、訂金、禮卡、小費、會員折扣與多種付款方式一次完成。"],
  ["表單與諮詢紀錄", "美容、美療、按摩與醫美諮詢表單可線上填寫，服務前後都能追蹤。"],
  ["會員與忠誠計畫", "支援會員方案、點數、套票、儲值、回購優惠與自動續約提醒。"],
  ["訊息與行銷", "預約提醒、生日優惠、回訪訊息、沉睡客喚醒與活動推播集中管理。"],
  ["多店營運報表", "跨店營收、員工績效、預約率、取消率、客戶留存與會員貢獻即時分析。"],
];

const flow = ["線上預約", "排班確認", "客戶填表", "到店服務", "POS 結帳", "會員累點", "訊息回訪", "多店報表"];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含預約、排班、客戶檔案、POS、會員、表單、訊息與報表流程。"],
  ["手機可以使用嗎？", "可以。介面已做 RWD，手機會改成單欄門市營運工作台。"],
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
        <a className="header-action" href="#demo">建立預約</a>
      </header>

      <section className="hero dispatch-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Beauty Booking Operations Platform</p>
          <h1>預約、排班、客戶檔案、POS、會員與行銷，一套照顧美業體驗。</h1>
          <p className="hero-text">
            Jvision 協助沙龍、SPA、美療、醫美、按摩與指甲店，把線上預約、智慧排班、客戶偏好、
            表單紀錄、POS 結帳、會員方案與訊息行銷整合成同一個營運平台。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看功能</a>
          </div>
        </div>

        <div className="dispatch-preview" aria-label="Jvision self-care dashboard preview">
          <div className="preview-card main">
            <span>今日門市體驗</span>
            <strong>92% 預約率</strong>
            <p>待到店 28 位，會員續約 6 筆，未付款訂金 3 筆，回訪訊息 14 則</p>
          </div>
          <div className="preview-card"><span>今日營收</span><strong>NT$ 168K</strong></div>
          <div className="preview-card"><span>候補名單</span><strong>9 位</strong></div>
          <div className="preview-card"><span>取消率</span><strong>4.8%</strong></div>
          <div className="preview-card"><span>會員貢獻</span><strong>63%</strong></div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>從線上預約到離店回訪，讓客戶體驗與門市營運都更順。</h2>
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
          <p className="eyebrow">適用業態</p>
          <h2>適合沙龍、SPA、美療、醫美診所、按摩、指甲店、理髮店與多據點品牌。</h2>
        </div>
        <div className="scenario-grid">
          {flow.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>直接測試自助預約、智慧排班、客戶檔案、POS 結帳與會員行銷。</h2>
          <p>可新增預約、安排服務人員、更新到店狀態、建立客戶偏好、完成結帳、發送回訪訊息並查看多店營運指標。</p>
        </div>
        <SelfCareDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">管理價值</p>
          <h2>讓客戶更容易預約，團隊更容易服務，管理者更容易成長。</h2>
        </div>
        <div className="review-grid">
          {[
            ["預約更順", "自助預約、候補、改期與提醒降低來回溝通與未到店。"],
            ["服務更準", "客戶偏好、表單、照片與歷史紀錄幫助員工提供一致體驗。"],
            ["成長更清楚", "POS、會員、訊息與報表串接，回購、留存與營收都能追蹤。"],
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
        <p>Jvision 美業預約營運平台 Demo，示範預約、排班、客戶檔案、POS、會員、訊息行銷與多店報表流程。</p>
      </footer>
    </main>
  );
}
