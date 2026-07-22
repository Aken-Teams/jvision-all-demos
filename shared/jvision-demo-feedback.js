(() => {
  if (window.__jvisionDemoFeedbackLoaded) return;
  window.__jvisionDemoFeedbackLoaded = true;

  const toast = document.createElement("div");
  toast.className = "jv-action-feedback";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.setAttribute("aria-atomic", "true");
  toast.innerHTML = `
    <span class="jv-action-feedback__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6" /></svg>
    </span>
    <span class="jv-action-feedback__message"></span>`;

  const message = toast.querySelector(".jv-action-feedback__message");
  let hideTimer;

  function actionLabel(element) {
    const label = element.getAttribute("aria-label")
      || element.dataset.action
      || element.dataset.module
      || element.textContent;
    return String(label || "此操作").replace(/\s+/g, " ").trim().slice(0, 72) || "此操作";
  }

  function showFeedback(element) {
    if (!document.body.contains(toast)) document.body.append(toast);
    element.classList.remove("jv-action-pulse");
    requestAnimationFrame(() => element.classList.add("jv-action-pulse"));
    window.setTimeout(() => element.classList.remove("jv-action-pulse"), 190);

    message.textContent = `已收到操作：${actionLabel(element)}`;
    toast.dataset.visible = "true";
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => { toast.dataset.visible = "false"; }, 1800);
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("button, [role='button']") : null;
    if (!target || target.closest(".jv-action-feedback")) return;
    if (target.matches(":disabled") || target.getAttribute("aria-disabled") === "true" || target.dataset.jvFeedback === "off") return;
    window.setTimeout(() => showFeedback(target), 0);
  }, true);
})();
