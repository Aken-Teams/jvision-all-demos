/**
 * 全站浮動 AI 頭像(Phase 3)。掛在 Hub 頁(index/catalog/project/agents)。
 *
 * 登入者(Google 具名)點頭像 → 對話面板 → 問題送 /run(SSE)。
 * 系統代理讀取某套系統時,後端會發 sys_tour 導覽腳本,這裡開一個
 * 「操作劇場」:實際載入該系統畫面,照腳本切畫面、逐項把正在讀的
 * KPI/明細表高亮框出來(透過 demo 內的 jv-agent-bridge postMessage)——
 * 客戶親眼看到 AI 在操作網頁、讀哪些數字,而不是黑箱吐報告。
 *
 * 報告完成後小面板只放結論卡,完整報告開獨立分頁(避免小視窗塞爆)。
 */
(function () {
  "use strict";
  if (window.__jvAvatar) return;
  window.__jvAvatar = true;

  var VER = "3"; // 與 hub 頁 script 標籤的 ?v= 同步遞增(gateway 對 js/css 有 1 小時快取)
  var REDUCE = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = { open: false, running: false, runDone: true, me: null };

  function h(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---- Markdown-lite(標題/粗體/清單/表格/連結/==重點==) ----
  function mdLite(md) {
    var lines = String(md || "").split("\n");
    var out = [], listOpen = false, tableRows = [];
    function closeList() { if (listOpen) { out.push("</ul>"); listOpen = false; } }
    function flushTable() {
      if (!tableRows.length) return;
      var rows = tableRows; tableRows = [];
      var html = "<table class=\"jva-table\">";
      rows.forEach(function (cells, i) {
        html += "<tr>" + cells.map(function (c) { return (i === 0 ? "<th>" : "<td>") + inline(c) + (i === 0 ? "</th>" : "</td>"); }).join("") + "</tr>";
      });
      out.push(html + "</table>");
    }
    function inline(s) {
      s = esc(s);
      s = s.replace(/==([^=]{1,24})==/g, "<mark>$1</mark>");
      s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
      s = s.replace(/\[([^\]]+)\]\((\/[^)\s]+|https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      return s;
    }
    var inFence = false;
    for (var i = 0; i < lines.length; i += 1) {
      var l = lines[i];
      if (/^```/.test(l)) {
        if (!inFence) { closeList(); flushTable(); out.push('<div class="jva-fence">圖表(完整報告內檢視)</div>'); }
        inFence = !inFence; continue;
      }
      if (inFence) continue;
      if (/^\|/.test(l)) {
        var cells = l.replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); });
        if (cells.every(function (c) { return /^:?-{2,}:?$/.test(c); })) continue;
        tableRows.push(cells); continue;
      }
      flushTable();
      if (/^###?\s/.test(l)) { closeList(); out.push("<h4>" + inline(l.replace(/^#+\s*/, "")) + "</h4>"); continue; }
      if (/^[-•]\s/.test(l)) { if (!listOpen) { out.push("<ul>"); listOpen = true; } out.push("<li>" + inline(l.replace(/^[-•]\s*/, "")) + "</li>"); continue; }
      closeList();
      if (l.trim()) out.push("<p>" + inline(l) + "</p>");
    }
    closeList(); flushTable();
    return out.join("");
  }

  // 圖文報告的獨立分頁(小面板只放結論卡,全文開這頁)
  function textReportDoc(question, md) {
    return "<!doctype html><html lang=\"zh-Hant\"><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
      "<base href=\"" + location.origin + "/\" target=\"_blank\">" +
      "<title>" + esc(question) + "</title><style>" +
      "body{margin:0;background:#f5f7f8;color:#1a2732;font:16px/1.85 'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif}" +
      ".wrap{max-width:760px;margin:0 auto;padding:40px 22px 80px}" +
      ".hd{border-bottom:2px solid #0f7a80;padding-bottom:14px;margin-bottom:22px}" +
      ".hd b{font-size:22px;color:#16304e}.hd small{display:block;color:#5b6b78;margin-top:4px}" +
      "h4{font-size:17px;color:#16304e;margin:24px 0 8px;border-left:4px solid #0f7a80;padding-left:10px}" +
      "p{margin:10px 0}ul{margin:6px 0;padding-left:20px}mark{background:#f3e3bd;border-radius:3px;padding:0 3px}" +
      "a{color:#0f7a80;font-weight:700}table{border-collapse:collapse;width:100%;margin:12px 0;font-size:14px}" +
      "th,td{border:1px solid #dbe4e9;padding:7px 10px;text-align:left}th{background:#eef3f5}" +
      ".jva-fence{color:#8195a3;font-size:13px;border:1px dashed #cbd7df;border-radius:8px;padding:10px 12px;margin:10px 0}" +
      "</style></head><body><div class=\"wrap\">" +
      "<div class=\"hd\"><b>" + esc(question) + "</b><small>JVision AI 團隊 · 數據取自站上系統實際畫面,連結可點回出處</small></div>" +
      mdLite(md) + "</div></body></html>";
  }

  // ---- UI ----
  var root, panel, feedEl, inputEl, sendBtn;
  function build() {
    root = h('<div class="jva-root"></div>');
    var btn = h('<button type="button" class="jva-fab" aria-label="呼叫 JVision AI 團隊" title="呼叫 AI 團隊">' +
      '<span class="jva-fab-face">智</span></button>');
    panel = h(
      '<div class="jva-panel" role="dialog" aria-label="JVision AI 團隊" hidden>' +
      '  <div class="jva-head"><div class="jva-head-face">智</div>' +
      '    <div class="jva-head-txt"><b>JVision AI 團隊</b><small>問一句,團隊查真實系統數據給你答案</small></div>' +
      '    <button type="button" class="jva-close" aria-label="關閉">✕</button></div>' +
      '  <div class="jva-feed" aria-live="polite"></div>' +
      '  <form class="jva-inputrow">' +
      '    <input class="jva-input" type="text" maxlength="200" placeholder="例:摘要 CRM 目前的商機現況" aria-label="想問 AI 團隊什麼">' +
      '    <button class="jva-send" type="submit">送出</button></form>' +
      '</div>');
    root.appendChild(panel); root.appendChild(btn);
    document.body.appendChild(root);
    feedEl = panel.querySelector(".jva-feed");
    inputEl = panel.querySelector(".jva-input");
    sendBtn = panel.querySelector(".jva-send");
    btn.addEventListener("click", toggle);
    panel.querySelector(".jva-close").addEventListener("click", toggle);
    panel.querySelector(".jva-inputrow").addEventListener("submit", function (e) {
      e.preventDefault();
      var q = inputEl.value.trim();
      if (q && !state.running) run(q);
    });
    renderWelcome();
  }

  var EXAMPLES = [
    "摘要 CRM 目前的商機現況",
    "生產工單系統現在的達交狀況?",
    "出勤差勤系統的近況重點",
  ];

  function renderWelcome() {
    var el = h(
      '<div class="jva-empty">' +
      '  <div class="jva-empty-face">智</div>' +
      '  <p class="jva-empty-title">你好,我是 JVision AI 團隊</p>' +
      '  <p class="jva-empty-sub">問一句,我到站上的系統<b>實際操作、讀取數據</b>回答你——過程你都看得到,結論也能點回畫面看出處。</p>' +
      '  <div class="jva-chips">' + EXAMPLES.map(function (q) {
        return '<button type="button" class="jva-chip">' + esc(q) + "</button>";
      }).join("") + "</div></div>");
    el.querySelectorAll(".jva-chip").forEach(function (b) {
      b.addEventListener("click", function () { if (!state.running && !inputEl.disabled) run(b.textContent); });
    });
    feedEl.appendChild(el);
  }

  function toggle() {
    state.open = !state.open;
    panel.hidden = !state.open;
    if (state.open && !state.me) checkIdentity();
    if (state.open) inputEl.focus();
  }

  function line(cls, html) {
    var el = h('<div class="jva-line ' + cls + '">' + html + "</div>");
    feedEl.appendChild(el);
    feedEl.scrollTop = feedEl.scrollHeight;
    return el;
  }
  function bubble(name, text, mode) {
    return line("jva-msg" + (mode ? " jva-" + mode : ""),
      '<b class="jva-who">' + esc(name) + "</b><span>" + esc(text) + "</span>");
  }

  function checkIdentity() {
    fetch("/api/visitor/me").then(function (r) { return r.json(); }).then(function (me) {
      state.me = me || {};
      if (!me || !me.signedIn || me.kind !== "google") {
        var next = encodeURIComponent(location.pathname + location.search);
        line("jva-sys jva-login", 'AI 團隊功能需要 Google 帳號登入。<a href="/api/visitor/google/start?next=' + next + '">使用 Google 帳號登入</a>');
        inputEl.disabled = true; sendBtn.disabled = true;
      } else if (me.name) {
        var t = panel.querySelector(".jva-empty-title");
        if (t) t.textContent = me.name + ",你好!我是 JVision AI 團隊";
      }
    }).catch(function () { /* 讀不到身分就先讓人打字,gateway 會把關 */ });
  }

  // ---- 操作劇場:實際載入系統畫面,照 sys_tour 腳本切畫面、逐項高亮 ----
  var stage = { el: null, iframe: null, cap: null, sys: null, queue: [], playing: false, stopped: false };

  function ensureStage() {
    if (stage.el) return;
    stage.el = h(
      '<div class="jva-stage" hidden>' +
      '  <div class="jva-stage-win">' +
      '    <div class="jva-stage-head"><span class="jva-stage-dot"></span>' +
      '      <div class="jva-stage-txt"><b class="jva-stage-sys">AI 操作中</b><small class="jva-stage-cap">連線系統…</small></div>' +
      '      <button type="button" class="jva-stage-skip">跳過展示</button></div>' +
      '    <iframe class="jva-stage-frame" title="AI 正在操作的系統畫面"></iframe>' +
      "  </div></div>");
    document.body.appendChild(stage.el);
    stage.iframe = stage.el.querySelector(".jva-stage-frame");
    stage.cap = stage.el.querySelector(".jva-stage-cap");
    stage.sys = stage.el.querySelector(".jva-stage-sys");
    stage.el.querySelector(".jva-stage-skip").addEventListener("click", function () {
      stage.stopped = true; stage.queue = []; hideStage();
    });
  }
  function showStage() { ensureStage(); stage.el.hidden = false; }
  function hideStage() { if (stage.el) stage.el.hidden = true; stage.playing = false; }
  function post(msg) {
    try { stage.iframe.contentWindow.postMessage(msg, "*"); } catch (e) { }
  }
  function wait(ms) { return REDUCE ? 160 : ms; }

  function queueTour(tour) {
    if (stage.stopped) return;
    stage.queue.push(tour);
    if (!stage.playing) playNextTour();
  }
  function playNextTour() {
    var t = stage.queue.shift();
    if (!t) {
      stage.playing = false;
      if (state.runDone) hideStage();
      else if (stage.cap) stage.cap.textContent = "資料讀取完成,團隊撰寫報告中…";
      return;
    }
    stage.playing = true;
    showStage();
    stage.sys.textContent = "AI 正在操作《" + t.title + "》";
    stage.cap.textContent = "開啟系統畫面…";
    var first = t.steps[0] ? t.steps[0].screen : 0;
    stage.iframe.onload = function () { setTimeout(function () { playStep(t, 0, 0); }, wait(900)); };
    stage.iframe.src = t.url + "#go=" + first;
  }
  function playStep(t, si, ii) {
    if (stage.stopped) return;
    if (si >= t.steps.length) {
      stage.cap.textContent = "《" + t.title + "》讀取完成 ✓";
      setTimeout(playNextTour, wait(900));
      return;
    }
    var st = t.steps[si];
    if (ii === 0) {
      post({ jvAgent: "goto", screen: st.screen });
      stage.cap.textContent = "切換到「" + (st.title || "畫面 " + (st.screen + 1)) + "」";
      setTimeout(function () { playStep(t, si, 1); }, wait(900));
      return;
    }
    var item = st.items[ii - 1];
    if (!item) { playStep(t, si + 1, 0); return; }
    post({ jvAgent: "highlight", term: item.term });
    stage.cap.textContent = "讀取:" + item.text;
    setTimeout(function () { playStep(t, si, ii + 1); }, wait(1050));
  }

  function openReport(html) {
    var based = html.replace(/<head([^>]*)>/i, function (m) {
      return m + '<base href="' + location.origin + '/" target="_blank">';
    });
    var url = URL.createObjectURL(new Blob([based], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
  }
  function openDoc(html) {
    var url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
  }

  function run(question) {
    state.running = true; state.runDone = false;
    stage.stopped = false;
    var empty = panel.querySelector(".jva-empty");
    if (empty) empty.remove();
    inputEl.value = ""; inputEl.disabled = true; sendBtn.disabled = true;
    bubble("你", question, "me");
    var busy = line("jva-sys jva-busy", "團隊集合中…");
    var acc = { page: "", report: "" };

    fetch("/run", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question, mode: "task" }) })
      .then(function (resp) {
        if (resp.status === 403) {
          return resp.json().catch(function () { return {}; }).then(function (b) {
            busy.remove();
            line("jva-sys", esc((b && b.error) || "需要 Google 帳號登入。"));
            throw new Error("forbidden");
          });
        }
        if (!resp.ok || !resp.body) { throw new Error("backend"); }
        var reader = resp.body.getReader(), dec = new TextDecoder(), buf = "";
        function pump() {
          return reader.read().then(function (r) {
            if (r.done) return;
            buf += dec.decode(r.value, { stream: true });
            var idx;
            while ((idx = buf.indexOf("\n\n")) >= 0) {
              var chunk = buf.slice(0, idx); buf = buf.slice(idx + 2);
              if (chunk.indexOf("data: ") === 0) {
                try { handle(JSON.parse(chunk.slice(6))); } catch (e) { }
              }
            }
            return pump();
          });
        }
        return pump();
      })
      .catch(function (err) {
        if (String(err && err.message) !== "forbidden") line("jva-sys", "連線中斷了,請再試一次。");
      })
      .then(function () {
        busy.remove();
        state.running = false; state.runDone = true;
        if (!stage.playing) hideStage();
        inputEl.disabled = false; sendBtn.disabled = false; inputEl.focus();
      });

    function excerptOf(md) {
      var m = String(md || "").match(/##\s*結論\s*\n+([\s\S]{0,400}?)(\n##|$)/);
      var raw = (m ? m[1] : String(md || "").slice(0, 240)).replace(/[#*`>|=-]+/g, " ").replace(/\s+/g, " ").trim();
      return raw.slice(0, 150) + (raw.length > 150 ? "…" : "");
    }

    function handle(e) {
      if (e.type === "status") busy.textContent = e.message || "";
      else if (e.type === "sys_tour") queueTour(e);
      else if (e.type === "message" && e.text) bubble(e.name || "AI", e.text, e.dataMode === "system-live" ? "live" : "");
      else if (e.type === "step" && e.message) line("jva-step", esc(e.message));
      else if (e.type === "page_delta") acc.page += e.chunk || "";
      else if (e.type === "report_delta") acc.report += e.chunk || "";
      else if (e.type === "page") {
        var html = e.html || acc.page;
        var b = line("jva-result", '<b>報告完成</b><button type="button" class="jva-open">開啟報告網頁</button>' +
          '<small>報告底部的「資料來源」可點回各系統畫面,出處會自動高亮。</small>');
        b.querySelector(".jva-open").addEventListener("click", function () { openReport(html); });
      }
      else if (e.type === "report") {
        var md = e.markdown || acc.report;
        var b2 = line("jva-result", '<b>圖文報告完成</b><p class="jva-excerpt">' + esc(excerptOf(md)) + "</p>" +
          '<button type="button" class="jva-open">開啟完整報告</button>' +
          '<small>報告內的「資料來源」可點回各系統畫面,出處會自動高亮。</small>');
        b2.querySelector(".jva-open").addEventListener("click", function () { openDoc(textReportDoc(question, md)); });
      }
      else if (e.type === "error") line("jva-sys", esc(e.message || "發生問題,請再試一次。"));
    }
  }

  function ensureCss() {
    if (document.querySelector('link[href*="jv-ai-avatar.css"]')) return;
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = "/shared/jv-ai-avatar.css?v=" + VER;
    document.head.appendChild(l);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { ensureCss(); build(); });
  } else { ensureCss(); build(); }
})();
