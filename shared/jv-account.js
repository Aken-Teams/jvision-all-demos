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
      "#jvAcctBtn .av{width:26px;height:26px;border-radius:9999px;display:grid;place-content:center;background:linear-gradient(135deg,#1e40af,#7c3aed);color:#fff;font-size:.72rem;font-weight:800;flex:none}" +
      "#jvAcctBtn .nm{font-size:.8rem;font-weight:700;color:#0f172a;max-width:8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      "@media (max-width:640px){#jvAcctBtn .nm{display:none}}" +
      "#jvAcctPanel{position:absolute;top:calc(100% + .5rem);right:0;width:19rem;max-width:calc(100vw - 2rem);background:#fff;border:1px solid #e2e8f0;border-radius:.9rem;box-shadow:0 16px 44px rgba(15,23,42,.16);z-index:80;overflow:hidden}" +
      /* 手機上這顆按鈕在漢堡鈕左邊，離右緣還有一段距離；面板若照樣對齊按鈕右緣，
         左半邊會被推出畫面外（實測 390px 時 left:-48）。窄螢幕改成貼著視窗左右
         內縮，與手機抽屜選單的 top-14 對齊。 */
      "@media (max-width:640px){#jvAcctPanel{position:fixed;top:56px;left:.75rem;right:.75rem;width:auto;max-width:none}}" +
      "#jvAcctPanel .hd{padding:.9rem 1rem;border-bottom:1px solid #f1f5f9;display:flex;gap:.7rem;align-items:center}" +
      "#jvAcctPanel .hd .av{width:38px;height:38px;border-radius:9999px;display:grid;place-content:center;background:linear-gradient(135deg,#1e40af,#7c3aed);color:#fff;font-size:.95rem;font-weight:800;flex:none}" +
      "#jvAcctPanel .nm2{font-size:.88rem;font-weight:800;color:#0f172a;line-height:1.25}" +
      "#jvAcctPanel .em{font-size:.74rem;color:#64748b;word-break:break-all;line-height:1.3;margin-top:.1rem}" +
      "#jvAcctPanel .tag{display:inline-block;margin-top:.3rem;font-size:.66rem;font-weight:800;padding:.1rem .45rem;border-radius:9999px;background:#eef2ff;color:#3730a3}" +
      "#jvAcctPanel .sec{padding:.6rem 1rem .7rem;border-bottom:1px solid #f1f5f9}" +
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
      '<div class="hd"><span class="av">' + esc(initial(me)) + "</span><div>" +
        '<div class="nm2">' + esc(me.name || "（未提供姓名）") + "</div>" +
        '<div class="em">' + esc(me.email) + "</div>" +
        '<span class="tag">' + (me.admin ? "管理者" : me.kind === "google" ? "Google 帳號" : "訪客") + "</span>" +
      "</div></div>" +
      '<div class="sec"><div class="lbl">我的系統</div><div data-systems><div class="muted">讀取中…</div></div></div>' +
      '<div class="sec"><div class="lbl">我的需求單</div><div data-orders><div class="muted">讀取中…</div></div></div>' +
      '<div class="sec"><div class="lbl">用量</div><div data-usage><div class="muted">讀取中…</div></div></div>' +
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
        box.innerHTML = list.slice(0, 5).map(function (s) {
          var live = s.state === "live";
          return '<div class="row"><span>' + esc(s.repo_name.replace(/^jvision-/, "")) + "</span>" +
            (live ? '<a href="/-/i/' + esc(s.id) + '/">開啟</a>'
                  : '<span class="muted">' + (s.state === "building" ? "建置中" : esc(s.state)) + "</span>") + "</div>";
        }).join("") + (list.length > 5 ? '<div class="muted">另有 ' + (list.length - 5) + " 套</div>" : "");
      })
      .catch(function () {
        var box = panel.querySelector("[data-systems]");
        if (box) box.innerHTML = '<div class="muted">暫時讀不到</div>';
      });

    fetch("/api/me/usage", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var box = panel.querySelector("[data-usage]");
        if (!box || !d) return;
        var t = d.tokens || {}, sg = d.storage || {};
        var used = (sg.files || 0) + (sg.db || 0);
        box.innerHTML =
          '<div class="row"><span>這個月 token</span><span class="num">' + fmtNum(t.month) + "</span></div>" +
          '<div class="row"><span>佔用空間</span><span class="num">' + fmtBytes(used) + "</span></div>" +
          (t.ledger ? '<div class="muted">累計 ' + fmtNum(t.total) + " token・" + fmtNum(t.calls) + " 次分析</div>" : "");
      })
      .catch(function () {
        var box = panel.querySelector("[data-usage]");
        if (box) box.innerHTML = '<div class="muted">暫時讀不到</div>';
      });

    fetch("/api/orders", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var box = panel.querySelector("[data-orders]");
        if (!box) return;
        var list = (d && d.orders) || [];
        if (!list.length) {
          box.innerHTML = '<div class="muted">還沒有送出過需求單。</div>';
          return;
        }
        var ZH = { draft: "草稿", pending: "處理中", pending_payment: "待付款", paid: "已付款",
                   building: "建置中", delivered: "已交付", failed: "未完成" };
        box.innerHTML = list.slice(0, 4).map(function (o) {
          var n = (o.items || []).length;
          return '<div class="row"><span>' + esc(String(o.created_at || "").slice(0, 10)) +
            "　" + n + " 套</span><span class=\"muted\">" + esc(ZH[o.status] || o.status) + "</span></div>";
        }).join("") + (list.length > 4 ? '<div class="muted">另有 ' + (list.length - 4) + " 張</div>" : "");
      })
      .catch(function () {
        var box = panel.querySelector("[data-orders]");
        if (box) box.innerHTML = '<div class="muted">暫時讀不到</div>';
      });
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
