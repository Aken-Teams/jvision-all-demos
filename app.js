const state = {
  projects: [],
  filtered: [],
  category: "",
  query: "",
};

const grid = document.querySelector("#projectGrid");
const template = document.querySelector("#projectCardTemplate");
const searchInput = document.querySelector("#searchInput");
const categorySelect = document.querySelector("#categorySelect");
const categoryStrip = document.querySelector("#categoryStrip");

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function projectText(project) {
  return normalize([
    project.id,
    project.title,
    project.category,
    project.industry,
    project.repoName,
    project.demoUrl,
    project.githubUrl,
  ].join(" "));
}

function categoryLabel(project) {
  return project.category || project.industry || "未分類";
}

function renderStats(index) {
  const categories = new Set(state.projects.map(categoryLabel));
  document.querySelector("#totalProjects").textContent = index.total || state.projects.length;
  document.querySelector("#statTotal").textContent = state.projects.length;
  document.querySelector("#statCategories").textContent = categories.size;
  document.querySelector("#statGithub").textContent = state.projects.filter((p) => p.githubUrl).length;
  document.querySelector("#statDemo").textContent = state.projects.filter((p) => p.demoUrl).length;
}

function renderCategoryControls() {
  const categories = [...new Set(state.projects.map(categoryLabel))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  }

  const topCategories = categories
    .map((category) => ({
      category,
      count: state.projects.filter((project) => categoryLabel(project) === category).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const allButton = document.createElement("button");
  allButton.textContent = "全部";
  allButton.className = "active";
  allButton.addEventListener("click", () => setCategory(""));
  categoryStrip.append(allButton);

  for (const item of topCategories) {
    const button = document.createElement("button");
    button.textContent = `${item.category} ${item.count}`;
    button.addEventListener("click", () => setCategory(item.category));
    categoryStrip.append(button);
  }
}

function setCategory(category) {
  state.category = category;
  categorySelect.value = category;
  for (const button of categoryStrip.querySelectorAll("button")) {
    button.classList.toggle(
      "active",
      (category === "" && button.textContent === "全部") || button.textContent.startsWith(category),
    );
  }
  filterProjects();
}

function filterProjects() {
  const query = normalize(state.query);
  state.filtered = state.projects.filter((project) => {
    const categoryMatch = !state.category || categoryLabel(project) === state.category;
    const queryMatch = !query || projectText(project).includes(query);
    return categoryMatch && queryMatch;
  });
  renderProjects();
}

function renderProjects() {
  grid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const project of state.filtered) {
    const card = template.content.cloneNode(true);
    card.querySelector(".badge").textContent = categoryLabel(project);
    card.querySelector(".case-id").textContent = `#${project.id}`;
    card.querySelector("h3").textContent = project.title || project.repoName;
    card.querySelector(".project-meta").textContent =
      project.industry && project.industry !== project.category
        ? `${project.category || "AI CASE"} · ${project.industry}`
        : project.category || "AI CASE";
    card.querySelector(".project-path").textContent = project.localPath || project.repoName;
    card.querySelector(".demo-link").href = project.demoUrl || "#";
    card.querySelector(".repo-link").href = project.githubUrl || "#";
    fragment.append(card);
  }

  if (!state.filtered.length) {
    const empty = document.createElement("article");
    empty.className = "project-card";
    empty.innerHTML = "<h3>沒有找到符合條件的專案</h3><p class='project-meta'>換個關鍵字或分類試試。</p>";
    fragment.append(empty);
  }

  grid.append(fragment);
}

async function boot() {
  const response = await fetch("./projects-index.json");
  const index = await response.json();
  state.projects = [...index.projects].sort((a, b) => Number(a.id) - Number(b.id));
  state.filtered = state.projects;
  renderStats(index);
  renderCategoryControls();
  renderProjects();
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  filterProjects();
});

categorySelect.addEventListener("change", (event) => {
  setCategory(event.target.value);
});

boot().catch((error) => {
  console.error(error);
  grid.innerHTML = "<article class='project-card'><h3>載入失敗</h3><p class='project-meta'>projects-index.json 無法讀取。</p></article>";
});
