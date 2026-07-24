(() => {
  const steps = [
    {
      selector: "#features",
      title: "確認品質管理範圍",
      text: "先查看供應商建檔、IQC、文件、評鑑與 MRB 改善等完整品質閉環。"
    },
    {
      selector: ".supplier-panel",
      title: "檢視高風險供應商",
      text: "從供應商分數、交付率與不良率找出需要優先追蹤的對象。"
    },
    {
      selector: ".demo-panel:nth-of-type(2)",
      title: "完成 IQC 批次判定",
      text: "選擇待檢批次，依結果執行合格、退回或轉入 MRB。"
    },
    {
      selector: ".demo-panel:nth-of-type(3)",
      title: "追蹤文件與綠色資料",
      text: "確認 RoHS、材料承認書與 COA 狀態，對缺件供應商發出補件通知。"
    },
    {
      selector: ".analytics-panel",
      title: "確認品質改善結果",
      text: "最後查看平均品質分數、待處理批次與改善中供應商，完成本次導覽。"
    }
  ];

  const style = document.createElement("style");
  style.textContent = `
    .sqm-tour{position:fixed;left:50%;bottom:18px;z-index:12000;width:min(720px,calc(100% - 28px));transform:translateX(-50%);display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:16px 18px;border:1px solid #f59e0b;border-radius:16px;background:#fffdf5;box-shadow:0 22px 60px rgba(15,23,42,.24);font-family:inherit}
    .sqm-tour[hidden]{display:none}.sqm-tour-index{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#d97706;color:#fff;font-weight:900}.sqm-tour h2,.sqm-tour p{margin:0}.sqm-tour h2{font-size:17px;color:#172554}.sqm-tour p{margin-top:5px;color:#6b4f1d;font-size:14px;line-height:1.5}.sqm-tour-actions{display:flex;gap:8px}.sqm-tour button{min-height:42px;padding:9px 14px;border-radius:10px;border:1px solid #1e40af;background:#fff;color:#1e40af;font:inherit;font-weight:800;cursor:pointer}.sqm-tour button[data-next]{background:#1e40af;color:#fff}.sqm-tour-focus{outline:4px solid rgba(245,158,11,.75)!important;outline-offset:6px;scroll-margin-top:28px}@media(max-width:680px){.sqm-tour{grid-template-columns:auto 1fr}.sqm-tour-actions{grid-column:1/-1}.sqm-tour-actions button{flex:1}}
  `;
  document.head.append(style);

  const tour = document.createElement("aside");
  tour.className = "sqm-tour";
  tour.hidden = true;
  tour.setAttribute("aria-live", "polite");
  tour.innerHTML = `
    <span class="sqm-tour-index">1</span>
    <div><h2></h2><p></p></div>
    <div class="sqm-tour-actions">
      <button type="button" data-close>結束導覽</button>
      <button type="button" data-next>下一步</button>
    </div>
  `;
  document.body.append(tour);

  let index = 0;
  let focused;
  const close = () => {
    focused?.classList.remove("sqm-tour-focus");
    tour.hidden = true;
  };
  const show = (nextIndex) => {
    focused?.classList.remove("sqm-tour-focus");
    index = Math.max(0, Math.min(nextIndex, steps.length - 1));
    const step = steps[index];
    focused = document.querySelector(step.selector);
    if (!focused) return close();
    focused.classList.add("sqm-tour-focus");
    focused.scrollIntoView({ behavior: "smooth", block: "center" });
    tour.querySelector(".sqm-tour-index").textContent = String(index + 1);
    tour.querySelector("h2").textContent = step.title;
    tour.querySelector("p").textContent = step.text;
    tour.querySelector("[data-next]").textContent = index === steps.length - 1 ? "完成" : "下一步";
    tour.hidden = false;
  };

  tour.querySelector("[data-close]").addEventListener("click", close);
  tour.querySelector("[data-next]").addEventListener("click", () => {
    if (index === steps.length - 1) close();
    else show(index + 1);
  });

  if (new URLSearchParams(location.search).get("mode") === "guided") {
    window.addEventListener("load", () => show(0), { once: true });
  }
})();
