/* 共用「手機導覽」：把頁面既有的 header nav 升級成 漢堡鈕 + 全屏抽屜。
 * 桌機（>=768px）完全不受影響：原本的連結列照舊，漢堡與抽屜都是 md:hidden。
 * 用法：在頁面底部載入 <script src="./shared/jv-mobile-nav.js"></script>
 * 需求：頁面已載入 Tailwind + Material Symbols，且 header 內有一個 <nav>，
 *      nav 的最後一個 <div> 是桌機連結列。
 */
(function () {
  if (window.__jvMobileNav) return; window.__jvMobileNav = true;

  var ROWS = [
    { href: "./catalog.html", match: "catalog", icon: "apps", color: "text-brand2",
      title: "專案目錄", sub: "1993 個系統 · 29 個產業分類" },
    { href: "./agents.html", match: "agents", icon: "smart_toy", color: "text-emerald-600",
      title: "專案 Agents", sub: "AI 專案團隊成員" },
    { href: "./wish.html", match: "wish", icon: "auto_awesome", color: "", style: "color:#7c3aed",
      title: "AI 許願池", sub: "說出你的需求，看看 AI 能怎麼幫" },
  ];
  var DEMOS = [
    { href: "./agents-mission?case=1", icon: "precision_manufacturing", color: "text-brand", style: "",
      title: "完成任務 · 生產排程", sub: "一句話排好工單並派工" },
    { href: "./agents-mission?case=2", icon: "insights", color: "", style: "color:#7c3aed",
      title: "呈現報表 · 營運儀表板", sub: "串接系統彙整即時儀表板" },
    { href: "./agents-mission?case=3", icon: "description", color: "text-emerald-600", style: "",
      title: "產生報告 · 經營分析", sub: "跨系統彙整完整報告" },
  ];

  function css() {
    if (document.getElementById("jv-mobilenav-css")) return;
    var s = document.createElement("style"); s.id = "jv-mobilenav-css";
    s.textContent =
      /* 目前所在頁：左側色條 + 淡底色（比打勾直覺） */
      "#jvMobileMenu .mm-row{position:relative}" +
      "#jvMobileMenu .mm-current{background:#eef4ff;margin:0 -1.25rem;padding-left:1.25rem;padding-right:1.25rem}" +
      "#jvMobileMenu .mm-current::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:#1e40af}" +
      "@media (max-width:767px){" +
      /* 用 header.jv-nav > nav 提高權重，才蓋得過 Tailwind 的 .h-16 */
      "header.jv-nav > nav{height:3.5rem;padding-left:1rem;padding-right:1rem}" +
      "header.jv-nav .jvhm,header.jv-nav .mega,header.jv-nav .jv-mega{display:none}" +
      "}";
    document.head.appendChild(s);
  }

  function row(r, current) {
    var isCur = current && r.match === current;
    return '<a href="' + r.href + '"' + (isCur ? ' aria-current="page"' : "") +
      ' class="mm-row' + (isCur ? " mm-current" : "") + ' flex items-center justify-between gap-3 py-5 border-b border-line">' +
      '<span class="flex items-center gap-3.5">' +
      '<span class="material-symbols-outlined text-[24px] ' + (r.color || "") + '"' + (r.style ? ' style="' + r.style + '"' : "") + '>' + r.icon + "</span>" +
      '<span class="flex flex-col"><span class="text-[17px] font-bold leading-tight ' + (isCur ? "text-brand" : "text-ink") + '">' + r.title + "</span>" +
      '<span class="text-[12px] text-muted mt-0.5">' + r.sub + "</span></span></span>" +
      (isCur ? "" : '<span class="material-symbols-outlined text-muted text-[20px]">chevron_right</span>') +
      "</a>";
  }

  function demo(d) {
    return '<a href="' + d.href + '" class="flex items-center gap-3 min-h-[3.5rem] px-3 rounded-xl bg-soft">' +
      '<span class="material-symbols-outlined text-[22px] ' + (d.color || "") + '"' + (d.style ? ' style="' + d.style + '"' : "") + ">" + d.icon + "</span>" +
      '<span class="flex flex-col"><span class="text-sm font-bold text-ink">' + d.title + "</span>" +
      '<span class="text-[11px] text-muted">' + d.sub + "</span></span></a>";
  }

  function mount() {
    var header = document.querySelector("header");
    var nav = header && header.querySelector("nav");
    if (!nav) return;
    var linksBox = nav.querySelector(":scope > div:last-of-type");
    if (!linksBox) return;
    css();
    header.classList.add("jv-nav");
    linksBox.classList.add("hidden", "md:flex");

    var file = (location.pathname.split("/").pop() || "").toLowerCase().replace(/\.html$/, "");
    var current = ROWS.map(function (r) { return r.match; }).filter(function (m) { return file.indexOf(m) === 0; })[0] || "";

    var btn = document.createElement("button");
    btn.type = "button"; btn.id = "jvNavToggle";
    btn.className = "md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-xl text-ink active:bg-black/5 transition-colors";
    btn.setAttribute("aria-label", "開啟選單");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "jvMobileMenu");
    btn.innerHTML = '<span class="material-symbols-outlined text-[28px]">menu</span>';
    nav.insertBefore(btn, linksBox);

    var menu = document.createElement("div");
    menu.id = "jvMobileMenu"; menu.hidden = true;
    menu.className = "md:hidden fixed inset-x-0 top-14 bottom-0 z-50 bg-white overflow-y-auto overscroll-contain";
    menu.innerHTML =
      '<nav class="flex flex-col px-5">' + ROWS.map(function (r) { return row(r, current); }).join("") + "</nav>" +
      '<div class="px-5 pt-6 pb-10">' +
      '<p class="eyebrow text-[11px] font-bold text-muted uppercase mb-2.5">實跑 Demo</p>' +
      '<div class="flex flex-col gap-2">' + DEMOS.map(demo).join("") + "</div></div>";
    /* 放在 header 之外：hub-nav.js 只在 header 內找連結，避免它把大目錄掛到抽屜的連結上 */
    (header.parentNode || document.body).insertBefore(menu, header.nextSibling);

    var icon = btn.querySelector(".material-symbols-outlined");
    function setOpen(open) {
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "關閉選單" : "開啟選單");
      icon.textContent = open ? "close" : "menu";
      document.body.style.overflow = open ? "hidden" : "";
    }
    btn.addEventListener("click", function () { setOpen(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) setOpen(false); });
    window.matchMedia("(min-width: 768px)").addEventListener("change", function (e) { if (e.matches) setOpen(false); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
