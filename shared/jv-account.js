/**
 * 右上角的帳號選單：顯示現在是誰，點開看得到個人資訊、自己的系統與需求單。
 *
 * 做成自我掛載的共用腳本而不是逐頁貼一份 HTML：站上每一頁的頁首結構都不太一樣
 * （有的用 rounded-full 按鈕、有的用純文字連結），逐頁維護一定會有頁面漏改。
 * 這支會先找頁首右側那一叢按鈕把自己插進去，找不到才退成固定定位。
 *
 * 沒登入時顯示「登入」；問不到身分就整顆不顯示——頁首缺一顆按鈕是小事，
 * 讓每一頁都因為它而壞掉不是。
 */
(function () {
  "use strict";
  if (window.__jvAccount) return;
  window.__jvAccount = true;

  var me = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function css() {
    if (document.getElementById("jv-account-css")) return;
    var st = document.createElement("style");
    st.id = "jv-account-css";
    st.textContent =
      "#jvAcct{position:relative;display:inline-flex}" +
      "#jvAcctBtn{display:inline-flex;align-items:center;gap:.5rem;height:36px;padding:0 .5rem 0 .35rem;border:1px solid #e2e8f0;background:#fff;border-radius:9999px;cursor:pointer;font:inherit;transition:border-color .15s}" +
      "#jvAcctBtn:hover{border-color:#1e40af}" +
      "#jvAcctBtn .av{width:26px;height:26px;border-radius:9999px;display:grid;place-content:center;background:linear-gradient(135deg,#1e40af,#7c3aed);color:#fff;font-size:.74rem;font-weight:800;flex:none;line-height:1;letter-spacing:.02em;font-family:Inter,\"Noto Sans TC\",system-ui,sans-serif;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2),0 1px 2px rgba(15,23,42,.2)}" +
      "#jvAcctBtn:focus-visible{outline:2px solid #1e40af;outline-offset:2px}" +
      "#jvAcctBtn .nm{font-size:.8rem;font-weight:700;color:#0f172a;max-width:8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      /* 手機只剩頭像。pill 的外框加上圓形頭像會變成兩層同心圓，很瑣碎；而且 pill
         的左右 padding 不等（.35rem / .5rem），26px 的圓還會偏一邊。
         直接讓頭像本身就是按鈕：單一實心圓，觸控區用 :before 補到 40px。 */
      "@media (max-width:640px){"+
        "#jvAcctBtn .nm{display:none}"+
        "#jvAcctBtn{width:30px;height:30px;padding:0;border:0;background:none;justify-content:center;position:relative}"+
        "#jvAcctBtn:hover{border:0}"+
        "#jvAcctBtn .av{width:30px;height:30px;font-size:.8rem}"+
        "#jvAcctBtn::before{content:\"\";position:absolute;inset:-7px;border-radius:9999px}"+
      "}" +
      "#jvAcctPanel{position:absolute;top:calc(100% + .5rem);right:0;width:19rem;max-width:calc(100vw - 2rem);background:#fff;border:1px solid #e2e8f0;border-radius:.9rem;box-shadow:0 16px 44px rgba(15,23,42,.16);z-index:80;overflow:hidden}" +
      /* 手機上這顆按鈕在漢堡鈕左邊，離右緣還有一段距離；面板若照樣對齊按鈕右緣，
         左半邊會被推出畫面外（實測 390px 時 left:-48）。窄螢幕改成貼著視窗左右
         內縮，與手機抽屜選單的 top-14 對齊。 */
      /* 手機：面板底下的內容（我的系統／需求單）筆數是會長的，基底規則是 overflow:hidden
         又沒有 max-height，超出畫面就會被無聲切掉而且捲不動。dvh 是為了行動瀏覽器
         的網址列縮放；先寫 vh 當不支援時的退路。overflow-x 保持 hidden 讓圓角照樣裁切。 */
      /* 手機：改成從頁首垂下來的面板。上緣貼齊頁首所以不留圓角，圓角只在下方——
         這樣它讀起來是「從頁首拉出來的」，而不是浮在半空的一張卡。
         內容筆數會長，基底是 overflow:hidden 又沒有 max-height，超出畫面就會被
         無聲切掉而且捲不動；dvh 是為了行動瀏覽器的網址列縮放，先寫 vh 當退路。 */
      "@media (max-width:640px){#jvAcctPanel{position:fixed;top:56px;left:0;right:0;width:auto;max-width:none;border-radius:0 0 1.15rem 1.15rem;border-left:0;border-right:0;border-top:0;max-height:calc(100vh - 56px);max-height:calc(100dvh - 56px);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;animation:jvAcctDown .28s cubic-bezier(.22,.9,.3,1)}}" +
      /* 由上往下展開。用 clip-path 而不是位移整塊：位移會讓面板短暫蓋到頁首上方，
         clip-path 是「從上緣往下揭開」，看起來就是從頁首底下長出來的。 */
      "@keyframes jvAcctDown{from{clip-path:inset(0 0 100% 0);transform:translateY(-6px);opacity:.5}"+"to{clip-path:inset(0 0 0 0);transform:none;opacity:1}}" +
      "@media (prefers-reduced-motion:reduce){#jvAcctPanel{animation:none}}" +
      /* 這顆是被 JS 插進 nav 的第三個 flex 子元素，而 nav 是 justify-between——
         三個子元素就被平均分開，W 剛好卡在正中間，兩側各留一大塊空白。
         margin-left:auto 把剩餘空間全部收到它左邊，W 就貼回漢堡鈕旁邊。 */
      "@media (max-width:640px){#jvAcct{margin-left:auto;margin-right:-.625rem}}" +
      "#jvAcctPanel .hd{padding:.9rem 1rem;border-bottom:1px solid #f1f5f9;display:flex;gap:.7rem;align-items:center}" +
      "#jvAcctPanel .hd .av{width:38px;height:38px;border-radius:9999px;display:grid;place-content:center;background:linear-gradient(135deg,#1e40af,#7c3aed);color:#fff;font-size:.95rem;font-weight:800;flex:none}" +
      "#jvAcctPanel .nm2{font-size:.88rem;font-weight:800;color:#0f172a;line-height:1.25}" +
      "#jvAcctPanel .em{font-size:.74rem;color:#64748b;word-break:break-all;line-height:1.3;margin-top:.1rem}" +
      /* 身分標籤移到姓名同一列的最右邊。原本掛在信箱下方另起一行，讓標頭多佔一行
         高度，而且它是「這個人是誰」的屬性，跟姓名同列才讀得成一句。 */
      "#jvAcctPanel .who{flex:1;min-width:0}" +
      "#jvAcctPanel .line{display:flex;align-items:center;gap:.5rem}" +
      "#jvAcctPanel .line .nm2{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      "#jvAcctPanel .tag{flex:none;display:inline-block;font-size:.66rem;font-weight:800;padding:.1rem .45rem;border-radius:9999px;background:#eef2ff;color:#3730a3;white-space:nowrap}" +
      "#jvAcctPanel .sec{padding:.6rem 1rem .7rem;border-bottom:1px solid #f1f5f9}" +
      "#jvAcctPanel .sys{padding:.55rem .5rem .6rem}" +
      "#jvAcctPanel .sys .lbl{padding:0 .5rem}" +
      /* 整列可點：高度約 40px，遠大於原本那個只有「開啟」兩字的觸控目標 */
      "#jvAcctPanel .sysrow{display:flex;align-items:center;gap:.5rem;padding:.5rem;border-radius:.5rem;text-decoration:none;color:#0f172a;font-size:.84rem;font-weight:700}" +
      "#jvAcctPanel .sysrow:hover{background:#f1f5f9}" +
      "#jvAcctPanel .sysrow .t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      "#jvAcctPanel .sysrow .go{color:#94a3b8;font-size:1.05rem;flex:none}" +
      "#jvAcctPanel .sysrow.off{color:#94a3b8;font-weight:600}" +
      "#jvAcctPanel .sysrow .st{font-size:.72rem;color:#94a3b8;flex:none}" +
      "#jvAcctPanel .sum{display:flex;align-items:center;flex-wrap:wrap;gap:.4rem;padding:.55rem 1rem .65rem;border-bottom:1px solid #f1f5f9;font-size:.74rem;color:#475569;text-decoration:none;font-weight:700}" +
      "#jvAcctPanel .sum:hover{background:#f8fafc}" +
      "#jvAcctPanel .sum .dot{width:3px;height:3px;border-radius:9999px;background:#cbd5e1;display:inline-block}" +
      "#jvAcctPanel .sum .more{margin-left:auto;color:#1e40af}" +
      "#jvAcctPanel .lbl{font-size:.68rem;font-weight:800;color:#94a3b8;letter-spacing:.06em;margin-bottom:.4rem}" +
      "#jvAcctPanel .row{display:flex;align-items:center;justify-content:space-between;gap:.6rem;font-size:.8rem;padding:.22rem 0}" +
      "#jvAcctPanel .row a{color:#1e40af;font-weight:700;text-decoration:none}" +
      "#jvAcctPanel .row a:hover{text-decoration:underline}" +
      "#jvAcctPanel .muted{color:#94a3b8;font-size:.76rem;padding:.15rem 0}" +
      "#jvAcctPanel .num{font-weight:800;color:#0f172a}" +
      "#jvAcctPanel .acts{padding:.4rem}" +
      "#jvAcctPanel .acts a,#jvAcctPanel .acts button{display:flex;width:100%;align-items:center;gap:.55rem;padding:.5rem .6rem;border-radius:.5rem;font-size:.82rem;font-weight:700;color:#0f172a;background:none;border:0;cursor:pointer;text-align:left;text-decoration:none;font-family:inherit}" +
      "#jvAcctPanel .acts a:hover,#jvAcctPanel .acts button:hover{background:#f8fafc}" +
      "#jvAcctPanel .acts .danger{color:#b91c1c}" +
      "#jvAcctPanel .ico{font-size:18px;color:#64748b}";
    document.head.appendChild(st);
  }

  function fmtNum(n) { return (Number(n) || 0).toLocaleString("en-US"); }
  /* 位元組給人看。KB/MB 級距的小數點沒有意義，到 GB 才留一位。 */
  function fmtBytes(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + " B";
    if (n < 1048576) return Math.round(n / 1024) + " KB";
    if (n < 1073741824) return Math.round(n / 1048576) + " MB";
    return (n / 1073741824).toFixed(1) + " GB";
  }

  function initial(m) {
    var s = (m.name || m.email || "?").trim();
    return s.charAt(0).toUpperCase();
  }

  const shown = (el) => !!el && el.getClientRects().length > 0;

  /* 這顆該掛在哪裡，要看當下哪一叢是真的看得見的。
     桌機的頁首右側叢集在 768px 以下是 hidden md:flex——直接掛進去，手機上就
     整顆消失（實測 390px 時首頁／目錄／許願池都看不到）。所以按順序挑：
     桌機叢集 → 手機的漢堡鈕旁邊 → 都沒有就自己釘右上角。 */
  function slot() {
    var a = document.querySelector('nav a[href*="wish"]');
    if (a && shown(a.parentElement)) return { host: a.parentElement, before: null };
    var burger = document.querySelector("nav button.md\\:hidden, header button.md\\:hidden");
    if (shown(burger)) return { host: burger.parentElement, before: burger };
    return null;
  }

  /* 轉螢幕方向或縮放視窗時該掛的位置會變。搬動節點不會掉事件監聽，
     所以直接搬比重建安全。 */
  function place(box) {
    var s = slot();
    if (!s) {
      if (box.dataset.jvFixed === "1") return;
      box.dataset.jvFixed = "1";
      box.style.cssText = "position:fixed;top:.9rem;right:1rem;z-index:70";
      document.body.appendChild(box);
      return;
    }
    box.dataset.jvFixed = "0";
    box.style.cssText = "";
    if (s.before) { if (box.nextSibling !== s.before || box.parentElement !== s.host) s.host.insertBefore(box, s.before); }
    else if (box.parentElement !== s.host || box.nextSibling) s.host.appendChild(box);
  }

  function mount() {
    if (document.getElementById("jvAcct")) return;
    css();
    var box = document.createElement("div");
    box.id = "jvAcct";
    place(box);
    render(box);
    var t = null;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(function () { place(box); }, 150); });
  }

  function render(box) {
    if (!me) { box.innerHTML = ""; return; }
    if (!me.signedIn) {
      box.innerHTML = '<a id="jvAcctBtn" href="/api/visitor/google/start?next=' +
        encodeURIComponent(location.pathname + location.search) +
        '" style="text-decoration:none"><span class="av">→</span><span class="nm">登入</span></a>';
      return;
    }
    box.innerHTML =
      '<button type="button" id="jvAcctBtn" aria-haspopup="true" aria-expanded="false">' +
        '<span class="av">' + esc(initial(me)) + '</span>' +
        '<span class="nm">' + esc(me.name || me.email) + '</span>' +
      "</button>";
    box.querySelector("#jvAcctBtn").addEventListener("click", function (e) {
      e.stopPropagation();
      toggle(box);
    });
  }

  function toggle(box) {
    var open = box.querySelector("#jvAcctPanel");
    var btn = box.querySelector("#jvAcctBtn");
    if (open) { open.remove(); btn.setAttribute("aria-expanded", "false"); return; }
    btn.setAttribute("aria-expanded", "true");

    var panel = document.createElement("div");
    panel.id = "jvAcctPanel";
    panel.innerHTML =
      '<div class="hd"><span class="av">' + esc(initial(me)) + '</span><div class="who">' +
        '<div class="line"><div class="nm2">' + esc(me.name || "（未提供姓名）") + "</div>" +
        '<span class="tag">' + (me.admin ? "管理者" : me.kind === "google" ? "Google 帳號" : "訪客") + "</span></div>" +
        '<div class="em">' + esc(me.email) + "</div>" +
      "</div></div>" +
      /* 只留「我的系統」當主體。原本身分／系統／需求單／用量／導覽五段平權堆疊，
         每段同樣的細線與同樣的小灰標籤，眼睛沒有入口；而「我的系統」是客戶真正
         買到的東西，卻和「這個月 token 0」長得一樣重。
         需求單與用量壓成下面一行摘要，細節一鍵到個人設定；零值不顯示。 */
      '<div class="sec sys"><div class="lbl">我的系統</div><div data-systems><div class="muted">讀取中…</div></div></div>' +
      '<a class="sum" href="./account" data-summary><span class="muted">讀取中…</span></a>' +
      '<div class="acts">' +
        '<a href="./account"><span class="material-symbols-outlined ico">settings</span>個人設定</a>' +
        '<a href="./catalog"><span class="material-symbols-outlined ico">apps</span>瀏覽專案目錄</a>' +
        (me.admin ? '<a href="./admin-actions"><span class="material-symbols-outlined ico">lock</span>後臺管理</a>' : "") +
        '<button type="button" data-logout class="danger"><span class="material-symbols-outlined ico" style="color:inherit">logout</span>登出</button>' +
      "</div>";
    box.appendChild(panel);

    panel.addEventListener("click", function (e) { e.stopPropagation(); });
    panel.querySelector("[data-logout]").addEventListener("click", function () {
      fetch("/api/visitor/logout", { method: "POST" })
        .then(function () { location.reload(); })
        .catch(function () { location.reload(); });
    });

    fill(panel);
  }

  /* 兩塊清單各自去拿、各自失敗。任何一邊的資料庫連不上時，另一邊照樣顯示。 */
  function fill(panel) {
    fetch("/api/me/systems", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var box = panel.querySelector("[data-systems]");
        if (!box) return;
        var list = (d && d.systems) || [];
        if (!list.length) {
          box.innerHTML = '<div class="muted">還沒有開通的系統。挑幾套送出需求後，這裡會列出可以直接進去用的網址。</div>';
          return;
        }
        /* 整列可點，不是只有「開啟」兩個字——那個觸控目標在手機上只有約 30px 寬。 */
        box.innerHTML = list.slice(0, 5).map(function (s) {
          var live = s.state === "live";
          /* 有中文名稱就用中文；沒有才退回代號。 */
          var name = esc(s.title || s.repo_name.replace(/^jvision-/, ""));
          if (!live) {
            return '<div class="sysrow off"><span class="t">' + name + '</span><span class="st">' +
              (s.state === "building" ? "建置中" : esc(s.state)) + "</span></div>";
          }
          return '<a class="sysrow" href="/-/i/' + esc(s.id) + '/"><span class="t">' + name +
            '</span><span class="material-symbols-outlined go">chevron_right</span></a>';
        }).join("") + (list.length > 5 ? '<div class="muted">另有 ' + (list.length - 5) + " 套</div>" : "");
        sum(panel, "sys", list.length ? list.length + " 套系統" : "");
      })
      .catch(function () {
        var box = panel.querySelector("[data-systems]");
        if (box) box.innerHTML = '<div class="muted">暫時讀不到</div>';
      });

    fetch("/api/me/usage", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        var sg = d.storage || {};
        var used = (sg.files || 0) + (sg.db || 0);
        sum(panel, "use", used ? fmtBytes(used) : "");
      })
      .catch(function () { /* 用量讀不到就不顯示那顆數字，不必佔一整段講「暫時讀不到」 */ });

    fetch("/api/orders", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var list = (d && d.orders) || [];
        sum(panel, "ord", list.length ? list.length + " 張需求單" : "");
      })
      .catch(function () { /* 同上：讀不到就不顯示 */ });
  }

  /* 摘要那一行由三支 API 各自填一顆數字。沿用原本「各自去拿、各自失敗」的作法：
     任何一邊掛掉，另外兩顆照樣出得來，而不是整行變成「暫時讀不到」。 */
  function sum(panel, key, text) {
    var el = panel.querySelector("[data-summary]");
    if (!el) return;
    if (!el.dataset.ready) { el.dataset.ready = "1"; el.innerHTML = ""; }
    el.dataset[key] = text || "";
    var parts = ["sys", "ord", "use"].map(function (k) { return el.dataset[k]; }).filter(Boolean);
    el.innerHTML = parts.length
      ? parts.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join('<i class="dot"></i>') +
        '<span class="more">詳細 ›</span>'   /* 不寫「個人設定」：下面動作區已經有同名同去向的項目 */
      : '<span class="muted">還沒有資料</span>';
  }

  /* 點空白處與 Esc 都要關得掉——選單蓋住內容卻關不掉是最惱人的那種 bug。 */
  document.addEventListener("click", function () {
    var p = document.getElementById("jvAcctPanel");
    if (p) { p.remove(); var b = document.getElementById("jvAcctBtn"); if (b) b.setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var p = document.getElementById("jvAcctPanel");
    if (p) { p.remove(); var b = document.getElementById("jvAcctBtn"); if (b) b.setAttribute("aria-expanded", "false"); }
  });

  /* 名字要用使用者自己設的那個，而不是 Google 給的——他特地去改，
     結果右上角還是舊的，會以為沒存到。profile 拿不到就退回 visitor/me 的名字。 */
  function load() {
    return fetch("/api/visitor/me", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        me = d;
        if (!d || !d.signedIn) return;
        return fetch("/api/me/profile", { cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (p) { if (p && p.displayName) me.name = p.displayName; })
          .catch(function () {});
      });
  }

  function start() {
    load().then(mount).catch(function () { /* 問不到身分就不顯示這顆 */ });
  }

  /* 個人設定頁改完名字會叫這支，右上角立刻跟著變。 */
  window.JVAccount = {
    refresh: function () {
      load().then(function () {
        var box = document.getElementById("jvAcct");
        if (box) { var p = document.getElementById("jvAcctPanel"); if (p) p.remove(); render(box); }
      }).catch(function () {});
    },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
