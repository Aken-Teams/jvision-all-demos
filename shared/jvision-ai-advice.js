(() => {
  const marker = "data-jv-ai-advice";
  const actionableSelector = '[data-action="run-ai"], #fmRunAi';
  const panelId = "jv-ai-advice-panel";
  const fallbackId = "jv-ai-advice-trigger";

  const svg = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.55 5.45L19 10l-5.45 1.55L12 17l-1.55-5.45L5 10l5.45-1.55L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>';

  function clean(value, limit = 320) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
  }

  function projectDetails() {
    const title = clean(document.querySelector("h1")?.textContent || document.title.replace(/\s*[｜|].*$/, ""), 140);
    const description = clean(document.querySelector('meta[name="description"]')?.content || document.querySelector("h1")?.parentElement?.querySelector("p")?.textContent, 360);
    return { title: title || "JV Demo 系統", description };
  }

  function pageContext() {
    const blocked = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "BUTTON", "INPUT", "TEXTAREA", "SELECT"]);
    const parts = [];
    for (const element of document.querySelectorAll("h1,h2,h3,h4,p,li,td,th,small,strong,span")) {
      if (blocked.has(element.tagName) || element.closest("#" + panelId)) continue;
      const value = clean(element.textContent, 180);
      if (value && !parts.includes(value)) parts.push(value);
      if (parts.join("\n").length > 3600) break;
    }
    return parts.join("\n").slice(0, 4000);
  }

  function getPanel() {
    let panel = document.getElementById(panelId);
    if (panel) return panel;

    panel = document.createElement("section");
    panel.id = panelId;
    panel.className = "jv-ai-advice-panel";
    panel.setAttribute("aria-live", "polite");
    panel.setAttribute("aria-label", "AI 現場建議");
    document.body.append(panel);
    return panel;
  }

  function setPanel({ headline = "AI 現場建議", summary = "", actions = [], risk = "medium", loading = false, error = false } = {}) {
    const panel = getPanel();
    panel.hidden = false;
    panel.replaceChildren();

    const header = document.createElement("div");
    header.className = "jv-ai-advice-panel__header";
    const heading = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "jv-ai-advice-panel__eyebrow";
    eyebrow.textContent = "AI · 即時分析";
    const title = document.createElement("h2");
    title.textContent = headline;
    heading.append(eyebrow, title);
    const close = document.createElement("button");
    close.type = "button";
    close.className = "jv-ai-advice-panel__close";
    close.setAttribute("aria-label", "關閉 AI 建議");
    close.textContent = "×";
    close.addEventListener("click", () => { panel.hidden = true; });
    header.append(heading, close);
    panel.append(header);

    if (!loading && !error) {
      const riskLabel = document.createElement("span");
      riskLabel.className = "jv-ai-advice-panel__risk";
      riskLabel.dataset.risk = risk;
      riskLabel.textContent = ({ high: "高優先", low: "可持續追蹤", medium: "建議留意" })[risk] || "建議留意";
      panel.append(riskLabel);
    }

    const text = document.createElement("p");
    text.className = loading || error ? "jv-ai-advice-panel__status" : "jv-ai-advice-panel__summary";
    text.dataset.state = error ? "error" : "";
    text.textContent = summary;
    panel.append(text);

    if (actions.length) {
      const list = document.createElement("ol");
      list.className = "jv-ai-advice-panel__actions";
      actions.forEach((action) => {
        const item = document.createElement("li");
        item.textContent = action;
        list.append(item);
      });
      panel.append(list);
    }
    return panel;
  }

  function markActionableControls(root = document) {
    root.querySelectorAll(actionableSelector).forEach((button) => {
      button.setAttribute(marker, "true");
      button.setAttribute("aria-haspopup", "dialog");
    });
  }

  function addFallbackWhenNeeded() {
    const hasVisibleAction = [...document.querySelectorAll(actionableSelector)].some((element) => (
      element instanceof HTMLButtonElement && !element.disabled && element.getClientRects().length > 0
    ));
    if (hasVisibleAction || document.getElementById(fallbackId)) return;
    const button = document.createElement("button");
    button.id = fallbackId;
    button.type = "button";
    button.className = "jv-ai-advice-trigger";
    button.setAttribute(marker, "true");
    button.setAttribute("aria-haspopup", "dialog");
    button.innerHTML = `${svg}<span>取得 AI 建議</span>`;
    document.body.append(button);
  }

  async function requestAdvice(button) {
    if (button.dataset.jvAiBusy === "true") return;
    button.dataset.jvAiBusy = "true";
    button.classList.add("jv-ai-advice-busy");
    button.setAttribute("aria-busy", "true");
    setPanel({ loading: true, summary: "正在依目前 Demo 資料整理可執行建議…" });

    try {
      const project = projectDetails();
      const response = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          module: clean(document.body.dataset.activeModule || "總覽", 100),
          action: clean(button.textContent || "取得 AI 建議", 100),
          context: pageContext(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.advice) throw new Error(data?.error || "AI 建議暫時無法取得");
      setPanel(data.advice);
    } catch (error) {
      setPanel({ headline: "暫時無法取得 AI 建議", summary: clean(error.message, 180) || "請稍後再試。", error: true });
    } finally {
      button.dataset.jvAiBusy = "false";
      button.classList.remove("jv-ai-advice-busy");
      button.removeAttribute("aria-busy");
    }
  }

  function init() {
    markActionableControls();
    addFallbackWhenNeeded();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.matches?.(actionableSelector)) node.setAttribute(marker, "true");
          markActionableControls(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("click", (event) => {
      const button = event.target.closest?.(`[${marker}="true"]`);
      if (button) requestAdvice(button);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
