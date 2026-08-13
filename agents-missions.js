/* 任務指揮中心 — 3 個「完整故事型」示範案例（資料驅動）。依賴 agents.js 的 AGENTS / agentById。
 * 每案：從一個提問開始 → 團隊跑一次並「完成」→ 各自不同畫面與交付內容。 */

/* ---------- 小組件 ---------- */
function _bar(label, pct, colorHex, valText) {
  return `<div class="flex items-center gap-3">
    <span class="w-24 shrink-0 text-[13px] text-body truncate">${label}</span>
    <div class="flex-1 bg-line rounded-full h-2.5 overflow-hidden"><div class="h-2.5 rounded-full" style="width:${pct}%;background:${colorHex}"></div></div>
    <span class="w-16 text-right text-[13px] font-bold" style="color:${colorHex}">${valText || pct + "%"}</span>
  </div>`;
}
function _kpi(label, before, after, delta, up) {
  const col = up ? "#16a34a" : "#dc2626";
  return `<div class="bg-soft rounded-xl border border-line p-3">
    <div class="text-[11px] font-bold text-muted">${label}</div>
    <div class="flex items-baseline gap-1.5 mt-1">
      <span class="text-[13px] text-muted line-through">${before}</span>
      <span class="material-symbols-outlined text-[16px] text-muted">arrow_right_alt</span>
      <span class="text-xl font-black text-ink">${after}</span>
    </div>
    <div class="text-[11px] font-bold mt-1" style="color:${col}">${delta}</div>
  </div>`;
}
function _deliverHead(icon, title, agent, tag) {
  return `<div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2"><span class="w-8 h-8 rounded-lg bg-brand/10 text-brand grid place-content-center"><span class="material-symbols-outlined text-[18px]">${icon}</span></span>
    <div><h4 class="text-[14px] font-black text-ink leading-tight">${title}</h4><p class="text-[11px] text-muted">${agent} Agent 產出</p></div></div>
    <span class="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded border border-success/20">${tag || "完成"}</span>
  </div>`;
}
const _card = (inner) => `<div class="bg-white border border-line rounded-2xl p-5 shadow-sm">${inner}</div>`;

/* ---------- 各案交付畫面（刻意各自不同） ---------- */
function _deliver1() { // 生產排程：ROI 對比 + 推薦系統 + 排程甘特
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    ${_card(_deliverHead("analytics", "ROI 試算表", "算盤", "完成") + `<div class="grid grid-cols-2 gap-3">
      ${_kpi("交期達成率", "74%", "92%", "▲ +18 個百分點", true)}
      ${_kpi("平均換線時間", "45 分", "28 分", "▼ −38%", true)}
      ${_kpi("在製品庫存", "基準", "−11%", "▼ 庫存下降", true)}
      ${_kpi("投資回收期", "—", "2.1 年", "可於 2 年內回本", true)}
    </div>`)}
    ${_card(_deliverHead("schema", "推薦系統清單", "選配", "完成") + `<div class="space-y-2.5">
      ${_bar("生產工單管理", 92, "#16a34a", "92%")}
      ${_bar("AI 產線智排中心", 88, "#16a34a", "88%")}
      ${_bar("設備預測維護", 81, "#3b82f6", "81%")}
      <a href="./catalog?q=生產排程" class="inline-flex items-center gap-1 text-[12px] font-bold text-brand2 mt-1">在專案目錄開啟這些系統 <span class="material-symbols-outlined text-[15px]">arrow_forward</span></a>
    </div>`)}
    <div class="lg:col-span-2">${_card(_deliverHead("calendar_view_week", "排程結果（示意）", "排程", "完成") + `<div class="space-y-2 overflow-x-auto">
      ${["CNC-01","CNC-02","組裝線 A"].map((m,i)=>`<div class="flex items-center gap-2 min-w-[560px]"><span class="w-16 shrink-0 text-[12px] font-semibold text-body">${m}</span><div class="flex-1 flex gap-1">
        ${[["WO-2301","#3b82f6",22],["WO-2318","#1e40af",30],["WO-2325","#7c3aed",18],["換線","#e2e8f0",8],["WO-2340","#16a34a",22]].map(([t,c,w],j)=> (i===2&&j===2)?"":`<div class="h-7 rounded grid place-content-center text-[10px] font-bold ${c==="#e2e8f0"?"text-muted":"text-white"}" style="width:${w}%;background:${c}">${w>12?t:""}</div>`).join("")}
      </div></div>`).join("")}
      <p class="text-[11px] text-muted mt-1">AI 依產能與交期自動排入工單，白灰為換線緩衝；衝突會即時預警。</p>
    </div>`)}</div>
  </div>`;
}
function _deliver2() { // 碳盤查：熱點長條 + 減碳路線 + 盤查摘要
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    ${_card(_deliverHead("local_fire_department", "排放熱點分析", "行家", "完成") + `<div class="space-y-2.5">
      ${_bar("熔煉爐", 42, "#dc2626", "42%")}
      ${_bar("空壓系統", 19, "#d97706", "19%")}
      ${_bar("冰水主機", 14, "#d97706", "14%")}
      ${_bar("其他製程", 25, "#94a3b8", "25%")}
      <p class="text-[11px] text-muted mt-1">熔煉與空壓合計占總排放 61%，為優先減碳標的。</p>
    </div>`)}
    ${_card(_deliverHead("route", "減碳路線圖", "督導", "完成") + `<div class="relative border-l-2 border-line ml-2 space-y-3">
      <div class="relative pl-4"><span class="absolute w-2.5 h-2.5 bg-success rounded-full -left-[7px] top-1"></span><p class="text-[13px] font-bold text-ink">短期 · 變頻＋照明汰換</p><p class="text-[11px] text-muted">年減碳 −4%，回收期 &lt; 1 年</p></div>
      <div class="relative pl-4"><span class="absolute w-2.5 h-2.5 bg-brand2 rounded-full -left-[7px] top-1"></span><p class="text-[13px] font-bold text-ink">中期 · 熔煉熱回收</p><p class="text-[11px] text-muted">再減 −6%，回收期約 2.3 年</p></div>
      <div class="relative pl-4"><span class="absolute w-2.5 h-2.5 bg-violet rounded-full -left-[7px] top-1"></span><p class="text-[13px] font-bold text-ink">長期 · 綠電採購</p><p class="text-[11px] text-muted">再減 −12%，達成減碳目標</p></div>
    </div>`)}
    <div class="lg:col-span-2">${_card(_deliverHead("dataset", "碳盤查摘要", "填實", "完成") + `<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-soft rounded-xl border border-line p-3"><div class="text-[11px] font-bold text-muted">年總排放</div><div class="text-xl font-black text-ink mt-1">12,400 <span class="text-xs font-bold text-muted">tCO₂e</span></div></div>
      <div class="bg-soft rounded-xl border border-line p-3"><div class="text-[11px] font-bold text-muted">可辨識減碳點</div><div class="text-xl font-black text-ink mt-1">12 <span class="text-xs font-bold text-muted">處</span></div></div>
      <div class="bg-soft rounded-xl border border-line p-3"><div class="text-[11px] font-bold text-muted">首階段可減碳</div><div class="text-xl font-black text-success mt-1">8.4%</div></div>
      <div class="bg-soft rounded-xl border border-line p-3"><div class="text-[11px] font-bold text-muted">綜合回收期</div><div class="text-xl font-black text-ink mt-1">2.3 <span class="text-xs font-bold text-muted">年</span></div></div>
    </div>
    <div class="flex flex-wrap gap-2 mt-3"><span class="text-[11px] font-semibold text-brand bg-brand/5 border border-brand/15 rounded-full px-2 py-0.5">範疇一 已盤</span><span class="text-[11px] font-semibold text-brand bg-brand/5 border border-brand/15 rounded-full px-2 py-0.5">範疇二 已盤</span><span class="text-[11px] font-semibold text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5">範疇三 已由主管確認</span></div>`)}</div>
  </div>`;
}
function _deliver3() { // 客訴：分類長條 + 根因樹 + 對策表
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    ${_card(_deliverHead("donut_large", "客訴分類", "明鏡", "完成") + `<div class="space-y-2.5">
      ${_bar("出貨延遲", 47, "#dc2626", "47%")}
      ${_bar("品質瑕疵", 23, "#d97706", "23%")}
      ${_bar("客服態度", 18, "#3b82f6", "18%")}
      ${_bar("其他", 12, "#94a3b8", "12%")}
      <p class="text-[11px] text-muted mt-1">共 218 筆客訴，聚類準確度 91%。</p>
    </div>`)}
    ${_card(_deliverHead("account_tree", "根因樹（出貨延遲）", "行家", "完成") + `<div class="text-[13px]">
      <div class="inline-flex items-center gap-2 bg-brand text-white rounded-lg px-3 py-1.5 font-bold">出貨延遲 47%</div>
      <div class="mt-2 ml-4 border-l-2 border-line pl-4 space-y-2">
        <div><div class="inline-flex items-center gap-2 bg-soft border border-line rounded-lg px-3 py-1.5 font-semibold text-ink">包裝線人力不足</div><p class="text-[11px] text-muted mt-1">尖峰時段人力缺口約 30%</p></div>
        <div><div class="inline-flex items-center gap-2 bg-soft border border-line rounded-lg px-3 py-1.5 font-semibold text-ink">尖峰排程衝突</div><p class="text-[11px] text-muted mt-1">促銷檔期集中出貨、未預先排班</p></div>
      </div>
    </div>`)}
    <div class="lg:col-span-2">${_card(_deliverHead("checklist", "對策與追蹤", "擬稿 · 排程", "完成") + `<div class="overflow-x-auto"><table class="w-full text-left text-[13px]">
      <thead class="text-[11px] text-muted border-b border-line"><tr><th class="py-2 pr-3">對策</th><th class="py-2 pr-3">負責</th><th class="py-2 pr-3">期限</th><th class="py-2">預期成效</th></tr></thead>
      <tbody class="divide-y divide-line">
        <tr><td class="py-2 pr-3 font-semibold text-ink">尖峰增派包裝人力</td><td class="py-2 pr-3 text-muted">生產課</td><td class="py-2 pr-3 text-muted">2 週</td><td class="py-2 font-bold text-success">延遲 −22%</td></tr>
        <tr><td class="py-2 pr-3 font-semibold text-ink">促銷前預先排班</td><td class="py-2 pr-3 text-muted">排程 Agent</td><td class="py-2 pr-3 text-muted">下檔期</td><td class="py-2 font-bold text-success">衝突 −40%</td></tr>
        <tr><td class="py-2 pr-3 font-semibold text-ink">開通主動出貨通知</td><td class="py-2 pr-3 text-muted">客服部</td><td class="py-2 pr-3 text-muted">1 週</td><td class="py-2 font-bold text-success">客訴 −18%</td></tr>
      </tbody></table></div>
      <p class="text-[11px] text-muted mt-2">綜合預估：重複客訴 −34%。</p>`)}</div>
  </div>`;
}

/* ---------- 案例資料 ---------- */
const MISSION_CASES = {
  "1": {
    code: "MT-2048", title: "導入生產排程", accent: "manufacturing",
    objective: "導入一套生產排程系統，並評估導入 ROI 與風險",
    question: "我要導入一套生產排程系統，並評估導入的 ROI 與風險。",
    participants: ["orchestrator", "matchmaker", "expert", "abacus", "guardian", "scheduler"],
    stats: { steps: 6, deliverables: 4 },
    before: ["靠 Excel 人工排程，插單常撞單", "交期延誤往往事後才發現", "ROI 與風險說不清楚，難決策"],
    after: ["AI 依產能與交期自動排程", "衝突／缺料即時預警", "ROI、風險與導入規格一次到位"],
    log: [
      { who: "智策", tag: "Orchestrator", color: "brand", time: "10:42", text: "收到需求，拆為 6 項子任務，指派顧問組先行。" },
      { who: "選配", tag: "Matchmaker", color: "violet", time: "10:45", text: "比對 463 套系統，推薦 3 套 APS 並生成比較矩陣。", file: "aps_matrix.csv" },
      { who: "行家", tag: "Domain Expert", color: "violet", time: "10:46", text: "指出製造業 3 大痛點，建議排程引擎與預警規則解耦。" },
      { who: "算盤", tag: "ROI", color: "brand", time: "10:47", text: "試算 ROI：交期達成率 74%→92%、回收期 2.1 年。" },
      { who: "守衡", tag: "Compliance", color: "amber", time: "10:48", text: "「自動改派產線」屬敏感決策，已送主管覆核。" },
      { who: "智策", tag: "Orchestrator", color: "success", time: "10:53", text: "✓ 主管已核可，排程規則上線；6 項任務全部完成，產出 4 份交付物。" },
    ],
    deliverables: _deliver1,
    audit: [
      { time: "10:53", agentId: "guardian", action: "自動改派決策 → 主管覆核後放行", reason: "以人工覆核確認後，允許在安全邊界內自動改派。", kind: "done", label: "已核可" },
      { time: "10:47", agentId: "abacus", action: "產出 3 年 ROI 與回收期", reason: "以產線實績試算導入效益與成本結構。", kind: "done", label: "已執行" },
      { time: "10:42", agentId: "orchestrator", action: "建立任務 DAG，拆為 6 步", reason: "判定需要產業標竿、財務試算與資安合規三領域。", kind: "done", label: "已執行" },
    ],
  },

  "2": {
    code: "MT-2091", title: "組織碳盤查", accent: "co2",
    objective: "盤查工廠碳排放並找出可行的減碳機會",
    question: "幫我盤查工廠的碳排放，並找出可行的減碳機會。",
    participants: ["orchestrator", "seeder", "expert", "abacus", "supervisor", "guardian"],
    stats: { steps: 6, deliverables: 3 },
    before: ["用試算表盤查，耗時數週", "碳排熱點看不清楚", "範疇三上游數據常缺漏"],
    after: ["自動彙整能耗、快速盤查", "熱點與占比一目了然", "減碳機會被量化、可排序"],
    log: [
      { who: "智策", tag: "Orchestrator", color: "brand", time: "09:02", text: "收到盤查需求，拆為 6 步，先請「填實」彙整能耗來源。" },
      { who: "填實", tag: "Data Seeder", color: "brand", time: "09:05", text: "匯入 12 個月電力、燃料與製程用量，建立三範疇清冊。", file: "energy_inventory.csv" },
      { who: "行家", tag: "Domain Expert", color: "violet", time: "09:07", text: "標出 3 大排放熱點：熔煉爐、空壓系統、冰水主機。" },
      { who: "算盤", tag: "ROI", color: "brand", time: "09:09", text: "試算變頻與熱回收：首階段可減碳 8.4%、回收期 2.3 年。" },
      { who: "守衡", tag: "Compliance", color: "amber", time: "09:10", text: "範疇三上游數據不足，已送環安主管確認。" },
      { who: "智策", tag: "Orchestrator", color: "success", time: "09:16", text: "✓ 主管已補充範疇三來源，盤查完成，產出 3 份交付物。" },
    ],
    deliverables: _deliver2,
    audit: [
      { time: "09:16", agentId: "guardian", action: "範疇三數據 → 主管確認後補齊", reason: "補充上游供應商排放來源，符合 ISO 14064 揭露要求。", kind: "done", label: "已核可" },
      { time: "09:07", agentId: "expert", action: "鎖定 3 大排放熱點", reason: "依製造業排放係數比對能耗，熔煉與空壓占 61%。", kind: "done", label: "已執行" },
      { time: "09:02", agentId: "orchestrator", action: "建立盤查任務 DAG", reason: "判定需要數據彙整、熱點分析與減碳試算三領域。", kind: "done", label: "已執行" },
    ],
  },

  "3": {
    code: "MT-2130", title: "客訴根因分析", accent: "support_agent",
    objective: "找出本月客訴激增的根因，並提出對策與追蹤計畫",
    question: "這個月客訴量激增，幫我找出根因並提出對策與追蹤計畫。",
    participants: ["orchestrator", "auditor", "expert", "drafter", "scheduler", "guardian"],
    stats: { steps: 6, deliverables: 4 },
    before: ["客訴散落各通路、難彙整", "靠人工翻單找根因、費時", "同類問題重複發生"],
    after: ["自動聚類客訴、定位根因", "對策與負責人一次到位", "追蹤時程可管、重複下降"],
    log: [
      { who: "智策", tag: "Orchestrator", color: "brand", time: "14:20", text: "收到需求，拆為 6 步，先請「明鏡」彙整近 30 天客訴。" },
      { who: "明鏡", tag: "Auditor", color: "brand", time: "14:23", text: "彙整 218 筆客訴並聚類為 4 類，「出貨延遲」占 47%。", file: "complaints_30d.csv" },
      { who: "行家", tag: "Domain Expert", color: "violet", time: "14:26", text: "根因指向包裝線人力不足＋尖峰排程衝突。" },
      { who: "擬稿", tag: "Spec Writer", color: "brand", time: "14:28", text: "研擬 3 項對策並估算成效：綜合可降低重複客訴 34%。" },
      { who: "守衡", tag: "Compliance", color: "amber", time: "14:30", text: "「主動退款補償」涉及財務授權，已送客服主管核可。" },
      { who: "智策", tag: "Orchestrator", color: "success", time: "14:35", text: "✓ 主管已核可補償上限，對策定案，產出 4 份交付物。" },
    ],
    deliverables: _deliver3,
    audit: [
      { time: "14:35", agentId: "guardian", action: "退款補償 → 主管核可授權上限", reason: "確認補償金額與財務政策 F-210 相符後放行。", kind: "done", label: "已核可" },
      { time: "14:23", agentId: "auditor", action: "完成客訴聚類（4 類）", reason: "以語意分群將 218 筆客訴歸類，準確度 91%。", kind: "done", label: "已執行" },
      { time: "14:20", agentId: "orchestrator", action: "建立分析任務 DAG", reason: "判定需要資料彙整、根因分析、對策與排程四領域。", kind: "done", label: "已執行" },
    ],
  },
};

/* ---------- render ---------- */
function renderMission() {
  const id = new URLSearchParams(location.search).get("case") || "1";
  const c = MISSION_CASES[id] || MISSION_CASES["1"];
  const $ = (s) => document.querySelector(s);
  const setText = (s, t) => { const e = $(s); if (e) e.textContent = t; };
  const setHTML = (s, h) => { const e = $(s); if (e) e.innerHTML = h; };

  document.title = `${c.title} · 任務指揮中心 — JVision`;
  setText("#missCode", `MISSION CONTROL · 任務 #${c.code}`);
  setText("#missObjective", c.objective);
  setText("#demoQuestion", c.question);
  setText("#statAgents", c.participants.length);
  setText("#statSteps", c.stats.steps);
  setText("#statDeliv", c.stats.deliverables);

  // case tabs
  setHTML("#caseTabs", Object.entries(MISSION_CASES).map(([k, m]) =>
    `<a href="./agents-mission?case=${k}" class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${k === id ? "bg-brand text-white border-brand" : "bg-white text-body border-line hover:border-brand2 hover:text-brand"}">${m.title}</a>`
  ).join(""));

  // before / after
  setHTML("#baBefore", c.before.map((t) => `<li class="flex items-start gap-2 text-[13px] text-body"><span class="material-symbols-outlined text-[16px] text-muted mt-0.5">close</span><span>${t}</span></li>`).join(""));
  setHTML("#baAfter", c.after.map((t) => `<li class="flex items-start gap-2 text-[13px] text-ink font-medium"><span class="material-symbols-outlined text-[16px] text-success mt-0.5">check</span><span>${t}</span></li>`).join(""));

  // participants avatars
  setHTML("#runAgents", c.participants.map((pid) => {
    const a = agentById(pid) || { name: pid, icon: "smart_toy" };
    return `<div class="flex items-center gap-1.5 bg-soft border border-line rounded-full pl-1 pr-3 py-1"><span class="w-6 h-6 rounded-full bg-violet/10 text-violet grid place-content-center"><span class="material-symbols-outlined text-[15px]">${a.icon}</span></span><span class="text-[12px] font-semibold text-body">${a.name}</span></div>`;
  }).join(""));

  // deliverables (case-specific)
  setHTML("#deliverRoot", c.deliverables());

  // audit
  setHTML("#auditBody", c.audit.map((r) => {
    const a = agentById(r.agentId) || { name: r.agentId };
    const isO = r.agentId === "orchestrator";
    const badge = isO ? `<span class="w-6 h-6 rounded bg-brand text-white grid place-content-center text-[10px] font-bold">${a.name[0]}</span>`
      : `<span class="w-6 h-6 rounded bg-violet/15 text-violet grid place-content-center text-[10px] font-bold">${a.name[0]}</span>`;
    return `<tr class="hover:bg-soft transition-colors">
      <td class="px-4 py-3 font-mono text-xs text-muted">${r.time}</td>
      <td class="px-4 py-3"><div class="flex items-center gap-2">${badge}<span class="${isO ? "font-bold text-brand" : "font-semibold"}">${a.name}</span></div></td>
      <td class="px-4 py-3 font-semibold">${r.action}</td>
      <td class="px-4 py-3 text-muted text-xs">${r.reason}</td>
      <td class="px-4 py-3"><span class="text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded text-[10px] font-bold">${r.label}</span></td>
    </tr>`;
  }).join(""));

  play(c);
}

/* ---------- 播放：進度條 + 逐則 log ---------- */
let _timers = [];
function _logItemHTML(m) {
  const badge = { brand: "bg-brand text-white", violet: "bg-violet/15 text-violet", amber: "bg-amber/20 text-amber", success: "bg-success text-white" }[m.color] || "bg-brand text-white";
  const nameColor = { brand: "text-brand", violet: "text-violet", amber: "text-amber", success: "text-success" }[m.color] || "text-brand";
  const bubble = m.color === "amber" ? "border-amber/40" : m.color === "success" ? "border-success/40" : "border-line";
  const bg = m.color === "amber" ? "style='background:#fffbeb'" : m.color === "success" ? "style='background:#f0fdf4'" : "";
  const file = m.file ? `<div class="mt-2 bg-soft p-1.5 rounded border border-line text-[11px] font-mono text-muted inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-[13px]">table_chart</span> ${m.file}</div>` : "";
  return `<div class="log-item flex gap-3">
    <div class="w-7 h-7 rounded-lg ${badge} grid place-content-center shrink-0 text-[11px] font-bold mt-0.5">${m.who[0]}</div>
    <div class="p-2.5 rounded-tr-xl rounded-b-xl rounded-tl-sm border ${bubble} w-full" ${bg}>
      <div class="flex justify-between items-center mb-0.5"><span class="text-[12px] font-bold ${nameColor}">${m.who}</span><span class="text-[10px] text-muted">${m.time}</span></div>
      <p class="text-[13px] text-ink leading-relaxed">${m.text}</p>${file}
    </div>
  </div>`;
}
function play(c) {
  const feed = document.querySelector("#logFeed"), hint = document.querySelector("#logHint");
  const bar = document.querySelector("#runProgressBar"), pct = document.querySelector("#runPct"), status = document.querySelector("#runStatus");
  if (!feed) return;
  _timers.forEach(clearTimeout); _timers = [];
  feed.innerHTML = ""; if (hint) hint.textContent = "協作中…";
  if (bar) bar.style.width = "0%"; if (pct) pct.textContent = "0%";
  if (status) { status.textContent = "協作中"; status.className = "text-sm font-bold text-brand"; }
  const n = c.log.length;
  c.log.forEach((m, i) => {
    const t = setTimeout(() => {
      feed.insertAdjacentHTML("beforeend", _logItemHTML(m));
      const el = feed.lastElementChild; requestAnimationFrame(() => el.classList.add("show"));
      feed.scrollTop = feed.scrollHeight;
      const p = Math.round(((i + 1) / n) * 100);
      if (bar) bar.style.width = p + "%"; if (pct) pct.textContent = p + "%";
      if (i === n - 1) {
        if (hint) hint.textContent = "本輪協作完成 ✓";
        if (status) { status.textContent = "已完成 · 100%"; status.className = "text-sm font-bold text-success"; }
      }
    }, i * 1000 + 300);
    _timers.push(t);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderMission();
  const btn = document.querySelector("#replayBtn");
  if (btn) btn.addEventListener("click", () => {
    const id = new URLSearchParams(location.search).get("case") || "1";
    play(MISSION_CASES[id] || MISSION_CASES["1"]);
  });
});
