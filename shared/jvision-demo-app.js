/**
 * jvision-demo-app.js — data-driven, MULTI-ARCHETYPE demo UI.
 * One data model (content/details/<repo>.json) → several visually distinct product
 * layouts (different nav position, style, screens) so demos vary by industry while
 * staying consistent with the project's modules + flow.
 */
(function () {
  "use strict";
  const ACCENTS = {
    "生產製造": "#1e40af", "品質管理": "#0f766e", "業務銷售": "#4338ca", "採購供應鏈": "#0e7490", "人力資源": "#7c3aed",
    "倉儲物流": "#0369a1", "研發管理": "#6d28d9", "經營管理": "#1e3a8a", "ESG 永續": "#15803d", "零售電商": "#be123c",
    "教育": "#b45309", "企業協作": "#2563eb", "營建工程": "#c2410c", "醫療照護": "#047857", "財務會計": "#3730a3",
    "金融保險": "#0d9488", "資訊科技": "#1d4ed8", "交通運輸": "#0891b2", "設備維護": "#475569", "資訊安全": "#b91c1c",
    "專業服務": "#7e22ce", "物流運輸": "#0369a1", "餐飲旅宿": "#c2410c", "生活服務": "#db2777", "數據分析": "#4f46e5",
    "客服管理": "#0891b2", "房地產與物業": "#a16207", "宗教服務": "#b45309",
  };
  // archetype by category group
  const ARCH = {
    "生產製造": "console", "倉儲物流": "console", "設備維護": "console", "資訊科技": "console", "資訊安全": "console", "ESG 永續": "console", "營建工程": "console", "品質管理": "console",
    "業務銷售": "pipeline", "採購供應鏈": "pipeline", "客服管理": "pipeline", "企業協作": "pipeline", "專業服務": "pipeline", "物流運輸": "pipeline", "交通運輸": "pipeline", "零售電商": "pipeline", "餐飲旅宿": "pipeline", "生活服務": "pipeline",
    "財務會計": "report", "金融保險": "report", "經營管理": "report", "數據分析": "report", "醫療照護": "report", "教育": "report", "人力資源": "report", "研發管理": "report", "房地產與物業": "report", "宗教服務": "report",
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const num = (v) => { const m = String(v == null ? "" : v).match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : 0; };
  const clip = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; };
  const LOWER = /工時|時間|耗時|延遲|加班|停線|流失|逾期|錯誤|不良率|重排|帳齡|成本|停機|漏接|次數|天數|退件|等待|浪費/;
  const improved = (k) => (LOWER.test(k.label) || /分鐘|小時|天|次/.test(k.unit || "") ? num(k.after) < num(k.before) : num(k.after) > num(k.before));
  const deltaPct = (k) => { const b = num(k.before); return b ? Math.round((num(k.after) - b) / b * 100) : 0; };
  const OWNERS = ["王志明", "林怡君", "陳彥廷", "黃詩涵", "李柏翰", "吳佳蓉", "張家維", "劉建宏"];
  const hx = (hex, wr) => { hex = String(hex).replace("#", ""); if (hex.length < 6) hex = "1e40af"; const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16); const m = (c) => Math.round(c + (255 - c) * wr).toString(16).padStart(2, "0"); return "#" + m(r) + m(g) + m(b); };
  const dk = (hex, r) => { hex = String(hex).replace("#", ""); if (hex.length < 6) hex = "1e40af"; const p = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16); const m = (c) => Math.round(c * (1 - r)).toString(16).padStart(2, "0"); return "#" + m(p) + m(g) + m(b); };

  function getRepo() {
    const m = location.pathname.match(/\/demos\/([^/]+)/);
    if (m) return m[1];
    const meta = document.querySelector('meta[name="jv-demo-repo"]');
    return meta ? meta.content : "";
  }
  function synthRecords(D) {
    const stages = (D.flow && D.flow.stages || []).map((s) => s.title);
    const st = stages.length ? stages : ["待處理", "處理中", "待確認", "已完成"];
    const obj = (D.systemType || "案件").replace(/系統|平台|管理.*/g, "").slice(0, 4) || "案件";
    const risks = (D.problem && D.problem.pains || []).map((p) => p.title);
    const rk = risks.length ? risks : ["交期壓力", "待確認", "優先處理", "例外處理"];
    const rows = [];
    for (let i = 0; i < 7; i++) rows.push({ id: `NO-${String(i + 1).padStart(3, "0")}`, target: `${obj} ${i + 1}`, owner: OWNERS[i % OWNERS.length], due: `2026-07-${20 + (i % 8)}`, risk: rk[i % rk.length], stage: st[i % st.length], priority: i < 2 ? "high" : i < 5 ? "medium" : "low" });
    return { title: `${obj}清單`, columns: [{ key: "id", label: "編號" }, { key: "target", label: "對象" }, { key: "owner", label: "負責人" }, { key: "due", label: "期限" }, { key: "risk", label: "狀態/風險" }, { key: "stage", label: "階段" }], rows };
  }

  function boot(D) {
    const cat = D.category || "未分類";
    const accent = ACCENTS[cat] || "#1e40af";
    const root = document.documentElement.style;
    root.setProperty("--da-accent", accent);
    root.setProperty("--da-soft", hx(accent, 0.9));
    root.setProperty("--da-soft2", hx(accent, 0.8));
    root.setProperty("--da-dark", dk(accent, 0.55));
    document.body.classList.add("jv-demo-app");
    document.title = (D.title || "系統") + "｜Jvision Demo";

    const ctx = {
      D, accent,
      modules: (D.architecture && D.architecture.modules || []).slice(0, 8),
      entry: (D.architecture && D.architecture.entry || []).slice(0, 4),
      kpis: (D.benefits && D.benefits.kpis || []).map((k) => ({ label: k.label, before: num(k.before), after: num(k.after), unit: k.unit || "" })),
      stages: (D.flow && D.flow.stages || []),
      records: (D.records && D.records.rows && D.records.rows.length) ? D.records : synthRecords(D),
      rules: D.decisionRules || [],
      brand: clip((D.systemType || D.title || "System").replace(/（.*?）/g, ""), 11),
      title: D.title || "系統",
      systemType: D.systemType || cat,
    };

    const archetype = ARCH[cat] || (["console", "pipeline", "report"][D.id % 3]);
    const app = document.getElementById("app") || document.body;
    const chartHolder = { chart: null, chart2: null };
    const render = { console: renderConsole, pipeline: renderPipeline, report: renderReport }[archetype] || renderConsole;
    render(app, ctx, chartHolder);
    window.addEventListener("resize", () => { if (chartHolder.chart) chartHolder.chart.resize(); if (chartHolder.chart2) chartHolder.chart2.resize(); });
  }

  /* ---------- shared component builders ---------- */
  const kpiStrip = (ctx) => `<div class="da-kpis">${ctx.kpis.map((k) => { const up = improved(k), d = deltaPct(k); return `<div class="da-kpi"><div class="k-l"><span class="material-symbols-outlined">monitoring</span>${esc(k.label)}</div><div class="k-v">${esc(k.after)}<small>${esc(k.unit)}</small></div><div class="k-d ${up ? "k-up" : "k-down"}">${d > 0 ? "+" : ""}${d}%・較導入前 ${esc(k.before)}${esc(k.unit)}</div></div>`; }).join("")}</div>`;
  const byStage = (ctx) => { const m = {}; ctx.records.rows.forEach((r) => { m[r.stage] = (m[r.stage] || 0) + 1; }); return m; };
  const boardHtml = (ctx, big) => { const groups = ctx.stages.length ? ctx.stages.map((s) => s.title) : Object.keys(byStage(ctx)); const cols = groups.map((g) => { const items = ctx.records.rows.filter((r) => r.stage === g); return `<div class="da-col"><div class="da-col-h">${esc(g)}<span class="da-count">${items.length}</span></div>${items.map((r) => `<div class="da-ticket"><b>${esc(r.id)}</b><small>${esc(r.target || "")}・${esc(r.owner || "")}</small><span class="da-tag tag-${esc(r.priority || "medium")}">${esc(r.risk || "")}</span></div>`).join("") || '<div style="font-size:12px;color:#94a3b8;padding:6px 4px;">—</div>'}</div>`; }).join(""); return `<div class="da-board${big ? " big" : ""}">${cols}</div>`; };
  const tableHtml = (ctx) => { const cols = ctx.records.columns || Object.keys(ctx.records.rows[0]).map((k) => ({ key: k, label: k })); return `<div class="da-table-wrap"><table class="da-table"><thead><tr>${cols.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr></thead><tbody>${ctx.records.rows.map((r) => `<tr>${cols.map((c) => { const v = r[c.key]; if (c.key === "risk") return `<td><span class="da-pill pill-risk">${esc(v)}</span></td>`; if (c.key === "stage") return `<td><span class="da-pill pill-stage">${esc(v)}</span></td>`; if (c.key === "id") return `<td style="font-weight:800;color:var(--da-ink);">${esc(v)}</td>`; return `<td>${esc(v)}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`; };
  const aiHtml = (ctx) => `<div class="da-ai"><div class="da-ai-row"><span class="da-ai-ico"><span class="material-symbols-outlined">auto_awesome</span></span><p><b>今日重點：</b>目前 ${ctx.records.rows.filter((r) => r.priority === "high").length} 筆高優先項目需先處理，${esc((ctx.D.flow && ctx.D.flow.output) || "完成後留存紀錄")}。</p></div>${ctx.rules.map((r) => `<div class="da-rule"><span class="rid">${esc(r.id || "RULE")}</span><p>${esc(r.rule)}</p></div>`).join("") || '<div class="da-rule"><span class="rid">RULE</span><p>依期限與影響度自動排序待處理項目。</p></div>'}</div>`;
  const rolesChips = (ctx) => ctx.entry.map((r) => `<span class="da-role">${esc(r)}</span>`).join("") || '<span class="da-role">承辦</span>';

  function drawDonut(elId, ctx, holder) {
    if (!window.echarts) return; const el = document.getElementById(elId); if (!el) return;
    const m = byStage(ctx); const data = Object.keys(m).map((k) => ({ name: k, value: m[k] }));
    const c = echarts.init(el);
    c.setOption({ tooltip: { trigger: "item" }, legend: { bottom: 0, textStyle: { fontSize: 11 } }, series: [{ type: "pie", radius: ["48%", "72%"], center: ["50%", "44%"], itemStyle: { borderColor: "#fff", borderWidth: 2 }, label: { show: false }, data }] });
    holder.chart2 = c;
  }
  function drawBar(elId, ctx, holder) {
    if (!window.echarts) return; const el = document.getElementById(elId); if (!el) return;
    const cats = ctx.kpis.map((k) => k.label), max = ctx.kpis.map((k) => Math.max(k.before, k.after) || 1);
    const c = echarts.init(el);
    c.setOption({ grid: { left: 4, right: 60, top: 30, bottom: 4, containLabel: true }, legend: { data: ["導入前", "導入後"], top: 0, itemWidth: 12, itemHeight: 12 }, tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (ps) => { const i = ps[0].dataIndex; return `${cats[i]}<br/>前：<b>${ctx.kpis[i].before}${ctx.kpis[i].unit}</b><br/>後：<b>${ctx.kpis[i].after}${ctx.kpis[i].unit}</b>`; } }, xAxis: { type: "value", max: 100, show: false }, yAxis: { type: "category", data: cats, axisLine: { show: false }, axisTick: { show: false } }, series: [{ name: "導入前", type: "bar", data: ctx.kpis.map((k, i) => +(k.before / max[i] * 100).toFixed(1)), itemStyle: { color: "#cbd5e1", borderRadius: 4 } }, { name: "導入後", type: "bar", data: ctx.kpis.map((k, i) => +(k.after / max[i] * 100).toFixed(1)), itemStyle: { color: ctx.accent, borderRadius: 4 }, label: { show: true, position: "right", formatter: (p) => ctx.kpis[p.dataIndex].after + ctx.kpis[p.dataIndex].unit, fontWeight: "bold" } }] });
    holder.chart = c;
  }
  function drawTrend(elId, ctx, holder) {
    if (!window.echarts) return; const el = document.getElementById(elId); if (!el) return;
    const tr = (ctx.D.benefits && ctx.D.benefits.trend) || { labels: [], series: [] };
    const c = echarts.init(el);
    c.setOption({ grid: { left: 8, right: 18, top: 20, bottom: 6, containLabel: true }, tooltip: { trigger: "axis" }, xAxis: { type: "category", boundaryGap: false, data: tr.labels || [], axisLabel: { color: "#64748b" } }, yAxis: { type: "value", splitLine: { lineStyle: { color: "#eef2f7" } }, axisLabel: { color: "#64748b" } }, series: (tr.series || []).map((s) => ({ name: s.name, type: "line", smooth: true, data: (s.data || []).map(num), symbolSize: 7, itemStyle: { color: ctx.accent }, lineStyle: { color: ctx.accent, width: 3 }, areaStyle: { color: hx(ctx.accent, 0.85) } })) });
    holder.chart = c;
  }

  /* ---------- archetype: CONSOLE (dark left sidebar dashboard) ---------- */
  function renderConsole(app, ctx, holder) {
    const nav = ctx.modules.map((m, i) => `<button data-i="${i}" class="${i === 0 ? "active" : ""}"><span class="material-symbols-outlined">${esc(m.icon || "widgets")}</span>${esc(m.name)}</button>`).join("");
    app.innerHTML = `<div class="da-shell arch-console">
      <aside class="da-side">
        <div class="da-brand"><span class="da-logo"><span class="material-symbols-outlined">hub</span></span><div><b>${esc(ctx.brand)}</b><small>Jvision Cloud</small></div></div>
        <nav class="da-nav"><div class="da-nav-t">功能模組</div>${nav}</nav>
        <div class="da-side-foot"><p>使用角色</p>${rolesChips(ctx)}</div>
      </aside>
      <div class="da-main">
        <header class="da-top"><div><h1 id="daTitle">${esc(ctx.modules[0] ? ctx.modules[0].name : "營運總覽")}</h1><div class="da-crumb">${esc(ctx.title)}</div></div>
          <label class="da-search"><span class="material-symbols-outlined" style="font-size:20px;">search</span><input placeholder="搜尋…" /></label><span class="da-date">2026-07-23</span><span class="da-ava">JV</span></header>
        <div class="da-body" id="daBody"></div>
      </div></div>`;
    const bodyEl = document.getElementById("daBody"), titleEl = document.getElementById("daTitle");
    function view(i) {
      if (holder.chart) { holder.chart.dispose(); holder.chart = null; } if (holder.chart2) { holder.chart2.dispose(); holder.chart2 = null; }
      const mod = ctx.modules[i] || { name: "營運總覽", desc: "" };
      titleEl.textContent = mod.name;
      const head = `<div class="da-view-head"><div><h2>${esc(mod.name)}</h2><p>${esc(mod.desc || ctx.D.system && ctx.D.system.summary || "")}</p></div><button class="da-btn"><span class="material-symbols-outlined">add</span>新增</button></div>`;
      bodyEl.innerHTML = head + kpiStrip(ctx) +
        `<div class="da-grid" style="grid-template-columns:1.7fr 1fr;"><div class="da-card"><h3><span class="material-symbols-outlined">view_kanban</span>流程看板</h3><p class="da-sub">依階段檢視每一筆項目的即時狀態。</p>${boardHtml(ctx)}</div><div class="da-card"><h3><span class="material-symbols-outlined">smart_toy</span>AI 建議與規則</h3>${aiHtml(ctx)}</div></div>` +
        `<div class="da-grid" style="grid-template-columns:1.6fr 1fr;"><div class="da-card"><h3><span class="material-symbols-outlined">table_rows</span>${esc(ctx.records.title || "資料清單")}</h3>${tableHtml(ctx)}</div><div class="da-card"><h3><span class="material-symbols-outlined">insights</span>各階段分佈</h3><div id="daChart" class="da-chart"></div></div></div>`;
      drawDonut("daChart", ctx, holder);
    }
    app.querySelector(".da-nav").addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (!b) return; app.querySelectorAll(".da-nav button").forEach((x) => x.classList.toggle("active", x === b)); view(Number(b.dataset.i)); });
    view(0);
  }

  /* ---------- archetype: PIPELINE (light, top tabs, kanban hero) ---------- */
  function renderPipeline(app, ctx, holder) {
    const tabs = ctx.modules.map((m, i) => `<button data-i="${i}" class="${i === 0 ? "active" : ""}"><span class="material-symbols-outlined">${esc(m.icon || "widgets")}</span>${esc(m.name)}</button>`).join("");
    app.innerHTML = `<div class="arch-pipeline">
      <header class="pl-top">
        <div class="pl-brand"><span class="pl-logo"><span class="material-symbols-outlined">deployed_code</span></span><b>${esc(ctx.brand)}</b></div>
        <nav class="pl-tabs">${tabs}</nav>
        <div class="pl-actions"><label class="da-search"><span class="material-symbols-outlined" style="font-size:20px;">search</span><input placeholder="搜尋…" /></label><span class="da-ava">JV</span></div>
      </header>
      <div class="pl-body">
        <div class="da-view-head"><div><h2 id="daTitle">${esc(ctx.title)}</h2><p>${esc(ctx.D.system && ctx.D.system.summary || "")}</p></div><button class="da-btn"><span class="material-symbols-outlined">add</span>新增${esc(clip((ctx.records.title || "").replace(/清單/, ""), 6))}</button></div>
        ${kpiStrip(ctx)}
        <div id="daBody"></div>
      </div></div>`;
    const bodyEl = document.getElementById("daBody"), titleEl = document.getElementById("daTitle");
    function view(i) {
      if (holder.chart2) { holder.chart2.dispose(); holder.chart2 = null; }
      const mod = ctx.modules[i] || { name: ctx.title };
      titleEl.textContent = mod.name;
      bodyEl.innerHTML = `<div class="da-card" style="margin-bottom:18px;"><h3><span class="material-symbols-outlined">view_kanban</span>${esc(mod.name)}・管線看板</h3><p class="da-sub">${esc(mod.desc || "拖動式階段管理，隨時掌握每一筆的進度。")}</p>${boardHtml(ctx, true)}</div>
        <div class="da-grid" style="grid-template-columns:1.7fr 1fr;"><div class="da-card"><h3><span class="material-symbols-outlined">table_rows</span>${esc(ctx.records.title || "清單")}</h3>${tableHtml(ctx)}</div><div class="da-card"><h3><span class="material-symbols-outlined">smart_toy</span>AI 建議</h3>${aiHtml(ctx)}</div></div>`;
    }
    app.querySelector(".pl-tabs").addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (!b) return; app.querySelectorAll(".pl-tabs button").forEach((x) => x.classList.toggle("active", x === b)); view(Number(b.dataset.i)); });
    view(0);
  }

  /* ---------- archetype: REPORT (light, top nav, analytics/charts) ---------- */
  function renderReport(app, ctx, holder) {
    const links = ctx.modules.map((m, i) => `<button data-i="${i}" class="${i === 0 ? "active" : ""}">${esc(m.name)}</button>`).join("");
    app.innerHTML = `<div class="arch-report">
      <header class="rp-top">
        <div class="rp-brand"><span class="rp-logo"><span class="material-symbols-outlined">analytics</span></span><div><b>${esc(ctx.brand)}</b><small>Analytics & Reporting</small></div></div>
        <nav class="rp-nav">${links}</nav>
        <span class="da-ava">JV</span>
      </header>
      <div class="rp-body">
        <div class="da-view-head"><div><h2 id="daTitle">${esc(ctx.modules[0] ? ctx.modules[0].name : "營運總覽")}</h2><p>${esc(ctx.D.system && ctx.D.system.summary || "")}</p></div><button class="da-btn ghost"><span class="material-symbols-outlined">download</span>匯出報表</button></div>
        ${kpiStrip(ctx)}
        <div id="daBody"></div>
      </div></div>`;
    const bodyEl = document.getElementById("daBody"), titleEl = document.getElementById("daTitle");
    function view(i) {
      if (holder.chart) { holder.chart.dispose(); holder.chart = null; } if (holder.chart2) { holder.chart2.dispose(); holder.chart2 = null; }
      const mod = ctx.modules[i] || { name: "總覽" };
      titleEl.textContent = mod.name;
      bodyEl.innerHTML = `<div class="da-grid" style="grid-template-columns:1.5fr 1fr; margin-bottom:18px;"><div class="da-card"><h3><span class="material-symbols-outlined">bar_chart</span>導入前後對比</h3><div id="daChart" class="da-chart"></div></div><div class="da-card"><h3><span class="material-symbols-outlined">donut_large</span>各階段分佈</h3><div id="daChart2" class="da-chart"></div></div></div>
        <div class="da-card" style="margin-bottom:18px;"><h3><span class="material-symbols-outlined">trending_up</span>改善趨勢</h3><div id="daChart3" class="da-chart" style="height:240px;"></div></div>
        <div class="da-card"><h3><span class="material-symbols-outlined">table_rows</span>${esc(ctx.records.title || "明細")}</h3>${tableHtml(ctx)}</div>`;
      drawBar("daChart", ctx, holder);
      drawDonut("daChart2", ctx, holder);
      drawTrend("daChart3", ctx, { get chart() { return null; }, set chart(v) { holder._t = v; } });
    }
    app.querySelector(".rp-nav").addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (!b) return; app.querySelectorAll(".rp-nav button").forEach((x) => x.classList.toggle("active", x === b)); view(Number(b.dataset.i)); });
    view(0);
  }

  async function init() {
    const repo = getRepo();
    let D = null;
    try { const r = await fetch(`../../content/details/${repo}.json`); if (r.ok) D = await r.json(); } catch (e) {}
    if (!D) { try { const r = await fetch(`/content/details/${repo}.json`); if (r.ok) D = await r.json(); } catch (e) {} }
    if (!D) { document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif;color:#64748b;">找不到此系統的資料。</div>'; return; }
    boot(D);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
