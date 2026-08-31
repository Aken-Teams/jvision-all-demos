/**
 * 客戶實例的 live runtime：把 demo 畫面上的靜態表格接上真的資料庫。
 *
 * 只注入到 var/instances/<id>/public/ 的副本，**永遠不碰 demos/**——那是目錄
 * 展示品，由 static-gate 保證單檔自足。這條界線寫在 DECISIONS.md。
 *
 * 四層降級，保證一定交付得出東西：
 *   1 讀 ./_jv/schema 拿到表定義
 *   2 靜態表格：用 selector 找到 <table>，重建 <tbody> 並加工具條
 *   3 JS 渲染的表：等原本的 JS 畫完再接手（MutationObserver），原 JS 完全不動
 *   4 綁不到：在最後追加一個自建面板
 * runtime 永遠不依賴 demo 的 DOM 成功；綁得到是加分，綁不到也還是能用。
 *
 * 樣式只用 demo 本來就有的 CSS 變數（--blue/--ink/--line/--muted…），
 * 所以在 1,878 套裡都長得像原生的——那是 demo-forge 的調色盤契約帶來的紅利。
 */
(function () {
  "use strict";
  var API = "./api/t/";
  var state = { schema: null, bound: [] , everNative: {} };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "style") n.style.cssText = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function api(path, opts) {
    return fetch(path, Object.assign({ headers: { "content-type": "application/json" } }, opts))
      .then(function (r) { return r.json().then(function (d) { return r.ok ? d : Promise.reject(d); }); });
  }

  /* ── 表格接管 ─────────────────────────────────────── */

  /**
   * 找出這個定義對應的 <table>。
   *
   * selector 只是提示，不是依據：很多 demo 的畫面是用 innerHTML 樣板字串建出來的，
   * 原始碼裡的 class 在真正的 DOM 上可能根本不存在（實測 maintenance 就是這樣，
   * 原始碼寫 table.tbl，畫面上那張表沒有任何 class）。
   * 真正可靠的身分是**表頭文字**——那是這張表在講什麼，跟怎麼被建出來無關。
   */
  function findTable(def) {
    if (def.selector) {
      var hit = null;
      try { hit = document.querySelector(def.selector); } catch (e) { /* 選擇器可能不合法 */ }
      if (hit && hit.tagName === "TABLE" && !hit.dataset.jvBound) return { table: hit, offset: 0 };
    }
    var want = def.columns.map(function (c) { return c.label; });
    var tables = document.querySelectorAll("table");
    for (var i = 0; i < tables.length; i++) {
      if (tables[i].dataset.jvBound) continue;
      var ths = tables[i].querySelectorAll("th");
      if (ths.length < want.length) continue;
      var got = [];
      for (var j = 0; j < ths.length; j++) got.push((ths[j].textContent || "").replace(/\s+/g, " ").trim());
      /* 只拿「有字的表頭」去比對，空白的一律視為裝飾欄。
         demo 裡的空 <th> 有兩種：開頭的 checkbox／圖示欄，以及夾在中間的
         箭頭或分隔欄（實測 secs-gem 那套就在「來源變數」與「目標欄位」之間
         夾了一個空欄，害整串比不上）。兩種都只是版面，不是資料。
         比中之後把每一欄實際落在第幾格記下來（slots），畫資料列時照著放，
         否則整排會左移而每個值都填到隔壁欄——比接不上還糟。 */
      var solid = [];
      for (var g = 0; g < got.length; g++) if (got[g] !== "") solid.push({ text: got[g], at: g });
      if (solid.length < want.length) continue;
      for (var off = 0; off + want.length <= solid.length; off++) {
        var same = true;
        for (var k = 0; k < want.length; k++) if (solid[off + k].text !== want[k]) { same = false; break; }
        if (!same) continue;
        var slots = [];
        for (var k2 = 0; k2 < want.length; k2++) slots.push(solid[off + k2].at);
        return { table: tables[i], offset: slots[0], slots: slots, headCount: got.length };
      }
    }
    return null;
  }

  function bindTable(def) {
    var found = findTable(def);
    if (!found) return false;
    var table = found.table;
    if (table.dataset.jvBound) return true;
    table.dataset.jvBound = "1";

    /* 標上是哪一張表。驗收與除錯時要分辨「這張綁的是哪個 def」，
       只看 data-jv-bound 是分不出來的。 */
    table.dataset.jvTable = def.name;
    state.everNative[def.name] = true;

    var tbody = table.querySelector("tbody") || table.appendChild(document.createElement("tbody"));
    var toolbar = buildToolbar(def, table);
    table.parentNode.insertBefore(toolbar, table);

    var ctx = { def: def, table: table, tbody: tbody, q: "", rows: [],
      offset: found.offset || 0, slots: found.slots || null,
      headCount: found.headCount || (def.columns.length + 1) };
    state.bound.push(ctx);
    reload(ctx);
    /* 這張表的退路面板可以收了——真正的畫面出現之後，多一塊重複的面板只會讓人困惑。 */
    var spare = document.querySelector('[data-jv-fallback-for="' + def.name + '"]');
    if (spare) {
      state.bound = state.bound.filter(function (c) { return !spare.contains(c.table); });
      spare.remove();
    }
    return true;
  }

  function buildToolbar(def, table) {
    var search = el("input", { type: "search", placeholder: "搜尋…",
      style: "flex:1;min-width:120px;padding:6px 12px;border:1px solid var(--line,#e2e8f0);border-radius:8px;font:inherit;font-size:13px" });
    var add = el("button", { type: "button", text: "＋ 新增",
      style: "padding:6px 14px;border:0;border-radius:8px;background:var(--blue,#1e40af);color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer" });
    /* 加一個標記，導覽才有辦法穩定地指到這一列（用 class 或位置去猜，
       demo 換了版面就會指錯地方）。 */
    var bar = el("div", { "data-jv-toolbar": "1",
      style: "display:flex;gap:8px;align-items:center;margin:0 0 10px;flex-wrap:wrap" }, [search, add]);

    var ctxOf = function () { return state.bound.filter(function (c) { return c.table === table; })[0]; };
    var timer;
    search.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { var c = ctxOf(); if (c) { c.q = search.value.trim(); reload(c); } }, 250);
    });
    add.addEventListener("click", function () { openForm(ctxOf(), null); });
    return bar;
  }

  function reload(ctx) {
    var url = API + ctx.def.name + "?limit=100" + (ctx.q ? "&q=" + encodeURIComponent(ctx.q) : "");
    return api(url).then(function (d) {
      ctx.rows = d.rows || [];
      render(ctx, d.total);
    }).catch(function () {
      ctx.tbody.innerHTML = "";
      ctx.tbody.appendChild(el("tr", {}, [el("td", { colspan: String(fullSpan(ctx)),
        style: "padding:18px;text-align:center;color:var(--muted,#64748b)", text: "資料載入失敗，請重新整理" })]));
    });
  }

  /* 空狀態那一列要跨滿整張表，包含裝飾欄與尾端的操作欄。 */
  function fullSpan(ctx) {
    if (ctx.slots && ctx.slots.length) return ctx.slots[ctx.slots.length - 1] + 2;
    return (ctx.offset || 0) + ctx.def.columns.length + 1;
  }

  function render(ctx, total) {
    var cols = ctx.def.columns;
    /* 表頭補一欄放操作鈕。只補一次——重新載入資料不該一直長出新欄。 */
    var headRow = ctx.table.querySelector("thead tr");
    if (headRow && !headRow.dataset.jvActions) {
      headRow.dataset.jvActions = "1";
      headRow.appendChild(el("th", { text: "", style: "width:70px" }));
    }

    ctx.tbody.innerHTML = "";
    if (!ctx.rows.length) {
      ctx.tbody.appendChild(el("tr", {}, [el("td", { colspan: String(fullSpan(ctx)),
        style: "padding:24px;text-align:center;color:var(--muted,#64748b)",
        text: ctx.q ? "找不到符合的資料" : "還沒有資料，按上面的「＋ 新增」開始" })]));
      return;
    }

    ctx.rows.forEach(function (row) {
      var tr = el("tr", {});
      if (ctx.slots && ctx.slots.length === cols.length) {
        /* 照表頭實際的格位填。裝飾欄補一個空 td，值才會落在對的那一欄。 */
        var at = 0;
        for (var ci = 0; ci < cols.length; ci++) {
          while (at < ctx.slots[ci]) { tr.appendChild(el("td", { text: "" })); at++; }
          tr.appendChild(el("td", { text: row[cols[ci].key] == null ? "" : String(row[cols[ci].key]) }));
          at++;
        }
      } else {
        for (var o = 0; o < (ctx.offset || 0); o++) tr.appendChild(el("td", { text: "" }));
        cols.forEach(function (c) { tr.appendChild(el("td", { text: row[c.key] == null ? "" : String(row[c.key]) })); });
      }

      var edit = el("button", { type: "button", title: "編輯", text: "✎",
        style: "border:0;background:none;cursor:pointer;color:var(--muted,#64748b);font-size:15px;padding:2px 5px" });
      var del = el("button", { type: "button", title: "刪除", text: "✕",
        style: "border:0;background:none;cursor:pointer;color:var(--muted,#64748b);font-size:15px;padding:2px 5px" });
      edit.addEventListener("click", function () { openForm(ctx, row); });
      del.addEventListener("click", function () {
        if (!confirm("確定刪除這一筆？")) return;
        api(API + ctx.def.name + "/" + row._id, { method: "DELETE" }).then(function () { reload(ctx); });
      });
      tr.appendChild(el("td", { style: "white-space:nowrap" }, [edit, del]));
      ctx.tbody.appendChild(tr);
    });

    if (typeof total === "number" && total > ctx.rows.length) {
      ctx.tbody.appendChild(el("tr", {}, [el("td", { colspan: String(fullSpan(ctx)),
        style: "padding:10px;text-align:center;color:var(--muted,#64748b);font-size:12px",
        text: "共 " + total + " 筆，目前顯示前 " + ctx.rows.length + " 筆" })]));
    }
  }

  /* ── 新增／編輯表單 ───────────────────────────────── */
  /* 依欄位型別給對應的輸入框。讓瀏覽器先擋住明顯填錯的值，比讓人送出去才
     被伺服器退回好——退回的訊息再清楚，也已經是白填了一次。
     percent 不用 number：畫面上的示範值就是「96%」那種寫法，用 number
     會讓那個百分號打不進去。 */
  function inputAttrs(type) {
    if (type === "int") return { type: "number", step: "1", inputmode: "numeric" };
    if (type === "number") return { type: "number", step: "any", inputmode: "decimal" };
    if (type === "date") return { type: "date" };
    if (type === "percent") return { type: "text", inputmode: "decimal", placeholder: "例如 96 或 96%" };
    return { type: "text" };
  }

  function openForm(ctx, row) {
    if (!ctx) return;
    var isEdit = !!row;
    var inputs = {};
    var fields = ctx.def.columns.map(function (c) {
      var attrs = inputAttrs(c.type);
      attrs.value = row && row[c.key] != null ? String(row[c.key]) : "";
      attrs.style = "width:100%;padding:7px 10px;border:1px solid var(--line,#e2e8f0);border-radius:8px;font:inherit;font-size:13px;margin-top:3px";
      var input = el("input", attrs);
      inputs[c.key] = input;
      return el("label", { style: "display:block;margin-bottom:11px" },
        [el("span", { text: c.label, style: "font-size:12px;font-weight:700;color:var(--muted,#64748b)" }), input]);
    });

    var msg = el("p", { style: "margin:0;font-size:12px;color:#dc2626;min-height:16px" });
    var save = el("button", { type: "submit", text: isEdit ? "儲存" : "新增",
      style: "padding:8px 18px;border:0;border-radius:8px;background:var(--blue,#1e40af);color:#fff;font:inherit;font-weight:700;cursor:pointer" });
    var cancel = el("button", { type: "button", text: "取消",
      style: "padding:8px 18px;border:1px solid var(--line,#e2e8f0);border-radius:8px;background:#fff;font:inherit;cursor:pointer" });

    var form = el("form", { style: "background:#fff;border-radius:14px;padding:22px;max-width:440px;width:92%;max-height:86vh;overflow:auto" },
      [el("h3", { text: (isEdit ? "編輯" : "新增") + (ctx.def.title || ""), style: "margin:0 0 16px;font-size:16px;color:var(--ink,#0f1e46)" })]
        .concat(fields)
        .concat([msg, el("div", { style: "display:flex;gap:9px;justify-content:flex-end;margin-top:14px" }, [cancel, save])]));

    var overlay = el("div", { style: "position:fixed;inset:0;background:rgba(15,23,42,.45);display:grid;place-items:center;z-index:9999" }, [form]);
    document.body.appendChild(overlay);
    var close = function () { overlay.remove(); };
    cancel.addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      save.disabled = true;
      msg.textContent = "";
      var body = {};
      Object.keys(inputs).forEach(function (k) { body[k] = inputs[k].value; });
      var req = isEdit
        ? api(API + ctx.def.name + "/" + row._id, { method: "PATCH", body: JSON.stringify(Object.assign({ rev: row.rev }, body)) })
        : api(API + ctx.def.name, { method: "POST", body: JSON.stringify(body) });
      req.then(function () { close(); reload(ctx); })
        .catch(function (err) {
          save.disabled = false;
          /* 409 是「別人先改了」。這裡要講人話，不是丟錯誤碼——
             使用者需要知道「重新載入就會看到最新的」。 */
          msg.textContent = (err && err.error) || "儲存失敗，請再試一次";
        });
    });
    (fields[0] && fields[0].querySelector("input") || save).focus();
  }

  /* ── 綁不到表格時的退路 ───────────────────────────── */
  function fallbackPanel(defs) {
    var host = el("section", { style: "max-width:1100px;margin:26px auto;padding:0 18px" });
    defs.forEach(function (def) {
      var table = el("table", { style: "width:100%;border-collapse:collapse;font-size:13px" }, [
        el("thead", {}, [el("tr", {}, def.columns.map(function (c) {
          return el("th", { text: c.label, style: "text-align:left;padding:8px;border-bottom:2px solid var(--line,#e2e8f0);font-size:12px;color:var(--muted,#64748b)" });
        }))]),
        el("tbody", {}),
      ]);
      var card = el("div", { style: "background:#fff;border:1px solid var(--line,#e2e8f0);border-radius:14px;padding:18px;margin-bottom:16px" },
        [el("h2", { text: def.title || def.name, style: "margin:0 0 12px;font-size:15px;color:var(--ink,#0f1e46)" })]);
      card.appendChild(buildToolbar(def, table));
      card.appendChild(table);
      host.appendChild(card);
      table.dataset.jvBound = "1";
      card.dataset.jvFallbackFor = def.name;
      var ctx = { def: def, table: table, tbody: table.querySelector("tbody"), q: "", rows: [], fallback: true };
      state.bound.push(ctx);
      reload(ctx);
    });
    document.body.appendChild(host);
  }

  /* ── 啟動 ─────────────────────────────────────────── */
  function start() {
    api("./_jv/schema").then(function (schema) {
      state.schema = schema;
      schema.tables.forEach(function (def) { bindTable(def); });

      /* 還綁不到的多半是 JS 渲染的表——原本的 JS 還沒把 <table> 畫出來。
         等它畫完再接手，不需要理解它做了什麼。3 秒後仍然沒有就走退路。 */
      /* 觀察者**不設終點**，而且會自我修復。兩個實測發現的行為：
         一、demo 的表通常在對應的畫面被點開時才由 JS 建出來，使用者可能過了
             十分鐘才切過去，提早放棄那張表就永遠接不上；
         二、有些 demo 切畫面時會重建整塊 DOM，把我們加的退路面板一起清掉
             （production-scheduler 就是這樣，點過導覽之後面板消失）。
         所以每次 DOM 有變動都重新確認一次：能接管就接管，接不到而面板也不在了
         就把面板補回去。節流避免在 demo 大量重繪時空轉。 */
      var settle;
      function sweep() {
        /* 每次都對「全部」的表重新確認，不維護一份會過期的待辦清單。
           關鍵在 isConnected：綁過不等於還在——demo 重建畫面時會把已經接管的
           表格連同我們的面板一起丟掉，那時候必須重新接上，否則那張表就永遠
           消失在使用者眼前。 */
        state.bound = state.bound.filter(function (c) { return c.table.isConnected; });
        var cur = {};
        state.bound.forEach(function (c) { cur[c.def.name] = c; });

        var missing = [];
        schema.tables.forEach(function (def) {
          var c = cur[def.name];
          if (c && !c.fallback) return;      // 已經接管原生畫面，最好的狀態
          /* 退路面板只是暫代。每次巡檢都再試一次原生——使用者切到那一頁時
             那張表才會出現，接上之後 bindTable 會順手把面板收掉。 */
          if (bindTable(def)) return;
          if (c) return;                     // 原生還沒出現，至少退路還在用
          /* 這張表在別的畫面上有自己的家——現在只是沒被切到，不是接不上。
             為它長一塊退路面板，等於在每一頁都掛著一份重複的資料，
             使用者會以為系統多了一塊他沒看過的東西。切回去就會原生接上。 */
          if (state.everNative[def.name]) return;
          if (!document.querySelector('[data-jv-fallback-for="' + def.name + '"]')) missing.push(def);
        });
        if (missing.length) fallbackPanel(missing);
      }
      var obs = new MutationObserver(function () {
        clearTimeout(settle);
        settle = setTimeout(sweep, 400);
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(sweep, 2500);
    }).catch(function () { /* 拿不到 schema 就什麼都不做，畫面維持原樣 */ });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
