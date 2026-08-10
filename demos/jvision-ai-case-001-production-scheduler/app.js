(function industrySystemDemo() {
const config = window.DEMO_CONFIG;
const preset = window.SYSTEM_PRESET;
const storageKey = "jvision-industry-system-" + config.id;
const $ = (selector) => document.querySelector(selector);
let logs = ["系統已載入範例資料，AI 已完成今日營運摘要。"];

function cloneRecords() {
  return JSON.parse(JSON.stringify(config.records));
}

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(saved) ? saved : cloneRecords();
  } catch {
    return cloneRecords();
  }
}

let records = loadRecords();

function saveRecords() {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

function dueDays(value) {
  const match = String(value || "").match(/D\+(\d+)/i);
  return match ? Number(match[1]) : 99;
}

function getStats() {
  const total = records.length;
  const open = records.filter((record) => !record.done).length;
  const done = total - open;
  const highRisk = records.filter((record) => !record.done && record.priority === "high").length;
  const mediumRisk = records.filter((record) => !record.done && record.priority === "medium").length;
  const lowRisk = records.filter((record) => !record.done && record.priority === "low").length;
  const urgent = records.filter((record) => !record.done && dueDays(record.due) <= 3).length;
  const doneRate = total ? Math.round((done / total) * 100) : 0;
  const avgScore = total ? Math.round(records.reduce((sum, record) => sum + Number(record.score || 0), 0) / total) : 0;
  const impactValue = Math.max(18, Math.round((open * 1.8 + highRisk * 3.2 + urgent * 2.4 + avgScore / 8)));
  return { total, open, done, highRisk, mediumRisk, lowRisk, urgent, doneRate, avgScore, impactValue };
}

function generateInsight() {
  const openRecords = records.filter((record) => !record.done).sort((a, b) => b.score - a.score);
  if (!openRecords.length) return "目前所有項目已完成，建議匯出今日摘要，形成下次會議的改善清單。";
  const top = openRecords[0];
  const riskMap = openRecords.reduce((acc, record) => {
    acc[record.risk] = (acc[record.risk] || 0) + 1;
    return acc;
  }, {});
  const mainRisk = Object.entries(riskMap).sort((a, b) => b[1] - a[1])[0];
  const urgent = openRecords.filter((record) => dueDays(record.due) <= 3).length;
  return `AI 建議先處理「${top.title}」，目前 ${mainRisk[0]} 累積 ${mainRisk[1]} 筆，另有 ${urgent} 筆急件。可由 ${top.owner} 先確認資料，再把下一步派給現場負責人。`;
}

function priorityText(value) {
  if (value === "high") return "高風險";
  if (value === "medium") return "中風險";
  return "低風險";
}

function filteredRecords() {
  const keyword = ($("#searchInput")?.value || "").trim().toLowerCase();
  if (!keyword) return records;
  return records.filter((record) => [record.title, record.target, record.owner, record.risk, record.stage].join(" ").toLowerCase().includes(keyword));
}

function renderKpis() {
  const stats = getStats();
  $("#openCount").textContent = stats.open;
  $("#sidebarOpen").textContent = stats.open;
  $("#riskCount").textContent = stats.highRisk;
  $("#doneRate").textContent = `${stats.doneRate}%`;
  $("#impactValue").textContent = `${stats.impactValue}h`;
  $("#queueLabel").textContent = `${stats.total} items`;
  $("#recordCount").textContent = `${filteredRecords().length} shown`;
  $("#aiInsight").textContent = generateInsight();
}

function renderStages() {
  const board = $("#stageBoard");
  board.innerHTML = "";
  const total = Math.max(records.length, 1);
  config.profile.stages.forEach((stage) => {
    const stageRecords = records.filter((record) => record.stage === stage);
    const high = stageRecords.filter((record) => record.priority === "high").length;
    const percent = Math.max(8, Math.round((stageRecords.length / total) * 100));
    const card = document.createElement("article");
    card.className = "stage";
    card.innerHTML = `<strong>${stage}<span>${stageRecords.length}</span></strong><small>高風險 ${high}｜AI 排序 ${percent}%</small><i style="width:${percent}%"></i>`;
    board.append(card);
  });
}

function renderRisks() {
  const stats = getStats();
  const rows = [
    ["高風險", stats.highRisk, "high"],
    ["中風險", stats.mediumRisk, "medium"],
    ["低風險", stats.lowRisk, "low"],
    ["急件", stats.urgent, "urgent"],
  ];
  const max = Math.max(...rows.map((row) => row[1]), 1);
  $("#riskBars").innerHTML = rows.map(([label, count, key]) => {
    const width = Math.max(8, Math.round((count / max) * 100));
    return `<div class="risk-row" data-risk="${key}"><span>${label}</span><div class="risk-track"><i class="risk-fill" style="width:${width}%"></i></div><b>${count}</b></div>`;
  }).join("");
}

function renderTasks() {
  const list = $("#taskList");
  const rows = filteredRecords().sort((a, b) => Number(a.done) - Number(b.done) || b.score - a.score);
  list.innerHTML = "";
  rows.forEach((record) => {
    const card = document.createElement("article");
    card.className = "task-card";
    card.classList.toggle("done", record.done);
    card.innerHTML = `
      <header>
        <h3>${record.title}</h3>
        <span class="pill ${record.priority}">${priorityText(record.priority)}</span>
      </header>
      <p>${record.target}</p>
      <div class="task-meta">
        <span>${config.profile.fields[1]}：${record.due}</span>
        <span>${config.profile.fields[2]}：${record.risk}</span>
        <span>${config.profile.fields[3]}：${record.owner}</span>
        <span>AI 分數：${record.score}</span>
      </div>
      <button type="button" data-id="${record.id}">${record.done ? "改回待辦" : "標記完成"}</button>
    `;
    list.append(card);
  });
}

function renderLogs() {
  $("#logList").innerHTML = logs.slice(0, 6).map((log) => `<p>${log}</p>`).join("");
}

function render() {
  renderKpis();
  renderStages();
  renderRisks();
  renderTasks();
  renderLogs();
}

function addLog(text) {
  logs.unshift(text);
  renderLogs();
}

function runAi() {
  records = records.map((record) => {
    if (record.done) return record;
    const nextScore = Math.min(99, Number(record.score || 50) + Math.floor(Math.random() * 8));
    return { ...record, score: nextScore, priority: nextScore >= 78 ? "high" : nextScore >= 55 ? "medium" : "low" };
  });
  saveRecords();
  addLog(`${preset.primaryAction}完成：系統已更新風險分數與優先順序。`);
  render();
}

document.querySelectorAll("[data-action='run-ai']").forEach((button) => button.addEventListener("click", runAi));

$("[data-action='simulate']").addEventListener("click", () => {
  const target = records.find((record) => !record.done) || records[0];
  if (!target) return;
  records = records.map((record) => record.id === target.id ? { ...record, stage: config.profile.stages[Math.min(2, config.profile.stages.length - 1)] } : record);
  saveRecords();
  addLog(`主管已審核「${target.title}」，狀態推進到下一個流程。`);
  render();
});

$("[data-action='reset']").addEventListener("click", () => {
  records = cloneRecords();
  saveRecords();
  logs = ["已還原範例資料，方便重新展示完整流程。", ...logs];
  render();
});

$("#taskForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const score = 60 + Math.floor(Math.random() * 30);
  const item = {
    id: `${config.id}-${Date.now()}`,
    title: String(form.get("title")).trim(),
    target: String(form.get("target")).trim(),
    owner: config.profile.owner,
    due: "D+3",
    risk: String(form.get("risk")),
    stage: config.profile.stages[0],
    score,
    priority: score >= 78 ? "high" : "medium",
    done: false,
  };
  records.unshift(item);
  event.currentTarget.reset();
  saveRecords();
  addLog(`新增「${item.title}」，AI 已自動放入待處理佇列。`);
  render();
});

$("#taskList").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  const target = records.find((record) => record.id === button.dataset.id);
  records = records.map((record) => record.id === button.dataset.id ? {
    ...record,
    done: !record.done,
    stage: !record.done ? config.profile.stages.at(-1) : config.profile.stages[0],
  } : record);
  saveRecords();
  addLog(`「${target.title}」狀態已更新，統計與 AI 摘要同步刷新。`);
  render();
});

$("#searchInput").addEventListener("input", render);





// JVISION_DISTINCT_FUNCTIONAL_MODULES
function setupDistinctFunctionalModules() {
  const buttons = [...document.querySelectorAll(".module-nav button[data-module]")];
  const workspace = document.querySelector(".workspace");
  const topbar = workspace?.querySelector(":scope > .topbar");
  if (buttons.length < 4 || !workspace || !topbar) return;

  workspace.querySelectorAll(":scope > section:not(.functional-module-view)").forEach((section) => {
    section.hidden = true;
    section.style.display = "none";
  });

  const view = document.createElement("section");
  view.className = "functional-module-view";
  view.setAttribute("aria-live", "polite");
  topbar.insertAdjacentElement("afterend", view);

  const style = document.createElement("style");
  style.textContent = `
    .functional-module-view{display:grid;gap:18px;min-width:0}.fm-hero,.fm-panel,.fm-stat{border:1px solid var(--line,#d8e2ee);background:var(--panel,#fff);border-radius:18px}.fm-hero{padding:24px;display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.fm-kicker{margin:0 0 7px;color:var(--accent,#2563eb);font-size:13px;font-weight:800;letter-spacing:.08em}.fm-hero h2{margin:0;font-size:clamp(24px,3vw,34px)}.fm-description{margin:8px 0 0;color:var(--muted,#64748b);font-size:15px;line-height:1.7}.fm-action{border:0;border-radius:12px;padding:11px 16px;background:var(--accent,#2563eb);color:#fff;font-weight:800;cursor:pointer;white-space:nowrap}.fm-action.secondary{background:transparent;color:var(--accent,#2563eb);border:1px solid currentColor}.fm-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.fm-stat{padding:18px}.fm-stat span{display:block;color:var(--muted,#64748b);font-size:13px}.fm-stat strong{display:block;margin-top:7px;font-size:27px}.fm-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(280px,.6fr);gap:18px}.fm-panel{padding:20px;min-width:0}.fm-panel h3{margin:0 0 15px;font-size:18px}.fm-stages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.fm-stage{padding:15px;border-radius:14px;background:color-mix(in srgb,var(--accent,#2563eb) 7%,transparent);border:1px solid var(--line,#d8e2ee)}.fm-stage b,.fm-stage span{display:block}.fm-stage span{margin-top:6px;color:var(--muted,#64748b);font-size:13px}.fm-list{display:grid;gap:10px}.fm-row{width:100%;text-align:left;padding:14px;border:1px solid var(--line,#d8e2ee);border-radius:13px;background:transparent;color:inherit;cursor:pointer}.fm-row:hover,.fm-row.active{border-color:var(--accent,#2563eb);background:color-mix(in srgb,var(--accent,#2563eb) 7%,transparent)}.fm-row strong,.fm-row small{display:block}.fm-row small{margin-top:5px;color:var(--muted,#64748b)}.fm-toolbar{display:flex;gap:10px;margin-bottom:14px}.fm-toolbar input,.fm-form input,.fm-form select{width:100%;border:1px solid var(--line,#d8e2ee);background:var(--background,#fff);color:inherit;border-radius:11px;padding:11px 12px;font:inherit}.fm-table{width:100%;border-collapse:collapse}.fm-table th,.fm-table td{padding:12px 9px;border-bottom:1px solid var(--line,#d8e2ee);text-align:left;font-size:14px}.fm-table tbody tr{cursor:pointer}.fm-table tbody tr:hover{background:color-mix(in srgb,var(--accent,#2563eb) 6%,transparent)}.fm-badge{display:inline-flex;padding:4px 9px;border-radius:999px;background:color-mix(in srgb,var(--accent,#2563eb) 12%,transparent);font-size:12px;font-weight:800}.fm-detail dl{display:grid;grid-template-columns:auto 1fr;gap:10px 14px}.fm-detail dt{color:var(--muted,#64748b)}.fm-detail dd{margin:0;font-weight:700}.fm-empty{padding:28px;text-align:center;color:var(--muted,#64748b)}.fm-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.fm-form label{display:grid;gap:6px;font-size:13px;font-weight:700}.fm-form .wide{grid-column:1/-1}.fm-schema{display:grid;gap:10px}.fm-schema div{display:flex;justify-content:space-between;padding:13px;border:1px solid var(--line,#d8e2ee);border-radius:12px}.fm-ai-score{font-size:54px;font-weight:900;color:var(--accent,#2563eb)}.fm-recommendation{padding:15px;border-left:4px solid var(--accent,#2563eb);background:color-mix(in srgb,var(--accent,#2563eb) 7%,transparent);border-radius:0 12px 12px 0}.fm-recommendation+ .fm-recommendation{margin-top:10px}.fm-risk{display:grid;grid-template-columns:1fr auto;gap:10px;padding:12px 0;border-bottom:1px solid var(--line,#d8e2ee)}@media(max-width:900px){.fm-stats,.fm-stages{grid-template-columns:repeat(2,minmax(0,1fr))}.fm-grid{grid-template-columns:1fr}.fm-hero{display:grid}.fm-form{grid-template-columns:1fr}.fm-form .wide{grid-column:auto}.fm-table{display:block;overflow:auto}}@media(max-width:560px){.fm-stats,.fm-stages{grid-template-columns:1fr}.functional-module-view{gap:12px}.fm-hero,.fm-panel{padding:16px}}
  `;
  style.textContent += `.fm-stage-action{display:grid;gap:11px;margin-top:18px;padding-top:18px;border-top:1px solid var(--line,#d8e2ee)}.fm-stage-action h4{margin:0}.fm-stage-action label{display:grid;gap:6px;color:var(--muted,#64748b);font-size:13px;font-weight:700}.fm-stage-action :is(input,select,textarea){width:100%;border:1px solid var(--line,#d8e2ee);background:var(--background,#fff);color:inherit;border-radius:11px;padding:11px 12px;font:inherit}.fm-stage-action textarea{min-height:82px;resize:vertical}.fm-stage-result,.fm-save-notice{margin:10px 0 0;padding:11px;border-radius:10px;background:color-mix(in srgb,var(--accent,#2563eb) 8%,transparent);font-size:13px}.fm-save-notice{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 14px;border:1px solid color-mix(in srgb,var(--accent,#2563eb) 35%,transparent)}.fm-save-notice strong,.fm-save-notice span{display:block}.fm-save-notice span{margin-top:4px;color:var(--muted,#64748b)}.fm-table tr.fm-just-updated{background:color-mix(in srgb,var(--accent,#2563eb) 12%,transparent);box-shadow:inset 4px 0 var(--accent,#2563eb)}.fm-action-history{margin-top:18px;padding-top:16px;border-top:1px solid var(--line,#d8e2ee)}.fm-action-history h4{margin:0 0 10px}.fm-action-history dl{margin:0}.fm-action-history dd{overflow-wrap:anywhere}`;
  document.head.append(style);

  const guideStyle = document.createElement("style");
  guideStyle.textContent = `
    .guide-shell{display:grid;gap:18px}.guide-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;padding:28px;border:1px solid #bfdbfe;border-radius:22px;background:linear-gradient(135deg,#eff6ff,#fff 58%,#ecfdf5);box-shadow:0 14px 34px rgba(30,64,175,.1)}
    .guide-kicker{margin:0 0 8px;color:#1d4ed8;font-size:13px;font-weight:900;letter-spacing:.08em}.guide-hero h2{margin:0;color:#172554;font-size:clamp(28px,4vw,44px);line-height:1.14}.guide-lead{max-width:720px;margin:12px 0 0;color:#475569;font-size:16px;line-height:1.75}.guide-status{align-self:start;display:grid;gap:6px;min-width:150px;padding:14px 16px;border:1px solid #93c5fd;border-radius:15px;background:#fff}.guide-status span{color:#64748b;font-size:12px;font-weight:800}.guide-status strong{color:#1d4ed8;font-size:18px}
    .guide-impact{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.guide-impact article{padding:17px;border:1px solid #dbeafe;border-radius:16px;background:#fff}.guide-impact span{display:block;color:#64748b;font-size:13px}.guide-impact div{display:flex;align-items:baseline;gap:9px;margin-top:7px}.guide-impact s{color:#94a3b8;font-size:19px}.guide-impact strong{color:#047857;font-size:27px}.guide-impact small{color:#047857;font-weight:800}
    .guide-progress{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0;padding:0;list-style:none}.guide-progress li{display:grid;grid-template-columns:34px 1fr;align-items:center;gap:10px;padding:13px;border:1px solid #dbeafe;border-radius:14px;background:#fff;color:#64748b}.guide-progress b{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#e2e8f0;color:#475569}.guide-progress strong{display:block;color:#334155}.guide-progress small{display:block;margin-top:2px}.guide-progress li.current{border-color:#2563eb;background:#eff6ff}.guide-progress li.current b{background:#2563eb;color:#fff}.guide-progress li.complete{border-color:#86efac;background:#f0fdf4}.guide-progress li.complete b{background:#16a34a;color:#fff}
    .guide-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:18px}.guide-card{padding:24px;border:1px solid #dbeafe;border-radius:20px;background:#fff}.guide-card h3{margin:0;color:#172554;font-size:22px}.guide-card>p{margin:9px 0 0;color:#475569;line-height:1.7}.guide-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:20px}.guide-fact{padding:14px;border-radius:13px;background:#f8fafc;border:1px solid #e2e8f0}.guide-fact span,.guide-fact strong{display:block}.guide-fact span{color:#64748b;font-size:12px}.guide-fact strong{margin-top:5px;color:#172554;font-size:18px}.guide-fact.alert{border-color:#fecaca;background:#fef2f2}.guide-fact.alert strong{color:#b91c1c}
    .guide-primary,.guide-secondary{min-height:48px;margin-top:20px;padding:12px 18px;border-radius:12px;font:inherit;font-weight:900;cursor:pointer}.guide-primary{border:1px solid #1d4ed8;background:#1d4ed8;color:#fff;box-shadow:0 8px 18px rgba(29,78,216,.2)}.guide-primary:hover{background:#1e40af}.guide-secondary{border:1px solid #93c5fd;background:#fff;color:#1d4ed8}.guide-primary:focus-visible,.guide-secondary:focus-visible{outline:3px solid rgba(37,99,235,.32);outline-offset:3px}.guide-help{display:grid;gap:14px}.guide-help section{padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0}.guide-help h4{margin:0;color:#172554}.guide-help p{margin:6px 0 0;color:#64748b;font-size:14px;line-height:1.6}.guide-order{margin:10px 0 0;padding-left:20px;color:#334155}.guide-order li+li{margin-top:7px}.guide-complete{padding:20px;border:1px solid #86efac;border-radius:16px;background:#f0fdf4}.guide-complete strong{display:block;color:#166534;font-size:20px}.guide-complete p{margin:7px 0 0;color:#166534}.guide-actions{display:flex;flex-wrap:wrap;gap:10px}
    @media(max-width:900px){.guide-hero,.guide-layout{grid-template-columns:1fr}.guide-status{min-width:0}.guide-impact{grid-template-columns:1fr}.guide-facts{grid-template-columns:1fr}}
    @media(max-width:560px){.guide-hero,.guide-card{padding:18px}.guide-progress{grid-template-columns:1fr}.guide-hero h2{font-size:28px}.guide-actions{display:grid}.guide-actions button{width:100%}}
    @media(prefers-reduced-motion:reduce){.guide-shell *{scroll-behavior:auto!important;transition-duration:1ms!important}}
  `;
  document.head.append(guideStyle);

  let selectedRecordId = records.find((item) => !item.done)?.id || records[0]?.id;
  let lastSubmittedId = "";
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const statsFor = () => getStats();
  const moduleTitle = (index) => buttons[index]?.dataset.module || buttons[index]?.textContent.trim() || `功能 ${index + 1}`;
  const hero = (index, subtitle, action = "") => `<header class="fm-hero"><div><p class="fm-kicker">${esc(config.name)} · ${esc(moduleTitle(index))}</p><h2>${esc(subtitle)}</h2><p class="fm-description">${esc(config.description)}</p></div>${action}</header>`;

  function dashboard() {
    const stats = statsFor();
    const stageCards = config.profile.stages.map((stage) => {
      const items = records.filter((record) => record.stage === stage);
      return `<article class="fm-stage"><b>${esc(stage)}</b><span>${items.length} 筆${esc(config.profile.object)}</span></article>`;
    }).join("");
    const urgent = records.filter((record) => !record.done).sort((a,b) => b.score-a.score).slice(0,4);
    view.innerHTML = hero(0, `${config.name}營運總覽`) + `<div class="fm-stats"><article class="fm-stat"><span>進行中${esc(config.profile.object)}</span><strong>${stats.open}</strong></article><article class="fm-stat"><span>高風險項目</span><strong>${stats.highRisk}</strong></article><article class="fm-stat"><span>完成率</span><strong>${stats.doneRate}%</strong></article><article class="fm-stat"><span>平均 AI 分數</span><strong>${stats.avgScore}</strong></article></div><div class="fm-grid"><article class="fm-panel"><h3>${esc(config.profile.object)}流程</h3><div class="fm-stages">${stageCards}</div></article><article class="fm-panel"><h3>優先處理</h3><div class="fm-list">${urgent.map(item => `<button class="fm-row" data-open-record="${esc(item.id)}"><strong>${esc(item.title)}</strong><small>${esc(item.risk)} · ${esc(item.owner)} · ${esc(item.due)}</small></button>`).join("") || '<p class="fm-empty">目前沒有待處理項目</p>'}</div></article></div>`;
  }

  function cases() {
    const rows = records.map((item) => `<tr data-open-record="${esc(item.id)}" class="${item.id === lastSubmittedId ? "fm-just-updated" : ""}"><td><strong>${esc(item.title)}</strong></td><td>${esc(item.stage)}</td><td>${esc(item.owner)}</td><td>${esc(item.due)}</td><td><span class="fm-badge">${esc(item.risk)}</span></td></tr>`).join("");
    const selected = records.find((item) => item.id === selectedRecordId) || records[0];
    const saved = records.find((item) => item.id === lastSubmittedId);
    const notice = saved ? `<div class="fm-save-notice" role="status"><div><strong>已儲存「${esc(saved.title)}」的處理紀錄</strong><span>這筆資料現在位於「${esc(saved.stage)}」，左側列已醒目標示；完整內容顯示在右側處理紀錄。</span></div><button class="fm-action secondary" data-open-record="${esc(saved.id)}">查看這筆資料</button></div>` : "";
    view.innerHTML = hero(1, `${config.profile.object}清單`) + `${notice}<div class="fm-grid"><article class="fm-panel"><div class="fm-toolbar"><input id="fmCaseSearch" placeholder="搜尋${esc(config.profile.object)}、負責人或風險"><button class="fm-action secondary" id="fmOnlyOpen">只看未完成</button></div><table class="fm-table"><thead><tr><th>${esc(config.profile.object)}</th><th>階段</th><th>${esc(config.profile.fields[3] || "負責人")}</th><th>${esc(config.profile.fields[1] || "期限")}</th><th>${esc(config.profile.fields[2] || "風險")}</th></tr></thead><tbody id="fmCaseRows">${rows}</tbody></table></article><article class="fm-panel fm-detail" id="fmDetail">${detailMarkup(selected)}</article></div>`;
  }

  function detailMarkup(item) {
    if (!item) return '<p class="fm-empty">選擇一筆資料查看詳細資訊</p>';
    const nextIndex = Math.min(config.profile.stages.indexOf(item.stage) + 1, config.profile.stages.length - 1);
    const nextStage = config.profile.stages[nextIndex];
    const completed = item.done || item.stage === config.profile.stages.at(-1);
    const isFollowUp = /回訪|追蹤|複核|驗收|確認/.test(nextStage);
    const isClosure = /結案|歸檔|關閉|完成|結算/.test(nextStage);
    const actionFields = isFollowUp
      ? `<label>回訪方式<select name="method" required><option value="">請選擇</option><option>電話</option><option>簡訊／通訊軟體</option><option>電子郵件</option><option>現場訪談</option></select></label><label>回訪結果<select name="result" required><option value="">請選擇</option><option>問題已解決</option><option>需要再次處理</option><option>客戶未聯繫上</option></select></label><label>下次聯繫日期<input name="nextDate" type="date" required></label>`
      : isClosure
        ? `<label>結案結果<select name="result" required><option value="">請選擇</option><option>完成並由客戶確認</option><option>完成但需持續觀察</option><option>取消／不再處理</option></select></label><label>確認人<input name="confirmedBy" required placeholder="輸入客戶或主管姓名"></label><label>完成日期<input name="completedAt" type="date" required></label>`
        : `<label>執行結果<select name="result" required><option value="">請選擇</option><option>檢核完成</option><option>需要補充資料</option><option>發現異常待處理</option></select></label><label>執行人<input name="operator" required value="${esc(item.owner)}"></label><label>完成日期<input name="completedAt" type="date" required></label>`;
    const actionForm = completed
      ? `<p class="fm-stage-result">本案已完成「${esc(item.stage)}」，相關處理結果已存入案件紀錄。</p>`
      : `<form class="fm-stage-action" data-stage-action data-id="${esc(item.id)}" data-stage="${esc(nextStage)}"><h4>執行「${esc(nextStage)}」</h4>${actionFields}<label>處理說明<textarea name="note" required placeholder="輸入本次處理內容與判斷依據"></textarea></label><button class="fm-action" type="submit">儲存紀錄並推進至「${esc(nextStage)}」</button></form>`;
    const history = item.lastAction ? `<section class="fm-action-history"><h4>最新處理紀錄</h4><dl><dt>完成階段</dt><dd>${esc(item.lastAction.stage)}</dd><dt>處理結果</dt><dd>${esc(item.lastAction.result || "已完成")}</dd><dt>處理說明</dt><dd>${esc(item.lastAction.note)}</dd><dt>紀錄時間</dt><dd>${esc(new Date(item.lastAction.at).toLocaleString("zh-TW"))}</dd></dl></section>` : "";
    return `<h3>${esc(item.title)}</h3><p class="fm-description">${esc(item.target)}</p><dl><dt>目前階段</dt><dd>${esc(item.stage)}</dd><dt>${esc(config.profile.fields[3] || "負責人")}</dt><dd>${esc(item.owner)}</dd><dt>${esc(config.profile.fields[2] || "風險")}</dt><dd>${esc(item.risk)}</dd><dt>AI 分數</dt><dd>${esc(item.score)}</dd></dl>${actionForm}${history}`;
  }

  function masterData() {
    view.innerHTML = hero(2, `${config.name}資料主檔`, `<button class="fm-action secondary" id="fmReset">還原示範資料</button>`) + `<div class="fm-grid"><article class="fm-panel"><h3>新增${esc(config.profile.object)}</h3><form class="fm-form" id="fmCreate"><label class="wide">${esc(config.profile.object)}名稱<input name="title" required placeholder="輸入${esc(config.profile.object)}名稱"></label><label>${esc(config.profile.fields[0] || "對象")}<input name="target" required placeholder="輸入${esc(config.profile.fields[0] || "對象")}"></label><label>${esc(config.profile.fields[3] || "負責人")}<input name="owner" required value="${esc(config.profile.owner)}"></label><label>${esc(config.profile.fields[2] || "風險")}<select name="risk">${config.profile.risks.map(risk => `<option>${esc(risk)}</option>`).join("")}</select></label><label>初始階段<select name="stage">${config.profile.stages.map(stage => `<option>${esc(stage)}</option>`).join("")}</select></label><button class="fm-action wide" type="submit">建立${esc(config.profile.object)}</button></form></article><article class="fm-panel"><h3>系統欄位與規則</h3><div class="fm-schema">${config.profile.fields.map((field,index) => `<div><span>欄位 ${index+1}</span><strong>${esc(field)}</strong></div>`).join("")}<div><span>預設負責角色</span><strong>${esc(config.profile.owner)}</strong></div><div><span>目前資料筆數</span><strong>${records.length}</strong></div></div></article></div>`;
  }

  function aiDecision() {
    const stats = statsFor();
    const top = records.filter(item => !item.done).sort((a,b) => b.score-a.score).slice(0,3);
    const risks = config.profile.risks.map(risk => [risk, records.filter(item => item.risk === risk && !item.done).length]).sort((a,b)=>b[1]-a[1]);
    view.innerHTML = hero(3, `${config.name} AI 決策中心`, '<button class="fm-action" id="fmRunAi">重新分析</button>') + `<div class="fm-grid"><article class="fm-panel"><h3>決策建議</h3><div class="fm-ai-score">${stats.avgScore}</div><p class="fm-description">綜合 ${records.length} 筆${esc(config.profile.object)}的階段、期限與風險後產生。</p><div id="fmRecommendations">${top.map((item,index) => `<div class="fm-recommendation"><strong>${index+1}. 優先處理 ${esc(item.title)}</strong><p>${esc(item.risk)}，目前由 ${esc(item.owner)} 負責；建議在 ${esc(item.due)} 前完成「${esc(item.stage)}」階段確認。</p></div>`).join("") || '<p class="fm-empty">目前沒有需要分析的未完成資料</p>'}</div></article><article class="fm-panel"><h3>風險分布</h3>${risks.map(([risk,count]) => `<div class="fm-risk"><span>${esc(risk)}</span><strong>${count} 筆</strong></div>`).join("")}<h3 style="margin-top:22px">AI 判讀依據</h3><p class="fm-description">依據${esc(config.profile.fields.join("、"))}與${esc(config.profile.stages.join("、"))}等專案資料進行排序。</p></article></div>`;
  }

  let guideStep = Number(sessionStorage.getItem("jvision-production-guide-step") || 0);

  function guidedDashboard() {
    const steps = [
      { title: "確認物料缺口", detail: "確認需求量與可用量", heading: "先確認缺料是否真的影響交期", description: "醫療支架工單 MO-5801 需求 680 件，但目前只有 420 件可用。確認 260 件缺口後，系統才能安全地重排工單。", action: "確認缺口（260 件）" },
      { title: "重排生產順序", detail: "把急單移到可執行位置", heading: "套用建議的生產順序", description: "先安排材料足夠且交期最近的工單，再保留 MO-5801 的設備時段，等補料到位後立即接續生產。", action: "套用建議順序" },
      { title: "發布新排程", detail: "通知生管、採購與現場", heading: "確認影響並發布新排程", description: "發布後，延誤工單預估降為 0，設備負載回到 81%，準時交付率提升至 92%。", action: "發布新排程" },
    ];
    const active = Math.min(guideStep, 2);
    const progress = steps.map((step,index) => `<li class="${guideStep > index ? "complete" : guideStep === index ? "current" : ""}"><b>${guideStep > index ? "✓" : index + 1}</b><span><strong>${step.title}</strong><small>${step.detail}</small></span></li>`).join("");
    const facts = active === 0
      ? '<div class="guide-facts"><div class="guide-fact"><span>工單</span><strong>MO-5801</strong></div><div class="guide-fact"><span>需求／可用</span><strong>680／420 件</strong></div><div class="guide-fact alert"><span>物料缺口</span><strong>260 件</strong></div></div>'
      : active === 1
        ? '<div class="guide-facts"><div class="guide-fact"><span>優先 1</span><strong>MO-5734</strong></div><div class="guide-fact"><span>優先 2</span><strong>MO-5801</strong></div><div class="guide-fact"><span>等待補料</span><strong>4 小時</strong></div></div>'
        : '<div class="guide-facts"><div class="guide-fact"><span>影響部門</span><strong>3 個</strong></div><div class="guide-fact"><span>異動工單</span><strong>2 張</strong></div><div class="guide-fact"><span>生效時間</span><strong>今日 14:00</strong></div></div>';
    const work = guideStep >= 3
      ? '<div class="guide-complete" role="status"><strong>新排程已發布</strong><p>MO-5734 先行生產，MO-5801 等補料到位後接續；生管、採購與產線主管已收到異動摘要。</p></div><div class="guide-actions"><button class="guide-secondary" type="button" data-guide-reset>重新示範</button><button class="guide-primary" type="button" data-open-record="1001-1">查看異動工單</button></div>'
      : `<h3>${steps[active].heading}</h3><p>${steps[active].description}</p>${facts}<button class="guide-primary" type="button" data-guide-next>${steps[active].action}</button>`;
    view.innerHTML = `
      <section class="guide-shell" aria-labelledby="guideTitle">
        <header class="guide-hero"><div><p class="guide-kicker">現場情境 · 缺料排程衝突</p><h2 id="guideTitle">2 張工單可能延誤，請在 3 步內完成重排</h2><p class="guide-lead">關鍵鋁料不足，醫療支架工單無法依原定順序生產。跟著引導確認缺口、調整順序並發布新排程。</p></div><div class="guide-status"><span>目前進度</span><strong>${guideStep >= 3 ? "已完成" : `第 ${guideStep + 1} 步／共 3 步`}</strong></div></header>
        <div class="guide-impact" aria-label="預期改善"><article><span>延誤工單</span><div><s>2 張</s><strong>0 張</strong><small>↓ 100%</small></div></article><article><span>設備尖峰負載</span><div><s>94%</s><strong>81%</strong><small>↓ 13%</small></div></article><article><span>準時交付率</span><div><s>76%</s><strong>92%</strong><small>↑ 16%</small></div></article></div>
        <ol class="guide-progress" aria-label="示範步驟">${progress}</ol>
        <div class="guide-layout"><article class="guide-card">${work}</article><aside class="guide-card guide-help"><section><h4>為什麼現在要處理？</h4><p>MO-5801 距離承諾交期只剩 2 天；若不調整，兩張工單會同時卡在同一設備與缺料時段。</p></section><section><h4>系統建議順序</h4><ol class="guide-order"><li>MO-5734 · 材料齊全</li><li>MO-5801 · 補料後接續</li><li>MO-5812 · 維持原排程</li></ol></section></aside></div>
      </section>`;
  }

  const renderers = [guidedDashboard, cases, masterData, aiDecision];
  function activate(index, focus = false) {
    const selected = Math.max(0, Math.min(3, index));
    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === selected;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
      button.setAttribute("aria-pressed", String(active));
    });
    renderers[selected]();
    document.body.dataset.activeModuleIndex = String(selected);
    document.body.dataset.activeModule = moduleTitle(selected);
    history.replaceState(null, "", `#module-${selected + 1}`);
    if (focus) view.scrollIntoView({behavior:"smooth",block:"start"});
  }

  buttons.forEach((button,index) => button.addEventListener("click", () => activate(index,true)));
  view.addEventListener("click", (event) => {
    if (event.target.closest("[data-guide-next]")) {
      guideStep = Math.min(3, guideStep + 1);
      sessionStorage.setItem("jvision-production-guide-step", String(guideStep));
      if (guideStep === 3) addLog("新排程已發布：延誤工單降為 0，設備負載調整為 81%，準時交付率提升至 92%。");
      guidedDashboard();
      view.querySelector(".guide-card")?.focus?.();
      return;
    }
    if (event.target.closest("[data-guide-reset]")) {
      guideStep = 0;
      sessionStorage.setItem("jvision-production-guide-step", "0");
      guidedDashboard();
      return;
    }
    const open = event.target.closest("[data-open-record]");
    if (open) {
      selectedRecordId = open.dataset.openRecord;
      if (document.body.dataset.activeModuleIndex !== "1") activate(1);
      else document.querySelector("#fmDetail").innerHTML = detailMarkup(records.find(item => item.id === selectedRecordId));
      return;
    }
    if (event.target.closest("#fmOnlyOpen")) {
      document.querySelectorAll("#fmCaseRows tr").forEach(row => { const item=records.find(record=>record.id===row.dataset.openRecord); row.style.display=item?.done?"none":""; });
    }
    if (event.target.closest("#fmReset")) {
      records = cloneRecords(); saveRecords(); masterData();
    }
    if (event.target.closest("#fmRunAi")) {
      runAi(); aiDecision();
    }
  });
  view.addEventListener("input", (event) => {
    if (event.target.id !== "fmCaseSearch") return;
    const keyword = event.target.value.trim().toLowerCase();
    document.querySelectorAll("#fmCaseRows tr").forEach(row => { const item=records.find(record=>record.id===row.dataset.openRecord); row.style.display=!keyword || JSON.stringify(item).toLowerCase().includes(keyword)?"":"none"; });
  });
  view.addEventListener("submit", (event) => {
    if (event.target.matches("[data-stage-action]")) {
      event.preventDefault();
      const stageForm = event.target;
      const values = Object.fromEntries(new FormData(stageForm));
      records = records.map(item => item.id === stageForm.dataset.id ? {...item,stage:stageForm.dataset.stage,done:stageForm.dataset.stage === config.profile.stages.at(-1),lastAction:{...values,stage:stageForm.dataset.stage,at:new Date().toISOString()}} : item);
      selectedRecordId = stageForm.dataset.id;
      lastSubmittedId = stageForm.dataset.id;
      saveRecords();
      addLog(`${records.find(item=>item.id===stageForm.dataset.id)?.title} 已完成「${stageForm.dataset.stage}」並儲存處理紀錄`);
      cases();
      return;
    }
    if (event.target.id !== "fmCreate") return;
    event.preventDefault();
    const form = new FormData(event.target);
    const item={id:`${config.id}-${Date.now()}`,title:String(form.get("title")),target:`${config.name} · ${form.get("target")}`,owner:String(form.get("owner")),due:"D+7",risk:String(form.get("risk")),stage:String(form.get("stage")),score:60,priority:"medium",done:false};
    records.unshift(item); saveRecords(); selectedRecordId=item.id; addLog(`已建立 ${item.title}`); cases();
  });

  const initial = Number(location.hash.match(/^#module-(\d+)$/)?.[1] || 1) - 1;
  activate(initial);
}

setupDistinctFunctionalModules();
render();
})();
