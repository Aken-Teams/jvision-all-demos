/* 預設看「最新上架」而不是相關性。沒有搜尋字串時相關性一律是 0，實際上是
   照編號由小到大排——也就是最舊的排最前面。那個位置本身會製造點擊，點擊又
   讓它們看起來熱門，是個自我強化的循環；每天新做的系統則永遠沉在後面。 */
const DEFAULT_SORT = "newest";

const state = {
  projects: [],
  filtered: [],
  query: "",
  category: "",
  sort: DEFAULT_SORT,
  /* 使用者有沒有自己挑過排序。有的話就不要自作主張改它。 */
  sortExplicit: false,
  page: 1,
  suggestionIndex: -1,
};
const PAGE_SIZE = 12;

const grid = document.querySelector("#projectGrid");
const template = document.querySelector("#projectCardTemplate");
const searchInput = document.querySelector("#searchInput");
const suggestions = document.querySelector("#searchSuggestions");
const categorySelect = document.querySelector("#categorySelect");
const sortSelect = document.querySelector("#sortSelect");
const quickFilters = document.querySelector("#quickFilters");
const clearFilters = document.querySelector("#clearFilters");
const pagination = document.querySelector("#pagination");
const catalogStatsBody = document.querySelector("#catalogStatsBody");
const catalogStatsSummary = document.querySelector("#catalogStatsSummary");
const searchResults = document.querySelector("#searchResults");
const projectUseDialog = document.querySelector("#projectUseDialog");
const projectUseDialogTitle = document.querySelector("#projectUseDialogTitle");
const projectUseDialogContent = document.querySelector(".project-use-dialog-content");

projectUseDialog.querySelector(".project-use-dialog-close").addEventListener("click", () => projectUseDialog.close());
projectUseDialog.addEventListener("click", event => {
  if (event.target === projectUseDialog) projectUseDialog.close();
});

const sourceLabels = {
  "legacy-jvision": "JV 整合專案",
  "ai-case": "AI 產業案例",
  "smart-manufacturing": "智慧製造系統",
  "jv-integrated": "JV 整合專案",
  "hr-expansion": "人資擴充系統",
  "wh-expansion": "倉儲物流擴充系統",
  "rd-expansion": "研發管理擴充系統",
  "mg-expansion": "經營管理擴充系統",
  "sg-expansion": "ESG 永續擴充系統",
};

function normalize(value) {
  return String(value || "").toLocaleLowerCase("zh-Hant").trim();
}

function sourceKey(project) {
  if (project.sourceGroup) return project.sourceGroup;
  if (String(project.repoName).startsWith("jvision-smart-mfg-")) return "smart-manufacturing";
  if (String(project.repoName).startsWith("jvision-ai-case-")) return "ai-case";
  return "jv-integrated";
}

function sourceLabel(project) {
  const key = sourceKey(project);
  return sourceLabels[key] || key;
}

function thumbnailUrl(project) {
  const sequence = String(project.catalogSequence).padStart(3, "0");
  return `./assets/demo-screenshots/${sequence}-${project.repoName}.jpg`;
}

function searchableText(project) {
  return normalize([
    project.id,
    `#${project.id}`,
    project.title,
    project.description,
    project.businessSituation,
    project.primaryUser,
    project.dailyUse,
    ...(project.operationalMetrics || []),
    project.category,
    project.industry,
    project.repoName,
    project.localPath,
    sourceLabel(project),
  ].join(" "));
}

/* 排序用的上架日期與瀏覽數。命名刻意不叫 catalogStats——那個名字已經被
   頁面上的「產業分類統計」區塊用掉了，兩個混在一起改的人會挑錯。

   抓不到就留空：「最新上架」退回用案例編號（編號遞增，實測與上架日期同向的
   比例是 99%），「最近熱門」則全部同分而落回編號排序。目錄能不能用，不該
   取決於一份排序用的加分資料。 */
const sortStats = { addedAt: {}, views: {}, hotDays: 30, coverDays: 0 };

function loadSortStats() {
  return fetch("/api/catalog/stats", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d) return;
      sortStats.addedAt = d.addedAt || {};
      sortStats.views = d.views || {};
      sortStats.hotDays = d.hotDays || 30;
      sortStats.coverDays = d.coverDays || 0;
    })
    .catch(() => {});
}

/* 上架時間。沒有真實日期時用案例編號代替——它是遞增的，相對先後仍然是對的。 */
function addedTime(project) {
  const iso = sortStats.addedAt[project.repoName];
  if (iso) { const t = Date.parse(iso); if (!Number.isNaN(t)) return t; }
  return Number(project.id) || 0;
}

const viewsOf = (project) => sortStats.views[project.repoName] || 0;

function relevance(project, query) {
  if (!query) return 0;
  const title = normalize(project.title);
  const repo = normalize(project.repoName);
  const category = normalize(project.category);
  const id = String(project.id);
  if (query === id || query === `#${id}`) return 100;
  if (title.startsWith(query)) return 80;
  if (repo.startsWith(query)) return 70;
  if (category.includes(query)) return 60;
  return searchableText(project).includes(query) ? 20 : 0;
}

function addOptions(element, values) {
  for (const [value, label] of values) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    element.append(option);
  }
}

function hydrateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") || "";
  state.category = params.get("category") || "";
  state.sort = params.get("sort") || DEFAULT_SORT;
  state.sortExplicit = params.has("sort");
  state.page = Math.max(1, parseInt(params.get("page"), 10) || 1);
  searchInput.value = state.query;
  categorySelect.value = state.category;
  sortSelect.value = state.sort;
}

function syncUrl() {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category) params.set("category", state.category);
  if (state.sort !== DEFAULT_SORT) params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  const query = params.toString();
  history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

function selectCategory(category, { scrollToResults = false } = {}) {
  state.query = "";
  state.category = category;
  searchInput.value = "";
  categorySelect.value = category;
  applyFilters({ updateSuggestions: false });
  if (scrollToResults) searchResults.scrollIntoView({ behavior: "smooth", block: "start" });
}

function appendStatMetric(container, value, label) {
  const metric = document.createElement("div");
  const strong = document.createElement("strong");
  const span = document.createElement("span");
  strong.textContent = value;
  span.textContent = label;
  metric.append(strong, span);
  container.append(metric);
}

function renderCatalogStats() {
  const groups = new Map();
  for (const project of state.projects) {
    const category = project.category || "未分類";
    const projects = groups.get(category) || [];
    projects.push(project);
    groups.set(category, projects);
  }

  const rows = [...groups.entries()]
    .map(([category, projects]) => ({
      category,
      projects,
      available: projects.filter((project) => Boolean(project.demoUrl)).length,
      featured: projects.find((project) => project.demoUrl) || projects[0],
    }))
    .sort((a, b) => b.projects.length - a.projects.length || a.category.localeCompare(b.category, "zh-Hant"));

  catalogStatsSummary.innerHTML = "";
  appendStatMetric(catalogStatsSummary, String(rows.length), "個產業分類");
  appendStatMetric(catalogStatsSummary, String(state.projects.length), "個展示專案");
  appendStatMetric(catalogStatsSummary, String(state.projects.filter((project) => project.demoUrl).length), "個可開啟 Demo");

  catalogStatsBody.innerHTML = "";
  const fragment = document.createDocumentFragment();
  for (const item of rows) {
    const row = document.createElement("tr");
    const categoryCell = document.createElement("th");
    categoryCell.scope = "row";
    categoryCell.textContent = item.category;

    const projectCount = document.createElement("td");
    projectCount.textContent = String(item.projects.length);
    const availableCount = document.createElement("td");
    availableCount.textContent = String(item.available);

    const featuredCell = document.createElement("td");
    if (item.featured?.demoUrl) {
      const link = document.createElement("a");
      link.href = item.featured.demoUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = item.featured.title || item.featured.repoName;
      link.setAttribute("aria-label", `開啟 ${item.featured.title || item.featured.repoName} Demo`);
      featuredCell.append(link);
    } else {
      featuredCell.textContent = "尚無可開啟 Demo";
    }

    const actionCell = document.createElement("td");
    const action = document.createElement("button");
    action.type = "button";
    action.className = "stats-project-link";
    action.dataset.category = item.category;
    action.textContent = `查看 ${item.projects.length} 個專案`;
    action.setAttribute("aria-label", `查看 ${item.category} 的 ${item.projects.length} 個專案`);
    actionCell.append(action);
    row.append(categoryCell, projectCount, availableCount, featuredCell, actionCell);
    fragment.append(row);
  }
  catalogStatsBody.append(fragment);
}

const categoryIcons = {
  "生產製造": "precision_manufacturing", "品質管理": "verified", "業務銷售": "trending_up",
  "採購供應鏈": "handshake", "人力資源": "badge", "倉儲物流": "inventory_2", "研發管理": "science",
  "經營管理": "insights", "ESG 永續": "eco", "零售電商": "storefront", "教育": "school",
  "企業協作": "groups", "營建工程": "engineering", "醫療照護": "medical_services", "財務會計": "account_balance",
  "金融保險": "savings", "資訊科技": "dns", "交通運輸": "commute", "設備維護": "build",
  "資訊安全": "security", "專業服務": "gavel", "物流運輸": "local_shipping", "餐飲旅宿": "restaurant",
  "生活服務": "checkroom", "數據分析": "analytics", "客服管理": "support_agent",
  "房地產與物業": "apartment", "宗教服務": "temple_buddhist",
  "AI 工程平台": "smart_toy",
};
function categoryIcon(category) { return categoryIcons[category] || "category"; }

/* 分類色（給卡片 hero 的色調） */
const categoryColors = {
  "生產製造": "#1e40af", "品質管理": "#0891b2", "業務銷售": "#2563eb", "採購供應鏈": "#7c3aed",
  "人力資源": "#db2777", "倉儲物流": "#0d9488", "研發管理": "#4338ca", "經營管理": "#4f46e5",
  "ESG 永續": "#16a34a", "零售電商": "#ea580c", "教育": "#ca8a04", "企業協作": "#6366f1",
  "營建工程": "#b45309", "醫療照護": "#dc2626", "財務會計": "#059669", "金融保險": "#0284c7",
  "資訊科技": "#0ea5e9", "交通運輸": "#0369a1", "設備維護": "#0369a1", "資訊安全": "#475569",
  "專業服務": "#7c3aed", "物流運輸": "#0d9488", "餐飲旅宿": "#ea580c", "生活服務": "#db2777",
  "數據分析": "#4f46e5", "客服管理": "#0ea5e9", "房地產與物業": "#b45309", "宗教服務": "#b45309",
  "AI 工程平台": "#64748b",
};
function categoryColor(category) { return categoryColors[category] || "#1e40af"; }

/* 卡片預覽：嵌入該專案的 live demo（縮放成「活的預覽」，捲到才載入） */
function cardHeroHTML(project) {
  const cat = project.category || "";
  const hue = categoryColor(cat);
  const soft = `${hue}14`;
  const icon = categoryIcon(cat);
  const title = project.title || project.repoName || "";
  const caseNo = String(project.catalogSequence).padStart(3, "0");
  const badge = `<span class="absolute top-2 left-2 z-10 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm bg-white" style="color:${hue}"><span class="material-symbols-outlined" style="font-size:12px">${icon}</span>${cat} · #${caseNo}</span>`;
  if (!project.demoUrl) {
    return `<div class="absolute inset-0 flex flex-col items-center justify-center gap-1" style="background:${soft}">${badge}<span class="material-symbols-outlined" style="font-size:40px;color:${hue};opacity:.45">${icon}</span><b class="text-[11px] font-bold" style="color:${hue}">${title}</b><span class="case-id hidden">#${project.id}</span></div>`;
  }
  return `
    <div class="jv-card-embed absolute inset-0 overflow-hidden" data-src="${project.demoUrl}" style="background:${soft}">
      ${badge}
      <div class="jv-card-ph absolute inset-0 flex items-center justify-center" style="background:${soft}"><span class="material-symbols-outlined" style="font-size:38px;color:${hue};opacity:.4">${icon}</span></div>
      <iframe class="jv-card-frame" title="${title} 系統畫面" loading="lazy" scrolling="no" style="border:0;width:${EMBED_W}px;height:${EMBED_H}px;transform-origin:top left;pointer-events:none;opacity:0;transition:opacity .35s"></iframe>
      <span class="case-id hidden">#${project.id}</span>
    </div>`;
}

/* 卡片 live demo：捲到才載入 + 縮放；resize 重算（只綁一次） */
/* 預覽 iframe 內部的解析度。卡片實際只有 ~460px 寬，用 1440 渲染再縮到三分之一
   是白做的像素——一頁同時開六個 iframe 時，那些多出來的排版與繪製都在搶同一條
   主執行緒。降到 1152 仍在桌機斷點（1024）之上，版面不會塌成手機版。 */
const EMBED_W = 1152, EMBED_H = 720;

function scaleCardEmbed(wrap) {
  const f = wrap.querySelector(".jv-card-frame"); if (!f) return;
  const w = wrap.clientWidth; if (!w) return;
  f.style.transform = "scale(" + (w / EMBED_W) + ")";
}
let _cardIO = null, _cardResizeBound = false;
/* 預覽 iframe 同時最多載 3 個。每個 iframe 是一整套 demo（字型＋圖表庫＋渲染），
   捲快一點十幾個同時開載會把主執行緒打趴——排隊逐批載，畫面才不會卡。 */
const _embedQueue = [];
let _embedLoading = 0;
/* 同時開幾個 iframe。原本是 3，實測一頁 12 張要等超過 20 秒才出現第 4 張——
   瓶頸不是 demo 本身（55KB、10ms 就取回來了），而是 iframe 的 load 事件要等
   圖表庫與字型從 CDN 全部到齊，一張卡就把通道占住好幾秒。 */
const EMBED_MAX = 6;
/* 占用通道的時間上限。時間到就讓下一張開始載——**iframe 本身會繼續載完**，
   這個數字管的是「什麼時候允許下一張開始」，不是「什麼時候放棄這一張」。 */
const SLOT_MS = 1500;
/* 還沒 load 完也先顯示。demo 的版面是內嵌的 HTML/CSS，很快就畫得出來；
   硬等 load 等於為了晚到的圖表讓整張卡一直空白。 */
const REVEAL_MS = 1200;

function pumpEmbeds() {
  while (_embedLoading < EMBED_MAX && _embedQueue.length) {
    const wrap = _embedQueue.shift();
    if (!wrap.isConnected) continue; // 換頁後殘留在隊伍裡的舊卡片，載了也沒人看
    const f = wrap.querySelector(".jv-card-frame");
    if (!f || f.src || !wrap.dataset.src) continue;
    _embedLoading += 1;

    let released = false;
    const release = () => { if (released) return; released = true; _embedLoading -= 1; pumpEmbeds(); };
    const reveal = () => {
      if (!f.isConnected) return;
      scaleCardEmbed(wrap);
      f.style.opacity = "1";
      const ph = wrap.querySelector(".jv-card-ph");
      if (ph) ph.style.display = "none";
    };

    f.addEventListener("load", () => { reveal(); release(); }, { once: true });
    f.addEventListener("error", release, { once: true });
    setTimeout(reveal, REVEAL_MS);
    setTimeout(release, SLOT_MS);
    f.src = wrap.dataset.src;
    scaleCardEmbed(wrap);
  }
}
function setupCardEmbeds() {
  if (!_cardIO) {
    _cardIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        _embedQueue.push(en.target);
        _cardIO.unobserve(en.target);
      });
      pumpEmbeds();
    /* 提早一個半螢幕就開始載。300px 只夠捲到眼前才開始，於是每捲一次就看到
       一批空白卡片等著填——實測捲第一屏時只有 8/12 張畫得出來。
       這個距離不會多載東西（同一頁就那幾張），只是把載入時間挪到使用者
       還沒看到它之前。 */
    }, { rootMargin: "1200px" });
  }
  document.querySelectorAll(".jv-card-embed").forEach((w) => { if (w.querySelector(".jv-card-frame:not([src])")) _cardIO.observe(w); });
  if (!_cardResizeBound) { _cardResizeBound = true; window.addEventListener("resize", () => document.querySelectorAll(".jv-card-embed").forEach(scaleCardEmbed)); }
}

// Display title = text before any「（英文全名）」parenthetical (fallback to original if empty).
function shortTitle(title) {
  const raw = String(title || "");
  return raw.replace(/[（(].*?[)）]/g, "").trim() || raw;
}

function renderQuickFilters() {
  quickFilters.innerHTML = "";
  const categories = [...new Set(state.projects.map((project) => project.category || "未分類"))]
    .map((category) => ({ category, count: state.projects.filter((project) => (project.category || "未分類") === category).length }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, "zh-Hant"));
  const makeButton = (category, name, count, icon) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = category;
    button.innerHTML = `<span class="qf-main"><span class="material-symbols-outlined qf-icon">${icon}</span><span class="qf-name">${name}</span></span><span class="qf-count">${count}</span>`;
    return button;
  };
  quickFilters.append(makeButton("", "全部專案", state.projects.length, "apps"));
  for (const item of categories) {
    quickFilters.append(makeButton(item.category, item.category, item.count, categoryIcon(item.category)));
  }
  quickFilters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    selectCategory(button.dataset.category);
  });
}

function renderActiveFilters() {
  const entries = [
    ["關鍵字", state.query, () => { state.query = ""; searchInput.value = ""; }],
    ["產業", state.category, () => { state.category = ""; categorySelect.value = ""; }],
  ].filter(([, value]) => value);
  const container = document.querySelector("#activeFilters");
  container.innerHTML = "";
  for (const [label, value, clear] of entries) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.textContent = `${label}：${value} ×`;
    chip.addEventListener("click", () => { clear(); applyFilters(); });
    container.append(chip);
  }
  clearFilters.disabled = !entries.length && state.sort === DEFAULT_SORT;
  for (const button of quickFilters.querySelectorAll("button")) {
    button.classList.toggle("active", button.dataset.category === state.category);
  }
}

/* 分頁模式：一次只渲染一頁（PAGE_SIZE 張）。每頁量小，換頁整頁重建反而乾脆，
   也不會累積出幾百個 iframe 吃光記憶體。 */
function renderProjects() {
  const pages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
  if (state.page > pages) state.page = pages;
  grid.innerHTML = "";
  if (!state.filtered.length) {
    grid.innerHTML = `<article class="empty-state"><h3>沒有符合條件的專案</h3><p>請改用產業名稱、功能名稱或案例編號搜尋。</p><button type="button" id="emptyClear">清除所有篩選</button></article>`;
    document.querySelector("#emptyClear")?.addEventListener("click", resetFilters);
  }
  const pageProjects = state.filtered.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
  const fragment = document.createDocumentFragment();
  for (const project of pageProjects) {
    const card = template.content.cloneNode(true);
    card.querySelector(".case-id").textContent = `#${project.id}`;
    card.querySelector("h3").textContent = shortTitle(project.title) || project.repoName;
    card.querySelector(".project-category").textContent = project.category || "未分類";
    card.querySelector(".project-description").textContent = project.description || "提供清楚的工作流程、資料管理與互動操作展示。";
    const primaryUserDd = card.querySelector(".project-primary-user");
    primaryUserDd.textContent = "";
    for (const role of String(project.primaryUser || "部門使用者與主管").split(/[、,，/／·]/).map((s) => s.trim()).filter(Boolean)) {
      const chip = document.createElement("span");
      chip.textContent = role;
      primaryUserDd.append(chip);
    }
    card.querySelector(".project-business-situation").textContent = project.businessSituation || project.description;
    card.querySelector(".project-daily-use").textContent = project.dailyUse || "用於日常資料確認、異常處理與進度追蹤。";
    const metrics = card.querySelector(".project-metrics");
    for (const metric of project.operationalMetrics || []) {
      const chip = document.createElement("span");
      chip.textContent = metric;
      metrics.append(chip);
    }
    /* 模板複製：直接連到那一套的修改頁。沒有挑選狀態要維護，換頁重建卡片
       也不會掉東西——這正是拿掉購物車之後省下來的一整類問題。 */
    const copyLink = card.querySelector(".copy-link");
    if (copyLink) copyLink.href = `customize?repo=${encodeURIComponent(project.repoName)}`;

    const detailUrl = `project?repo=${encodeURIComponent(project.repoName)}`;
    const fullScenario = project.contentDepth === "full-scenario";
    // 自由操作 → 直接進實際 demo
    const demo = card.querySelector(".demo-link");
    demo.href = project.demoUrl ? `${project.demoUrl}${fullScenario ? "?mode=free" : ""}` : "#";
    demo.textContent = "開啟 Demo";
    if (!project.demoUrl) demo.setAttribute("aria-disabled", "true");
    // 3 分鐘總覽 → 專案介紹頁（Tab 版），全部專案都有
    const guided = card.querySelector(".guided-link");
    guided.hidden = false;
    guided.href = detailUrl;
    // 卡片縮圖 → 專案介紹頁
    const preview = card.querySelector(".system-preview");
    const title = project.title || project.repoName;
    preview.href = detailUrl;
    preview.setAttribute("aria-label", `${shortTitle(title)} 專案總覽`);
    preview.innerHTML = cardHeroHTML(project);
    fragment.append(card);
  }
  /* 對話框觸發要在 fragment 階段綁——附加模式下對整個 grid 重綁會讓舊卡片疊加監聽 */
  fragment.querySelectorAll(".project-practical-detail").forEach(detail => {
    detail.querySelector(".project-use-trigger")?.addEventListener("click", () => {
      const card = detail.closest(".project-card");
      projectUseDialogTitle.textContent = card.querySelector("h3")?.textContent || "專案實際用途";
      projectUseDialogContent.replaceChildren(detail.querySelector(".practical-detail-body").cloneNode(true));
      projectUseDialog.showModal();
    });
  });
  grid.append(fragment);
  setupCardEmbeds();
  document.querySelector("#resultSummary").textContent = state.filtered.length
    ? `找到 ${state.filtered.length} 個專案，第 ${state.page} / ${pages} 頁。`
    : "找到 0 個專案。";
  renderPagination(pages);
}

/* 事件委派綁在 grid 上、只綁一次：卡片每次換頁都會重建，逐張綁會越疊越多。 */
function goPage(target) {
  const pages = Math.max(1, Math.ceil(state.filtered.length / PAGE_SIZE));
  const next = Math.min(Math.max(1, target), pages);
  if (next === state.page) return;
  state.page = next;
  renderProjects();
  syncUrl();
  // 換頁後把視角拉回結果區頂端，不然人還停在上一頁的頁尾
  const summary = document.querySelector("#resultSummary");
  if (summary) window.scrollTo({ top: summary.getBoundingClientRect().top + window.scrollY - 90, behavior: "auto" });
}

/* 頁碼列：首尾各兩頁＋目前頁前後各一頁，中間以 … 略過。 */
function renderPagination(pages) {
  if (!pagination) return; // 舊版備份頁沒有頁碼容器，別讓它整頁炸掉
  pagination.innerHTML = "";
  if (pages <= 1) return;
  const btn = (label, target, { current = false, disabled = false, aria } = {}) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    if (aria) b.setAttribute("aria-label", aria);
    if (current) b.setAttribute("aria-current", "page");
    b.disabled = disabled;
    b.addEventListener("click", () => goPage(target));
    return b;
  };
  const gap = () => { const s = document.createElement("span"); s.className = "jv-page-gap"; s.textContent = "…"; return s; };
  pagination.append(btn("‹", state.page - 1, { disabled: state.page === 1, aria: "上一頁" }));
  const want = new Set([1, 2, pages - 1, pages, state.page - 2, state.page - 1, state.page, state.page + 1, state.page + 2]);
  let prev = 0;
  for (let p = 1; p <= pages; p += 1) {
    if (!want.has(p)) continue;
    if (p - prev > 1) pagination.append(gap());
    pagination.append(btn(String(p), p, { current: p === state.page }));
    prev = p;
  }
  pagination.append(btn("›", state.page + 1, { disabled: state.page === pages, aria: "下一頁" }));
}

function renderSuggestions() {
  const query = normalize(state.query);
  if (!query) { suggestions.hidden = true; searchInput.setAttribute("aria-expanded", "false"); return; }
  const matches = state.projects
    .map((project) => ({ project, score: relevance(project, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(a.project.id) - Number(b.project.id))
    .slice(0, 7);
  suggestions.innerHTML = "";
  state.suggestionIndex = -1;
  if (!matches.length) { suggestions.hidden = true; searchInput.setAttribute("aria-expanded", "false"); return; }
  matches.forEach(({ project }, index) => {
    const option = document.createElement("button");
    option.type = "button";
    option.id = `suggestion-${index}`;
    option.setAttribute("role", "option");
    option.innerHTML = `<span class="sug-title">${shortTitle(project.title || project.repoName)}</span>`;
    option.addEventListener("mousedown", (event) => event.preventDefault());
    option.addEventListener("click", () => {
      state.query = project.title || project.repoName;
      searchInput.value = state.query;
      suggestions.hidden = true;
      applyFilters();
      searchInput.focus();
    });
    suggestions.append(option);
  });
  suggestions.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

/* keepPage：初次載入從網址帶回 ?page= 時不可歸零；使用者改條件時一律回第 1 頁 */
function applyFilters({ updateSuggestions = true, keepPage = false } = {}) {
  const query = normalize(state.query);
  state.filtered = state.projects.filter((project) => {
    const queryMatch = !query || relevance(project, query) > 0;
    const categoryMatch = !state.category || project.category === state.category;
    return queryMatch && categoryMatch;
  });
  state.filtered.sort((a, b) => {
    /* 新的在前。同一天上架的用編號決定先後，順序才不會每次載入都不一樣。 */
    if (state.sort === "newest") return addedTime(b) - addedTime(a) || Number(b.id) - Number(a.id);
    /* 最近熱門：只算統計窗內的瀏覽，新上架的才有機會冒出來。
       沒人看過的一律 0，用編號決定先後才不會亂跳。 */
    if (state.sort === "popular") return viewsOf(b) - viewsOf(a) || Number(b.id) - Number(a.id);
    if (state.sort === "title") return String(a.title).localeCompare(String(b.title), "zh-Hant");
    if (state.sort === "id") return (a.catalogSequence || 0) - (b.catalogSequence || 0);
    return relevance(b, query) - relevance(a, query) || Number(a.id) - Number(b.id);
  });
  if (!keepPage) state.page = 1;
  renderActiveFilters();
  renderProjects();
  if (updateSuggestions) renderSuggestions();
  syncUrl();
}

function resetFilters() {
  state.query = "";
  state.category = "";
  state.sort = DEFAULT_SORT;
  state.sortExplicit = false;
  searchInput.value = "";
  categorySelect.value = "";
  sortSelect.value = DEFAULT_SORT;
  suggestions.hidden = true;
  applyFilters({ updateSuggestions: false });
}

function handleSearchKeys(event) {
  const options = [...suggestions.querySelectorAll('[role="option"]')];
  if (event.key === "Escape") { suggestions.hidden = true; searchInput.setAttribute("aria-expanded", "false"); return; }
  if (!options.length || suggestions.hidden) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    state.suggestionIndex = event.key === "ArrowDown" ? (state.suggestionIndex + 1) % options.length : (state.suggestionIndex - 1 + options.length) % options.length;
    options.forEach((option, index) => option.classList.toggle("active", index === state.suggestionIndex));
    searchInput.setAttribute("aria-activedescendant", options[state.suggestionIndex].id);
  }
  if (event.key === "Enter" && state.suggestionIndex >= 0) {
    event.preventDefault();
    options[state.suggestionIndex].click();
  }
}

function animateCount(element, target) {
  if (!element) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = target;
    return;
  }
  const duration = 1100;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 4;
    element.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function setupHomepageMotion() {
  const revealSections = document.querySelectorAll(".reveal-section");
  if (!("IntersectionObserver" in window)) {
    revealSections.forEach((section) => section.classList.add("is-inview"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-inview");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    revealSections.forEach((section) => observer.observe(section));
  }

  const visual = document.querySelector("#heroVisual");
  const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!visual || !motionAllowed || !window.matchMedia("(min-width: 1121px)").matches) return;
  visual.addEventListener("pointermove", (event) => {
    const bounds = visual.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    visual.style.setProperty("--rx", `${y * -5}deg`);
    visual.style.setProperty("--ry", `${x * 7}deg`);
  });
  visual.addEventListener("pointerleave", () => {
    visual.style.setProperty("--rx", "0deg");
    visual.style.setProperty("--ry", "0deg");
  });
}

async function boot() {
  /* 先拿精簡索引：完整的 projects-index.json 帶著詳細頁才用得到的欄位，
     customerWorkflow 一個就佔 21%，而這一頁只是列表與搜尋。實測那個檔是目錄頁
     最大的單一資源（傳輸 429 KB）。精簡版讀不到就退回完整版——目錄頁能不能開，
     不該取決於一個為了加速而生的衍生檔。 */
  /* 排序用的統計跟索引並行拿，不要串著等。它只影響「最新上架／最多人看」
     兩個排序，晚幾百毫秒到都沒關係，但讓它排在索引後面就是白多等一趟。 */
  const statsReady = loadSortStats();

  let response = await fetch("./content/catalog-index.json").catch(() => null);
  if (!response || !response.ok) response = await fetch("./projects-index.json?v=20260730-2");
  if (!response.ok) throw new Error("專案索引無法讀取");
  const index = await response.json();
  state.projects = index.projects
    .map((project, sequence) => ({ ...project, catalogSequence: sequence + 1 }))
    .filter((project) => !["draft", "archived"].includes(project.status));
  addOptions(categorySelect, [...new Set(state.projects.map((project) => project.category || "未分類"))].sort((a, b) => a.localeCompare(b, "zh-Hant")).map((value) => [value, value]));
  hydrateFromUrl();
  const totalEl = document.querySelector("#totalProjects");
  if (totalEl) animateCount(totalEl, state.projects.length);
  const footerEl = document.querySelector("#footerStats");
  if (footerEl) footerEl.textContent = `${state.projects.length} 個展示專案`;
  syncSortUi();
  renderQuickFilters();
  renderCatalogStats();
  applyFilters({ updateSuggestions: false, keepPage: true });

  /* 統計晚一步到的話，重畫一次。使用者可能是帶著 ?sort=popular 的網址進來的，
     那時第一次排序拿到的還是空的統計，看起來就像排序沒作用。 */
  await statsReady;
  if (state.sort === "newest" || state.sort === "popular") {
    applyFilters({ updateSuggestions: false, keepPage: true });
  }
}

function syncSortUi() {
  sortSelect.value = state.sort;
  /* 自訂下拉是另一份 DOM，不同步的話畫面會顯示舊的選項名。 */
  const label = document.querySelector("#sortLabel");
  const opt = document.querySelector(`.sort-opt[data-value="${state.sort}"]`);
  if (label && opt) label.textContent = opt.dataset.label;
  document.querySelectorAll(".sort-opt").forEach((b) => {
    b.setAttribute("aria-selected", String(b.dataset.value === state.sort));
  });
}

/* 打字搜尋時，「最新上架」會把最貼近的結果排到後面去。使用者沒自己挑過排序的話
   就切到相關性，清空搜尋再切回來——並且同步下拉選單，讓他看得到排序變了，
   而不是暗著改。 */
function autoSort() {
  if (state.sortExplicit) return;
  const want = state.query.trim() ? "relevance" : DEFAULT_SORT;
  if (state.sort === want) return;
  state.sort = want;
  syncSortUi();
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  autoSort();
  applyFilters();
});
searchInput.addEventListener("keydown", handleSearchKeys);
searchInput.addEventListener("focus", renderSuggestions);
searchInput.addEventListener("blur", () => setTimeout(() => { suggestions.hidden = true; searchInput.setAttribute("aria-expanded", "false"); }, 120));
categorySelect.addEventListener("change", (event) => { state.category = event.target.value; applyFilters(); });
sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  state.sortExplicit = true;
  applyFilters({ updateSuggestions: false });
});
clearFilters.addEventListener("click", resetFilters);
catalogStatsBody.addEventListener("click", (event) => {
  const action = event.target.closest("button[data-category]");
  if (!action) return;
  selectCategory(action.dataset.category, { scrollToResults: true });
});
document.querySelector("#focusSearch")?.addEventListener("click", () => searchInput.focus());
document.querySelector("#heroSearch")?.addEventListener("click", () => {
  document.querySelector(".search-panel").scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => searchInput.focus(), 450);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && !/input|textarea|select/i.test(document.activeElement?.tagName || "")) {
    event.preventDefault();
    searchInput.focus();
  }
});

setupHomepageMotion();
boot().catch((error) => {
  document.querySelector("#resultSummary").textContent = error.message;
  grid.innerHTML = "<article class='empty-state'><h3>無法載入專案索引</h3><p>請確認 projects-index.json 可由網站讀取。</p></article>";
});
