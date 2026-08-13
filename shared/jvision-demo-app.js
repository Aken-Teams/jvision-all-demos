/**
 * jvision-demo-app.js — pure-UI, multi-screen system mockup for each demo.
 * One data model (content/details/<repo>.json) → a complete product UI where EACH
 * nav item renders a DIFFERENT full screen (dashboard / list / board / form / detail /
 * analytics / approval / calendar / inventory / AI), so every module & flow step can be
 * screenshotted. Fake data, no backend. Chrome (nav position/style) varies by industry.
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
  const ICON = (n) => `<span class="material-symbols-outlined">${n}</span>`;
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
    for (let i = 0; i < 8; i++) rows.push({ id: `NO-${String(i + 1).padStart(3, "0")}`, title: `${obj} ${i + 1}`, target: `${obj} ${i + 1}`, owner: OWNERS[i % OWNERS.length], due: `2026-07-${20 + (i % 8)}`, risk: rk[i % rk.length], stage: st[i % st.length], amount: 40 + (i * 37 % 160), priority: i < 2 ? "high" : i < 5 ? "medium" : "low" });
    return { title: `${obj}清單`, columns: [{ key: "id", label: "編號" }, { key: "target", label: "對象" }, { key: "owner", label: "負責人" }, { key: "due", label: "期限" }, { key: "risk", label: "狀態/風險" }, { key: "stage", label: "階段" }], rows };
  }

  // ---------- shared bits ----------
  const kpiStrip = (ctx) => `<div class="da-kpis">${ctx.kpis.map((k) => { const up = improved(k), d = deltaPct(k); return `<div class="da-kpi"><div class="k-l">${ICON("monitoring")}${esc(k.label)}</div><div class="k-v">${esc(k.after)}<small>${esc(k.unit)}</small></div><div class="k-d ${up ? "k-up" : "k-down"}">${d > 0 ? "+" : ""}${d}%・較導入前 ${esc(k.before)}${esc(k.unit)}</div></div>`; }).join("")}</div>`;
  const pill = (v, cls) => `<span class="da-pill ${cls}">${esc(v)}</span>`;
  const priTag = (p) => `<span class="da-tag tag-${esc(p || "medium")}">${p === "high" ? "高" : p === "low" ? "低" : "中"}</span>`;
  const cols = (ctx) => ctx.records.columns || Object.keys(ctx.records.rows[0]).map((k) => ({ key: k, label: k }));
  const tableFull = (ctx) => `<div class="da-table-wrap"><table class="da-table"><thead><tr><th></th>${cols(ctx).map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr></thead><tbody>${ctx.records.rows.map((r) => `<tr><td>${priTag(r.priority)}</td>${cols(ctx).map((c) => { const v = r[c.key]; if (c.key === "risk") return `<td>${pill(v, "pill-risk")}</td>`; if (c.key === "stage") return `<td>${pill(v, "pill-stage")}</td>`; if (c.key === "id") return `<td style="font-weight:800;color:var(--da-ink);">${esc(v)}</td>`; return `<td>${esc(v)}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
  const boardHtml = (ctx, big) => {
    // columns follow the records' actual stages so every column has data (never empty)
    let g = [...new Set(ctx.records.rows.map((r) => r.stage).filter(Boolean))];
    if (!g.length) g = ctx.stages.map((s) => s.title);
    const pt = (p) => (p === "high" ? "高" : p === "low" ? "低" : "中");
    return `<div class="da-board${big ? " big" : ""}">${g.map((s) => { const items = ctx.records.rows.filter((r) => r.stage === s); return `<div class="da-col"><div class="da-col-h">${esc(s)}<span class="da-count">${items.length}</span></div>${items.map((r) => `<div class="da-ticket"><div class="da-tk-top"><b>${esc(r.id)}</b><span class="da-tag tag-${esc(r.priority)}">${pt(r.priority)}</span></div><p class="da-tk-t">${esc(r.target || "")}</p>${progress(prPct(r))}<div class="da-tk-foot"><span class="da-owner sm">${avatar(r.owner)}${esc(clip(r.owner, 4))}</span><span class="da-tk-due">${ICON("schedule")}${esc(r.due || "")}</span></div><span class="da-tk-risk">${esc(r.risk || "")}</span></div>`).join("")}<button class="da-col-add">${ICON("add")}新增</button></div>`; }).join("")}</div>`;
  };
  const aiBlock = (ctx) => `<div class="da-ai"><div class="da-ai-row"><span class="da-ai-ico">${ICON("auto_awesome")}</span><p><b>今日重點：</b>目前 ${ctx.records.rows.filter((r) => r.priority === "high").length} 筆高優先項目需先處理，${esc((ctx.D.flow && ctx.D.flow.output) || "完成後留存紀錄")}。</p></div>${(ctx.rules.length ? ctx.rules : [{ id: "RULE", rule: "依期限與影響度自動排序待處理項目。" }]).map((r) => `<div class="da-rule"><span class="rid">${esc(r.id || "RULE")}</span><p>${esc(r.rule)}</p></div>`).join("")}</div>`;
  const miniList = (ctx, n) => ctx.records.rows.slice(0, n || 5).map((r) => `<div class="da-mini"><div><b>${esc(r.id)}</b><small>${esc(r.target)}・${esc(r.owner)}</small></div>${pill(r.stage, "pill-stage")}</div>`).join("");
  const priorityList = (ctx) => { const rank = { high: 0, medium: 1, low: 2 }; return [...ctx.records.rows].sort((a, b) => rank[a.priority] - rank[b.priority]).slice(0, 6).map((r, i) => `<div class="da-prio"><span class="da-prio-n">${i + 1}</span><div style="flex:1;"><b>${esc(r.id)}</b><small>${esc(r.target)}・${esc(r.risk)}</small></div>${priTag(r.priority)}</div>`).join(""); };
  const timeline = (ctx) => ctx.stages.map((s, i) => `<div class="da-tl ${i < 2 ? "done" : i === 2 ? "cur" : ""}"><span class="da-tl-dot"></span><div><b>${esc(s.title)}</b>${s.role ? `<small>${esc(s.role)}</small>` : ""}</div></div>`).join("");
  // richer bits
  const AVC = ["#4338ca", "#0f766e", "#b45309", "#be123c", "#0369a1", "#7c3aed", "#0891b2", "#c2410c"];
  const avatar = (name) => { const n = String(name || "?"); const c = AVC[n.length % AVC.length]; return `<span class="da-av2" style="background:${c}1f;color:${c};">${esc(n.slice(-1))}</span>`; };
  const progress = (pct, color) => `<div class="da-prog"><span style="width:${pct}%;${color ? "background:" + color + ";" : ""}"></span></div>`;
  const prPct = (r) => (r.priority === "high" ? 30 : r.priority === "low" ? 92 : 64);
  const alertBanner = (ctx) => { const hi = ctx.records.rows.filter((r) => r.priority === "high").length; return `<div class="da-alert">${ICON("notifications_active")}<div class="da-alert-t"><b>今日有 ${hi} 筆高優先項目需先處理</b><span>系統已依規則自動排序，可於「AI 助理」查看完整建議。</span></div><button class="da-btn sm">立即查看</button></div>`; };
  const ACTS = [["add_circle", "建立"], ["sync", "更新"], ["arrow_forward", "推進"], ["person_add", "指派"], ["check_circle", "完成"], ["undo", "退回"]];
  const activityFeed = (ctx) => ctx.records.rows.slice(0, 6).map((r, i) => { const a = ACTS[i % 6]; return `<div class="da-act"><span class="da-act-ic">${ICON(a[0])}</span><div><p><b>${esc(r.owner)}</b> ${a[1]}了 <b>${esc(r.id)}</b>${i % 6 === 2 ? "・" + esc(r.stage) : ""}</p><small>${(i + 1) * 7} 分鐘前</small></div></div>`; }).join("");
  const quickTiles = (ctx) => ctx.modules.slice(1, 5).map((m) => `<button class="da-qt">${ICON(m.icon || "bolt")}<span>${esc(m.name)}</span></button>`).join("");
  const tableRich = (ctx) => `<div class="da-table-wrap"><table class="da-table"><thead><tr><th></th>${cols(ctx).map((c) => `<th>${esc(c.label)}</th>`).join("")}<th>進度</th><th></th></tr></thead><tbody>${ctx.records.rows.map((r) => `<tr><td>${priTag(r.priority)}</td>${cols(ctx).map((c) => { const v = r[c.key]; if (c.key === "owner") return `<td><span class="da-owner">${avatar(v)}${esc(v)}</span></td>`; if (c.key === "risk") return `<td>${pill(v, "pill-risk")}</td>`; if (c.key === "stage") return `<td>${pill(v, "pill-stage")}</td>`; if (c.key === "id") return `<td style="font-weight:800;color:var(--da-ink);">${esc(v)}</td>`; return `<td>${esc(v)}</td>`; }).join("")}<td style="min-width:96px;">${progress(prPct(r))}</td><td><button class="da-icon-btn">${ICON("more_horiz")}</button></td></tr>`).join("")}</tbody></table></div>`;
  const sumRow = (ctx) => { const rows = ctx.records.rows; const hi = rows.filter((r) => r.priority === "high").length, done = rows.filter((r) => /完成|已|入庫|關閉|結案/.test(r.stage)).length; return `<div class="da-sumrow"><div class="da-sum"><span>總項目</span><b>${rows.length}</b></div><div class="da-sum"><span>高優先</span><b style="color:#dc2626;">${hi}</b></div><div class="da-sum"><span>已完成</span><b style="color:#059669;">${done}</b></div><div class="da-sum"><span>完成率</span><b>${Math.round(done / rows.length * 100)}%</b></div></div>`; };

  // ---------- screen builders ----------
  const SCREENS = {
    dashboard(ctx) {
      return alertBanner(ctx) + kpiStrip(ctx) +
        `<div class="da-grid" style="grid-template-columns:1.8fr 1fr;"><div class="da-card"><div class="da-ch-h"><h3>${ICON("trending_up")}處理量與改善趨勢</h3><div class="da-seg"><button class="on">近 6 週</button><button>近 30 天</button></div></div><div id="daC1" class="da-chart" style="height:250px;"></div></div><div class="da-card"><h3>${ICON("donut_large")}各階段分佈</h3><div id="daC2" class="da-chart" style="height:250px;"></div></div></div>` +
        `<div class="da-grid" style="grid-template-columns:1.7fr 1fr;"><div class="da-card"><div class="da-ch-h"><h3>${ICON("view_kanban")}流程看板</h3><a class="da-link">查看全部 ${ICON("chevron_right")}</a></div>${boardHtml(ctx)}</div><div class="da-card"><h3>${ICON("bolt")}最新動態</h3><div class="da-feed">${activityFeed(ctx)}</div></div></div>` +
        `<div class="da-grid" style="grid-template-columns:1.7fr 1fr;"><div class="da-card"><div class="da-ch-h"><h3>${ICON("table_rows")}${esc(ctx.records.title || "資料清單")}</h3><a class="da-link">全部 ${ICON("chevron_right")}</a></div>${tableRich(ctx)}</div><div class="da-side-stack"><div class="da-card"><h3>${ICON("bolt")}快速操作</h3><div class="da-qtiles">${quickTiles(ctx)}</div></div><div class="da-card"><h3>${ICON("smart_toy")}AI 建議</h3>${aiBlock(ctx)}</div></div></div>`;
    },
    list(ctx, mod) {
      return sumRow(ctx) +
        `<div class="da-toolbar"><div class="da-chip-row">${["全部", ...[...new Set(ctx.records.rows.map((r) => r.stage))].slice(0, 4)].map((c, i) => `<span class="da-chip${i === 0 ? " on" : ""}">${esc(c)}</span>`).join("")}</div><label class="da-search sm">${ICON("search")}<input placeholder="搜尋${esc(mod.name)}…" /></label><button class="da-btn ghost">${ICON("filter_list")}篩選</button><button class="da-btn ghost">${ICON("download")}匯出</button><button class="da-btn">${ICON("add")}新增</button></div>
        <div class="da-card" style="padding:0;">${tableRich(ctx)}<div class="da-foot"><span>共 ${ctx.records.rows.length} 筆</span><div class="da-pager"><button class="da-icon-btn">${ICON("chevron_left")}</button><b>1</b><span>/ 1</span><button class="da-icon-btn">${ICON("chevron_right")}</button></div></div></div>`;
    },
    board(ctx, mod) {
      return `<div class="da-toolbar"><div class="da-chip-row"><span class="da-chip on">全部</span><span class="da-chip">${ICON("person")}我的</span><span class="da-chip">${ICON("flag")}高優先</span></div><label class="da-search sm">${ICON("search")}<input placeholder="搜尋…" /></label><button class="da-btn ghost">${ICON("tune")}分組</button><button class="da-btn">${ICON("add")}新增</button></div>
        ${sumRow(ctx)}
        <div class="da-card" style="background:transparent;border:0;padding:0;">${boardHtml(ctx, true)}</div>`;
    },
    form(ctx, mod) {
      const fields = (ctx.D.flow && ctx.D.flow.inputs && ctx.D.flow.inputs.length) ? ctx.D.flow.inputs : ["名稱／編號", "負責人", "期限"];
      const stages = ctx.stages.map((s) => s.title);
      return `<div class="da-grid" style="grid-template-columns:1.35fr 1fr;">
        <div class="da-stack">
          <div class="da-card"><h3>${ICON("edit_note")}新增${esc(mod.name.replace(/管理|中心|系統/g, "")) || "項目"}</h3><p class="da-sub">填寫後送出，系統會自動排入流程並通知負責人。</p>
            <div class="da-form">${fields.map((f) => `<label class="da-field"><span>${esc(f)}</span><input placeholder="輸入${esc(clip(f, 12))}" /></label>`).join("")}
              <label class="da-field"><span>階段</span><select>${(stages.length ? stages : ["待處理", "處理中"]).map((s) => `<option>${esc(s)}</option>`).join("")}</select></label>
              <label class="da-field"><span>優先度</span><select><option>高</option><option selected>中</option><option>低</option></select></label>
              <label class="da-field"><span>負責人</span><select>${OWNERS.slice(0, 5).map((o) => `<option>${esc(o)}</option>`).join("")}</select></label>
              <label class="da-field"><span>期限</span><input type="date" /></label>
              <label class="da-field full"><span>備註</span><textarea rows="3" placeholder="補充說明…"></textarea></label></div>
            <div class="da-drop">${ICON("upload_file")}拖曳附件到此，或<a class="da-link">選擇檔案</a></div>
            <div class="da-form-act"><button class="da-btn">${ICON("save")}建立並送出</button><button class="da-btn ghost">儲存草稿</button></div></div>
        </div>
        <div class="da-stack">
          <div class="da-card"><h3>${ICON("tips_and_updates")}填寫提示</h3><ul class="da-tips"><li>期限影響排序，請務必填寫。</li><li>高優先項目會即時通知主管。</li><li>可先存草稿，稍後補齊附件。</li></ul></div>
          <div class="da-card"><h3>${ICON("history")}最近建立</h3>${miniList(ctx, 5)}</div></div></div>`;
    },
    detail(ctx, mod) {
      const r = ctx.records.rows[0];
      return `<div class="da-grid" style="grid-template-columns:1.55fr 1fr;">
        <div class="da-stack">
          <div class="da-card"><div class="da-detail-head"><div><span class="da-crumb2">${esc(mod.name)}</span><h3 style="margin:3px 0 0;font-size:18px;">${esc(r.id)}・${esc(r.target)}</h3></div><div style="display:flex;gap:8px;align-items:center;">${pill(r.stage, "pill-stage")}${priTag(r.priority)}</div></div>
            <div class="da-tabs2"><button class="on">概覽</button><button>歷程</button><button>附件</button><button>留言</button></div>
            <div class="da-detail-fields">${cols(ctx).map((c) => `<div><span>${esc(c.label)}</span><b>${esc(r[c.key])}</b></div>`).join("")}<div><span>進度</span>${progress(prPct(r))}</div></div>
            <h4 class="da-h4">${ICON("timeline")}處理進度</h4><div class="da-timeline">${timeline(ctx)}</div>
            <div class="da-detail-act"><button class="da-btn">${ICON("check")}推進下一步</button><button class="da-btn ghost">${ICON("edit")}編輯</button><button class="da-btn ghost">${ICON("forum")}留言</button></div></div>
        </div>
        <div class="da-stack">
          <div class="da-card"><h3>${ICON("bolt")}活動紀錄</h3><div class="da-feed">${activityFeed(ctx)}</div></div>
          <div class="da-card"><h3>${ICON("smart_toy")}AI 建議</h3>${aiBlock(ctx)}</div></div></div>`;
    },
    analytics(ctx) {
      return kpiStrip(ctx) +
        `<div class="da-grid" style="grid-template-columns:1.5fr 1fr;margin-top:18px;"><div class="da-card"><h3>${ICON("bar_chart")}導入前後對比</h3><div id="daC1" class="da-chart"></div></div><div class="da-card"><h3>${ICON("donut_large")}各階段分佈</h3><div id="daC2" class="da-chart"></div></div></div>
        <div class="da-grid" style="grid-template-columns:1.5fr 1fr;margin-top:18px;"><div class="da-card"><h3>${ICON("trending_up")}改善趨勢</h3><div id="daC3" class="da-chart" style="height:230px;"></div></div><div class="da-card"><h3>${ICON("speed")}關鍵達成率</h3><div id="daC4" class="da-chart" style="height:230px;"></div></div></div>
        <div class="da-card" style="margin-top:18px;"><div class="da-ch-h"><h3>${ICON("table_rows")}明細</h3><a class="da-link">${ICON("download")}匯出</a></div>${tableRich(ctx)}</div>`;
    },
    approval(ctx, mod) {
      const rows = ctx.records.rows.slice(0, 6);
      return sumRow(ctx) +
        `<div class="da-tabs2" style="margin-bottom:16px;"><button class="on">待審核 ${rows.length}</button><button>已核准</button><button>已退回</button></div>
        <div class="da-grid" style="grid-template-columns:1.7fr 1fr;">
          <div class="da-card"><h3>${ICON("fact_check")}${esc(mod.name)}・待審核</h3><p class="da-sub">依規則自動排序，逐筆核准或退回。</p>
            ${rows.map((r) => `<div class="da-approve"><div class="da-approve-i"><div class="da-owner">${avatar(r.owner)}<b>${esc(r.id)}</b> ${pill(r.stage, "pill-stage")}</div><small>${esc(r.target)}・${esc(r.owner)}・期限 ${esc(r.due)}・${esc(r.risk)}</small></div><div class="da-approve-act"><button class="da-btn sm">${ICON("check")}核准</button><button class="da-btn ghost sm">${ICON("close")}退回</button></div></div>`).join("")}</div>
          <div class="da-card"><h3>${ICON("gavel")}判斷依據</h3>${(ctx.rules.length ? ctx.rules : [{ id: "RULE", rule: "依期限與影響度自動排序。" }]).map((r) => `<div class="da-rule"><span class="rid">${esc(r.id)}</span><p>${esc(r.rule)}</p></div>`).join("")}</div></div>`;
    },
    calendar(ctx, mod) {
      const days = ["一", "二", "三", "四", "五", "六", "日"];
      const rows = ctx.records.rows;
      const cells = days.map((d, di) => { const items = rows.filter((_, i) => i % 7 === di).slice(0, 3); return `<div class="da-cal-col"><div class="da-cal-h">週${d}<small>7/${20 + di}</small></div>${items.map((r) => `<div class="da-cal-ev tag-${esc(r.priority)}">${esc(clip(r.target, 8))}<small>${esc(r.owner)}・${esc(r.stage)}</small></div>`).join("")}</div>`; }).join("");
      return `<div class="da-grid" style="grid-template-columns:1fr 300px;">
        <div class="da-card"><div class="da-cal-top"><h3 style="margin:0;">${ICON("calendar_month")}${esc(mod.name)}・本週排程</h3><div class="da-seg"><button>日</button><button class="on">週</button><button>月</button></div></div><div class="da-cal">${cells}</div></div>
        <div class="da-card"><h3>${ICON("event")}今日議程</h3>${miniList(ctx, 6)}</div></div>`;
    },
    inventory(ctx, mod) {
      return sumRow(ctx) +
        `<div class="da-card"><div class="da-ch-h"><h3>${ICON("inventory_2")}${esc(mod.name)}・存量總覽</h3><button class="da-btn sm">${ICON("add")}進貨</button></div><p class="da-sub">即時存量與安全水位，低於門檻自動標示補貨。</p>
          <div class="da-inv">${ctx.records.rows.map((r) => { const lvl = r.priority === "high" ? 18 : r.priority === "medium" ? 54 : 86; const low = lvl < 30; return `<div class="da-inv-cell"><div class="da-inv-t"><b>${esc(r.target)}</b>${low ? '<span class="da-tag tag-high">補貨</span>' : ""}</div><div class="da-bar"><span style="width:${lvl}%; background:${low ? "#dc2626" : "var(--da-accent)"};"></span></div><small>${esc(r.stage)}・存量 ${lvl}%・${esc(r.owner)}</small></div>`; }).join("")}</div></div>`;
    },
    ai(ctx) {
      return `<div class="da-grid" style="grid-template-columns:1fr 1.25fr;">
        <div class="da-stack"><div class="da-card"><h3>${ICON("smart_toy")}AI 摘要與建議</h3>${aiBlock(ctx)}</div><div class="da-card"><h3>${ICON("insights")}本週洞察</h3><div class="da-feed">${activityFeed(ctx)}</div></div></div>
        <div class="da-card"><div class="da-ch-h"><h3>${ICON("priority_high")}待處理優先序</h3><span class="da-scr-tag">AI 排序</span></div><p class="da-sub">系統依期限、影響度與規則自動排出最該先處理的項目。</p>${priorityList(ctx)}</div></div>`;
    },
  };
  function screenType(name) {
    if (/AI|建議|摘要|洞察|智能|助理/.test(name)) return "ai";
    if (/分析|報表|儀表|OEE|稼動|趨勢|統計|績效|BI|經營/.test(name)) return "analytics";
    if (/審核|覆核|簽核|核准|核決|審查|審批|核銷/.test(name)) return "approval";
    if (/排班|預約|行事曆|課表|時段|門診|掛號/.test(name)) return "calendar";
    if (/庫存|備品|儲位|盤點|進銷|料件|補貨/.test(name)) return "inventory";
    if (/看板|管線|排程|派工|流程|進度|狀態|波次/.test(name)) return "board";
    if (/建立|新增|登記|受理|回報|申請|填報|開單|報工|派發/.test(name)) return "form";
    if (/追溯|履歷|案件|明細|檔案|360|病歷|合約/.test(name)) return "detail";
    return "list";
  }
  function assignScreens(modules) {
    const order = ["list", "board", "form", "detail", "analytics", "approval", "calendar", "inventory", "ai"];
    const used = new Set(), out = [];
    modules.forEach((m, i) => {
      let t = i === 0 ? "dashboard" : screenType(m.name);
      if (t !== "dashboard" && used.has(t)) t = order.find((x) => !used.has(x)) || t;
      used.add(t); out.push(t);
    });
    return out;
  }

  function charts(type, ctx, holder) {
    if (!window.echarts) return;
    const mkBar = (id) => { const el = document.getElementById(id); if (!el) return; const cats = ctx.kpis.map((k) => k.label), mx = ctx.kpis.map((k) => Math.max(k.before, k.after) || 1); const c = echarts.init(el); c.setOption({ grid: { left: 4, right: 60, top: 30, bottom: 4, containLabel: true }, legend: { data: ["導入前", "導入後"], top: 0, itemWidth: 12, itemHeight: 12 }, tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: (ps) => { const i = ps[0].dataIndex; return `${cats[i]}<br/>前：<b>${ctx.kpis[i].before}${ctx.kpis[i].unit}</b><br/>後：<b>${ctx.kpis[i].after}${ctx.kpis[i].unit}</b>`; } }, xAxis: { type: "value", max: 100, show: false }, yAxis: { type: "category", data: cats, axisLine: { show: false }, axisTick: { show: false } }, series: [{ name: "導入前", type: "bar", data: ctx.kpis.map((k, i) => +(k.before / mx[i] * 100).toFixed(1)), itemStyle: { color: "#cbd5e1", borderRadius: 4 } }, { name: "導入後", type: "bar", data: ctx.kpis.map((k, i) => +(k.after / mx[i] * 100).toFixed(1)), itemStyle: { color: ctx.accent, borderRadius: 4 }, label: { show: true, position: "right", formatter: (p) => ctx.kpis[p.dataIndex].after + ctx.kpis[p.dataIndex].unit, fontWeight: "bold" } }] }); holder.push(c); };
    const mkDonut = (id) => { const el = document.getElementById(id); if (!el) return; const m = {}; ctx.records.rows.forEach((r) => { m[r.stage] = (m[r.stage] || 0) + 1; }); const c = echarts.init(el); c.setOption({ tooltip: { trigger: "item" }, legend: { bottom: 0, textStyle: { fontSize: 11 } }, series: [{ type: "pie", radius: ["48%", "72%"], center: ["50%", "44%"], itemStyle: { borderColor: "#fff", borderWidth: 2 }, label: { show: false }, data: Object.keys(m).map((k) => ({ name: k, value: m[k] })) }] }); holder.push(c); };
    const mkTrend = (id) => { const el = document.getElementById(id); if (!el) return; const tr = (ctx.D.benefits && ctx.D.benefits.trend) || { labels: [], series: [] }; const c = echarts.init(el); c.setOption({ grid: { left: 8, right: 18, top: 20, bottom: 6, containLabel: true }, tooltip: { trigger: "axis" }, xAxis: { type: "category", boundaryGap: false, data: tr.labels || [], axisLabel: { color: "#64748b" } }, yAxis: { type: "value", splitLine: { lineStyle: { color: "#eef2f7" } }, axisLabel: { color: "#64748b" } }, series: (tr.series || []).map((s) => ({ name: s.name, type: "line", smooth: true, data: (s.data || []).map(num), symbolSize: 7, itemStyle: { color: ctx.accent }, lineStyle: { color: ctx.accent, width: 3 }, areaStyle: { color: hx(ctx.accent, 0.85) } })) }); holder.push(c); };
    const mkGauge = (id) => { const el = document.getElementById(id); if (!el) return; const pk = ctx.kpis.find((k) => k.unit === "%" && k.after > k.before) || ctx.kpis[0] || { after: 90 }; const v = Math.min(100, num(pk.after)); const c = echarts.init(el); c.setOption({ series: [{ type: "gauge", radius: "92%", center: ["50%", "58%"], startAngle: 200, endAngle: -20, min: 0, max: 100, progress: { show: true, width: 14, itemStyle: { color: ctx.accent } }, axisLine: { lineStyle: { width: 14, color: [[1, "#eef2f7"]] } }, pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, anchor: { show: false }, title: { show: true, offsetCenter: [0, "34%"], fontSize: 12, color: "#64748b" }, detail: { valueAnimation: true, formatter: "{value}%", fontSize: 30, fontWeight: "bolder", offsetCenter: [0, "-2%"], color: "#0f1e46" }, data: [{ value: v, name: clip(pk.label || "達成率", 8) }] }] }); holder.push(c); };
    if (type === "dashboard") { mkTrend("daC1"); mkDonut("daC2"); }
    else if (type === "analytics") { mkBar("daC1"); mkDonut("daC2"); mkTrend("daC3"); mkGauge("daC4"); }
  }

  // ---------- chrome (nav) ----------
  function chromeConsole(app, ctx) {
    const nav = ctx.modules.map((m, i) => `<button data-i="${i}" class="${i === 0 ? "active" : ""}">${ICON(m.icon || "widgets")}${esc(m.name)}</button>`).join("");
    app.innerHTML = `<div class="da-shell arch-console"><aside class="da-side"><div class="da-brand"><span class="da-logo">${ICON("hub")}</span><div><b>${esc(ctx.brand)}</b><small>Jvision Cloud</small></div></div><nav class="da-nav"><div class="da-nav-t">功能模組</div>${nav}</nav><div class="da-side-foot"><p>使用角色</p>${ctx.entry.map((r) => `<span class="da-role">${esc(r)}</span>`).join("") || '<span class="da-role">承辦</span>'}</div></aside><div class="da-main"><header class="da-top"><div><h1 id="daTitle">${esc(ctx.modules[0] ? ctx.modules[0].name : "營運總覽")}</h1><div class="da-crumb">${esc(ctx.title)}</div></div><label class="da-search">${ICON("search")}<input placeholder="搜尋…" /></label><span class="da-date">2026-07-23</span><span class="da-ava">JV</span></header><div class="da-body" id="daBody"></div></div></div>`;
    return ".da-nav";
  }
  function chromePipeline(app, ctx) {
    const tabs = ctx.modules.map((m, i) => `<button data-i="${i}" class="${i === 0 ? "active" : ""}">${ICON(m.icon || "widgets")}${esc(m.name)}</button>`).join("");
    app.innerHTML = `<div class="arch-pipeline"><header class="pl-top"><div class="pl-brand"><span class="pl-logo">${ICON("deployed_code")}</span><b>${esc(ctx.brand)}</b></div><nav class="pl-tabs">${tabs}</nav><div class="pl-actions"><label class="da-search">${ICON("search")}<input placeholder="搜尋…" /></label><span class="da-ava">JV</span></div></header><div class="pl-body"><header class="da-viewbar"><div><h1 id="daTitle">${esc(ctx.modules[0] ? ctx.modules[0].name : ctx.title)}</h1><div class="da-crumb">${esc(ctx.title)}</div></div></header><div id="daBody"></div></div></div>`;
    return ".pl-tabs";
  }
  function chromeReport(app, ctx) {
    const links = ctx.modules.map((m, i) => `<button data-i="${i}" class="${i === 0 ? "active" : ""}">${esc(m.name)}</button>`).join("");
    app.innerHTML = `<div class="arch-report"><header class="rp-top"><div class="rp-brand"><span class="rp-logo">${ICON("analytics")}</span><div><b>${esc(ctx.brand)}</b><small>Analytics & Reporting</small></div></div><nav class="rp-nav">${links}</nav><span class="da-ava">JV</span></header><div class="rp-body"><header class="da-viewbar"><div><h1 id="daTitle">${esc(ctx.modules[0] ? ctx.modules[0].name : "營運總覽")}</h1><div class="da-crumb">${esc(ctx.title)}</div></div></header><div id="daBody"></div></div></div>`;
    return ".rp-nav";
  }

  function boot(D) {
    const cat = D.category || "未分類";
    const accent = ACCENTS[cat] || "#1e40af";
    const rs = document.documentElement.style;
    rs.setProperty("--da-accent", accent); rs.setProperty("--da-soft", hx(accent, 0.9)); rs.setProperty("--da-soft2", hx(accent, 0.8)); rs.setProperty("--da-dark", dk(accent, 0.55));
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
      title: D.title || "系統", systemType: D.systemType || cat,
    };
    if (!ctx.modules.length) ctx.modules = [{ name: "營運總覽", icon: "dashboard", desc: "" }];
    // pad records so no screen ever looks sparse / empty
    if (ctx.records.rows.length < 6) {
      const rows = ctx.records.rows, base = rows[0] || { id: "NO-001", target: "項目", owner: OWNERS[0], due: "2026-07-22", risk: "待處理", stage: "處理中", priority: "medium" };
      const stages = [...new Set(rows.map((r) => r.stage).filter(Boolean))]; if (!stages.length) stages.push("處理中");
      const prefix = String(base.id || "NO-001").replace(/\d+$/, "");
      let n = rows.length;
      while (rows.length < 8) { n++; rows.push(Object.assign({}, base, { id: prefix + String(n).padStart(2, "0"), owner: OWNERS[n % OWNERS.length], stage: stages[n % stages.length], due: `2026-07-${20 + (n % 8)}`, priority: n % 3 === 0 ? "high" : n % 3 === 1 ? "medium" : "low", target: (base.target ? String(base.target).replace(/\s*\d+$/, "") : "項目") + " " + n })); }
    }
    // consistency: distribute records across the actual 運作流程 steps so the pipeline == the flow
    const flowSteps = ctx.stages.map((s) => s.title).filter(Boolean);
    if (flowSteps.length) ctx.records.rows.forEach((r, i) => { r.stage = flowSteps[i % flowSteps.length]; });
    const plan = assignScreens(ctx.modules);
    const archetype = ARCH[cat] || ["console", "pipeline", "report"][D.id % 3];
    const app = document.getElementById("app") || document.body;
    const navSel = ({ console: chromeConsole, pipeline: chromePipeline, report: chromeReport }[archetype] || chromeConsole)(app, ctx);

    const bodyEl = app.querySelector("#daBody"), titleEl = app.querySelector("#daTitle");
    let live = [];
    function view(i) {
      live.forEach((c) => { try { c.dispose(); } catch (e) {} }); live = [];
      const mod = ctx.modules[i] || { name: "營運總覽", desc: "" };
      const type = plan[i] || "list";
      if (titleEl) titleEl.textContent = mod.name;
      const head = `<div class="da-view-head"><div><h2>${esc(mod.name)}</h2><p>${esc(mod.desc || (ctx.D.system && ctx.D.system.summary) || "")}</p></div><span class="da-scr-tag">${screenLabel(type)}</span></div>`;
      bodyEl.innerHTML = head + SCREENS[type](ctx, mod);
      charts(type, ctx, live);
    }
    app.querySelector(navSel).addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (!b) return; app.querySelectorAll(navSel + " button").forEach((x) => x.classList.toggle("active", x === b)); view(Number(b.dataset.i)); });
    window.addEventListener("resize", () => live.forEach((c) => c.resize()));
    view(0);
  }
  const screenLabel = (t) => ({ dashboard: "營運總覽", list: "資料清單", board: "流程看板", form: "建立表單", detail: "案件明細", analytics: "分析報表", approval: "審核中心", calendar: "排程行事曆", inventory: "存量管理", ai: "AI 助理" }[t] || "");

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
