import { SmartPosDemo } from "@/components/smart-pos-demo";

const features = [
  ["OMO 會員整合", "線上線下會員資料同步，消費、點數、標籤與回訪紀錄集中管理。"],
  ["多元支付收銀", "現金、信用卡、行動支付、禮券與會員折抵都能在同一張單處理。"],
  ["即時庫存管理", "門市銷售後即時扣庫存，低庫存提醒與調撥補貨一併追蹤。"],
  ["品牌分潤機制", "寄售、聯名、快閃櫃位可依品項或品牌自動拆分營收。"],
  ["電子標籤", "價格與促銷可同步到電子標籤，降低人工換標錯誤。"],
  ["AI 人流辨識", "模擬進店人流、轉換率與熱門時段，輔助排班與陳列決策。"],
  ["數位看板", "新品、活動、會員優惠可一鍵推送門市螢幕。"],
  ["NFC 互動體驗", "商品靠近感應即可帶出詳情、會員優惠與加購推薦。"]
];

const flows = [
  ["前台收銀", "門市人員快速掃商品、套用會員優惠、完成支付。"],
  ["後台營運", "主管查看庫存、分潤、轉換率與各門市表現。"],
  ["智慧門市", "電子標籤、AI 人流與數位看板讓現場營運更自動化。"]
];

const faqs = [
  ["可以直接試用收銀流程嗎？", "可以。下方體驗區能加入商品、套用會員優惠、完成結帳並即時扣除庫存。"],
  ["不同門市之間可以調貨嗎？", "可以建立跨店調撥紀錄，方便追蹤商品從哪間店移到哪間店。"],
  ["營運數字會跟著操作更新嗎？", "會。結帳、人流與庫存操作會立即反映在營運儀表板。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">智能 POS</a>
          <a href="#demo">功能 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero smart-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision 智慧門市管理</p>
          <h1>收銀、會員、庫存與門市營運，一個畫面就能掌握</h1>
          <p className="hero-text">
            從顧客結帳、會員優惠到跨店補貨，再把人流、分潤與低庫存提醒集中整理，門市每天的工作更直覺也更順手。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#features">查看功能架構</a>
          </div>
        </div>
        <div className="smart-stage" aria-label="Jvision 智慧門市預覽">
          <div className="stage-top">
            <span>Jvision 智慧門市</span>
            <strong>今日營收 NT$ 86,240</strong>
          </div>
          <div className="store-scene">
            <span className="screen">門市活動看板<br />新品 9 折</span>
            <span className="shelf">電子價格標籤<br />已同步 24 件</span>
            <span className="counter">收銀櫃台<br />目前等候 3 組</span>
            <span className="camera">今日進店人數<br />128 人</span>
          </div>
          <div className="stage-bottom">
            <span>會員總數 4,218</span>
            <span>低庫存 6</span>
            <span>分潤待結 3</span>
          </div>
        </div>
      </section>

      <section className="technology" id="features">
        <div className="section-heading">
          <p className="eyebrow">智慧門市流程</p>
          <h2>Jvision 把零售門市的交易、會員與智慧設備整合成一套流程</h2>
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
          <p className="eyebrow">操作體驗</p>
          <h2>直接測試 Jvision 智能 POS 門市流程</h2>
          <p>所有資料在瀏覽器即時模擬，可作為零售 OMO、快閃櫃、連鎖門市與智慧店務展示。</p>
        </div>
        <SmartPosDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">適用情境</p>
          <h2>從收銀到智慧門市，讓資料自動回到營運決策</h2>
        </div>
        <div className="reason-grid">
          {flows.map(([title, text]) => (
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
          {faqs.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer>
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <p>Jvision 智慧門市 POS Demo。</p>
      </footer>
    </main>
  );
}
