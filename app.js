const state = {
  projects: [],
  filtered: [],
  query: "",
  category: "",
  source: "",
  runtime: "",
  github: "",
  sort: "relevance",
  visible: 24,
  suggestionIndex: -1,
};

const grid = document.querySelector("#projectGrid");
const template = document.querySelector("#projectCardTemplate");
const searchInput = document.querySelector("#searchInput");
const suggestions = document.querySelector("#searchSuggestions");
const categorySelect = document.querySelector("#categorySelect");
const sourceSelect = document.querySelector("#sourceSelect");
const runtimeSelect = document.querySelector("#runtimeSelect");
const githubSelect = document.querySelector("#githubSelect");
const sortSelect = document.querySelector("#sortSelect");
const quickFilters = document.querySelector("#quickFilters");
const clearFilters = document.querySelector("#clearFilters");
const loadMore = document.querySelector("#loadMore");

const sourceLabels = {
  "legacy-jvision": "JV 整合專案",
  "ai-case": "AI 產業案例",
  "smart-manufacturing": "智慧製造系統",
  "jv-integrated": "JV 整合專案",
};

function normalize(value) {
  return String(value || "").toLocaleLowerCase("zh-Hant").trim();
}

function runtimeLabel(project) {
  return project.runtime === "nextjs" ? "Next.js" : project.runtime === "static" ? "Static" : project.runtime || "Web";
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
    project.category,
    project.industry,
    project.repoName,
    project.localPath,
    sourceLabel(project),
    runtimeLabel(project),
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
  state.source = params.get("source") || "";
  state.runtime = params.get("runtime") || "";
  state.github = params.get("github") || "";
  state.sort = params.get("sort") || "relevance";
  searchInput.value = state.query;
  categorySelect.value = state.category;
  sourceSelect.value = state.source;
  runtimeSelect.value = state.runtime;
  githubSelect.value = state.github;
  sortSelect.value = state.sort;
}

function syncUrl() {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category) params.set("category", state.category);
  if (state.source) params.set("source", state.source);
  if (state.runtime) params.set("runtime", state.runtime);
  if (state.github) params.set("github", state.github);
  if (state.sort !== "relevance") params.set("sort", state.sort);
  const query = params.toString();
  history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
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
    state.category = button.dataset.category;
    categorySelect.value = state.category;
    applyFilters();
  });
}

function renderActiveFilters() {
  const entries = [
    ["關鍵字", state.query, () => { state.query = ""; searchInput.value = ""; }],
    ["產業", state.category, () => { state.category = ""; categorySelect.value = ""; }],
    ["來源", state.source ? sourceLabels[state.source] || state.source : "", () => { state.source = ""; sourceSelect.value = ""; }],
    ["技術", state.runtime, () => { state.runtime = ""; runtimeSelect.value = ""; }],
    ["GitHub", state.github === "available" ? "有 GitHub" : state.github === "missing" ? "無 GitHub" : "", () => { state.github = ""; githubSelect.value = ""; }],
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
    grid.innerHTML = `<article class="empty-state"><h3>沒有符合條件的專案</h3><p>請改用產業名稱、功能名稱、Repo 或案例編號搜尋。</p><button type="button" id="emptyClear">清除所有篩選</button></article>`;
    document.querySelector("#emptyClear")?.addEventListener("click", resetFilters);
  }
  const fragment = document.createDocumentFragment();
  for (const [index, project] of visibleProjects.entries()) {
    const card = template.content.cloneNode(true);
    card.querySelector(".case-id").textContent = `#${project.id}`;
    card.querySelector(".runtime-badge").textContent = runtimeLabel(project);
    card.querySelector("h3").textContent = project.title || project.repoName;
    card.querySelector(".project-category").textContent = project.category || "未分類";
    card.querySelector(".project-industry").textContent = project.industry || "";
    card.querySelector(".project-source").textContent = sourceLabel(project);
    card.querySelector(".project-repo").textContent = project.repoName;
    const demo = card.querySelector(".demo-link");
    demo.href = project.demoUrl || "#";
    if (!project.demoUrl) demo.setAttribute("aria-disabled", "true");
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
    const repo = card.querySelector(".repo-link");
    if (project.githubUrl) repo.href = project.githubUrl;
    else { repo.removeAttribute("href"); repo.setAttribute("aria-disabled", "true"); repo.textContent = "無 GitHub"; }
    fragment.append(card);
  }
  grid.append(fragment);
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
    const sourceMatch = !state.source || sourceKey(project) === state.source;
    const runtimeMatch = !state.runtime || runtimeLabel(project) === state.runtime;
    const githubMatch = !state.github || (state.github === "available" ? Boolean(project.githubUrl) : !project.githubUrl);
    return queryMatch && categoryMatch && sourceMatch && runtimeMatch && githubMatch;
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
  state.source = "";
  state.runtime = "";
  state.github = "";
  state.sort = "relevance";
  searchInput.value = "";
  categorySelect.value = "";
  sourceSelect.value = "";
  runtimeSelect.value = "";
  githubSelect.value = "";
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

async function boot() {
  const response = await fetch("./projects-index.json");
  if (!response.ok) throw new Error("專案索引無法讀取");
  const index = await response.json();
  state.projects = index.projects.map((project, sequence) => ({ ...project, catalogSequence: sequence + 1 }));
  addOptions(categorySelect, [...new Set(state.projects.map((project) => project.category || "未分類"))].sort((a, b) => a.localeCompare(b, "zh-Hant")).map((value) => [value, value]));
  addOptions(sourceSelect, [...new Set(state.projects.map(sourceKey))].map((value) => [value, sourceLabels[value] || value]));
  addOptions(runtimeSelect, [...new Set(state.projects.map(runtimeLabel))].sort().map((value) => [value, value]));
  hydrateFromUrl();
  document.querySelector("#totalProjects").textContent = state.projects.length;
  document.querySelector("#footerStats").textContent = `${state.projects.length} projects · ${state.projects.filter((project) => project.githubUrl).length} GitHub repos`;
  renderQuickFilters();
  applyFilters({ updateSuggestions: false });
}

searchInput.addEventListener("input", (event) => { state.query = event.target.value; applyFilters(); });
searchInput.addEventListener("keydown", handleSearchKeys);
searchInput.addEventListener("focus", renderSuggestions);
searchInput.addEventListener("blur", () => setTimeout(() => { suggestions.hidden = true; searchInput.setAttribute("aria-expanded", "false"); }, 120));
categorySelect.addEventListener("change", (event) => { state.category = event.target.value; applyFilters(); });
sourceSelect.addEventListener("change", (event) => { state.source = event.target.value; applyFilters(); });
runtimeSelect.addEventListener("change", (event) => { state.runtime = event.target.value; applyFilters(); });
githubSelect.addEventListener("change", (event) => { state.github = event.target.value; applyFilters(); });
sortSelect.addEventListener("change", (event) => { state.sort = event.target.value; applyFilters({ updateSuggestions: false }); });
clearFilters.addEventListener("click", resetFilters);
loadMore.addEventListener("click", () => { state.visible += 24; renderProjects(); });
document.querySelector("#focusSearch").addEventListener("click", () => searchInput.focus());
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && !/input|textarea|select/i.test(document.activeElement?.tagName || "")) {
    event.preventDefault();
    searchInput.focus();
  }
});

boot().catch((error) => {
  document.querySelector("#resultSummary").textContent = error.message;
  grid.innerHTML = "<article class='empty-state'><h3>無法載入專案索引</h3><p>請確認 projects-index.json 可由網站讀取。</p></article>";
});
