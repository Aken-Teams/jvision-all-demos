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

  var VER = "14"; // 與 hub 頁 script 標籤的 ?v= 同步遞增(gateway 對 js/css 有 1 小時快取)
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
    var inFence = false, fenceKind = "", fenceBuf = [];
    for (var i = 0; i < lines.length; i += 1) {
      var l = lines[i];
      if (/^```/.test(l)) {
        if (!inFence) {
          closeList(); flushTable();
          fenceKind = l.replace(/`/g, "").trim().toLowerCase(); fenceBuf = []; inFence = true;
        } else {
          inFence = false;
          var body = fenceBuf.join("\n").trim();
          // 圖表圍欄保留定義,由文件內的渲染器(ECharts/mermaid)畫成真圖
          if (fenceKind === "mermaid") out.push('<pre class="mermaid">' + esc(body) + "</pre>");
          else if (fenceKind === "chart" || fenceKind === "echart")
            out.push('<div class="jva-chart" data-kind="' + fenceKind + '" data-def="' + esc(body) + '"></div>');
          else if (body) out.push('<div class="jva-fence">' + esc(body).slice(0, 400) + "</div>");
        }
        continue;
      }
      if (inFence) { fenceBuf.push(l); continue; }
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
      ".hd{border-bottom:2px solid #1e40af;padding-bottom:14px;margin-bottom:22px}" +
      ".hd b{font-size:22px;color:#16304e}.hd small{display:block;color:#5b6b78;margin-top:4px}" +
      "h4{font-size:17px;color:#16304e;margin:24px 0 8px;border-left:4px solid #1e40af;padding-left:10px}" +
      "p{margin:10px 0}ul{margin:6px 0;padding-left:20px}mark{background:#f3e3bd;border-radius:3px;padding:0 3px}" +
      "a{color:#1e40af;font-weight:700}table{border-collapse:collapse;width:100%;margin:12px 0;font-size:14px}" +
      "th,td{border:1px solid #dbe4e9;padding:7px 10px;text-align:left}th{background:#eef3f5}" +
      ".jva-fence{color:#8195a3;font-size:13px;border:1px dashed #cbd7df;border-radius:8px;padding:10px 12px;margin:10px 0}" +
      ".jva-chart{margin:14px 0;border:1px solid #e2eaee;border-radius:12px;background:#fff;padding:8px}" +
      ".jva-chart:not([data-done])::before{content:'圖表生成中…';display:grid;place-items:center;height:120px;color:#8fa5b5;font-size:13px}" +
      ".mermaid{display:flex;justify-content:center;background:#fff;border:1px solid #e2eaee;border-radius:12px;padding:12px;margin:14px 0}" +
      // 等待動畫:內容抵達前的骨架屏(客戶要看得出「正在寫」,不是掛了)
      ".jva-wait{padding:8px 0}" +
      ".jva-wait-msg{display:flex;align-items:center;gap:10px;color:#1e40af;font-weight:700;margin-bottom:18px}" +
      ".jva-wait-msg::before{content:'';width:12px;height:12px;border-radius:50%;background:#1e40af;animation:jvaPulse 1.2s ease-in-out infinite}" +
      ".jva-sk{height:14px;border-radius:7px;margin:12px 0;background:linear-gradient(90deg,#e8eef1 25%,#f6fafb 45%,#e8eef1 65%);background-size:220% 100%;animation:jvaShimmer 1.4s linear infinite}" +
      "@keyframes jvaPulse{50%{opacity:.35;transform:scale(1.25)}}" +
      "@keyframes jvaShimmer{to{background-position:-120% 0}}" +
      "@media (prefers-reduced-motion:reduce){.jva-sk,.jva-wait-msg::before{animation:none}}" +
      "</style></head><body><div class=\"wrap\">" +
      "<div class=\"hd\"><b>" + esc(question) + "</b><small>JVision AI 團隊 · 數據取自站上系統實際畫面,連結可點回出處</small></div>" +
      '<div class="jva-body">' + (mdLite(md) ||
        '<div class="jva-wait"><div class="jva-wait-msg">團隊正在撰寫,內容會即時出現在這裡</div>' +
        '<div class="jva-sk" style="width:88%"></div><div class="jva-sk" style="width:70%"></div>' +
        '<div class="jva-sk" style="width:94%"></div><div class="jva-sk" style="width:56%"></div>' +
        '<div class="jva-sk" style="width:80%;margin-top:26px"></div><div class="jva-sk" style="width:64%"></div></div>') +
      "</div></div>" +
      '<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"><\/script>' +
      '<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"><\/script>' +
      "<script>" +
      "window.jvRenderCharts=function(){" +
      "document.querySelectorAll('.jva-chart:not([data-done])').forEach(function(el){" +
      " try{var def=JSON.parse(el.getAttribute('data-def'));el.setAttribute('data-done','1');el.style.height='320px';" +
      "  var c=echarts.init(el),t=def.type||'bar',opt;" +
      "  if(el.getAttribute('data-kind')==='echart')opt=def;" +
      "  else if(t==='radar')opt={title:{text:def.title},radar:{indicator:(def.axes||[]).map(function(a){return{name:a}})},series:[{type:'radar',data:(def.series||[]).map(function(s){return{name:s.name,value:s.values}})}]};" +
      "  else if(t==='pie')opt={title:{text:def.title},tooltip:{},series:[{type:'pie',radius:['32%','62%'],data:def.data,label:{formatter:'{b} {c}'}}]};" +
      "  else opt={title:{text:def.title},tooltip:{},grid:{left:56,right:24,bottom:44,top:def.title?52:24},xAxis:{type:'category',data:(def.data||[]).map(function(d){return d.name}),axisLabel:{interval:0,rotate:(def.data||[]).length>5?24:0}},yAxis:{type:'value'},series:[{type:t==='line'?'line':'bar',data:(def.data||[]).map(function(d){return d.value}),itemStyle:{color:'#1e40af',borderRadius:t==='line'?0:[5,5,0,0]},areaStyle:t==='line'?{opacity:.14}:undefined,smooth:true,barMaxWidth:44}]};" +
      "  c.setOption(opt);addEventListener('resize',function(){c.resize()});" +
      " }catch(e){el.setAttribute('data-done','1');el.textContent='圖表資料無法解析';}});" +
      "try{if(window.mermaid){mermaid.initialize({startOnLoad:false,securityLevel:'loose'});mermaid.run({querySelector:'.mermaid:not([data-processed])'});}}catch(e){}};" +
      // CDN 可能還在載:輪詢到 echarts 就緒才畫,最多等 12 秒
      "(function boot(n){if(window.echarts){jvRenderCharts();}else if(n<40){setTimeout(function(){boot(n+1);},300);}else{document.querySelectorAll('.jva-chart:not([data-done])').forEach(function(el){el.setAttribute('data-done','1');el.style.height='auto';el.textContent='圖表載入逾時,請開啟完整報告檢視';});}})(0);" +
      "<\/script></body></html>";
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
      '  <p class="jva-empty-hello" hidden></p>' +
      '  <p class="jva-empty-title">你好,我是 JVision AI 團隊</p>' +
      '  <p class="jva-empty-sub">問一句,我會到站上的系統<b>實際操作、讀取數據</b>回答你;過程全程看得到,結論可點回畫面查出處。</p>' +
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
    if (mode === "me") {
      return line("jva-msg jva-me", '<b class="jva-who">' + esc(name) + "</b><span>" + esc(text) + "</span>");
    }
    // agent 氣泡帶小頭像:圓角方塊 + 名字首字,顏色依角色(推理藍/實機琥珀)
    return line("jva-msg" + (mode ? " jva-" + mode : ""),
      '<span class="jva-face" aria-hidden="true">' + esc((name || "A").charAt(0)) + "</span>" +
      '<span class="jva-msg-body"><b class="jva-who">' + esc(name) + "</b><span>" + esc(text) + "</span></span>");
  }

  function checkIdentity() {
    fetch("/api/visitor/me").then(function (r) { return r.json(); }).then(function (me) {
      state.me = me || {};
      if (!me || !me.signedIn || me.kind !== "google") {
        var next = encodeURIComponent(location.pathname + location.search);
        line("jva-sys jva-login", 'AI 團隊功能需要 Google 帳號登入。<a href="/api/visitor/google/start?next=' + next + '">使用 Google 帳號登入</a>');
        inputEl.disabled = true; sendBtn.disabled = true;
      } else if (me.name) {
        // 名字長短不一(英文全名可以很長),問候獨立一行,身分行維持穩定
        var hello = panel.querySelector(".jva-empty-hello");
        if (hello) { hello.textContent = me.name + ",你好!"; hello.hidden = false; }
      }
    }).catch(function () { /* 讀不到身分就先讓人打字,gateway 會把關 */ });
  }

  // ---- 操作劇場:實際載入系統畫面,照 sys_tour 腳本切畫面、逐項高亮;
  //      導覽結束後切換成「報告撰寫中」,讓客戶看著報告即時長出來 ----
  var stage = { el: null, iframe: null, cap: null, sys: null, skip: null,
    queue: [], playing: false, stopped: false, mode: "tour", reportStarted: false };

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
    stage.skip = stage.el.querySelector(".jva-stage-skip");
    stage.skip.addEventListener("click", function () {
      stage.stopped = true; stage.queue = []; hideStage();
    });
  }
  function showStage() { ensureStage(); stage.el.hidden = false; }
  function hideStage() { if (stage.el) stage.el.hidden = true; stage.playing = false; }
  function post(msg) {
    try { stage.iframe.contentWindow.postMessage(msg, "*"); } catch (e) { }
  }
  function wait(ms) { return REDUCE ? 160 : ms; }
  function stageDoc() {
    try { return stage.iframe.contentDocument; } catch (e) { return null; }
  }

  // 報告撰寫模式:同一個舞台,從「操作系統」切換成「看報告長出來」
  function enterReportMode() {
    if (stage.stopped || stage.mode === "report") return;
    showStage();
    stage.mode = "report";
    stage.reportStarted = false;
    stage.sys.textContent = "團隊正在撰寫報告";
    stage.cap.textContent = "初稿生成中,內容會即時長出來…";
    // 過場畫面(白底,配全站藍白主題)。用 srcdoc 全新解析——
    // document.write 注入的外部腳本在部分 Chrome 環境會被攔,srcdoc 沒這問題
    stage.iframe.onload = null;
    stage.iframe.srcdoc = '<!doctype html><meta charset="utf-8"><style>' +
      "body{margin:0;height:100vh;display:grid;place-items:center;background:#f6f8fb;" +
      "font-family:'Noto Sans TC','Microsoft JhengHei',system-ui,sans-serif;color:#16304e}" +
      ".f{width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,#1e3a5f,#1e40af);display:grid;place-items:center;" +
      "font-size:30px;font-weight:900;color:#fff;margin:0 auto 18px;animation:p 1.6s ease-in-out infinite}" +
      "@keyframes p{50%{transform:scale(1.08);box-shadow:0 0 44px rgba(30,64,175,.35)}}" +
      "@media (prefers-reduced-motion:reduce){.f{animation:none}}" +
      ".t{text-align:center}b{font-size:17px}small{display:block;margin-top:8px;color:#5b6b78}</style>" +
      '<div class="t"><div class="f">智</div><b>資料讀取完成,團隊正在撰寫報告</b>' +
      "<small>內容生成後會即時呈現在這裡,你也可以先關閉,完成後從對話面板開啟。</small></div>";
  }
  /* ---- 展演級寫入:sys_op 事件 → 開舞台載入系統,交派 bridge 跨畫面找目標改狀態 ---- */
  var opSeq = 0, opPending = {};
  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (d && d.jvAgentReply === "operate" && opPending[d.id]) {
      var cb = opPending[d.id]; delete opPending[d.id]; cb(d);
    }
  });
  function runOperation(op) {
    if (stage.stopped) return;
    ensureStage();
    stage.mode = "tour"; stage.playing = true; stage.queue = [];
    showStage();
    stage.sys.textContent = "AI 正在操作《" + op.title + "》";
    stage.cap.textContent = "開啟系統,尋找「" + op.target + "」…";
    function fail() {
      stage.playing = false;
      stage.cap.textContent = "在畫面上找不到「" + op.target + "」,操作未執行。";
      bubble(op.title, "我在《" + op.title + "》的畫面上找不到「" + op.target + "」,操作未執行。", "live");
    }
    stage.iframe.onload = function () {
      setTimeout(function () {
        stage.cap.textContent = "逐畫面尋找「" + op.target + "」…";
        var id = "op" + (++opSeq);
        var to = setTimeout(function () { if (opPending[id]) { delete opPending[id]; fail(); } }, 14000);
        opPending[id] = function (r) {
          clearTimeout(to);
          stage.playing = false;
          if (!r.ok) { fail(); return; }
          stage.cap.textContent = "✔ 已將「" + op.target + "」" + op.verb + "「" + op.value + "」(展示操作,重新整理即復原)";
          stage.el.classList.add("jva-stage-done");
          stage.skip.textContent = "關閉";
          bubble(op.title, "已把「" + op.target + "」" + op.verb + "「" + op.value + "」。展示操作只改畫面不落地,重新整理即復原。", "live");
        };
        try { stage.iframe.contentWindow.postMessage({ jvAgent: "operate", id: id, target: op.target, value: op.value }, "*"); }
        catch (e2) { fail(); }
      }, wait(900));
    };
    stage.iframe.removeAttribute("srcdoc");
    stage.iframe.src = op.url;
  }

  /* 完稿永遠接管舞台:就算導覽還在播(報告寫得比導覽快),也立刻中斷、
     把完整報告呈現出來——不然會發生「導覽播完→任務已結束→舞台自己關掉」,
     客戶根本沒看到報告畫面。srcdoc 全新解析,圖表腳本必定執行。 */
  function showFinal(docHtml) {
    ensureStage();
    stage.mode = "report";      // playStep 的守衛會就此終止導覽計時鏈
    stage.playing = false;
    stage.queue = [];
    /* 圖表渲染由父視窗主動觸發:文件內的啟動輪詢在 srcdoc iframe 環境
       實測會啞火(手動呼叫卻必定成功),所以載入後改由這裡每 500ms 催一次,
       直到所有圖表畫完。HTML 報告(自帶腳本、無 jvRenderCharts)會立即判定完成。 */
    stage.iframe.onload = function () {
      var tries = 0;
      var t = setInterval(function () {
        tries += 1;
        var done = false;
        try {
          var w2 = stage.iframe.contentWindow, d2 = stage.iframe.contentDocument;
          if (w2 && w2.jvRenderCharts) w2.jvRenderCharts();
          done = d2 && !d2.querySelector(".jva-chart:not([data-done])");
        } catch (e) { }
        if (done || tries > 30 || stage.mode !== "report") clearInterval(t);
      }, 500);
    };
    stage.iframe.srcdoc = docHtml;
    showStage();
    finishReport();
  }
  function finishReport() {
    if (!stage.el || stage.el.hidden) return;
    stage.sys.textContent = "報告完成";
    stage.cap.textContent = "可捲動檢視;報告內的資料來源可點回系統畫面";
    stage.skip.textContent = "關閉報告";
    stage.el.classList.add("jva-stage-done");
  }

  function queueTour(tour) {
    if (stage.stopped) return;
    stage.queue.push(tour);
    if (!stage.playing && stage.mode !== "report") playNextTour();
  }
  function playNextTour() {
    if (stage.stopped || stage.mode === "report") { stage.playing = false; return; }
    var t = stage.queue.shift();
    if (!t) {
      stage.playing = false;
      if (state.runDone) hideStage();
      else enterReportMode(); // 導覽播完 → 舞台切成報告撰寫實況
      return;
    }
    stage.playing = true;
    showStage();
    stage.sys.textContent = "AI 正在操作《" + t.title + "》";
    stage.cap.textContent = "開啟系統畫面…";
    var first = t.steps[0] ? t.steps[0].screen : 0;
    stage.iframe.onload = function () { setTimeout(function () { playStep(t, 0, 0); }, wait(900)); };
    stage.iframe.removeAttribute("srcdoc"); // srcdoc 優先權高於 src,留著會蓋掉導覽頁
    stage.iframe.src = t.url + "#go=" + first;
  }
  function playStep(t, si, ii) {
    // 報告模式一啟動,導覽的計時鏈就終止(否則殘留 setTimeout 會把字幕蓋回導覽文案)
    if (stage.stopped || stage.mode === "report") { stage.playing = false; return; }
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

  // 站內絕對路徑(/demos/…)在 blob 分頁與 srcdoc 裡都要靠 <base> 才點得回站上
  function withBase(html) {
    return html.replace(/<head([^>]*)>/i, function (m) {
      return m + '<base href="' + location.origin + '/" target="_blank">';
    });
  }
  function openReport(html) {
    var url = URL.createObjectURL(new Blob([withBase(html)], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
  }
  function openDoc(html) {
    var url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
  }

  function run(question) {
    state.running = true; state.runDone = false;
    stage.stopped = false; stage.mode = "tour"; stage.reportStarted = false;
    if (stage.el) { stage.el.classList.remove("jva-stage-done"); stage.skip.textContent = "跳過展示"; }
    var empty = panel.querySelector(".jva-empty");
    if (empty) empty.remove();
    inputEl.value = ""; inputEl.disabled = true; sendBtn.disabled = true;
    bubble("你", question, "me");
    // 進行狀態用 AI 頭像氣泡呈現(不是漂浮的灰字),文字隨 status 事件更新
    var busy = line("jva-msg jva-status",
      '<span class="jva-mini-face">智</span><span class="jva-status-body"><b class="jva-who">AI 團隊</b>' +
      '<span class="jva-status-txt">團隊集合中</span></span>');
    var busyTxt = busy.querySelector(".jva-status-txt");
    var acc = { page: "", written: 0, report: "", mdTimer: 0 };

    // HTML 報告:把串流片段依序 document.write 進舞台 iframe(報告逐塊長出來)
    function streamPage() {
      if (stage.stopped || stage.mode !== "report") return;
      var doc = stageDoc();
      if (!doc) return;
      if (!stage.reportStarted) {
        try { doc.open(); } catch (e) { return; }
        stage.reportStarted = true; acc.written = 0;
      }
      var chunk = acc.page.slice(acc.written);
      acc.written = acc.page.length;
      if (chunk) { try { doc.write(chunk); } catch (e) { } }
    }
    // 圖文報告:節流重渲染 markdown(逐段長出來)
    function streamText(final) {
      if (stage.stopped || stage.mode !== "report") return;
      var doc = stageDoc();
      if (!doc) return;
      if (!stage.reportStarted) {
        try {
          // 殼自帶 .jva-body 容器(內含等待骨架屏),串流內容直接寫進去
          doc.open();
          doc.write(textReportDoc(question, ""));
          doc.close();
        } catch (e) { return; }
        stage.reportStarted = true;
      }
      var render = function () {
        acc.mdTimer = 0;
        var d2 = stageDoc();
        var box = d2 && d2.querySelector(".jva-body");
        if (!box) return;
        var html = mdLite(acc.report);
        if (!html) return; // 還沒有可渲染的內容就保留骨架屏
        box.innerHTML = html;
        // 圖表只在完稿時渲染一次(串流中每 350ms 重畫會閃爍)
        if (final) { try { d2.defaultView.jvRenderCharts && d2.defaultView.jvRenderCharts(); } catch (e) { } }
        else { try { d2.defaultView.scrollTo(0, d2.body.scrollHeight); } catch (e) { } }
      };
      if (final) render();
      else if (!acc.mdTimer) acc.mdTimer = setTimeout(render, 350);
    }

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
        // 報告模式的舞台就是呈現頁,留著給客戶看;導覽模式的才收掉
        if (!stage.playing && stage.mode !== "report") hideStage();
        inputEl.disabled = false; sendBtn.disabled = false; inputEl.focus();
      });

    function excerptOf(md) {
      var m = String(md || "").match(/##\s*結論\s*\n+([\s\S]{0,400}?)(\n##|$)/);
      var raw = (m ? m[1] : String(md || "").slice(0, 240)).replace(/[#*`>|=-]+/g, " ").replace(/\s+/g, " ").trim();
      return raw.slice(0, 150) + (raw.length > 150 ? "…" : "");
    }

    function handle(e) {
      if (e.type === "status") busyTxt.textContent = (e.message || "").replace(/…+$/, "");
      else if (e.type === "sys_tour") queueTour(e);
      else if (e.type === "sys_op") runOperation(e);
      else if (e.type === "message" && e.text) bubble(e.name || "AI", e.text, e.dataMode === "system-live" ? "live" : "");
      else if (e.type === "step" && e.message) line("jva-step", esc(e.message));
      else if (e.type === "page_delta") {
        acc.page += e.chunk || "";
        if (stage.playing) stage.queue = []; // 報告開始生成:還沒播的導覽放棄,播完當前就切報告
        else if (!stage.stopped && !state.runDone) { enterReportMode(); streamPage(); }
      }
      else if (e.type === "report_delta") {
        acc.report += e.chunk || "";
        if (stage.playing) stage.queue = [];
        else if (!stage.stopped && !state.runDone) { enterReportMode(); streamText(false); }
      }
      else if (e.type === "page") {
        var html = e.html || acc.page;
        if (!stage.stopped) showFinal(withBase(html));
        var b = line("jva-result", '<b>報告完成</b><button type="button" class="jva-open">開啟報告網頁</button>' +
          '<small>報告底部的「資料來源」可點回各系統畫面,出處會自動高亮。</small>');
        b.querySelector(".jva-open").addEventListener("click", function () { openReport(html); });
      }
      else if (e.type === "report") {
        var md = e.markdown || acc.report;
        if (!stage.stopped) showFinal(textReportDoc(question, md));
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

  // 測試出口:讓驗收腳本不經 LLM 就能測 markdown → 報告文件的渲染鏈
  window.__jvAvatarTest = { mdLite: mdLite, textReportDoc: textReportDoc };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { ensureCss(); build(); });
  } else { ensureCss(); build(); }
})();
