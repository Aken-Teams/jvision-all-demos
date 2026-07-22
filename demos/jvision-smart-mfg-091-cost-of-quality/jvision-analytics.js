(function jvisionMobileAnalytics() {
  "use strict";

  const embeddedProfile = {"id":1191,"repoName":"jvision-smart-mfg-091-cost-of-quality","name":"COQ洞察站","category":"智慧製造｜品質管理","description":"統計並分析預防、鑑定、內部失敗與外部失敗四大類品質成本，協助管理層決策資源投入。"};
  const runtimeConfig = window.DEMO_CONFIG && typeof window.DEMO_CONFIG === "object"
    ? window.DEMO_CONFIG
    : {};
  const project = {
    ...embeddedProfile,
    id: runtimeConfig.id || embeddedProfile.id,
    name: runtimeConfig.name || embeddedProfile.name || document.title.replace(/\s*[｜|].*$/, ""),
    category: runtimeConfig.category || embeddedProfile.category || "企業營運",
    description: runtimeConfig.description || embeddedProfile.description || "以統計資料掌握營運狀態、風險與改善進度。",
  };

  if (document.querySelector(".jv-analytics-panel")) return;
  if (/\/(admin|products)(\/|$)/i.test(window.location.pathname)) return;

  const categoryProfiles = {
    "製造與工程": { object: "工單", target: "產線／設備", stages: ["待處理", "執行中", "待檢核", "已完成"], risks: ["交期", "設備", "物料", "品質"] },
    "協作與管理": { object: "任務", target: "專案／團隊", stages: ["待分派", "進行中", "待審核", "已完成"], risks: ["逾期", "負載", "依賴", "溝通"] },
    "金融與保險": { object: "案件", target: "客戶／保單", stages: ["待受理", "審核中", "待核准", "已結案"], risks: ["風險", "補件", "額度", "法遵"] },
    "企業營運": { object: "流程", target: "部門／客戶", stages: ["待處理", "執行中", "待確認", "已完成"], risks: ["時效", "成本", "人力", "異常"] },
    "教育與照護": { object: "服務", target: "學員／個案", stages: ["待安排", "服務中", "待追蹤", "已完成"], risks: ["出席", "照護", "進度", "紀錄"] },
    "交通與車輛": { object: "任務", target: "車輛／路線", stages: ["待派遣", "執行中", "待回報", "已完成"], risks: ["延誤", "里程", "維修", "安全"] },
    "零售與服務": { object: "訂單", target: "門市／會員", stages: ["待處理", "服務中", "待結算", "已完成"], risks: ["庫存", "等待", "客訴", "營收"] },
    "ESG 與永續": { object: "指標", target: "據點／範疇", stages: ["待蒐集", "計算中", "待查核", "已完成"], risks: ["缺值", "超標", "係數", "稽核"] },
    "智慧製造｜經營管理": { object: "工單", target: "產線／據點", stages: ["待處理", "執行中", "待檢核", "已完成"], risks: ["交期", "品質", "成本", "設備"] },
  };

  const profile = runtimeConfig.profile || categoryProfiles[project.category] || categoryProfiles["企業營運"];
  const objectLabel = profile.object || "項目";
  const targetLabel = Array.isArray(profile.fields) && profile.fields[0] ? profile.fields[0] : profile.target || "對象";
  const stages = Array.isArray(profile.stages) && profile.stages.length >= 3
    ? profile.stages.slice(0, 4)
    : categoryProfiles[project.category]?.stages || categoryProfiles["企業營運"].stages;
  const risks = Array.isArray(profile.risks) && profile.risks.length
    ? profile.risks
    : categoryProfiles[project.category]?.risks || categoryProfiles["企業營運"].risks;

  function hashSeed(value) {
    return String(value).split("").reduce((total, character) => ((total << 5) - total + character.charCodeAt(0)) | 0, 0);
  }

  const baseSeed = Math.abs(hashSeed(`${project.id}-${project.name}-${project.category}`));

  function safeText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function priorityText(value) {
    if (value === "high") return "高風險";
    if (value === "medium") return "需關注";
    if (value === "low") return "正常";
    return String(value || "正常");
  }

  function readRuntimeRecords() {
    if (!Array.isArray(runtimeConfig.records)) return null;
    let source = runtimeConfig.records;
    if (runtimeConfig.id) {
      try {
        const saved = JSON.parse(localStorage.getItem(`jvision-industry-system-${runtimeConfig.id}`));
        if (Array.isArray(saved)) source = saved;
      } catch {
        // Local demo data remains the safe fallback.
      }
    }
    return source.map((record, index) => ({
      id: record.id || `${project.id}-${index + 1}`,
      title: record.title || `${objectLabel} ${String(index + 1).padStart(2, "0")}`,
      target: record.target || `${targetLabel} ${index + 1}`,
      stage: record.stage || stages[index % stages.length],
      risk: record.risk || risks[index % risks.length],
      owner: record.owner || "營運團隊",
      score: Number(record.score ?? 60 + ((baseSeed + index * 13) % 35)),
      priority: record.priority || (index % 4 === 0 ? "high" : index % 3 === 0 ? "medium" : "low"),
      done: Boolean(record.done) || record.stage === stages.at(-1),
      due: record.due || `D+${2 + (index % 12)}`,
    }));
  }

  function buildSyntheticRecords(range) {
    const rangeBoost = range === 30 ? 7 : 0;
    return Array.from({ length: 8 }, (_, index) => {
      const score = 54 + ((baseSeed + index * 17 + rangeBoost) % 44);
      const stage = stages[(baseSeed + index) % stages.length];
      const priority = score >= 82 ? "high" : score >= 66 ? "medium" : "low";
      return {
        id: `${project.id || "demo"}-${index + 1}`,
        title: `${objectLabel} ${String(index + 1).padStart(2, "0")}`,
        target: `${targetLabel} ${String.fromCharCode(65 + (index % 6))}`,
        stage,
        risk: risks[(baseSeed + index * 3) % risks.length],
        owner: ["營運一組", "營運二組", "AI 協作中心", "現場主管"][index % 4],
        score,
        priority,
        done: stage === stages.at(-1),
        due: `D+${2 + ((baseSeed + index) % 13)}`,
      };
    });
  }

  function getRecords(range) {
    const runtimeRecords = readRuntimeRecords();
    return runtimeRecords && runtimeRecords.length ? runtimeRecords : buildSyntheticRecords(range);
  }

  function getStats(records) {
    const total = records.length;
    const done = records.filter((record) => record.done || record.stage === stages.at(-1)).length;
    const active = records.filter((record) => !record.done && record.stage !== stages[0]).length;
    const attention = records.filter((record) => record.priority === "high").length;
    const completion = total ? Math.round((done / total) * 100) : 0;
    const average = total ? Math.round(records.reduce((sum, record) => sum + Number(record.score || 0), 0) / total) : 0;
    return { total, done, active, attention, completion, average };
  }

  function distribution(records) {
    return stages.map((stage) => ({
      stage,
      count: records.filter((record) => record.stage === stage).length,
    }));
  }

  const section = document.createElement("section");
  section.className = "jv-analytics-panel";
  section.id = `jv-analytics-${project.id || "demo"}`;
  section.setAttribute("aria-labelledby", `${section.id}-title`);
  section.innerHTML = `
    <header class="jv-analytics-header">
      <div>
        <p class="jv-analytics-kicker">Operational Intelligence · AI Analytics</p>
        <h2 id="${section.id}-title">${safeText(project.name)}營運統計</h2>
        <p class="jv-analytics-description">以統計資料檢視${safeText(objectLabel)}進度、風險與 AI 評分；圖表均提供可排序資料表，手機會自動切換為卡片式資料列。</p>
      </div>
      <div class="jv-analytics-actions" aria-label="統計期間與匯出功能">
        <button class="jv-range-button" type="button" data-range="7" aria-pressed="true">近 7 日</button>
        <button class="jv-range-button" type="button" data-range="30" aria-pressed="false">近 30 日</button>
        <button class="jv-export-button" type="button">匯出 CSV</button>
      </div>
    </header>
    <div class="jv-analytics-kpis" aria-label="主要營運指標"></div>
    <div class="jv-analytics-grid">
      <article class="jv-chart-card" aria-labelledby="${section.id}-chart-title">
        <div class="jv-card-heading">
          <div><h3 id="${section.id}-chart-title">階段分布</h3><p>直接顯示數值，不只依賴顏色判讀</p></div>
          <span class="jv-chart-period">近 7 日</span>
        </div>
        <div class="jv-distribution-chart" role="img" aria-label="${safeText(objectLabel)}階段分布統計"></div>
        <p class="jv-chart-summary" aria-live="polite"></p>
      </article>
      <article class="jv-table-card" aria-labelledby="${section.id}-table-title">
        <div class="jv-card-heading">
          <div><h3 id="${section.id}-table-title">營運統計表</h3><p>可依欄位排序，支援鍵盤與手機操作</p></div>
        </div>
        <div class="jv-table-scroll" tabindex="0" aria-label="可捲動統計表格">
          <table class="jv-data-table">
            <caption>${safeText(project.name)} ${safeText(objectLabel)}營運統計資料</caption>
            <thead><tr>
              <th scope="col" data-key="title"><button class="jv-sort-button" type="button" data-sort="title">${safeText(objectLabel)}</button></th>
              <th scope="col" data-key="target"><button class="jv-sort-button" type="button" data-sort="target">${safeText(targetLabel)}</button></th>
              <th scope="col" data-key="stage"><button class="jv-sort-button" type="button" data-sort="stage">狀態</button></th>
              <th scope="col" data-key="risk"><button class="jv-sort-button" type="button" data-sort="risk">風險</button></th>
              <th scope="col" data-key="score" aria-sort="descending"><button class="jv-sort-button" type="button" data-sort="score">AI 評分 ↓</button></th>
              <th scope="col" data-key="owner"><button class="jv-sort-button" type="button" data-sort="owner">負責單位</button></th>
            </tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </article>
    </div>`;

  let mountedOnce = false;
  let remountPending = false;

  function mountSection() {
    if (document.contains(section)) {
      document.body.classList.add("jvision-rwd-ready");
      return;
    }
    const anchor = document.querySelector(
      ".workspace > .kpi-grid, .app-shell main > .metrics, main > .hero, main > .hero-section, main > header"
    );
    const main = document.querySelector("main") || document.body;
    if (anchor?.parentElement) anchor.insertAdjacentElement("afterend", section);
    else main.append(section);
    document.body.classList.add("jvision-rwd-ready");
    mountedOnce = true;
  }

  const remountObserver = new MutationObserver(() => {
    if (!mountedOnce || document.contains(section) || remountPending) return;
    remountPending = true;
    requestAnimationFrame(() => {
      remountPending = false;
      mountSection();
    });
  });
  remountObserver.observe(document.documentElement, { childList: true, subtree: true });

  function scheduleMount() {
    const afterHydration = () => setTimeout(mountSection, 450);
    if (document.readyState === "complete") afterHydration();
    else window.addEventListener("load", afterHydration, { once: true });
  }

  let selectedRange = 7;
  let currentRecords = [];
  let sortKey = "score";
  let sortDirection = "desc";

  const kpiContainer = section.querySelector(".jv-analytics-kpis");
  const chartContainer = section.querySelector(".jv-distribution-chart");
  const chartSummary = section.querySelector(".jv-chart-summary");
  const tableBody = section.querySelector("tbody");
  const chartPeriod = section.querySelector(".jv-chart-period");

  function renderKpis(stats) {
    const cards = [
      [`${objectLabel}總數`, stats.total, `${selectedRange} 日統計範圍`],
      ["執行中", stats.active, "目前正在推進"],
      ["需優先關注", stats.attention, "AI 高風險項目"],
      ["完成率", `${stats.completion}%`, `平均 AI 評分 ${stats.average}`],
    ];
    kpiContainer.innerHTML = cards.map(([label, value, note]) => `
      <article class="jv-analytics-kpi"><span>${safeText(label)}</span><strong>${safeText(value)}</strong><small>${safeText(note)}</small></article>
    `).join("");
  }

  function renderChart(records, stats) {
    const rows = distribution(records);
    const max = Math.max(...rows.map((row) => row.count), 1);
    chartContainer.innerHTML = rows.map((row) => {
      const width = Math.max(row.count ? 12 : 0, Math.round((row.count / max) * 100));
      return `<div class="jv-chart-row"><span>${safeText(row.stage)}</span><div class="jv-chart-track"><i class="jv-chart-fill" style="width:${width}%"></i></div><b>${row.count}</b></div>`;
    }).join("");
    chartContainer.setAttribute("aria-label", rows.map((row) => `${row.stage} ${row.count} 筆`).join("，"));
    chartSummary.innerHTML = `AI 摘要：目前完成率 <strong>${stats.completion}%</strong>，共有 <strong>${stats.attention}</strong> 筆高風險項目需要優先確認。`;
    chartPeriod.textContent = `近 ${selectedRange} 日`;
  }

  function compareRecords(first, second) {
    const left = first[sortKey];
    const right = second[sortKey];
    const result = typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left ?? "").localeCompare(String(right ?? ""), "zh-Hant", { numeric: true });
    return sortDirection === "asc" ? result : -result;
  }

  function renderTable() {
    const rows = [...currentRecords].sort(compareRecords);
    tableBody.innerHTML = rows.map((record) => {
      const completed = record.done || record.stage === stages.at(-1);
      const tone = completed ? "normal" : record.priority === "high" ? "risk" : record.priority === "medium" ? "attention" : "normal";
      return `<tr>
        <td data-label="${safeText(objectLabel)}">${safeText(record.title)}</td>
        <td data-label="${safeText(targetLabel)}">${safeText(record.target)}</td>
        <td data-label="狀態"><span class="jv-status-badge" data-tone="${tone}">${safeText(record.stage)}</span></td>
        <td data-label="風險">${safeText(record.risk)} · ${safeText(priorityText(record.priority))}</td>
        <td data-label="AI 評分">${safeText(record.score)}</td>
        <td data-label="負責單位">${safeText(record.owner)}</td>
      </tr>`;
    }).join("");

    section.querySelectorAll("th[data-key]").forEach((header) => {
      const active = header.dataset.key === sortKey;
      header.setAttribute("aria-sort", active ? (sortDirection === "asc" ? "ascending" : "descending") : "none");
      const button = header.querySelector("button");
      const baseLabel = button.textContent.replace(/\s[↑↓]$/, "");
      button.textContent = active ? `${baseLabel} ${sortDirection === "asc" ? "↑" : "↓"}` : baseLabel;
    });
  }

  function render() {
    currentRecords = getRecords(selectedRange);
    const stats = getStats(currentRecords);
    renderKpis(stats);
    renderChart(currentRecords, stats);
    renderTable();
  }

  function csvCell(value) {
    return `"${String(value ?? "").replaceAll('"', '""')}"`;
  }

  function exportCsv() {
    const rows = [
      [objectLabel, targetLabel, "狀態", "風險", "AI 評分", "負責單位"],
      ...[...currentRecords].sort(compareRecords).map((record) => [record.title, record.target, record.stage, record.risk, record.score, record.owner]),
    ];
    const csv = `\ufeff${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${String(project.name).replace(/[\\/:*?"<>|]/g, "-")}-營運統計.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  section.querySelectorAll(".jv-range-button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedRange = Number(button.dataset.range) || 7;
      section.querySelectorAll(".jv-range-button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      render();
    });
  });

  section.querySelectorAll(".jv-sort-button").forEach((button) => {
    button.addEventListener("click", () => {
      const nextKey = button.dataset.sort;
      sortDirection = sortKey === nextKey && sortDirection === "desc" ? "asc" : "desc";
      sortKey = nextKey;
      renderTable();
    });
  });

  section.querySelector(".jv-export-button").addEventListener("click", exportCsv);

  const taskList = document.querySelector("#taskList");
  if (taskList) {
    let refreshTimer;
    new MutationObserver(() => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(render, 80);
    }).observe(taskList, { childList: true, subtree: true });
  }
  window.addEventListener("storage", render);
  render();
  scheduleMount();
})();
