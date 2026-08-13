const state = {
  projects: [],
  filtered: [],
  query: "",
  category: "",
  sort: "relevance",
  visible: 24,
  suggestionIndex: -1,
};

const grid = document.querySelector("#projectGrid");
const template = document.querySelector("#projectCardTemplate");
const searchInput = document.querySelector("#searchInput");
const suggestions = document.querySelector("#searchSuggestions");
const categorySelect = document.querySelector("#categorySelect");
const sortSelect = document.querySelector("#sortSelect");
const quickFilters = document.querySelector("#quickFilters");
const clearFilters = document.querySelector("#clearFilters");
const loadMore = document.querySelector("#loadMore");
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
  state.sort = params.get("sort") || "relevance";
  searchInput.value = state.query;
  categorySelect.value = state.category;
  sortSelect.value = state.sort;
}

function syncUrl() {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category) params.set("category", state.category);
  if (state.sort !== "relevance") params.set("sort", state.sort);
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
      <iframe class="jv-card-frame" title="${title} 系統畫面" loading="lazy" scrolling="no" style="border:0;width:1440px;height:900px;transform-origin:top left;pointer-events:none;opacity:0;transition:opacity .35s"></iframe>
      <span class="case-id hidden">#${project.id}</span>
    </div>`;
}

/* 卡片 live demo：捲到才載入 + 縮放；resize 重算（只綁一次） */
function scaleCardEmbed(wrap) {
  const f = wrap.querySelector(".jv-card-frame"); if (!f) return;
  const w = wrap.clientWidth; if (!w) return;
  f.style.transform = "scale(" + (w / 1440) + ")";
}
let _cardIO = null, _cardResizeBound = false;
function setupCardEmbeds() {
  if (!_cardIO) {
    _cardIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const wrap = en.target, f = wrap.querySelector(".jv-card-frame");
        if (f && !f.src && wrap.dataset.src) {
          f.addEventListener("load", () => { scaleCardEmbed(wrap); f.style.opacity = "1"; const ph = wrap.querySelector(".jv-card-ph"); if (ph) ph.style.display = "none"; }, { once: true });
          f.src = wrap.dataset.src;
          scaleCardEmbed(wrap);
        }
        _cardIO.unobserve(wrap);
      });
    }, { rootMargin: "300px" });
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
  clearFilters.disabled = !entries.length && state.sort === "relevance";
  for (const button of quickFilters.querySelectorAll("button")) {
    button.classList.toggle("active", button.dataset.category === state.category);
  }
}

function renderProjects() {
  grid.innerHTML = "";
  const visibleProjects = state.filtered.slice(0, state.visible);
  if (!visibleProjects.length) {
    grid.innerHTML = `<article class="empty-state"><h3>沒有符合條件的專案</h3><p>請改用產業名稱、功能名稱或案例編號搜尋。</p><button type="button" id="emptyClear">清除所有篩選</button></article>`;
    document.querySelector("#emptyClear")?.addEventListener("click", resetFilters);
  }
  const fragment = document.createDocumentFragment();
  for (const [index, project] of visibleProjects.entries()) {
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
  grid.append(fragment);
  grid.querySelectorAll(".project-practical-detail").forEach(detail => {
    detail.querySelector(".project-use-trigger")?.addEventListener("click", () => {
      const card = detail.closest(".project-card");
      projectUseDialogTitle.textContent = card.querySelector("h3")?.textContent || "專案實際用途";
      projectUseDialogContent.replaceChildren(detail.querySelector(".practical-detail-body").cloneNode(true));
      projectUseDialog.showModal();
    });
  });
  setupCardEmbeds();
  document.querySelector("#resultSummary").textContent = `找到 ${state.filtered.length} 個專案，目前顯示 ${visibleProjects.length} 個。`;
  loadMore.hidden = state.visible >= state.filtered.length || !state.filtered.length;
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

function applyFilters({ updateSuggestions = true } = {}) {
  const query = normalize(state.query);
  state.filtered = state.projects.filter((project) => {
    const queryMatch = !query || relevance(project, query) > 0;
    const categoryMatch = !state.category || project.category === state.category;
    return queryMatch && categoryMatch;
  });
  state.filtered.sort((a, b) => {
    if (state.sort === "title") return String(a.title).localeCompare(String(b.title), "zh-Hant");
    if (state.sort === "id") return (a.catalogSequence || 0) - (b.catalogSequence || 0);
    return relevance(b, query) - relevance(a, query) || Number(a.id) - Number(b.id);
  });
  state.visible = 24;
  renderActiveFilters();
  renderProjects();
  if (updateSuggestions) renderSuggestions();
  syncUrl();
}

function resetFilters() {
  state.query = "";
  state.category = "";
  state.sort = "relevance";
  searchInput.value = "";
  categorySelect.value = "";
  sortSelect.value = "relevance";
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
  const response = await fetch("./projects-index.json?v=20260730-2");
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
  renderQuickFilters();
  renderCatalogStats();
  applyFilters({ updateSuggestions: false });
}

searchInput.addEventListener("input", (event) => { state.query = event.target.value; applyFilters(); });
searchInput.addEventListener("keydown", handleSearchKeys);
searchInput.addEventListener("focus", renderSuggestions);
searchInput.addEventListener("blur", () => setTimeout(() => { suggestions.hidden = true; searchInput.setAttribute("aria-expanded", "false"); }, 120));
categorySelect.addEventListener("change", (event) => { state.category = event.target.value; applyFilters(); });
sortSelect.addEventListener("change", (event) => { state.sort = event.target.value; applyFilters({ updateSuggestions: false }); });
clearFilters.addEventListener("click", resetFilters);
loadMore.addEventListener("click", () => { state.visible += 24; renderProjects(); });
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
