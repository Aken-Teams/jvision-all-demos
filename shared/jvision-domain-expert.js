(() => {
  if (window.__jvisionDomainExpertLoaded) return;
  window.__jvisionDomainExpertLoaded = true;

  const catalogUrl = new URL("../../docs/DOMAIN_EXPERT_CATALOG.json", window.location.href).href;
  const repoName = (window.location.pathname.match(/\/demos\/([^/]+)/i) || [])[1];
  if (!repoName) return;

  let dialog;
  let trigger;
  let dialogBody;
  let liveRegion;
  let previousFocus;
  let cachedReview;
  let isLoading = false;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    const paths = name === "spark"
      ? ["m12 3-1.8 5.2L5 10l5.2 1.8L12 17l1.8-5.2L19 10l-5.2-1.8L12 3Z", "M19 15v6", "m22 18-3-3-3 3"]
      : ["M18 6 6 18", "m6 6 12 12"];
    paths.forEach((d) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.append(path);
    });
    return svg;
  }

  function makePill(text, tone = "neutral") {
    return element("span", `jv-domain-expert__pill jv-domain-expert__pill--${tone}`, text);
  }

  function makeSection(title, description) {
    const section = element("section", "jv-domain-expert__section");
    const heading = element("h3", "jv-domain-expert__section-title", title);
    section.append(heading);
    if (description) section.append(element("p", "jv-domain-expert__section-copy", description));
    return section;
  }

  function makeActionList(items, type) {
    const list = element("ul", "jv-domain-expert__list");
    for (const item of items || []) {
      const entry = element("li", "jv-domain-expert__list-item");
      const heading = element("strong", "jv-domain-expert__list-title", item.title || item);
      entry.append(heading);
      const copy = item.description || item.suggestion;
      if (copy) entry.append(element("span", "jv-domain-expert__list-copy", copy));
      if (type === "next") entry.append(makePill("需領域審核", "review"));
      else if (item.execution === "auto-applied") entry.append(makePill("已套用", "applied"));
      else entry.append(makePill("待套用", "pending"));
      list.append(entry);
    }
    return list;
  }

  function showLoading() {
    dialogBody.replaceChildren();
    const loader = element("div", "jv-domain-expert__loading");
    loader.setAttribute("aria-live", "polite");
    loader.append(element("span", "jv-domain-expert__spinner"), element("span", "", "正在載入此專案的領域專家建議…"));
    dialogBody.append(loader);
  }

  function showFailure() {
    dialogBody.replaceChildren();
    const failure = element("div", "jv-domain-expert__failure");
    failure.setAttribute("role", "alert");
    failure.append(
      element("strong", "", "暫時無法取得領域專家資料"),
      element("p", "", "請重新整理，或在專案根目錄執行 npm run apply:domain-expert 重新產生建議資料。"),
    );
    dialogBody.append(failure);
  }

  function renderReview(review) {
    dialogBody.replaceChildren();
    const hero = element("header", "jv-domain-expert__hero");
    const eyebrow = element("p", "jv-domain-expert__eyebrow", review.expert.role);
    const title = element("h2", "jv-domain-expert__title", review.title);
    const brief = element("p", "jv-domain-expert__brief", review.expert.mandate);
    const pills = element("div", "jv-domain-expert__pills");
    pills.append(makePill(review.category, "category"), makePill(`完整度 ${review.score}/100`, "score"));
    hero.append(eyebrow, title, brief, pills);

    const pains = makeSection("專家先看的現場痛點");
    pains.append(makeActionList((review.expert.painPoints || []).map((title) => ({ title })), "pain"));

    const applied = makeSection("已套用的安全改善", "這些調整不會改寫既有的業務規則或資料。");
    applied.append(makeActionList(review.applied, "applied"));

    const next = makeSection("下一步建議", "架構、專業規則與資料權限的變更需由該領域負責人確認後實作。");
    next.append(makeActionList(review.next, "next"));

    const metrics = makeSection("建議持續追蹤的指標");
    const metricList = element("div", "jv-domain-expert__metrics");
    for (const metric of review.expert.metrics || []) metricList.append(makePill(metric, "metric"));
    metrics.append(metricList);

    const boundary = element("aside", "jv-domain-expert__boundary", review.expert.reviewBoundary);
    dialogBody.append(hero, pains, applied, next, metrics, boundary);
  }

  async function loadReview(force = false) {
    if (cachedReview && !force) return cachedReview;
    if (isLoading) return null;
    isLoading = true;
    showLoading();
    try {
      const response = await fetch(catalogUrl, { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
      const catalog = await response.json();
      const review = catalog?.projects?.[repoName];
      if (!review) throw new Error("No review found for this demo");
      cachedReview = review;
      renderReview(review);
      liveRegion.textContent = `已載入 ${review.title} 的領域專家建議。`;
      return review;
    } catch (error) {
      showFailure();
      liveRegion.textContent = "無法載入領域專家建議。";
      return null;
    } finally {
      isLoading = false;
    }
  }

  function closeDialog() {
    if (!dialog?.open) return;
    dialog.close();
    document.documentElement.classList.remove("jv-domain-expert-is-open");
    trigger.setAttribute("aria-expanded", "false");
    (previousFocus instanceof HTMLElement ? previousFocus : trigger).focus();
  }

  async function openDialog() {
    previousFocus = document.activeElement;
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add("jv-domain-expert-is-open");
    trigger.setAttribute("aria-expanded", "true");
    dialog.querySelector(".jv-domain-expert__close").focus();
    await loadReview();
  }

  function onKeydown(event) {
    if (event.key !== "Tab" || !dialog?.open) return;
    const focusable = [...dialog.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function init() {
    if (document.getElementById("jv-domain-expert-trigger")) return;
    trigger = element("button", "jv-domain-expert-trigger");
    trigger.id = "jv-domain-expert-trigger";
    trigger.type = "button";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", "jv-domain-expert-dialog");
    trigger.setAttribute("aria-label", "開啟此專案的領域專家建議");
    trigger.append(icon("spark"), element("span", "jv-domain-expert-trigger__label", "領域專家建議"));
    trigger.addEventListener("click", openDialog);

    dialog = element("dialog", "jv-domain-expert");
    dialog.id = "jv-domain-expert-dialog";
    dialog.setAttribute("aria-labelledby", "jv-domain-expert-dialog-heading");
    const shell = element("div", "jv-domain-expert__shell");
    const topbar = element("header", "jv-domain-expert__topbar");
    const label = element("p", "jv-domain-expert__label", "JVision Domain Expert");
    label.id = "jv-domain-expert-dialog-heading";
    const actions = element("div", "jv-domain-expert__topbar-actions");
    const refresh = element("button", "jv-domain-expert__refresh", "重新載入");
    refresh.type = "button";
    refresh.addEventListener("click", () => loadReview(true));
    const close = element("button", "jv-domain-expert__close");
    close.type = "button";
    close.setAttribute("aria-label", "關閉領域專家建議");
    close.append(icon("close"));
    close.addEventListener("click", closeDialog);
    actions.append(refresh, close);
    topbar.append(label, actions);
    dialogBody = element("div", "jv-domain-expert__body");
    liveRegion = element("div", "jv-domain-expert__sr-only");
    liveRegion.setAttribute("aria-live", "polite");
    shell.append(topbar, dialogBody, liveRegion);
    dialog.append(shell);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog();
    });
    dialog.addEventListener("keydown", onKeydown);
    document.body.append(trigger, dialog);
  }

  const boot = () => window.setTimeout(init, 180);
  if (document.readyState === "complete") boot();
  else window.addEventListener("load", boot, { once: true });
})();
