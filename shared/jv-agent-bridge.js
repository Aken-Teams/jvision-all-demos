/**
 * Agent 瀏覽器端 bridge(Phase 3)——讓 AI 的結論「看得見出處」。
 *
 * 注入每套 demo(tools/apply-agent-bridge.mjs)。平常完全沉默、零視覺變化;
 * 只在下面三種情境動作:
 *   1. 網址帶 #go=<n>&hl=<詞>:切到該畫面後,把含該詞的區塊高亮並捲進視野
 *      (mission 報告的「資料來源」連結就是這個格式 → 點了直接看到數字出處)
 *   2. 父視窗 postMessage {jvAgent:"goto"|"highlight"|"readTables"|"listScreens"}
 *      (之後的頭像/編排器可在 iframe 內操作 demo)
 *   3. 瀏覽器支援 WebMCP(navigator.modelContext)時,把同一組能力註冊成標準工具
 *
 * 任何一步失敗都靜默略過——bridge 絕不能弄壞 demo 本體。
 */
(function () {
  "use strict";
  if (window.__jvAgentBridge) return;
  window.__jvAgentBridge = true;

  var HL_CLASS = "jv-agent-hl";

  function injectStyle() {
    if (document.getElementById("jv-agent-bridge-css")) return;
    var st = document.createElement("style");
    st.id = "jv-agent-bridge-css";
    st.textContent =
      "." + HL_CLASS + "{outline:3px solid #b45309 !important;outline-offset:3px;border-radius:6px;" +
      "animation:jvAgentPulse 1.2s ease-in-out 3;position:relative;z-index:5}" +
      "@keyframes jvAgentPulse{0%,100%{outline-color:#b45309}50%{outline-color:#f59e0b}}" +
      "@media (prefers-reduced-motion: reduce){." + HL_CLASS + "{animation:none}}";
    document.head.appendChild(st);
  }

  function visible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect();
    return r.width > 10 && r.height > 8;
  }

  function gotoScreen(n) {
    try { location.hash = "#go=" + n; } catch (e) { }
  }

  /* 找含指定文字的最小可見區塊,高亮外框並捲進視野。
     優先找「整段文字完全等於該詞」的節點(KPI 標籤/表頭),找不到再放寬為包含。 */
  function highlight(term) {
    if (!term || term.length < 2) return false;
    injectStyle();
    document.querySelectorAll("." + HL_CLASS).forEach(function (el) { el.classList.remove(HL_CLASS); });
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var exact = null, partial = null, node;
    while ((node = walker.nextNode())) {
      var t = (node.textContent || "").trim();
      if (!t || !visible(node.parentElement)) continue;
      if (t === term) { exact = node.parentElement; break; }
      if (!partial && t.indexOf(term) >= 0 && t.length < term.length + 60) partial = node.parentElement;
    }
    var el = exact || partial;
    if (!el) return false;
    // KPI 標籤 → 高亮整張卡;表格儲存格 → 高亮該列;其他 → 最近的卡片容器
    var box = el.closest("td,th") ? el.closest("tr")
      : el.closest('[class*="stat"],[class*="kpi"],[class*="metric"],.card,section,article') || el;
    box.classList.add(HL_CLASS);
    try { box.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) { box.scrollIntoView(); }
    return true;
  }

  function listScreens() {
    var btns = document.querySelectorAll("[data-i]");
    return Array.prototype.map.call(btns, function (b, i) {
      return { index: Number(b.dataset.i) || i, title: (b.innerText || "").trim().slice(0, 30) };
    });
  }

  function readTables() {
    var out = [];
    document.querySelectorAll("table").forEach(function (t) {
      if (!visible(t)) return;
      var cols = Array.prototype.map.call(t.querySelectorAll("thead th, thead td"), function (x) { return (x.innerText || "").trim(); });
      var rows = Array.prototype.slice.call(t.querySelectorAll("tbody tr"), 0, 40).map(function (tr) {
        return Array.prototype.map.call(tr.children, function (td) { return (td.innerText || "").trim().slice(0, 80); });
      });
      if (rows.length) out.push({ columns: cols, rows: rows });
    });
    return out;
  }

  // ---- 1. 網址參數:#go=n&hl=詞 ----
  function applyHash() {
    var h = location.hash || "";
    var m = h.match(/hl=([^&]+)/);
    if (!m) return;
    var term = "";
    try { term = decodeURIComponent(m[1]); } catch (e) { term = m[1]; }
    // 等畫面切換與圖表渲染完再找(切畫面的 demo 各自監聽 hashchange)
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if (highlight(term) || tries >= 8) clearInterval(timer);
    }, 350);
  }
  window.addEventListener("hashchange", applyHash);
  if (document.readyState === "complete") applyHash();
  else window.addEventListener("load", function () { setTimeout(applyHash, 400); });

  // ---- 2. postMessage 協定(給父視窗的頭像/編排器) ----
  window.addEventListener("message", function (e) {
    var d = e.data || {};
    if (!d || d.jvAgent === undefined) return;
    var reply = { jvAgentReply: d.jvAgent, id: d.id };
    try {
      if (d.jvAgent === "goto") { gotoScreen(d.screen || 0); reply.ok = true; }
      else if (d.jvAgent === "highlight") { reply.ok = highlight(String(d.term || "")); }
      else if (d.jvAgent === "listScreens") { reply.ok = true; reply.screens = listScreens(); }
      else if (d.jvAgent === "readTables") { reply.ok = true; reply.tables = readTables(); }
      else return;
    } catch (err) { reply.ok = false; }
    try { if (e.source && e.source.postMessage) e.source.postMessage(reply, "*"); } catch (err) { }
  });

  // ---- 3. WebMCP(navigator.modelContext)有支援才註冊,失敗靜默 ----
  try {
    var mc = navigator.modelContext;
    if (mc && typeof mc.registerTool === "function") {
      mc.registerTool({ name: "goto_screen", description: "切換到本系統的指定功能畫面(0 起算)",
        inputSchema: { type: "object", properties: { screen: { type: "number" } }, required: ["screen"] },
        execute: function (input) { gotoScreen(input.screen); return { ok: true }; } });
      mc.registerTool({ name: "highlight", description: "把畫面上含指定文字的區塊高亮並捲進視野",
        inputSchema: { type: "object", properties: { term: { type: "string" } }, required: ["term"] },
        execute: function (input) { return { ok: highlight(String(input.term || "")) }; } });
      mc.registerTool({ name: "list_screens", description: "列出本系統的功能畫面",
        inputSchema: { type: "object", properties: {} },
        execute: function () { return { screens: listScreens() }; } });
      mc.registerTool({ name: "read_tables", description: "讀取目前畫面上可見的明細表格",
        inputSchema: { type: "object", properties: {} },
        execute: function () { return { tables: readTables() }; } });
    }
  } catch (e) { }
})();
