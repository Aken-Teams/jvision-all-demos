(() => {
  if (!location.pathname.includes("/demos/jvision-hris/")) return;

  const profiles = {
    "林佳穎": { id: "JV-1008", email: "chiaying.lin@jvision.demo", phone: "02-2658-0188 #218", manager: "產品長 陳志明", start: "2022/03/14", location: "台北總部", insurance: "勞健保正常", lastChange: "2026/04/01 調薪 4.2%" },
    "陳柏宇": { id: "JV-1042", email: "boyu.chen@jvision.demo", phone: "02-2658-0188 #306", manager: "研發經理 黃子維", start: "2026/05/06", location: "台北總部", insurance: "勞健保正常", lastChange: "2026/05/06 新人報到" },
    "王怡君": { id: "JV-1021", email: "yijun.wang@jvision.demo", phone: "02-2658-0188 #112", manager: "人資經理 林雅婷", start: "2023/08/21", location: "新竹辦公室", insurance: "勞健保正常", lastChange: "2026/01/01 職務調整" }
  };
  const candidateProfiles = {
    "張凱翔": { experience: "4 年數據分析與 BI 專案經驗", source: "104 人力銀行", interview: "7/29 14:00｜線上面試", owner: "招募專員 王怡君", education: "國立臺北大學 統計學系", skills: "SQL、Python、Power BI、數據建模", history: "曾負責零售會員分析與營運儀表板，帶領 2 人分析小組。", note: "SQL 與視覺化經驗符合需求，待確認跨部門溝通能力。" },
    "李宜蓁": { experience: "6 年客服團隊管理經驗", source: "員工推薦", interview: "7/30 10:30｜台北會議室 B", owner: "客服經理 陳志明", education: "輔仁大學 企業管理學系", skills: "客服營運、排班管理、SLA、客訴處理", history: "管理 18 人客服團隊，曾將平均回覆時間降低 26%。", note: "管理經驗完整，主管複試將確認排班與績效管理方式。" },
    "許哲維": { experience: "5 年 Node.js 與雲端平台經驗", source: "LinkedIn", interview: "已完成技術面試", owner: "研發經理 黃子維", education: "國立高雄科技大學 資訊工程系", skills: "Node.js、TypeScript、AWS、PostgreSQL", history: "參與 SaaS 平台後端重構與高流量 API 效能改善。", note: "技術評分優良，目前等待薪資條件與錄取簽核。" }
  };

  const style = document.createElement("style");
  style.textContent = `
    #payroll tbody tr{cursor:pointer;transition:background .18s ease,box-shadow .18s ease}
    #payroll tbody tr:hover,#payroll tbody tr:focus{background:#eef7ed!important;box-shadow:inset 4px 0 #0f513f;outline:0}
    #payroll tbody tr td:first-child{font-weight:800}
    #payroll tbody tr td:last-child::after{content:"查看明細";display:inline-block;margin-left:14px;color:#0f513f;font-size:12px;font-weight:800}
    .jv-employee-dialog{width:min(720px,calc(100% - 28px));padding:0;border:0;border-radius:22px;background:#fffdf8;color:#173c36;box-shadow:0 28px 80px rgba(21,54,46,.3)}
    .jv-employee-dialog::backdrop{background:rgba(18,38,34,.46);backdrop-filter:blur(3px)}
    .jv-employee-head{display:flex;justify-content:space-between;gap:20px;padding:24px 26px 18px;border-bottom:1px solid #dbe7df}
    .jv-employee-head p{margin:0 0 5px;color:#5c766f;font-size:13px;font-weight:800;letter-spacing:.08em}.jv-employee-head h2{margin:0;font-size:28px}
    .jv-employee-close{display:grid;place-items:center;width:44px;height:44px;padding:0;border:1px solid #c9d9d0;border-radius:50%;background:#fff;color:#173c36;font:700 28px/1 Arial,sans-serif;cursor:pointer}
    .jv-employee-close:hover{border-color:#0f513f;background:#eef7f2}.jv-employee-close:focus-visible{outline:3px solid #9bc9b8;outline-offset:3px}
    .jv-employee-body{padding:22px 26px 26px}.jv-employee-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
    .jv-employee-summary article{padding:14px;border:1px solid #dce8e1;border-radius:14px;background:#f4f8f4}.jv-employee-summary span,.jv-employee-details dt{color:#6a7f79;font-size:13px}
    .jv-employee-summary strong{display:block;margin-top:5px;font-size:17px}.jv-employee-details{display:grid;grid-template-columns:140px 1fr;gap:11px 18px;margin:0;padding:18px;border:1px solid #dce8e1;border-radius:14px}.jv-employee-details dd{margin:0;font-weight:700}
    .jv-payroll-slip{margin-top:16px;padding:18px;border:1px solid #dce8e1;border-radius:14px;background:#f7faf7}.jv-payroll-slip h3{margin:0 0 4px;font-size:17px}.jv-payroll-slip>p{margin:0 0 13px;color:#6a7f79;font-size:12px}.jv-payroll-lines{display:grid;gap:8px}.jv-payroll-lines div{display:flex;justify-content:space-between;gap:18px}.jv-payroll-lines span{color:#60756f}.jv-payroll-lines .deduction strong{color:#a33a3a}.jv-payroll-lines .net{margin-top:5px;padding-top:11px;border-top:1px solid #cdded5;font-size:17px}
    .jv-employee-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.jv-employee-actions button{min-height:42px;padding:9px 15px;border:1px solid #abc4b7;border-radius:11px;background:#fff;color:#174d3d;font-weight:800;cursor:pointer}.jv-employee-actions button.primary{border-color:#0f513f;background:#0f513f;color:#fff}
    .jv-candidate-detail{margin-top:16px;padding:18px;border:1px solid #cfe0d6;border-radius:16px;background:#f7faf7}.jv-candidate-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}.jv-candidate-detail-head p{margin:0 0 4px;color:#648078;font-size:12px;font-weight:800;letter-spacing:.08em}.jv-candidate-detail-head h3{margin:0;font-size:22px}.jv-candidate-score{display:grid;place-items:center;min-width:54px;height:54px;border-radius:50%;background:#0f513f;color:#fff;font-size:19px;font-weight:900}.jv-candidate-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.jv-candidate-grid div{padding:11px;border-radius:11px;background:#fff;border:1px solid #dce7df}.jv-candidate-grid span{display:block;color:#6b7f79;font-size:12px}.jv-candidate-grid strong{display:block;margin-top:4px}.jv-candidate-note{margin:12px 0 0;padding:12px;border-radius:11px;background:#edf5ef;color:#35574e;line-height:1.55}.jv-candidate-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:13px}.jv-candidate-actions button{min-height:40px;padding:8px 13px;border:1px solid #a9c3b6;border-radius:10px;background:#fff;color:#174d3d;font-weight:800;cursor:pointer}.jv-candidate-actions .primary{border-color:#0f513f;background:#0f513f;color:#fff}.jv-candidate-actions button:disabled{cursor:default;opacity:1;border-color:#cbd8d1;background:#e8efeb;color:#5f746d}
    @media(max-width:600px){.jv-employee-summary{grid-template-columns:1fr}.jv-employee-details{grid-template-columns:1fr}.jv-employee-details dt{margin-top:5px}}
  `;
  const dialog = document.createElement("dialog");
  dialog.className = "jv-employee-dialog";
  const ensureMounted = () => {
    if (!style.isConnected) document.head.append(style);
    if (!dialog.isConnected) document.body.append(dialog);
  };
  ensureMounted();

  const openDetails = row => {
    ensureMounted();
    const cells = [...row.cells].map(cell => cell.innerText.trim().replace("查看明細", "").trim());
    const [name, role, team, salary, status, leave] = cells;
    const grossSalary = Number(salary.replace(/[^\d]/g, "")) || 0;
    const laborInsurance = Math.round(grossSalary * 0.016);
    const healthInsurance = Math.round(grossSalary * 0.0155);
    const estimatedNet = grossSalary - laborInsurance - healthInsurance;
    const money = value => `NT$ ${value.toLocaleString("zh-TW")}`;
    const profile = profiles[name] || {
      id: `JV-${String(Math.abs([...name].reduce((sum, char) => sum + char.charCodeAt(0), 0))).slice(-4)}`,
      email: "待補員工信箱", phone: "待補聯絡分機", manager: `${team}主管`,
      start: "待確認", location: "待確認", insurance: "待建立", lastChange: "新建員工資料"
    };
    dialog.innerHTML = `
      <div class="jv-employee-head"><div><p>EMPLOYEE PROFILE · ${profile.id}</p><h2>${name}</h2></div><button class="jv-employee-close" aria-label="關閉明細" title="關閉">×</button></div>
      <div class="jv-employee-body">
        <div class="jv-employee-summary"><article><span>職稱／部門</span><strong>${role} · ${team}</strong></article><article><span>任職狀態</span><strong>${status}</strong></article><article><span>剩餘休假</span><strong>${leave}</strong></article></div>
        <dl class="jv-employee-details"><dt>公司信箱</dt><dd>${profile.email}</dd><dt>聯絡分機</dt><dd>${profile.phone}</dd><dt>直屬主管</dt><dd>${profile.manager}</dd><dt>到職日期</dt><dd>${profile.start}</dd><dt>工作地點</dt><dd>${profile.location}</dd><dt>本月應發薪資</dt><dd>${salary}（稅前）</dd><dt>投保狀態</dt><dd>已投保｜員工自付額於薪資單扣除</dd><dt>最近異動</dt><dd>${profile.lastChange}</dd></dl>
        <section class="jv-payroll-slip" aria-label="本月薪資試算"><h3>本月薪資試算</h3><p>以下為 Demo 比例試算，正式金額仍依投保級距、眷屬與個人申報資料計算。</p><div class="jv-payroll-lines"><div><span>固定薪資（應發）</span><strong>${money(grossSalary)}</strong></div><div class="deduction"><span>勞保員工自付（Demo 試算）</span><strong>− ${money(laborInsurance)}</strong></div><div class="deduction"><span>健保員工自付（Demo 試算）</span><strong>− ${money(healthInsurance)}</strong></div><div><span>所得稅／其他扣款</span><strong>依個人資料計算</strong></div><div class="net"><span>預估實領（未含所得稅及其他扣款）</span><strong>${money(estimatedNet)}</strong></div></div></section>
        <div class="jv-employee-actions"><button data-employee-note>新增人事紀錄</button><button class="primary" data-employee-edit>編輯員工資料</button></div>
      </div>`;
    dialog.querySelector(".jv-employee-close").addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-employee-note]").addEventListener("click", event => { event.currentTarget.textContent = "已建立待辦紀錄"; });
    dialog.querySelector("[data-employee-edit]").addEventListener("click", event => { event.currentTarget.textContent = "已切換為編輯模式"; });
    dialog.showModal();
  };
  const openCandidateResume = () => {
    ensureMounted();
    const heading = document.querySelector(".jv-candidate-detail h3")?.textContent || "";
    const [name = "候選人", role = ""] = heading.split(" · ");
    const profile = candidateProfiles[name] || { experience:"履歷資料待補", source:"招募平台", interview:"待安排", owner:"招募團隊", education:"待補", skills:"待補", history:"待補", note:"請由招募人員補充面試紀錄。" };
    const stage = document.querySelector(".jv-candidate-detail-head p")?.textContent?.replace("目前選取｜", "") || "";
    const score = document.querySelector(".jv-candidate-score")?.textContent || "--";
    dialog.innerHTML = `
      <div class="jv-employee-head"><div><p>CANDIDATE RESUME · ${stage}</p><h2>${name}｜${role}</h2></div><button class="jv-employee-close" aria-label="關閉履歷" title="關閉">×</button></div>
      <div class="jv-employee-body">
        <div class="jv-employee-summary"><article><span>履歷評分</span><strong>${score} 分</strong></article><article><span>相關經歷</span><strong>${profile.experience}</strong></article><article><span>履歷來源</span><strong>${profile.source}</strong></article></div>
        <dl class="jv-employee-details"><dt>最高學歷</dt><dd>${profile.education}</dd><dt>專業技能</dt><dd>${profile.skills}</dd><dt>經歷摘要</dt><dd>${profile.history}</dd><dt>面試安排</dt><dd>${profile.interview}</dd><dt>招募負責人</dt><dd>${profile.owner}</dd><dt>招募評估</dt><dd>${profile.note}</dd></dl>
        <div class="jv-employee-actions"><button data-resume-note>新增面試紀錄</button><button class="primary" data-resume-advance ${stage==="入職準備"?"disabled":""}>${stage==="入職準備"?"已完成招募流程":"推進至下一階段"}</button></div>
      </div>`;
    dialog.querySelector(".jv-employee-close").addEventListener("click", () => dialog.close());
    dialog.querySelector("[data-resume-note]").addEventListener("click", event => { event.currentTarget.textContent = "已建立面試紀錄"; });
    dialog.querySelector("[data-resume-advance]").addEventListener("click", () => {
      if (stage === "入職準備") return;
      document.querySelector("#hiring .button-row button")?.click();
      dialog.close();
      setTimeout(() => updateCandidate(document.querySelector(".candidate-list > button.active")), 180);
    });
    dialog.showModal();
  };

  document.addEventListener("click", event => {
    const row = event.target.closest("#payroll tbody tr");
    if (row) openDetails(row);
    const candidate = event.target.closest(".candidate-list > button");
    if (candidate) setTimeout(() => updateCandidate(candidate), 0);
    if (event.target.closest("[data-candidate-resume]")) openCandidateResume();
    if (event.target.closest("[data-candidate-advance]")) {
      if (event.target.closest("[data-candidate-advance]").disabled) return;
      document.querySelector("#hiring .button-row button")?.click();
      const refresh = () => updateCandidate(document.querySelector(".candidate-list > button.active"));
      setTimeout(refresh, 120);
      setTimeout(refresh, 320);
    }
  });
  document.addEventListener("keydown", event => {
    const row = event.target.closest?.("#payroll tbody tr");
    if (row && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openDetails(row); }
  });
  const markRows = () => document.querySelectorAll("#payroll tbody tr").forEach(row => {
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `查看 ${row.cells[0]?.innerText || "員工"} 的完整資料`);
  });
  const updateCandidate = button => {
    if (!button) return;
    const name = button.querySelector("strong")?.textContent?.trim() || "候選人";
    const role = button.querySelector("small")?.textContent?.trim() || "";
    const stage = button.querySelector("b")?.textContent?.trim() || "";
    const score = button.querySelector("em")?.textContent?.trim() || "--";
    const profile = candidateProfiles[name] || { experience:"履歷資料待補", source:"招募平台", interview:"待安排", owner:"招募團隊", note:"請由招募人員補充面試重點與評估紀錄。" };
    let panel = document.querySelector(".jv-candidate-detail");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "jv-candidate-detail";
      document.querySelector(".candidate-list")?.after(panel);
    }
    const completed = stage === "入職準備";
    panel.innerHTML = `<div class="jv-candidate-detail-head"><div><p>目前選取｜${stage}</p><h3>${name} · ${role}</h3></div><span class="jv-candidate-score" title="候選人評分">${score}</span></div><div class="jv-candidate-grid"><div><span>相關經歷</span><strong>${profile.experience}</strong></div><div><span>履歷來源</span><strong>${profile.source}</strong></div><div><span>面試安排</span><strong>${profile.interview}</strong></div><div><span>招募負責人</span><strong>${profile.owner}</strong></div></div><p class="jv-candidate-note">${completed?"此候選人已完成招募流程，下一步可建立新人報到與設備準備任務。":profile.note}</p><div class="jv-candidate-actions"><button data-candidate-resume>查看履歷摘要</button><button class="primary" data-candidate-advance ${completed?"disabled":""}>${completed?"已完成招募流程":"推進至下一階段"}</button></div>`;
    document.querySelectorAll(".candidate-list > button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  };
  const ensureCandidatePanel = () => {
    const active = document.querySelector(".candidate-list > button.active") || document.querySelector(".candidate-list > button");
    if (active && !document.querySelector(".jv-candidate-detail")) updateCandidate(active);
  };
  markRows();
  ensureCandidatePanel();
  new MutationObserver(() => { markRows(); ensureCandidatePanel(); }).observe(document.body, { childList: true, subtree: true });
  setTimeout(() => { ensureMounted(); markRows(); ensureCandidatePanel(); }, 1400);
})();
