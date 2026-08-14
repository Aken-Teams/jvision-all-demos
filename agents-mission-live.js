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

  function feed() { return $("#logFeed"); }
  function narr(msg) { var s = $("#runStatus"); if (s) s.textContent = msg; }
  function progress() {
    var pct = state.total ? Math.round((state.done / (state.total + 1)) * 100) : 5;
    var bar = $("#runProgressBar"), p = $("#runPct");
    if (bar) bar.style.width = pct + "%"; if (p) p.textContent = pct + "%";
  }
  function addBubble(id, name, role, dm, html, thinking) {
    var f = feed(); if (!f) return;
    var col = (DM[dm] || ["", "#64748b"])[1];
    var wrap = document.createElement("div");
    wrap.className = "flex items-start gap-2.5";
    wrap.innerHTML =
      '<span class="w-8 h-8 rounded-full grid place-content-center shrink-0 text-white text-xs font-black" style="background:' + col + '">' + esc((name || "AI").slice(0, 1)) + '</span>' +
      '<div class="min-w-0 flex-1"><div class="flex items-center gap-2 mb-0.5"><b class="text-[13px] text-ink">' + esc(name) + '</b>' +
      '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style="color:' + col + ';background:' + col + '18">' + esc((DM[dm] || [""])[0]) + '</span></div>' +
      '<div class="text-[13px] text-body leading-snug bubble-body">' + (thinking ? '<span class="text-muted">思考中…</span>' : html) + '</div></div>';
    f.appendChild(wrap); f.scrollTop = f.scrollHeight;
    state.bubbles[id] = wrap.querySelector(".bubble-body");
  }
  function setBubble(id, html) { var b = state.bubbles[id]; if (b) { b.innerHTML = html; feed().scrollTop = feed().scrollHeight; } }

  function mdToHtml(t) {
    // 極簡 markdown：標題、粗體、清單、換行、連結
    t = esc(t);
    t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" class="text-brand underline">$1</a>');
    t = t.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" class="text-brand underline">$1</a>');
    t = t.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    t = t.replace(/^#{1,6}\s*(.+)$/gm, '<div class="font-bold text-ink mt-1">$1</div>');
    t = t.replace(/^[-*]\s+(.+)$/gm, '<div class="pl-3">• $1</div>');
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

  function frameSet(srcdoc) {
    var f = $("#resultFrame");
    if (!f) return;
    f.style.display = "";
    f.removeAttribute("src");
    f.setAttribute("srcdoc", srcdoc);
  }
  function renderHtml(html) {
    if ($("#resultTitle")) $("#resultTitle").textContent = "結果畫面";
    if ($("#resultKind")) $("#resultKind").textContent = "AI 產出";
    // 包一層基本樣式，確保字體與寬度自適應
    frameSet('<!doctype html><meta charset="utf-8"><style>body{font-family:system-ui,"Noto Sans TC",sans-serif;margin:0;padding:16px;color:#0f172a;font-size:14px;background:#fff}*{box-sizing:border-box;max-width:100%}table{width:100%;border-collapse:collapse}</style>' + html);
  }
  function placeholder(msg) {
    frameSet('<!doctype html><meta charset="utf-8"><div style="font-family:system-ui,sans-serif;color:#64748b;display:flex;height:90vh;align-items:center;justify-content:center;flex-direction:column;gap:10px"><div style="width:34px;height:34px;border:3px solid #e2e8f0;border-top-color:#2563eb;border-radius:50%;animation:s 1s linear infinite"></div><div>' + msg + '</div><style>@keyframes s{to{transform:rotate(360deg)}}</style></div>');
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
    else if (t === "html") renderHtml(e.html);
    else if (t === "panel") renderPanel(e.mode || state.mode, e.data);
    else if (t === "final") { narr("完成"); state.done = state.total + 1; progress(); var lv = $("#frameLive"); if (lv) lv.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-success"></span> 已完成'; state.running = false; }
    else if (t === "error") { narr("發生問題"); addBubble("_err", "系統", "", "reasoning", '<span class="text-danger">' + esc(e.message) + '</span>'); state.running = false; }
  }

  async function runMission(question, mode) {
    if (state.running) return;
    state.running = true; state.mode = mode || "task"; state.bubbles = {}; state.done = 0; state.total = 0;
    if (feed()) feed().innerHTML = ""; if ($("#doneList")) $("#doneList").innerHTML = "";
    if ($("#demoQuestion")) $("#demoQuestion").textContent = question;
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
    state.running = false;
  }

  window.JVMission = { run: runMission, setMode: function (m) { state.mode = m; } };
})();
