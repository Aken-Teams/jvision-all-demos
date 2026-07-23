(function jvisionLegacyTaskFilter() {
  "use strict";

  function boot() {
    const taskList = document.querySelector("#tasks");
    if (!taskList || document.querySelector("[data-jvision-task-filter]")) return;
    const panel = taskList.closest(".panel") || taskList.parentElement;
    if (!panel) return;

    const controls = document.createElement("section");
    controls.className = "jv-legacy-task-filter";
    controls.dataset.jvisionTaskFilter = "true";
    controls.innerHTML = `
      <style>
        .jv-legacy-task-filter { margin: 0 0 16px; padding: 14px; border: 1px solid var(--line, rgba(148,163,184,.28)); border-radius: 18px; background: rgba(255,255,255,.055); }
        .jv-legacy-task-filter h3 { margin: 0 0 10px; color: var(--text, #eef6ff); font-size: 14px; }
        .jv-legacy-filter-controls { display: grid; grid-template-columns: minmax(0, 1fr) 132px; gap: 10px; }
        .jv-legacy-task-filter input, .jv-legacy-task-filter select { width: 100%; min-height: 44px; padding: 0 12px; border: 1px solid var(--line, rgba(148,163,184,.28)); border-radius: 12px; color: var(--text, #eef6ff); background: rgba(7,17,31,.64); font: inherit; }
        .jv-legacy-task-filter option { color: #10243e; background: #fff; }
        .jv-legacy-filter-status { min-height: 1.5em; margin: 9px 0 0; color: var(--muted, #b8c6d8); font-size: 13px; }
        .jv-legacy-visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        @media (max-width: 480px) { .jv-legacy-filter-controls { grid-template-columns: 1fr; } }
      </style>
      <h3>快速篩選互動任務</h3>
      <div class="jv-legacy-filter-controls">
        <label><span class="jv-legacy-visually-hidden">搜尋任務</span><input type="search" aria-label="搜尋互動任務" placeholder="搜尋任務或 AI 功能" autocomplete="off" /></label>
        <label><span class="jv-legacy-visually-hidden">任務狀態</span><select aria-label="依任務狀態篩選"><option value="all">全部任務</option><option value="selected">已選擇</option><option value="pending">尚未選擇</option></select></label>
      </div>
      <p class="jv-legacy-filter-status" aria-live="polite"></p>`;
    panel.insertBefore(controls, taskList);

    const search = controls.querySelector("input");
    const state = controls.querySelector("select");
    const status = controls.querySelector(".jv-legacy-filter-status");
    const items = () => [...taskList.querySelectorAll(":scope > li")];
    const normalize = (value) => String(value || "").toLocaleLowerCase("zh-Hant").replace(/\s+/g, "").trim();
    const applyFilter = () => {
      const query = normalize(search.value);
      let visible = 0;
      for (const item of items()) {
        const button = item.querySelector("button");
        const selected = Boolean(button?.classList.contains("active"));
        const matchesQuery = !query || normalize(item.textContent).includes(query);
        const matchesState = state.value === "all" || (state.value === "selected" && selected) || (state.value === "pending" && !selected);
        const show = matchesQuery && matchesState;
        item.hidden = !show;
        if (show) visible += 1;
      }
      status.textContent = visible ? `顯示 ${visible} 個可操作任務。` : "沒有符合條件的任務，請調整搜尋或狀態。";
    };
    search.addEventListener("input", applyFilter);
    state.addEventListener("change", applyFilter);
    taskList.addEventListener("click", () => setTimeout(applyFilter, 0));
    applyFilter();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
