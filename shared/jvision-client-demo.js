(async () => {
  const configs = {
    "jvision-ai-case-009-oee-analytics": {
      variant: "oee", accent: "#0f766e", title: "OEE 稼動洞察實戰"
    },
    "jvision-smart-mfg-111-customer-relationship-management": {
      accent: "#c8103d", title: "CRM 成交推進實戰", task: "將「東岳零售會員專案」從需求確認推進到成交，並留下完整跟進紀錄。",
      entity: "商機", ownerLabel: "業務負責人", stages: ["新商機","需求確認","報價中","議價","成交"],
      metrics: ["商機總數","高風險商機","本週待跟進","成交率"],
      seed: [["東岳零售會員專案","王怡文",1,"兩天後報價到期"],["宏川設備續約","陳建宏",2,"技術規格待確認"],["星辰通路整合","林書豪",3,"等待採購回覆"]]
    },
    "jvision-smart-mfg-025-warehouse-management-system": {
      accent: "#0f766e", title: "WMS 出貨波次實戰", task: "完成急單波次 WAVE-0724 的揀貨、複核、包裝與出貨交接。",
      entity: "出貨波次", ownerLabel: "倉管負責人", stages: ["待釋放","揀貨中","待複核","包裝中","已出貨"],
      metrics: ["波次總數","缺料品項","待複核","準時出貨率"],
      seed: [["WAVE-0724 急單","周志明",1,"A-03 儲位優先"],["WAVE-0725 門市補貨","許雅婷",2,"兩箱待複核"],["WAVE-0726 電商單","吳承翰",0,"等待庫存配置"]]
    },
    "jvision-ai-case-058-teacher-lesson-kb": {
      accent: "#7c3aed", title: "教師教案發布實戰", task: "完成八年級「能源轉型」教案的素材整理、同儕審查與正式發布。",
      entity: "教案", ownerLabel: "授課教師", stages: ["草稿","素材整理","同儕審查","待發布","已發布"],
      metrics: ["教案總數","待審查","缺少素材","本週發布"],
      seed: [["能源轉型探究課","陳怡君",1,"缺少學習單"],["氣候資料判讀","李志豪",2,"等待自然科共備"],["地方創生訪談","王雅雯",3,"排程週五發布"]]
    },
    "jvision-production-order": {
      accent: "#0f766e", title: "生產工單排程實戰", task: "處理醫療支架工單的缺料與產能衝突，完成排程、派工及完工回報。",
      entity: "生產工單", ownerLabel: "生管負責人", stages: ["待排程","已排程","已派工","生產中","已完工"],
      metrics: ["工單總數","缺料工單","延遲風險","今日達成率"],
      seed: [["MO-0724 醫療支架 680件","張育誠",0,"鋁料尚缺 120 公斤"],["MO-0725 精密外殼 420件","林冠宇",2,"CNC-03 已派工"],["MO-0726 固定座 900件","黃靖雯",3,"完成率 68%"]]
    },
    "jvision-sqm": {
      accent: "#0b7285", title: "SQM 品質異常處理實戰", task: "處理客戶退回異音件，完成隔離、原因分析、改善要求與放行審核。",
      entity: "品質案件", ownerLabel: "品質負責人", stages: ["異常建立","批次隔離","原因分析","改善驗證","結案放行"],
      metrics: ["未結異常","隔離批次","待驗證","本月客訴"],
      seed: [["NCR-0724 客戶退回異音件","林美玲",1,"隔離 LOT-A2407"],["NCR-0722 標籤批號不符","陳志遠",2,"等待供應商 8D"],["NCR-0718 尺寸超差","王家豪",3,"複驗結果待核准"]]
    }
  };

  const profiles = {
    "人力資源":["人員任務",["待建立","資格確認","主管審核","執行中","已完成"]],
    "內容管理":["內容項目",["草稿","資料整理","內容審查","待發布","已發布"]],
    "生活服務":["服務預約",["新申請","資料確認","服務安排","執行中","已完成"]],
    "生產製造":["生產工單",["待排程","已排程","已派工","生產中","已完工"]],
    "交通運輸":["運輸任務",["待派遣","已派車","運送中","抵達確認","已結案"]],
    "企業協作":["協作任務",["待建立","已指派","協作中","待確認","已完成"]],
    "企業營運":["營運案件",["待受理","資料確認","執行中","主管審核","已完成"]],
    "宗教服務":["服務登記",["新登記","資料確認","款項確認","服務執行","已完成"]],
    "物流運輸":["配送任務",["待出貨","已派車","配送中","簽收確認","已完成"]],
    "金融保險":["金融案件",["新案件","資料審查","風險評估","核准執行","已結案"]],
    "品質管理":["品質案件",["異常建立","批次隔離","原因分析","改善驗證","結案放行"]],
    "客服管理":["客服案件",["新案件","分類指派","處理中","客戶確認","已結案"]],
    "研發管理":["研發項目",["需求提出","可行性評估","設計驗證","變更審核","正式發布"]],
    "倉儲物流":["倉儲任務",["待釋放","作業中","待複核","交接確認","已完成"]],
    "財務會計":["財務單據",["待建立","憑證確認","主管審核","付款入帳","已完成"]],
    "專業服務":["服務案件",["新案件","需求訪談","執行中","成果審核","已結案"]],
    "採購供應鏈":["採購案件",["需求建立","詢比議價","採購審核","交期追蹤","驗收入庫"]],
    "教育":["教學項目",["草稿","素材整理","同儕審查","待發布","已發布"]],
    "設備維護":["維護工單",["異常通報","技師指派","維修中","試運轉","已結案"]],
    "業務銷售":["商機",["新商機","需求確認","報價中","議價","成交"]],
    "經營管理":["決策議題",["議題建立","資料彙整","方案評估","決策核准","追蹤完成"]],
    "資訊安全":["資安事件",["事件偵測","風險判定","隔離處置","復原驗證","事件結案"]],
    "資訊科技":["IT 服務單",["新申請","分類指派","處理中","使用者驗收","已結案"]],
    "零售電商":["零售訂單",["新訂單","庫存確認","揀貨包裝","配送中","已完成"]],
    "數據分析":["分析任務",["需求定義","資料準備","模型分析","結果驗證","洞察發布"]],
    "餐飲旅宿":["服務訂單",["新預約","訂單確認","備製服務","顧客確認","已完成"]],
    "營建工程":["工程任務",["工作建立","圖說確認","現場施工","品質查驗","已完成"]],
    "醫療照護":["照護案件",["個案建立","專業評估","照護執行","成效追蹤","已結案"]],
    "ESG 永續":["永續專案",["資料蒐集","盤查確認","減量執行","成效查證","報告完成"]]
  };
  const mountOee = () => {
    const storageKey = "jvision-oee-hands-on:v1";
    const baseline = { planned: 480, downtime: 72, total: 820, good: 788, ideal: 0.45 };
    const initial = () => ({
      values: { ...baseline },
      events: [
        { id: 1, type: "設備故障", minutes: 34, note: "CNC-02 主軸溫度異常" },
        { id: 2, type: "換線換模", minutes: 23, note: "治具校正超時" },
        { id: 3, type: "待料", minutes: 15, note: "關鍵鋁料延遲上線" }
      ],
      actions: [],
      logs: ["已載入早班 OEE 基準資料"]
    });
    let state;
    let oeeGuideStarted = false;
    let oeeGuideStep = -1;
    try { state = JSON.parse(localStorage.getItem(storageKey)) || initial(); } catch { state = initial(); }
    const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
    const host = document.querySelector(".workspace") || document.querySelector("#demo") || document.querySelector("main") || document.body;
    const root = document.createElement("section");
    root.className = "jv-client-demo jv-oee-demo";
    root.style.setProperty("--demo-accent", "#0f766e");
    host.append(root);
    const calculate = values => {
      const operating = Math.max(1, values.planned - values.downtime);
      const availability = operating / Math.max(1, values.planned);
      const performance = Math.min(1, values.ideal * values.total / operating);
      const quality = values.good / Math.max(1, values.total);
      return { operating, availability, performance, quality, oee: availability * performance * quality };
    };
    const shiftDowntime = deltaMinutes => {
      const baselineOperating = Math.max(1, baseline.planned - baseline.downtime);
      const unitsPerMinute = baseline.total / baselineOperating;
      const baselineQuality = baseline.good / baseline.total;
      const nextDowntime = Math.max(0, state.values.downtime + deltaMinutes);
      const actualDelta = nextDowntime - state.values.downtime;
      const unitDelta = Math.round(actualDelta * unitsPerMinute);
      state.values.downtime = nextDowntime;
      state.values.total = Math.max(1, state.values.total - unitDelta);
      state.values.good = Math.max(0, Math.min(
        state.values.total,
        state.values.good - Math.round(unitDelta * baselineQuality)
      ));
    };
    const percent = value => `${(value * 100).toFixed(1)}%`;
    const log = text => {
      state.logs.unshift(`${new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}　${text}`);
      state.logs = state.logs.slice(0, 7);
    };
    const render = () => {
      const result = calculate(state.values);
      const baseResult = calculate(baseline);
      const lossMinutes = state.events.reduce((sum,event) => sum + Number(event.minutes), 0);
      root.innerHTML = `
        <div class="jv-demo-head"><div><p class="jv-demo-eyebrow">OEE SHIFT PERFORMANCE LAB</p><h2>OEE 稼動洞察與改善實戰</h2><p>輸入班別生產數據、登記六大損失事件，系統會即時計算稼動率、性能率、良率與 OEE。</p></div><div><button class="jv-demo-btn" data-oee-guide data-jv-feedback="off">啟動操作導覽</button> <button class="jv-demo-btn" data-oee-reset>重設早班資料</button></div></div>
        <div class="jv-demo-kpis">
          <article class="jv-demo-kpi"><span>稼動率 Availability</span><strong>${percent(result.availability)}</strong><small>運轉 ${result.operating} / 計畫 ${state.values.planned} 分鐘</small></article>
          <article class="jv-demo-kpi"><span>性能率 Performance</span><strong>${percent(result.performance)}</strong><small>理想週期 ${state.values.ideal} 分／件</small></article>
          <article class="jv-demo-kpi"><span>良率 Quality</span><strong>${percent(result.quality)}</strong><small>良品 ${state.values.good} / 總產出 ${state.values.total}</small></article>
          <article class="jv-demo-kpi"><span>OEE</span><strong>${percent(result.oee)}</strong><small>${result.oee >= .85 ? "世界級水準" : result.oee >= .7 ? "改善中" : "需優先改善"}</small></article>
        </div>
        <div class="jv-oee-grid">
          <section class="jv-demo-panel"><h3>1. 輸入班別生產數據</h3><form class="jv-oee-inputs">
            <label>計畫生產時間（分）<input name="planned" type="number" min="1" value="${state.values.planned}"></label>
            <label>停機時間（分）<input name="downtime" type="number" min="0" value="${state.values.downtime}"></label>
            <label>總產出數<input name="total" type="number" min="1" value="${state.values.total}"></label>
            <label>良品數<input name="good" type="number" min="0" value="${state.values.good}"></label>
            <label>理想週期（分／件）<input name="ideal" type="number" min=".01" step=".01" value="${state.values.ideal}"></label>
            <button class="jv-demo-btn primary" type="submit">重新計算 OEE</button>
          </form></section>
          <section class="jv-demo-panel"><h3>2. 登記六大損失事件</h3><form class="jv-oee-event-form">
            <select name="type"><option>設備故障</option><option>換線換模</option><option>短暫停機</option><option>速度降低</option><option>製程不良</option><option>啟動損失</option><option>待料</option></select>
            <input name="minutes" type="number" min="1" required placeholder="損失分鐘">
            <input name="note" required placeholder="事件說明">
            <button class="jv-demo-btn primary" type="submit">新增事件</button>
          </form><div class="jv-oee-events">${state.events.map(event => `<article><div><strong>${event.type}</strong><small>${event.note}</small></div><b>${event.minutes} 分</b><button class="jv-demo-btn" data-remove-event="${event.id}">排除</button></article>`).join("")}</div><p class="jv-oee-total">已登記損失：<b>${lossMinutes} 分鐘</b></p></section>
          <section class="jv-demo-panel"><h3>3. 指派改善措施</h3><form class="jv-oee-action-form"><input name="action" required placeholder="例如：調整換模治具預熱流程"><input name="owner" required placeholder="改善負責人"><button class="jv-demo-btn primary" type="submit">建立改善措施</button></form><div class="jv-oee-actions">${state.actions.length ? state.actions.map(action => `<p><b>${action.action}</b><span>${action.owner} · 預估減少 ${action.saving} 分鐘</span></p>`).join("") : "<p>尚未建立改善措施</p>"}</div></section>
          <section class="jv-demo-panel"><h3>4. 改善前後比較</h3><div class="jv-oee-compare"><div><span>改善前 OEE</span><strong>${percent(baseResult.oee)}</strong></div><div><span>目前 OEE</span><strong>${percent(result.oee)}</strong></div><div><span>提升幅度</span><strong>${((result.oee-baseResult.oee)*100).toFixed(1)} pt</strong></div></div><div class="jv-demo-log">${state.logs.map(item => `<p>${item}</p>`).join("")}</div></section>
        </div>
        <aside class="jv-demo-guide" hidden><b>操作導覽 1 / 4</b><p></p><div class="jv-demo-guide-actions"><button class="jv-demo-btn" data-oee-guide-close data-jv-feedback="off">結束</button><button class="jv-demo-btn primary" data-oee-guide-next data-jv-feedback="off">下一步</button></div></aside>`;
      bind();
    };
    const bind = () => {
      root.querySelector(".jv-oee-inputs").addEventListener("submit", event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        for (const key of ["planned","downtime","total","good","ideal"]) state.values[key] = Number(form.get(key));
        state.values.good = Math.min(state.values.good, state.values.total);
        if (oeeGuideStep === 0) oeeGuideStep = 1;
        log(`重新計算 OEE：${percent(calculate(state.values).oee)}`);
        save(); render();
      });
      root.querySelector(".jv-oee-event-form").addEventListener("submit", event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const minutes = Number(form.get("minutes"));
        state.events.unshift({ id: Date.now(), type: form.get("type"), minutes, note: form.get("note") });
        shiftDowntime(minutes);
        if (oeeGuideStep === 1) oeeGuideStep = 2;
        log(`新增${form.get("type")}事件：${minutes} 分鐘`);
        save(); render();
      });
      root.querySelectorAll("[data-remove-event]").forEach(button => button.addEventListener("click", () => {
        const index = state.events.findIndex(event => String(event.id) === button.dataset.removeEvent);
        if (index < 0) return;
        const [removed] = state.events.splice(index,1);
        shiftDowntime(-Number(removed.minutes));
        log(`排除損失事件：${removed.type}`);
        save(); render();
      }));
      root.querySelector(".jv-oee-action-form").addEventListener("submit", event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const saving = Math.min(12,Math.max(3,Math.round(state.values.downtime*.12)));
        state.actions.unshift({ action: form.get("action"), owner: form.get("owner"), saving });
        shiftDowntime(-saving);
        if (oeeGuideStep === 2) oeeGuideStep = 3;
        log(`建立改善措施並預估減少 ${saving} 分鐘停機`);
        save(); render();
      });
      root.querySelector("[data-oee-reset]").addEventListener("click", () => { state = initial(); save(); render(); });
      const guide = root.querySelector(".jv-demo-guide");
      const guideSteps = [
        { selector: ".jv-oee-inputs", text: "先輸入本班生產時間、停機時間與良品數，建立 OEE 計算基準。", hint: "步驟 1｜輸入班別生產數據" },
        { selector: ".jv-oee-event-form", text: "登記設備故障、換線或待料等損失事件，觀察停機時間變化。", hint: "步驟 2｜登記六大損失" },
        { selector: ".jv-oee-action-form", text: "建立改善措施並指定負責人，系統會試算可降低的停機分鐘。", hint: "步驟 3｜指派改善措施" },
        { selector: ".jv-oee-compare", text: "最後比較改善前後 OEE，確認措施是否帶來實際提升。", hint: "步驟 4｜檢視改善成效" }
      ];
      let guideIndex = Math.max(0, oeeGuideStep);
      const clearGuide = () => {
        root.querySelector(".jv-guide-focus")?.classList.remove("jv-guide-focus");
        root.querySelector("[data-guide-hint]")?.removeAttribute("data-guide-hint");
        root.querySelector(".jv-guide-overlay")?.remove();
      };
      const showGuideStep = () => {
        clearGuide();
        const step = guideSteps[guideIndex];
        const target = root.querySelector(step.selector);
        const overlay = document.createElement("div");
        overlay.className = "jv-guide-overlay";
        root.append(overlay);
        if (target) {
          target.classList.add("jv-guide-focus");
          target.dataset.guideHint = step.hint;
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        guide.querySelector("b").textContent = `操作導覽 ${guideIndex + 1} / ${guideSteps.length}`;
        guide.querySelector("p").textContent = step.text;
        const next = guide.querySelector("[data-oee-guide-next]");
        next.disabled = guideIndex < guideSteps.length - 1;
        next.textContent = guideIndex === guideSteps.length - 1 ? "完成" : "請完成畫面操作";
      };
      root.querySelector("[data-oee-guide]").addEventListener("click", () => { oeeGuideStep = 0; guideIndex = 0; guide.hidden = false; showGuideStep(); });
      root.querySelector("[data-oee-guide-close]").addEventListener("click", () => { oeeGuideStep = -1; guide.hidden = true; clearGuide(); });
      root.querySelector("[data-oee-guide-next]").addEventListener("click", () => {
        if (guideIndex < guideSteps.length - 1) return;
        oeeGuideStep = -1; guide.hidden = true; clearGuide();
      });
      if (oeeGuideStep >= 0) setTimeout(() => { guideIndex = oeeGuideStep; guide.hidden = false; showGuideStep(); }, 0);
      if (!oeeGuideStarted && new URLSearchParams(location.search).get("mode") === "guided") {
        oeeGuideStarted = true;
        const launch = (attempt = 0) => {
          const button = root.querySelector("[data-oee-guide]");
          if (button) button.click();
          else if (attempt < 12) setTimeout(() => launch(attempt + 1), 250);
        };
        setTimeout(launch, 180);
      }
    };
    render();
  };
  const slug = location.pathname.split("/").filter(Boolean).pop();
  let projectMeta = null;
  try {
    const embeddedProject = document.querySelector("#jvision-client-demo-project");
    projectMeta = embeddedProject ? JSON.parse(embeddedProject.textContent) : null;
  } catch {}
  let config = configs[slug];
  if (!config) {
    try {
      const embedded = document.querySelector("#jvision-client-demo-project");
      let project = projectMeta || (embedded ? JSON.parse(embedded.textContent) : null);
      if (!project) {
        const response = await fetch("../../projects-index.json?v=20260730-2");
        const catalog = await response.json();
        project = catalog.projects?.find(item => item.repoName === slug);
      }
      if (project) {
        projectMeta = project;
        const [entity, stages] = profiles[project.category] || ["工作項目",["待建立","資料確認","執行中","待審核","已完成"]];
        const metrics = Array.isArray(project.operationalMetrics) && project.operationalMetrics.length >= 4
          ? project.operationalMetrics.slice(0,4)
          : [`${entity}總數`,"需優先處理","待審核","本週完成率"];
        const owners = ["陳怡君","林志豪","王雅雯"];
        const situations = [
          project.businessSituation || project.description,
          project.dailyUse || `等待${entity}負責人確認處理方式`,
          `主管需要在本週完成${entity}審核與結果追蹤`
        ];
        config = {
          accent: "#2458d3",
          title: `${project.title} 客戶操作實戰`,
          task: project.businessSituation || `完成「${project.title}」從建立、執行到結案的完整操作流程。`,
          entity,
          ownerLabel: `${entity}負責人`,
          stages,
          metrics,
          seed: situations.map((note,index)=>[
            `${project.title}－展示案例 ${index+1}`,
            owners[index],
            Math.min(index,stages.length-2),
            note
          ])
        };
      }
    } catch {}
  }
  if (!config || document.querySelector(".jv-client-demo")) return;
  if (slug === "jvision-property-management" && document.querySelector(".property-demo")) return;
  if (document.readyState !== "complete") {
    await new Promise(resolve => window.addEventListener("load", resolve, { once: true }));
  }
  await new Promise(resolve => setTimeout(resolve, 650));
  if (document.querySelector(".jv-client-demo")) return;
  if (config.variant === "oee") {
    mountOee();
    return;
  }
  if (projectMeta) {
    const { mountCustomerShowcase } = await import("../../shared/jvision-customer-showcase.js?v=20260731-3");
    if (mountCustomerShowcase({ project: projectMeta, slug })) return;
    const { mountDomainOperations } = await import("../../shared/jvision-domain-operations.js?v=20260730-11");
    mountDomainOperations({ project: projectMeta, slug });
    return;
  }
  const key = `jvision-client-demo:${slug}:v1`;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fresh = () => ({records:config.seed.map((r,i)=>({id:`${slug}-${i+1}`,name:r[0],owner:r[1],stage:r[2],note:r[3]})),selected:0,logs:["已載入客戶展示資料"]});
  let state;
  try { state = JSON.parse(localStorage.getItem(key)) || fresh(); } catch { state = fresh(); }
  const save = () => localStorage.setItem(key, JSON.stringify(state));
  const host = document.querySelector(".workspace") || document.querySelector("#demo") || document.querySelector("main") || document.body;
  const root = document.createElement("section");
  root.className = "jv-client-demo";
  root.style.setProperty("--demo-accent",config.accent);
  if (host.classList.contains("workspace")) host.append(root); else host.append(root);
  let activeGuideStep = -1;
  const log = text => { state.logs.unshift(`${new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}　${text}`); state.logs=state.logs.slice(0,6); };
  const completed = () => state.records.filter(r=>r.stage===config.stages.length-1).length;
  const render = () => {
    const selected=state.records[state.selected] || state.records[0];
    const progress=state.records.length ? Math.round(state.records.reduce((n,r)=>n+r.stage,0)/(state.records.length*(config.stages.length-1))*100) : 0;
    const stageCounts=config.stages.map((_,i)=>state.records.filter(r=>r.stage===i).length);
    const activeStage=Number.isInteger(state.filterStage)?state.filterStage:null;
    const visibleRecords=state.records.map((record,index)=>({record,index})).filter(entry=>activeStage===null||entry.record.stage===activeStage);
    root.innerHTML=`
      <div class="jv-demo-head"><div><p class="jv-demo-eyebrow">CUSTOMER HANDS-ON DEMO</p><h2>${esc(config.title)}</h2><p>${esc(config.task)}</p></div><button class="jv-demo-btn" data-guide data-jv-feedback="off">啟動操作導覽</button></div>
      <div class="jv-demo-toolbar"><div class="jv-demo-progress"><span style="width:${progress}%"></span></div><b>${progress}% 流程完成</b><button class="jv-demo-btn" data-reset>重設資料</button></div>
      <div class="jv-demo-kpis">${config.metrics.map((m,i)=>`<article class="jv-demo-kpi"><span>${esc(m)}</span><strong>${i===0?state.records.length:i===1?state.records.filter(r=>r.stage<2).length:i===2?state.records.filter(r=>r.stage===2).length:`${Math.max(72,88+completed()*3)}%`}</strong><small>依目前操作即時更新</small></article>`).join("")}</div>
      <div class="jv-demo-flow" style="--stage-count:${config.stages.length}">${config.stages.map((s,i)=>`<button class="jv-demo-stage ${activeStage===i?"active":""}" data-generic-stage="${i}" aria-pressed="${activeStage===i}"><b>${i+1}. ${esc(s)}</b><span>${stageCounts[i]} 筆${esc(config.entity)}</span></button>`).join("")}</div>
      <div class="jv-demo-workspace">
        <div class="jv-demo-panel"><div class="jv-demo-list-head"><h3>${activeStage===null?esc(config.entity)+"工作清單":esc(config.stages[activeStage])+"清單"}</h3>${activeStage===null?"":'<button class="jv-demo-btn" data-generic-clear-stage>顯示全部</button>'}</div><form class="jv-demo-create"><input name="name" required placeholder="輸入${esc(config.entity)}名稱"><input name="owner" required placeholder="${esc(config.ownerLabel)}"><button class="jv-demo-btn primary" type="submit">新增${esc(config.entity)}</button></form><div class="jv-demo-records">${visibleRecords.length?visibleRecords.map(({record:r,index:i})=>`<article class="jv-demo-record ${i===state.selected?"selected":""}"><div><strong>${esc(r.name)}</strong><small>${esc(r.note)} · ${esc(r.owner)}</small></div><div class="jv-demo-record-actions"><span class="jv-demo-status">${esc(config.stages[r.stage])}</span><button class="jv-demo-btn" data-select="${i}">查看詳情</button><button class="jv-demo-btn primary" data-advance="${i}" ${r.stage===config.stages.length-1?"disabled":""}>${r.stage===config.stages.length-1?"已完成":`推進至 ${esc(config.stages[r.stage+1])}`}</button></div></article>`).join(""):`<div class="jv-demo-empty"><b>${esc(config.stages[activeStage])}目前沒有資料</b><p>可新增${esc(config.entity)}，或切換其他流程階段查看。</p><button class="jv-demo-btn" data-generic-clear-stage>顯示全部資料</button></div>`}</div></div>
        <aside class="jv-demo-panel jv-demo-detail"><div class="jv-demo-detail-head"><h3>詳細資訊</h3><span class="jv-demo-status">${selected?esc(config.stages[selected.stage]):"尚無資料"}</span></div>${selected?`<dl><dt>名稱</dt><dd>${esc(selected.name)}</dd><dt>${esc(config.ownerLabel)}</dt><dd>${esc(selected.owner)}</dd><dt>目前狀態</dt><dd>${esc(config.stages[selected.stage])}</dd><dt>處理重點</dt><dd>${esc(selected.note)}</dd></dl><button class="jv-demo-btn" data-edit-note>更新處理紀錄</button>`:""}<div class="jv-demo-log"><h3>操作紀錄</h3>${state.logs.map(x=>`<p>${esc(x)}</p>`).join("")}</div>${progress===100?`<div class="jv-demo-complete"><b>展示任務完成</b><br>所有${esc(config.entity)}已完成流程，可向客戶說明處理時間與管理成果。</div>`:""}</aside>
      </div>
      <aside class="jv-demo-guide" hidden><b>操作導覽 1 / 4</b><p>先新增一筆${esc(config.entity)}，模擬客戶每天建立工作資料的動作。</p><div class="jv-demo-guide-actions"><button class="jv-demo-btn" data-guide-close data-jv-feedback="off">結束</button><button class="jv-demo-btn primary" data-guide-next data-jv-feedback="off">下一步</button></div></aside>`;
    bind();
  };
  const bind = () => {
    root.querySelectorAll("[data-generic-stage]").forEach(b=>b.addEventListener("click",()=>{const stage=Number(b.dataset.genericStage);state.filterStage=state.filterStage===stage?null:stage;if(state.filterStage!==null){const first=state.records.findIndex(r=>r.stage===state.filterStage);if(first>=0)state.selected=first;}save();render();}));
    root.querySelectorAll("[data-generic-clear-stage]").forEach(b=>b.addEventListener("click",()=>{state.filterStage=null;save();render();}));
    root.querySelector(".jv-demo-create").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.records.unshift({id:crypto.randomUUID(),name:f.get("name"),owner:f.get("owner"),stage:0,note:"剛建立，等待初步處理"});state.selected=0;state.filterStage=null;if(activeGuideStep===0)activeGuideStep=1;log(`新增${config.entity}：${f.get("name")}`);save();render();});
    root.querySelectorAll("[data-select]").forEach(b=>b.addEventListener("click",()=>{state.selected=Number(b.dataset.select);if(activeGuideStep===1)activeGuideStep=2;render();}));
    root.querySelectorAll("[data-advance]").forEach(b=>b.addEventListener("click",()=>{const i=Number(b.dataset.advance);state.records[i].stage++;state.selected=i;if(activeGuideStep===2)activeGuideStep=3;log(`${state.records[i].name} 推進至「${config.stages[state.records[i].stage]}」`);save();render();}));
    root.querySelector("[data-reset]").addEventListener("click",()=>{state=fresh();save();render();});
    root.querySelector("[data-edit-note]")?.addEventListener("click",()=>{const r=state.records[state.selected];r.note=`${config.stages[r.stage]}已補充客戶展示紀錄`;log(`更新${r.name}的處理紀錄`);save();render();});
    let guideIndex=Math.max(0,activeGuideStep); const guide=root.querySelector(".jv-demo-guide");
    const guideSteps=[
      {text:"在這裡輸入名稱與負責人，再按新增，建立一筆新的工作資料。",selector:".jv-demo-create",hint:"步驟 1｜在這裡新增資料"},
      {text:"點選一筆資料的「查看詳情」，右側會顯示負責人、狀態與處理重點。",selector:"[data-select]",hint:"步驟 2｜點這裡查看詳情"},
      {text:"按下推進按鈕，資料會依專案流程移動到下一個階段。",selector:"[data-advance]:not(:disabled)",hint:"步驟 3｜點這裡推進流程"},
      {text:"最後觀察 KPI、完成進度與操作紀錄如何隨操作即時更新。",selector:".jv-demo-kpis",hint:"步驟 4｜確認數字已更新"}
    ];
    const clearGuideFocus=()=>{root.querySelector(".jv-guide-focus")?.classList.remove("jv-guide-focus");root.querySelector("[data-guide-hint]")?.removeAttribute("data-guide-hint");root.querySelector(".jv-guide-overlay")?.remove();};
    const focusGuideStep=()=>{
      clearGuideFocus();
      const step=guideSteps[guideIndex];
      const overlay=document.createElement("div");overlay.className="jv-guide-overlay";root.append(overlay);
      const target=root.querySelector(step.selector);
      if(target){target.classList.add("jv-guide-focus");target.dataset.guideHint=step.hint;target.scrollIntoView({behavior:"smooth",block:"center"});}
      guide.querySelector("b").textContent=`操作導覽 ${guideIndex+1} / ${guideSteps.length}`;
      guide.querySelector("p").textContent=step.text;
      const next=guide.querySelector("[data-guide-next]");
      next.disabled=guideIndex<guideSteps.length-1;
      next.textContent=guideIndex===guideSteps.length-1?"完成":"請完成畫面操作";
    };
    root.querySelector("[data-guide]").addEventListener("click",()=>{activeGuideStep=0;guideIndex=0;guide.hidden=false;focusGuideStep();});
    root.querySelector("[data-guide-close]").addEventListener("click",()=>{activeGuideStep=-1;guide.hidden=true;clearGuideFocus();});
    root.querySelector("[data-guide-next]").addEventListener("click",()=>{if(guideIndex<guideSteps.length-1)return;activeGuideStep=-1;guide.hidden=true;clearGuideFocus();});
    if(activeGuideStep>=0)setTimeout(()=>{guideIndex=activeGuideStep;guide.hidden=false;focusGuideStep();},0);
  };
  render();
  if (new URLSearchParams(location.search).get("mode") === "guided") {
    const launchGuide = (attempt = 0) => {
      const button = root.querySelector("[data-guide]");
      if (button) button.click();
      else if (attempt < 12) setTimeout(() => launchGuide(attempt + 1), 250);
    };
    setTimeout(launchGuide, 180);
  }
})();
