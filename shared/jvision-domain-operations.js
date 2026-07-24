const domainDefinitions = {
  "宗教服務": {
    code: "temple",
    eyebrow: "信眾服務中心",
    primary: "信徒",
    createTitle: "建立信徒與服務需求",
    fields: [["name","信徒姓名"],["contact","聯絡電話"],["request","點燈／法會／捐款項目"]],
    stages: ["資料建檔","服務確認","功德金入帳","完成登記"],
    actions: ["建立信徒名冊","確認點燈資料","登錄功德金","完成服務"],
    metrics: ["信徒名冊","待確認服務","今日點燈","功德金入帳"],
    seeds: [
      ["林明德","0912-345-678","光明燈","資料建檔"],
      ["陳美蘭","0988-210-336","安太歲","服務確認"],
      ["張國豪","0921-700-118","祈福法會","功德金入帳"]
    ]
  },
  "醫療照護": {
    code: "medical",
    eyebrow: "門診照護工作站",
    primary: "個案",
    createTitle: "新增掛號與主訴",
    fields: [["name","病患姓名"],["contact","病歷號"],["request","主訴／照護需求"]],
    stages: ["完成掛號","候診評估","醫師看診","處方批價","完成照護"],
    actions: ["完成掛號","記錄生命徵象","完成診察","確認處方","結束本次照護"],
    metrics: ["今日掛號","候診人數","待確認處方","平均候診"],
    seeds: [
      ["王小姐","MR-240701","持續咳嗽三日","完成掛號"],
      ["李先生","MR-231188","慢性處方續領","候診評估"],
      ["周小弟","MR-240724","發燒與喉嚨痛","醫師看診"]
    ]
  },
  "教育": {
    code: "education",
    eyebrow: "教學內容協作台",
    primary: "教案",
    createTitle: "建立教案與學習目標",
    fields: [["name","教案名稱"],["contact","授課教師"],["request","學習目標／適用年級"]],
    stages: ["草稿建立","素材編輯","同儕審閱","課綱確認","發布使用"],
    actions: ["建立草稿","補齊教材素材","送交審閱","確認課綱對應","發布教案"],
    metrics: ["教案總數","待審閱","本週發布","教材完整率"],
    seeds: [
      ["生成式 AI 入門","陳怡君老師","高中一年級｜理解提示詞","草稿建立"],
      ["永續城市專題","林志豪老師","國中二年級｜跨域探究","素材編輯"],
      ["數據圖表判讀","王雅雯老師","國中一年級｜資訊素養","同儕審閱"]
    ]
  },
  "餐飲旅宿": {
    code: "hospitality",
    eyebrow: "現場接待與服務台",
    primary: "訂位",
    createTitle: "新增訂位／住房需求",
    fields: [["name","顧客姓名"],["contact","聯絡方式"],["request","人數、日期與特殊需求"]],
    stages: ["預約成立","到店確認","安排桌房","服務進行","結帳完成"],
    actions: ["建立預約","確認抵達","安排桌位／房號","開始服務","完成結帳"],
    metrics: ["今日預約","等待安排","服務中","翻桌／住房率"],
    seeds: [
      ["黃小姐","0911-220-881","今晚 19:00｜4 位｜兒童椅","預約成立"],
      ["宇辰科技","02-2655-1188","商務聚餐｜包廂 10 位","到店確認"],
      ["James Chen","Email","雙人房｜延後入住","安排桌房"]
    ]
  },
  "倉儲物流": {
    code: "warehouse",
    eyebrow: "波次揀貨控制塔",
    primary: "波次",
    createTitle: "建立出貨波次",
    fields: [["name","波次編號"],["contact","作業人員"],["request","儲位、訂單與出貨要求"]],
    stages: ["波次建立","揀貨執行","複核包裝","月台交接","完成出庫"],
    actions: ["釋放波次","掃碼揀貨","完成複核","交接承運商","確認出庫"],
    metrics: ["今日波次","待揀貨","複核異常","準時出庫率"],
    seeds: [
      ["WAVE-0724-A","林志豪","A 區 18 張訂單｜今日 16:00","波次建立"],
      ["WAVE-0724-B","陳怡君","冷鏈 6 張訂單｜溫控交接","揀貨執行"],
      ["WAVE-0724-C","王雅雯","電商急單 12 張｜超商取貨","複核包裝"]
    ]
  },
  "營建工程": {
    code: "construction",
    eyebrow: "工地履約協作中心",
    primary: "工項",
    createTitle: "新增工項與查驗需求",
    fields: [["name","工項名稱"],["contact","負責工班"],["request","樓層、圖說與查驗重點"]],
    stages: ["工項建立","施工回報","自主查驗","監造確認","完成計價"],
    actions: ["建立工項","提交施工日報","完成自主查驗","送監造確認","納入估驗計價"],
    metrics: ["進行工項","待查驗","缺失改善","本期完成率"],
    seeds: [
      ["B2 筏基鋼筋","鋼筋班","B2｜圖號 S-112｜續接器抽驗","工項建立"],
      ["8F 外牆防水","防水班","8F 東向｜48 小時淹水試驗","施工回報"],
      ["機房消防配管","機電班","B1 機房｜套管與支架間距","自主查驗"]
    ]
  },
  "業務銷售": {
    code: "sales",
    eyebrow: "商機與營收作戰室",
    primary: "商機",
    createTitle: "建立客戶商機",
    fields: [["name","客戶／商機名稱"],["contact","業務負責人"],["request","預算、需求與預計成交日"]],
    stages: ["潛在客戶","需求訪談","方案報價","議價簽核","成交交接"],
    actions: ["建立商機","完成需求訪談","送出正式報價","提交議價簽核","完成成交交接"],
    metrics: ["進行中商機","待跟進","報價金額","預估達成率"],
    seeds: [
      ["曜川精工 MES 導入","陳怡君","預算 180 萬｜Q3 上線｜本週訪談","潛在客戶"],
      ["永信物流 WMS 擴充","林志豪","預算 95 萬｜需串接 ERP","需求訪談"],
      ["華景建設工地平台","王雅雯","報價 240 萬｜等待採購確認","方案報價"]
    ]
  },
  "生產製造": {
    code: "manufacturing",
    eyebrow: "生產排程與現場執行台",
    primary: "工單",
    createTitle: "建立生產工單",
    fields: [["name","工單／產品名稱"],["contact","產線與班別"],["request","數量、交期與用料要求"]],
    stages: ["工單建立","物料齊套","排程派工","生產報工","完工入庫"],
    actions: ["建立工單","確認物料齊套","完成排程派工","登錄生產報工","確認完工入庫"],
    metrics: ["今日工單","待排程","生產異常","準時完工率"],
    seeds: [
      ["MO-0724 鋁合金外殼","A 線｜早班","680 件｜今日 18:00｜鋁料 A6061","工單建立"],
      ["MO-0725 傳動軸","CNC-03｜中班","420 件｜刀具壽命需確認","物料齊套"],
      ["MO-0726 控制面板","組裝二線｜晚班","900 件｜首件確認完成","排程派工"]
    ]
  },
  "品質管理": {
    code: "quality",
    eyebrow: "品質異常與改善中心",
    primary: "品質案件",
    createTitle: "建立檢驗／異常案件",
    fields: [["name","批號與異常名稱"],["contact","品質負責人"],["request","檢驗結果、缺陷與隔離要求"]],
    stages: ["異常登錄","批次隔離","原因分析","改善驗證","結案放行"],
    actions: ["登錄品質異常","執行批次隔離","提交原因分析","完成改善驗證","核准結案放行"],
    metrics: ["品質案件","待隔離批次","改善驗證中","一次合格率"],
    seeds: [
      ["NCR-0724 外觀刮傷","陳怡君","LOT-A2407｜抽驗 8/50 不合格","異常登錄"],
      ["NCR-0722 尺寸偏差","林志豪","軸徑超差 0.08mm｜隔離 120 件","批次隔離"],
      ["CAR-0718 包裝破損","王雅雯","客訴 3 件｜需進行 8D 分析","原因分析"]
    ]
  },
  "採購供應鏈": {
    code: "procurement",
    eyebrow: "採購與供應協作中心",
    primary: "採購案件",
    createTitle: "建立請購需求",
    fields: [["name","物料／採購項目"],["contact","採購承辦人"],["request","數量、預算與需求日期"]],
    stages: ["請購提出","詢比議價","採購簽核","供應交貨","到貨驗收"],
    actions: ["建立請購單","完成詢比議價","送交採購簽核","確認供應交貨","完成到貨驗收"],
    metrics: ["進行採購","待詢價","逾期交貨","本月節省率"],
    seeds: [
      ["A6061 鋁材 2 噸","陳怡君","預算 42 萬｜8/05 到貨","請購提出"],
      ["CNC 主軸軸承","林志豪","3 家報價｜交期差異 12 天","詢比議價"],
      ["包裝紙箱年度合約","王雅雯","年度 12 萬只｜議價後降 4.2%","採購簽核"]
    ]
  },
  "人力資源": {
    code: "hr",
    eyebrow: "人才與人事服務中心",
    primary: "人事案件",
    createTitle: "建立人事作業",
    fields: [["name","員工／職缺名稱"],["contact","人資承辦人"],["request","部門、日期與作業需求"]],
    stages: ["需求建立","資料確認","主管核准","人資執行","完成歸檔"],
    actions: ["建立人事需求","確認員工資料","送交主管核准","執行人事作業","完成文件歸檔"],
    metrics: ["待辦人事","待主管核准","本月到職","資料完整率"],
    seeds: [
      ["製程工程師招募","陳怡君","製造部｜需求 2 人｜8 月到職","需求建立"],
      ["林志豪加班申請","王雅雯","7/23 18:00–21:00｜專案趕工","資料確認"],
      ["年度薪資調整批次","人資薪酬組","共 48 人｜主管已完成初審","主管核准"]
    ]
  },
  "財務會計": {
    code: "finance",
    eyebrow: "財務關帳與資金工作台",
    primary: "財務單據",
    createTitle: "建立財務單據",
    fields: [["name","單據／交易名稱"],["contact","會計承辦人"],["request","金額、科目與到期日"]],
    stages: ["單據建立","憑證檢核","主管覆核","付款收款","入帳結案"],
    actions: ["建立財務單據","完成憑證檢核","送交主管覆核","確認付款／收款","完成入帳結案"],
    metrics: ["待處理單據","待覆核","本週現金需求","關帳進度"],
    seeds: [
      ["AP-0724 原料貨款","陳怡君","NT$ 426,000｜應付帳款｜7/31","單據建立"],
      ["AR-0718 客戶專案款","林志豪","NT$ 1,280,000｜應收帳款｜已逾期 3 日","憑證檢核"],
      ["JV-2407 折舊批次","王雅雯","NT$ 318,600｜製造費用｜月底入帳","主管覆核"]
    ]
  }
};

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => (
  {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]
));

export function mountDomainOperations({ project, slug }) {
  const definition = domainDefinitions[project.category];
  if (!definition || document.querySelector(".jv-client-demo")) return;
  const storageKey = `jvision-domain-operations:${slug}:v1`;
  const initial = () => ({
    items: definition.seeds.map((seed, index) => ({
      id: `${slug}-${index + 1}`,
      name: seed[0],
      contact: seed[1],
      request: seed[2],
      stage: Math.max(0, definition.stages.indexOf(seed[3]))
    })),
    selected: 0,
    logs: [`已載入「${project.title}」專屬展示資料`]
  });
  let state;
  try { state = JSON.parse(localStorage.getItem(storageKey)) || initial(); } catch { state = initial(); }
  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const host = document.querySelector(".workspace") || document.querySelector("#demo") || document.querySelector("main") || document.body;
  const root = document.createElement("section");
  root.className = `jv-client-demo jv-domain-demo jv-domain-${definition.code}`;
  host.append(root);
  const log = message => {
    state.logs.unshift(`${new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}　${message}`);
    state.logs = state.logs.slice(0, 8);
  };
  const render = () => {
    const selected = state.items[state.selected] || state.items[0];
    const completed = state.items.filter(item => item.stage === definition.stages.length - 1).length;
    const attention = state.items.filter(item => item.stage > 0 && item.stage < definition.stages.length - 1).length;
    const activeStage = Number.isInteger(state.filterStage) ? state.filterStage : null;
    const visibleItems = state.items
      .map((item, index) => ({ item, index }))
      .filter(entry => activeStage === null || entry.item.stage === activeStage);
    root.innerHTML = `
      <header class="jv-domain-head">
        <div><p>${escapeHtml(definition.eyebrow)}</p><h2>${escapeHtml(project.title)}｜客戶操作情境</h2><span>${escapeHtml(project.description || project.businessSituation || "")}</span></div>
        <div><button class="jv-demo-btn primary" data-domain-guide>啟動情境導覽</button> <button class="jv-demo-btn" data-domain-reset>還原展示資料</button></div>
      </header>
      <div class="jv-domain-metrics">
        ${definition.metrics.map((metric,index)=>`<article><span>${escapeHtml(metric)}</span><strong>${index===0?state.items.length:index===1?attention:index===2?completed:`${Math.min(99,84+completed*3)}%`}</strong></article>`).join("")}
      </div>
      <nav class="jv-domain-flow" aria-label="${escapeHtml(definition.primary)}處理流程">
        ${definition.stages.map((stage,index)=>`<button class="${activeStage===index?"active":""}" data-stage-filter="${index}" aria-pressed="${activeStage===index}"><b>${String(index+1).padStart(2,"0")}</b><span>${escapeHtml(stage)}</span><small>${state.items.filter(item=>item.stage===index).length} 筆</small></button>`).join("")}
      </nav>
      <div class="jv-domain-layout">
        <section class="jv-domain-board">
          <div class="jv-domain-section-title"><div><p>現場工作區</p><h3>${activeStage===null?escapeHtml(definition.primary)+"處理清單":escapeHtml(definition.stages[activeStage])+"清單"}</h3></div><div>${activeStage===null?"":'<button class="jv-demo-btn" data-clear-stage>顯示全部</button> '}<button class="jv-demo-btn primary" data-toggle-create>＋ ${escapeHtml(definition.createTitle)}</button></div></div>
          <form class="jv-domain-create" hidden>
            ${definition.fields.map(field=>`<label>${escapeHtml(field[1])}<input name="${field[0]}" required placeholder="輸入${escapeHtml(field[1])}"></label>`).join("")}
            <button class="jv-demo-btn primary" type="submit">確認建立</button>
          </form>
          <div class="jv-domain-items">${visibleItems.length ? visibleItems.map(({item,index})=>`
            <article class="${index===state.selected?"selected":""}">
              <button class="jv-domain-item-main" data-domain-select="${index}">
                <span class="jv-domain-status">${escapeHtml(definition.stages[item.stage])}</span>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${escapeHtml(item.request)}</small>
              </button>
              <button class="jv-demo-btn primary" data-domain-advance="${index}" ${item.stage===definition.stages.length-1?"disabled":""}>
                ${item.stage===definition.stages.length-1?"流程完成":escapeHtml(definition.actions[item.stage+1] || definition.actions[item.stage])}
              </button>
            </article>`).join("") : `<div class="jv-domain-empty"><b>${escapeHtml(definition.stages[activeStage])}目前沒有資料</b><p>可以建立新的${escapeHtml(definition.primary)}，或切換其他流程階段查看。</p><button class="jv-demo-btn" data-clear-stage>顯示全部資料</button></div>`}</div>
        </section>
        <aside class="jv-domain-detail">
          <p>目前選取</p>
          <h3>${selected ? escapeHtml(selected.name) : "尚無資料"}</h3>
          ${selected ? `<dl>
            <dt>${escapeHtml(definition.fields[1][1])}</dt><dd>${escapeHtml(selected.contact)}</dd>
            <dt>${escapeHtml(definition.fields[2][1])}</dt><dd>${escapeHtml(selected.request)}</dd>
            <dt>目前階段</dt><dd>${escapeHtml(definition.stages[selected.stage])}</dd>
            <dt>下一個現場動作</dt><dd>${selected.stage===definition.stages.length-1?"已完成全部流程":escapeHtml(definition.actions[selected.stage+1] || definition.actions[selected.stage])}</dd>
          </dl><button class="jv-demo-btn" data-domain-note>補充處理紀錄</button>` : ""}
          <div class="jv-domain-log"><h4>操作軌跡</h4>${state.logs.map(item=>`<p>${escapeHtml(item)}</p>`).join("")}</div>
        </aside>
      </div>
      <aside class="jv-demo-guide jv-domain-guide" hidden>
        <b>情境導覽 1 / 4</b>
        <p>先建立一筆${escapeHtml(definition.primary)}，帶入客戶現場會使用的資料。</p>
        <div class="jv-demo-guide-actions"><button class="jv-demo-btn" data-domain-guide-close>結束</button><button class="jv-demo-btn primary" data-domain-guide-next>下一步</button></div>
      </aside>`;
    bind();
  };
  const bind = () => {
    root.querySelectorAll("[data-stage-filter]").forEach(button => button.addEventListener("click", () => {
      const stage = Number(button.dataset.stageFilter);
      state.filterStage = state.filterStage === stage ? null : stage;
      if (state.filterStage !== null) {
        const firstMatching = state.items.findIndex(item => item.stage === state.filterStage);
        if (firstMatching >= 0) state.selected = firstMatching;
      }
      save(); render();
    }));
    root.querySelectorAll("[data-clear-stage]").forEach(button => button.addEventListener("click", () => {
      state.filterStage = null;
      save(); render();
    }));
    root.querySelector("[data-toggle-create]").addEventListener("click", () => {
      const form = root.querySelector(".jv-domain-create");
      form.hidden = !form.hidden;
      if (!form.hidden) form.querySelector("input")?.focus();
    });
    root.querySelector(".jv-domain-create").addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      state.items.unshift({id: crypto.randomUUID(), name:data.get("name"), contact:data.get("contact"), request:data.get("request"), stage:0});
      state.selected = 0;
      state.filterStage = null;
      log(`建立${definition.primary}：${data.get("name")}`);
      save(); render();
    });
    root.querySelectorAll("[data-domain-select]").forEach(button => button.addEventListener("click", () => {
      state.selected = Number(button.dataset.domainSelect);
      render();
    }));
    root.querySelectorAll("[data-domain-advance]").forEach(button => button.addEventListener("click", () => {
      const index = Number(button.dataset.domainAdvance);
      const item = state.items[index];
      if (!item || item.stage >= definition.stages.length - 1) return;
      item.stage += 1;
      state.selected = index;
      log(`${item.name}｜${definition.actions[item.stage]}`);
      save(); render();
    }));
    root.querySelector("[data-domain-note]")?.addEventListener("click", () => {
      const item = state.items[state.selected];
      log(`${item.name}｜已補充「${definition.stages[item.stage]}」處理紀錄`);
      save(); render();
    });
    root.querySelector("[data-domain-reset]").addEventListener("click", () => {
      state = initial(); save(); render();
    });
    const guide = root.querySelector(".jv-domain-guide");
    const guideSteps = [
      `先建立一筆${definition.primary}，帶入客戶現場會使用的資料。`,
      `從${definition.stages[0]}開始，確認負責資料與服務需求。`,
      `執行「${definition.actions[1] || definition.actions[0]}」，觀察案件推進到下一階段。`,
      `最後查看指標與操作軌跡，說明「${project.title}」如何留下管理依據。`
    ];
    let guideIndex = 0;
    root.querySelector("[data-domain-guide]").addEventListener("click", () => {
      guideIndex = 0; guide.hidden = false;
      guide.querySelector("b").textContent = "情境導覽 1 / 4";
      guide.querySelector("p").textContent = guideSteps[0];
    });
    root.querySelector("[data-domain-guide-close]").addEventListener("click", () => { guide.hidden = true; });
    root.querySelector("[data-domain-guide-next]").addEventListener("click", event => {
      guideIndex += 1;
      if (guideIndex >= guideSteps.length) { guide.hidden = true; return; }
      guide.querySelector("b").textContent = `情境導覽 ${guideIndex + 1} / 4`;
      guide.querySelector("p").textContent = guideSteps[guideIndex];
      event.currentTarget.textContent = guideIndex === guideSteps.length - 1 ? "完成" : "下一步";
    });
  };
  render();
  if (new URLSearchParams(location.search).get("mode") === "guided") {
    setTimeout(() => root.querySelector("[data-domain-guide]")?.click(), 120);
  }
}
