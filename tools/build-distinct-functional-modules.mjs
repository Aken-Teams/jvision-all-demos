import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const oldMarker = "JVISION_FUNCTIONAL_MODULE_NAVIGATION";
const marker = "JVISION_DISTINCT_FUNCTIONAL_MODULES";

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
    if (focus && matchMedia("(max-width:1120px)").matches) view.scrollIntoView({behavior:"smooth",block:"start"});
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

const moduleCode = `\n\n// ${marker}\n${setupDistinctFunctionalModules.toString()}\n\nsetupDistinctFunctionalModules();\n`;

let projects = 0;
let files = 0;
const failures = [];
for (const project of catalog.projects) {
  const projectDir = path.join(root, "demos", project.repoName);
  const indexFile = path.join(projectDir, "index.html");
  if (!fs.existsSync(indexFile) || !fs.readFileSync(indexFile, "utf8").includes("data-module=")) continue;
  const targets = [path.join(projectDir, "app.js"), path.join(projectDir, "public", "demo-app.js")].filter(fs.existsSync);
  if (!targets.length) continue;
  let touched = false;
  for (const target of targets) {
    let source = fs.readFileSync(target, "utf8");
    if (source.includes(marker)) continue;
    if (source.includes(oldMarker)) {
      source = source.replace(/\n*\/\/ JVISION_FUNCTIONAL_MODULE_NAVIGATION[\s\S]*?setupModuleNavigation\(\);\s*/m, "\n");
    }
    const insertion = source.lastIndexOf("render();");
    if (insertion < 0) { failures.push(path.relative(root, target)); continue; }
    fs.writeFileSync(target, source.slice(0, insertion) + moduleCode + source.slice(insertion));
    files++;
    touched = true;
  }
  const indexSource = fs.readFileSync(indexFile, "utf8");
  fs.writeFileSync(indexFile, indexSource.replace(/app\.js\?v=[^"']+/g, "app.js?v=distinct-functional-modules-20260722"));
  const nextPage = path.join(projectDir, "app", "page.js");
  if (fs.existsSync(nextPage)) {
    const pageSource = fs.readFileSync(nextPage, "utf8");
    fs.writeFileSync(nextPage, pageSource.replace(/src="\.\/demo-app\.js(?:\?[^\"]*)?"/, 'src="./demo-app.js?v=distinct-functional-modules-20260722"'));
  }
  if (touched) projects++;
}

console.log(JSON.stringify({projects, files, failures}, null, 2));
if (failures.length) process.exitCode = 1;
