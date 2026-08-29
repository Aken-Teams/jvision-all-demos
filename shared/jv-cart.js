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

  /* ── 浮動的購物車列 ────────────────────────────────────
     目錄頁換頁會整批重建卡片，所以這一列必須獨立於卡片之外，
     否則每次換頁都會閃一下。 */
  function mountBar() {
    if (document.getElementById("jvCartBar")) return;
    const bar = document.createElement("div");
    bar.id = "jvCartBar";
    bar.hidden = true;
    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:60;display:flex;justify-content:center;padding:0 1rem 1rem;pointer-events:none";
    bar.innerHTML = `
      <div style="pointer-events:auto;display:flex;align-items:center;gap:.9rem;background:#0f172a;color:#fff;border-radius:9999px;padding:.65rem 1.4rem;box-shadow:0 10px 30px rgba(15,23,42,.3)">
        <span class="material-symbols-outlined" style="font-size:20px">shopping_cart</span>
        <span style="font-size:.9rem;font-weight:700">已選 <span id="jvCartCount">0</span> 套系統</span>
        <a href="./cart.html" style="background:#fff;color:#0f172a;font-weight:800;font-size:.85rem;border-radius:9999px;padding:.4rem 1.1rem;text-decoration:none">前往確認</a>
        <button type="button" id="jvCartClear" title="清空" style="background:none;border:0;color:#94a3b8;cursor:pointer;display:grid;place-content:center">
          <span class="material-symbols-outlined" style="font-size:20px">close</span>
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
