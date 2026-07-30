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

function renderQuickFilters() {
  quickFilters.innerHTML = "";
  const categories = [...new Set(state.projects.map((project) => project.category || "未分類"))]
    .map((category) => ({ category, count: state.projects.filter((project) => (project.category || "未分類") === category).length }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, "zh-Hant"))
    .slice(0, 10);
  const all = document.createElement("button");
  all.type = "button";
  all.textContent = "全部專案";
  all.dataset.category = "";
  quickFilters.append(all);
  for (const item of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${item.category} · ${item.count}`;
    button.dataset.category = item.category;
    quickFilters.append(button);
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
    card.querySelector("h3").textContent = project.title || project.repoName;
    card.querySelector(".project-category").textContent = project.category || "未分類";
    card.querySelector(".project-description").textContent = project.description || "提供清楚的工作流程、資料管理與互動操作展示。";
    card.querySelector(".project-primary-user").textContent = project.primaryUser || "部門使用者與主管";
    card.querySelector(".project-business-situation").textContent = project.businessSituation || project.description;
    card.querySelector(".project-daily-use").textContent = project.dailyUse || "用於日常資料確認、異常處理與進度追蹤。";
    const metrics = card.querySelector(".project-metrics");
    for (const metric of project.operationalMetrics || []) {
      const chip = document.createElement("span");
      chip.textContent = metric;
      metrics.append(chip);
    }
    const demo = card.querySelector(".demo-link");
    const fullScenario = project.contentDepth === "full-scenario";
    demo.href = project.demoUrl ? `${project.demoUrl}${fullScenario ? "?mode=free" : ""}` : "#";
    demo.textContent = fullScenario ? "自由操作" : "開啟 Demo";
    if (!project.demoUrl) demo.setAttribute("aria-disabled", "true");
    const guided = card.querySelector(".guided-link");
    guided.hidden = !fullScenario;
    guided.href = project.demoUrl ? `${project.demoUrl}?mode=guided` : "#";
    if (!project.demoUrl) guided.setAttribute("aria-disabled", "true");
    const preview = card.querySelector(".system-preview");
    const previewImage = card.querySelector(".system-preview-image");
    const title = project.title || project.repoName;
    preview.href = project.demoUrl || "#";
    preview.setAttribute("aria-label", `開啟 ${title} Demo`);
    if (!project.demoUrl) preview.setAttribute("aria-disabled", "true");
    previewImage.src = thumbnailUrl(project);
    previewImage.alt = `${title} 系統運行畫面`;
    previewImage.loading = index < 6 ? "eager" : "lazy";
    previewImage.fetchPriority = index < 3 ? "high" : "low";
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
    option.innerHTML = `<strong>${project.title || project.repoName}</strong><span>#${project.id} · ${project.category || "未分類"} · ${project.repoName}</span>`;
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
    if (state.sort === "id") return Number(a.id) - Number(b.id);
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
  animateCount(document.querySelector("#totalProjects"), state.projects.length);
  document.querySelector("#footerStats").textContent = `${state.projects.length} 個展示專案`;
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
document.querySelector("#focusSearch").addEventListener("click", () => searchInput.focus());
document.querySelector("#heroSearch").addEventListener("click", () => {
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
