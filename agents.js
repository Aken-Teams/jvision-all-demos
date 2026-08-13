/* 專案 Agents — 團隊資料與渲染邏輯（純前端 demo，尚未接真實後端）
 * 資料集中在此，方便日後增修 agent 或接 API。 */

const AGENT_SQUADS = [
  { key: "orchestration", name: "指揮", en: "ORCHESTRATION", desc: "聽懂一句話需求，拆解、分派並彙整整支團隊的產出。" },
  { key: "advisory",      name: "顧問組", en: "ADVISORY",     desc: "把需求對應到最合適的系統、產業做法與導入路線。" },
  { key: "assurance",     name: "審視組", en: "ASSURANCE",    desc: "為完整度、風險與品質把關，敏感決策一律保留人工覆核。" },
  { key: "builder",       name: "生成組", en: "BUILDER",      desc: "把結論落成規格、介面、示範資料與導覽腳本。" },
  { key: "operations",    name: "營運組", en: "OPERATIONS",   desc: "算清效益、報價、時程與進度，讓導入可被追蹤。" },
];

// status: active（執行中）/ idle（待命）/ pending（待審核）
const AGENTS = [
  {
    id: "orchestrator", name: "智策", en: "Orchestrator", squad: "orchestration",
    role: "總指揮 Agent", icon: "hub", accent: "brand", status: "active",
    tagline: "聽懂一句話，把它變成整支團隊的作戰計畫。",
    caps: ["需求理解", "任務拆解", "分派協調"],
    detail: "解析你的一句話目標，判定需要哪些領域專家，拆成有先後關係的子任務並即時調度，最後把各 agent 的產物彙整成可交付成果。",
    inputs: ["一句話目標", "限制條件", "既有資源"],
    projects: ["跨部門協作", "數位轉型", "專案立案"],
  },
  {
    id: "matchmaker", name: "選配", en: "Matchmaker", squad: "advisory",
    role: "選型顧問 Agent", icon: "travel_explore", accent: "violet", status: "active",
    tagline: "從 463 套系統中，挑出最貼你需求的那幾套。",
    caps: ["需求匹配", "方案比較", "信心評分"],
    detail: "依你的產業、規模、預算與痛點，對 463 套 JVision 系統做多維度比對，產出帶信心分數的推薦清單與比較矩陣。",
    inputs: ["一句話需求", "產業別", "公司規模", "預算區間", "既有系統"],
    projects: ["生產製造", "採購供應鏈", "品質管理", "數位轉型"],
    sample: {
      title: "推薦系統清單",
      rows: [
        { name: "生產工單管理", score: 92, color: "success" },
        { name: "AI 產線智排中心", score: 88, color: "success" },
        { name: "設備預測維護", score: 81, color: "brand2" },
      ],
    },
  },
  {
    id: "expert", name: "行家", en: "Domain Expert", squad: "advisory",
    role: "產業領域專家 Agent", icon: "school", accent: "violet", status: "active",
    tagline: "29 個產業的落地經驗，指出真正的痛點。",
    caps: ["產業痛點", "落地建議", "標竿比對"],
    detail: "涵蓋 29 個產業的領域知識，針對你的情境指出關鍵痛點、標竿做法與導入時的常見地雷。",
    inputs: ["產業別", "情境描述", "現況問題"],
    projects: ["智慧製造", "醫療照護", "ESG 永續", "零售電商"],
  },
  {
    id: "blueprint", name: "藍圖", en: "Blueprint", squad: "advisory",
    role: "導入策略顧問 Agent", icon: "architecture", accent: "violet", status: "idle",
    tagline: "把「要導入」拆成清楚的階段與里程碑。",
    caps: ["導入路線", "階段規劃", "里程碑"],
    detail: "將導入拆成試點、擴散、優化等階段，標出每階段的目標、依賴與里程碑，讓落地有節奏。",
    inputs: ["導入目標", "時程限制", "組織規模"],
    projects: ["專案管理", "數位轉型", "經營管理"],
  },
  {
    id: "auditor", name: "明鏡", en: "Auditor", squad: "assurance",
    role: "專案完整度 Agent", icon: "fact_check", accent: "brand", status: "idle",
    tagline: "逐案稽核完整度，把缺口攤在陽光下。",
    caps: ["完整度稽核", "缺口偵測", "證據標註"],
    detail: "沿用既有的 Project Expert 稽核能力，逐案檢視工作流程、清單、KPI、回饋與無障礙證據，標出可強化之處並附偵測證據。",
    inputs: ["專案清單", "稽核基線"],
    projects: ["品質管理", "專案治理"],
    link: "./project-expert.html",
  },
  {
    id: "guardian", name: "守衡", en: "Compliance", squad: "assurance",
    role: "風險與合規 Agent", icon: "gavel", accent: "amber", status: "pending",
    tagline: "敏感決策先攔下來，交回人手上覆核。",
    caps: ["敏感決策標記", "權限治理", "政策檢核"],
    detail: "偵測涉及業務規則、權限與敏感資料的動作，依企業政策標記為「需人工覆核」，確保 AI 不自動改動高風險項目。",
    inputs: ["決策內容", "企業政策", "權限矩陣"],
    projects: ["資訊安全", "法遵合規", "財務會計"],
  },
  {
    id: "calibrator", name: "校準", en: "QA Reviewer", squad: "assurance",
    role: "品質稽核 Agent", icon: "rule", accent: "brand", status: "idle",
    tagline: "驗收基線的守門員，回歸問題不放過。",
    caps: ["一致性檢查", "驗收基線", "回歸把關"],
    detail: "對交付物做一致性與驗收檢查，維持命名、格式與品質基線，避免回歸問題。",
    inputs: ["交付物", "驗收準則"],
    projects: ["品質管理", "研發管理"],
  },
  {
    id: "drafter", name: "擬稿", en: "Spec Writer", squad: "builder",
    role: "規格 / SOW Agent", icon: "edit_document", accent: "brand", status: "idle",
    tagline: "把結論寫成能簽章的規格與 SOW。",
    caps: ["規格撰寫", "SOW", "需求轉換"],
    detail: "將需求與推薦結論轉成結構化的導入規格書與工作說明書（SOW），可直接進入審核流程。",
    inputs: ["需求結論", "範圍界定"],
    projects: ["專案管理", "系統整合"],
  },
  {
    id: "designer", name: "繪境", en: "UI Designer", squad: "builder",
    role: "UI 設計 Agent", icon: "palette", accent: "violet", status: "idle",
    tagline: "產出介面草稿與設計 prompt（就像這頁）。",
    caps: ["介面草稿", "設計 prompt", "元件規範"],
    detail: "依系統定位產生介面草稿與可貼進設計工具的 prompt，並維持一致的元件與樣式規範。",
    inputs: ["系統定位", "風格指引"],
    projects: ["產品設計", "使用者體驗"],
  },
  {
    id: "seeder", name: "填實", en: "Data Seeder", squad: "builder",
    role: "資料填充 Agent", icon: "dataset", accent: "brand", status: "idle",
    tagline: "填進擬真資料，讓 demo 像真的在跑。",
    caps: ["擬真資料", "情境樣本", "邊界案例"],
    detail: "為系統填入符合情境的擬真示範資料，涵蓋正常、空資料與邊界案例，讓展示更可信。",
    inputs: ["資料結構", "情境設定"],
    projects: ["示範環境", "測試資料"],
  },
  {
    id: "narrator", name: "講解", en: "Demo Narrator", squad: "builder",
    role: "導覽腳本 Agent", icon: "slideshow", accent: "violet", status: "idle",
    tagline: "三分鐘把系統賣點講清楚的腳本手。",
    caps: ["demo 腳本", "賣點提煉", "導覽動線"],
    detail: "為業務產出 3 分鐘導覽腳本，提煉賣點與操作動線，讓每一場 demo 都打中重點。",
    inputs: ["系統功能", "對象角色"],
    projects: ["業務銷售", "客戶簡報"],
  },
  {
    id: "abacus", name: "算盤", en: "ROI Estimator", squad: "operations",
    role: "ROI 試算 Agent", icon: "calculate", accent: "brand", status: "active",
    tagline: "把效益算成老闆看得懂的數字。",
    caps: ["效益估算", "成本結構", "回收期"],
    detail: "依情境資料試算導入效益、成本結構與投資回收期，輸出可對照 before→after 的 ROI 表。",
    inputs: ["現況數據", "成本假設"],
    projects: ["經營管理", "財務會計"],
  },
  {
    id: "quoter", name: "估價", en: "Quote Builder", squad: "operations",
    role: "報價 / 預算 Agent", icon: "request_quote", accent: "brand", status: "idle",
    tagline: "從需求直接長出一張清楚的報價單。",
    caps: ["報價單", "預算配置", "授權方案"],
    detail: "依範圍與規模產生報價單與授權方案建議，讓預算討論有依據。",
    inputs: ["導入範圍", "規模人數"],
    projects: ["採購供應鏈", "財務會計"],
  },
  {
    id: "scheduler", name: "排程", en: "Scheduler", squad: "operations",
    role: "專案排程 Agent", icon: "calendar_month", accent: "brand", status: "idle",
    tagline: "資源與時程排好排滿，甘特圖一鍵成形。",
    caps: ["時程規劃", "資源配置", "甘特圖"],
    detail: "把導入任務排成時程與資源配置，輸出甘特圖與關鍵路徑，讓進度可被規劃。",
    inputs: ["任務清單", "資源限制"],
    projects: ["專案管理", "生產製造"],
  },
  {
    id: "supervisor", name: "督導", en: "Progress Tracker", squad: "operations",
    role: "進度追蹤 Agent", icon: "monitoring", accent: "brand", status: "idle",
    tagline: "盯進度、示警風險、週報自動生。",
    caps: ["進度追蹤", "風險預警", "週報彙整"],
    detail: "持續追蹤任務進度、預警落後與風險，自動彙整週報與待辦，讓管理者一眼掌握。",
    inputs: ["專案進度", "風險門檻"],
    projects: ["專案管理", "經營管理"],
  },
  {
    id: "insighter", name: "洞察", en: "Insighter", squad: "operations",
    role: "數據洞察 Agent", icon: "insights", accent: "violet", status: "idle",
    tagline: "從資料裡讀出趨勢與該做的決定。",
    caps: ["指標分析", "趨勢解讀", "儀表板"],
    detail: "彙整營運資料，解讀關鍵指標與趨勢，產出決策用的儀表板與洞察摘要。",
    inputs: ["營運資料", "關注指標"],
    projects: ["經營管理", "業務銷售"],
  },
];

/* 常用 / 必備 Agents（精選呈現於市集頂部） */
const FEATURED_IDS = ["orchestrator", "matchmaker", "expert"];

/* 為每位 agent 補上差異化的示範數據（deterministic，不用亂數） */
AGENTS.forEach((a, i) => {
  a.stats = a.stats || {
    tasks: 48 + ((i * 37) % 180),
    hit: 84 + ((i * 7) % 14),
    resp: 4 + ((i * 3) % 9),
    collab: 3 + ((i * 2) % 5),
  };
});

/* ---------- helpers ---------- */
const STATUS_META = {
  active:  { dot: "bg-success",  ring: "ring-success/40",  label: "執行中", text: "text-success" },
  idle:    { dot: "bg-idle",     ring: "ring-line",         label: "待命",   text: "text-muted" },
  pending: { dot: "bg-amber",    ring: "ring-amber/50",     label: "待審核", text: "text-amber" },
};
const ACCENT_BG = { brand: "bg-brand/10 text-brand", brand2: "bg-brand2/10 text-brand2", violet: "bg-violet/10 text-violet", amber: "bg-amber/10 text-amber" };

function squadOf(key) { return AGENT_SQUADS.find((s) => s.key === key); }
function agentById(id) { return AGENTS.find((a) => a.id === id); }

/* ---------- landing: render team grid grouped by squad ---------- */
function agentCardHTML(a) {
  const st = STATUS_META[a.status];
  const accent = ACCENT_BG[a.accent] || ACCENT_BG.brand;
  const chips = a.caps.map((c) => `<span class="text-[11px] font-semibold text-body bg-soft border border-line rounded-full px-2 py-0.5">${c}</span>`).join("");
  return `
  <a href="./agents-profile?id=${a.id}" class="group bg-white border border-line rounded-xl p-4 flex flex-col gap-3 hover:border-brand2 hover:shadow-[0_10px_30px_rgba(15,30,70,.08)] hover:-translate-y-0.5 transition-all">
    <div class="flex items-start gap-3">
      <div class="relative shrink-0">
        <div class="w-12 h-12 rounded-full ${accent} grid place-content-center ring-2 ${st.ring} ring-offset-2 ring-offset-white">
          <span class="material-symbols-outlined text-[24px]">${a.icon}</span>
        </div>
        <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${st.dot} border-2 border-white"></span>
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h4 class="text-[15px] font-black text-ink truncate">${a.name}</h4>
          <span class="text-[10px] font-bold ${st.text}">${st.label}</span>
        </div>
        <p class="text-xs text-muted font-semibold truncate">${a.role}</p>
      </div>
    </div>
    <p class="text-[13px] text-body leading-snug line-clamp-2">${a.tagline}</p>
    <div class="flex flex-wrap gap-1.5">${chips}</div>
    <span class="mt-auto text-xs font-bold text-brand2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">查看 Agent <span class="material-symbols-outlined text-[16px]">arrow_forward</span></span>
  </a>`;
}

function renderTeam(mountId) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  mount.innerHTML = AGENT_SQUADS.map((sq) => {
    const members = AGENTS.filter((a) => a.squad === sq.key);
    if (!members.length) return "";
    return `
    <div class="squad-block">
      <div class="flex items-baseline gap-3 mb-3">
        <span class="eyebrow text-[11px] font-bold text-brand2">${sq.en}</span>
        <h3 class="text-lg font-black text-ink">${sq.name}</h3>
        <span class="text-xs text-muted">· ${members.length} 位</span>
        <p class="hidden md:block text-xs text-muted ml-auto max-w-md text-right">${sq.desc}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        ${members.map(agentCardHTML).join("")}
      </div>
    </div>`;
  }).join("");
}

/* ---------- marketplace: searchable / filterable agent directory ---------- */
function featuredCardHTML(a) {
  const st = STATUS_META[a.status];
  const accent = ACCENT_BG[a.accent] || ACCENT_BG.brand;
  return `
  <a href="./agents-profile?id=${a.id}" class="group relative bg-white border border-line rounded-xl p-4 flex flex-col gap-3 hover:border-brand2 hover:shadow-[0_10px_28px_rgba(15,30,70,.1)] transition-all">
    <span class="absolute top-3 right-3 text-[10px] font-bold text-amber bg-amber/10 border border-amber/20 rounded-full px-2 py-0.5">常用</span>
    <div class="flex items-center gap-3">
      <div class="relative shrink-0">
        <div class="w-12 h-12 rounded-full ${accent} grid place-content-center ring-2 ${st.ring} ring-offset-2 ring-offset-white"><span class="material-symbols-outlined text-[24px]">${a.icon}</span></div>
        <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${st.dot} border-2 border-white"></span>
      </div>
      <div class="min-w-0"><h4 class="text-[15px] font-black text-ink truncate">${a.name}</h4><p class="text-xs text-muted font-semibold truncate">${a.role}</p></div>
    </div>
    <p class="text-[13px] text-body leading-snug line-clamp-2">${a.tagline}</p>
    <div class="flex items-center gap-3 text-[11px] text-muted font-semibold pt-1 border-t border-line">
      <span>協助 <b class="text-ink">${a.stats.tasks}</b></span>
      <span>命中 <b class="text-success">${a.stats.hit}%</b></span>
      <span class="ml-auto text-brand2 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">查看 <span class="material-symbols-outlined text-[15px]">arrow_forward</span></span>
    </div>
  </a>`;
}

function renderAgentMarketplace() {
  const $ = (s) => document.querySelector(s);
  const grid = $("#agGrid"), featWrap = $("#agFeaturedWrap"), feat = $("#agFeatured"), count = $("#agCount");
  const searchEl = $("#agSearch"), squadsEl = $("#agSquads"), statusEl = $("#agStatus"), clearEl = $("#agClear");
  if (!grid) return;
  const initSquad = new URLSearchParams(location.search).get("squad") || "";
  const state = { q: "", squad: AGENT_SQUADS.some((s) => s.key === initSquad) ? initSquad : "", status: "" };

  // featured strip
  if (feat) feat.innerHTML = FEATURED_IDS.map(agentById).filter(Boolean).map(featuredCardHTML).join("");

  // squad filter buttons (with counts)
  const squadBtn = (key, name, n, active) =>
    `<button data-squad="${key}" class="ag-filter w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? "bg-[#e8f0ff] text-brand border border-[#bfdbfe]" : "text-body hover:bg-[#eef4ff] hover:text-brand border border-transparent"}"><span>${name}</span><span class="text-xs font-bold ${active ? "text-brand" : "text-muted"}">${n}</span></button>`;
  function paintSquads() {
    squadsEl.innerHTML = squadBtn("", "全部 Agents", AGENTS.length, state.squad === "")
      + AGENT_SQUADS.map((s) => squadBtn(s.key, s.name, AGENTS.filter((a) => a.squad === s.key).length, state.squad === s.key)).join("");
    squadsEl.querySelectorAll(".ag-filter").forEach((b) => b.addEventListener("click", () => { state.squad = b.dataset.squad; apply(); }));
  }
  // status filter
  const STATUSES = [["", "全部狀態"], ["active", "執行中"], ["idle", "待命"], ["pending", "待審核"]];
  function paintStatus() {
    statusEl.innerHTML = STATUSES.map(([v, label]) => {
      const active = state.status === v;
      const dot = v ? `<span class="w-2 h-2 rounded-full ${STATUS_META[v].dot}"></span>` : "";
      return `<button data-status="${v}" class="ag-status inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${active ? "bg-brand text-white border-brand" : "bg-white text-body border-line hover:border-brand2"}">${dot}${label}</button>`;
    }).join("");
    statusEl.querySelectorAll(".ag-status").forEach((b) => b.addEventListener("click", () => { state.status = b.dataset.status; apply(); }));
  }

  function apply() {
    const q = state.q.trim().toLocaleLowerCase("zh-Hant");
    const list = AGENTS.filter((a) => {
      if (state.squad && a.squad !== state.squad) return false;
      if (state.status && a.status !== state.status) return false;
      if (q) {
        const hay = [a.name, a.en, a.role, a.tagline, (a.caps || []).join(" "), (a.projects || []).join(" ")].join(" ").toLocaleLowerCase("zh-Hant");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const filtering = !!(state.q || state.squad || state.status);
    if (featWrap) featWrap.style.display = filtering ? "none" : "";
    grid.innerHTML = list.length ? list.map(agentCardHTML).join("")
      : `<div class="col-span-full text-center py-14 border border-dashed border-line rounded-2xl bg-white text-muted"><span class="material-symbols-outlined text-[36px]">search_off</span><p class="font-bold text-ink mt-2">找不到符合的 Agent</p><p class="text-sm mt-1">換個關鍵字或清除篩選再試一次。</p></div>`;
    if (count) count.textContent = filtering ? `顯示 ${list.length} / ${AGENTS.length} 位 Agent` : `全部 ${AGENTS.length} 位 Agent`;
    if (clearEl) clearEl.disabled = !filtering;
    paintSquads(); paintStatus();
  }

  if (searchEl) searchEl.addEventListener("input", (e) => { state.q = e.target.value; apply(); });
  if (clearEl) clearEl.addEventListener("click", () => { state.q = ""; state.squad = ""; state.status = ""; if (searchEl) searchEl.value = ""; apply(); });
  paintSquads(); paintStatus(); apply();
}

/* ---------- profile: render one agent from ?id= ---------- */
function renderProfile() {
  const id = new URLSearchParams(location.search).get("id") || "matchmaker";
  const a = agentById(id) || agentById("matchmaker");
  const sq = squadOf(a.squad);
  const st = STATUS_META[a.status];
  const accent = ACCENT_BG[a.accent] || ACCENT_BG.brand;
  const set = (sel, html) => { const el = document.querySelector(sel); if (el) el.innerHTML = html; };
  const setText = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };

  document.title = `${a.name} · 專案 Agents — JVision`;
  set("#pfAvatar", `<span class="material-symbols-outlined text-[40px]">${a.icon}</span>`);
  document.querySelector("#pfAvatar").className = `w-full h-full rounded-full ${accent} grid place-content-center`;
  document.querySelector("#pfStatusDot").className = `absolute bottom-1 right-1 w-4 h-4 rounded-full ${st.dot} border-2 border-white`;
  setText("#pfSquad", sq.name);
  setText("#pfName", `${a.name} · ${a.role}`);
  setText("#pfTagline", a.detail);
  set("#pfStatus", `<span class="material-symbols-outlined text-[16px] ${st.text}">fiber_manual_record</span><span>${st.label}</span>`);

  // KPI row (per-agent stats)
  setText("#pfKpiTasks", a.stats.tasks);
  setText("#pfKpiHit", a.stats.hit + "%");
  set("#pfKpiResp", `${a.stats.resp}<span class="text-base font-bold text-muted ml-1">秒</span>`);
  setText("#pfKpiCollab", a.stats.collab);
  setText("#pfGraphSelf", a.name);

  // capabilities
  set("#pfCaps", a.caps.concat(["自動彙整", "可追溯輸出"]).slice(0, 6).map((c) => `
    <div class="bg-white border border-line rounded-lg p-3 flex items-start gap-2">
      <span class="material-symbols-outlined text-[20px] text-brand shrink-0">check_circle</span>
      <div><h5 class="text-[13px] font-bold text-ink leading-tight">${c}</h5></div>
    </div>`).join(""));

  // inputs
  set("#pfInputs", (a.inputs || []).map((i) => `<span class="px-2.5 py-1 bg-soft border border-line rounded-full text-[12px] font-semibold text-body">${i}</span>`).join(""));

  // sample output (matchmaker-style list if provided, else generic)
  if (a.sample) {
    set("#pfSampleTitle", a.sample.title);
    set("#pfSampleBody", a.sample.rows.map((r) => `
      <div class="flex items-center justify-between p-2 hover:bg-soft rounded-lg transition-colors border-b border-line last:border-0">
        <span class="text-[14px] font-semibold text-ink">${r.name}</span>
        <div class="flex items-center gap-3">
          <div class="w-24 bg-line rounded-full h-1.5 overflow-hidden"><div class="bg-${r.color} h-1.5 rounded-full" style="width:${r.score}%"></div></div>
          <span class="text-xs font-bold text-${r.color} w-8 text-right">${r.score}%</span>
        </div>
      </div>`).join(""));
  } else {
    set("#pfSampleTitle", `${a.name} 的產出摘要`);
    set("#pfSampleBody", `<p class="text-[13px] text-body leading-relaxed">${a.detail}</p>
      <div class="mt-3 flex flex-wrap gap-1.5">${a.caps.map((c) => `<span class="text-[11px] font-semibold text-brand bg-brand/5 border border-brand/15 rounded-full px-2 py-0.5">${c}</span>`).join("")}</div>`);
  }

  // applicable projects
  set("#pfProjects", (a.projects || []).map((p) => `<a href="./catalog?q=${encodeURIComponent(p)}" class="px-2.5 py-1 bg-soft border border-line rounded-lg text-[12px] font-semibold text-body hover:border-brand2 hover:text-brand transition-colors">${p}</a>`).join(""));

  // teammates (same squad, excluding self)
  const mates = AGENTS.filter((m) => m.squad === a.squad && m.id !== a.id).slice(0, 4);
  set("#pfMates", (mates.length ? mates : AGENTS.filter((m) => m.id !== a.id).slice(0, 4)).map((m) => {
    const mst = STATUS_META[m.status], macc = ACCENT_BG[m.accent] || ACCENT_BG.brand;
    return `
    <a href="./agents-profile?id=${m.id}" class="bg-white border border-line rounded-xl p-4 flex items-center gap-3 hover:border-brand2 hover:shadow-sm transition-all">
      <div class="relative shrink-0">
        <div class="w-11 h-11 rounded-full ${macc} grid place-content-center"><span class="material-symbols-outlined text-[22px]">${m.icon}</span></div>
        <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${mst.dot} border border-white"></span>
      </div>
      <div class="min-w-0"><h4 class="text-[13px] font-bold text-ink truncate">${m.name}</h4><p class="text-[11px] text-muted truncate">${m.role}</p></div>
    </a>`;
  }).join(""));

  // optional external link (e.g. 明鏡 -> project-expert)
  if (a.link) {
    const el = document.querySelector("#pfAssign");
    if (el) { el.setAttribute("href", a.link); el.textContent = "開啟此 Agent"; }
  }
}

/* auto-run on profile page */
if (document.body && document.body.dataset.page === "agent-profile") {
  document.addEventListener("DOMContentLoaded", renderProfile);
}
