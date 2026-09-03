/**
 * 客戶系統右下角的小提示：要改東西，到工作台去。
 *
 * ── 為什麼從「面板」縮成「引導」 ──────────────────────
 * 這裡以前是一整個聊天面板：能加欄位、改名稱、叫背景工作改程式，還會輪詢
 * 進度。也就是說**編輯器被複製成了兩份**——工作台一份、每個實例裡再一份。
 * 兩份的代價不是多寫一次程式，是：
 *
 * 一、右下角是任何 app 最兵家必爭的位置。客戶自己的系統很可能也要放一顆
 *     他自己的助理，我們佔著那裡等於擋住他。縮成一顆小按鈕、而且關得掉，
 *     才不會變成別人的障礙。
 * 二、同一件事有兩個入口，UI 品質就要維護兩次——實際上只會有一邊被改到，
 *     另一邊慢慢腐爛，而使用者不知道自己看到的是哪一邊。
 *
 * 所以這裡只做一件事：告訴他「要改的話往這邊走」，然後把他送到工作台。
 * 真正的修改能力集中在那裡：左邊對話、右邊即時預覽、有版本、有做法紀錄。
 *
 * ── 什麼時候不出現 ────────────────────────────────────
 *   jv=embed  工作台的預覽框
 *   jv=view   從工作台按「開啟」另開的分頁
 * 兩種都代表「這個人已經在編輯區了」。只有直接打開這套系統的人才需要它。
 * 另外，關掉之後就記著（localStorage），不再打擾。
 */
(function () {
  "use strict";
  if (window.__jvAssist) return;
  /* jv=embed＝嵌在工作台的預覽框裡；jv=view＝從工作台按「開啟」另開的分頁。
     兩種都是「這個人已經在編輯區了」，不需要再多一個入口。 */
  if (/[?&]jv=(embed|view)\b/.test(location.search)) return;
  window.__jvAssist = true;

  /* 關掉的紀錄用路徑當鍵，不用實例編號——編號要跟後端要，而「要不要顯示」
     這件事不該等一個網路往返才知道。 */
  var OFF_KEY = "jv-assist-off:" + location.pathname;
  try { if (localStorage.getItem(OFF_KEY) === "1") return; } catch (e) { /* 讀不到就照常顯示 */ }

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  function css() {
    if (document.getElementById("jv-assist-css")) return;
    var st = document.createElement("style");
    st.id = "jv-assist-css";
    st.textContent = [
      "#jvGo{position:fixed;right:18px;bottom:18px;z-index:2147483000;",
      "font:500 13px/1.5 system-ui,-apple-system,'Noto Sans TC',sans-serif}",
      /* 按鈕刻意做小、做淡。它不是這個畫面的主角，只是一個出口。 */
      "#jvGoBtn{display:flex;align-items:center;gap:6px;height:34px;padding:0 12px;",
      "border:1px solid rgba(15,23,42,.12);border-radius:999px;background:#fff;color:#334155;",
      "box-shadow:0 4px 14px rgba(15,23,42,.12);cursor:pointer;font:inherit;font-weight:700}",
      "#jvGoBtn:hover{border-color:#1e40af;color:#1e40af}",
      "#jvGoBtn svg{width:15px;height:15px;flex:none}",
      "#jvGoCard{position:absolute;right:0;bottom:44px;width:250px;padding:14px;",
      "background:#fff;border:1px solid rgba(15,23,42,.1);border-radius:12px;",
      "box-shadow:0 16px 40px rgba(15,23,42,.18)}",
      "#jvGoCard[hidden]{display:none}",
      "#jvGoCard b{display:block;font-size:13px;color:#0f1e46}",
      "#jvGoCard p{margin:6px 0 12px;font-size:12px;line-height:1.7;color:#64748b}",
      "#jvGoCard a{display:flex;align-items:center;justify-content:center;gap:6px;",
      "height:34px;border-radius:8px;background:#1e40af;color:#fff;text-decoration:none;",
      "font-weight:700;font-size:12.5px}",
      "#jvGoCard a:hover{background:#3b82f6}",
      "#jvGoOff{display:block;width:100%;margin-top:8px;border:0;background:none;",
      "color:#94a3b8;font:inherit;font-size:11.5px;cursor:pointer}",
      "#jvGoOff:hover{color:#64748b;text-decoration:underline}",
      "@media(max-width:520px){#jvGo{right:12px;bottom:12px}#jvGoCard{width:min(250px,calc(100vw - 28px))}}",
    ].join("");
    document.head.appendChild(st);
  }

  /* 工作台的網址。實例不知道站台在哪，也不知道自己的編號，兩個都要問後端。
     刻意等到使用者按下去才問——沒有人按的話，這一頁不該多打一個請求。 */
  function workspaceUrl() {
    return fetch("./_jv/schema", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.instanceId) return null;
        return (d.site || "") + "/workspace.html?i=" + encodeURIComponent(d.instanceId);
      })
      .catch(function () { return null; });
  }

  function mount() {
    if (document.getElementById("jvGo")) return;
    css();
    var wrap = document.createElement("div");
    wrap.id = "jvGo";
    wrap.innerHTML =
      '<div id="jvGoCard" hidden>'
      + "<b>想改這套系統？</b>"
      + "<p>欄位、名稱、畫面、流程都能改——到工作台說一句話就好，"
      + "那裡改完馬上看得到，也留得住每一版。</p>"
      + '<a id="jvGoLink" href="#" target="_blank" rel="noreferrer">開啟工作台 ↗</a>'
      + '<button id="jvGoOff" type="button">不用了，別再顯示</button>'
      + "</div>"
      + '<button id="jvGoBtn" type="button" aria-haspopup="dialog" aria-expanded="false">'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"'
      + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
      + "想改這裡？</button>";
    document.body.appendChild(wrap);

    var btn = document.getElementById("jvGoBtn");
    var card = document.getElementById("jvGoCard");
    var link = document.getElementById("jvGoLink");
    var asked = false;

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      card.hidden = !card.hidden;
      btn.setAttribute("aria-expanded", card.hidden ? "false" : "true");
      if (card.hidden || asked) return;
      asked = true;
      workspaceUrl().then(function (u) {
        /* 問不到就退回站台首頁的工作台——沒有實例編號，他至少還走得到清單，
           在那裡自己挑一套。給一個死連結比較糟。 */
        link.href = u || "/workspace.html";
      });
    });

    document.getElementById("jvGoOff").addEventListener("click", function () {
      try { localStorage.setItem(OFF_KEY, "1"); } catch (e) { /* 存不了就這次先關掉 */ }
      wrap.remove();
    });

    /* 點別的地方就收起來。它是一個路標，不該一直擋在畫面上。 */
    document.addEventListener("click", function (ev) {
      if (card.hidden || wrap.contains(ev.target)) return;
      card.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !card.hidden) {
        card.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
}());
