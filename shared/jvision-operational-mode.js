(()=>{const boot=()=>{
  const metaNode=document.getElementById("jvision-client-demo-project");
  if(!metaNode||document.querySelector(".jv-ops-mode"))return;
  let project;try{project=JSON.parse(metaNode.textContent||"{}")}catch{return}
  const slug=project.repoName||location.pathname.split("/").filter(Boolean).at(-1)||"demo";
  if(["jvision-staff-dispatch","jvision-ai-case-001-production-scheduler"].includes(slug))return;

  const archetypes={
    "生產製造":{entity:"生產工單",create:"新增生產工單",fields:["產品／料號","需求數量","指定產線"],stages:["待排程","生產中","待品檢","已完成"],risks:["物料短缺","產能衝突","交期風險"]},
    "品質管理":{entity:"品質異常",create:"建立品質異常",fields:["缺陷／問題","批次編號","責任單位"],stages:["待判定","原因分析","改善中","已結案"],risks:["重複發生","影響出貨","證據不足"]},
    "採購供應鏈":{entity:"採購案件",create:"新增採購需求",fields:["採購品項","需求數量","需求部門"],stages:["待詢價","比價中","待核准","已下單"],risks:["交期延誤","價格異常","單一來源"]},
    "業務銷售":{entity:"銷售商機",create:"新增銷售商機",fields:["客戶／商機","預估金額","負責業務"],stages:["新商機","需求確認","提案中","已成交"],risks:["停滯過久","競品介入","預算未定"]},
    "人力資源":{entity:"人員作業",create:"新增人員作業",fields:["人員／職缺","所屬單位","負責主管"],stages:["待處理","審核中","執行中","已完成"],risks:["資格不符","工時衝突","文件缺漏"]},
    "財務會計":{entity:"帳務單據",create:"新增帳務單據",fields:["單據／對象","含稅金額","會計科目"],stages:["待入帳","待覆核","待付款","已結清"],risks:["金額不符","憑證缺漏","逾期風險"]},
    "金融保險":{entity:"審核案件",create:"新增審核案件",fields:["申請人／案件","申請金額","審核人員"],stages:["資料待補","風險審查","待核准","已結案"],risks:["風險偏高","文件異常","額度超限"]},
    "醫療照護":{entity:"照護案件",create:"新增照護案件",fields:["個案／服務","預定日期","負責人員"],stages:["待評估","計畫中","執行中","已完成"],risks:["高風險個案","排程衝突","紀錄缺漏"]},
    "教育":{entity:"教學任務",create:"新增教學任務",fields:["課程／學生","預定日期","負責教師"],stages:["待規劃","準備中","進行中","已完成"],risks:["進度落後","出席異常","教材缺漏"]},
    "物流運輸":{entity:"配送任務",create:"新增配送任務",fields:["客戶／路線","件數／重量","負責司機"],stages:["待派車","運送中","待簽收","已完成"],risks:["延誤風險","容量超限","簽收異常"]},
    "交通運輸":{entity:"運輸任務",create:"新增運輸任務",fields:["車輛／路線","預定時間","負責人員"],stages:["待調度","執行中","待回報","已完成"],risks:["車況異常","時數超限","路線延誤"]},
    "倉儲物流":{entity:"倉儲作業",create:"新增倉儲作業",fields:["波次／品項","作業數量","負責區域"],stages:["待揀貨","揀貨中","待覆核","已出庫"],risks:["庫存不足","儲位異常","作業逾時"]},
    "資訊安全":{entity:"資安事件",create:"建立資安事件",fields:["事件／資產","嚴重程度","負責人員"],stages:["待分級","調查中","處置中","已關閉"],risks:["高風險曝險","橫向移動","證據不足"]},
    "資訊科技":{entity:"服務請求",create:"新增服務請求",fields:["服務／系統","影響範圍","負責工程師"],stages:["待受理","處理中","待驗證","已完成"],risks:["SLA 逾時","影響擴大","變更失敗"]},
    "ESG 永續":{entity:"永續任務",create:"新增永續任務",fields:["據點／指標","目標數值","負責單位"],stages:["待盤查","資料覆核","改善中","已揭露"],risks:["資料缺漏","異常增幅","查證未通過"]},
    "營建工程":{entity:"工程任務",create:"新增工程任務",fields:["工項／區域","預定日期","負責廠商"],stages:["待施工","施工中","待查驗","已完成"],risks:["進度落後","品質缺失","安全風險"]},
    "零售電商":{entity:"商品／訂單",create:"新增營運任務",fields:["商品／訂單","數量／金額","負責門市"],stages:["待處理","處理中","待交付","已完成"],risks:["庫存不足","退貨異常","履約延誤"]},
    "餐飲旅宿":{entity:"預訂／服務單",create:"新增服務需求",fields:["顧客／桌房","預定時間","負責人員"],stages:["待確認","準備中","服務中","已完成"],risks:["超額預訂","備料不足","服務延誤"]},
    "設備維護":{entity:"維修工單",create:"新增維修工單",fields:["設備／位置","故障現象","負責技師"],stages:["待派工","檢修中","待驗收","已完成"],risks:["停機擴大","備件不足","重複故障"]},
    "客服管理":{entity:"客服案件",create:"新增客服案件",fields:["客戶／主旨","服務等級","負責專員"],stages:["待受理","處理中","待回覆","已結案"],risks:["SLA 逾時","客戶升級","重複來件"]},
    "房地產與物業":{entity:"物業案件",create:"新增物業案件",fields:["物件／住戶","服務類型","負責人員"],stages:["待受理","安排中","執行中","已完成"],risks:["逾期未處理","費用爭議","安全風險"]},
    "研發管理":{entity:"研發任務",create:"新增研發任務",fields:["專案／料號","變更內容","負責工程師"],stages:["待評估","設計中","驗證中","已發行"],risks:["規格衝突","驗證失敗","版本錯置"]},
    "企業協作":{entity:"協作任務",create:"新增協作任務",fields:["專案／事項","截止日期","負責人員"],stages:["待分派","執行中","待確認","已完成"],risks:["逾期風險","責任不清","依賴阻塞"]},
    "數據分析":{entity:"分析議題",create:"新增分析議題",fields:["指標／主題","分析期間","負責分析師"],stages:["待分析","處理中","待驗證","已發布"],risks:["資料異常","口徑不一","樣本不足"]},
    "經營管理":{entity:"經營議題",create:"新增經營議題",fields:["目標／議題","目標數值","負責主管"],stages:["待評估","執行中","待檢討","已完成"],risks:["目標落後","資源衝突","決策待定"]},
    "專業服務":{entity:"專業案件",create:"新增專業案件",fields:["客戶／案件","服務範圍","負責顧問"],stages:["待受理","執行中","待覆核","已交付"],risks:["範圍變更","時程延誤","文件缺漏"]},
    "生活服務":{entity:"服務預約",create:"新增服務預約",fields:["顧客／服務","預約時間","服務人員"],stages:["待確認","已排程","服務中","已完成"],risks:["時段衝突","人員不足","顧客取消"]},
    "宗教服務":{entity:"服務事項",create:"新增服務事項",fields:["信眾／事項","預定日期","負責人員"],stages:["待確認","準備中","執行中","已完成"],risks:["時段衝突","資料缺漏","資源不足"]}
  };
  const fallback={entity:"營運案件",create:"新增營運案件",fields:["案件／主題","預定日期","負責人員"],stages:["待處理","執行中","待確認","已完成"],risks:["資料缺漏","進度落後","待主管確認"]};
  const model=archetypes[project.category]||fallback;
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const hash=[...slug].reduce((sum,char)=>sum+char.charCodeAt(0),0);
  const owners=["陳怡君","林志明","王俊豪","張雅婷","黃建中"];
  const seed=Array.from({length:6},(_,i)=>({id:`${slug.slice(-8).toUpperCase()}-${String(i+1).padStart(2,"0")}`,name:`${project.title}｜${model.entity} ${i+1}`,target:`${model.fields[0]} ${String.fromCharCode(65+i)}`,owner:owners[(hash+i)%owners.length],status:model.stages[i%model.stages.length],risk:model.risks[i%model.risks.length],done:i%model.stages.length===model.stages.length-1,score:92-i*7}));
  const storageKey=`jvision-ops-mode:${slug}:v1`;
  let state;try{state=JSON.parse(localStorage.getItem(storageKey))}catch{}
  if(!state||!Array.isArray(state.records))state={records:seed.map(row=>({...row})),logs:[]};
  const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(state))}catch{}};
  let active="overview",query="",filter="all",modal=null,preview=false,draft={},searchTimer;
  const metrics=(Array.isArray(project.operationalMetrics)?project.operationalMetrics:[]).slice(0,4);
  while(metrics.length<4)metrics.push(["待處理","例外風險","本週完成","準時率"][metrics.length]);
  const root=document.createElement("section");root.className="jv-ops-mode";root.style.setProperty("--jvo-brand",["#1e40af","#0f766e","#7c3aed","#9a3412"][hash%4]);
  const host=document.querySelector(".workspace")||document.querySelector("main")||document.body;
  const topbar=host.querySelector?.(":scope > .topbar")||host.querySelector?.(":scope > .site-header");
  if(topbar)topbar.insertAdjacentElement("afterend",root);else host.prepend(root);
  const visible=()=>state.records.filter(row=>(!query||Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase()))&&(filter==="all"||row.status===filter||(filter==="risk"&&!row.done)));
  function render(){
    const pageTitle={overview:"營運總覽",records:model.entity,exceptions:"例外與風險",review:"覆核中心",reports:"成效報表"}[active];
    const pending=state.records.filter(row=>!row.done).length,done=state.records.filter(row=>row.done).length,risky=state.records.filter(row=>!row.done&&row.score<85).length;
    root.innerHTML=`<div class="jv-ops-shell"><aside class="jv-ops-side"><div class="jv-ops-brand"><span>${esc(project.category||"營運管理")}</span><strong>${esc(model.entity)}中心</strong></div><nav class="jv-ops-nav">${[["overview","01","營運總覽","今日狀態"],["records","02",model.entity,`${state.records.length} 筆`],["exceptions","03","例外與風險",`${risky} 項`],["review","04","覆核中心",`${pending} 待確認`],["reports","05","成效報表","趨勢與結果"]].map(([id,no,label,hint])=>`<button data-view="${id}" class="${active===id?"active":""}"><b>${no}</b><span><strong>${esc(label)}</strong><small>${esc(hint)}</small></span></button>`).join("")}</nav><button class="jv-ops-reset" data-reset>重設示範資料</button></aside><div class="jv-ops-main"><header class="jv-ops-top"><div class="jv-ops-title"><p>${esc(project.title)} · OPERATION MODE</p><h2>${esc(pageTitle)}</h2></div><span class="jv-ops-user">營</span></header>${renderPage({pending,done,risky})}</div></div>${modal?renderModal():""}`;
    bind();
  }
  function renderPage(counts){
    const pageTitle={overview:"營運總覽",records:model.entity,exceptions:"例外與風險",review:"覆核中心",reports:"成效報表"}[active];
    if(active==="overview")return `<div class="jv-ops-page"><div class="jv-ops-head"><div><span>依專案內容建立的操作模式</span><h3>${esc(project.title)}營運中心</h3><p>${esc(project.businessSituation||project.description||`集中管理${model.entity}、例外與結果。`)}</p></div><button class="jv-ops-primary" data-create>${esc(model.create)}</button></div><div class="jv-ops-kpis">${metrics.map((label,i)=>`<article class="jv-ops-card"><span>${esc(label)}</span><strong>${[counts.pending,counts.risky,counts.done,`${Math.max(82,97-counts.risky)}%`][i]}</strong><small>${i<2?"需要關注":"狀態已同步"}</small></article>`).join("")}</div><div class="jv-ops-grid"><section class="jv-ops-panel"><h4>優先待辦</h4>${state.records.slice(0,4).map(row=>task(row)).join("")}</section><section class="jv-ops-panel"><h4>流程分布</h4><div class="jv-ops-bars">${model.stages.map(stage=>{const n=state.records.filter(row=>row.status===stage).length,p=Math.round(n/Math.max(1,state.records.length)*100);return `<div class="jv-ops-bar"><span>${esc(stage)}</span><i style="--bar:${Math.max(6,p)}%"></i><b>${n}</b></div>`}).join("")}</div></section></div></div>`;
    if(active==="reports")return `<div class="jv-ops-page"><div class="jv-ops-head"><div><span>結果與趨勢</span><h3>${esc(project.title)}成效報表</h3><p>所有數字會隨操作結果同步更新。</p></div><button class="jv-ops-primary" data-export>匯出目前報表</button></div><div class="jv-ops-kpis">${metrics.map((label,i)=>`<article class="jv-ops-card"><span>${esc(label)}</span><strong>${[counts.pending,counts.risky,counts.done,`${Math.max(82,97-counts.risky)}%`][i]}</strong><small>即時資料</small></article>`).join("")}</div><section class="jv-ops-panel"><h4>各階段案件量</h4><div class="jv-ops-bars">${model.stages.map((stage,i)=>`<div class="jv-ops-bar"><span>${esc(stage)}</span><i style="--bar:${Math.min(96,28+i*19)}%"></i><b>${state.records.filter(row=>row.status===stage).length}</b></div>`).join("")}</div></section></div>`;
    const rows=active==="exceptions"?state.records.filter(row=>!row.done&&row.score<85):active==="review"?state.records.filter(row=>!row.done):visible();
    return `<div class="jv-ops-page"><div class="jv-ops-head"><div><span>${active==="exceptions"?"需要人工判斷":active==="review"?"確認後才會完成":"OPERATION RECORDS"}</span><h3>${esc(pageTitle)}</h3><p>${esc(project.dailyUse||`管理${model.entity}的建立、處理、覆核與完成結果。`)}</p></div>${active==="records"?`<button class="jv-ops-primary" data-create>${esc(model.create)}</button>`:""}</div><section class="jv-ops-panel" style="padding:0">${active==="records"?`<div class="jv-ops-tools"><input data-search value="${esc(query)}" placeholder="搜尋${esc(model.entity)}"><select data-filter><option value="all">全部狀態</option><option value="risk" ${filter==="risk"?"selected":""}>需處理</option>${model.stages.map(s=>`<option ${filter===s?"selected":""}>${esc(s)}</option>`).join("")}</select></div><div class="jv-ops-summary">顯示 ${rows.length}／${state.records.length} 筆</div>`:""}<div class="jv-ops-table-wrap"><table class="jv-ops-table"><thead><tr><th>${esc(model.entity)}</th><th>${esc(model.fields[0])}</th><th>負責人</th><th>風險</th><th>狀態</th><th>操作</th></tr></thead><tbody>${rows.length?rows.map(row=>tableRow(row)).join(""):`<tr><td colspan="6" class="jv-ops-empty">目前沒有符合條件的資料。</td></tr>`}</tbody></table></div></section></div>`;
  }
  const task=row=>`<button class="jv-ops-task ${row.done?"done":""}" data-record="${esc(row.id)}"><span>${row.done?"完":"急"}</span><div><strong>${esc(row.name)}</strong><small>${esc(row.risk)} · ${esc(row.owner)}</small></div><b>${row.done?"查看":"處理"}</b></button>`;
  const tableRow=row=>`<tr><td><strong>${esc(row.name)}</strong><br><small>${esc(row.id)}</small></td><td>${esc(row.target)}</td><td>${esc(row.owner)}</td><td>${esc(row.risk)}</td><td><span class="jv-ops-status ${row.done?"":"warn"}">${esc(row.status)}</span></td><td><button class="jv-ops-row-action" data-advance="${esc(row.id)}" ${row.done?"disabled":""}>${row.done?"已完成":"推進流程"}</button></td></tr>`;
  function renderModal(){return `<div class="jv-ops-modal-backdrop"><section class="jv-ops-modal" role="dialog" aria-modal="true"><header><h3>${preview?"確認執行影響":esc(modal.title)}</h3><button class="jv-ops-close" data-close aria-label="關閉">×</button></header>${preview?`<div class="jv-ops-form"><div class="jv-ops-preview"><strong>資料檢查完成</strong><p>${esc(draft.name||modal.title)}將建立於「${esc(model.stages[0])}」，所有後續狀態需人工確認。</p></div></div>`:`<form class="jv-ops-form" data-form><label>${esc(model.fields[0])}<input name="name" required value="${esc(draft.name||`${project.title}｜新${model.entity}`)}"></label><label>${esc(model.fields[1])}<input name="target" required value="${esc(draft.target||"待確認")}"></label><label>${esc(model.fields[2])}<input name="owner" required value="${esc(draft.owner||owners[hash%owners.length])}"></label><label>風險條件<select name="risk">${model.risks.map(r=>`<option>${esc(r)}</option>`).join("")}</select></label></form>`}<footer><button class="jv-ops-secondary" data-back>${preview?"返回修改":"取消"}</button><button class="jv-ops-primary" data-confirm>${preview?"確認建立":"預覽影響"}</button></footer></section></div>`}
  function bind(){
    root.querySelectorAll("button").forEach(button=>{button.type="button"});
    root.querySelectorAll("[data-view]").forEach(btn=>btn.addEventListener("click",()=>{active=btn.dataset.view;query="";filter="all";render()}));
    root.querySelectorAll("[data-create]").forEach(btn=>btn.addEventListener("click",()=>{modal={title:model.create};preview=false;draft={};render()}));
    root.querySelector("[data-search]")?.addEventListener("input",e=>{query=e.target.value;window.clearTimeout(searchTimer);searchTimer=window.setTimeout(render,220)});
    root.querySelector("[data-filter]")?.addEventListener("change",e=>{filter=e.target.value;render()});
    root.querySelectorAll("[data-advance]").forEach(btn=>btn.addEventListener("click",()=>advance(btn.dataset.advance)));
    root.querySelectorAll("[data-record]").forEach(btn=>btn.addEventListener("click",()=>{active="records";query=btn.dataset.record;render()}));
    root.querySelector("[data-reset]")?.addEventListener("click",()=>{state={records:seed.map(row=>({...row})),logs:[]};save();render();toast("示範資料已重設")});
    root.querySelector("[data-close]")?.addEventListener("click",()=>{modal=null;preview=false;render()});
    root.querySelector("[data-back]")?.addEventListener("click",()=>{if(preview){preview=false;render()}else{modal=null;render()}});
    root.querySelector("[data-confirm]")?.addEventListener("click",()=>{if(!preview){const form=root.querySelector("[data-form]");if(!form.reportValidity())return;draft=Object.fromEntries(new FormData(form));preview=true;render();return}state.records.unshift({id:`${slug.slice(-6).toUpperCase()}-${Date.now().toString().slice(-5)}`,name:draft.name,target:draft.target,owner:draft.owner,status:model.stages[0],risk:draft.risk,done:false,score:86});save();modal=null;preview=false;active="records";query=draft.name;render();toast(`${model.entity}已新增並顯示於列表`)});
    root.querySelector("[data-export]")?.addEventListener("click",()=>{const text=[project.title,...state.records.map(r=>[r.id,r.name,r.owner,r.status].join(","))].join("\n"),url=URL.createObjectURL(new Blob([text],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download=`${slug}-report.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),0);toast("報表已產生")});
  }
  function advance(id){const row=state.records.find(r=>r.id===id);if(!row)return;const index=model.stages.indexOf(row.status),next=Math.min(model.stages.length-1,index+1);row.status=model.stages[next];row.done=next===model.stages.length-1;row.score=Math.min(99,row.score+5);save();render();toast(row.done?`${model.entity}已完成`:`已推進至「${row.status}」`)}
  function toast(message){document.querySelector(".jv-ops-toast")?.remove();const el=document.createElement("div");el.className="jv-ops-toast";el.textContent=message;document.body.append(el);setTimeout(()=>el.remove(),2400)}
  render();
};if(document.readyState==="complete")window.setTimeout(boot,900);else window.addEventListener("load",()=>window.setTimeout(boot,900),{once:true})})();
