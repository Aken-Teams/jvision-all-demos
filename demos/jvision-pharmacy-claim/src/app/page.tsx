import PharmacyDemo from "../components/pharmacy-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  ["01", "健保用藥資料庫", "內建常用健保藥品資料，支援藥碼、藥價、給付規則與異動查詢。"],
  ["02", "藥價線上更新", "每月更新健保藥價與資料版本，降低人工維護錯誤。"],
  ["03", "處方快速建立", "支援標準處方、複製處方與常用組合，縮短調劑輸入時間。"],
  ["04", "申報前檢核", "自動檢查身分、用藥、費用、部分負擔與申報格式錯誤。"],
  ["05", "藥袋與收據列印", "可列印藥袋、藥品明細、收據與患者用藥說明。"],
  ["06", "費用自動試算", "依患者年齡、身分別與處方內容帶出藥師服務費與部分負擔。"],
  ["07", "歷史申報查詢", "查詢歷次申報資料、錯誤紀錄、補件狀態與申報批次。"],
  ["08", "藥品耗用分析", "依診所、藥品、日期統計耗用量、成本與健保給付明細。"]
];

const modules = [
  ["處方調劑", "建立處方、複製常用處方、藥品搜尋與調劑內容檢查。"],
  ["健保申報", "批次申報、錯誤表、申報狀態、補正與歷史資料查詢。"],
  ["藥價資料", "健保藥價更新、藥品代碼、給付規則與版本紀錄。"],
  ["藥袋列印", "藥袋、明細、收據、用藥說明與多樣格式設定。"],
  ["費用管理", "藥師服務費、部分負擔、健保給付與小計彙整。"],
  ["庫存耗用", "依調劑紀錄統計藥品耗用量與成本。"],
  ["診所報表", "依診所、患者、調劑日期與藥品類別產生分析表。"],
  ["AI 檢核摘要", "自動整理申報錯誤、缺漏欄位、異常費用與今日待處理項目。"]
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Jvision 首頁">
          <img src={logoUrl} alt="Jvision" />
        </a>
        <nav aria-label="主要導覽">
          <a href="#features">平台能力</a>
          <a href="#demo">功能 Demo</a>
          <a href="#modules">模組架構</a>
        </nav>
        <a className="header-action" href="#demo">立即體驗</a>
      </header>

      <section id="top" className="hero">
        <div>
          <p className="eyebrow">藥局系統 / 健保申報 / 調劑檢核</p>
          <h1>Jvision 藥局健保調劑申報系統</h1>
          <p className="hero-text">
            整合處方調劑、健保藥價更新、申報錯誤檢核、藥袋與收據列印、部分負擔試算與歷史申報查詢，讓藥局申報流程更快也更可追蹤。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開啟申報 Demo</a>
            <a className="secondary-button" href="#features">查看平台能力</a>
          </div>
        </div>

        <div className="hero-console" aria-label="Jvision 藥局申報工作台預覽">
          <div className="console-top">
            <span />
            <span />
            <span />
            <strong>Jvision 藥局申報工作台</strong>
          </div>
          <div className="hero-grid">
            <article className="hero-metric"><span>今日處方</span><strong>128</strong></article>
            <article className="hero-metric"><span>申報完成率</span><strong>94%</strong></article>
            <article className="hero-metric"><span>待修正錯誤</span><strong>6</strong></article>
            <article className="claim-card">
              <div className="claim-row"><strong>處方輸入</strong><div className="claim-track"><i style={{ width: "88%" }} /></div><span>88%</span></div>
              <div className="claim-row"><strong>申報檢核</strong><div className="claim-track"><i style={{ width: "74%" }} /></div><span>74%</span></div>
              <div className="claim-row"><strong>報表列印</strong><div className="claim-track"><i style={{ width: "62%" }} /></div><span>62%</span></div>
            </article>
            <article className="tools-card">
              <div><strong>藥價更新</strong><span>版本與異動提醒</span></div>
              <div><strong>錯誤表</strong><span>申報前先檢查</span></div>
              <div><strong>AI 摘要</strong><span>今日待處理整理</span></div>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">平台能力</p>
          <h2>從處方輸入到申報檢核，協助藥局降低錯誤與重工</h2>
          <p>Jvision 將藥品資料、健保藥價、處方調劑、費用試算、申報檢核、列印與歷史查詢整合在同一個藥局工作台。</p>
        </div>
        <div className="feature-grid">
          {features.map(([index, title, text]) => (
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
          <p className="eyebrow">可操作 Demo</p>
          <h2>新增處方、試算費用、檢查申報錯誤並產生 AI 摘要</h2>
          <p>下方可以建立調劑處方、選擇藥品與身分別，系統會試算費用、更新申報統計、列出錯誤風險並產生今日申報摘要。</p>
        </div>
        <PharmacyDemo logoUrl={logoUrl} />
      </section>

      <section id="modules" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">模組架構</p>
          <h2>藥局日常調劑與健保申報，都能在同一個工作台完成</h2>
          <p>從處方建立、藥品檢索、費用計算，到申報錯誤修正、列印與歷史資料追蹤，協助藥局把繁瑣流程變得清楚。</p>
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
          <h2>讓健保申報不再只是月底補資料，而是每天可檢查的流程</h2>
          <p>適合展示藥局調劑、健保申報、藥袋列印、錯誤檢核、費用試算與 AI 申報助理。</p>
        </div>
        <a className="primary-button" href="#demo">立即測試</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 藥局健保調劑申報 Demo</span>
      </footer>
    </main>
  );
}
