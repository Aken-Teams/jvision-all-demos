import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalog = JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"));
const marker = "JVISION_PROJECT_PEOPLE_MODULES";

const moduleMap = {
  1301: ["人員主檔", "組織與職位", "人事異動", "AI 人才洞察"],
  1302: ["薪資總覽", "考勤與計薪", "薪資覆核", "AI 薪資檢核"],
  1303: ["出勤總覽", "打卡異常", "假勤簽核", "AI 排班建議"],
  1304: ["班表總覽", "班次配置", "換班申請", "AI 智慧排班"],
  1305: ["招募總覽", "職缺管理", "候選人流程", "AI 履歷媒合"],
  1306: ["課程總覽", "課程與班級", "學習紀錄", "AI 學習建議"],
  1307: ["績效總覽", "目標設定", "考核校準", "AI 績效洞察"],
  1308: ["人才總覽", "職能盤點", "繼任梯隊", "AI 發展建議"],
  1309: ["員工服務台", "個人資料", "申請與查詢", "AI 員工助理"],
  1310: ["移工總覽", "證件效期", "宿舍與工時", "AI 合規提醒"],
  1311: ["需求總覽", "人力需求", "供需缺口", "AI 需求預測"],
  1312: ["合規總覽", "法規條款", "工時稽核", "AI 合規檢查"],
  1313: ["安衛總覽", "危害巡檢", "事故與改善", "AI 風險預警"],
  1314: ["關懷總覽", "員工脈動", "離職風險", "AI 留才建議"],
  1315: ["宿舍總覽", "床位配置", "入住與報修", "AI 宿舍調度"],
  1316: ["獎懲總覽", "獎懲案件", "審議與公告", "AI 公平性檢核"],
  1317: ["組織總覽", "部門與職位", "編制異動", "AI 組織診斷"],
  1318: ["報到總覽", "報到任務", "文件與訓練", "AI 到職助理"],
  1319: ["簽核總覽", "待辦申請", "簽核流程", "AI 簽核摘要"],
  1320: ["成本總覽", "人力成本", "預算與差異", "AI 成本洞察"]
};

function extractConfig(html) {
  const match = html.match(/window\.DEMO_CONFIG\s*=\s*(\{[\s\S]*?\});\s*window\.SYSTEM_PRESET/);
  return match ? JSON.parse(match[1]) : null;
}

function runtime(profile) {
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
  return `\n\n// ${marker}_START\n${setupProjectPeopleModules.toString()}\nsetupProjectPeopleModules(${JSON.stringify(profile)});\n// ${marker}_END\n`;
}

const rows = [];
for (const project of catalog.projects.filter((item) => moduleMap[item.id])) {
  const indexFile = path.join(root, project.localPath, "index.html");
  if (!fs.existsSync(indexFile)) continue;
  const html = fs.readFileSync(indexFile, "utf8");
  const config = extractConfig(html);
  if (!config) {
    rows.push({ repoName: project.repoName, status: "missing-config" });
    continue;
  }
  const workflow = String(config.spec?.workflow || "").split(/\s*(?:→|->)\s*/).filter(Boolean);
  const functions = (config.spec?.functions || []).slice(0, 6);
  const pains = (config.spec?.pains || []).slice(0, 4);
  const ai = (config.spec?.ai || []).slice(0, 3);
  const roles = String(config.spec?.departments || "人資部、營運主管").split(/[、,，]/).filter(Boolean).slice(0, 4);
  const metrics = String(config.spec?.kpi || "待處理、完成率、異常數、處理時效").split(/[、,，]/).filter(Boolean).slice(0, 4);
  const profile = {
    id: project.id,
    name: project.title,
    description: config.description || project.description,
    modules: moduleMap[project.id],
    functions: functions.length ? functions : ["建立作業資料", "確認負責角色", "執行作業", "完成覆核"],
    workflows: workflow.length ? workflow : ["建立資料", "確認內容", "主管覆核", "完成歸檔"],
    pains: pains.length ? pains : ["資料分散且難以即時追蹤"],
    ai: ai.length ? ai : ["找出優先處理項目", "預測可能的流程風險"],
    roles: roles.length ? roles : ["人資部", "營運主管"],
    metrics: [...metrics, "完成率", "待處理"].slice(0, 4),
    fields: config.profile?.fields || ["對象", "期限", "狀態", "負責人"]
  };
  for (const file of [path.join(root, project.localPath, "app.js"), path.join(root, project.localPath, "public", "demo-app.js")]) {
    if (!fs.existsSync(file)) continue;
    let source = fs.readFileSync(file, "utf8");
    source = source.replace(new RegExp(`\\n*// ${marker}_START[\\s\\S]*?// ${marker}_END\\n`, "m"), "\n");
    const insertion = source.lastIndexOf("render();");
    if (insertion < 0) continue;
    source = `${source.slice(0, insertion)}${runtime(profile)}${source.slice(insertion)}`;
    fs.writeFileSync(file, source);
  }
  fs.writeFileSync(indexFile, html.replace(/app\.js\?v=[^"']+/g, "app.js?v=project-people-modules-20260727-2"));
  const pageFile = path.join(root, project.localPath, "app", "page.js");
  if (fs.existsSync(pageFile)) {
    const pageSource = fs.readFileSync(pageFile, "utf8");
    fs.writeFileSync(pageFile, pageSource.replace(/demo-app\.js\?v=[^"']+/g, "demo-app.js?v=project-people-modules-20260727-2").replaceAll("\r\n", "\n"));
  }
  rows.push({ repoName: project.repoName, status: "updated", modules: profile.modules });
}

const report = { generatedAt: new Date().toISOString(), total: rows.length, updated: rows.filter((row) => row.status === "updated").length, rows };
fs.writeFileSync(path.join(root, "docs", "PEOPLE_SPECIFIC_MODULES_REPORT.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ total: report.total, updated: report.updated }, null, 2));
