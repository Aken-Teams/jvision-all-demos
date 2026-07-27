// JVISION_PRACTICAL_WORKFLOW_V1
function setupPracticalWorkflow() {
  const scenario = config.scenario;
  const buttons = [...document.querySelectorAll(".module-nav button[data-module]")];
  const workspace = document.querySelector(".workspace");
  const topbar = workspace?.querySelector(":scope > .topbar");
  if (!scenario || buttons.length < 4 || !workspace || !topbar) return;

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const asDate = (value) => new Date(`${value}T00:00:00+08:00`);
  const today = asDate(scenario.companyContext.demoDate);
  const stateKey = `jvision-practical-state:${scenario.contentVersion}:${config.id}`;
  const entryKey = `jvision-practical-entry:${scenario.contentVersion}:${config.id}`;
  let selectedRecordId = records.find((item) => !item.done)?.id || records[0]?.id;
  let activeModule = 0;
  let guideIndex = 0;

  try {
    const stored = JSON.parse(localStorage.getItem(stateKey));
    if (Array.isArray(stored?.records)) records = stored.records;
  } catch {}

  const persist = () => {
    saveRecords();
    localStorage.setItem(stateKey, JSON.stringify({ version: scenario.contentVersion, records }));
  };

  const scoreRecord = (record) => {
    if (record.done) return 0;
    const days = Math.round((asDate(record.due) - today) / 86400000);
    const dueWeight = days < 0 ? 42 : days <= 2 ? 34 : days <= 5 ? 18 : 8;
    const riskIndex = scenario.profile.risks.indexOf(record.risk);
    const riskWeight = riskIndex < 0 ? 0 : riskIndex === 0 ? 32 : riskIndex === 1 ? 24 : 14;
    const stageWeight = record.stage === scenario.profile.stages[2] ? 10 : 4;
    return Math.min(99, 16 + dueWeight + riskWeight + stageWeight);
  };

  const normalizeRecords = () => {
    records = records.map((record) => {
      const score = scoreRecord(record);
      return {
        ...record,
        score,
        priority: score >= 75 ? "high" : score >= 50 ? "medium" : "low",
      };
    });
  };
  normalizeRecords();

  workspace.querySelectorAll(":scope > section:not(.practical-workflow-view)").forEach((section) => {
    section.hidden = true;
    section.style.display = "none";
  });

  scenario.modules.forEach((label, index) => {
    const button = buttons[index];
    button.dataset.module = label;
    button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span>${esc(label)}`;
  });

  const modeActions = document.createElement("div");
  modeActions.className = "pw-mode-actions";
  modeActions.innerHTML = `
    <button type="button" class="pw-outline" data-pw-mode="guided">3 分鐘情境導覽</button>
    <button type="button" class="pw-text" data-pw-mode="free">自由操作</button>
    <button type="button" class="pw-text" data-pw-reset>還原示範資料</button>
  `;
  topbar.append(modeActions);

  const view = document.createElement("section");
  view.className = "practical-workflow-view";
  view.setAttribute("aria-live", "polite");
  topbar.insertAdjacentElement("afterend", view);

  const guide = document.createElement("aside");
  guide.className = "pw-guide";
  guide.hidden = true;
  guide.setAttribute("aria-label", "情境導覽");
  workspace.append(guide);
  const guideOverlay = document.createElement("div");
  guideOverlay.className = "pw-guide-overlay";
  guideOverlay.hidden = true;
  workspace.append(guideOverlay);

  const entry = document.createElement("div");
  entry.className = "pw-entry";
  entry.hidden = true;
  entry.innerHTML = `
    <div class="pw-entry-backdrop" data-pw-mode="free"></div>
    <section class="pw-entry-card" role="dialog" aria-modal="true" aria-labelledby="pwEntryTitle">
      <p class="pw-kicker">擬真營運情境 · ${esc(scenario.companyContext.demoDate)}</p>
      <h2 id="pwEntryTitle">${esc(scenario.companyContext.name)}今天遇到一件需要決定的事</h2>
      <p class="pw-entry-event">${esc(scenario.triggerEvent)}</p>
      <div class="pw-entry-context">
        <span>${esc(scenario.companyContext.description)}</span>
        <span>操作角色：${esc(scenario.persona.operator)}</span>
      </div>
      <div class="pw-entry-actions">
        <button type="button" class="pw-primary" data-pw-mode="guided">跟著情境操作</button>
        <button type="button" class="pw-outline" data-pw-mode="free">直接進入系統</button>
      </div>
      <small>${esc(scenario.disclaimer)}</small>
    </section>
  `;
  document.body.append(entry);

  const style = document.createElement("style");
  style.textContent = `
    .practical-workflow-view{display:grid;gap:18px;min-width:0}.pw-mode-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-left:auto}.pw-primary,.pw-outline,.pw-text,.pw-action{min-height:44px;border-radius:11px;padding:10px 15px;font:inherit;font-weight:800;cursor:pointer;transition:border-color .2s,background .2s,color .2s,box-shadow .2s,transform .2s}.pw-primary,.pw-action{border:1px solid var(--accent,#1e40af);background:var(--accent,#1e40af);color:#fff}.pw-outline{border:1px solid var(--accent,#1e40af);background:#fff;color:var(--accent,#1e40af)}.pw-text{border:1px solid transparent;background:transparent;color:var(--accent,#1e40af)}.pw-primary:hover,.pw-action:hover,.pw-outline:hover{box-shadow:0 8px 20px rgba(30,64,175,.16);transform:translateY(-1px)}.pw-primary:focus-visible,.pw-action:focus-visible,.pw-outline:focus-visible,.pw-text:focus-visible,.pw-row:focus-visible{outline:3px solid rgba(217,119,6,.4);outline-offset:2px}.pw-hero,.pw-panel,.pw-metric{border:1px solid var(--line,#d8e2ee);background:var(--panel,#fff);border-radius:18px}.pw-hero{padding:24px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:start}.pw-kicker{margin:0 0 7px;color:var(--accent,#1e40af);font-size:12px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.pw-hero h2{margin:0;font-size:clamp(24px,3vw,36px);line-height:1.12}.pw-description{margin:9px 0 0;color:var(--muted,#64748b);font-size:15px;line-height:1.65}.pw-context{display:grid;gap:6px;min-width:250px;padding:14px;border-left:3px solid #d97706;background:#fffbeb;border-radius:0 12px 12px 0}.pw-context span{font-size:13px;color:#78350f}.pw-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.pw-metric{padding:18px}.pw-metric span,.pw-metric small{display:block;color:var(--muted,#64748b)}.pw-metric strong{display:block;margin:7px 0 3px;font-size:27px}.pw-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(290px,.55fr);gap:18px}.pw-panel{padding:20px;min-width:0}.pw-panel h3{margin:0 0 14px;font-size:18px}.pw-flow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.pw-step{padding:15px;border:1px solid var(--line,#d8e2ee);border-radius:13px;background:color-mix(in srgb,var(--accent,#1e40af) 6%,white)}.pw-step b,.pw-step span{display:block}.pw-step span{margin-top:6px;color:var(--muted,#64748b);font-size:13px;line-height:1.45}.pw-list{display:grid;gap:9px}.pw-row{width:100%;display:grid;grid-template-columns:1fr auto;gap:10px;text-align:left;padding:14px;border:1px solid var(--line,#d8e2ee);border-radius:13px;background:#fff;color:inherit;cursor:pointer;transition:.2s}.pw-row:hover,.pw-row.active{border-color:var(--accent,#1e40af);background:color-mix(in srgb,var(--accent,#1e40af) 5%,white)}.pw-row strong,.pw-row small{display:block}.pw-row small{margin-top:5px;color:var(--muted,#64748b)}.pw-priority{align-self:start;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:850}.pw-priority.high{background:#fee2e2;color:#991b1b}.pw-priority.medium{background:#fef3c7;color:#92400e}.pw-priority.low{background:#dcfce7;color:#166534}.pw-table-wrap{overflow:auto}.pw-table{width:100%;border-collapse:collapse;min-width:700px}.pw-table th,.pw-table td{padding:12px 9px;border-bottom:1px solid var(--line,#d8e2ee);text-align:left;font-size:14px}.pw-table tbody tr{cursor:pointer}.pw-table tbody tr:hover{background:color-mix(in srgb,var(--accent,#1e40af) 5%,white)}.pw-detail dl{display:grid;grid-template-columns:auto 1fr;gap:9px 13px}.pw-detail dt{color:var(--muted,#64748b)}.pw-detail dd{margin:0;font-weight:750}.pw-reasons,.pw-rules{display:grid;gap:10px;padding:0;list-style:none}.pw-reasons li,.pw-rule,.pw-exception{padding:13px;border:1px solid var(--line,#d8e2ee);border-radius:12px}.pw-exception{border-left:4px solid #d97706}.pw-exception+ .pw-exception{margin-top:10px}.pw-rule span{display:block;margin-top:5px;color:var(--muted,#64748b);font-size:13px}.pw-log{display:grid;gap:8px}.pw-log p{margin:0;padding:11px 12px;border-radius:10px;background:#f8fafc;color:#475569}.pw-entry{position:fixed;inset:0;z-index:10020;display:grid;place-items:center;padding:20px}.pw-entry[hidden]{display:none}.pw-entry-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.62);backdrop-filter:blur(7px)}.pw-entry-card{position:relative;width:min(660px,100%);padding:clamp(24px,5vw,42px);border:1px solid #bfdbfe;border-radius:24px;background:#fff;box-shadow:0 30px 80px rgba(15,23,42,.28)}.pw-entry-card h2{margin:0;font-size:clamp(28px,5vw,46px);line-height:1.08;color:#172554}.pw-entry-event{margin:20px 0;padding:17px 18px;border-left:4px solid #d97706;background:#fffbeb;color:#78350f;font-size:17px;line-height:1.6}.pw-entry-context{display:flex;flex-wrap:wrap;gap:8px}.pw-entry-context span{padding:7px 10px;border-radius:999px;background:#eff6ff;color:#1e3a8a;font-size:13px}.pw-entry-actions{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0 16px}.pw-entry-card small{display:block;color:#64748b;line-height:1.5}.pw-guide{position:sticky;bottom:14px;z-index:140;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;margin:18px 0 0;padding:15px 17px;border:1px solid #f59e0b;border-radius:16px;background:#fffdf5;box-shadow:0 18px 45px rgba(120,53,15,.16)}.pw-guide[hidden]{display:none}.pw-guide-index{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:#d97706;color:white;font-weight:900}.pw-guide h3,.pw-guide p{margin:0}.pw-guide h3{font-size:15px}.pw-guide p{margin-top:4px;color:#6b4f1d;font-size:13px}.pw-guide-actions{display:flex;gap:7px}.pw-guide-overlay{position:fixed;inset:0;z-index:110;background:rgba(15,23,42,.45);pointer-events:none}.pw-guide-overlay[hidden]{display:none}.pw-guide-focus{position:relative!important;z-index:120!important;outline:4px solid #f59e0b!important;outline-offset:5px!important;box-shadow:0 0 0 9px rgba(245,158,11,.25),0 18px 45px rgba(15,23,42,.3)!important;background-color:#fff!important}.pw-guide-focus::after{content:attr(data-pw-guide-hint);position:absolute;left:12px;bottom:calc(100% + 12px);padding:8px 12px;border-radius:9px;background:#f59e0b;color:#3b2200;font-size:13px;font-weight:900;white-space:nowrap;box-shadow:0 8px 24px rgba(120,53,15,.25)}.pw-disclaimer{margin:0;padding:12px 14px;border-radius:12px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.5}@media(max-width:980px){.pw-metrics,.pw-flow{grid-template-columns:repeat(2,minmax(0,1fr))}.pw-grid{grid-template-columns:1fr}.pw-hero{grid-template-columns:1fr}.pw-context{min-width:0}.pw-mode-actions{width:100%;justify-content:flex-start}}@media(max-width:600px){.practical-workflow-view{padding-top:52px}.pw-metrics,.pw-flow{grid-template-columns:1fr}.pw-hero,.pw-panel{padding:16px}.pw-guide{grid-template-columns:auto 1fr}.pw-guide-actions{grid-column:1/-1}.pw-guide-actions button{flex:1}.pw-entry-actions{display:grid}.pw-entry-actions button{width:100%}.pw-guide-focus::after{position:fixed;left:12px;right:12px;top:12px;bottom:auto;white-space:normal}}@media(prefers-reduced-motion:reduce){.pw-primary,.pw-outline,.pw-action,.pw-row{transition:none}.pw-primary:hover,.pw-action:hover,.pw-outline:hover{transform:none}}
  `;
  document.head.append(style);

  const currentMetrics = () => {
    const open = records.filter((record) => !record.done);
    const high = open.filter((record) => scoreRecord(record) >= 75);
    const quantity = records.reduce((sum, record) => sum + Number(record.quantity || 0), 0);
    const approval = open.filter((record) => record.stage === scenario.profile.stages[2]).length;
    return scenario.metrics.map((metric, index) => ({
      ...metric,
      value: [open.length, high.length, quantity, approval][index],
    }));
  };

  const hero = (title, description = scenario.dailyUse) => `
    <header class="pw-hero">
      <div>
        <p class="pw-kicker">${esc(scenario.companyContext.name)} · ${esc(scenario.persona.operator)}</p>
        <h2>${esc(title)}</h2>
        <p class="pw-description">${esc(description)}</p>
      </div>
      <div class="pw-context">
        <span><b>今日事件</b>｜${esc(scenario.triggerEvent)}</span>
        <span><b>需要決定</b>｜${esc(scenario.primaryAction)}</span>
      </div>
    </header>
  `;

  const metricsMarkup = () => `<div class="pw-metrics">${currentMetrics().map((metric) => `
    <article class="pw-metric"><span>${esc(metric.label)}</span><strong>${esc(metric.value)} <small>${esc(metric.unit)}</small></strong><small>${esc(metric.explanation)}</small></article>
  `).join("")}</div>`;

  const priorityLabel = (record) => record.priority === "high" ? "優先處理" : record.priority === "medium" ? "持續追蹤" : "一般";
  const sortedOpen = () => records.filter((record) => !record.done).sort((a, b) => scoreRecord(b) - scoreRecord(a) || a.due.localeCompare(b.due));

  function dashboard() {
    const urgent = sortedOpen().slice(0, 4);
    view.innerHTML = hero(`${scenario.modules[0]}｜今天先處理哪一件事`) + metricsMarkup() + `
      <div class="pw-grid">
        <article class="pw-panel"><h3>從事件到結果的四步驟</h3><div class="pw-flow">${scenario.workflow.map((step) => `<div class="pw-step"><b>${esc(step.label)}</b><span>${esc(step.outcome)}</span></div>`).join("")}</div></article>
        <article class="pw-panel"><h3>依規則排序的待辦</h3><div class="pw-list">${urgent.map((record) => `<button type="button" class="pw-row" data-pw-record="${esc(record.id)}"><span><strong>${esc(record.title)}</strong><small>${esc(record.due)} · ${esc(record.owner)}</small></span><span class="pw-priority ${esc(record.priority)}">${priorityLabel(record)}</span></button>`).join("")}</div></article>
      </div>`;
  }

  function recordDetail(record) {
    if (!record) return `<p class="pw-description">請選擇一筆${esc(scenario.profile.object)}。</p>`;
    const nextIndex = Math.min(scenario.profile.stages.indexOf(record.stage) + 1, scenario.profile.stages.length - 1);
    const nextStage = scenario.profile.stages[nextIndex];
    return `<h3>${esc(record.title)}</h3><p class="pw-description">${esc(record.target)}</p><dl><dt>目前階段</dt><dd>${esc(record.stage)}</dd><dt>期限</dt><dd>${esc(record.due)}</dd><dt>負責人</dt><dd>${esc(record.owner)}</dd><dt>異常</dt><dd>${esc(record.risk)}</dd></dl><h3>為什麼排在這裡</h3><ul class="pw-reasons">${record.decisionReasons.map((reason) => `<li>${esc(reason)}</li>`).join("")}</ul>${record.done ? "" : `<button type="button" class="pw-action" data-pw-advance="${esc(record.id)}" data-next-stage="${esc(nextStage)}">推進至「${esc(nextStage)}」</button>`}`;
  }

  function cases() {
    const selected = records.find((record) => record.id === selectedRecordId) || records[0];
    view.innerHTML = hero(`${scenario.modules[1]}｜把責任、期限與狀態放在一起`) + `
      <div class="pw-grid">
        <article class="pw-panel"><div class="pw-table-wrap"><table class="pw-table"><thead><tr><th>${esc(scenario.profile.object)}</th><th>階段</th><th>負責人</th><th>期限</th><th>異常</th></tr></thead><tbody>${records.map((record) => `<tr data-pw-record="${esc(record.id)}"><td><strong>${esc(record.title)}</strong></td><td>${esc(record.stage)}</td><td>${esc(record.owner)}</td><td>${esc(record.due)}</td><td>${esc(record.risk)}</td></tr>`).join("")}</tbody></table></div></article>
        <article class="pw-panel pw-detail" id="pwDetail">${recordDetail(selected)}</article>
      </div>`;
  }

  function exceptions() {
    const exceptionRecords = sortedOpen().filter((record) => record.priority === "high").slice(0, 4);
    view.innerHTML = hero(`${scenario.modules[2]}｜只把需要人工決定的例外往上送`) + `
      <div class="pw-grid">
        <article class="pw-panel"><h3>今天需要處置的例外</h3>${exceptionRecords.map((record) => `<section class="pw-exception"><p class="pw-kicker">${esc(record.risk)} · ${esc(record.due)}</p><h3>${esc(record.title)}</h3><p class="pw-description">${esc(record.statusNote)}</p><button type="button" class="pw-action" data-pw-resolve="${esc(record.id)}">${esc(scenario.primaryAction)}</button></section>`).join("") || "<p>目前沒有高優先例外。</p>"}</article>
        <article class="pw-panel"><h3>處置原則</h3><div class="pw-rules">${scenario.decisionRules.map((item) => `<div class="pw-rule"><b>${esc(item.id)}</b> ${esc(item.rule)}<span>資料依據：${esc(item.evidence)}</span></div>`).join("")}</div></article>
      </div>`;
  }

  function evidence() {
    const recommendations = sortedOpen().slice(0, 3);
    view.innerHTML = hero(`${scenario.modules[3]}｜每項建議都能回到資料與規則`) + `
      <div class="pw-grid">
        <article class="pw-panel"><h3>目前排序結果</h3><div class="pw-list">${recommendations.map((record, index) => `<div class="pw-row"><span><strong>${index + 1}. ${esc(record.title)}</strong><small>${esc(record.decisionReasons.join("；"))}</small></span><span class="pw-priority ${esc(record.priority)}">${priorityLabel(record)}</span></div>`).join("")}</div><button type="button" class="pw-outline" id="pwRecalculate">依相同規則重新計算</button></article>
        <article class="pw-panel"><h3>操作紀錄</h3><div class="pw-log" id="pwLog">${logs.slice(0, 6).map((item) => `<p>${esc(item)}</p>`).join("")}</div></article>
      </div><p class="pw-disclaimer">${esc(scenario.disclaimer)}</p>`;
  }

  const renderers = [dashboard, cases, exceptions, evidence];
  function activate(index, focus = false) {
    activeModule = Math.max(0, Math.min(3, index));
    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === activeModule;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
      button.setAttribute("aria-pressed", String(active));
    });
    normalizeRecords();
    renderers[activeModule]();
    document.body.dataset.activeModuleIndex = String(activeModule);
    document.body.dataset.activeModule = scenario.modules[activeModule];
    if (focus) view.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderGuide() {
    const step = scenario.guidedSteps[guideIndex];
    guide.innerHTML = `<span class="pw-guide-index">${guideIndex + 1}</span><div><h3>${esc(step.title)}</h3><p>${esc(step.instruction)}</p></div><div class="pw-guide-actions"><button type="button" class="pw-text" data-guide-action="close" data-jv-feedback="off">結束導覽</button><button type="button" class="pw-primary" data-guide-action="next" data-jv-feedback="off">${guideIndex === scenario.guidedSteps.length - 1 ? "完成" : "下一步"}</button></div>`;
    activate(step.module, true);
    document.querySelector(".pw-guide-focus")?.classList.remove("pw-guide-focus");
    document.querySelector("[data-pw-guide-hint]")?.removeAttribute("data-pw-guide-hint");
    guideOverlay.hidden = false;
    const selectors = [".pw-metrics", "[data-pw-record]", "[data-pw-resolve]", "#pwRecalculate"];
    const target = view.querySelector(selectors[step.module] || ".pw-hero");
    if (target) {
      target.classList.add("pw-guide-focus");
      target.dataset.pwGuideHint = `步驟 ${guideIndex + 1}｜請操作這個區域`;
      target.scrollIntoView({ behavior:"smooth", block:"center" });
    }
  }

  function clearGuideFocus() {
    document.querySelector(".pw-guide-focus")?.classList.remove("pw-guide-focus");
    document.querySelector("[data-pw-guide-hint]")?.removeAttribute("data-pw-guide-hint");
    guideOverlay.hidden = true;
  }

  function startGuided() {
    entry.hidden = true;
    localStorage.setItem(entryKey, "guided");
    guideIndex = 0;
    guide.hidden = false;
    renderGuide();
  }

  function startFree() {
    entry.hidden = true;
    guide.hidden = true;
    clearGuideFocus();
    localStorage.setItem(entryKey, "free");
    activate(0, true);
  }

  buttons.forEach((button, index) => button.addEventListener("click", () => activate(index, true)));
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-pw-reset]")) {
      records = JSON.parse(JSON.stringify(config.records));
      selectedRecordId = records.find((item) => !item.done)?.id || records[0]?.id;
      persist();
      addLog("已還原擬真示範資料，可重新操作完整情境。");
      activate(activeModule, true);
      return;
    }
    const mode = event.target.closest("[data-pw-mode]")?.dataset.pwMode;
    if (mode === "guided") startGuided();
    if (mode === "free") startFree();
  });

  guide.addEventListener("click", (event) => {
    const action = event.target.closest("[data-guide-action]")?.dataset.guideAction;
    if (action === "close") { guide.hidden = true; clearGuideFocus(); }
    if (action === "next") {
      if (guideIndex >= scenario.guidedSteps.length - 1) {
        guide.hidden = true;
        clearGuideFocus();
        activate(3, true);
      } else {
        guideIndex += 1;
        renderGuide();
      }
    }
  });

  view.addEventListener("click", (event) => {
    const recordId = event.target.closest("[data-pw-record]")?.dataset.pwRecord;
    if (recordId) {
      selectedRecordId = recordId;
      if (activeModule !== 1) activate(1, true);
      else document.querySelector("#pwDetail").innerHTML = recordDetail(records.find((record) => record.id === recordId));
      return;
    }
    const advance = event.target.closest("[data-pw-advance]");
    if (advance) {
      records = records.map((record) => record.id === advance.dataset.pwAdvance ? {
        ...record,
        stage: advance.dataset.nextStage,
        done: advance.dataset.nextStage === scenario.profile.stages.at(-1),
        statusNote: `已由 ${scenario.persona.operator} 推進至 ${advance.dataset.nextStage}`,
      } : record);
      persist();
      addLog(`${records.find((record) => record.id === advance.dataset.pwAdvance)?.title} 已推進至 ${advance.dataset.nextStage}。`);
      cases();
      return;
    }
    const resolve = event.target.closest("[data-pw-resolve]");
    if (resolve) {
      records = records.map((record) => record.id === resolve.dataset.pwResolve ? {
        ...record,
        risk: "已完成處置",
        stage: scenario.profile.stages[2],
        statusNote: `${scenario.primaryAction}已完成，等待最終確認`,
      } : record);
      normalizeRecords();
      persist();
      addLog(`${records.find((record) => record.id === resolve.dataset.pwResolve)?.title} 已完成例外處置並送交確認。`);
      exceptions();
      return;
    }
    if (event.target.closest("#pwRecalculate")) {
      normalizeRecords();
      persist();
      addLog(`已依 ${scenario.decisionRules.length} 條公開規則重新計算，輸入相同則排序相同。`);
      evidence();
    }
  });

  const params = new URLSearchParams(location.search);
  const requestedMode = params.get("mode");
  activate(0);
  if (requestedMode === "guided") startGuided();
  else if (requestedMode === "free") startFree();
  else entry.hidden = Boolean(localStorage.getItem(entryKey));
}

setupPracticalWorkflow();
