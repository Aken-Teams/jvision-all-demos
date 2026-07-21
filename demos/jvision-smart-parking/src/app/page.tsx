import { SmartParkingDemo } from "@/components/smart-parking-demo";

const modules = [
  ["AI 智慧尋車", "輸入車牌或會員資料，即可定位車輛所在樓層、區域與最近動線。"],
  ["空車位偵測", "透過影像與感測資料即時判斷空位、佔用、保留與異常狀態。"],
  ["車位導引", "依入口、車流與空位位置導引車主前往最佳停車區域。"],
  ["一位多車", "支援月租、住戶、公司車隊與家庭多車共用資格管理。"],
  ["車牌辨識", "進出口車牌辨識、照片留存、進出時間與通行紀錄查詢。"],
  ["電動車位管制", "結合 IP Camera 與智慧地鎖，判斷資格後自動降鎖或升鎖。"],
  ["VIP 訪客服務", "預約車位、飯店訪客、臨停優惠、特殊車位與黑白名單管理。"],
  ["安全事件監控", "違規停車、火警、遺留物、徘徊、潛入與異常停留提醒。"],
];

const places = ["公共停車場", "住宅社區", "商辦大樓", "工廠園區", "醫院", "飯店旅館", "遊樂場"];

const faqs = [
  ["這是完整系統還是展示頁？", "這是可操作的前端 demo，包含車牌辨識、車位狀態、EV 地鎖、訪客/VIP 與安全事件流程。"],
  ["手機可以使用嗎？", "可以。介面已做 RWD，手機會改成單欄停車場工作台。"],
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
        <a className="header-action" href="#demo">進入停車場</a>
      </header>

      <section className="hero dispatch-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Intelligent Parking System</p>
          <h1>AI 智慧停車場管理，從進出管制到車位導引一次完成。</h1>
          <p className="hero-text">
            Jvision 結合車牌辨識、AI 空車位偵測、智慧地鎖、訪客預約、VIP 車位與安全事件監控，
            適用公共停車場、住宅社區、商辦大樓、工廠、醫院與飯店等多種場域。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">操作 Demo</a>
            <a className="secondary-button" href="#modules">查看功能</a>
          </div>
        </div>

        <div className="dispatch-preview" aria-label="Jvision smart parking dashboard preview">
          <div className="preview-card main">
            <span>即時空位</span>
            <strong>128 格</strong>
            <p>EV 車位 12 格，VIP 保留 8 格</p>
          </div>
          <div className="preview-card"><span>辨識成功率</span><strong>98.7%</strong></div>
          <div className="preview-card"><span>今日進出</span><strong>1,286</strong></div>
          <div className="preview-card"><span>安全事件</span><strong>5</strong></div>
          <div className="preview-card"><span>平均尋車</span><strong>42 秒</strong></div>
        </div>
      </section>

      <section className="modules" id="modules">
        <div className="section-heading">
          <p className="eyebrow">功能模組</p>
          <h2>停車場的車位、車輛、資格、地鎖與安全事件，都能即時管理。</h2>
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
          <p className="eyebrow">適用場域</p>
          <h2>模組化架構可依不同場域擴充進出管制、收費與安全監控。</h2>
        </div>
        <div className="scenario-grid">
          {places.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="demo-section" id="demo">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>直接測試車牌辨識、車位偵測、EV 地鎖、尋車與事件處理。</h2>
          <p>可新增車輛進出、查詢空位、切換 EV 車位地鎖、預約訪客車位、建立安全事件與產生營運報表。</p>
        </div>
        <SmartParkingDemo />
      </section>

      <section className="reviews">
        <div className="section-heading">
          <p className="eyebrow">管理價值</p>
          <h2>讓停車場更快進出、更好找位，也更容易掌握異常事件。</h2>
        </div>
        <div className="review-grid">
          {[
            ["進出更順", "車牌辨識搭配白名單與訪客預約，減少人工查核。"],
            ["車位更清楚", "空位、EV、VIP 與保留車位即時呈現，導引更準。"],
            ["安全更即時", "違規停車、火警、徘徊與遺留物都能建立事件追蹤。"],
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
        <p>Jvision 智慧停車場管理 Demo，示範車牌辨識、空車位偵測、EV 地鎖、訪客車位與安全事件流程。</p>
      </footer>
    </main>
  );
}
