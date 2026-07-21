import fs from "node:fs";
import path from "node:path";

const demos = [
  {
    repo: "jvision-order-inventory",
    title: "訂單與庫存協同平台",
    eyebrow: "ORDER & INVENTORY AI COMMAND",
    industry: "製造與工程",
    accent: "#7dd3fc",
    bg: "radial-gradient(circle at 12% 10%, rgba(125,211,252,.28), transparent 28rem), radial-gradient(circle at 90% 20%, rgba(45,212,191,.20), transparent 32rem), linear-gradient(135deg,#07111f,#102332 55%,#081018)",
    pain: "訂單、庫存、交期與採購資訊分散，現場常靠人工追料，缺料與超庫同時發生。",
    empowerment: "AI 即時比對訂單需求、庫存水位、在途料與供應商交期，主動提出補貨、替代料與交期風險建議。",
    tasks: ["預測 7 日內缺料風險", "依訂單優先級重排出貨", "比對安全庫存與採購建議", "產生客戶交期回覆草稿"],
    stats: [["待處理訂單", "42"], ["高風險料號", "8"], ["庫存準確率", "96%"], ["交期預警", "12"]],
  },
  {
    repo: "jvision-lean-demo",
    title: "精實改善 AI 戰情室",
    eyebrow: "LEAN IMPROVEMENT AI ROOM",
    industry: "製造與工程",
    accent: "#a78bfa",
    bg: "radial-gradient(circle at 18% 18%, rgba(167,139,250,.28), transparent 30rem), radial-gradient(circle at 82% 12%, rgba(251,191,36,.16), transparent 28rem), linear-gradient(135deg,#111827,#241331 58%,#080b13)",
    pain: "改善提案散落在會議紀錄與 Excel，浪費來源難以量化，跨部門改善進度不透明。",
    empowerment: "AI 將異常、工時、等待、搬運與不良資料轉成改善待辦，協助排序 ROI 與追蹤 PDCA 狀態。",
    tasks: ["辨識七大浪費熱點", "生成改善 A3 報告", "追蹤 PDCA 進度", "估算節省工時與成本"],
    stats: [["改善案", "31"], ["預估節省", "18%"], ["逾期行動", "5"], ["完成率", "74%"]],
  },
  {
    repo: "jvision-work-order-demo",
    title: "智慧工單派工中心",
    eyebrow: "WORK ORDER AI DISPATCH",
    industry: "企業營運",
    accent: "#34d399",
    bg: "radial-gradient(circle at 16% 8%, rgba(52,211,153,.28), transparent 28rem), radial-gradient(circle at 80% 24%, rgba(96,165,250,.20), transparent 30rem), linear-gradient(135deg,#071a16,#10251f 50%,#09111a)",
    pain: "工單來源多、優先級不一致，派工靠經驗判斷，容易出現等待、漏派與責任不清。",
    empowerment: "AI 根據急迫度、技能、負載與 SLA 自動建議派工順序，並摘要處理紀錄形成知識庫。",
    tasks: ["自動分類工單類型", "推薦負責人與期限", "偵測 SLA 逾期風險", "產生處理摘要"],
    stats: [["開放工單", "57"], ["高優先", "9"], ["平均處理", "3.2h"], ["SLA 達成", "91%"]],
  },
  {
    repo: "jvision-demo",
    title: "JVision AI Demo 控制台",
    eyebrow: "JVISION AI OPERATIONS HUB",
    industry: "協作與管理",
    accent: "#f472b6",
    bg: "radial-gradient(circle at 12% 14%, rgba(244,114,182,.24), transparent 30rem), radial-gradient(circle at 84% 18%, rgba(45,212,191,.17), transparent 32rem), linear-gradient(135deg,#12111f,#241827 52%,#080b12)",
    pain: "客戶想看 AI 方案時，需要在多個網址與簡報之間切換，展示脈絡容易斷掉。",
    empowerment: "AI Demo Hub 依產業、痛點、資料可視狀態與展示目的動態組合案例，快速產生客戶導覽路徑。",
    tasks: ["依產業篩選案例", "產生展示講稿", "追蹤客戶關注功能", "輸出方案比較表"],
    stats: [["可展示案例", "464"], ["產業分類", "18"], ["本週瀏覽", "1,284"], ["熱門案例", "36"]],
  },
  {
    repo: "jvision-task-demo",
    title: "AI 任務協作與追蹤平台",
    eyebrow: "AI TASK COLLABORATION BOARD",
    industry: "協作與管理",
    accent: "#fb7185",
    bg: "radial-gradient(circle at 20% 12%, rgba(251,113,133,.24), transparent 30rem), radial-gradient(circle at 78% 20%, rgba(125,211,252,.20), transparent 28rem), linear-gradient(135deg,#101827,#25151c 50%,#080b12)",
    pain: "任務、會議決議、訊息與文件分散，主管難以知道哪些事情卡住、誰需要支援。",
    empowerment: "AI 自動彙整任務脈絡、辨識阻塞原因、提醒下一步，讓團隊協作從追問進度變成處理例外。",
    tasks: ["彙整會議待辦", "偵測阻塞任務", "推薦下一步行動", "產生週報摘要"],
    stats: [["進行中任務", "86"], ["阻塞項目", "7"], ["本週完成", "43"], ["準時率", "88%"]],
  },
];

function html(demo) {
  const statCards = demo.stats.map(([label, value]) => `<article class="stat"><span>${label}</span><strong>${value}</strong></article>`).join("");
  const taskCards = demo.tasks.map((task, i) => `<li><button data-task="${i}"><span>0${i + 1}</span>${task}</button></li>`).join("");
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${demo.title}｜JVision Demo</title>
  <style>
    :root { --accent:${demo.accent}; --panel:rgba(15,23,42,.72); --line:rgba(148,163,184,.28); --text:#eef6ff; --muted:#b8c6d8; }
    * { box-sizing:border-box; }
    body { margin:0; min-height:100vh; font-family:Inter,"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif; color:var(--text); background:${demo.bg}; overflow-x:hidden; }
    body::before { content:""; position:fixed; inset:0; background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px); background-size:56px 56px; mask-image:linear-gradient(to bottom,rgba(0,0,0,.75),transparent); pointer-events:none; }
    .shell { width:min(1180px,calc(100% - 40px)); margin:0 auto; padding:28px 0 54px; position:relative; }
    header { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 18px; border:1px solid var(--line); border-radius:999px; background:rgba(255,255,255,.08); backdrop-filter:blur(18px); }
    .brand { font-weight:900; letter-spacing:.18em; color:var(--accent); }
    .tag { color:var(--muted); font-weight:800; }
    .hero { margin-top:26px; border:1px solid var(--line); border-radius:36px; background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(15,23,42,.74)); box-shadow:0 30px 80px rgba(0,0,0,.34); padding:42px; display:grid; grid-template-columns:1.05fr .95fr; gap:30px; }
    .eyebrow { color:var(--accent); letter-spacing:.22em; font-weight:900; text-transform:uppercase; }
    h1 { font-size:clamp(38px,6vw,76px); line-height:.96; margin:18px 0; letter-spacing:-.05em; }
    .lead { color:var(--muted); font-size:20px; line-height:1.8; max-width:720px; }
    .actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:28px; }
    a, button { border:0; border-radius:999px; padding:13px 20px; font:inherit; font-weight:900; cursor:pointer; text-decoration:none; }
    .primary { color:#07111f; background:linear-gradient(135deg,#bfdbfe,var(--accent)); }
    .ghost { color:var(--text); border:1px solid var(--line); background:rgba(255,255,255,.08); }
    .stats { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
    .stat { border:1px solid var(--line); border-radius:24px; padding:22px; min-height:130px; background:rgba(8,13,24,.38); }
    .stat span { display:block; color:var(--muted); font-weight:800; }
    .stat strong { display:block; margin-top:18px; color:var(--accent); font-size:42px; letter-spacing:-.04em; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:22px; margin-top:22px; }
    .panel { border:1px solid var(--line); border-radius:30px; background:var(--panel); padding:26px; backdrop-filter:blur(18px); }
    h2 { margin:0 0 16px; font-size:22px; }
    p { color:var(--muted); line-height:1.8; }
    ul { list-style:none; padding:0; margin:0; display:grid; gap:12px; }
    li button { width:100%; color:var(--text); background:rgba(255,255,255,.07); border:1px solid var(--line); display:flex; align-items:center; gap:12px; text-align:left; }
    li button.active { border-color:color-mix(in srgb,var(--accent),white 18%); box-shadow:0 0 0 4px color-mix(in srgb,var(--accent),transparent 78%); }
    li span { color:var(--accent); }
    .ai-box { margin-top:16px; border:1px solid color-mix(in srgb,var(--accent),white 10%); background:color-mix(in srgb,var(--accent),transparent 86%); border-radius:24px; padding:20px; }
    .ai-box strong { color:var(--accent); }
    .timeline { display:grid; gap:14px; }
    .step { display:grid; grid-template-columns:46px 1fr; gap:14px; align-items:start; }
    .dot { width:46px; height:46px; display:grid; place-items:center; border-radius:16px; color:#07111f; font-weight:900; background:var(--accent); }
    .meter { height:12px; border-radius:999px; background:rgba(255,255,255,.08); overflow:hidden; margin-top:14px; }
    .meter i { display:block; width:72%; height:100%; background:linear-gradient(90deg,var(--accent),#fff); animation:pulse 2.8s ease-in-out infinite; }
    @keyframes pulse { 50% { width:88%; opacity:.82; } }
    @media (max-width:860px) { .hero,.grid { grid-template-columns:1fr; } .hero { padding:28px; } }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <div class="brand">JVISION AI CASE</div>
      <div class="tag">${demo.industry}</div>
    </header>

    <section class="hero">
      <div>
        <div class="eyebrow">${demo.eyebrow}</div>
        <h1>${demo.title}</h1>
        <p class="lead">${demo.empowerment}</p>
        <div class="actions">
          <button class="primary" id="runDemo">開始操作 Demo</button>
          <a class="ghost" href="../../">回到 Demo Hub</a>
        </div>
      </div>
      <div class="stats">${statCards}</div>
    </section>

    <section class="grid">
      <article class="panel">
        <h2>現場痛點</h2>
        <p>${demo.pain}</p>
        <div class="ai-box">
          <strong>AI 賦能情境</strong>
          <p>${demo.empowerment}</p>
        </div>
      </article>

      <article class="panel">
        <h2>互動任務</h2>
        <ul id="tasks">${taskCards}</ul>
        <div class="ai-box" id="insight">
          <strong>AI 建議</strong>
          <p>點選任務後，系統會模擬產生優先級、風險摘要與下一步建議。</p>
        </div>
      </article>

      <article class="panel">
        <h2>AI 工作流程</h2>
        <div class="timeline">
          <div class="step"><div class="dot">1</div><p>收集營運資料，將表單、紀錄、任務與異常轉成可分析事件。</p></div>
          <div class="step"><div class="dot">2</div><p>AI 進行分類、比對、預測與摘要，找出需要立即處理的例外。</p></div>
          <div class="step"><div class="dot">3</div><p>產生可執行建議，讓主管與現場人員快速決策。</p></div>
        </div>
      </article>

      <article class="panel">
        <h2>今日 AI 工作台</h2>
        <p id="statusText">系統已載入模擬資料，等待使用者啟動分析。</p>
        <div class="meter"><i></i></div>
      </article>
    </section>
  </div>

  <script>
    const suggestions = ${JSON.stringify(demo.tasks.map((task, i) => `已分析「${task}」：建議先處理前 ${i + 2} 個高影響項目，並由 AI 自動產生跨部門追蹤清單。`))};
    document.querySelectorAll("[data-task]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-task]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        const index = Number(button.dataset.task);
        document.querySelector("#insight p").textContent = suggestions[index];
        document.querySelector("#statusText").textContent = "AI 已完成任務模擬分析，並更新建議處理順序。";
      });
    });
    document.querySelector("#runDemo").addEventListener("click", () => {
      document.querySelector("[data-task='0']").click();
      document.querySelector("#runDemo").textContent = "Demo 運行中";
    });
  </script>
</body>
</html>
`;
}

for (const demo of demos) {
  const target = path.join("demos", demo.repo, "index.html");
  fs.writeFileSync(target, html(demo), "utf8");
  fs.writeFileSync(path.join("demos", demo.repo, ".jvision-static-demo"), new Date().toISOString(), "utf8");
  console.log(`updated ${target}`);
}
