const modules = {
  fiveS: {
    kicker: "數位化 5S 檢查表",
    title: "讓每一次巡檢都能自動產生改善任務。",
    text: "將現場評分、照片佐證、不符合項、責任人與期限放進同一張流程表，讓稽核後續不再靠人工催辦。",
    list: ["手機填報與照片上傳", "缺失自動派工與逾期提醒", "部門排名與趨勢看板"],
    phoneTitle: "5S 稽核紀錄",
    score: "86 / 100",
    owner: "製造一課",
  },
  issue: {
    kicker: "生產問題追蹤",
    title: "把每日例會的問題清單變成可追蹤的行動板。",
    text: "現場可快速回報異常，主管可依嚴重度分派責任單位，所有未結項目都能回到同一張看板。",
    list: ["照片與影片佐證", "每日例會待辦追蹤", "跨部門分派與結案驗證"],
    phoneTitle: "生產異常回報",
    score: "高優先",
    owner: "製造 / 品保",
  },
  quality: {
    kicker: "精實品質管理",
    title: "從隔離可疑批次，到 CAPA 驗證都在線上完成。",
    text: "品質異常可連動批次、供應商、工序與責任單位，讓矯正預防措施不只是報告，而是真正閉環。",
    list: ["缺陷批次隔離", "多層級品質審核", "CAPA 成效追蹤"],
    phoneTitle: "品質異常單",
    score: "待 CAPA",
    owner: "品保部",
  },
  tpm: {
    kicker: "全面生產維護",
    title: "用電子點檢與 OEE 看板找出設備效率瓶頸。",
    text: "定期點檢、故障維修、備品庫存與設備稼動率集中管理，讓保養工作不再靠記憶與紙本。",
    list: ["設備點檢清單", "保養提醒與維修派工", "OEE 與停機原因分析"],
    phoneTitle: "設備點檢",
    score: "91% 達成",
    owner: "設備課",
  },
  kaizen: {
    kicker: "精實改善項目",
    title: "讓全員提案、專案進度與改善效益有共同語言。",
    text: "從員工提案、主管評估、改善任務到財務效益計算，形成年度精實績效管理模型。",
    list: ["行動端改善提案", "甘特圖與看板任務", "改善效益量化"],
    phoneTitle: "改善提案",
    score: "效益估算",
    owner: "精實推進室",
  },
  sop: {
    kicker: "數位 SOP 與合規準備",
    title: "讓每個工站掃到的都是最新版作業標準。",
    text: "作業指導書以 QR Code 發布，版本變更經由 ECR 流程審核，避免現場使用過期文件。",
    list: ["QR Code 工站入口", "ECR 版本控管", "訓練紀錄與合規查核"],
    phoneTitle: "SOP 查閱",
    score: "v3.2 最新",
    owner: "製程工程",
  },
};

const initialState = {
  issues: [
    { id: 1, title: "包裝線標籤貼附偏移", severity: "高", owner: "製造一課", status: "todo", type: "生產問題" },
    { id: 2, title: "品檢站 A2 誤判率偏高", severity: "中", owner: "品保部", status: "doing", type: "品質異常" },
    { id: 3, title: "治具定位標準化完成", severity: "低", owner: "製程工程", status: "verify", type: "改善專案" },
  ],
  audits: [88, 91, 87],
  maintenanceDone: 91,
  closed: 0,
  nextId: 4,
};

const storageKey = "jvision-lean-demo-state";
let state = loadState();

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : structuredClone(initialState);
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function setStatus(message) {
  qs("#scenarioStatus").textContent = message;
}

function markCheck(id) {
  qs(`#${id}`).classList.add("pass");
}

function resetChecks() {
  qsa(".test-checks span").forEach((item) => item.classList.remove("pass"));
}

function average(values) {
  return values.reduce((sum, value) => sum + Number(value), 0) / values.length;
}

function renderKpis() {
  const open = state.issues.filter((issue) => issue.status !== "closed").length;
  const fiveS = average(state.audits).toFixed(1);
  qs("#labOpenCount").textContent = open;
  qs("#labFiveS").textContent = fiveS;
  qs("#labMaintenance").textContent = `${state.maintenanceDone}%`;
  qs("#labClosedCount").textContent = state.closed;
  qs("#dashboardOpenCount").textContent = `${20 + open} 件未結`;
  qs("#dashboardQualityCount").textContent = String(14 + state.issues.filter((issue) => issue.type === "品質異常").length);
  qs("#dashboardOee").textContent = `${Math.min(89, 74 + Math.round(state.maintenanceDone / 20))}%`;
}

function createCard(issue) {
  const card = document.createElement("article");
  card.className = "work-card";
  card.dataset.issueId = issue.id;

  const title = document.createElement("strong");
  title.textContent = issue.title;
  card.appendChild(title);

  const meta = document.createElement("small");
  meta.textContent = `${issue.type} | ${issue.severity}優先 | ${issue.owner}`;
  card.appendChild(meta);

  const button = document.createElement("button");
  if (issue.status === "todo") {
    button.textContent = "分派改善";
    button.addEventListener("click", () => moveIssue(issue.id, "doing"));
  } else if (issue.status === "doing") {
    button.textContent = "送驗證";
    button.addEventListener("click", () => moveIssue(issue.id, "verify"));
  } else if (issue.status === "verify") {
    button.textContent = "完成閉環";
    button.addEventListener("click", () => closeIssue(issue.id));
  }
  card.appendChild(button);

  return card;
}

function renderKanban() {
  const groups = {
    todo: qs("#labTodo"),
    doing: qs("#labDoing"),
    verify: qs("#labVerify"),
  };
  Object.values(groups).forEach((group) => group.replaceChildren());
  state.issues
    .filter((issue) => issue.status !== "closed")
    .forEach((issue) => groups[issue.status].appendChild(createCard(issue)));
}

function render() {
  renderKpis();
  renderKanban();
  saveState();
}

function addIssue({ title, severity, owner, type = "生產問題" }) {
  state.issues.unshift({
    id: state.nextId,
    title,
    severity,
    owner,
    status: "todo",
    type,
  });
  state.nextId += 1;
  markCheck("checkCreate");
  markCheck("checkKanban");
  markCheck("checkKpi");
  setStatus(`已建立「${title}」，並放入待處理看板。`);
  render();
}

function moveIssue(id, status) {
  state.issues = state.issues.map((issue) => (issue.id === id ? { ...issue, status } : issue));
  markCheck("checkKanban");
  setStatus(status === "doing" ? "任務已分派到改善中。" : "改善已送出，等待成效驗證。");
  render();
}

function closeIssue(id) {
  state.issues = state.issues.map((issue) => (issue.id === id ? { ...issue, status: "closed" } : issue));
  state.closed += 1;
  markCheck("checkClose");
  markCheck("checkKpi");
  setStatus("閉環完成：問題已結案，KPI 已同步更新。");
  render();
}

function bindModuleTabs() {
  const buttons = qsa(".module-tabs button");
  const moduleKicker = qs("#moduleKicker");
  const moduleTitle = qs("#moduleTitle");
  const moduleText = qs("#moduleText");
  const moduleList = qs("#moduleList");
  const phoneTitle = qs("#phoneTitle");
  const phoneScore = qs("#phoneScore");
  const phoneOwner = qs("#phoneOwner");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const item = modules[button.dataset.module];
      buttons.forEach((tab) => tab.classList.remove("active"));
      button.classList.add("active");

      moduleKicker.textContent = item.kicker;
      moduleTitle.textContent = item.title;
      moduleText.textContent = item.text;
      moduleList.replaceChildren(...item.list.map((text) => {
        const itemNode = document.createElement("li");
        itemNode.textContent = text;
        return itemNode;
      }));
      phoneTitle.textContent = item.phoneTitle;
      phoneScore.textContent = item.score;
      phoneOwner.textContent = item.owner;
    });
  });
}

function bindDemoForms() {
  qs("#issueForm").addEventListener("submit", (event) => {
    event.preventDefault();
    addIssue({
      title: qs("#issueTitle").value.trim(),
      severity: qs("#issueSeverity").value,
      owner: qs("#issueOwner").value,
    });
  });

  qs("#auditForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const area = qs("#auditArea").value;
    const score = Math.max(0, Math.min(100, Number(qs("#auditScore").value) || 0));
    state.audits.push(score);
    markCheck("checkCreate");
    markCheck("checkKpi");
    setStatus(`${area} 5S 稽核分數 ${score} 已更新到 KPI。`);
    render();
  });

  qs("#maintenanceForm").addEventListener("submit", (event) => {
    event.preventDefault();
    addIssue({
      title: qs("#equipmentIssue").value.trim(),
      severity: "中",
      owner: "設備課",
      type: "TPM 維修",
    });
    state.maintenanceDone = Math.max(80, state.maintenanceDone - 2);
    render();
  });

  qs("#resetDemo").addEventListener("click", () => {
    state = structuredClone(initialState);
    resetChecks();
    setStatus("Demo 已重置，可重新執行完整流程。");
    render();
  });

  qs("#runScenario").addEventListener("click", () => {
    resetChecks();
    const scenarioTitle = "自動測試：切割站換線時間過長";
    addIssue({ title: scenarioTitle, severity: "高", owner: "設備課", type: "TPM 維修" });
    const id = state.issues[0].id;
    moveIssue(id, "doing");
    moveIssue(id, "verify");
    closeIssue(id);
    setStatus("完整流程測試通過：建立、分派、送驗證、結案與 KPI 更新都已完成。");
  });
}

bindModuleTabs();
bindDemoForms();
render();

