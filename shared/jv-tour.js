/**
 * 第一次進來時，帶著客戶把自己的系統走一遍。
 *
 * 客戶按「模板複製」之後，看到的是一套他沒見過的畫面：哪些是可以改的、
 * 資料存在哪裡、要修改要找誰——這些不講他就得自己摸，而多數人摸兩下就走了。
 *
 * 導覽內容不是寫死的：系統叫什麼、管哪些欄位、有幾個畫面，都從這個實例自己的
 * tour.json 與當下的 DOM 讀出來，所以每一套講的都是它自己的事。
 *
 * 只在第一次自動跑（記在 localStorage，一個實例一個鍵）。之後要再看一次，
 * 右下角助理旁邊有一顆「導覽」。
 *
 * 佈署出去的網址上完全不跑——那裡是他要拿給別人看的成品，我們的導覽與
 * 「想改這裡？」都不該出現在上面。只有 /-/i/<編號>/ 這條還在做的路上才有。
 */
(function () {
  "use strict";
  if (window.__jvTour) return;
  /* 嵌在工作台的預覽框裡時不要跑。導覽會把畫面遮起來並自己點導覽列換畫面，
     在一個 800px 寬的預覽框裡那是干擾而不是幫助；而且它會把「第一次看過了」
     記進 localStorage，客戶之後真的進自己的系統時就再也不會看到。 */
  /* jv=embed＝嵌在工作台的預覽框裡；jv=view＝從工作台按「開啟」另開的分頁。
     兩種都是「這個人已經在編輯區了」，不需要再多一個入口——他要改東西，
     左邊那一整欄就是。 */
  if (/[?&]jv=(embed|view)\b/.test(location.search)) return;

  /* 佈署出去的網址上不跑。導覽講的是「這套系統怎麼用、哪裡可以改」——那是
     我們對**這套系統的擁有者**說的話。他按下佈署之後，那個網址是要拿給同事、
     拿給客戶看的成品，右下角掛著我們的導覽等於在他的產品上貼我們的鷹架。

     /-/i/<編號>/ 是「還在做」的那條路，導覽留在那裡就好。 */
  if (!/^\/-\/i\/[a-z0-9_]+\//.test(location.pathname)) return;
  window.__jvTour = true;

  var CDN_JS = "https://cdn.jsdelivr.net/npm/shepherd.js@11.2.0/dist/js/shepherd.min.js";
  var CDN_CSS = "https://cdn.jsdelivr.net/npm/shepherd.js@11.2.0/dist/css/shepherd.css";
  var info = null;
  var seenKey = "jv-tour-" + (location.pathname.match(/\/-\/i\/([a-z0-9_]+)/) || [, location.host])[1];

  function load(url, isCss) {
    return new Promise(function (resolve, reject) {
      var el = isCss ? document.createElement("link") : document.createElement("script");
      if (isCss) { el.rel = "stylesheet"; el.href = url; } else { el.src = url; }
      el.onload = resolve;
      el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  function css() {
    if (document.getElementById("jv-tour-css")) return;
    var st = document.createElement("style");
    st.id = "jv-tour-css";
    /* 蓋掉 Shepherd 的預設樣式，讓它跟客戶自己的系統看起來是一套的。
       用 !important 是因為它的 CSS 在我們之後載入。 */
    st.textContent =
      ".shepherd-element{max-width:340px;border-radius:12px!important;box-shadow:0 18px 50px rgba(15,23,42,.28)!important;font-family:inherit}" +
      ".shepherd-text{font-size:.86rem;line-height:1.7;color:#334155;padding:.9rem 1rem}" +
      ".shepherd-header{background:#f8fafc!important;border-radius:12px 12px 0 0!important;padding:.7rem 1rem!important}" +
      ".shepherd-title{font-size:.92rem!important;font-weight:800!important;color:#0f172a!important}" +
      ".shepherd-footer{padding:.2rem 1rem .9rem}" +
      ".shepherd-button{border-radius:.5rem!important;font-size:.82rem!important;font-weight:700!important;padding:.4rem .95rem!important}" +
      ".shepherd-button:not(.shepherd-button-secondary){background:#1e40af!important;color:#fff!important}" +
      ".shepherd-button-secondary{background:transparent!important;color:#64748b!important}" +
      ".shepherd-modal-overlay-container.shepherd-modal-is-visible{opacity:.55}" +
      "#jvTourBtn{position:fixed;right:20px;bottom:86px;z-index:2147482999;height:34px;padding:0 .8rem;border:1px solid #e2e8f0;border-radius:9999px;background:#fff;color:#334155;font:inherit;font-size:.78rem;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(15,23,42,.14)}" +
      "#jvTourBtn:hover{border-color:#1e40af;color:#1e40af}";
    document.head.appendChild(st);
  }

  var visible = function (el) { return el && el.getClientRects().length > 0; };

  /**
   * 切到看得到資料表的那一個畫面。
   *
   * demo 是一次只顯示一個畫面的，落地時看到的那一頁常常沒有表格——
   * 表在 DOM 裡但沒有版面尺寸，導覽就會把「這裡是你的資料」整步跳過，
   * 而那正是最需要講的一句（實測就是這樣少了兩步）。
   * 所以先逐一點過導覽列，點到看得見表格為止。
   */
  function gotoTable() {
    return new Promise(function (resolve) {
      if (visible(document.querySelector("table[data-jv-bound]"))) return resolve();
      var navs = [].slice.call(document.querySelectorAll("[data-i]"));
      var i = 0;
      (function tryNext() {
        if (visible(document.querySelector("table[data-jv-bound]"))) return resolve();
        if (i >= navs.length) return resolve();   // 找不到就算了，其餘步驟仍然有用
        try { navs[i++].click(); } catch (e) { i += 1; }
        setTimeout(tryNext, 420);
      })();
    });
  }

  /* 找得到才加這一步。導覽指向一個不存在的東西，比沒有導覽更糟——
     Shepherd 會把畫面遮住卻圈不到任何地方。 */
  function step(tour, opts, selector) {
    if (selector) {
      /* 有 before 的步驟先假設它會出現（before 會把畫面切過去），
         沒有的就當場判斷看不看得到。 */
      if (!opts.before && !visible(document.querySelector(selector))) return;
      opts.attachTo = { element: selector, on: opts.on || "bottom" };
      if (opts.before) {
        var run = opts.before;
        delete opts.before;
        opts.beforeShowPromise = function () { return run(); };
      }
    }
    delete opts.on;
    opts.buttons = opts.buttons || [
      { text: "上一步", classes: "shepherd-button-secondary", action: function () { tour.back(); } },
      { text: "下一步", action: function () { tour.next(); } },
    ];
    tour.addStep(opts);
  }

  function build() {
    var Tour = window.Shepherd.Tour;
    var tour = new Tour({
      useModalOverlay: true,
      defaultStepOptions: { scrollTo: { behavior: "smooth", block: "center" }, cancelIcon: { enabled: true } },
    });

    var liveFields = [];
    var name = (info && info.title) || document.title.split(/[·|｜]/)[0].trim();
    var fields = (info && info.fields) || [];
    var tables = (info && info.tables) || 0;

    /* 第一步不指向任何元素：先講「這是什麼、你可以拿它做什麼」。 */
    tour.addStep({
      title: "這是你的《" + name + "》",
      text: "<p>這是完整複製給你的一套系統，資料存在你自己的資料庫裡——輸入的東西重新整理後還在，同事也看得到。</p>"
        + (info && info.description ? "<p style='margin-top:.5rem;color:#64748b'>" + info.description + "</p>" : "")
        + "<p style='margin-top:.5rem'>花一分鐘看完，你就知道哪些地方可以改。</p>",
      buttons: [
        { text: "不用了", classes: "shepherd-button-secondary", action: function () { tour.cancel(); } },
        { text: "開始", action: function () { tour.next(); } },
      ],
    });

    step(tour, {
      title: "左邊是流程步驟",
      text: "這套系統分成幾個畫面，照實際的作業順序排。點一下就切換。",
      on: "right",
    }, "[data-i]");

    /* 欄位名稱要讀「當下的」，不是開通當時的快照。客戶可能已經用助理改過名字、
       加過欄位——導覽照著舊快照唸，第一句話就跟他眼前的畫面對不上。 */
    step(tour, {
      before: function () {
        return gotoTable().then(function () {
          var t = document.querySelector("table[data-jv-bound][data-jv-table]");
          if (!t) return;
          return fetch("./_jv/schema", { cache: "no-store" })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (sc) {
              if (!sc) return;
              var def = (sc.tables || []).filter(function (x) { return x.name === t.dataset.jvTable; })[0];
              if (def) liveFields = def.columns.map(function (c) { return c.label; });
            })
            .catch(function () {});
        });
      },
      title: "這裡是你的資料",
      text: function () {
        var f = liveFields.length ? liveFields : fields;
        return f.length
          ? "這張表管的是：<b>" + f.slice(0, 6).join("、") + "</b>。<p style='margin-top:.5rem;color:#64748b'>"
            + "這些欄位都可以增減或改名——等一下告訴你怎麼改。</p>"
          : "表格裡的資料是真的存在資料庫裡的，不是畫面上的假資料。";
      },
      on: "top",
    }, "table[data-jv-bound]");

    step(tour, {
      before: gotoTable,
      title: "新增一筆試試",
      text: "按這裡會跳出表單，填完就存進資料庫。每一列右邊也有編輯與刪除。",
      on: "left",
      /* 只認工具條上那顆「＋ 新增」。原本退而求其次寫了 button，
         那會圈到畫面上任何一顆按鈕，指錯地方比不指更糟。 */
    }, "[data-jv-toolbar] button, table[data-jv-bound]");

    step(tour, {
      title: "想改什麼，直接跟它說",
      text: "<p>這顆是修改助理。用講的就行：</p>"
        + "<ul style='margin:.4rem 0 0 1rem;color:#64748b'>"
        + "<li>「加一個備註欄位」</li><li>「把負責人改叫業務窗口」</li>"
        + "<li>「加一個只看高風險的篩選按鈕」</li><li>「介面改成深色」</li></ul>"
        + "<p style='margin-top:.5rem'>欄位當場就改好；動到程式的要等幾分鐘。改壞了說「還原」就退回去。</p>",
      on: "left",
      buttons: [
        { text: "上一步", classes: "shepherd-button-secondary", action: function () { tour.back(); } },
        { text: "知道了", action: function () { tour.next(); } },
      ],
    }, "#jvAsstBtn");

    tour.addStep({
      title: "就這樣",
      text: "<p>這套系統從現在起是你的：資料你自己的、要怎麼改你說了算。</p>"
        + "<p style='margin-top:.5rem;color:#64748b'>想再看一次導覽，右下角有一顆「導覽」。</p>"
        + (tables > 1 ? "<p style='margin-top:.5rem;color:#64748b'>另外還有 " + (tables - 1) + " 張表在其他畫面裡。</p>" : ""),
      buttons: [{ text: "開始使用", action: function () { tour.complete(); } }],
    });

    /* 看完或中途關掉都算看過。硬要人看完才記住，只會讓他每次進來都被擋一次。 */
    ["complete", "cancel"].forEach(function (ev) {
      tour.on(ev, function () { try { localStorage.setItem(seenKey, "1"); } catch (e) { /* 私密視窗 */ } });
    });
    return tour;
  }

  function mountButton() {
    if (document.getElementById("jvTourBtn")) return;
    var b = document.createElement("button");
    b.id = "jvTourBtn";
    b.type = "button";
    b.textContent = "導覽";
    b.addEventListener("click", function (e) { e.stopPropagation(); start(); });
    document.body.appendChild(b);
  }

  /* 等某個選擇器出現。每 300ms 看一次——比監聽 DOM 變動簡單，而且這裡只等一次。 */
  function waitForTable(maxMs) {
    return new Promise(function (resolve) {
      var t0 = Date.now();
      (function poll() {
        if (document.querySelector("table[data-jv-bound]")) return resolve();
        if (Date.now() - t0 > maxMs) return resolve();
        setTimeout(poll, 300);
      })();
    });
  }

  var starting = false;
  function start() {
    if (starting) return;
    starting = true;
    css();
    Promise.all([
      window.Shepherd ? Promise.resolve() : load(CDN_JS, false),
      document.querySelector('link[href*="shepherd"]') ? Promise.resolve() : load(CDN_CSS, true),
    ])
      .then(function () { css(); build().start(); starting = false; })
      .catch(function () { starting = false; /* 載不到就算了，導覽是加分項 */ });
  }

  window.JVTour = { start: start };

  function boot() {
    mountButton();
    fetch("./_jv/tour.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { info = d; })
      .catch(function () {})
      .then(function () {
        var seen = false;
        try { seen = localStorage.getItem(seenKey) === "1"; } catch (e) { seen = false; }
        if (seen) return;
        /* 等資料表真的綁上再開始。固定等 2.2 秒不夠——實測那一步被跳過了，
           而「這裡是你的資料」正是整個導覽最需要講的一句。
           改成輪詢等它出現，最多等 10 秒；等不到就照樣開始（那套 demo 可能
           本來就沒有可綁的表，其餘幾步仍然有用）。 */
        waitForTable(10000).then(start);
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
