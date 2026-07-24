const expertState = {
  reviews: [],
  filtered: [],
  visible: 24,
  thumbnails: new Map(),
};

const expertGrid = document.querySelector("#agentReviewGrid");
const expertTemplate = document.querySelector("#agentReviewTemplate");
const expertSearch = document.querySelector("#agentSearch");
const expertCategory = document.querySelector("#agentCategory");
const expertGrade = document.querySelector("#agentGrade");
const expertPriority = document.querySelector("#agentPriority");
const expertLoadMore = document.querySelector("#agentLoadMore");

function normalizeAgentText(value) {
  return String(value || "").toLocaleLowerCase("zh-Hant");
}

function priorityLabel(priority) {
  return { critical: "Critical", high: "High", medium: "Medium", low: "Low" }[priority] || priority;
}

function recommendationSummary(review) {
  const top = review.recommendations[0];
  if (!top) return "基線稽核已通過，建議邀請領域使用者確認真實業務流程。";
  return `${priorityLabel(top.priority)}｜${top.title}：${top.suggestion}`;
}

function renderAgentSummary(report) {
  const { summary } = report;
  document.querySelector("#agentProjectCount").textContent = summary.totalProjects;
  document.querySelector("#agentAverageScore").textContent = `${summary.averageScore}`;
  document.querySelector("#agentPriorityCount").textContent = summary.priorityImprovement;
  document.querySelector("#agentSafeFixes").textContent = summary.safeFixesApplied.generatedBriefs;
  document.querySelector("#reportMetadata").textContent = `最後分析：${new Date(report.generatedAt).toLocaleString("zh-TW")}｜${report.agent.policy}`;
}

function detailMarkup(review) {
  const capabilities = review.requiredCapabilities.map((capability) => `<li>${capability}</li>`).join("");
  const recommendations = review.recommendations.length
    ? review.recommendations.map((item) => `
      <li class="recommendation-item" data-priority="${item.priority}">
        <span>${priorityLabel(item.priority)}</span>
        <div><strong>${item.title}</strong><p>${item.suggestion}</p><small>偵測證據：${item.evidence}</small></div>
      </li>`).join("")
    : "<li class='recommendation-item is-clear'><div><strong>目前基線通過</strong><p>可進行使用者驗收與領域規則檢查。</p></div></li>";
  return `
    <div class="detail-section"><h4>此類型系統應具備</h4><ul>${capabilities}</ul></div>
    <div class="detail-section"><h4>Agent 改善建議</h4><ul class="recommendation-list">${recommendations}</ul></div>
  `;
}

function renderAgentReviews() {
  expertGrid.innerHTML = "";
  const visibleReviews = expertState.filtered.slice(0, expertState.visible);
  document.querySelector("#agentResultCount").textContent = `顯示 ${visibleReviews.length} / ${expertState.filtered.length} 個專案`;

  if (!visibleReviews.length) {
    expertGrid.innerHTML = "<article class='agent-empty'><h3>沒有符合的審視結果</h3><p>調整搜尋文字或篩選條件後再試一次。</p></article>";
  }

  for (const review of visibleReviews) {
    const card = expertTemplate.content.cloneNode(true);
    const cardRoot = card.querySelector(".agent-review-card");
    cardRoot.dataset.grade = review.grade;
    card.querySelector(".review-category").textContent = review.category;
    card.querySelector(".review-grade").textContent = review.grade;
    card.querySelector(".review-grade").dataset.grade = review.grade;
    card.querySelector(".review-id").textContent = `#${review.id} · ${review.repoName}`;
    card.querySelector("h3").textContent = review.title;
    card.querySelector(".review-score strong").textContent = review.score;
    card.querySelector(".review-meter i").style.width = `${review.score}%`;
    card.querySelector(".review-summary").textContent = recommendationSummary(review);
    const demo = card.querySelector(".review-demo");
    demo.href = review.demoUrl || "./index.html";
    const preview = card.querySelector(".review-preview");
    const previewImage = preview.querySelector("img");
    const thumbnail = expertState.thumbnails.get(review.repoName);
    preview.href = demo.href;
    preview.setAttribute("aria-label", `開啟 ${review.title} Demo 運行畫面`);
    if (thumbnail) {
      previewImage.src = `./${thumbnail}`;
      previewImage.alt = `${review.title} Demo 實際運行畫面`;
      previewImage.addEventListener("error", () => {
        preview.classList.add("is-unavailable");
        previewImage.alt = "";
      }, { once: true });
    } else {
      preview.classList.add("is-unavailable");
    }
    const expand = card.querySelector(".review-expand");
    const detail = card.querySelector(".review-detail");
    detail.innerHTML = detailMarkup(review);
    expand.addEventListener("click", () => {
      const nextState = detail.hidden;
      detail.hidden = !nextState;
      expand.setAttribute("aria-expanded", String(nextState));
      expand.textContent = nextState ? "收合建議" : "查看建議";
    });
    expertGrid.append(card);
  }

  expertLoadMore.hidden = expertState.visible >= expertState.filtered.length;
}

function filterAgentReviews() {
  const query = normalizeAgentText(expertSearch.value).trim();
  const category = expertCategory.value;
  const grade = expertGrade.value;
  const priority = expertPriority.value;
  expertState.visible = 24;
  expertState.filtered = expertState.reviews.filter((review) => {
    const matchesQuery = !query || normalizeAgentText([
      review.title,
      review.repoName,
      review.category,
      ...review.recommendations.flatMap((item) => [item.title, item.suggestion, item.evidence]),
    ].join(" ")).includes(query);
    const matchesCategory = !category || review.category === category;
    const matchesGrade = !grade || review.grade === grade;
    const matchesPriority = !priority || review.recommendations.some((item) => item.priority === priority);
    return matchesQuery && matchesCategory && matchesGrade && matchesPriority;
  });
  renderAgentReviews();
}

function fillAgentCategories() {
  const categories = [...new Set(expertState.reviews.map((review) => review.category))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    expertCategory.append(option);
  }
}

async function copyAgentCommand() {
  const command = "npm run agent:project-expert:apply-safe";
  const status = document.querySelector("#copyStatus");
  try {
    await navigator.clipboard.writeText(command);
    status.textContent = `已複製：${command}`;
  } catch {
    status.textContent = `請在專案根目錄執行：${command}`;
  }
}

async function bootProjectExpert() {
  const [response, thumbnailResponse] = await Promise.all([
    fetch("./docs/PROJECT_EXPERT_AGENT_REPORT.json", { cache: "no-store" }),
    fetch("./assets/demo-screenshots/manifest.json", { cache: "no-store" }),
  ]);
  if (!response.ok) throw new Error("Agent 報告尚未產生");
  const report = await response.json();
  const thumbnailManifest = thumbnailResponse.ok ? await thumbnailResponse.json() : { items: [] };
  expertState.thumbnails = new Map(thumbnailManifest.items.map((item) => [item.repoName, item.thumbnail]));
  expertState.reviews = [...report.reviews].sort((a, b) => a.score - b.score || a.id - b.id);
  expertState.filtered = expertState.reviews;
  renderAgentSummary(report);
  fillAgentCategories();
  renderAgentReviews();
}

for (const control of [expertSearch, expertCategory, expertGrade, expertPriority]) {
  control.addEventListener(control === expertSearch ? "input" : "change", filterAgentReviews);
}
expertLoadMore.addEventListener("click", () => {
  expertState.visible += 24;
  renderAgentReviews();
});
document.querySelector("#copyAgentCommand").addEventListener("click", copyAgentCommand);

bootProjectExpert().catch((error) => {
  document.querySelector("#reportMetadata").textContent = error.message;
  expertGrid.innerHTML = "<article class='agent-empty'><h3>Agent 報告尚未準備完成</h3><p>請於專案根目錄執行 npm run agent:project-expert:apply-safe，完成後重新整理此頁。</p></article>";
});
