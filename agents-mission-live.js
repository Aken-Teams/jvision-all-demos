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
  (function injectCss() {
    var s = document.createElement("style");
    s.textContent = [
      "@keyframes jvb{0%,100%{opacity:.3}50%{opacity:1}}@keyframes jvspin{to{transform:rotate(360deg)}}@keyframes jvfade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}",
      // ── 結果畫面設計系統（比照 demo：卡片 / KPI / 圖表 / 表格 / 提示；RWD）──
      "#liveResult .jv-h{font-size:15px;font-weight:800;color:#0f172a;margin:0 0 10px;display:flex;align-items:center;gap:6px}",
      "#liveResult .jv-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px}",
      "#liveResult .jv-kpi{background:#f8fafc;border:1px solid #e8eef5;border-radius:14px;padding:14px}",
      "#liveResult .jv-kpi .v{font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-.5px;line-height:1.1}",
      "#liveResult .jv-kpi .l{font-size:12px;color:#64748b;font-weight:600;margin-top:4px}",
      "#liveResult .jv-chart{width:100%;height:230px;margin:6px 0 14px}",
      "#liveResult table.jv-table{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0 14px}",
      "#liveResult .jv-table th{background:#f4f8fb;color:#64748b;font-size:11.5px;font-weight:700;text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0}",
      "#liveResult .jv-table td{padding:8px 10px;border-bottom:1px solid #eef2f7;color:#334155}",
      "#liveResult .jv-note{background:#f5f8ff;border:1px solid #dbe6f5;border-left:3px solid #2563eb;border-radius:10px;padding:10px 12px;font-size:13px;color:#334155;line-height:1.7}",
      "#liveResult .jv-note a{color:#2563eb;text-decoration:underline;word-break:break-all}",
      "#liveResult .jvsec{background:#fff;border:1px solid #e6ebf2;border-radius:16px;padding:16px;box-shadow:0 1px 2px rgba(15,23,42,.04)}",
      "@media(max-width:520px){#liveResult .jv-kpis{grid-template-columns:repeat(2,1fr)}}"
    ].join("");
    document.head.appendChild(s);
  })();

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
  function resultStart(title, sub) {
    if ($("#resultTitle")) $("#resultTitle").textContent = title || "結果畫面";
    if ($("#resultKind")) $("#resultKind").textContent = "AI 產出";
    var h = resultHost();
    h.innerHTML = '<div style="margin-bottom:12px"><div style="font-size:16px;font-weight:800">' + esc(title) + '</div>' +
      '<div style="font-size:12px;color:#64748b;margin-top:2px">' + esc(sub || "") + '</div></div>' +
      '<div id="lrSections"></div>' +
      '<div id="lrWait" style="color:#94a3b8;font-size:12px;display:flex;align-items:center;gap:6px;padding:8px 0"><span style="width:12px;height:12px;border:2px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;display:inline-block;animation:jvspin .9s linear infinite"></span> Agent 陸續產出區塊中…</div>';
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
      var COL = ["#2563eb", "#38bdf8", "#7c3aed", "#0d9488", "#f59e0b", "#e11d48"];
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
      if (dl) { var el = document.createElement("div"); el.className = "flex items-start gap-2 bg-soft rounded-lg px-2.5 py-2"; el.innerHTML = '<span class="material-symbols-outlined text-[17px] text-success shrink-0">check_circle</span><span class="text-[13px] text-ink">' + esc(e.text) + '</span>'; dl.appendChild(el); }
      if ($("#statDone")) $("#statDone").textContent = state.done;
    }
    else if (t === "result_start") resultStart(e.title, e.sub);
    else if (t === "section") renderSection(e);
    else if (t === "html") { var h = resultHost(); h.innerHTML = sanitize(e.html); }
    else if (t === "final") { narr("完成"); state.done = state.total + 1; progress(); var w = $("#lrWait"); if (w) w.remove(); var lv = $("#frameLive"); if (lv) lv.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-success"></span> 已完成'; if ($("#resultTitle")) $("#resultTitle").textContent = ($("#resultTitle").textContent || "").replace("（產生中）", ""); setBusy(false); }
    else if (t === "error") { narr("發生問題"); addBubble("_err", "系統", "", "reasoning", '<span class="text-danger">' + esc(e.message) + '</span>'); setBusy(false); }
  }

  function setBusy(on) {
    state.running = on;
    var btn = $("#missRun");
    if (btn) { btn.disabled = on; btn.style.opacity = on ? ".5" : ""; btn.style.pointerEvents = on ? "none" : ""; btn.innerHTML = on ? '<span class="material-symbols-outlined text-[18px]" style="animation:jvspin 1s linear infinite">progress_activity</span> 執行中' : '<span class="material-symbols-outlined text-[18px]">bolt</span> 啟動'; }
  }
  async function runMission(question, mode) {
    if (state.running) return;
    setBusy(true); state.mode = mode || "task"; state.bubbles = {}; state.done = 0; state.total = 0;
    if (feed()) feed().innerHTML = ""; if ($("#doneList")) $("#doneList").innerHTML = "";
    if ($("#demoQuestion")) $("#demoQuestion").textContent = question;
    if ($("#resultTitle")) $("#resultTitle").textContent = "結果畫面（產生中）";
    placeholder("團隊協作中，稍候右側會長出結果畫面…");
    narr("送出需求…"); progress();
    try {
      var resp = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: question, mode: state.mode }) });
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
      handle({ type: "error", message: "無法連線後端（請確認 python app.py 已啟動於 :4610）" });
    }
    setBusy(false);
  }

  window.JVMission = { run: runMission, setMode: function (m) { state.mode = m; }, busy: function () { return state.running; } };
})();
