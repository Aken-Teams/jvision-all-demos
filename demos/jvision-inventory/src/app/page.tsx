import InventoryDemo from "../components/inventory-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const capabilities = [
  ["01", "智慧補貨", "依安全庫存、需求速度與供應商交期，自動列出今日該補的品項。"],
  ["02", "入出庫控管", "用同一個工作台處理到貨、驗收、上架、揀貨與出貨，避免資料落差。"],
  ["03", "條碼掃描", "支援條碼與 QR Code 模擬掃描，現場人員可快速完成庫存異動。"],
  ["04", "揀貨波次", "把訂單依區域、品項與優先度分批，減少倉庫來回走動。"],
  ["05", "批號追蹤", "保留批號、效期與異動紀錄，出問題時可以快速回查來源。"],
  ["06", "庫存估值", "即時估算庫存金額、低庫存風險與呆滯品，支援營運決策。"],
  ["07", "多倉協同", "同時檢視總倉、門市、維修站與寄倉庫存，掌握可用量。"],
  ["08", "AI 摘要", "把今日缺貨、補貨、揀貨與異常整理成主管可讀的行動清單。"]
];

const modules = [
  ["庫存總覽", "即時查看每個倉別、品項、可用量與安全庫存，快速找出缺貨與過量。"],
  ["補貨計畫", "依需求預測、最低庫存與供應商交期，產生建議採購量。"],
  ["收貨驗收", "到貨後可記錄數量、批號、效期與品質狀態，減少人工表單。"],
  ["上架策略", "依快慢銷、ABC 分級與儲位容量，建議最適合的上架位置。"],
  ["揀貨出貨", "支援單筆、批次、波次與區域揀貨，並產生出貨進度。"],
  ["盤點管理", "可建立週期盤點，系統自動比對帳面與實際差異。"],
  ["追蹤報表", "用批號、序號、異動單與人員紀錄回查每一次庫存變動。"],
  ["營運串接", "可銜接銷售、採購、會計與客服流程，讓庫存資料不再孤島。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
        </a>
        <nav aria-label="主選單">
          <a href="#features">功能</a>
          <a href="#demo">Demo</a>
          <a href="#modules">模組</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Inventory / Warehouse / Barcode</p>
          <h1>Jvision 智慧庫存與倉儲管理平台</h1>
          <p className="hero-text">
            讓補貨、收貨、上架、揀貨、盤點與庫存估值都在同一個畫面完成。Jvision 以即時庫存、條碼作業與 AI 摘要，協助團隊降低缺貨、縮短出貨時間，並讓主管每天都知道該先處理什麼。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開啟功能 Demo</a>
            <a className="secondary-button" href="#features">查看平台能力</a>
          </div>
        </div>

        <div className="hero-console" aria-label="Jvision 庫存管理示意畫面">
          <div className="console-top">
            <span />
            <span />
            <span />
            <strong>Jvision Inventory Control</strong>
          </div>
          <div className="warehouse-board">
            <article className="hero-metric"><span>今日出貨</span><strong>128</strong></article>
            <article className="hero-metric"><span>補貨建議</span><strong>14</strong></article>
            <article className="hero-metric"><span>庫存準確率</span><strong>98%</strong></article>
            <article className="stock-card">
              <div><b>SKU-A104</b><span>台北總倉 A-03</span><i style={{ width: "72%" }} /></div>
              <div><b>SKU-B225</b><span>新竹維修站 B-11</span><i style={{ width: "34%" }} /></div>
              <div><b>SKU-C918</b><span>台中門市 C-06</span><i style={{ width: "91%" }} /></div>
            </article>
            <article className="route-card">
              <strong>波次揀貨</strong>
              <span>北區貨架 12 筆</span>
              <span>冷鏈區 5 筆</span>
              <span>急單優先 3 筆</span>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">平台能力</p>
          <h2>從庫存可視化到現場作業，把倉儲流程做成可操作的管理系統</h2>
          <p>
            參考現代庫存管理產品的架構，Jvision 把補貨策略、收貨驗收、條碼異動、批號追蹤、揀貨出貨與庫存估值整合成一個可互動的 Demo，讓使用者可以直接測試流程。
          </p>
        </div>
        <div className="feature-grid">
          {capabilities.map(([index, title, text]) => (
            <article className="feature-card" key={title}>
              <b>{index}</b>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="demo" className="demo-section">
        <div className="section-heading">
          <p className="eyebrow">完整功能 Demo</p>
          <h2>新增品項、掃碼異動、產生補貨、建立揀貨波次都可以直接操作</h2>
          <p>
            這不是靜態介紹頁。你可以新增庫存品項、模擬條碼入庫與出庫、讓系統產生補貨建議，並用 AI 摘要整理今天最重要的庫存風險。
          </p>
        </div>
        <InventoryDemo logoUrl={logoUrl} />
      </section>

      <section id="modules" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">系統模組</p>
          <h2>支援企業常見的庫存、倉儲、採購與出貨流程</h2>
          <p>
            從小型倉庫到多據點營運，Jvision 都能把分散在 Excel、紙本與口頭訊息裡的庫存資訊集中到一套容易理解的操作介面。
          </p>
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
          <h2>讓庫存資料變成每天都能採取行動的營運看板</h2>
          <p>適合零售、維修、電商、製造與多門市團隊，用一套 Demo 展示從進貨到出貨的完整庫存管理流程。</p>
        </div>
        <a className="primary-button" href="#demo">測試庫存工作台</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 智慧庫存與倉儲管理 Demo</span>
      </footer>
    </main>
  );
}
