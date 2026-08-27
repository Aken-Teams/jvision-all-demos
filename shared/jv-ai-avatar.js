/**
 * 全站浮動 AI 頭像(Phase 3)。掛在 Hub 頁(index/catalog/project/agents)。
 *
 * 登入者(Google 具名)點頭像 → 對話面板 → 問題送 /run(SSE)→
 * 即時顯示總指揮/系統代理/設計師的協作過程與最終報告。
 * 報告裡的溯源連結(/demos/<repo>/#go=n&hl=詞)點了會打開該系統畫面,
 * bridge 會把數字出處高亮——「AI 真的查過」看得見。
 *
 * 未登入者打開面板會看到登入引導;/run 在 gateway 也有 403 把關,前端只是好走。
 */
(function () {
  "use strict";
  if (window.__jvAvatar) return;
  window.__jvAvatar = true;

  var state = { open: false, running: false, me: null };

  function h(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---- Markdown-lite(只給文字報告用:標題/粗體/清單/表格/連結/==重點==) ----
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
      if (/^```/.test(l)) { // 圖表圍欄:面板放不下真圖,標註並請看完整報告
        if (!inFence) { closeList(); flushTable(); out.push('<div class="jva-fence">圖表(開啟完整報告檢視)</div>'); }
        inFence = !inFence; continue;
      }
      if (inFence) continue;
      if (/^\|/.test(l)) {
        var cells = l.replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); });
        if (cells.every(function (c) { return /^:?-{2,}:?$/.test(c); })) continue; // 分隔列
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
      '  <p class="jva-empty-sub">問一句,我請團隊到站上的系統查<b>實際數據</b>回答你,結論都可以點回畫面看出處。</p>' +
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

  function openReport(html) {
    // 溯源連結是站內絕對路徑;blob 分頁要補 <base> 才點得回站上
    var based = html.replace(/<head([^>]*)>/i, function (m) {
      return m + '<base href="' + location.origin + '/" target="_blank">';
    });
    var url = URL.createObjectURL(new Blob([based], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
  }

  function run(question) {
    state.running = true;
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
        state.running = false; inputEl.disabled = false; sendBtn.disabled = false; inputEl.focus();
      });

    function handle(e) {
      if (e.type === "status") busy.textContent = e.message || "";
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
        line("jva-result jva-md", mdLite(md));
      }
      else if (e.type === "error") line("jva-sys", esc(e.message || "發生問題,請再試一次。"));
    }
  }

  // 樣式載入(避免每頁都要手動加 <link>)
  function ensureCss() {
    if (document.querySelector('link[href*="jv-ai-avatar.css"]')) return;
    var l = document.createElement("link");
    // ?v= 與 hub 頁的 script 標籤同步遞增:gateway 對 js/css 有 1 小時快取,
    // 不帶版本參數的話改版後使用者會拿到舊檔
    l.rel = "stylesheet"; l.href = "/shared/jv-ai-avatar.css?v=2";
    document.head.appendChild(l);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { ensureCss(); build(); });
  } else { ensureCss(); build(); }
})();
