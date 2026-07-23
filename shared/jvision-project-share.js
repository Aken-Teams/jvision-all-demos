(() => {
  const dialogId = "jv-project-share-dialog";
  const triggerId = "jv-project-share-trigger";
  const scopeClass = "jv-shared-project-mode";
  const repoMatch = window.location.pathname.match(/^\/demos\/([^/]+)/i);
  const repoName = repoMatch ? decodeURIComponent(repoMatch[1]).toLowerCase() : "";
  let generated = null;
  let pending = null;

  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="m8.6 10.5 6.8-4"></path><path d="m8.6 13.5 6.8 4"></path></svg>';

  function scopeMode() {
    return new URLSearchParams(window.location.search).get("shared") === "1";
  }

  function formatExpiry(value) {
    try {
      return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
    } catch {
      return "7 天內";
    }
  }

  function dialog() {
    return document.getElementById(dialogId);
  }

  function setStatus(message, state = "") {
    const node = dialog()?.querySelector(".jv-project-share-dialog__status");
    if (!node) return;
    node.textContent = message;
    node.dataset.state = state;
  }

  function setGenerated(result) {
    const panel = dialog();
    if (!panel) return;
    const field = panel.querySelector(".jv-project-share-dialog__field");
    const input = panel.querySelector(".jv-project-share-dialog__field input");
    const expiry = panel.querySelector(".jv-project-share-dialog__expiry");
    input.value = result.absoluteUrl;
    field.hidden = false;
    expiry.hidden = false;
    expiry.textContent = `此連結有效至 ${formatExpiry(result.expiresAt)}。`;
    setStatus("已建立專案專屬分享連結。");
  }

  async function createLink() {
    if (generated) return generated;
    if (pending) return pending;
    setStatus("正在建立安全分享連結…");
    pending = fetch("/api/share/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoName }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.url) throw new Error(data?.error || "目前無法建立分享連結");
        generated = { absoluteUrl: new URL(data.url, window.location.origin).href, expiresAt: data.expiresAt };
        setGenerated(generated);
        return generated;
      })
      .catch((error) => {
        setStatus(error.message || "目前無法建立分享連結", "error");
        throw error;
      })
      .finally(() => { pending = null; });
    return pending;
  }

  async function copyLink() {
    try {
      const link = await createLink();
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(link.absoluteUrl);
      else {
        const input = dialog().querySelector(".jv-project-share-dialog__field input");
        input.focus();
        input.select();
        document.execCommand("copy");
      }
      setStatus("分享連結已複製。接收者開啟後只會停留在此 Demo。");
    } catch { /* The visible status already explains the failure. */ }
  }

  async function nativeShare() {
    try {
      const link = await createLink();
      if (!navigator.share) return copyLink();
      await navigator.share({ title: document.title, text: "邀請你查看 JV Demo 專案", url: link.absoluteUrl });
      setStatus("已開啟系統分享功能。");
    } catch (error) {
      if (error?.name !== "AbortError") setStatus(error?.message || "無法開啟系統分享", "error");
    }
  }

  function closeDialog() {
    const panel = dialog();
    if (panel?.open) panel.close();
  }

  function openDialog() {
    const panel = dialog();
    if (!panel) return;
    if (typeof panel.showModal === "function") panel.showModal();
    else panel.setAttribute("open", "");
    createLink().catch(() => {});
  }

  function mount() {
    if (!repoName || document.getElementById(triggerId)) return;
    if (scopeMode()) document.body.classList.add(scopeClass);

    const trigger = document.createElement("button");
    trigger.id = triggerId;
    trigger.className = "jv-project-share-trigger";
    trigger.type = "button";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", dialogId);
    trigger.innerHTML = `${icon}<span>分享專案</span>`;
    trigger.addEventListener("click", openDialog);

    const panel = document.createElement("dialog");
    panel.id = dialogId;
    panel.className = "jv-project-share-dialog";
    panel.setAttribute("aria-labelledby", `${dialogId}-title`);
    panel.innerHTML = `<div class="jv-project-share-dialog__content"><header class="jv-project-share-dialog__header"><div><p class="jv-project-share-dialog__eyebrow">PROJECT SHARE</p><h2 id="${dialogId}-title">分享此 Demo</h2></div><button class="jv-project-share-dialog__close" type="button" aria-label="關閉分享視窗">×</button></header><p class="jv-project-share-dialog__description">產生有效期限為 7 天的專屬連結。接收者在此瀏覽器工作階段中，僅可瀏覽這個專案。</p><p class="jv-project-share-dialog__notice">分享模式只鎖定導覽範圍；此 Demo 原本仍是公開展示內容。</p><div class="jv-project-share-dialog__field" hidden><label for="jv-project-share-url">分享連結</label><input id="jv-project-share-url" type="text" readonly aria-label="專案分享連結" /></div><div class="jv-project-share-dialog__actions"><button type="button" data-variant="primary" data-action="copy">複製連結</button><button type="button" data-action="native">系統分享</button></div><p class="jv-project-share-dialog__status" role="status">準備建立分享連結。</p><p class="jv-project-share-dialog__expiry" hidden></p></div>`;
    panel.querySelector(".jv-project-share-dialog__close").addEventListener("click", closeDialog);
    panel.querySelector('[data-action="copy"]').addEventListener("click", copyLink);
    panel.querySelector('[data-action="native"]').addEventListener("click", nativeShare);
    panel.addEventListener("click", (event) => { if (event.target === panel) closeDialog(); });
    panel.addEventListener("close", () => trigger.focus({ preventScroll: true }));

    const badge = document.createElement("span");
    badge.className = "jv-project-share-dialog__scope";
    badge.textContent = "限此專案瀏覽";
    document.body.append(trigger, panel, badge);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
