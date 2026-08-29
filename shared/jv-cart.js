/**
 * 跨頁購物車。訪客可以在目錄裡挑選多套系統，一次送出成為訂單。
 *
 * 狀態放 localStorage：挑選的過程可能橫跨好幾頁、好幾次瀏覽，存伺服器等於
 * 還沒下單就要先建一筆資料，而挑到一半離開的人遠多於真的下單的人。
 * 送出的那一刻才進資料庫。
 *
 * 只存 repoName 與標題，不存價格與描述——那些會變，存了就會出現「購物車裡
 * 寫的和實際不一樣」。顯示時一律以目錄當下的資料為準。
 */
(function () {
  "use strict";
  const KEY = "jv-cart-v1";
  const MAX = 20; // 一次挑太多套沒有人真的會買，而且結帳頁會爆長

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v.filter((x) => x && typeof x.repoName === "string") : [];
    } catch { return []; } // 私密視窗或被停用時不要讓整頁掛掉
  }

  function write(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX))); } catch { /* 存不了就只在這次瀏覽有效 */ }
    document.dispatchEvent(new CustomEvent("jv-cart-change", { detail: { count: items.length } }));
  }

  const api = {
    items: read,
    count: () => read().length,
    has: (repoName) => read().some((x) => x.repoName === repoName),
    add(repoName, title) {
      const items = read();
      if (items.some((x) => x.repoName === repoName)) return items.length;
      if (items.length >= MAX) return -1; // 呼叫端負責告訴使用者滿了
      items.push({ repoName, title: title || repoName, at: Date.now() });
      write(items);
      return items.length;
    },
    remove(repoName) {
      const items = read().filter((x) => x.repoName !== repoName);
      write(items);
      return items.length;
    },
    toggle(repoName, title) {
      return api.has(repoName) ? (api.remove(repoName), false) : (api.add(repoName, title), true);
    },
    clear() { write([]); },
    MAX,
  };

  window.JVCart = api;

  /* ── 購物車列 ─────────────────────────────────────────
     釘在右上角而不是畫面底部：底部橫幅會壓住卡片最後一列，而目錄頁正是
     要一直往下滑看的地方。右上角是使用者找購物車的習慣位置，也不擋內容。
     它獨立於卡片之外，換頁整批重建卡片時才不會跟著閃。 */
  function mountBar() {
    if (document.getElementById("jvCartBar")) return;
    const bar = document.createElement("div");
    bar.id = "jvCartBar";
    bar.hidden = true;
    /* 站上每一頁的頁首都是 sticky 且 z-index 到 50，這一顆要疊在它之上。
       top 用 rem 讓它落在頁首下緣附近，不與導覽列打架。 */
    bar.style.cssText = "position:fixed;top:4.25rem;right:1rem;z-index:60";
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:.5rem;background:#0f172a;color:#fff;border-radius:9999px;padding:.35rem .35rem .35rem .7rem;box-shadow:0 6px 20px rgba(15,23,42,.28)">
        <span class="material-symbols-outlined" style="font-size:18px">shopping_cart</span>
        <span id="jvCartCount" style="font-size:.8rem;font-weight:800;min-width:.9em;text-align:center">0</span>
        <a href="./cart.html" style="background:#fff;color:#0f172a;font-weight:800;font-size:.78rem;border-radius:9999px;padding:.28rem .8rem;text-decoration:none;white-space:nowrap">確認</a>
        <button type="button" id="jvCartClear" title="清空購物車" aria-label="清空購物車" style="background:none;border:0;color:#94a3b8;cursor:pointer;display:grid;place-content:center;padding:0 .15rem">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>`;
    document.body.appendChild(bar);
    bar.querySelector("#jvCartClear").addEventListener("click", () => api.clear());
    sync();
  }

  function sync() {
    const bar = document.getElementById("jvCartBar");
    if (!bar) return;
    const n = api.count();
    bar.hidden = n === 0;
    const c = document.getElementById("jvCartCount");
    if (c) c.textContent = String(n);
  }

  document.addEventListener("jv-cart-change", sync);
  /* 另一個分頁改了購物車，這一頁要跟著更新——同一個人開兩個分頁挑選是常態 */
  window.addEventListener("storage", (e) => { if (e.key === KEY) { sync(); document.dispatchEvent(new CustomEvent("jv-cart-sync")); } });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountBar);
  else mountBar();
})();
