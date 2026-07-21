import { PosDemo } from "@/components/pos-demo";

const technologies = [
  ["POS 點餐", "桌位、外帶、內用與加點同步，前台一鍵送單。"],
  ["iPad 同步", "櫃台、桌邊與廚房畫面即時一致，尖峰也不漏單。"],
  ["線上接單", "外帶、外送與 LINE 訂單集中管理，狀態清楚。"],
  ["線上訂位", "訂位、桌況與預付餐點一起串進現場流程。"],
  ["銷售分析", "營收、熱門品項、時段與折扣成效即時整理。"],
  ["會員集點", "消費自動累點，兌點、回訪與標籤都留紀錄。"],
  ["成本控管", "庫存扣料、食材成本與日結對帳一起看。"],
  ["結帳支付", "現金、信用卡、行動支付、禮券與外送款項分類。"],
  ["電子發票", "載具、統編、開立紀錄與結帳流程整合。"]
];

const reasons = [
  ["每週更新", "Jvision 以雲端架構快速發布新功能，讓餐廳持續跟上市場變化。"],
  ["真人支援", "從開店設定、菜單匯入到尖峰營運問題，都能用標準流程處理。"],
  ["餐飲專用", "不是通用收銀機，而是把桌況、廚房、外送、會員與報表整合在一起。"]
];

const faqs = [
  ["Jvision 適合哪些餐飲型態？", "咖啡廳、早午餐、餐酒館、便當店、連鎖門市與雲端廚房都能用這套 demo 展示流程。"],
  ["這個頁面可以直接測試嗎？", "可以。下方 demo 可新增餐點、結帳、接受線上訂單、建立訂位、套用會員與查看報表。"],
  ["是否支援手機與平板？", "支援。頁面與 demo 皆以 RWD 設計，桌機、平板與手機都能操作。"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#technology">餐廳科技</a>
          <a href="#demo">功能 Demo</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Restaurant Technology</p>
          <h1>一台雲端 POS，串起餐廳前台、廚房、線上訂單與會員經營</h1>
          <p className="hero-text">
            參考餐飲 POS 科技頁架構打造：點餐結帳、線上接單、訂位、銷售分析、會員、成本、支付與電子發票一次展示。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開始操作 Demo</a>
            <a className="secondary-button" href="#technology">查看九大科技</a>
          </div>
        </div>
        <div className="hero-device" aria-label="Jvision POS 預覽">
          <div className="device-top">
            <span>Jvision POS</span>
            <strong>今日營收 NT$ 42,680</strong>
          </div>
          <div className="table-map">
            <span className="table busy">A1</span>
            <span className="table">A2</span>
            <span className="table busy">B1</span>
            <span className="table paid">B2</span>
            <span className="kitchen">Kitchen Queue 08</span>
          </div>
          <div className="device-bottom">
            <span>線上訂單 5</span>
            <span>訂位 12</span>
            <span>會員回訪 38%</span>
          </div>
        </div>
      </section>

      <section className="technology" id="technology">
        <div className="section-heading">
          <p className="eyebrow">9 Restaurant Technologies</p>
          <h2>Jvision 把餐廳每天用到的營運工具整合在同一套 POS</h2>
        </div>
        <div className="tech-grid">
          {technologies.map(([title, text], index) => (
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
          <h2>直接測試餐廳 POS 全流程</h2>
          <p>所有資料都在瀏覽器即時模擬，適合銷售展示、內部提案與客戶教育。</p>
        </div>
        <PosDemo />
      </section>

      <section className="reasons">
        <div className="section-heading">
          <p className="eyebrow">Why Jvision</p>
          <h2>不只收銀，還要能陪餐廳長大</h2>
        </div>
        <div className="reason-grid">
          {reasons.map(([title, text]) => (
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
        <p>Jvision 餐飲 POS 科技 Demo。品牌文字已統一為 Jvision。</p>
      </footer>
    </main>
  );
}
