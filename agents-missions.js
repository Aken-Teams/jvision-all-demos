/* 任務指揮中心 — 3 個示範案例（資料驅動）。依賴 agents.js 的 AGENTS / agentById。 */

const MISSION_CASES = {
  "1": {
    code: "MT-2048",
    title: "導入生產排程",
    objective: "導入一套生產排程系統，並評估導入 ROI 與風險",
    step: "協作中 · 第 4／7 步",
    progress: 57,
    stats: { agents: 6, steps: 12, deliverables: 4 },
    tasks: [
      { name: "理解需求", agentId: "orchestrator", state: "done" },
      { name: "盤點系統", agentId: "matchmaker", state: "done" },
      { name: "產業分析", agentId: "expert", state: "active" },
      { name: "撰寫規格", agentId: "drafter", state: "idle" },
      { name: "ROI 試算", agentId: "abacus", state: "idle" },
      { name: "合規審核", agentId: "guardian", state: "pending" },
    ],
    graph: [
      { agentId: "expert", state: "active" },
      { agentId: "drafter", state: "idle" },
      { agentId: "guardian", state: "pending" },
      { agentId: "abacus", state: "idle" },
    ],
    log: [
      { who: "智策", tag: "Orchestrator", color: "brand", time: "10:42:01", text: "已將需求拆為 6 項子任務，啟動「選配」與「行家」先行。" },
      { who: "選配", tag: "Matchmaker", color: "violet", time: "10:45:12", text: "比對 463 套系統，推薦「生產工單管理」等 3 套排程軟體 (APS)，已生成比較矩陣。", file: "output_matrix_v1.csv (1.2KB)" },
      { who: "行家", tag: "Domain Expert", color: "violet", time: "10:46:20", text: "針對製造業指出 3 大痛點，建議排程引擎與預警規則解耦。" },
      { who: "算盤", tag: "ROI", color: "brand", time: "10:47:04", text: "依產線資料試算：預估交期達成率 +18%、庫存周轉 +11%。" },
      { who: "守衡", tag: "Compliance", color: "amber", time: "10:48:05", alert: true, text: "⚠ 偵測到「自動改派生產線」屬高度敏感決策，違反資安原則 C-402，已標記需人工覆核。" },
    ],
    deliverables: [
      { title: "推薦系統清單", agentId: "matchmaker", icon: "description", status: "done", desc: "3 套 APS 系統比較矩陣" },
      { title: "導入規格草稿", agentId: "drafter", icon: "edit_document", status: "draft", desc: "第一階段系統整合規格書" },
      { title: "ROI 試算表", agentId: "abacus", icon: "analytics", status: "done", desc: "預估 3 年投資回報與成本結構" },
      { title: "風險與合規清單", agentId: "guardian", icon: "policy", status: "pending", desc: "含 1 項高度敏感風險：自動改派生產線需覆核。" },
    ],
    audit: [
      { time: "10:48:05", agentId: "guardian", action: "阻擋自動決策，標記人工覆核", reason: "「自動改派生產線」違反內部資安政策 C-402（核心排程不可無人介入修改）。", kind: "pending", label: "待覆核" },
      { time: "10:45:12", agentId: "matchmaker", action: "縮減選擇範圍至 3 套系統", reason: "依規模（500–1000 人）、預算（< 500 萬）、需支援 MES API，從 463 套剔除不合者。", kind: "done", label: "已執行" },
      { time: "10:42:01", agentId: "orchestrator", action: "建立任務 DAG（有向無環圖）", reason: "解析意圖，判定需要「產業標竿、財務試算、資安合規」三領域，拆為 6 步驟。", kind: "done", label: "已執行" },
    ],
  },

  "2": {
    code: "MT-2091",
    title: "組織碳盤查",
    objective: "盤查工廠碳排放並找出可行的減碳機會",
    step: "協作中 · 第 5／7 步",
    progress: 68,
    stats: { agents: 6, steps: 14, deliverables: 4 },
    tasks: [
      { name: "界定盤查範疇", agentId: "orchestrator", state: "done" },
      { name: "蒐集能耗數據", agentId: "seeder", state: "done" },
      { name: "排放熱點分析", agentId: "expert", state: "active" },
      { name: "減碳措施評估", agentId: "abacus", state: "idle" },
      { name: "減碳路線規劃", agentId: "supervisor", state: "idle" },
      { name: "數據合規查核", agentId: "guardian", state: "pending" },
    ],
    graph: [
      { agentId: "expert", state: "active" },
      { agentId: "seeder", state: "idle" },
      { agentId: "supervisor", state: "idle" },
      { agentId: "guardian", state: "pending" },
    ],
    log: [
      { who: "智策", tag: "Orchestrator", color: "brand", time: "09:02:10", text: "已將盤查拆為 6 項子任務，先請「填實」彙整各項能耗來源。" },
      { who: "填實", tag: "Data Seeder", color: "brand", time: "09:05:33", text: "匯入 12 個月電力、燃料與製程用量，建立範疇一／二／三排放清冊。", file: "energy_inventory.csv (3.4KB)" },
      { who: "行家", tag: "Domain Expert", color: "violet", time: "09:07:48", text: "依製造業排放係數，標出 3 大排放熱點：熔煉爐、空壓系統、廠務冰水主機。" },
      { who: "算盤", tag: "ROI", color: "brand", time: "09:09:12", text: "試算導入變頻與熱回收：預估年減碳 8.4%、投資回收期約 2.3 年。" },
      { who: "守衡", tag: "Compliance", color: "amber", time: "09:10:40", alert: true, text: "⚠ 範疇三上游數據來源不足，影響揭露準確性，已標記需環安主管確認。" },
    ],
    deliverables: [
      { title: "盤查範疇清冊", agentId: "seeder", icon: "dataset", status: "done", desc: "範疇一／二／三排放來源與活動數據" },
      { title: "排放熱點分析", agentId: "expert", icon: "local_fire_department", status: "done", desc: "3 大高排放製程與占比" },
      { title: "減碳路線圖", agentId: "supervisor", icon: "route", status: "draft", desc: "短中長期減碳措施與里程碑" },
      { title: "數據合規查核", agentId: "guardian", icon: "policy", status: "pending", desc: "範疇三上游數據覆蓋率不足，需人工確認。" },
    ],
    audit: [
      { time: "09:10:40", agentId: "guardian", action: "標記範疇三數據需人工確認", reason: "上游供應商排放數據覆蓋率不足 60%，影響 ISO 14064 揭露準確性。", kind: "pending", label: "待覆核" },
      { time: "09:07:48", agentId: "expert", action: "鎖定 3 大排放熱點", reason: "依製造業排放係數比對能耗結構，熔煉與空壓系統占總排放 61%。", kind: "done", label: "已執行" },
      { time: "09:02:10", agentId: "orchestrator", action: "建立盤查任務 DAG", reason: "判定需要數據彙整、熱點分析、減碳試算三領域，拆為 6 步驟。", kind: "done", label: "已執行" },
    ],
  },

  "3": {
    code: "MT-2130",
    title: "客訴根因分析",
    objective: "這個月客訴量激增，找出根因並提出對策與追蹤計畫",
    step: "協作中 · 第 3／6 步",
    progress: 45,
    stats: { agents: 6, steps: 9, deliverables: 4 },
    tasks: [
      { name: "分類客訴", agentId: "orchestrator", state: "done" },
      { name: "彙整客訴紀錄", agentId: "auditor", state: "done" },
      { name: "根因分析", agentId: "expert", state: "active" },
      { name: "對策研擬", agentId: "drafter", state: "idle" },
      { name: "追蹤時程", agentId: "scheduler", state: "idle" },
      { name: "權限與合規", agentId: "guardian", state: "pending" },
    ],
    graph: [
      { agentId: "auditor", state: "idle" },
      { agentId: "expert", state: "active" },
      { agentId: "drafter", state: "idle" },
      { agentId: "guardian", state: "pending" },
    ],
    log: [
      { who: "智策", tag: "Orchestrator", color: "brand", time: "14:20:05", text: "已將客訴分析拆為 6 步，先請「明鏡」彙整近 30 天客訴工單。" },
      { who: "明鏡", tag: "Auditor", color: "brand", time: "14:23:18", text: "彙整 218 筆客訴並聚類為 4 類，「出貨延遲」占 47% 為最大宗。", file: "complaints_30d.csv (5.1KB)" },
      { who: "行家", tag: "Domain Expert", color: "violet", time: "14:26:02", text: "交叉產線與物流資料，根因指向包裝線人力不足＋尖峰排程衝突。" },
      { who: "擬稿", tag: "Spec Writer", color: "brand", time: "14:28:40", text: "研擬 3 項對策：增派包裝人力、調整尖峰排程、開通主動出貨通知。" },
      { who: "守衡", tag: "Compliance", color: "amber", time: "14:30:26", alert: true, text: "⚠ 「主動退款補償」涉及財務授權，已標記需客服主管核可。" },
    ],
    deliverables: [
      { title: "客訴根因樹", agentId: "auditor", icon: "account_tree", status: "done", desc: "4 類客訴與根因層級展開" },
      { title: "對策清單", agentId: "drafter", icon: "checklist", status: "draft", desc: "3 項對策與預期成效" },
      { title: "追蹤時程表", agentId: "scheduler", icon: "calendar_month", status: "draft", desc: "對策負責人、期限與檢核點" },
      { title: "權限與合規清單", agentId: "guardian", icon: "policy", status: "pending", desc: "退款補償超出授權上限，需人工核可。" },
    ],
    audit: [
      { time: "14:30:26", agentId: "guardian", action: "標記退款補償需人工核可", reason: "補償金額超過客服授權上限，涉及財務政策 F-210。", kind: "pending", label: "待覆核" },
      { time: "14:23:18", agentId: "auditor", action: "完成客訴聚類", reason: "以語意分群將 218 筆客訴歸為 4 類，分群準確度 91%。", kind: "done", label: "已執行" },
      { time: "14:20:05", agentId: "orchestrator", action: "建立分析任務 DAG", reason: "判定需要資料彙整、根因分析、對策與排程四領域，拆為 6 步驟。", kind: "done", label: "已執行" },
    ],
  },
};

/* ---------- render ---------- */
const _STATE = {
  done:    { wrap: "bg-soft border-line/60", icon: `<span class="w-7 h-7 rounded-full bg-success text-white grid place-content-center shrink-0"><span class="material-symbols-outlined text-[15px]">check</span></span>`, sub: (n) => `<div class="text-[11px] text-muted">${n} Agent</div>`, title: "text-ink" },
  active:  { wrap: "bg-white border-brand/30 shadow-sm", sub: (n) => `<div class="text-[11px] text-violet font-semibold">${n} Agent 執行中…</div>`, title: "text-brand" },
  idle:    { wrap: "hover:bg-soft", icon: `<span class="w-7 h-7 rounded-full bg-soft border border-line grid place-content-center shrink-0"><span class="w-2 h-2 rounded-full bg-idle"></span></span>`, sub: (n) => `<div class="text-[11px] text-muted/80">${n} Agent 待命</div>`, title: "text-muted" },
  pending: { wrap: "hover:bg-soft", icon: `<span class="w-7 h-7 rounded-full bg-amber/10 border border-amber/40 grid place-content-center shrink-0"><span class="w-2 h-2 rounded-full bg-amber"></span></span>`, sub: (n) => `<div class="text-[11px] text-amber font-semibold">${n} · 待人工覆核</div>`, title: "text-ink font-semibold" },
};
const _DELIV = {
  done:    { tag: `<span class="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded border border-success/20">完成</span>`, box: "border-line", ico: "bg-success/10 text-success" },
  draft:   { tag: `<span class="text-[10px] font-bold text-muted bg-soft px-1.5 py-0.5 rounded border border-line">草稿</span>`, box: "border-line border-dashed", ico: "bg-soft text-muted" },
  pending: { tag: `<span class="text-[10px] font-bold text-amber bg-amber/20 px-1.5 py-0.5 rounded border border-amber/40">待審核</span>`, box: "border-amber/50", ico: "bg-amber/20 text-amber" },
};

function renderMission() {
  const id = new URLSearchParams(location.search).get("case") || "1";
  const c = MISSION_CASES[id] || MISSION_CASES["1"];
  const $ = (s) => document.querySelector(s);
  const setText = (s, t) => { const e = $(s); if (e) e.textContent = t; };
  const setHTML = (s, h) => { const e = $(s); if (e) e.innerHTML = h; };

  document.title = `${c.title} · 任務指揮中心 — JVision`;
  setText("#missCode", `MISSION CONTROL · 任務 #${c.code}`);
  setText("#missObjective", c.objective);
  setText("#missStep", c.step);
  setText("#statAgents", c.stats.agents);
  setText("#statSteps", c.stats.steps);
  setText("#statDeliv", c.stats.deliverables);
  $("#taskBar").style.width = c.progress + "%";
  setText("#taskPct", c.progress + "%");

  // case tabs
  setHTML("#caseTabs", Object.entries(MISSION_CASES).map(([k, m]) =>
    `<a href="./agents-mission?case=${k}" class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${k === id ? "bg-brand text-white border-brand" : "bg-white text-body border-line hover:border-brand2 hover:text-brand"}">${m.title}</a>`
  ).join(""));

  // task tree
  setHTML("#taskTree", c.tasks.map((t) => {
    const a = agentById(t.agentId) || { name: t.agentId, icon: "smart_toy" };
    const st = _STATE[t.state];
    const icon = st.icon || `<span class="w-7 h-7 rounded-full bg-violet/10 text-violet grid place-content-center shrink-0 ring-2 ring-success/40"><span class="material-symbols-outlined text-[15px]">${a.icon}</span></span>`;
    const activeDot = t.state === "active" ? `<span class="w-2 h-2 rounded-full bg-success"></span>` : "";
    return `<div class="flex items-start gap-2.5 p-2 rounded-lg border border-transparent ${st.wrap} transition-colors">
      ${icon}
      <div class="w-full"><div class="flex justify-between items-center"><div class="text-[13px] font-bold ${st.title}">${t.name}</div>${activeDot}</div>${st.sub(a.name)}</div>
    </div>`;
  }).join(""));

  // graph outer nodes
  const pos = ["top-[16%] left-[8%]", "top-[16%] right-[8%]", "bottom-[14%] left-[12%]", "bottom-[14%] right-[12%]"];
  setHTML("#graphNodes", c.graph.map((g, i) => {
    const a = agentById(g.agentId) || { name: g.agentId, icon: "smart_toy" };
    const ring = g.state === "active" ? "ring-2 ring-success/40 text-violet" : g.state === "pending" ? "ring-2 ring-amber/50 text-amber" : "text-muted";
    const op = g.state === "idle" ? "opacity-60" : "";
    const nameCls = g.state === "pending" ? "text-amber font-bold" : "text-muted font-semibold";
    return `<div class="absolute ${pos[i]} flex flex-col items-center ${op}"><div class="w-8 h-8 rounded-full bg-white border border-line grid place-content-center shadow-sm ${ring} z-20"><span class="material-symbols-outlined text-[16px]">${a.icon}</span></div><span class="text-[10px] mt-1 ${nameCls}">${a.name}</span></div>`;
  }).join(""));

  // deliverables
  setHTML("#deliverList", c.deliverables.map((d) => {
    const a = agentById(d.agentId) || { name: d.agentId };
    const m = _DELIV[d.status];
    const amber = d.status === "pending";
    return `<div class="rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer flex items-start gap-3 relative overflow-hidden border ${m.box}" ${amber ? "style=\"background:#fffbeb\"" : ""}>
      ${amber ? '<span class="absolute top-0 left-0 w-1 h-full bg-amber"></span>' : ""}
      <span class="mt-0.5 ${amber ? "ml-1 " : ""}w-8 h-8 ${m.ico} rounded grid place-content-center shrink-0"><span class="material-symbols-outlined text-[20px]">${d.icon}</span></span>
      <div class="flex-grow"><div class="flex justify-between items-start"><h4 class="text-[14px] font-bold ${amber ? "text-amber" : "text-ink"} leading-tight">${d.title}</h4>${m.tag}</div>
      <p class="text-xs ${amber ? "text-body" : "text-muted"} mt-1 mb-2">${d.desc}</p>
      <div class="flex items-center gap-1 text-[10px] text-muted"><span class="material-symbols-outlined text-[12px]">smart_toy</span> ${a.name} Agent ${d.status === "draft" ? "撰寫中…" : d.status === "pending" ? "標記" : "產出"}</div></div>
    </div>`;
  }).join(""));

  // audit
  setHTML("#auditBody", c.audit.map((r) => {
    const a = agentById(r.agentId) || { name: r.agentId };
    const isO = r.agentId === "orchestrator";
    const badge = isO ? `<span class="w-6 h-6 rounded bg-brand text-white grid place-content-center text-[10px] font-bold">${a.name[0]}</span>`
      : r.kind === "pending" ? `<span class="w-6 h-6 rounded bg-amber/20 text-amber grid place-content-center"><span class="material-symbols-outlined text-[13px]">gavel</span></span>`
      : `<span class="w-6 h-6 rounded bg-violet/15 text-violet grid place-content-center text-[10px] font-bold">${a.name[0]}</span>`;
    const nameCls = isO ? "font-bold text-brand" : r.kind === "pending" ? "font-bold text-amber" : "font-semibold";
    const statusTag = r.kind === "pending" ? `<span class="text-amber bg-amber/10 border border-amber/40 px-2 py-0.5 rounded text-[10px] font-bold">${r.label}</span>` : `<span class="text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded text-[10px] font-bold">${r.label}</span>`;
    return `<tr class="hover:bg-soft transition-colors">
      <td class="px-4 py-3 font-mono text-xs text-muted">${r.time}</td>
      <td class="px-4 py-3"><div class="flex items-center gap-2">${badge}<span class="${nameCls}">${a.name}</span></div></td>
      <td class="px-4 py-3 font-semibold">${r.action}</td>
      <td class="px-4 py-3 text-muted text-xs">${r.reason}</td>
      <td class="px-4 py-3">${statusTag}</td>
    </tr>`;
  }).join(""));

  // live log (animated)
  playLog(c.log);
}

/* progressive live log */
let _logTimers = [];
function _logItemHTML(m) {
  const badge = { brand: "bg-brand text-white", violet: "bg-violet/15 text-violet", amber: "bg-amber/20 text-amber" }[m.color] || "bg-brand text-white";
  const nameColor = { brand: "text-brand", violet: "text-violet", amber: "text-amber" }[m.color] || "text-brand";
  const bubble = m.alert ? "border-amber/40" : "border-line";
  const bg = m.alert ? "style='background:#fffbeb'" : "";
  const file = m.file ? `<div class="mt-2 bg-soft p-2 rounded border border-line text-[11px] font-mono text-muted flex items-center gap-2"><span class="material-symbols-outlined text-[14px]">table_chart</span> ${m.file}</div>` : "";
  const actions = m.alert ? `<div class="mt-3 flex gap-2"><button class="bg-amber text-white text-xs px-3 py-1 rounded-md font-semibold">指派人工審核</button><button class="border border-line text-ink text-xs px-3 py-1 rounded-md bg-white font-semibold">查看報告</button></div>` : "";
  return `<div class="log-item flex gap-3">
    <div class="w-8 h-8 rounded-lg ${badge} grid place-content-center shrink-0 text-xs font-bold mt-1">${m.who[0]}</div>
    <div class="p-3 rounded-tr-xl rounded-b-xl rounded-tl-sm border ${bubble} w-full" ${bg}>
      <div class="flex justify-between items-center mb-1"><span class="text-[12px] font-bold ${nameColor}">${m.who} (${m.tag})</span><span class="text-[10px] text-muted">${m.time}</span></div>
      <p class="text-[13px] text-ink leading-relaxed">${m.text}</p>${file}${actions}
    </div>
  </div>`;
}
function playLog(log) {
  const feed = document.querySelector("#logFeed"), hint = document.querySelector("#logHint");
  if (!feed) return;
  _logTimers.forEach(clearTimeout); _logTimers = []; feed.innerHTML = ""; if (hint) hint.textContent = "";
  log.forEach((m, i) => {
    const t = setTimeout(() => {
      feed.insertAdjacentHTML("beforeend", _logItemHTML(m));
      const el = feed.lastElementChild;
      requestAnimationFrame(() => el.classList.add("show"));
      feed.scrollTop = feed.scrollHeight;
      if (hint) hint.textContent = i < log.length - 1 ? "團隊協作中…" : "本輪協作完成 ✓";
    }, i * 1100 + 300);
    _logTimers.push(t);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderMission();
  const btn = document.querySelector("#replayBtn");
  if (btn) btn.addEventListener("click", () => {
    const id = new URLSearchParams(location.search).get("case") || "1";
    playLog((MISSION_CASES[id] || MISSION_CASES["1"]).log);
  });
});
