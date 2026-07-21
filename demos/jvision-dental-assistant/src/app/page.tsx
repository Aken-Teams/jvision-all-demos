import DentalDemo from "../components/dental-demo";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";

const features = [
  ["01", "線上預約入口", "讓患者休診時間也能選擇醫師、療程與時段，降低電話漏接造成的預約流失。"],
  ["02", "約診提醒", "看診前自動發送提醒與確認訊息，協助櫃檯減少逐通電話確認。"],
  ["03", "患者 CRM", "整理患者來源、療程、回診紀錄、爽約風險與追蹤狀態。"],
  ["04", "術後追蹤", "依療程自動發送術後注意事項、疼痛狀況確認與回覆提醒。"],
  ["05", "定檢通知", "依洗牙、矯正、植牙追蹤等週期，提醒患者回診與安排時段。"],
  ["06", "評價與口碑", "追蹤滿意度、Google 評價邀請與負評風險，維持診所品牌。"],
  ["07", "診所績效", "掌握預約量、到診率、爽約率、回診率與自費療程轉換。"],
  ["08", "AI 智能助理", "自動整理今日約診、需追蹤患者、異常排程與櫃檯待辦。"]
];

const modules = [
  ["醫師預約頁", "展示醫師專長、看診時段、療程項目與線上預約入口。"],
  ["患者管理", "集中管理患者資料、療程紀錄、來源標籤與互動歷程。"],
  ["LINE/簡訊提醒", "看診確認、術後追蹤、定檢通知與活動訊息自動化。"],
  ["櫃檯工作台", "今日預約、待確認、爽約風險、候補名單與改約管理。"],
  ["衛教內容", "依療程提供術前說明、術後注意事項與患者問答模板。"],
  ["評價管理", "滿意度追蹤、好評邀請、負評提醒與客服回覆紀錄。"],
  ["診所成效", "線上預約、到診率、回診率、自費轉換與醫師績效分析。"],
  ["AI 摘要", "自動產生今日營運摘要、患者風險與櫃檯優先待辦。"]
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
          <p className="eyebrow">牙科預約 / 患者 CRM / AI 櫃檯助理</p>
          <h1>Jvision 牙科診所智能助理</h1>
          <p className="hero-text">
            整合線上預約、患者管理、約診提醒、術後追蹤、定檢通知與診所績效，讓櫃檯少一點追電話，醫師多一點時間專注照護。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#demo">開啟診所 Demo</a>
            <a className="secondary-button" href="#features">查看平台能力</a>
          </div>
        </div>

        <div className="hero-console" aria-label="Jvision 牙科診所工作台預覽">
          <div className="console-top">
            <span />
            <span />
            <span />
            <strong>Jvision 診所智能工作台</strong>
          </div>
          <div className="hero-grid">
            <article className="hero-metric"><span>今日預約</span><strong>32</strong></article>
            <article className="hero-metric"><span>到診確認</span><strong>91%</strong></article>
            <article className="hero-metric"><span>待追蹤患者</span><strong>8</strong></article>
            <article className="schedule-card">
              <div className="schedule-row"><b>09:30</b><strong>洗牙定檢</strong><span className="status-pill">已確認</span></div>
              <div className="schedule-row"><b>11:00</b><strong>植牙術後回診</strong><span className="status-pill">需追蹤</span></div>
              <div className="schedule-row"><b>15:30</b><strong>矯正調線</strong><span className="status-pill">候補提醒</span></div>
            </article>
            <article className="patient-card">
              <div><strong>自動提醒</strong><span>看診前通知</span></div>
              <div><strong>術後追蹤</strong><span>療程後確認</span></div>
              <div><strong>AI 摘要</strong><span>今日待辦整理</span></div>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="sections">
        <div className="section-heading">
          <p className="eyebrow">平台能力</p>
          <h2>從患者預約到回診追蹤，讓醫病互動不中斷</h2>
          <p>Jvision 將預約、提醒、患者 CRM、術後追蹤、定檢通知、評價追蹤與診所數據整合，降低櫃檯重複作業並提升患者體驗。</p>
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
          <h2>新增預約、確認到診、發送追蹤提醒並產生 AI 摘要</h2>
          <p>下方可以實際建立預約、調整患者狀態、查看待追蹤患者與爽約風險，並讓 AI 產生今日診所營運摘要。</p>
        </div>
        <DentalDemo logoUrl={logoUrl} />
      </section>

      <section id="modules" className="modules-section">
        <div className="section-heading">
          <p className="eyebrow">模組架構</p>
          <h2>診所、醫師與患者都能順暢使用的數位助理</h2>
          <p>可從線上預約與提醒通知開始，逐步延伸到患者 CRM、衛教追蹤、評價管理與診所經營分析。</p>
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
          <h2>把牙科櫃檯、醫師與患者互動串成一個照護流程</h2>
          <p>適合展示牙科線上預約、LINE/簡訊提醒、患者 CRM、術後追蹤、定檢通知與 AI 診所助理。</p>
        </div>
        <a className="primary-button" href="#demo">立即測試</a>
      </section>

      <footer>
        <img src={logoUrl} alt="Jvision" />
        <span>Jvision 牙科診所智能助理 Demo</span>
      </footer>
    </main>
  );
}
