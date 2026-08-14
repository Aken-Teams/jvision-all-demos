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
    var isCmd = id === "orchestrator";
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

  function renderPage(title, sub, html) {
    if ($("#resultTitle")) $("#resultTitle").textContent = title || "報告";
    if ($("#resultKind")) $("#resultKind").textContent = "AI 產出";
    var lr = $("#liveResult"); if (lr) lr.style.display = "none";
    var f = $("#resultFrame");
    if (f) { f.style.display = ""; f.style.width = "100%"; f.style.height = "620px"; f.style.border = "0"; f.removeAttribute("src"); f.setAttribute("srcdoc", html); }
    state.dash = { title: title, sub: sub, pageHtml: html };
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

  // pencils.dev 式：繪境一邊寫 HTML，一邊即時渲染。
  // 用 contentDocument.write()（像真實 HTTP 串流）逐段寫入，不重設 srcdoc → 不會整頁重載閃爍。
  function renderPageStream(chunk) {
    if (state.streamDone || state.streamHalt) return;
    var f = $("#resultFrame");
    if (!f) return;
    if (state.pageBuf == null) {
      state.pageBuf = "";
      var lr = $("#liveResult"); if (lr) lr.style.display = "none";
      f.style.display = ""; f.style.width = "100%"; f.style.height = "620px"; f.style.border = "0";
      f.removeAttribute("src"); f.removeAttribute("srcdoc");
      if ($("#resultKind")) $("#resultKind").textContent = "AI 即時產出";
      if ($("#frameLive")) $("#frameLive").innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400" style="animation:jvb 1s infinite"></span> 設計中…';
      try {
        var d = f.contentDocument || (f.contentWindow && f.contentWindow.document);
        d.open(); state.streamDoc = d;   // 開一次串流文件，之後只 append
      } catch (e) { state.streamDoc = null; }
      scrollToResult();                  // 自動捲到結果區塊
    }
    state.pageBuf += chunk;
    if (state.streamDoc) { try { state.streamDoc.write(chunk); } catch (e) { } }
    // 收到 </html> 後就停止，之後 AI 的閒聊/markdown 補充一律不寫進畫面
    if (/<\/html>/i.test(state.pageBuf)) {
      if (state.streamDoc) { try { state.streamDoc.close(); } catch (e) { } }
      state.streamHalt = true;
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
    else if (t === "page_pending") { if ($("#resultTitle")) $("#resultTitle").textContent = e.title || "結果畫面"; placeholder("團隊查各系統資料中，稍後彙整成報告…"); scrollToResult(); }
    else if (t === "report") renderReport(e.title, e.sub, e.spec);
    else if (t === "page_delta") renderPageStream(e.chunk);
    else if (t === "page") { state.streamDone = true; state.streamHalt = true; state.pageBuf = null; state.streamDoc = null; renderPage(e.title, e.sub, e.html); scrollToResult(); }
    else if (t === "layout") renderLayout(e.title, e.sub, e.blocks, e.theme);
    else if (t === "block_status") blockStatus(e.id, e.message);
    else if (t === "block") fillBlock(e);
    else if (t === "html") { var h = resultHost(); h.innerHTML = sanitize(e.html); }
    else if (t === "final") { narr("完成"); state.done = state.total + 1; progress(); var lv = $("#frameLive"); if (lv) lv.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-success"></span> 已完成'; if ($("#resultTitle")) $("#resultTitle").textContent = ($("#resultTitle").textContent || "").replace("（產生中）", ""); enableExport(); setBusy(false); }
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
    state.pageBuf = null; state.streamDone = false; state.streamHalt = false; state.streamDoc = null; state._lastPaint = 0;
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
