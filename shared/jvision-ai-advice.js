(() => {
  const marker = "data-jv-ai-advice";
  const actionableSelector = '[data-action="run-ai"], #fmRunAi';
  const panelId = "jv-ai-advice-panel";
  const fallbackId = "jv-ai-advice-trigger";
  const pilotConfigs = {
    "jvision-ai-case-001-production-scheduler": {
      role: "生管專員",
      tasks: ["找出交期與產能風險", "解釋目前排程異常", "提出可執行的調度順序"],
    },
    "jvision-crm": {
      role: "業務主管",
      tasks: ["找出高風險商機", "解釋銷售管線變化", "產生本週跟進優先順序"],
    },
    "jvision-customer-support-platform": {
      role: "客服主管",
      tasks: ["找出需要升級的案件", "分析逾時與情緒風險", "產生客服交接摘要"],
    },
  };
  const svg = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.55 5.45L19 10l-5.45 1.55L12 17l-1.55-5.45L5 10l5.45-1.55L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>';

  function clean(value, limit = 320) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
  }

  function repoName() {
    return decodeURIComponent(location.pathname.match(/\/demos\/([^/]+)/)?.[1] || "");
  }

  function pilotConfig() {
    return pilotConfigs[repoName()] || null;
  }

  function projectDetails() {
    const title = clean(document.querySelector("h1")?.textContent || document.title.split(/[|｜]/)[0], 140);
    const description = clean(document.querySelector('meta[name="description"]')?.content || document.querySelector("h1")?.parentElement?.querySelector("p")?.textContent, 360);
    return { title: title || "JV Demo 專案", description, repoName: repoName() };
  }

  function activeModule() {
    return clean(document.body.dataset.activeModule || document.querySelector('[aria-current="page"], [aria-selected="true"], .active')?.textContent || "總覽", 100);
  }

  function pageContext() {
    const parts = [];
    for (const element of document.querySelectorAll("h1,h2,h3,h4,p,li,td,th,small,strong,span")) {
      if (element.closest("#" + panelId) || element.closest("button")) continue;
      const value = clean(element.textContent, 180);
      if (value && !parts.includes(value)) parts.push(value);
      if (parts.join("\n").length > 3200) break;
    }
    return parts.join("\n").slice(0, 3600);
  }

  function collectEvidence() {
    const results = [];
    const seen = new Set();
    const selectors = [
      "[data-metric]", "[data-kpi]", "[data-value]", ".metric", ".kpi", ".stat", ".card",
      "table tbody tr", "[role='row']", "[aria-selected='true']", ".selected", ".active",
    ];
    for (const element of document.querySelectorAll(selectors.join(","))) {
      if (element.closest("#" + panelId) || element.closest("nav")) continue;
      const value = clean(element.textContent, 220);
      if (!value || value.length < 3 || seen.has(value)) continue;
      const heading = element.querySelector("h2,h3,h4,th,strong,[data-label]")?.textContent;
      const region = element.closest("section,article,[aria-label]");
      results.push({
        label: clean(element.dataset.metric || element.dataset.kpi || element.dataset.label || heading || `畫面資料 ${results.length + 1}`, 100),
        value,
        source: clean(region?.getAttribute("aria-label") || region?.querySelector("h2,h3")?.textContent || activeModule(), 120),
      });
      seen.add(value);
      if (results.length >= 12) break;
    }
    if (!results.length) {
      const fallback = pageContext().split("\n").filter(Boolean).slice(0, 8);
      fallback.forEach((value, index) => results.push({ label: `畫面內容 ${index + 1}`, value, source: activeModule() }));
    }
    return results;
  }

  function getPanel() {
    let panel = document.getElementById(panelId);
    if (panel) return panel;
    panel = document.createElement("section");
    panel.id = panelId;
    panel.className = "jv-ai-advice-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-live", "polite");
    panel.setAttribute("aria-label", "AI 情境分析");
    document.body.append(panel);
    return panel;
  }

  function panelHeader(panel, headline) {
    const header = document.createElement("div");
    header.className = "jv-ai-advice-panel__header";
    const heading = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "jv-ai-advice-panel__eyebrow";
    eyebrow.textContent = "AI 情境決策助理";
    const title = document.createElement("h2");
    title.textContent = headline;
    heading.append(eyebrow, title);
    const close = document.createElement("button");
    close.type = "button";
    close.className = "jv-ai-advice-panel__close";
    close.setAttribute("aria-label", "關閉 AI 分析");
    close.textContent = "×";
    close.addEventListener("click", () => { panel.hidden = true; });
    header.append(heading, close);
    panel.append(header);
  }

  function setPanel({ headline = "AI 情境分析", summary = "", actions = [], evidence = [], risk = "medium", confidence = 0, requiresConfirmation = true, loading = false, error = false } = {}) {
    const panel = getPanel();
    panel.hidden = false;
    panel.replaceChildren();
    panelHeader(panel, headline);
    if (!loading && !error) {
      const meta = document.createElement("div");
      meta.className = "jv-ai-advice-panel__meta";
      const riskLabel = document.createElement("span");
      riskLabel.className = "jv-ai-advice-panel__risk";
      riskLabel.dataset.risk = risk;
      riskLabel.textContent = ({ high: "高風險", low: "低風險", medium: "需要留意" })[risk] || "需要留意";
      const confidenceLabel = document.createElement("span");
      confidenceLabel.className = "jv-ai-advice-panel__confidence";
      confidenceLabel.textContent = `信心程度 ${Math.round(Number(confidence || 0) * 100)}%`;
      meta.append(riskLabel, confidenceLabel);
      panel.append(meta);
    }
    const text = document.createElement("p");
    text.className = loading || error ? "jv-ai-advice-panel__status" : "jv-ai-advice-panel__summary";
    text.dataset.state = error ? "error" : "";
    text.textContent = summary;
    panel.append(text);
    if (evidence.length) {
      const heading = document.createElement("h3");
      heading.className = "jv-ai-advice-panel__section-title";
      heading.textContent = "判斷依據";
      const list = document.createElement("dl");
      list.className = "jv-ai-advice-panel__evidence";
      evidence.forEach((item) => {
        const term = document.createElement("dt");
        term.textContent = `${item.label} · ${item.source || "目前畫面"}`;
        const detail = document.createElement("dd");
        detail.textContent = item.value;
        list.append(term, detail);
      });
      panel.append(heading, list);
    }
    if (actions.length) {
      const heading = document.createElement("h3");
      heading.className = "jv-ai-advice-panel__section-title";
      heading.textContent = "建議下一步";
      const list = document.createElement("ol");
      list.className = "jv-ai-advice-panel__actions";
      actions.forEach((action) => { const item = document.createElement("li"); item.textContent = action; list.append(item); });
      panel.append(heading, list);
    }
    if (!loading && !error && requiresConfirmation) {
      const note = document.createElement("p");
      note.className = "jv-ai-advice-panel__confirmation";
      note.textContent = "AI 只提供建議；套用或提交任何變更前仍需由你確認。";
      panel.append(note);
    }
    return panel;
  }

  function showTaskMenu(button) {
    const config = pilotConfig();
    if (!config) return requestAdvice(button, clean(button.textContent || "分析目前狀況", 100));
    const panel = getPanel();
    panel.hidden = false;
    panel.replaceChildren();
    panelHeader(panel, `${config.role}的分析任務`);
    const intro = document.createElement("p");
    intro.className = "jv-ai-advice-panel__summary";
    intro.textContent = "選擇一項任務，AI 會引用目前畫面的資料並提出可驗證建議。";
    const tasks = document.createElement("div");
    tasks.className = "jv-ai-advice-panel__tasks";
    config.tasks.forEach((task) => {
      const taskButton = document.createElement("button");
      taskButton.type = "button";
      taskButton.textContent = task;
      taskButton.addEventListener("click", () => requestAdvice(button, task));
      tasks.append(taskButton);
    });
    panel.append(intro, tasks);
  }

  function markActionableControls(root = document) {
    root.querySelectorAll(actionableSelector).forEach((button) => {
      button.setAttribute(marker, "true");
      button.setAttribute("aria-haspopup", "dialog");
    });
  }

  function addFallbackWhenNeeded() {
    const hasVisibleAction = [...document.querySelectorAll(actionableSelector)].some((element) => element instanceof HTMLButtonElement && !element.disabled && element.getClientRects().length > 0);
    if (hasVisibleAction || document.getElementById(fallbackId)) return;
    const button = document.createElement("button");
    button.id = fallbackId;
    button.type = "button";
    button.className = "jv-ai-advice-trigger";
    button.setAttribute(marker, "true");
    button.setAttribute("aria-haspopup", "dialog");
    button.innerHTML = `${svg}<span>${pilotConfig() ? "AI 情境分析" : "取得 AI 建議"}</span>`;
    document.body.append(button);
  }

  async function requestAdvice(button, task) {
    if (button.dataset.jvAiBusy === "true") return;
    button.dataset.jvAiBusy = "true";
    button.classList.add("jv-ai-advice-busy");
    button.setAttribute("aria-busy", "true");
    setPanel({ loading: true, summary: "正在讀取目前畫面資料並整理可追溯的分析…" });
    try {
      const config = pilotConfig();
      const evidence = collectEvidence();
      const response = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: projectDetails(),
          module: activeModule(),
          action: clean(button.textContent || "AI 情境分析", 100),
          task: clean(task || button.textContent || "分析目前狀況", 120),
          role: config?.role || "一般使用者",
          evidence,
          context: pageContext(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.advice) throw new Error(data?.error || "AI 分析暫時無法使用");
      setPanel(data.advice);
    } catch (error) {
      setPanel({ headline: "暫時無法取得 AI 分析", summary: clean(error.message, 180) || "請稍後再試。", error: true });
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
      for (const mutation of mutations) mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.matches?.(actionableSelector)) node.setAttribute(marker, "true");
        markActionableControls(node);
      });
      addFallbackWhenNeeded();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", (event) => {
      const button = event.target.closest?.(`[${marker}="true"]`);
      if (button) showTaskMenu(button);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
