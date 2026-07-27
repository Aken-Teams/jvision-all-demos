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
  document.head.append(style);

  let selectedRecordId = records.find((item) => !item.done)?.id || records[0]?.id;
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
    const rows = records.map((item) => `<tr data-open-record="${esc(item.id)}"><td><strong>${esc(item.title)}</strong></td><td>${esc(item.stage)}</td><td>${esc(item.owner)}</td><td>${esc(item.due)}</td><td><span class="fm-badge">${esc(item.risk)}</span></td></tr>`).join("");
    const selected = records.find((item) => item.id === selectedRecordId) || records[0];
    view.innerHTML = hero(1, `${config.profile.object}清單`) + `<div class="fm-grid"><article class="fm-panel"><div class="fm-toolbar"><input id="fmCaseSearch" placeholder="搜尋${esc(config.profile.object)}、負責人或風險"><button class="fm-action secondary" id="fmOnlyOpen">只看未完成</button></div><table class="fm-table"><thead><tr><th>${esc(config.profile.object)}</th><th>階段</th><th>${esc(config.profile.fields[3] || "負責人")}</th><th>${esc(config.profile.fields[1] || "期限")}</th><th>${esc(config.profile.fields[2] || "風險")}</th></tr></thead><tbody id="fmCaseRows">${rows}</tbody></table></article><article class="fm-panel fm-detail" id="fmDetail">${detailMarkup(selected)}</article></div>`;
  }

  function detailMarkup(item) {
    if (!item) return '<p class="fm-empty">選擇一筆資料查看詳細資訊</p>';
    const nextIndex = Math.min(config.profile.stages.indexOf(item.stage) + 1, config.profile.stages.length - 1);
    return `<h3>${esc(item.title)}</h3><p class="fm-description">${esc(item.target)}</p><dl><dt>目前階段</dt><dd>${esc(item.stage)}</dd><dt>${esc(config.profile.fields[3] || "負責人")}</dt><dd>${esc(item.owner)}</dd><dt>${esc(config.profile.fields[2] || "風險")}</dt><dd>${esc(item.risk)}</dd><dt>AI 分數</dt><dd>${esc(item.score)}</dd></dl><button class="fm-action" id="fmAdvance" data-id="${esc(item.id)}" data-stage="${esc(config.profile.stages[nextIndex])}">推進至「${esc(config.profile.stages[nextIndex])}」</button>`;
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

  const renderers = [dashboard, cases, masterData, aiDecision];
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
    const open = event.target.closest("[data-open-record]");
    if (open) {
      selectedRecordId = open.dataset.openRecord;
      if (document.body.dataset.activeModuleIndex !== "1") activate(1);
      else document.querySelector("#fmDetail").innerHTML = detailMarkup(records.find(item => item.id === selectedRecordId));
      return;
    }
    const advance = event.target.closest("#fmAdvance");
    if (advance) {
      records = records.map(item => item.id === advance.dataset.id ? {...item,stage:advance.dataset.stage,done:advance.dataset.stage === config.profile.stages.at(-1)} : item);
      saveRecords();
      addLog(`${records.find(item=>item.id===advance.dataset.id)?.title} 已推進至 ${advance.dataset.stage}`);
      cases();
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


// JVISION_PROJECT_PEOPLE_MODULES_START
function setupProjectPeopleModules(projectProfile) {
    const buttons = [...document.querySelectorAll(".module-nav button[data-module]")];
    const view = document.querySelector(".functional-module-view");
    if (buttons.length !== 4 || !view) return;
    const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    const state = { selected: 0, completed: new Set(), activity: [] };
    buttons.forEach((button, index) => {
      button.dataset.module = projectProfile.modules[index];
      button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span>${esc(projectProfile.modules[index])}`;
    });
    const hero = (index, title, action = "") => `<header class="fm-hero"><div><p class="fm-kicker">${esc(projectProfile.name)} · ${esc(projectProfile.modules[index])}</p><h2>${esc(title)}</h2><p class="fm-description">${esc(projectProfile.description)}</p></div>${action}</header>`;
    const statCards = () => `<div class="fm-stats">${projectProfile.metrics.map((metric, index) => `<article class="fm-stat"><span>${esc(metric)}</span><strong>${[projectProfile.functions.length, projectProfile.workflows.length, projectProfile.pains.length, "94%"][index]}</strong></article>`).join("")}</div>`;
    const operationRows = () => projectProfile.functions.map((item, index) => `<tr class="${state.selected === index ? "active" : ""}" data-people-row="${index}"><td><strong>${esc(item)}</strong></td><td><span class="fm-badge">${state.completed.has(index) ? "已完成" : index ? "進行中" : "待處理"}</span></td><td>${esc(projectProfile.roles[index % projectProfile.roles.length])}</td><td>D+${index + 1}</td></tr>`).join("");
    const detail = (index) => {
      const item = projectProfile.functions[index] || projectProfile.functions[0];
      const isCompleted = state.completed.has(index);
      const latest = state.activity.find((entry) => entry.index === index);
      return `<h3>${esc(item)}</h3><p class="fm-description">${esc(projectProfile.pains[index % projectProfile.pains.length])}</p><dl><dt>負責角色</dt><dd>${esc(projectProfile.roles[index % projectProfile.roles.length])}</dd><dt>目前狀態</dt><dd>${isCompleted ? "已完成" : "待處理"}</dd><dt>下一步</dt><dd>${isCompleted ? "已同步更新總覽與流程統計" : esc(projectProfile.workflows[index % projectProfile.workflows.length])}</dd></dl>${isCompleted ? `<div class="fm-recommendation" data-completion-result><strong>✓ 作業已完成</strong><p>${esc(latest?.time || "剛剛")} 完成處理，清單狀態與完成率已同步更新。</p></div><button class="fm-action secondary" data-reopen-people="${index}">重新開啟作業</button>` : `<button class="fm-action" data-complete-people="${index}">完成此項作業</button>`}`;
    };
    const renderers = [
      () => {
        view.innerHTML = hero(0, `${projectProfile.name}營運總覽`) + statCards() + `<div class="fm-grid"><article class="fm-panel"><h3>核心作業流程</h3><div class="fm-stages">${projectProfile.workflows.slice(0, 4).map((step, index) => `<article class="fm-stage"><b>0${index + 1} ${esc(step)}</b><span>${index ? "依序處理中" : "目前優先處理"}</span></article>`).join("")}</div></article><article class="fm-panel"><h3>今日提醒</h3><div class="fm-list">${projectProfile.pains.slice(0, 3).map((pain, index) => `<button class="fm-row" data-jump-people="1" data-select-people="${index}"><strong>${esc(projectProfile.functions[index % projectProfile.functions.length])}</strong><small>${esc(pain)}</small></button>`).join("")}</div></article></div>`;
      },
      () => {
        view.innerHTML = hero(1, `${projectProfile.modules[1]}作業台`) + `<div class="fm-grid"><article class="fm-panel"><div class="fm-toolbar"><input id="peopleModuleSearch" placeholder="搜尋作業、角色或狀態"><button class="fm-action secondary" id="peopleOnlyOpen">只看未完成</button></div><table class="fm-table"><thead><tr><th>作業項目</th><th>狀態</th><th>負責角色</th><th>期限</th></tr></thead><tbody id="peopleModuleRows">${operationRows()}</tbody></table></article><article class="fm-panel fm-detail" id="peopleModuleDetail">${detail(state.selected)}</article></div>`;
      },
      () => {
        view.innerHTML = hero(2, `${projectProfile.modules[2]}流程`) + `<div class="fm-grid"><article class="fm-panel"><h3>流程與檢核點</h3><div class="fm-list">${projectProfile.workflows.map((step, index) => `<button class="fm-row" data-workflow-step="${index}"><strong>${String(index + 1).padStart(2, "0")} ${esc(step)}</strong><small>${esc(projectProfile.functions[index % projectProfile.functions.length])}</small></button>`).join("")}</div></article><article class="fm-panel"><h3>必要資料與規則</h3><div class="fm-schema">${projectProfile.fields.map((field, index) => `<div><span>必要欄位 ${index + 1}</span><strong>${esc(field)}</strong></div>`).join("")}<div><span>流程完成率</span><strong>${Math.round(state.completed.size / projectProfile.functions.length * 100)}%</strong></div></div></article></div>`;
      },
      () => {
        view.innerHTML = hero(3, projectProfile.modules[3], '<button class="fm-action" id="peopleReanalyze">重新分析</button>') + `<div class="fm-grid"><article class="fm-panel"><h3>專案 AI 建議</h3><div class="fm-ai-score">${Math.min(98, 72 + state.completed.size * 4)}</div>${projectProfile.ai.map((advice, index) => `<div class="fm-recommendation"><strong>${index + 1}. ${esc(advice)}</strong><p>${esc(projectProfile.pains[index % projectProfile.pains.length])}</p><button class="fm-action" data-apply-people="${index}">套用建議</button></div>`).join("")}</article><article class="fm-panel"><h3>判讀依據</h3>${projectProfile.metrics.map((metric, index) => `<div class="fm-risk"><span>${esc(metric)}</span><strong>${[86, 72, 64, 91][index]} 分</strong></div>`).join("")}</article></div>`;
      }
    ];
    function activate(index, focus = false) {
      buttons.forEach((button, buttonIndex) => {
        button.classList.toggle("active", buttonIndex === index);
        button.setAttribute("aria-pressed", String(buttonIndex === index));
        button.setAttribute("aria-current", buttonIndex === index ? "page" : "false");
      });
      renderers[index]();
      document.body.dataset.activeModuleIndex = String(index);
      document.body.dataset.activeModule = projectProfile.modules[index];
      history.replaceState(null, "", `#module-${index + 1}`);
      if (focus) view.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    buttons.forEach((button, index) => button.addEventListener("click", (event) => {
      event.stopImmediatePropagation();
      activate(index, true);
    }, true));
    view.addEventListener("click", (event) => {
      const row = event.target.closest("[data-people-row]");
      if (row) {
        state.selected = Number(row.dataset.peopleRow);
        document.querySelector("#peopleModuleDetail").innerHTML = detail(state.selected);
        return;
      }
      const complete = event.target.closest("[data-complete-people]");
      if (complete) {
        const index = Number(complete.dataset.completePeople);
        state.completed.add(index);
        state.activity.unshift({ index, time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }) });
        renderers[1]();
        return;
      }
      const reopen = event.target.closest("[data-reopen-people]");
      if (reopen) {
        const index = Number(reopen.dataset.reopenPeople);
        state.completed.delete(index);
        state.activity = state.activity.filter((entry) => entry.index !== index);
        renderers[1]();
        return;
      }
      const jump = event.target.closest("[data-jump-people]");
      if (jump) {
        state.selected = Number(jump.dataset.selectPeople || 0);
        activate(Number(jump.dataset.jumpPeople), true);
        return;
      }
      if (event.target.closest("#peopleOnlyOpen")) {
        document.querySelectorAll("#peopleModuleRows tr").forEach((row) => {
          row.style.display = state.completed.has(Number(row.dataset.peopleRow)) ? "none" : "";
        });
        return;
      }
      const apply = event.target.closest("[data-apply-people]");
      if (apply) {
        apply.textContent = "已套用建議";
        apply.disabled = true;
        return;
      }
      if (event.target.closest("#peopleReanalyze")) renderers[3]();
    });
    view.addEventListener("input", (event) => {
      if (event.target.id !== "peopleModuleSearch") return;
      const keyword = event.target.value.trim().toLowerCase();
      document.querySelectorAll("#peopleModuleRows tr").forEach((row) => {
        const item = projectProfile.functions[Number(row.dataset.peopleRow)] || "";
        row.style.display = !keyword || item.toLowerCase().includes(keyword) || row.textContent.toLowerCase().includes(keyword) ? "" : "none";
      });
    });
    const initial = Math.max(0, Math.min(3, Number(location.hash.match(/^#module-(\d+)$/)?.[1] || 1) - 1));
    activate(initial);
  }
setupProjectPeopleModules({"id":1316,"name":"獎懲考核管理系統（Rewards & Disciplinary Management）","description":"記錄員工獎懲事件、簽核流程與累積紀錄，作為考核、續聘與升遷之客觀依據。","modules":["獎懲總覽","獎懲案件","審議與公告","AI 公平性檢核"],"functions":["獎懲事件申請與簽核流程","獎懲點數累積與抵免規則","違規案件調查紀錄","獎懲與考核/續聘連動","獎懲統計報表","申訴機制管理"],"workflows":["事件通報","主管簽核","人資審核","獎懲紀錄建檔","員工確認/申訴","定期統計分析"],"pains":["紙本獎懲紀錄易遺失或竄改","各主管獎懲標準不一","獎懲與績效考核未串接","申訴處理流程不透明"],"ai":["違規事件模式分析與熱點部門標記","獎懲公平性偏誤偵測"],"roles":["人資部","產線主管","稽核部","勞資關係窗口"],"metrics":["獎懲案件處理時效","申訴成立率","重複違規率","獎懲紀錄完整度"],"fields":["對象","期限","風險","負責人"]});
// JVISION_PROJECT_PEOPLE_MODULES_END
render();
})();