(() => {
  const marker = "jv-demo-hub-link";
  const styleId = "jv-demo-hub-navigation-runtime-20260724";

  function injectStyle() {
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      body.jv-demo-hub-navigation-active{padding-bottom:max(76px,calc(env(safe-area-inset-bottom) + 68px))!important}
      .${marker}{position:fixed;z-index:9999;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 14px;border:1px solid rgba(37,99,235,.24);border-radius:999px;background:rgba(255,255,255,.94);color:#17326d!important;box-shadow:0 12px 28px rgba(15,23,42,.16);font:800 14px/1.1 Inter,"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif!important;letter-spacing:0!important;text-decoration:none!important;white-space:nowrap;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:background .2s ease,box-shadow .2s ease}.${marker}:hover{background:#eff6ff;color:#1d4ed8!important;box-shadow:0 16px 34px rgba(37,99,235,.23)}.${marker}:focus-visible{outline:3px solid #93c5fd;outline-offset:3px}.${marker} svg{width:18px;height:18px;flex:0 0 auto}@media (prefers-reduced-motion:reduce){.${marker}{transition:none}}
    `;
    document.head.append(style);
  }

  function mount() {
    if (document.querySelector(`.${marker}`)) return;
    injectStyle();
    const link = document.createElement("a");
    link.className = marker;
    link.href = "../../";
    link.setAttribute("aria-label", "回到 JV Demo 網站");
    link.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/><path d="M9 12h11"/></svg><span>返回專案首頁</span>`;
    const placeLink = () => {
      const mobile = window.matchMedia("(max-width: 640px)").matches;
      link.style.setProperty("top", "auto", "important");
      link.style.setProperty("right", "auto", "important");
      link.style.setProperty("bottom", "max(14px, env(safe-area-inset-bottom))", "important");
      link.style.setProperty("left", mobile ? "50%" : "max(14px, env(safe-area-inset-left))", "important");
      link.style.setProperty("transform", mobile ? "translateX(-50%)" : "none", "important");
    };
    document.body.classList.add("jv-demo-hub-navigation-active");
    document.body.append(link);
    placeLink();
    window.addEventListener("resize", placeLink, { passive: true });
  }

  // Mount as soon as the document is ready. Some preserved pages reference
  // remote images or scripts whose load event may be slow or never arrive;
  // waiting for the full load event would leave the return control missing.
  const scheduleMount = () => window.requestAnimationFrame(mount);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleMount, { once: true });
  } else {
    scheduleMount();
  }
  // Idempotent fallback for unusual legacy documents that replace body content.
  window.setTimeout(mount, 1200);
})();
