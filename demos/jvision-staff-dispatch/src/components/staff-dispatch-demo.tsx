"use client";

import { FormEvent, useMemo, useState } from "react";

type Module = "overview" | "dispatch" | "sites" | "people" | "attendance" | "billing" | "ai";
type Candidate = { id: number; name: string; distance: string; hours: number; qualified: boolean; score: number; conflict?: string };

const candidates: Candidate[] = [
  { id: 1, name: "陳怡安", distance: "4.2 km", hours: 24, qualified: true, score: 96 },
  { id: 2, name: "林志豪", distance: "6.8 km", hours: 31, qualified: true, score: 91 },
  { id: 3, name: "王俊傑", distance: "3.1 km", hours: 38, qualified: true, score: 72, conflict: "派工後將達 46 小時" },
  { id: 4, name: "張雅雯", distance: "9.5 km", hours: 20, qualified: false, score: 61, conflict: "缺少包裝線安全訓練" },
];

const modules: Array<{ id: Module; label: string; hint: string }> = [
  { id: "overview", label: "營運總覽", hint: "今日狀態" },
  { id: "dispatch", label: "缺工派遣", hint: "2 件待處理" },
  { id: "sites", label: "案場班表", hint: "8 個案場" },
  { id: "people", label: "人員資料庫", hint: "128 人" },
  { id: "attendance", label: "出勤工時", hint: "4 筆異常" },
  { id: "billing", label: "薪資請款", hint: "本期結算" },
  { id: "ai", label: "AI 調度中心", hint: "3 項建議" },
];

const initialSiteRows = [["新竹電子包裝線","6","4","2","黃建中","需補人"],["湖口物流中心","18","18","0","鄭文祥","已滿足"],["竹北商辦清潔","13","12","1","劉怡君","待回覆"],["新豐食品工廠","20","20","0","陳世宏","已滿足"],["桃園電商倉","32","30","2","王雅婷","媒合中"]];
const initialPeopleRows = [["陳怡安","電子包裝、品檢","2027/04/30","24 h","99%","可派遣"],["林志豪","倉儲、理貨","2026/12/18","31 h","97%","可派遣"],["王俊傑","包裝、堆高機","2027/02/10","38 h","96%","工時預警"],["張雅雯","食品包裝","已到期","20 h","98%","資格異常"],["周冠宇","倉儲、盤點","2027/08/01","16 h","95%","休假中"]];
const initialAttendanceRows = [["陳怡安","湖口物流中心","07:53","17:06","8.2 h","正常"],["林志豪","竹北商辦清潔","08:12","17:03","7.9 h","遲到 12 分"],["王俊傑","新豐食品工廠","07:48","—","—","漏刷退"],["張雅雯","桃園電商倉","07:55","19:14","10.3 h","加班待核"],["周冠宇","湖口物流中心","07:58","17:01","8.0 h","正常"]];
const initialBillingRows = [["新竹電子包裝線","1,248 h","238,400","291,720","18.3%","待確認"],["湖口物流中心","1,890 h","356,200","439,800","19.0%","可開票"],["竹北商辦清潔","892 h","168,700","203,100","16.9%","工時覆核中"],["新豐食品工廠","1,566 h","291,800","360,180","19.0%","可開票"]];

function MiniIcon({ name }: { name: Module }) {
  const paths: Record<Module, string> = {
    overview: "M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z",
    dispatch: "M5 5h14v10H8l-3 3V5Zm4 4h6M9 12h4",
    sites: "M4 20V7l8-4 8 4v13M8 20v-6h8v6M8 9h.01M12 9h.01M16 9h.01",
    people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    attendance: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    billing: "M6 2h9l4 4v16H6V2Zm3 8h6m-6 4h6m-6 4h4",
    ai: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export function StaffDispatchDemo() {
  const [active, setActive] = useState<Module>("overview");
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [siteRows, setSiteRows] = useState(initialSiteRows);
  const [peopleRows, setPeopleRows] = useState(initialPeopleRows);
  const [attendanceRows, setAttendanceRows] = useState(initialAttendanceRows);
  const [billingRows, setBillingRows] = useState(initialBillingRows);
  const [resolvedAi, setResolvedAi] = useState<string[]>([]);
  const validSelected = useMemo(() => selected.filter((id) => !candidates.find((p) => p.id === id)?.conflict), [selected]);

  function openAction(name: string) { setAction(name); }
  function completeAction(name: string, payload: Record<string, string>) {
    if (name === "新增案場需求") {
      const need = String(Number(payload.need || 1));
      setSiteRows((rows) => [[payload.site || "新案場", need, "0", need, payload.manager || "待指派", "待媒合"], ...rows]);
    }
    if (name === "新增派遣人員") {
      setPeopleRows((rows) => [[payload.person || "新進人員", payload.skill || "待建檔", "待補件", "0 h", "—", "待審核"], ...rows]);
    }
    if (name === "批次覆核正常工時") {
      setAttendanceRows((rows) => rows.map((row) => row[5] === "正常" ? [...row.slice(0, 5), "已覆核"] : row));
    }
    if (name === "建立結算草稿") {
      setBillingRows((rows) => rows.map((row) => row[5] === "待確認" ? [...row.slice(0, 5), "草稿已建立"] : row));
    }
    if (name.includes("班表調整")) setResolvedAi((items) => [...new Set([...items, "schedule"])]);
    if (name.includes("續訓通知")) setResolvedAi((items) => [...new Set([...items, "training"])]);
    if (name.includes("匯出")) downloadDemoFile(name);
    setCompletedActions((items) => [name, ...items].slice(0, 3));
    setAction(null);
  }
  function openDispatch() { setActive("dispatch"); if (!confirmed) setStep(1); }
  function restartDispatch() { setActive("dispatch"); setStep(1); setSelected([]); setConfirmed(false); }
  function toggle(person: Candidate) {
    if (person.conflict || !person.qualified || confirmed) return;
    setSelected((now) => now.includes(person.id) ? now.filter((id) => id !== person.id) : now.length < 2 ? [...now, person.id] : now);
  }

  return (
    <section className="ops-app" aria-label="人力派遣營運系統">
      <aside className="ops-sidebar">
        <div className="workspace-name"><span>營運中心</span><strong>北區派遣團隊</strong></div>
        <nav aria-label="系統模組">
          {modules.map((item) => <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}><MiniIcon name={item.id} /><span><strong>{item.label}</strong><small>{item.hint}</small></span></button>)}
        </nav>
        <div className="sync-state"><span className="pulse" /><div><strong>資料已同步</strong><small>今天 17:08</small></div></div>
      </aside>

      <div className="ops-main">
        <header className="ops-topbar">
          <div><p>JVision Workforce OS</p><h2>{modules.find((item) => item.id === active)?.label}</h2></div>
          <div className="top-actions"><button onClick={() => openAction("匯出目前檢視")}>匯出</button><button className="avatar" aria-label="使用者帳號">林</button></div>
        </header>

        {active === "overview" && <Overview dispatchCompleted={confirmed} onDispatch={openDispatch} onNavigate={setActive} />}
        {active === "dispatch" && <DispatchFlow step={step} setStep={setStep} selected={selected} validSelected={validSelected} confirmed={confirmed} toggle={toggle} confirm={() => { setConfirmed(true); setStep(3); }} reset={restartDispatch} />}
        {active === "sites" && <Sites rows={siteRows} onAction={openAction} />}
        {active === "people" && <People rows={peopleRows} onAction={openAction} />}
        {active === "attendance" && <Attendance rows={attendanceRows} onAction={openAction} />}
        {active === "billing" && <Billing rows={billingRows} onAction={openAction} />}
        {active === "ai" && <AiCenter resolved={resolvedAi} onDispatch={openDispatch} onAction={openAction} />}
        {completedActions.length > 0 && <div className="recent-save" role="status">最近完成：{completedActions[0]}</div>}
        {action && <ActionPanel action={action} onClose={() => setAction(null)} onComplete={completeAction} />}
      </div>
    </section>
  );
}

function Overview({ dispatchCompleted, onDispatch, onNavigate }: { dispatchCompleted: boolean; onDispatch: () => void; onNavigate: (module: Module) => void }) {
  return <div className="module-page">
    <div className="module-title"><div><p className="eyebrow">2026/08/12 · 週三</p><h3>今天有 3 件事需要你處理</h3><p>優先處理缺工與出勤異常，避免影響明日開線和本期結薪。</p></div><button className="primary" onClick={onDispatch}>處理明日缺工</button></div>
    <div className="kpi-row">
      <article><span>今日到班率</span><strong>96.8%</strong><small className="up">較昨日 +1.4%</small></article>
      <article><span>明日待補人數</span><strong>{dispatchCompleted ? "0 人" : "2 人"}</strong><small className={dispatchCompleted ? "up" : "down"}>{dispatchCompleted ? "缺口已補齊" : "新竹包裝線"}</small></article>
      <article><span>待覆核工時</span><strong>4 筆</strong><small>共 31.5 小時</small></article>
      <article><span>本月預估毛利</span><strong>18.7%</strong><small className="up">目標 18.0%</small></article>
    </div>
    <div className="overview-grid">
      <section className="data-card priority-card"><div className="card-head"><div><span>待辦優先序</span><h4>營運異常</h4></div><span className="badge red">3 件</span></div>
        <button className="task-row" onClick={onDispatch}><span className={`priority ${dispatchCompleted ? "low" : "high"}`}>{dispatchCompleted ? "完" : "高"}</span><div><strong>{dispatchCompleted ? "新竹電子包裝線已補齊" : "新竹電子包裝線缺 2 人"}</strong><small>{dispatchCompleted ? "6 人皆已確認到班" : "明日 08:00 到班 · 距截止 2 小時"}</small></div><b>{dispatchCompleted ? "查看" : "處理"}</b></button>
        <button className="task-row" onClick={() => onNavigate("attendance")}><span className="priority medium">中</span><div><strong>湖口倉儲有 2 筆工時異常</strong><small>加班超過班表，需要主管覆核</small></div><b>查看</b></button>
        <button className="task-row" onClick={() => onNavigate("people")}><span className="priority low">低</span><div><strong>3 張證照將在 30 天內到期</strong><small>已排定人員可能受影響</small></div><b>查看</b></button>
      </section>
      <section className="data-card"><div className="card-head"><div><span>今日人力</span><h4>案場到班狀態</h4></div><button className="text-button" onClick={() => onNavigate("sites")}>查看全部</button></div>
        {[['新竹電子包裝線','24 / 24','100%'],['湖口物流中心','17 / 18','94%'],['竹北商辦清潔','12 / 13','92%'],['新豐食品工廠','20 / 20','100%']].map((row) => <div className="site-progress" key={row[0]}><div><strong>{row[0]}</strong><small>{row[1]} 到班</small></div><div className="progress"><i style={{width:row[2]}} /></div><b>{row[2]}</b></div>)}
      </section>
    </div>
    <section className="data-card trend-card"><div className="card-head"><div><span>近 7 日</span><h4>需求與到班人數</h4></div><div className="legend"><span><i className="need" />需求</span><span><i className="arrived" />到班</span></div></div><div className="bar-chart">{[[82,80],[88,86],[76,75],[94,91],[90,89],[68,67],[72,70]].map((v,i)=><div key={i}><span><i style={{height:`${v[0]}%`}} /><i style={{height:`${v[1]}%`}} /></span><small>{['四','五','六','日','一','二','三'][i]}</small></div>)}</div></section>
  </div>;
}

function DispatchFlow(props: { step:number; setStep:(n:number)=>void; selected:number[]; validSelected:number[]; confirmed:boolean; toggle:(p:Candidate)=>void; confirm:()=>void; reset:()=>void }) {
  const {step,setStep,selected,validSelected,confirmed,toggle,confirm,reset}=props;
  return <div className="module-page dispatch-module"><div className="module-title"><div><p className="eyebrow">案件 WD-0812-1847</p><h3>新竹電子包裝線｜明日早班缺工</h3><p>需求 6 人，目前 4 人確認，請完成資格媒合與補派。</p></div><span className="badge red">缺 2 人</span></div>
    <nav className="step-nav">{[[1,'確認需求'],[2,'媒合人員'],[3,'派工結果']].map(([n,l])=><button key={n} className={step===n?'active':step>Number(n)?'done':''} onClick={()=>Number(n)<step&&setStep(Number(n))}><span>{step>Number(n)?'✓':n}</span><strong>{l}</strong></button>)}</nav>
    <div className="workflow-content">
      {step===1&&<div className="stage"><div className="stage-heading"><div><p className="eyebrow">先確認派工條件</p><h2>早班臨時增援</h2></div><span className="status warning">明日 08:00</span></div><div className="requirement-grid"><article><span>班別</span><strong>08:00–17:00</strong><small>休息 1 小時</small></article><article><span>工作內容</span><strong>包裝與貼標</strong><small>站立作業</small></article><article><span>必要資格</span><strong>包裝線安全訓練</strong><small>證照在效期內</small></article><article><span>計價</span><strong>NT$ 245／小時</strong><small>交通津貼 150</small></article></div><div className="evidence"><strong>需求來源</strong><span>客戶訂單 SO-240812-07 · 案場主管 16:42 確認</span></div><button className="primary" onClick={()=>setStep(2)}>條件正確，開始媒合 2 人</button></div>}
      {step===2&&<div className="stage"><div className="stage-heading"><div><p className="eyebrow">AI 已依條件排序</p><h2>選擇 2 位可安全派工的人員</h2></div><span className={`status ${validSelected.length===2?'success':'warning'}`}>已選 {validSelected.length}/2</span></div><div className="ai-note"><strong>建議依據</strong><p>資格效期、班表衝突、每週工時、距離與歷史到班率。</p></div><div className="candidate-list">{candidates.map(p=><button key={p.id} className={`candidate ${selected.includes(p.id)?'selected':''} ${p.conflict?'blocked':''}`} onClick={()=>toggle(p)}><span className="check">{selected.includes(p.id)?'✓':p.conflict?'!':''}</span><div className="candidate-main"><strong>{p.name} <em>{p.score} 分</em></strong><small>距案場 {p.distance} · 本週 {p.hours} 小時</small></div><div className="candidate-state"><span className={p.qualified?'ok':'bad'}>{p.qualified?'資格有效':'資格不符'}</span>{p.conflict&&<small>{p.conflict}</small>}</div></button>)}</div><div className="action-row"><button className="secondary" onClick={()=>setStep(1)}>返回需求</button><button className="primary" disabled={validSelected.length!==2} onClick={confirm}>確認派工並發送通知</button></div></div>}
      {step===3&&confirmed&&<div className="stage"><div className="result-banner"><span>✓</span><div><p className="eyebrow">派工完成</p><h2>6 人已全數確認到班</h2><p>通知已傳送，回覆與稽核紀錄已保存。</p></div></div><div className="before-after"><article><span>人力缺口</span><strong><del>2 人</del> → 0 人</strong></article><article><span>資格未確認</span><strong><del>2 項</del> → 0 項</strong></article><article><span>預估成本</span><strong>NT$ 4,220</strong></article><article><span>預估毛利率</span><strong>18.4%</strong></article></div><div className="timecard"><div><strong>後續自動接續</strong><span>QR 簽到 → 工時覆核 → 薪資結算 → 客戶請款</span></div><span className="audit">WD-0812-1847</span></div><button className="secondary" onClick={reset}>重新體驗</button></div>}
    </div></div>;
}

function Sites({rows,onAction}:{rows:string[][];onAction:(s:string)=>void}) { return <TableModule title="案場與未來 7 日班表" subtitle="快速掌握需求、到班與缺口" action="新增案場需求" onAction={onAction} headers={['案場','明日需求','已確認','缺口','主管','狀態']} rows={rows} />; }
function People({rows,onAction}:{rows:string[][];onAction:(s:string)=>void}) { return <TableModule title="派遣人員資料庫" subtitle="技能、資格、可用時段與派工紀錄" action="新增派遣人員" onAction={onAction} headers={['人員','核心技能','資格效期','本週工時','到班率','狀態']} rows={rows} />; }
function Attendance({rows,onAction}:{rows:string[][];onAction:(s:string)=>void}) { return <TableModule title="今日出勤與工時覆核" subtitle="處理遲到、漏刷與加班例外" action="批次覆核正常工時" onAction={onAction} headers={['人員','案場','簽到','簽退','工時','例外']} rows={rows} />; }
function Billing({rows,onAction}:{rows:string[][];onAction:(s:string)=>void}) { const hasDraft=rows.some((row)=>row[5]==="草稿已建立"); return <div className="module-page"><div className="module-title"><div><p className="eyebrow">2026 年 8 月上期</p><h3>薪資與客戶請款</h3><p>已核准工時將同步產生員工薪資與客戶請款。</p></div><button className="primary" disabled={hasDraft} onClick={()=>onAction('建立結算草稿')}>{hasDraft?'結算草稿已建立':'建立結算草稿'}</button></div><div className="kpi-row"><article><span>核准工時</span><strong>6,842 h</strong><small>128 位人員</small></article><article><span>員工薪資</span><strong>NT$ 1.28M</strong><small>含津貼 86K</small></article><article><span>客戶請款</span><strong>NT$ 1.57M</strong><small>8 個案場</small></article><article><span>毛利率</span><strong>18.5%</strong><small className="up">符合目標</small></article></div><TableModule title="案場結算進度" subtitle="從工時覆核到發票開立" action="匯出對帳單" onAction={onAction} headers={['客戶／案場','核准工時','薪資成本','請款金額','毛利率','狀態']} rows={rows} compact /></div>; }
function AiCenter({resolved,onDispatch,onAction}:{resolved:string[];onDispatch:()=>void;onAction:(s:string)=>void}) { return <div className="module-page"><div className="module-title"><div><p className="eyebrow">AI DISPATCH COPILOT</p><h3>今日調度建議</h3><p>所有建議都附帶依據、風險與人工確認，不會自動派工。</p></div></div><div className="ai-grid"><article className="ai-recommend featured"><div><span className="badge red">高優先</span><small>信心 94%</small></div><h4>補齊新竹包裝線明日缺工</h4><p>陳怡安與林志豪資格有效、無班表衝突，合計可將缺口由 2 人降為 0。</p><ul><li>依據：資格、工時、距離、到班率</li><li>風險：林志豪通勤距離 6.8 km</li></ul><button className="primary" onClick={onDispatch}>檢視並確認</button></article><article className={resolved.includes('schedule')?'ai-recommend resolved':'ai-recommend'}><div><span className="badge amber">工時風險</span><small>信心 88%</small></div><h4>調整王俊傑週五班表</h4><p>目前排班將使本週工時達 46 小時，建議改派周冠宇。</p><button className="secondary" disabled={resolved.includes('schedule')} onClick={()=>onAction('建立班表調整草稿')}>{resolved.includes('schedule')?'調整草稿已建立':'建立調整草稿'}</button></article><article className={resolved.includes('training')?'ai-recommend resolved':'ai-recommend'}><div><span className="badge blue">資格提醒</span><small>信心 100%</small></div><h4>3 張證照即將到期</h4><p>可能影響下月 5 筆既定派工，建議本週完成續訓安排。</p><button className="secondary" disabled={resolved.includes('training')} onClick={()=>onAction('建立續訓通知')}>{resolved.includes('training')?'續訓通知已建立':'建立續訓通知'}</button></article></div></div>; }

function TableModule({title,subtitle,action,onAction,headers,rows,compact=false}:{title:string;subtitle:string;action:string;onAction:(s:string)=>void;headers:string[];rows:string[][];compact?:boolean}) {
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("全部狀態");
  const visibleRows=rows.filter((row)=>{
    const matchesQuery=!query||row.join(" ").toLowerCase().includes(query.trim().toLowerCase());
    const value=row[row.length-1];
    const isWarning=/異常|預警|缺|需補|遲到|漏刷|待|媒合中|覆核中/.test(value);
    const matchesStatus=status==="全部狀態"||(status==="需處理"?isWarning:status==="已完成"?!isWarning:value===status);
    return matchesQuery&&matchesStatus;
  });
  const statusOptions=["全部狀態","需處理","已完成",...Array.from(new Set(rows.map((row)=>row[row.length-1])))];
  return <div className={compact?'':'module-page'}><div className="module-title"><div><p className="eyebrow">OPERATION RECORDS</p><h3>{title}</h3><p>{subtitle}</p></div><button className="primary" onClick={()=>onAction(action)}>{action}</button></div><section className="data-card table-card"><div className="table-tools"><label>搜尋<input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="輸入人員或案場" /></label><select aria-label="狀態篩選" value={status} onChange={(event)=>setStatus(event.target.value)}>{statusOptions.map((option)=><option key={option}>{option}</option>)}</select></div><div className="table-summary">顯示 {visibleRows.length}／{rows.length} 筆</div><div className="table-scroll"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visibleRows.length?visibleRows.map((row,i)=><tr key={`${row[0]}-${i}`}>{row.map((cell,j)=><td key={j}>{j===row.length-1?<span className={`table-status ${/異常|預警|缺|需補|遲到|漏刷|待|媒合中|覆核中/.test(cell)?'warn':'ok'}`}>{cell}</span>:cell}</td>)}</tr>):<tr><td className="empty-table" colSpan={headers.length}>找不到符合條件的資料，請調整搜尋或篩選。</td></tr>}</tbody></table></div></section></div>;
}

function downloadDemoFile(name:string){
  const content=`JVision 人力派遣 Demo 匯出\n作業：${name}\n產生時間：2026/08/12 17:08\n說明：此檔案為展示資料，不含真實個資。`;
  const url=URL.createObjectURL(new Blob([content],{type:"text/plain;charset=utf-8"}));
  const link=document.createElement("a");
  link.href=url;link.download=`jvision-${name}.txt`;link.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),0);
}

function ActionPanel({ action, onClose, onComplete }: { action: string; onClose: () => void; onComplete: (name: string, payload: Record<string, string>) => void }) {
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const actionLabel = action
    .replace("：已建立示範草稿", "")
    .replace("結算草稿已建立", "建立結算草稿")
    .replace("已建立班表調整草稿", "建立班表調整草稿")
    .replace("續訓通知草稿已建立", "建立續訓通知");
  const isExport = action.includes("匯出");
  const isPerson = action.includes("人員");
  const isSite = action.includes("案場");
  const isReview = action.includes("覆核");
  const isSchedule = action.includes("班表");
  const isTraining = action.includes("續訓");
  const isSettlement = action.includes("結算");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview) {
      setDraft(Object.fromEntries(Array.from(new FormData(event.currentTarget).entries()).map(([key, value]) => [key, String(value)])));
      setPreview(true);
      return;
    }
    onComplete(actionLabel, draft);
  }

  return <div className="action-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="action-panel" role="dialog" aria-modal="true" aria-labelledby="action-title">
      <header><div><p>建立作業</p><h3 id="action-title">{actionLabel}</h3></div><button type="button" className="close-action" onClick={onClose} aria-label="關閉">×</button></header>
      <form onSubmit={submit}>
        {!preview ? <>
          {isPerson && <><label>姓名<input name="person" required defaultValue="許家豪" /></label><label>核心技能<select name="skill" defaultValue="倉儲理貨"><option>倉儲理貨</option><option>電子包裝</option><option>食品包裝</option></select></label><div className="form-grid"><label>手機<input name="phone" required defaultValue="0912-345-678" /></label><label>可上班日<input name="availableDate" type="date" required defaultValue="2026-08-13" /></label></div></>}
          {isSite && <><label>客戶／案場<input name="site" required defaultValue="竹科電子三廠" /></label><div className="form-grid"><label>需求人數<input name="need" type="number" min="1" required defaultValue="8" /></label><label>到班日期<input name="startDate" type="date" required defaultValue="2026-08-14" /></label></div><label>案場主管<input name="manager" required defaultValue="待指派" /></label><label>必要資格<select name="qualification" defaultValue="包裝線安全訓練"><option>包裝線安全訓練</option><option>堆高機證照</option><option>食品衛生訓練</option></select></label></>}
          {isReview && <><div className="selection-summary"><strong>已選取 2 筆正常工時</strong><span>合計 16.2 小時 · 無遲到、漏刷或超時</span></div><label>覆核備註<textarea defaultValue="工時與案場簽核紀錄相符。" /></label></>}
          {isSchedule && <><label>調整人員<select defaultValue="王俊傑"><option>王俊傑</option><option>周冠宇</option></select></label><label>替代人員<select defaultValue="周冠宇"><option>周冠宇</option><option>林志豪</option></select></label><label>調整原因<textarea defaultValue="避免本週工時超過 46 小時。" /></label></>}
          {isTraining && <><div className="selection-summary"><strong>3 位人員證照將到期</strong><span>張雅雯、李佳穎、黃俊翔</span></div><label>續訓場次<select defaultValue="8/20 新竹場"><option>8/20 新竹場</option><option>8/27 桃園場</option></select></label><label>通知方式<select defaultValue="App 推播＋簡訊"><option>App 推播＋簡訊</option><option>僅 App 推播</option></select></label></>}
          {isSettlement && <><label>結算期間<select defaultValue="2026/08 上期"><option>2026/08 上期</option><option>2026/07 下期</option></select></label><div className="selection-summary"><strong>128 位人員 · 6,842 小時</strong><span>薪資 NT$ 1,280,000 · 請款 NT$ 1,570,000</span></div><label className="check-label"><input type="checkbox" required defaultChecked />僅納入已覆核工時</label></>}
          {isExport && <><label>檔案格式<select defaultValue="Excel (.xlsx)"><option>Excel (.xlsx)</option><option>PDF 報表</option><option>CSV 原始資料</option></select></label><label>資料範圍<select defaultValue="目前模組與篩選條件"><option>目前模組與篩選條件</option><option>本月全部資料</option></select></label></>}
          {!isPerson&&!isSite&&!isReview&&!isSchedule&&!isTraining&&!isSettlement&&!isExport&&<><label>作業名稱<input required defaultValue={actionLabel} /></label><label>說明<textarea defaultValue="請確認內容後建立草稿，系統不會自動送出。" /></label></>}
          <div className="impact-box"><strong>執行前檢查</strong><ul><li>不會直接通知人員或客戶</li><li>下一步會先顯示影響預覽</li><li>確認後保留操作與稽核紀錄</li></ul></div>
        </> : <div className="action-preview"><span>✓</span><h4>資料檢查完成</h4><p>必填資料完整，未發現資格或工時衝突。</p><div><strong>即將建立</strong><b>{actionLabel}</b></div><div><strong>執行方式</strong><b>儲存為待確認草稿</b></div><small>這是 Demo，不會傳送真實通知或建立外部資料。</small></div>}
        <footer><button type="button" className="secondary" onClick={preview ? () => setPreview(false) : onClose}>{preview ? "返回修改" : "取消"}</button><button type="submit" className="primary">{preview ? "確認建立草稿" : "預覽影響"}</button></footer>
      </form>
    </aside>
  </div>;
}
