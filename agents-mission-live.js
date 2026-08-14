/* Mission 頁即時後端串接：POST /run → 消化 SSE → 左邊 AI 對話、右邊三種結果面板。
 * 後端：jvision-agents-office/server（python app.py，:4610）。 */
(function () {
  var API = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:4610/run" : "/run";
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
  var MODE = { task: "完成任務", report: "數據報告", doc: "產出文件" };
  var DM = { "internal-sim": ["內部系統", "#2563eb"], "external-real": ["外部查證", "#0d9488"], "reasoning": ["推理彙整", "#7c3aed"] };

  var state = { mode: "task", running: false, total: 0, done: 0, bubbles: {} };
  // 報告 iframe 內點選區塊 → 回報父視窗，顯示「已選取區塊 N」
  window.addEventListener("message", function (ev) {
    var d = ev && ev.data; if (!d || !d.jvrx) return;
    var el = document.querySelector("#resultDesc"); if (!el) return;
    if (d.jvrx === "ready") el.textContent = "報告完成 · 可點選任一區塊標記（hover 會出現虛線框）。";
    else if (d.jvrx === "select") el.textContent = d.selected
      ? ("已選取第 " + d.index + " / " + d.total + " 個區塊（再點一次取消、點其他區塊切換）")
      : "點選報告中任一區塊可標記；再點一次取消。";
  });
  var DESIGN_CSS = "";
  (function injectCss() {
    var s = document.createElement("style");
    DESIGN_CSS = [
      "@keyframes jvb{0%,100%{opacity:.3}50%{opacity:1}}@keyframes jvspin{to{transform:rotate(360deg)}}@keyframes jvfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}",
      // ── 結果畫面設計系統（比照 demo：卡片 / KPI / 圖表 / 表格 / 提示；RWD）──
      "#liveResult .jv-h{font-size:15px;font-weight:800;color:#0f172a;margin:0 0 10px;display:flex;align-items:center;gap:6px}",
      "#liveResult .jv-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px}",
      "#liveResult .jv-kpi{background:var(--jvbg,#f8fafc);border:1px solid #e8eef5;border-left:3px solid var(--jvaccent,#2563eb);border-radius:14px;padding:14px}",
      "#liveResult .jv-kpi .v{font-size:26px;font-weight:800;color:var(--jvaccent,#0f172a);letter-spacing:-.5px;line-height:1.1}",
      "#liveResult .jv-kpi .l{font-size:12px;color:#64748b;font-weight:600;margin-top:4px}",
      "#liveResult .jv-chart{width:100%;height:230px;margin:6px 0 14px}",
      "#liveResult table.jv-table{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0 14px}",
      "#liveResult .jv-table th{background:#f4f8fb;color:#64748b;font-size:11.5px;font-weight:700;text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0}",
      "#liveResult .jv-table td{padding:8px 10px;border-bottom:1px solid #eef2f7;color:#334155}",
      "#liveResult .jv-note{background:var(--jvbg,#f5f8ff);border:1px solid #dbe6f5;border-left:3px solid var(--jvaccent,#2563eb);border-radius:10px;padding:10px 12px;font-size:13px;color:#334155;line-height:1.7}",
      "#liveResult .jv-note a{color:var(--jvaccent,#2563eb);text-decoration:underline;word-break:break-all}",
      "#liveResult .jvsec{background:#fff;border:1px solid #e6ebf2;border-radius:16px;padding:16px;box-shadow:0 1px 2px rgba(15,23,42,.04)}",
      // ── 統一儀表板骨架 ──
      "#liveResult .jvdash-h{margin-bottom:14px}",
      "#liveResult .jvdash-t{font-size:18px;font-weight:800;color:var(--jvaccent,#0f172a);letter-spacing:-.3px}",
      "#liveResult .jvdash-s{font-size:12px;color:#64748b;margin-top:3px}",
      "#liveResult .jvdash-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:14px;align-items:start}",
      "#liveResult .jvblk{min-width:0;transition:box-shadow .5s}",
      // 圖表/表格 = 主次面板（白卡）；KPI/結論 = 整條帶（透明，內容自帶樣式）
      "#liveResult .jvblk-chart,#liveResult .jvblk-table,#liveResult .jvblk-timeline{background:#fff;border:1px solid #e6ebf2;border-top:3px solid var(--jvaccent,#2563eb);border-radius:16px;padding:16px;box-shadow:0 1px 2px rgba(15,23,42,.05)}",
      "#liveResult .jvblk-kpi,#liveResult .jvblk-note{background:transparent;padding:0}",
      "#liveResult .jvblk-ph{font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:8px}",
      "#liveResult .jvskel{height:14px;background:linear-gradient(90deg,#f1f5f9,#e5ebf2,#f1f5f9);background-size:200% 100%;animation:jvshim 1.2s infinite;border-radius:6px;margin:9px 0}",
      "@keyframes jvshim{0%{background-position:200% 0}100%{background-position:-200% 0}}",
      // ── 報告渲染器（demo 級版型：header / KPI / 圖表面板 / 表格 / 結論帶）──
      "#liveResult .rhead{margin-bottom:16px}",
      "#liveResult .rt{font-size:20px;font-weight:800;color:var(--jvaccent,#0369a1);letter-spacing:-.3px}",
      "#liveResult .rs{font-size:12px;color:#64748b;margin-top:2px}",
      "#liveResult .rsum{font-size:13px;color:#334155;margin-top:10px;background:#f8fafc;border-radius:10px;padding:10px 12px;border-left:3px solid var(--jvaccent,#0369a1);line-height:1.7}",
      "#liveResult .rkpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px}",
      "#liveResult .rkpi{background:#fff;border:1px solid #e6ebf2;border-radius:14px;padding:15px 16px;box-shadow:0 1px 2px rgba(15,23,42,.05);position:relative;overflow:hidden}",
      "#liveResult .rkpi::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--jvaccent,#0369a1)}",
      "#liveResult .rkpi .l{font-size:12px;color:#64748b;font-weight:600}",
      "#liveResult .rkpi .v{font-size:28px;font-weight:800;color:#0f172a;margin:5px 0 2px;letter-spacing:-.5px;line-height:1.05}",
      "#liveResult .rkpi .v small{font-size:13px;color:#94a3b8;font-weight:700}",
      "#liveResult .rkpi .d{font-size:12px;font-weight:700}",
      "#liveResult .rkpi .d.up{color:#16a34a}#liveResult .rkpi .d.down{color:#dc2626}#liveResult .rkpi .d.flat{color:#94a3b8}",
      "#liveResult .rmid{display:grid;grid-template-columns:1.5fr 1fr;gap:14px;margin-bottom:16px;align-items:start}",
      "#liveResult .rpanel{background:#fff;border:1px solid #e6ebf2;border-radius:16px;padding:16px;box-shadow:0 1px 2px rgba(15,23,42,.05);min-width:0}",
      "#liveResult .rph{font-size:14px;font-weight:800;color:#0f172a;margin-bottom:10px;display:flex;align-items:center;gap:6px}",
      "#liveResult .rph::before{content:'';width:8px;height:8px;border-radius:2px;background:var(--jvaccent,#0369a1)}",
      "#liveResult .rchart{width:100%;height:230px}",
      "#liveResult .rtable{width:100%;border-collapse:collapse;font-size:13px}",
      "#liveResult .rtable th{background:#f4f8fb;color:#64748b;font-size:11.5px;font-weight:700;text-align:left;padding:9px 10px;border-bottom:1px solid #e2e8f0}",
      "#liveResult .rtable td{padding:9px 10px;border-bottom:1px solid #eef2f7;color:#334155}",
      "#liveResult .rconcl{background:#fff;border:1px solid #e6ebf2;border-left:4px solid var(--jvaccent,#0369a1);border-radius:14px;padding:16px}",
      "#liveResult .rconcl .rv{font-size:15px;font-weight:800;color:var(--jvaccent,#0369a1);margin-bottom:8px}",
      "#liveResult .rconcl ul{margin:0;padding-left:18px;color:#334155;font-size:13px;line-height:1.9}",
      "@media(max-width:640px){#liveResult .jv-kpis{grid-template-columns:repeat(2,1fr)}#liveResult .jvdash-grid{grid-template-columns:1fr}#liveResult .jvblk{grid-column:auto!important}#liveResult .rmid{grid-template-columns:1fr}#liveResult .rkpis{grid-template-columns:repeat(2,1fr)}}"
    ].join("");
    s.textContent = DESIGN_CSS;
    document.head.appendChild(s);
  })();

  // 新分頁：把報告 spec 輸出成獨立 HTML（含 ECharts + 設計系統 + 圖表渲染腳本）
  function buildExportDoc() {
    if (state.dash && state.dash.pageHtml) return state.dash.pageHtml;
    if (state.dash && state.dash.spec) {
      var s = state.dash.spec, acc = s.accent || "#0369a1";
      var kpis = (s.kpis || []).map(function (k) { var dir = k.dir || "up", ar = dir === "down" ? "▼" : dir === "flat" ? "—" : "▲"; return '<div class="rkpi"><div class="l">' + esc(k.label) + '</div><div class="v">' + esc(k.value) + (k.unit ? '<small> ' + esc(k.unit) + '</small>' : '') + '</div>' + (k.delta ? '<div class="d ' + esc(dir) + '">' + ar + ' ' + esc(k.delta) + '</div>' : '') + '</div>'; }).join("");
      var charts = (s.charts || []).map(function (c, i) { return '<div class="rpanel"><div class="rph">' + esc(c.title || "圖表") + '</div><div class="rchart" data-ci="' + i + '"></div></div>'; }).join("");
      var tb = s.table, table = tb ? '<div class="rpanel"><div class="rph">' + esc(tb.title || "明細") + '</div><div style="overflow-x:auto"><table class="rtable"><thead><tr>' + (tb.headers || []).map(function (x) { return '<th>' + esc(x) + '</th>'; }).join("") + '</tr></thead><tbody>' + (tb.rows || []).map(function (r) { return '<tr>' + (r || []).map(function (c) { return '<td>' + esc(c) + '</td>'; }).join("") + '</tr>'; }).join("") + '</tbody></table></div></div>' : "";
      var cc = s.conclusion, concl = cc ? '<div class="rconcl"><div class="rv">' + esc(cc.verdict || "結論") + '</div><ul>' + (cc.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join("") + '</ul></div>' : "";
      var body = '<div id="liveResult" style="--jvaccent:' + acc + ';max-width:1080px;margin:0 auto;padding:24px">' +
        '<div class="rhead"><div class="rt">' + esc(state.dash.title) + '</div><div class="rs">' + esc(state.dash.sub || "") + '</div>' + (s.summary ? '<div class="rsum">' + esc(s.summary) + '</div>' : '') + '</div>' +
        '<div class="rkpis">' + kpis + '</div>' + (charts || table ? '<div class="rmid">' + charts + table + '</div>' : '') + concl + '</div>';
      return '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(state.dash.title) + '｜JVision Agents</title>' +
        '<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"><\/script>' +
        '<style>body{font-family:system-ui,"Noto Sans TC",sans-serif;margin:0;background:#eef3f8;color:#0f172a}' + DESIGN_CSS + '</style></head><body>' + body +
        '<script>var SPEC=' + JSON.stringify(s) + ';var acc=SPEC.accent||"#0369a1";var COL=[acc,"#38bdf8","#7c3aed","#0d9488","#f59e0b"];(SPEC.charts||[]).forEach(function(c,i){var el=document.querySelector(".rchart[data-ci=\'"+i+"\']");if(!el)return;el.style.height="230px";var cats=c.cats||[],series=(c.series||[]).map(Number);var ch=echarts.init(el),opt;if(c.type==="doughnut"||c.type==="pie"){opt={tooltip:{},legend:{bottom:0},series:[{type:"pie",radius:["45%","72%"],center:["50%","44%"],data:cats.map(function(x,j){return{name:x,value:series[j],itemStyle:{color:COL[j%COL.length]}}})}]}}else if(c.type==="line"){opt={grid:{left:42,right:14,top:20,bottom:26},tooltip:{trigger:"axis"},xAxis:{type:"category",data:cats},yAxis:{type:"value"},series:[{type:"line",smooth:true,data:series,areaStyle:{color:acc+"1a"},lineStyle:{color:acc,width:2.5},itemStyle:{color:acc}}]}}else{opt={grid:{left:42,right:14,top:20,bottom:26},tooltip:{trigger:"axis"},xAxis:{type:"category",data:cats},yAxis:{type:"value"},series:[{type:"bar",barMaxWidth:42,data:series.map(function(v,j){return{value:v,itemStyle:{color:COL[j%COL.length],borderRadius:[5,5,0,0]}}})}]}}ch.setOption(opt)});<\/script></body></html>';
    }
    if (!state.dash) return "";
    var th = state.dash.theme || {};
    var blocks = (state.dash.blocks || []).map(function (b) {
      var d = state.dash.html[b.id];
      var inner = d ? d.html : "";
      var span = Math.max(3, Math.min(12, b.span || 6));
      return '<div class="jvblk jvblk-' + (b.type || "") + '" style="grid-column:span ' + span + '"><div class="jvblk-body">' + sanitize(inner) + '</div></div>';
    }).join("");
    var vars = "--jvaccent:" + (th.accent || "#2563eb") + ";--jvaccent2:" + (th.accent2 || "#38bdf8") + ";--jvbg:" + (th.bg || "#f8fafc") + ";";
    return '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + esc(state.dash.title) + '｜JVision Agents 產出</title>' +
      '<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"><\/script>' +
      '<style>body{font-family:system-ui,"Noto Sans TC",sans-serif;margin:0;background:#eef3f8;color:#0f172a}' +
      '#liveResult{max-width:1100px;margin:0 auto;padding:24px;' + vars + '}' + DESIGN_CSS + '</style></head><body>' +
      '<div id="liveResult"><div class="jvdash-h"><div class="jvdash-t">' + esc(state.dash.title) + '</div><div class="jvdash-s">' + esc(state.dash.sub) + '</div></div>' +
      '<div class="jvdash-grid">' + blocks + '</div></div>' +
      '<script>(function(){var COL=["' + (th.accent || "#2563eb") + '","' + (th.accent2 || "#38bdf8") + '","#7c3aed","#0d9488","#f59e0b","#e11d48"];' +
      'document.querySelectorAll(".jv-chart").forEach(function(el){var type=el.getAttribute("data-type")||"bar";' +
      'var cats=(el.getAttribute("data-cats")||"").split(",").map(function(s){return s.trim()}).filter(Boolean);' +
      'var series=(el.getAttribute("data-series")||"").split(",").map(parseFloat).filter(function(n){return !isNaN(n)});' +
      'if(!series.length)return;var c=echarts.init(el);var opt;' +
      'if(type==="doughnut"||type==="pie"){opt={tooltip:{},legend:{bottom:0},series:[{type:"pie",radius:["45%","72%"],center:["50%","44%"],data:cats.map(function(x,i){return{name:x,value:series[i],itemStyle:{color:COL[i%COL.length]}}})}]}}' +
      'else if(type==="line"){opt={grid:{left:42,right:14,top:20,bottom:26},tooltip:{trigger:"axis"},xAxis:{type:"category",data:cats},yAxis:{type:"value"},series:[{type:"line",smooth:true,data:series,areaStyle:{color:"rgba(37,99,235,.1)"},lineStyle:{color:"#2563eb",width:2.5},itemStyle:{color:"#2563eb"}}]}}' +
      'else{opt={grid:{left:42,right:14,top:20,bottom:26},tooltip:{trigger:"axis"},xAxis:{type:"category",data:cats},yAxis:{type:"value"},series:[{type:"bar",barMaxWidth:40,data:series.map(function(v,i){return{value:v,itemStyle:{color:COL[i%COL.length],borderRadius:[5,5,0,0]}}})}]}}' +
      'c.setOption(opt);});})();<\/script></body></html>';
  }
  function enableExport() {
    var btn = $("#resultOpen");
    if (!btn) return;
    btn.onclick = function (ev) {
      ev.preventDefault();
      var doc = buildExportDoc();
      if (!doc) return;
      var blob = new Blob([doc], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    };
  }

  function feed() { return $("#logFeed"); }
  function narr(msg) { var s = $("#runStatus"); if (s) s.textContent = msg; }
  function progress() {
    var pct = state.total ? Math.round((state.done / (state.total + 1)) * 100) : 5;
    var bar = $("#runProgressBar"), p = $("#runPct");
    if (bar) bar.style.width = pct + "%"; if (p) p.textContent = pct + "%";
  }
  function addBubble(id, name, role, dm, html, thinking) {
    var f = feed(); if (!f) return;
    var isCmd = String(id).indexOf("orchestrator") === 0;
    var col = isCmd ? "#7c3aed" : (DM[dm] || ["", "#64748b"])[1];
    var tag = isCmd ? "總指揮" : (DM[dm] || [""])[0];
    var bubbleBg = isCmd ? "background:#f5f3ff;border-color:#ddd6fe" : "background:#f8fafc;border-color:#e2e8f0";
    var wrap = document.createElement("div");
    wrap.className = "flex items-start gap-2.5";
    wrap.innerHTML =
      '<span class="w-8 h-8 rounded-full grid place-content-center shrink-0 text-white text-xs font-black" style="background:' + col + '">' + esc((name || "AI").slice(0, 1)) + '</span>' +
      '<div class="min-w-0 flex-1"><div class="flex items-center gap-2 mb-1"><b class="text-[13px] text-ink">' + esc(name) + '</b>' +
      (tag ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style="color:' + col + ';background:' + col + '18">' + esc(tag) + '</span>' : '') + '</div>' +
      '<div class="text-[13px] text-body leading-relaxed bubble-body border rounded-xl rounded-tl-sm px-3 py-2" style="' + bubbleBg + '">' + (thinking ? '<span class="text-muted inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-current opacity-60" style="animation:jvb 1s infinite"></span>思考中…</span>' : html) + '</div></div>';
    f.appendChild(wrap); f.scrollTop = f.scrollHeight;
    state.bubbles[id] = wrap.querySelector(".bubble-body");
  }
  function setBubble(id, html) { var b = state.bubbles[id]; if (b) { b.innerHTML = html; feed().scrollTop = feed().scrollHeight; } }

  function mdToHtml(t) {
    // 極簡 markdown：連結、粗體、標題、清單、換行；並清掉殘留的 *
    t = esc(String(t == null ? "" : t));
    t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" class="text-brand underline">$1</a>');
    t = t.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" class="text-brand underline">$1</a>');
    t = t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    t = t.replace(/^#{1,6}\s*(.+)$/gm, '<div class="font-bold text-ink mt-1">$1</div>');
    t = t.replace(/^\s*[-*]\s+(.+)$/gm, '<div class="pl-3">• $1</div>');
    t = t.replace(/`([^`]+)`/g, '<code class="bg-soft px-1 rounded text-[12px]">$1</code>');
    t = t.replace(/\*\*/g, "").replace(/^\s*\*\s*/gm, "");
    return t.replace(/\n/g, "<br>");
  }

  // ---- 右側三種面板 ----
  function panelHost() {
    var host = $("#livePanel");
    if (host) return host;
    var frameWrap = $("#resultFrame") && $("#resultFrame").parentElement;
    if ($("#resultFrame")) $("#resultFrame").style.display = "none";
    host = document.createElement("div");
    host.id = "livePanel";
    host.className = "p-4";
    (frameWrap || $("#resultDesc").parentElement).insertBefore(host, $("#resultFrame") || null);
    return host;
  }
  function kpiRow(kpis) {
    return '<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">' + (kpis || []).map(function (k) {
      return '<div class="bg-soft border border-line rounded-xl p-3"><div class="text-[11px] text-muted font-semibold">' + esc(k.label) + '</div>' +
        '<div class="text-xl font-black text-ink mt-1">' + esc(k.value) + (k.unit ? ' <span class="text-xs text-muted font-bold">' + esc(k.unit) + '</span>' : '') + '</div></div>';
    }).join("") + '</div>';
  }
  function renderPanel(mode, d) {
    var host = panelHost(); d = d || {};
    if ($("#resultTitle")) $("#resultTitle").textContent = d.title || MODE[mode] || "結果";
    if ($("#resultKind")) $("#resultKind").textContent = MODE[mode] || "結果";
    var html = "";
    if (mode === "task") {
      html = kpiRow(d.kpis) + '<div class="space-y-2">' + (d.items || []).map(function (it) {
        return '<div class="flex items-start gap-2 bg-white border border-line rounded-lg p-2.5"><span class="material-symbols-outlined text-[18px] text-success shrink-0">check_circle</span><span class="text-[13px] text-ink">' + esc(it) + '</span></div>';
      }).join("") + '</div>';
    } else if (mode === "report") {
      html = kpiRow(d.kpis);
      if (d.series && d.series.data) {
        var mx = Math.max.apply(null, d.series.data.concat([1]));
        html += '<div class="bg-white border border-line rounded-xl p-4 mb-4"><div class="flex items-end gap-2 h-40">' +
          d.series.data.map(function (v, i) {
            var h = Math.round((v / mx) * 100);
            return '<div class="flex-1 flex flex-col items-center gap-1"><div class="w-full rounded-t bg-brand" style="height:' + h + '%"></div>' +
              '<span class="text-[10px] text-muted">' + esc((d.series.labels || [])[i] || "") + '</span></div>';
          }).join("") + '</div></div>';
      }
      html += '<div class="space-y-1.5">' + (d.insights || []).map(function (s) {
        return '<div class="flex items-start gap-2 text-[13px]"><span class="material-symbols-outlined text-[16px] text-violet">insights</span><span class="text-ink">' + esc(s) + '</span></div>';
      }).join("") + '</div>';
    } else { // doc
      html = '<div class="prose-sm space-y-3">' + (d.sections || []).map(function (sec) {
        return '<div><h4 class="text-[14px] font-black text-ink mb-1">' + esc(sec.heading) + '</h4><p class="text-[13px] text-body leading-relaxed">' + esc(sec.body) + '</p></div>';
      }).join("") + '</div>';
      if (d.sources && d.sources.length) {
        html += '<div class="mt-4 pt-3 border-t border-line"><div class="text-[11px] font-bold text-muted mb-1">來源</div>' +
          d.sources.map(function (u) { return '<a href="' + esc(u) + '" target="_blank" class="block text-[12px] text-brand underline truncate">' + esc(u) + '</a>'; }).join("") + '</div>';
      }
    }
    host.innerHTML = html;
    var live = $("#frameLive"); if (live) live.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-success"></span> 已完成';
  }

  // 右側改用 div 容器逐塊長出 section（邊回答邊產出）
  function resultHost() {
    var host = $("#liveResult");
    if (host) return host;
    var ifr = $("#resultFrame");
    if (ifr) ifr.style.display = "none";
    host = document.createElement("div");
    host.id = "liveResult";
    host.style.cssText = "padding:16px;font-family:system-ui,'Noto Sans TC',sans-serif;color:#0f172a;font-size:14px";
    (ifr && ifr.parentElement ? ifr.parentElement : ($("#resultDesc") || document.body).parentElement).insertBefore(host, ifr || null);
    return host;
  }
  function placeholder(msg) {
    var h = resultHost();
    h.innerHTML = '<div style="color:#64748b;display:flex;min-height:340px;align-items:center;justify-content:center;flex-direction:column;gap:12px">' +
      '<div style="width:34px;height:34px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:jvspin 1s linear infinite"></div>' +
      '<div>' + esc(msg) + '</div></div>';
  }
  var TYPE_LABEL = { kpi: "指標", chart: "圖表", table: "表格", note: "結論", timeline: "時程" };
  function renderLayout(title, sub, blocks, theme) {
    if ($("#resultTitle")) $("#resultTitle").textContent = title || "結果畫面";
    if ($("#resultKind")) $("#resultKind").textContent = "AI 產出";
    var h = resultHost();
    h.style.maxHeight = "600px"; h.style.overflowY = "auto";
    theme = theme || {};
    // 每份報告套用繪境挑的主題色（配色/風格都不同）
    h.style.setProperty("--jvaccent", theme.accent || "#2563eb");
    h.style.setProperty("--jvaccent2", theme.accent2 || "#38bdf8");
    h.style.setProperty("--jvbg", theme.bg || "#f8fafc");
    h.style.background = "linear-gradient(180deg," + (theme.bg || "#fbfdff") + ",#ffffff 120px)";
    h.style.borderRadius = "14px";
    state.dash = { title: title, sub: sub, blocks: blocks || [], html: {}, theme: theme };
    var cells = (blocks || []).map(function (b) {
      var span = Math.max(3, Math.min(12, b.span || 6));
      return '<div class="jvblk jvblk-' + (b.type || "") + '" id="blk-' + b.id + '" style="grid-column:span ' + span + '">' +
        '<div class="jvblk-body"><div class="jvblk-ph">◆ ' + esc(b.title) + '</div>' +
        '<div class="jvskel"></div><div class="jvskel"></div><div class="jvskel" style="width:55%"></div></div></div>';
    }).join("");
    h.innerHTML = '<div class="jvdash-h"><div class="jvdash-t">' + esc(title) + '</div><div class="jvdash-s">' + esc(sub || "") + '</div></div>' +
      '<div class="jvdash-grid" id="lrGrid">' + cells + '</div>';
  }
  function blockStatus(id, msg) {
    var blk = $("#blk-" + id); if (!blk) return;
    var body = blk.querySelector(".jvblk-body");
    if (body && body.querySelector(".jvskel")) body.innerHTML = '<div style="color:#94a3b8;font-size:12px;display:flex;align-items:center;gap:6px;padding:6px 0"><span style="width:12px;height:12px;border:2px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;display:inline-block;animation:jvspin .9s linear infinite"></span>' + esc(msg) + '</div>';
  }
  function fillBlock(e) {
    var blk = $("#blk-" + e.id);
    if (!blk) { // 沒有對應骨架就補一格
      var g = $("#lrGrid") || resultHost();
      blk = document.createElement("div"); blk.className = "jvblk"; blk.id = "blk-" + e.id; g.appendChild(blk);
      blk.innerHTML = '<div class="jvblk-h">' + esc(e.title || e.name) + '</div><div class="jvblk-body"></div>';
    }
    if (state.dash) state.dash.html[e.id] = { title: e.title || e.name, name: e.name, html: e.html };
    var body = blk.querySelector(".jvblk-body");
    body.innerHTML = sanitize(e.html);
    body.style.animation = "jvfade .5s ease";
    renderCharts(blk);
    var col = (state.dash && state.dash.theme && state.dash.theme.accent) || "#2563eb";
    blk.style.boxShadow = "0 0 0 2px " + col + "44";
    setTimeout(function () { blk.style.boxShadow = ""; }, 600);
    blk.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function sanitize(html) { return String(html || "").replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, ""); }
  function renderCharts(root) {
    if (!window.echarts) return;
    root.querySelectorAll(".jv-chart").forEach(function (el) {
      if (el.getAttribute("data-done")) return;
      el.setAttribute("data-done", "1");
      var type = el.getAttribute("data-type") || "bar";
      var cats = (el.getAttribute("data-cats") || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
      var series = (el.getAttribute("data-series") || "").split(",").map(function (s) { return parseFloat(s); }).filter(function (n) { return !isNaN(n); });
      if (!series.length) { el.style.display = "none"; return; }
      if (!el.style.height) el.style.height = "230px";
      el.style.width = "100%";
      var accent = el.getAttribute("data-color") || (el.closest("[data-accent]") && el.closest("[data-accent]").getAttribute("data-accent")) || "#2563eb";
      var COL = [accent, "#38bdf8", "#7c3aed", "#0d9488", "#f59e0b", "#e11d48"];
      var c = window.echarts.init(el);
      var opt;
      if (type === "doughnut" || type === "pie") {
        opt = { tooltip: { trigger: "item" }, legend: { bottom: 0, textStyle: { fontSize: 11 } },
          series: [{ type: "pie", radius: ["45%", "72%"], center: ["50%", "44%"], label: { fontSize: 11 },
            data: cats.map(function (ct, i) { return { name: ct, value: series[i], itemStyle: { color: COL[i % COL.length] } }; }) }] };
      } else if (type === "line") {
        opt = { grid: { left: 42, right: 14, top: 20, bottom: 26 }, tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: cats, axisLabel: { fontSize: 11 } }, yAxis: { type: "value" },
          series: [{ type: "line", smooth: true, data: series, lineStyle: { width: 2.5, color: "#2563eb" }, itemStyle: { color: "#2563eb" }, areaStyle: { color: "rgba(37,99,235,.1)" } }] };
      } else {
        opt = { grid: { left: 42, right: 14, top: 20, bottom: 26 }, tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: cats, axisLabel: { fontSize: 11 } }, yAxis: { type: "value" },
          series: [{ type: "bar", barMaxWidth: 40, data: series.map(function (v, i) { return { value: v, itemStyle: { color: COL[i % COL.length], borderRadius: [5, 5, 0, 0] } }; }) }] };
      }
      c.setOption(opt);
    });
  }
  function renderSection(e) {
    var host = $("#lrSections") || resultHost();
    var col = (DM[e.dataMode] || ["", "#64748b"])[1];
    var wrap = document.createElement("div");
    wrap.style.cssText = "animation:jvfade .5s ease;margin-bottom:14px";
    wrap.innerHTML = '<div style="font-size:11px;font-weight:800;color:' + col + ';margin:0 0 6px">◆ ' + esc(e.name) + ' · ' + esc(e.title || "") + '</div>' +
      '<div class="jvsec" style="border-left:3px solid ' + col + '">' + sanitize(e.html) + '</div>';
    host.appendChild(wrap);
    renderCharts(wrap);
    wrap.style.boxShadow = "0 0 0 2px " + col + "33";
    setTimeout(function () { wrap.style.transition = "box-shadow .6s"; wrap.style.boxShadow = "none"; }, 400);
    wrap.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  function chartFor(el, c, accent) {
    if (!window.echarts) return;
    el.style.height = "230px"; el.style.width = "100%";
    var COL = [accent, "#38bdf8", "#7c3aed", "#0d9488", "#f59e0b", "#e11d48"];
    var cats = c.cats || [], series = (c.series || []).map(Number);
    var ch = window.echarts.init(el), opt;
    if (c.type === "doughnut" || c.type === "pie") {
      opt = { tooltip: { trigger: "item" }, legend: { bottom: 0, textStyle: { fontSize: 11 } },
        series: [{ type: "pie", radius: ["45%", "72%"], center: ["50%", "44%"], label: { fontSize: 11 },
          data: cats.map(function (x, i) { return { name: x, value: series[i], itemStyle: { color: COL[i % COL.length] } }; }) }] };
    } else if (c.type === "line") {
      opt = { grid: { left: 42, right: 14, top: 20, bottom: 26 }, tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: cats, axisLabel: { fontSize: 11 } }, yAxis: { type: "value" },
        series: [{ type: "line", smooth: true, data: series, lineStyle: { width: 2.5, color: accent }, itemStyle: { color: accent }, areaStyle: { color: accent + "1a" } }] };
    } else {
      opt = { grid: { left: 42, right: 14, top: 20, bottom: 26 }, tooltip: { trigger: "axis" },
        xAxis: { type: "category", data: cats, axisLabel: { fontSize: 11 } }, yAxis: { type: "value" },
        series: [{ type: "bar", barMaxWidth: 42, data: series.map(function (v, i) { return { value: v, itemStyle: { color: COL[i % COL.length], borderRadius: [5, 5, 0, 0] } }; }) }] };
    }
    ch.setOption(opt);
  }
  function renderReport(title, sub, spec) {
    spec = spec || {};
    var acc = spec.accent || "#0369a1";
    if ($("#resultTitle")) $("#resultTitle").textContent = title || "報告";
    if ($("#resultKind")) $("#resultKind").textContent = "AI 產出";
    var h = resultHost(); h.style.maxHeight = "600px"; h.style.overflowY = "auto";
    h.style.setProperty("--jvaccent", acc);
    h.style.background = ""; h.style.padding = "18px";
    var kpis = (spec.kpis || []).map(function (k) {
      var dir = k.dir || "up", ar = dir === "down" ? "▼" : dir === "flat" ? "—" : "▲";
      return '<div class="rkpi"><div class="l">' + esc(k.label) + '</div><div class="v">' + esc(k.value) +
        (k.unit ? '<small> ' + esc(k.unit) + '</small>' : '') + '</div>' +
        (k.delta ? '<div class="d ' + esc(dir) + '">' + ar + ' ' + esc(k.delta) + '</div>' : '') + '</div>';
    }).join("");
    var charts = (spec.charts || []).map(function (c, i) {
      return '<div class="rpanel"><div class="rph">' + esc(c.title || "圖表") + '</div><div class="rchart" data-ci="' + i + '"></div></div>';
    }).join("");
    var tb = spec.table;
    var table = tb ? '<div class="rpanel"><div class="rph">' + esc(tb.title || "明細") + '</div><div style="overflow-x:auto"><table class="rtable"><thead><tr>' +
      (tb.headers || []).map(function (x) { return '<th>' + esc(x) + '</th>'; }).join("") + '</tr></thead><tbody>' +
      (tb.rows || []).map(function (r) { return '<tr>' + (r || []).map(function (c) { return '<td>' + esc(c) + '</td>'; }).join("") + '</tr>'; }).join("") + '</tbody></table></div></div>' : "";
    var cc = spec.conclusion;
    var concl = cc ? '<div class="rconcl"><div class="rv">' + esc(cc.verdict || "結論") + '</div><ul>' +
      (cc.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join("") + '</ul></div>' : "";
    h.innerHTML = '<div class="rrep">' +
      '<div class="rhead"><div class="rt">' + esc(title) + '</div><div class="rs">' + esc(sub || "") + '</div>' +
      (spec.summary ? '<div class="rsum">' + esc(spec.summary) + '</div>' : '') + '</div>' +
      '<div class="rkpis">' + kpis + '</div>' +
      (charts || table ? '<div class="rmid">' + charts + table + '</div>' : '') + concl + '</div>';
    (spec.charts || []).forEach(function (c, i) {
      var el = h.querySelector('.rchart[data-ci="' + i + '"]'); if (el) chartFor(el, c, acc);
    });
    state.dash = { title: title, sub: sub, spec: spec, accent: acc };
    // 逐塊淡入（generating 感）
    var kids = h.querySelector(".rrep").children;
    for (var i = 0; i < kids.length; i++) {
      (function (el, idx) { el.style.opacity = "0"; el.style.transform = "translateY(8px)"; el.style.transition = "opacity .4s,transform .4s"; setTimeout(function () { el.style.opacity = "1"; el.style.transform = "none"; }, 110 * idx + 60); })(kids[i], i);
    }
  }

  // pencils.dev 式「區塊逐一拼出 + 掃描光 + 可點選」——純 HTML/CSS/JS，注入到最終頁面
  var REVEAL_SNIPPET = [
    '<style id="jvrx-css">',
    '.jvrx-hide{opacity:0!important;transform:translateY(16px) scale(.99);}',
    '.jvrx-in{opacity:1!important;transform:none!important;transition:opacity .55s cubic-bezier(.2,.7,.2,1),transform .55s cubic-bezier(.2,.7,.2,1);}',
    '.jvrx-scan{position:relative;}',
    '.jvrx-scan::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:50;',
    'background:linear-gradient(180deg,transparent 0%,rgba(110,168,255,.28) 45%,rgba(110,168,255,.28) 55%,transparent 100%);',
    'transform:translateY(-100%);animation:jvrxScan .75s ease-out forwards;border-radius:inherit;}',
    '@keyframes jvrxScan{to{transform:translateY(100%);}}',
    '[data-jvrx]{scroll-margin-top:12px;}',
    '[data-jvrx]:hover{outline:1.5px dashed rgba(99,102,241,.55);outline-offset:3px;cursor:pointer;}',
    '.jvrx-sel{outline:2px solid #6366f1!important;outline-offset:3px;}',
    '#jvrx-sweep{position:fixed;left:0;right:0;height:140px;pointer-events:none;z-index:99999;',
    'background:linear-gradient(180deg,transparent,rgba(99,102,241,.16),rgba(99,102,241,.03),transparent);transform:translateY(-160px);}',
    '</style>',
    '<script id="jvrx-js">(function(){',
    'function pick(){var b=document.body;if(!b)return[];',
    'var f=function(n){return n.nodeType===1&&!/^(SCRIPT|STYLE|LINK|BR)$/.test(n.tagName);};',
    'var k=[].filter.call(b.children,f);',
    'if(k.length<=1&&k[0]){var inner=[].filter.call(k[0].children,f);if(inner.length>=2)k=inner;}',
    'if(k.length<=1&&k[0]){var i2=[].filter.call(k[0].children,f);if(i2.length>=2)k=i2;}',
    'return k;}',
    'function run(){var k=pick();if(!k.length)return;',
    'k.forEach(function(el,i){el.setAttribute("data-jvrx",i);el.classList.add("jvrx-hide");',
    'el.addEventListener("click",function(ev){ev.stopPropagation();var was=el.classList.contains("jvrx-sel");',
    'k.forEach(function(x){x.classList.remove("jvrx-sel");});if(!was)el.classList.add("jvrx-sel");',
    'try{parent.postMessage({jvrx:"select",index:i+1,total:k.length,selected:!was},"*");}catch(e){}});});',
    'function follow(el){try{var r=el.getBoundingClientRect();var cur=window.pageYOffset||document.documentElement.scrollTop||0;',
    'var y=Math.max(0,cur+r.top-90);window.scrollTo({top:y,behavior:"smooth"});}catch(e){}}',
    'var i=0;(function step(){if(i>=k.length){sweep();return;}var el=k[i++];',
    'el.classList.remove("jvrx-hide");el.classList.add("jvrx-in","jvrx-scan");',
    'follow(el);',  // iframe 內部自動往下捲，跟著目前拼出的區塊
    'setTimeout(function(){el.classList.remove("jvrx-scan");},760);',
    'try{window.dispatchEvent(new Event("resize"));}catch(e){}',
    'setTimeout(step,150);})();}',
    'function sweep(){try{window.dispatchEvent(new Event("resize"));}catch(e){}',
    'var s=document.createElement("div");s.id="jvrx-sweep";document.body.appendChild(s);',
    'var h=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight),t0=null;',
    'function a(ts){if(t0===null)t0=ts;var p=(ts-t0)/950;s.style.transform="translateY("+(-160+p*(h+200))+"px)";',
    'if(p<1)requestAnimationFrame(a);else s.remove();}requestAnimationFrame(a);',
    'setTimeout(function(){try{window.scrollTo({top:0,behavior:"smooth"});}catch(e){}},1100);',  // 掃描完回到頂端，從頭呈現完成的報告
    'try{parent.postMessage({jvrx:"ready"},"*");}catch(e){}}',
    'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(run,50);});',
    'else setTimeout(run,50);',
    '})();<\/script>'
  ].join("");

  function injectReveal(html) {
    if (!html || html.indexOf("jvrx-js") !== -1) return html;
    var i = html.toLowerCase().lastIndexOf("</body>");
    if (i === -1) i = html.toLowerCase().lastIndexOf("</html>");
    return i === -1 ? html + REVEAL_SNIPPET : html.slice(0, i) + REVEAL_SNIPPET + html.slice(i);
  }

  function renderPage(title, sub, html) {
    if ($("#resultTitle")) $("#resultTitle").textContent = title || "報告";
    if ($("#resultKind")) $("#resultKind").textContent = "AI 產出";
    var lr = $("#liveResult"); if (lr) lr.style.display = "none";
    var f = $("#resultFrame");
    if (f) { f.style.display = ""; f.style.width = "100%"; f.style.height = "620px"; f.style.border = "0"; f.removeAttribute("src"); f.setAttribute("srcdoc", injectReveal(html)); }
    state.dash = { title: title, sub: sub, pageHtml: html };  // 匯出用原始 html（不含揭示動畫）
  }

  function scrollToResult() {
    var f = $("#resultFrame");
    if (!f) return;
    // 捲到「瀏覽器外框」那層（含 mac 圓點列 + iframe），而不是整個 section 標題列
    var target = (f.closest && f.closest(".rounded-xl")) || f.parentElement || f;
    var doScroll = function () {
      var rect = target.getBoundingClientRect();
      var y = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top - 72; // 留 72px 呼吸空間
      try { window.scrollTo({ top: y, behavior: "smooth" }); } catch (e) { window.scrollTo(0, y); }
    };
    // 用 rAF 確保版面已更新再量測位置
    if (window.requestAnimationFrame) requestAnimationFrame(doScroll); else doScroll();
  }

  // 生成中的骨架動畫（遮蔽 繪境 尚在生成的過程，避免「卡在一個區塊」讓人以為壞掉）
  var SKELETON_HTML = [
    '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>',
    'body{margin:0;font-family:system-ui,"Noto Sans TC";background:#f6f8fb;padding:22px}',
    '.sk{background:linear-gradient(90deg,#e7edf5 25%,#f3f7fb 37%,#e7edf5 63%);background-size:400% 100%;animation:sh 1.3s ease infinite;border-radius:14px}',
    '@keyframes sh{0%{background-position:100% 0}100%{background-position:-100% 0}}@keyframes bl{0%,100%{opacity:.25}50%{opacity:1}}',
    '.h{height:118px;margin-bottom:18px}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px}',
    '.c{height:112px}.big{height:250px;margin-bottom:18px}',
    '.lbl{display:flex;gap:8px;align-items:center;justify-content:center;color:#64748b;font-size:13px;font-weight:700;margin-top:6px}',
    '.dot{width:9px;height:9px;border-radius:50%;background:#6366f1;animation:bl 1s infinite}',
    '@media(max-width:640px){.row{grid-template-columns:1fr 1fr}}</style></head><body>',
    '<div class="sk h"></div>',
    '<div class="row"><div class="sk c"></div><div class="sk c"></div><div class="sk c"></div></div>',
    '<div class="sk big"></div>',
    '<div class="row"><div class="sk c"></div><div class="sk c"></div><div class="sk c"></div></div>',
    '<div class="lbl"><span class="dot"></span> 繪境正在設計報告，稍候整頁會一起呈現…</div>',
    '</body></html>'
  ].join("");

  // 生成中：只顯示一次骨架（不逐塊串流，避免卡住看起來壞掉）。定稿後由 renderPage 一次揭示（區塊逐一淡入 + 掃描）。
  function renderPageStream(chunk) {
    if (state.streamDone || state.skelShown) return;
    var f = $("#resultFrame"); if (!f) return;
    state.skelShown = true;
    var lr = $("#liveResult"); if (lr) lr.style.display = "none";
    f.style.display = ""; f.style.width = "100%"; f.style.height = "620px"; f.style.border = "0";
    f.removeAttribute("src"); f.setAttribute("srcdoc", SKELETON_HTML);
    if ($("#resultKind")) $("#resultKind").textContent = "AI 設計中";
    if ($("#frameLive")) $("#frameLive").innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400" style="animation:jvb 1s infinite"></span> 設計中…';
    scrollToResult();
  }

  // 定稿：換成乾淨完整頁，並用 injectReveal 做「區塊逐一淡入 + 掃描 + 可點選」（在完整 DOM 上揭示，能正確處理外層包裹）
  function finalizeStream(e) {
    renderPage(e.title, e.sub, e.html); scrollToResult();
  }

  // ===== 文字報告模式（Markdown + 內嵌圖表 + 重點標色 + 可放大 + 連結）=====
  (function injectReportCss() {
    var css = ".jvr-report{max-width:940px;margin:0 auto;padding:16px 20px;color:#1e293b;font-size:14.5px;line-height:1.78}" +
      ".jvr-report .jvr-h{font-weight:800;color:#0f172a;line-height:1.35;margin:20px 0 8px}" +
      ".jvr-h1{font-size:22px}.jvr-h2{font-size:18px;padding-bottom:6px;border-bottom:2px solid #eef2f7}.jvr-h3{font-size:15.5px}.jvr-h4{font-size:14.5px}" +
      ".jvr-p{margin:8px 0}" +
      "ul.jvr-list{list-style:disc;margin:8px 0;padding-left:24px}ol.jvr-list{list-style:decimal;margin:8px 0;padding-left:24px}" +
      ".jvr-list li{margin:5px 0;display:list-item}.jvr-list li::marker{color:#2563eb;font-weight:700}" +
      ".jvr-hl{background:#fde68a;color:#854d0e;padding:1px 6px;border-radius:5px;font-weight:700;-webkit-box-decoration-break:clone;box-decoration-break:clone}" +
      ".jvr-a{color:#1d4ed8;text-decoration:underline;text-underline-offset:2px}" +
      ".jvr-code{background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:12.5px}" +
      ".jvr-pre{background:#0f172a;color:#e2e8f0;padding:12px 14px;border-radius:10px;overflow:auto;font-size:12.5px}" +
      ".jvr-quote{border-left:3px solid #93c5fd;background:#f0f7ff;padding:8px 14px;border-radius:0 8px 8px 0;color:#334155;margin:10px 0}" +
      ".jvr-tablewrap{overflow-x:auto;margin:12px 0}.jvr-table{width:100%;border-collapse:collapse;font-size:13.5px}" +
      ".jvr-table th{background:#f8fafc;text-align:left;padding:9px 12px;border-bottom:2px solid #e2e8f0;font-weight:800}" +
      ".jvr-table td{padding:9px 12px;border-bottom:1px solid #eef2f7}.jvr-hr{border:0;border-top:1px solid #e2e8f0;margin:16px 0}" +
      ".jvr-chart{position:relative;margin:14px 0;border:1px solid #e8eef5;border-radius:12px;background:#fff;box-shadow:0 1px 6px rgba(2,32,71,.05)}" +
      ".jvr-chart:empty::before{content:'圖表產生中…';display:block;color:#94a3b8;font-size:13px;text-align:center;padding:38px 0}" +
      ".jvr-mermaid{padding:12px;text-align:center;min-height:0!important}.jvr-mermaid svg{max-width:100%;height:auto}" +
      ".jvr-zoom{position:absolute;top:8px;right:8px;z-index:5;width:26px;height:26px;border:1px solid #e2e8f0;background:#fff;border-radius:7px;cursor:pointer;color:#475569;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,.08)}" +
      ".jvr-zoom:hover{background:#f1f5f9}" +
      ".jvr-lightbox{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.72);display:flex;align-items:center;justify-content:center;padding:24px}" +
      ".jvr-lightbox-body{position:relative;background:#fff;border-radius:16px;width:min(1040px,96vw);padding:20px}" +
      ".jvr-lb-chart{width:100%;height:min(70vh,560px)}" +
      ".jvr-lb-close{position:absolute;top:8px;right:12px;border:0;background:transparent;font-size:26px;line-height:1;cursor:pointer;color:#64748b}";
    var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
  })();

  function escAttr(s) { return esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;"); } // 屬性值：連引號都要跳脫，否則含 " 的 JSON 會截斷屬性
  function unesc(s) { return String(s == null ? "" : s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"); }
  function looseJson(s) {
    s = String(s == null ? "" : s).trim();
    s = s.replace(/^```(?:json|chart|echart|echarts)?\s*/i, "").replace(/```\s*$/i, "").trim();
    try { return JSON.parse(s); } catch (e) { }
    // 抓出第一段平衡的 {...}（去掉前後雜訊）
    var a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
    var t = s.replace(/[“”„]/g, '"').replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, "$1")            // 尾逗號
      .replace(/\bNaN\b|\bInfinity\b|\b-Infinity\b/g, "null")
      .replace(/\/\/[^\n\r]*/g, "");             // // 註解
    try { return JSON.parse(t); } catch (e) { }
    return null;
  }
  function mdInline(t) {
    t = esc(t);
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="jvr-a">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/==([^=]+)==/g, function (_, s) { return s.trim().length <= 12 ? '<mark class="jvr-hl">' + s + "</mark>" : "<strong>" + s + "</strong>"; });
    t = t.replace(/`([^`]+)`/g, '<code class="jvr-code">$1</code>');
    return t;
  }
  function mdReport(md) {
    var lines = String(md || "").split(/\r?\n/), out = [], i = 0;
    function cells(r) { return r.replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); }); }
    while (i < lines.length) {
      var ln = lines[i];
      var fm = /^```(chart|echart|echarts|mermaid)\s*$/i.exec(ln.trim());
      if (fm) {
        var kind = fm[1].toLowerCase(); i++; var buf = [];
        while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; } i++;
        var k = kind.indexOf("echart") === 0 ? "echart" : (kind === "mermaid" ? "mermaid" : "chart");
        out.push('<div class="jvr-chart" data-kind="' + k + '" data-raw="' + escAttr(buf.join("\n").trim()) + '"></div>'); continue;
      }
      if (/^```/.test(ln.trim())) { i++; var cb = []; while (i < lines.length && !/^```/.test(lines[i].trim())) { cb.push(lines[i]); i++; } i++; out.push('<pre class="jvr-pre"><code>' + esc(cb.join("\n")) + "</code></pre>"); continue; }
      var hm = /^(#{1,4})\s+(.*)$/.exec(ln);
      if (hm) { var lv = hm[1].length; out.push("<h" + (lv + 1) + ' class="jvr-h jvr-h' + lv + '">' + mdInline(hm[2]) + "</h" + (lv + 1) + ">"); i++; continue; }
      if (/\|/.test(ln) && i + 1 < lines.length && /^[\s|:-]+$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
        var header = ln; i += 2; var rows = [];
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) { rows.push(lines[i]); i++; }
        out.push('<div class="jvr-tablewrap"><table class="jvr-table"><thead><tr>' + cells(header).map(function (c) { return "<th>" + mdInline(c) + "</th>"; }).join("") +
          "</tr></thead><tbody>" + rows.map(function (r) { return "<tr>" + cells(r).map(function (c) { return "<td>" + mdInline(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>");
        continue;
      }
      if (/^>\s?/.test(ln)) { var q = []; while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; } out.push('<blockquote class="jvr-quote">' + mdInline(q.join(" ")) + "</blockquote>"); continue; }
      if (/^\s*([-*]|\d+\.)\s+/.test(ln)) {
        var ordered = /^\s*\d+\./.test(ln), items = [];
        while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "")); i++; }
        out.push("<" + (ordered ? "ol" : "ul") + ' class="jvr-list">' + items.map(function (it) { return "<li>" + mdInline(it) + "</li>"; }).join("") + "</" + (ordered ? "ol" : "ul") + ">"); continue;
      }
      if (/^---+$/.test(ln.trim())) { out.push('<hr class="jvr-hr">'); i++; continue; }
      if (!ln.trim()) { i++; continue; }
      var para = [ln]; i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s?)/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i]) && !/^---+$/.test(lines[i].trim()) && lines[i].indexOf("|") < 0) { para.push(lines[i]); i++; }
      out.push('<p class="jvr-p">' + mdInline(para.join(" ")) + "</p>");
    }
    return out.join("\n");
  }
  var COLZ = ["#2563eb", "#38bdf8", "#7c3aed", "#0d9488", "#f59e0b", "#e11d48"];
  function chartToOption(kind, raw) {
    var o = looseJson(raw); if (!o) return null;
    // 已經是 ECharts option（有 series 陣列）→ 直接用，並補上好看的預設
    if (kind === "echart" || (o.series && o.series.length && !o.type && !o.data)) {
      if (o.tooltip == null) o.tooltip = {};
      (o.series || []).forEach(function (s, i) { if (s && s.itemStyle == null && s.type !== "gauge") s.itemStyle = { color: COLZ[i % COLZ.length] }; });
      return o;
    }
    var type = (o.type || "bar").toLowerCase();
    // 相容 {type,labels:[],data:[數字]} 這種寫法
    if (!Array.isArray(o.data) && o.labels && o.values) o.data = o.labels.map(function (n, i) { return { name: n, value: (o.values || [])[i] }; });
    else if (Array.isArray(o.data) && typeof o.data[0] === "number" && o.labels) o.data = o.data.map(function (v, i) { return { name: o.labels[i], value: v }; });
    var title = o.title ? { text: o.title, left: "center", textStyle: { fontSize: 14, fontWeight: 800 } } : null;
    if (type === "pie" || type === "donut" || type === "doughnut") {
      return { title: title, tooltip: {}, legend: { bottom: 0 }, series: [{ type: "pie", radius: type === "pie" ? "64%" : ["42%", "66%"], center: ["50%", "46%"], data: (o.data || []).map(function (d, i) { return { name: d.name, value: d.value, itemStyle: { color: COLZ[i % COLZ.length] } }; }) }] };
    }
    if (type === "radar") {
      var flat = []; (o.series || []).forEach(function (s) { (s.values || []).forEach(function (v) { flat.push(+v || 0); }); });
      var mx = Math.max.apply(null, flat.concat([10]));
      return { title: title, tooltip: {}, legend: { bottom: 0 }, radar: { indicator: (o.axes || []).map(function (a) { return { name: a, max: mx }; }) }, series: [{ type: "radar", data: (o.series || []).map(function (s, i) { return { name: s.name, value: s.values, itemStyle: { color: COLZ[i % COLZ.length] }, areaStyle: { opacity: .12 } }; }) }] };
    }
    var cats = (o.data || []).map(function (d) { return d.name; }), vals = (o.data || []).map(function (d) { return d.value; });
    if (type === "line" || type === "area") {
      return { title: title, grid: { left: 46, right: 16, top: title ? 42 : 20, bottom: 28 }, tooltip: { trigger: "axis" }, xAxis: { type: "category", data: cats }, yAxis: { type: "value" }, series: [{ type: "line", smooth: true, data: vals, areaStyle: type === "area" ? { color: "rgba(37,99,235,.12)" } : null, lineStyle: { color: "#2563eb", width: 2.5 }, itemStyle: { color: "#2563eb" } }] };
    }
    return { title: title, grid: { left: 46, right: 16, top: title ? 42 : 20, bottom: 28 }, tooltip: { trigger: "axis" }, xAxis: { type: "category", data: cats }, yAxis: { type: "value" }, series: [{ type: "bar", barMaxWidth: 44, data: vals.map(function (v, i) { return { value: v, itemStyle: { color: COLZ[i % COLZ.length], borderRadius: [5, 5, 0, 0] } }; }) }] };
  }
  function openChartLightbox(opt) {
    if (!window.echarts) return;
    var ov = document.createElement("div"); ov.className = "jvr-lightbox";
    ov.innerHTML = '<div class="jvr-lightbox-body"><button class="jvr-lb-close" aria-label="關閉">×</button><div class="jvr-lb-chart"></div></div>';
    document.body.appendChild(ov);
    var inst = echarts.init(ov.querySelector(".jvr-lb-chart")); inst.setOption(opt); inst.resize();
    var onR = function () { try { inst.resize(); } catch (e) { } };
    function close() { window.removeEventListener("resize", onR); inst.dispose(); ov.remove(); }
    window.addEventListener("resize", onR);
    ov.onclick = function (e) { if (e.target === ov) close(); };
    ov.querySelector(".jvr-lb-close").onclick = close;
  }
  function openSvgLightbox(svg) {
    var ov = document.createElement("div"); ov.className = "jvr-lightbox";
    ov.innerHTML = '<div class="jvr-lightbox-body"><button class="jvr-lb-close" aria-label="關閉">×</button><div class="jvr-lb-svg" style="width:100%;max-height:78vh;overflow:auto;text-align:center">' + svg + "</div></div>";
    document.body.appendChild(ov);
    var s = ov.querySelector(".jvr-lb-svg svg"); if (s) { s.removeAttribute("height"); s.style.maxWidth = "100%"; s.style.height = "auto"; }
    function close() { ov.remove(); }
    ov.onclick = function (e) { if (e.target === ov) close(); };
    ov.querySelector(".jvr-lb-close").onclick = close;
  }
  // Mermaid：流程圖 / 心智圖(mindmap) / 循序圖 / 狀態圖…
  var _mmSeq = 0, _mmReady = false;
  function ensureMermaid() {
    if (_mmReady || !window.mermaid) return _mmReady;
    try { window.mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: "default", mindmap: { padding: 10 } }); _mmReady = true; } catch (e) { }
    return _mmReady;
  }
  function renderMermaid(el, code, tries) {
    tries = tries || 0;
    if (!window.mermaid) {  // CDN 檔大(~3.5MB)可能還在載 → 最多等 ~6 秒再放棄
      if (tries < 30) { el.innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;font-size:12.5px">圖表載入中…</div>'; setTimeout(function () { renderMermaid(el, code, tries + 1); }, 200); return; }
      el.innerHTML = '<pre class="jvr-pre">' + esc(code) + "</pre>"; return;
    }
    if (!ensureMermaid()) { el.innerHTML = '<pre class="jvr-pre">' + esc(code) + "</pre>"; return; }
    var id = "jvmm" + (_mmSeq++);
    try {
      window.mermaid.render(id, code).then(function (r) {
        el.innerHTML = r.svg; el.classList.add("jvr-mermaid"); el.style.position = "relative"; el.style.minHeight = "0";
        var zb = document.createElement("button"); zb.className = "jvr-zoom"; zb.textContent = "⤢"; zb.title = "放大";
        zb.onclick = function (ev) { ev.stopPropagation(); openSvgLightbox(el.innerHTML); };
        el.appendChild(zb);
      }).catch(function () { el.innerHTML = '<pre class="jvr-pre">' + esc(code) + "</pre>"; });
    } catch (e) { el.innerHTML = '<pre class="jvr-pre">' + esc(code) + "</pre>"; }
  }
  // 地圖（世界 / 台灣 / 中國）：ECharts v5 需先註冊 GeoJSON，用到才動態抓
  var MAP_SRC = {
    world: "https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json",
    taiwan: "https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=710000",
    china: "https://geo.datav.aliyun.com/areas_v3/bound/geojson?code=100000_full"
  };
  var MAP_ALIAS = { "世界": "world", "全球": "world", "台灣": "taiwan", "臺灣": "taiwan", "tw": "taiwan", "中國": "china", "大陸": "china" };
  function mapNameOf(opt) {
    var n = (opt.geo && opt.geo.map) || "";
    if (!n && opt.series) opt.series.forEach(function (s) { if (!n && s && s.map) n = s.map; });
    return n;
  }
  function ensureMap(name, cb) {
    var key = MAP_ALIAS[name] || (name || "").toLowerCase();
    if (!MAP_SRC[key]) { cb(key && window.echarts && echarts.getMap && echarts.getMap(key) ? key : false); return; }
    if (window.echarts && echarts.getMap && echarts.getMap(key)) { cb(key); return; }
    fetch(MAP_SRC[key]).then(function (r) { return r.json(); }).then(function (geo) { try { echarts.registerMap(key, geo); cb(key); } catch (e) { cb(false); } }).catch(function () { cb(false); });
  }
  function normMapName(opt, key) { if (opt.geo && opt.geo.map) opt.geo.map = key; (opt.series || []).forEach(function (s) { if (s && s.map) s.map = key; }); }
  var reportCharts = [];
  if (!window.__jvrResizeBound) {
    window.__jvrResizeBound = true;
    window.addEventListener("resize", function () { reportCharts.forEach(function (c) { try { c.resize(); } catch (e) { } }); });
  }
  function enhanceReport(root) {
    if (!root) return;
    root.querySelectorAll(".jvr-chart").forEach(function (el) {
      if (el.getAttribute("data-done")) return; el.setAttribute("data-done", "1");
      var kind = el.getAttribute("data-kind"), raw = el.getAttribute("data-raw") || ""; // getAttribute 已解過實體
      if (kind === "mermaid") { renderMermaid(el, raw); return; }
      var opt = window.echarts ? chartToOption(kind, raw) : null;
      if (!opt) { el.style.minHeight = "0"; el.innerHTML = '<div style="padding:14px 16px;color:#94a3b8;font-size:12.5px">（此圖表資料未能解析）</div>'; return; }
      function draw() {
        var inst = echarts.init(el); inst.setOption(opt); reportCharts.push(inst);
        var zb = document.createElement("button"); zb.className = "jvr-zoom"; zb.textContent = "⤢"; zb.title = "放大";
        zb.onclick = function (ev) { ev.stopPropagation(); openChartLightbox(opt); };
        el.appendChild(zb);
        setTimeout(function () { try { inst.resize(); } catch (e) { } }, 60);
      }
      var mn = mapNameOf(opt);
      el.style.height = mn ? "380px" : "300px";
      if (mn) { ensureMap(mn, function (key) { if (key) { normMapName(opt, key); draw(); } else { el.innerHTML = '<div style="padding:14px 16px;color:#94a3b8;font-size:12.5px">（地圖資料載入失敗，已略過）</div>'; } }); }
      else draw();
    });
  }
  function renderTextReport(title, sub, md, streaming) {
    if ($("#resultTitle")) $("#resultTitle").textContent = title || "報告";
    if ($("#resultKind")) $("#resultKind").textContent = "AI 文字報告";
    var op = $("#resultOpen"); if (op) op.style.display = "none"; // 文字報告不需要新分頁
    var host = resultHost(); host.style.maxHeight = "600px"; host.style.overflowY = "auto"; host.style.background = "#fff";
    host.innerHTML = '<div class="jvr-report">' + mdReport(md) + "</div>";
    if (!streaming) {
      enhanceReport(host);
      if ($("#frameLive")) $("#frameLive").innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-success"></span> 已完成';
      state.dash = { title: title, sub: sub, markdown: md };
    }
  }

  function handle(e) {
    var t = e.type;
    if (t === "status") narr(e.message);
    else if (t === "team") {
      state.total = e.members.length; state.done = 0;
      if ($("#statAgents")) $("#statAgents").textContent = e.members.length;
      if ($("#statSteps")) $("#statSteps").textContent = e.members.length + 1;
      var ra = $("#runAgents");
      if (ra) ra.innerHTML = e.members.map(function (m) {
        var col = (DM[m.dataMode] || ["", "#64748b"])[1];
        return '<span class="inline-flex items-center gap-1.5 bg-white border border-line rounded-full pl-1 pr-2.5 py-1 text-[12px] font-semibold">' +
          '<span class="w-5 h-5 rounded-full grid place-content-center text-white text-[10px] font-black" style="background:' + col + '">' + esc(m.name.slice(0, 1)) + '</span>' + esc(m.name) + '</span>';
      }).join("");
      narr("團隊已組成（" + e.members.length + " 位），開始協作…");
    }
    else if (t === "agent_start") addBubble(e.id, e.name, e.role, (e.dataMode || ""), "", true);
    else if (t === "step") { var b = state.bubbles[e.id]; if (b && /思考中|查/.test(b.textContent)) b.innerHTML = '<span class="text-muted">' + esc(e.message) + '…</span>'; }
    else if (t === "message") { if (!state.bubbles[e.id]) addBubble(e.id, e.name, e.role, "", "", true); setBubble(e.id, mdToHtml(e.text)); }
    else if (t === "done_item") {
      state.done++; progress();
      var dl = $("#doneList");
      if (dl) { var el = document.createElement("div"); el.className = "flex items-start gap-2 bg-soft rounded-lg px-2.5 py-2"; el.innerHTML = '<span class="material-symbols-outlined text-[17px] text-success shrink-0">check_circle</span><span class="text-[13px] text-ink">' + mdToHtml(e.text) + '</span>'; dl.appendChild(el); }
      if ($("#statDone")) $("#statDone").textContent = state.done;
    }
    else if (t === "page_pending") {
      state.output = e.output || "html";
      state.reportTitle = e.title; state.reportSub = e.sub;
      if ($("#resultTitle")) $("#resultTitle").textContent = e.title || "結果畫面";
      var op = $("#resultOpen"); if (op) op.style.display = state.output === "text" ? "none" : "";
      placeholder("團隊查各系統資料中，稍後彙整成報告…"); scrollToResult();
    }
    else if (t === "report_delta") {
      state.reportAccum = (state.reportAccum || "") + e.chunk;
      var nowr = (window.performance && performance.now) ? performance.now() : 0;
      if (state._rPaint && nowr - state._rPaint < 140) return;
      state._rPaint = nowr;
      if (!state.reportStarted) { state.reportStarted = true; scrollToResult(); }
      renderTextReport(state.reportTitle, state.reportSub, state.reportAccum, true);
      var hr = $("#liveResult"); if (hr) hr.scrollTop = hr.scrollHeight;
    }
    else if (t === "report") {
      state.reportDone = true;
      if (e.markdown != null) { renderTextReport(e.title, e.sub, e.markdown, false); scrollToResult(); }
      else renderReport(e.title, e.sub, e.spec); // 舊版 spec 相容
    }
    else if (t === "page_delta") renderPageStream(e.chunk);
    else if (t === "page") { state.streamDone = true; finalizeStream(e); }
    else if (t === "layout") renderLayout(e.title, e.sub, e.blocks, e.theme);
    else if (t === "block_status") blockStatus(e.id, e.message);
    else if (t === "block") fillBlock(e);
    else if (t === "html") { var h = resultHost(); h.innerHTML = sanitize(e.html); }
    else if (t === "final") { narr("完成"); state.done = state.total + 1; progress(); var lv = $("#frameLive"); if (lv) lv.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-success"></span> 已完成'; if ($("#resultTitle")) $("#resultTitle").textContent = ($("#resultTitle").textContent || "").replace("（產生中）", ""); if (state.output !== "text") enableExport(); setBusy(false); }
    else if (t === "error") { narr("發生問題"); addBubble("_err", "系統", "", "reasoning", '<span class="text-danger">' + esc(e.message) + '</span>'); setBusy(false); }
  }

  function setBusy(on) {
    state.running = on;
    var btn = $("#missRun");
    if (btn) { btn.disabled = on; btn.style.opacity = on ? ".5" : ""; btn.style.pointerEvents = on ? "none" : ""; btn.innerHTML = on ? '<span class="material-symbols-outlined text-[18px]" style="animation:jvspin 1s linear infinite">progress_activity</span> 執行中' : '<span class="material-symbols-outlined text-[18px]">bolt</span> 啟動'; }
  }
  async function runMission(question, mode) {
    if (state.running) return;
    setBusy(true); state.mode = mode || "task"; state.bubbles = {}; state.done = 0; state.total = 0; state.dash = null;
    state.streamDone = false; state.skelShown = false;
    state.output = "html"; state.reportAccum = ""; state.reportStarted = false; state.reportDone = false; state._rPaint = 0;
    try { reportCharts.forEach(function (c) { try { c.dispose(); } catch (e) { } }); } catch (e) { } reportCharts = [];
    var _op = $("#resultOpen"); if (_op) _op.style.display = "";
    if (feed()) feed().innerHTML = ""; if ($("#doneList")) $("#doneList").innerHTML = "";
    // 清掉上一份報告（右側）
    var f0 = $("#resultFrame"); if (f0) { f0.removeAttribute("srcdoc"); f0.removeAttribute("src"); f0.style.display = "none"; }
    var lr0 = $("#liveResult"); if (lr0) { lr0.style.display = ""; lr0.innerHTML = ""; }
    if ($("#demoQuestion")) $("#demoQuestion").textContent = question;
    if ($("#resultTitle")) $("#resultTitle").textContent = "結果畫面（產生中）";
    placeholder("團隊協作中，稍候右側會長出結果畫面…");
    narr("送出需求…"); progress();
    // 連線重試：後端短暫重啟/忙碌時自動重連，最多 5 次
    var resp = null;
    for (var attempt = 0; attempt < 5 && !resp; attempt++) {
      try {
        var r0 = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: question, mode: state.mode }) });
        if (r0 && r0.ok && r0.body) { resp = r0; break; }
      } catch (err) {}
      if (attempt < 4) { narr("連線後端中，重試 " + (attempt + 1) + "/5…"); await new Promise(function (rs) { setTimeout(rs, 1500); }); }
    }
    if (!resp) { handle({ type: "error", message: "暫時連不上後端，請稍候再按啟動重試。" }); setBusy(false); return; }
    try {
      var reader = resp.body.getReader(), dec = new TextDecoder(), buf = "";
      while (true) {
        var r = await reader.read(); if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        var idx;
        while ((idx = buf.indexOf("\n\n")) >= 0) {
          var chunk = buf.slice(0, idx); buf = buf.slice(idx + 2);
          if (chunk.indexOf("data: ") === 0) { try { handle(JSON.parse(chunk.slice(6))); } catch (err) {} }
        }
      }
    } catch (err) {
      handle({ type: "error", message: "連線中斷了，請再按啟動重試（後端可能正在重啟）。" });
    }
    setBusy(false);
  }

  window.JVMission = { run: runMission, setMode: function (m) { state.mode = m; }, busy: function () { return state.running; } };
})();
