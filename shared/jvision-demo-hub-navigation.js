(() => {
  const marker = "jv-demo-hub-link";
  const styleId = "jv-demo-hub-navigation-runtime-20260724";

  function injectStyle() {
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .jv-demo-hub-bar{position:sticky;top:0;z-index:9999;display:flex;align-items:center;min-height:64px;padding:10px max(14px,env(safe-area-inset-left));border-bottom:1px solid rgba(37,99,235,.13);background:rgba(255,255,255,.96);box-shadow:0 5px 18px rgba(15,23,42,.07);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
      .${marker}{position:static;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 14px;border:1px solid rgba(37,99,235,.24);border-radius:999px;background:#fff;color:#17326d!important;box-shadow:0 8px 22px rgba(15,23,42,.11);font:800 14px/1.1 Inter,"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif!important;letter-spacing:0!important;text-decoration:none!important;white-space:nowrap;transition:background .2s ease,box-shadow .2s ease}.${marker}:hover{background:#eff6ff;color:#1d4ed8!important;box-shadow:0 12px 28px rgba(37,99,235,.18)}.${marker}:focus-visible{outline:3px solid #93c5fd;outline-offset:3px}.${marker} svg{width:18px;height:18px;flex:0 0 auto}@media (prefers-reduced-motion:reduce){.${marker}{transition:none}}
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
    const bar = document.createElement("div");
    bar.className = "jv-demo-hub-bar";
    bar.setAttribute("role", "navigation");
    bar.setAttribute("aria-label", "Demo 導覽");
    bar.append(link);
    document.body.classList.add("jv-demo-hub-navigation-active");
    document.body.prepend(bar);
  }

  const scheduleMount = () => window.requestAnimationFrame(mount);
  const scheduleAfterHydration = () => {
    // Preserved Next.js exports hydrate their server-rendered body after
    // DOMContentLoaded. Prepending the Hub bar before hydration changes the
    // expected root HTML and triggers React error #418, so wait until the
    // page load boundary and one paint before mounting the external control.
    if (document.body?.classList.contains("jvision-next-legacy")) {
      if (document.readyState === "complete") {
        window.setTimeout(scheduleMount, 120);
      } else {
        window.addEventListener("load", () => window.setTimeout(scheduleMount, 120), { once: true });
      }
      // Remote assets can keep `load` pending; this delayed, idempotent fallback
      // keeps the navigation available without racing normal hydration.
      window.setTimeout(scheduleMount, 2400);
      return;
    }
    scheduleMount();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleAfterHydration, { once: true });
  } else {
    scheduleAfterHydration();
  }
})();
