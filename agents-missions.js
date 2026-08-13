/* 任務指揮中心 — 3 種產出型態的示範（完成任務／呈現報表／產生報告）。
 * 依賴 agents.js 的 AGENTS / agentById。每案：一句話 → 團隊跑一次 → 底部嵌入真實結果網頁。 */

const MISSION_CASES = {
  "1": {
    code: "MT-2048", title: "完成任務", kind: "完成任務",
    objective: "完成今日訂單的生產排程與派工",
    question: "幫我把今天進來的訂單排成生產工單並完成派工。",
    participants: ["orchestrator", "auditor", "scheduler", "abacus", "supervisor"],
    steps: [
      { agentId: "orchestrator", text: "讀取今日訂單" },
      { agentId: "auditor", text: "檢查產能與物料" },
      { agentId: "scheduler", text: "產生工單與排程" },
      { agentId: "abacus", text: "評估交期與瓶頸" },
      { agentId: "supervisor", text: "派工並通知現場" },
    ],
    log: [
      { who: "智策", color: "brand", time: "10:42", text: "收到需求，從訂單系統讀取今日 38 筆訂單。" },
      { who: "明鏡", color: "brand", time: "10:43", text: "比對機台產能與物料庫存，2 筆需急件插單。", file: "capacity_check.csv" },
      { who: "排程", color: "violet", time: "10:44", text: "將訂單轉為 26 張工單，排入 5 台機台。" },
      { who: "算盤", color: "brand", time: "10:45", text: "評估交期達成率 92%，偵測到 1 個瓶頸站點。" },
      { who: "督導", color: "success", time: "10:46", text: "✓ 已派工並通知 8 位現場人員，任務完成。" },
    ],
    done: [
      { icon: "receipt_long", text: "讀取 38 筆今日訂單" },
      { icon: "inventory", text: "產能／物料檢查通過（2 筆急件）" },
      { icon: "assignment_turned_in", text: "產生 26 張生產工單" },
      { icon: "precision_manufacturing", text: "排入 5 台機台，瓶頸 1 處已標記" },
      { icon: "campaign", text: "派工完成，通知 8 位現場人員" },
    ],
    summary: [
      { big: "26", label: "工單已派工", sub: "來自 38 筆訂單" },
      { big: "92%", label: "交期達成預估", sub: "▲ +18pt", good: true },
      { big: "1", label: "瓶頸站點", sub: "CNC-02 已預警" },
    ],
    resultUrl: "./agents-result-schedule.html",
    resultTitle: "生產排程工作台",
    resultDesc: "團隊已把今天的訂單排好並派工，以下是實際的排程工作台畫面。",
  },

  "2": {
    code: "MT-2091", title: "呈現報表", kind: "呈現報表",
    objective: "彙整各系統資料，產生本月營運儀表板",
    question: "給我這個月生產、庫存與訂單的營運儀表板。",
    participants: ["orchestrator", "seeder", "insighter", "abacus", "supervisor"],
    steps: [
      { agentId: "orchestrator", text: "確認要看的指標" },
      { agentId: "seeder", text: "串接 MES／WMS／訂單" },
      { agentId: "insighter", text: "彙整關鍵 KPI" },
      { agentId: "abacus", text: "計算趨勢與比較" },
      { agentId: "supervisor", text: "生成互動儀表板" },
    ],
    log: [
      { who: "智策", color: "brand", time: "09:02", text: "收到需求，確認要呈現生產、庫存與訂單三面向。" },
      { who: "填實", color: "brand", time: "09:03", text: "串接 MES、WMS 與訂單系統，抓取本月資料。", file: "ops_dataset.json" },
      { who: "洞察", color: "violet", time: "09:05", text: "彙整 14 項 KPI，鎖定 3 個需關注項目。" },
      { who: "算盤", color: "brand", time: "09:06", text: "計算月趨勢與去年同期比較。" },
      { who: "督導", color: "success", time: "09:07", text: "✓ 生成 4 張圖表的互動儀表板，完成。" },
    ],
    done: [
      { icon: "hub", text: "串接 3 個系統（MES／WMS／訂單）" },
      { icon: "query_stats", text: "彙整 14 項營運 KPI" },
      { icon: "trending_up", text: "計算 8 週趨勢與同期比較" },
      { icon: "donut_large", text: "生成 4 張圖表" },
      { icon: "warning", text: "標記 3 項需關注項目" },
    ],
    summary: [
      { big: "96%", label: "產量達成率", sub: "▲ +4%", good: true },
      { big: "94%", label: "準交率", sub: "▲ +7%", good: true },
      { big: "3", label: "需關注項目", sub: "缺料／稼動／逾期" },
    ],
    resultUrl: "./agents-result-dashboard.html",
    resultTitle: "營運儀表板",
    resultDesc: "團隊串接 MES／WMS／訂單系統，彙整成即時儀表板，以下為實際畫面。",
  },

  "3": {
    code: "MT-2130", title: "產生報告", kind: "產生報告",
    objective: "彙整各系統資料，產出本月經營分析報告",
    question: "幫我彙整各系統資料，做一份本月經營分析報告。",
    participants: ["orchestrator", "seeder", "insighter", "drafter", "abacus"],
    steps: [
      { agentId: "orchestrator", text: "定義報告範圍" },
      { agentId: "seeder", text: "蒐集各系統資料" },
      { agentId: "insighter", text: "交叉分析找重點" },
      { agentId: "abacus", text: "計算財務指標" },
      { agentId: "drafter", text: "撰寫並產出報告" },
    ],
    log: [
      { who: "智策", color: "brand", time: "14:20", text: "收到需求，定義報告涵蓋生產、庫存、銷售、財務四面向。" },
      { who: "填實", color: "brand", time: "14:22", text: "自 MES、WMS、CRM、ERP 蒐集本月資料。", file: "sources_5systems.zip" },
      { who: "洞察", color: "violet", time: "14:25", text: "交叉分析找出 3 大重點與 3 項風險。" },
      { who: "算盤", color: "brand", time: "14:27", text: "計算營收 +12%、毛利率 34%。" },
      { who: "擬稿", color: "success", time: "14:30", text: "✓ 撰寫完成 5 節報告並產出文件，任務完成。" },
    ],
    done: [
      { icon: "storage", text: "蒐集 5 個系統資料" },
      { icon: "analytics", text: "交叉分析 6 大面向" },
      { icon: "priority_high", text: "找出 3 項風險提醒" },
      { icon: "calculate", text: "計算營收 +12%、毛利率 34%" },
      { icon: "description", text: "產出 5 節完整報告" },
    ],
    summary: [
      { big: "+12%", label: "本月營收", sub: "毛利率 34%", good: true },
      { big: "5", label: "彙整系統數", sub: "MES／WMS／CRM／ERP…" },
      { big: "3", label: "風險提醒", sub: "缺料／稼動／客戶" },
    ],
    resultUrl: "./agents-result-report.html",
    resultTitle: "經營分析報告",
    resultDesc: "團隊自 MES／WMS／CRM／ERP 交叉分析，產出完整報告，以下為實際文件。",
  },
};

/* ---------- render ---------- */
function _agent(id) { return agentById(id) || { name: id, icon: "smart_toy" }; }

function _stepHTML(step, state) {
  const a = _agent(step.agentId);
  if (state === "done")
    return `<div class="flex items-start gap-2.5 p-2 rounded-lg bg-soft border border-line/60"><span class="w-7 h-7 rounded-full bg-success text-white grid place-content-center shrink-0"><span class="material-symbols-outlined text-[15px]">check</span></span><div><div class="text-[13px] font-bold text-ink">${step.text}</div><div class="text-[11px] text-muted">${a.name} Agent</div></div></div>`;
  if (state === "active")
    return `<div class="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-brand/30 shadow-sm"><span class="w-7 h-7 rounded-full bg-violet/10 text-violet grid place-content-center shrink-0 ring-2 ring-success/40"><span class="material-symbols-outlined text-[15px]">${a.icon}</span></span><div><div class="text-[13px] font-bold text-brand">${step.text}</div><div class="text-[11px] text-violet font-semibold">${a.name} Agent 執行中…</div></div></div>`;
  return `<div class="flex items-start gap-2.5 p-2 rounded-lg"><span class="w-7 h-7 rounded-full bg-soft border border-line grid place-content-center shrink-0"><span class="w-2 h-2 rounded-full bg-idle"></span></span><div><div class="text-[13px] text-muted">${step.text}</div><div class="text-[11px] text-muted/80">${a.name} Agent 待命</div></div></div>`;
}
function _doneHTML(d) {
  return `<div class="done-item flex items-center gap-2 p-2 rounded-lg bg-success/5 border border-success/15"><span class="w-6 h-6 rounded bg-success/10 text-success grid place-content-center shrink-0"><span class="material-symbols-outlined text-[15px]">${d.icon}</span></span><span class="text-[13px] text-ink">${d.text}</span><span class="material-symbols-outlined text-[16px] text-success ml-auto">check_circle</span></div>`;
}

function renderMission() {
  const id = new URLSearchParams(location.search).get("case") || "1";
  const c = MISSION_CASES[id] || MISSION_CASES["1"];
  const $ = (s) => document.querySelector(s);
  const setText = (s, t) => { const e = $(s); if (e) e.textContent = t; };
  const setHTML = (s, h) => { const e = $(s); if (e) e.innerHTML = h; };

  document.title = `${c.title} · 任務指揮中心 — JVision`;
  setText("#missCode", `MISSION CONTROL · 任務 #${c.code} · ${c.kind}`);
  setText("#missObjective", c.objective);
  setText("#demoQuestion", c.question);
  setText("#statAgents", c.participants.length);
  setText("#statSteps", c.steps.length);
  setText("#statDone", c.done.length);

  // tabs (label by kind)
  setHTML("#caseTabs", Object.entries(MISSION_CASES).map(([k, m]) =>
    `<a href="./agents-mission?case=${k}" class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${k === id ? "bg-brand text-white border-brand" : "bg-white text-body border-line hover:border-brand2 hover:text-brand"}">${m.title}</a>`
  ).join(""));

  // participants avatars
  setHTML("#runAgents", c.participants.map((pid) => {
    const a = _agent(pid);
    return `<div class="flex items-center gap-1.5 bg-soft border border-line rounded-full pl-1 pr-3 py-1"><span class="w-6 h-6 rounded-full bg-violet/10 text-violet grid place-content-center"><span class="material-symbols-outlined text-[15px]">${a.icon}</span></span><span class="text-[12px] font-semibold text-body">${a.label || a.name}</span></div>`;
  }).join(""));

  // right summary (compact chips)
  setHTML("#summaryList", c.summary.map((s) => `
    <div class="inline-flex items-baseline gap-1.5 bg-soft border border-line rounded-lg px-3 py-1.5">
      <span class="text-base font-black ${s.good ? "text-success" : "text-ink"}">${s.big}</span>
      <span class="text-[11px] font-semibold text-muted">${s.label}</span>
    </div>`).join(""));

  // embedded real result (live webpage)
  setText("#resultTitle", c.resultTitle);
  setText("#resultDesc", c.resultDesc);
  setText("#resultKind", c.kind);
  const open = $("#resultOpen"); if (open) open.href = c.resultUrl;
  const frame = $("#resultFrame");
  if (frame) {
    frame.onload = () => { postFrame({ type: "jv-reset" }); if (_curStage >= 0) postFrame({ type: "jv-stage", stage: _curStage }); };
    frame.src = c.resultUrl;
  }

  play(c);
}

let _curStage = -1;
function postFrame(msg) { const f = document.querySelector("#resultFrame"); if (f && f.contentWindow) { try { f.contentWindow.postMessage(msg, "*"); } catch (e) {} } }
function setLive(on) { const el = document.querySelector("#frameLive"); if (!el) return; el.innerHTML = on ? '<span class="w-1.5 h-1.5 rounded-full bg-success"></span> 連線中' : '<span class="w-1.5 h-1.5 rounded-full bg-idle"></span> 待機'; }

/* 舊暱稱 → 新功能名（跟卡片一致） */
function _disp(who) { const a = (typeof AGENTS !== "undefined") && AGENTS.find((x) => x.name === who); return (a && a.label) || who; }

/* ---------- 播放：步驟 + 對話 + 完成項目 + 進度 ---------- */
let _timers = [];
function _logHTML(m) {
  const badge = { brand: "bg-brand text-white", violet: "bg-violet/15 text-violet", success: "bg-success text-white" }[m.color] || "bg-brand text-white";
  const nameColor = { brand: "text-brand", violet: "text-violet", success: "text-success" }[m.color] || "text-brand";
  const bubble = m.color === "success" ? "border-success/40" : "border-line";
  const bg = m.color === "success" ? "style='background:#f0fdf4'" : "";
  const nm = _disp(m.who);
  const file = m.file ? `<div class="mt-2 bg-soft p-1.5 rounded border border-line text-[11px] font-mono text-muted inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-[13px]">description</span> ${m.file}</div>` : "";
  return `<div class="log-item flex gap-3">
    <div class="w-7 h-7 rounded-lg ${badge} grid place-content-center shrink-0 text-[11px] font-bold mt-0.5">${nm[0]}</div>
    <div class="p-2.5 rounded-tr-xl rounded-b-xl rounded-tl-sm border ${bubble} w-full" ${bg}>
      <div class="flex justify-between items-center mb-0.5"><span class="text-[12px] font-bold ${nameColor}">${nm}</span><span class="text-[10px] text-muted">${m.time}</span></div>
      <p class="text-[13px] text-ink leading-relaxed">${m.text}</p>${file}
    </div>
  </div>`;
}
function _typingHTML(m) {
  const badge = { brand: "bg-brand text-white", violet: "bg-violet/15 text-violet", success: "bg-success text-white" }[m.color] || "bg-brand text-white";
  const nameColor = { brand: "text-brand", violet: "text-violet", success: "text-success" }[m.color] || "text-brand";
  const nm = _disp(m.who);
  return `<div id="typingBubble" class="flex gap-3">
    <div class="w-7 h-7 rounded-lg ${badge} grid place-content-center shrink-0 text-[11px] font-bold mt-0.5">${nm[0]}</div>
    <div class="p-2.5 rounded-tr-xl rounded-b-xl rounded-tl-sm border border-line bg-soft/60 inline-flex items-center gap-2">
      <span class="text-[12px] font-bold ${nameColor}">${nm}</span>
      <span class="inline-flex gap-1">
        <span class="w-1.5 h-1.5 bg-muted rounded-full animate-bounce"></span>
        <span class="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style="animation-delay:.15s"></span>
        <span class="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style="animation-delay:.3s"></span>
      </span>
    </div>
  </div>`;
}
function play(c) {
  const feed = document.querySelector("#logFeed"), doneEl = document.querySelector("#doneList"), hint = document.querySelector("#logHint");
  const bar = document.querySelector("#runProgressBar"), pct = document.querySelector("#runPct"), status = document.querySelector("#runStatus");
  if (!feed) return;
  _timers.forEach(clearTimeout); _timers = [];
  feed.innerHTML = ""; if (doneEl) doneEl.innerHTML = ""; if (hint) hint.textContent = "AI 處理中…";
  if (bar) bar.style.width = "0%"; if (pct) pct.textContent = "0%";
  if (status) { status.textContent = "協作中"; status.className = "text-sm font-bold text-brand"; }
  _curStage = -1; postFrame({ type: "jv-reset" }); setLive(false);
  const n = c.log.length, PER = 2400, LEAD = 950;
  c.log.forEach((m, i) => {
    // typing indicator
    _timers.push(setTimeout(() => {
      const old = document.getElementById("typingBubble"); if (old) old.remove();
      feed.insertAdjacentHTML("beforeend", _typingHTML(m));
      feed.scrollTop = feed.scrollHeight;
    }, i * PER + 300));
    // actual message + drive the webpage
    _timers.push(setTimeout(() => {
      const tb = document.getElementById("typingBubble"); if (tb) tb.remove();
      feed.insertAdjacentHTML("beforeend", _logHTML(m));
      const el = feed.lastElementChild; requestAnimationFrame(() => el.classList.add("show"));
      feed.scrollTop = feed.scrollHeight;
      if (doneEl && c.done[i]) doneEl.insertAdjacentHTML("beforeend", _doneHTML(c.done[i]));
      // fill the live webpage stage-by-stage
      _curStage = i; setLive(true); postFrame({ type: "jv-stage", stage: i });
      const p = Math.round(((i + 1) / n) * 100);
      if (bar) bar.style.width = p + "%"; if (pct) pct.textContent = p + "%";
      if (i === n - 1) {
        if (hint) hint.textContent = "全部完成 ✓";
        if (status) { status.textContent = "已完成 · 100%"; status.className = "text-sm font-bold text-success"; }
      }
    }, i * PER + LEAD));
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
