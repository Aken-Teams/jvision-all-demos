/* 共用「大目錄」hover 選單：把每個頁面 nav 上的「專案目錄 / 專案 Agents」兩個連結，
 * 升級成跟首頁一樣的全寬 mega dropdown。放在 catalog / agents / agents-mission 等頁使用。
 * 依賴：頁面已載入 Tailwind + Material Symbols；agents 分類會用 BIGS/CATS（有載 agents.js 就動態、沒載就用靜態備援）。 */
(function () {
  if (window.__jvHubNav) return; window.__jvHubNav = true;

  // ---- 專案目錄大分類（靜態，對應首頁）----
  var CATALOG_GROUPS = [
    { title: "智慧製造與研發", total: 92, items: [["生產製造", "precision_manufacturing", 64], ["研發管理", "science", 20], ["設備維護", "build", 8]] },
    { title: "品質與供應鏈", total: 115, items: [["品質管理", "verified", 50], ["採購供應鏈", "handshake", 37], ["倉儲物流", "inventory_2", 22]] },
    { title: "業務與客戶", total: 56, items: [["業務銷售", "trending_up", 39], ["企業協作", "groups", 15], ["客服管理", "support_agent", 2]] },
    { title: "營運與財務", total: 72, items: [["人力資源", "badge", 23], ["經營管理", "insights", 19], ["財務會計", "account_balance", 15]] },
    { title: "永續與能源", total: 18, items: [["ESG 永續", "eco", 18]] },
    { title: "產業垂直", total: 110, items: [["零售電商", "storefront", 17], ["教育", "school", 16], ["醫療照護", "medical_services", 15]] }
  ];
  // agents 大分類靜態備援（catalog 頁沒載 agents.js 時用）
  var AGENT_FALLBACK = [
    { title: "顧問與規劃", total: 56, items: [["選型顧問", "recommend"], ["領域專家", "school"], ["策略規劃", "architecture"]] },
    { title: "審視與治理", total: 55, items: [["完整度稽核", "fact_check"], ["風險合規", "gavel"], ["品質稽核", "verified"]] },
    { title: "生成與交付", total: 56, items: [["文件規格", "description"], ["介面設計", "palette"], ["資料填充", "table_chart"]] },
    { title: "營運與分析", total: 57, items: [["財務效益", "savings"], ["排程調度", "calendar_month"], ["數據洞察", "query_stats"]] }
  ];

  function css() {
    if (document.getElementById("jv-hubnav-css")) return;
    var s = document.createElement("style"); s.id = "jv-hubnav-css";
    s.textContent =
      ".jvhm{position:static;height:64px;display:flex;align-items:center}" +
      ".jvhm .jv-mega{visibility:hidden;opacity:0;transform:translateY(8px);transition:opacity .2s ease,transform .2s ease,visibility .2s}" +
      ".jvhm:hover .jv-mega,.jvhm .jv-mega:hover{visibility:visible;opacity:1;transform:translateY(0)}" +
      ".jvhm:hover .jvhm-caret{transform:rotate(180deg)}";
    document.head.appendChild(s);
  }

  function catalogItems(g) {
    return g.items.map(function (it) {
      return '<li><a href="./catalog?category=' + encodeURIComponent(it[0]) + '" class="group flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-soft transition-colors">' +
        '<span class="flex items-center gap-2.5"><span class="material-symbols-outlined text-brand2 text-[20px]">' + it[1] + '</span>' +
        '<span class="text-sm font-semibold text-body group-hover:text-brand">' + it[0] + '</span></span>' +
        '<span class="text-xs font-bold text-muted">' + it[2] + '</span></a></li>';
    }).join("");
  }
  function catalogPanel() {
    var cols = CATALOG_GROUPS.map(function (g) {
      return '<div><h3 class="eyebrow text-[11px] font-bold text-muted uppercase pb-2 mb-2 border-b border-line">' + g.title + ' · ' + g.total + '</h3>' +
        '<ul class="flex flex-col gap-0.5">' + catalogItems(g) + '</ul></div>';
    }).join("");
    var feat = '<div class="w-full lg:w-72 shrink-0 bg-soft rounded-xl p-4 border border-line flex flex-col gap-3">' +
      '<div class="flex items-center gap-2"><span class="material-symbols-outlined text-brand text-[22px]">star</span><h3 class="text-base font-bold text-ink">精選系統</h3></div>' +
      feCard("./catalog?q=產線智排中心", "manufacturing", "bg-brand/10", "text-brand", "產線智排中心", "AI 依產能與交期自動排程") +
      feCard("./catalog?q=組織碳盤查", "co2", "bg-emerald-50", "text-emerald-600", "組織碳盤查", "溫室氣體盤查與排放報告") +
      feCard("./catalog?q=供應交期預警塔", "hub", "bg-amber-50", "text-amber-600", "供應交期預警塔", "供應商交期風險即時預警") + '</div>';
    return megaShell(cols, feat, "./catalog.html", "查看全部 463 個系統");
  }
  function agentColsDynamic() {
    if (typeof BIGS === "undefined" || typeof CATS === "undefined" || typeof AGENTS === "undefined") return null;
    return BIGS.map(function (b) {
      var items = CATS.filter(function (c) { return c.big === b.key; }).slice(0, 3).map(function (c) {
        return '<li><a href="./agents?cat=' + c.key + '" class="group flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-soft transition-colors">' +
          '<span class="flex items-center gap-2.5"><span class="material-symbols-outlined text-emerald-600 text-[20px]">' + c.icon + '</span>' +
          '<span class="text-sm font-semibold text-body group-hover:text-brand">' + c.name + '</span></span>' +
          '<span class="text-xs font-bold text-muted">' + catCount(c.key) + '</span></a></li>';
      }).join("");
      return '<div><a href="./agents?big=' + b.key + '" class="eyebrow text-[11px] font-bold text-muted uppercase pb-2 mb-2 border-b border-line flex items-center justify-between hover:text-brand"><span>' + b.name + '</span><span>' + bigCount(b.key) + '</span></a><ul class="flex flex-col gap-0.5">' + items + '</ul></div>';
    }).join("");
  }
  function agentColsFallback() {
    return AGENT_FALLBACK.map(function (g) {
      var items = g.items.map(function (it) {
        return '<li><a href="./agents" class="group flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-soft transition-colors">' +
          '<span class="flex items-center gap-2.5"><span class="material-symbols-outlined text-emerald-600 text-[20px]">' + it[1] + '</span>' +
          '<span class="text-sm font-semibold text-body group-hover:text-brand">' + it[0] + '</span></span></a></li>';
      }).join("");
      return '<div><h3 class="eyebrow text-[11px] font-bold text-muted uppercase pb-2 mb-2 border-b border-line flex items-center justify-between"><span>' + g.title + '</span><span>' + g.total + '</span></h3><ul class="flex flex-col gap-0.5">' + items + '</ul></div>';
    }).join("");
  }
  function agentsPanel() {
    var cols = agentColsDynamic() || agentColsFallback();
    var total = (typeof AGENTS !== "undefined" && AGENTS.length) ? AGENTS.length : 224;
    var feat = '<div class="w-full lg:w-72 shrink-0 bg-soft rounded-xl p-4 border border-line flex flex-col gap-3">' +
      '<div class="flex items-center gap-2"><span class="material-symbols-outlined text-brand text-[22px]">play_circle</span><h3 class="text-base font-bold text-ink">實跑 Demo</h3></div>' +
      feCard("./agents-mission?case=1", "precision_manufacturing", "bg-brand/10", "text-brand", "完成任務 · 生產排程", "一句話排好工單並派工") +
      feCard("./agents-mission?case=2", "insights", "bg-violet/10", "text-violet", "呈現報表 · 營運儀表板", "串接系統彙整即時儀表板") +
      feCard("./agents-mission?case=3", "description", "bg-emerald-50", "text-emerald-600", "產生報告 · 經營分析", "跨系統彙整完整報告") + '</div>';
    return megaShell('<div class="flex-1 grid grid-cols-2 gap-x-8 gap-y-6 text-left">' + cols + '</div>', feat, "./agents.html", "查看全部 " + total + " 位 Agents", true);
  }
  function feCard(href, icon, bg, tc, title, sub) {
    return '<a href="' + href + '" class="group bg-white rounded-lg p-3 border border-line hover:border-brand2 hover:shadow-sm transition-all flex gap-3 items-start">' +
      '<span class="w-10 h-10 rounded-lg ' + bg + ' grid place-content-center shrink-0"><span class="material-symbols-outlined ' + tc + ' text-[22px]">' + icon + '</span></span>' +
      '<div class="flex flex-col"><span class="text-sm font-bold text-ink group-hover:text-brand">' + title + '</span><span class="text-[11px] text-muted">' + sub + '</span></div></a>';
  }
  function megaShell(colsHtml, featHtml, allHref, allLabel, colsRaw) {
    var left = colsRaw ? colsHtml : '<div class="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-7 text-left">' + colsHtml + '</div>';
    return '<div class="jv-mega fixed left-0 right-0 z-50" style="top:64px">' +
      '<div class="bg-white border-b border-line shadow-[0_18px_40px_rgba(15,30,70,.12)]">' +
      '<div class="max-w-shell mx-auto px-6 py-7 flex flex-col lg:flex-row gap-8">' + left + featHtml + '</div>' +
      '<div class="bg-soft border-t border-line"><div class="max-w-shell mx-auto px-6 py-3 flex justify-center">' +
      '<a href="' + allHref + '" class="text-sm font-bold text-brand hover:text-brand2 inline-flex items-center gap-2 transition-colors">' + allLabel + ' <span class="material-symbols-outlined text-[18px]">arrow_forward</span></a>' +
      '</div></div></div></div>';
  }

  function upgrade(link, panelHtml) {
    if (!link || link.closest(".jvhm")) return;
    var wrap = document.createElement("div"); wrap.className = "jvhm";
    link.parentNode.insertBefore(wrap, link);
    link.classList.add("inline-flex", "items-center", "gap-1");
    var caret = document.createElement("span");
    caret.className = "material-symbols-outlined text-[18px] jvhm-caret transition-transform duration-200";
    caret.textContent = "expand_more";
    link.appendChild(caret);
    wrap.appendChild(link);
    wrap.insertAdjacentHTML("beforeend", panelHtml);
  }

  function mount() {
    var header = document.querySelector("header nav") || document.querySelector("header");
    if (!header) return;
    css();
    var file = (location.pathname.split("/").pop() || "").toLowerCase();
    var onCatalog = file.indexOf("catalog") === 0;   // catalog*.html
    var onAgents = file.indexOf("agents") === 0;      // agents*.html（含 agents-mission / agents-profile）
    var catLink = header.querySelector('a[href$="catalog.html"], a[href="./catalog"], a[href$="/catalog"]');
    var agLink = header.querySelector('a[href$="agents.html"], a[href="./agents"], a[href$="/agents"]');
    // 只在「非當前分類」的連結上掛大目錄：在目錄頁就別掛目錄大選單、在 Agents 頁就別掛 Agents 大選單
    if (!onCatalog) upgrade(catLink, catalogPanel());
    if (!onAgents) upgrade(agLink, agentsPanel());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
