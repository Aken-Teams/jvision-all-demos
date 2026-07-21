"use client";

import { useMemo, useState } from "react";

type Claim = { id:string; insured:string; vehicle:string; loss:string; status:string; owner:string; reserve:number; risk:string };
const seed: Claim[] = [
  {id:"CLM-2026-0713",insured:"林怡君",vehicle:"2023 Toyota Corolla Cross",loss:"追撞事故",status:"待審核",owner:"王思涵",reserve:128000,risk:"中"},
  {id:"CLM-2026-0708",insured:"陳柏宇",vehicle:"2022 Tesla Model 3",loss:"停車碰撞",status:"估損中",owner:"李冠廷",reserve:86000,risk:"低"},
  {id:"CLM-2026-0691",insured:"張雅婷",vehicle:"2021 BMW X3",loss:"淹水損失",status:"待補件",owner:"王思涵",reserve:310000,risk:"高"},
  {id:"CLM-2026-0677",insured:"吳俊毅",vehicle:"2024 Honda CR-V",loss:"玻璃破損",status:"已核賠",owner:"周育誠",reserve:24500,risk:"低"},
];

export default function Home(){
  const [claims,setClaims]=useState(seed); const [selected,setSelected]=useState(seed[0]);
  const [query,setQuery]=useState(""); const [tab,setTab]=useState("總覽"); const [showNew,setShowNew]=useState(false);
  const [tasks,setTasks]=useState([{t:"確認事故照片",done:false},{t:"核對保單承保範圍",done:true},{t:"聯絡合作修車廠",done:false}]);
  const filtered=useMemo(()=>claims.filter(c=>(c.id+c.insured+c.vehicle).toLowerCase().includes(query.toLowerCase())),[claims,query]);
  const addClaim=()=>{const c={id:`CLM-2026-${String(720+claims.length)}`,insured:"新報案客戶",vehicle:"2024 Lexus NX",loss:"車體碰撞",status:"新案件",owner:"待指派",reserve:50000,risk:"低"};setClaims([c,...claims]);setSelected(c);setShowNew(false)};
  return <div className="marketing-page">
    <header className="site-header">
      <a className="site-brand" href="#top" aria-label="Jvision 首頁"><img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" /></a>
      <nav aria-label="主要導覽"><a href="#features">核心功能</a><a href="#flow">理賠流程</a><a href="#demo">互動 Demo</a></nav>
      <a className="header-action" href="#demo">開始測試</a>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="marketing-eyebrow">Jvision Claims Management</p>
        <h1>讓每一件理賠案件，都有清楚、即時、可追蹤的處理節奏</h1>
        <p>從報案受理、文件補件、事故審核、任務協作到核賠付款，Jvision 將分散的理賠資訊整合在同一個工作台，協助團隊快速掌握風險與待辦。</p>
        <div className="hero-actions"><a className="primary-button" href="#demo">操作完整 Demo</a><a className="secondary-button" href="#features">查看核心功能</a></div>
        <div className="trust-row"><span>案件集中管理</span><span>智慧風險摘要</span><span>完整流程追蹤</span></div>
      </div>
      <div className="hero-preview" aria-label="理賠營運摘要">
        <div className="preview-top"><span>今日理賠營運</span><b>即時更新</b></div>
        <div className="preview-main"><small>進行中案件</small><strong>42</strong><span>較上週提升 8%</span></div>
        <div className="preview-grid"><article><small>今日新報案</small><strong>7</strong></article><article><small>平均處理天數</small><strong>4.6</strong></article><article><small>待補件</small><strong>6</strong></article><article><small>本月核賠</small><strong>$2.84M</strong></article></div>
      </div>
    </section>

    <section className="feature-section" id="features">
      <div className="section-heading"><p className="marketing-eyebrow">核心功能</p><h2>把理賠專員每天需要的資訊與操作，集中在一個清楚的工作介面</h2><p>保持既有 Demo 的完整操作，同時補上與其他 Jvision 專案一致的產品介紹與導覽層級。</p></div>
      <div className="feature-grid">
        {[["01","案件工作台","統一查看案件狀態、承辦人、風險等級、準備金與最新進度。"],["02","文件與補件","依案件追蹤事故資料與待補文件，避免資訊散落在不同管道。"],["03","任務協作","建立追蹤任務、標記完成狀態，讓每個處理節點都有明確責任。"],["04","智慧摘要","快速彙整事故內容、承保範圍與風險訊號，提供下一步處理建議。"],["05","財務與核賠","掌握準備金、預估損失與付款狀態，並示範付款審核流程。"],["06","營運分析","以案件量、處理天數與核賠金額協助主管掌握理賠營運。"]].map(([n,t,d])=><article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}
      </div>
    </section>

    <section className="flow-section" id="flow"><div className="section-heading"><p className="marketing-eyebrow">理賠流程</p><h2>從報案到付款，讓每個步驟都能被看見與追蹤</h2></div><div className="flow-row">{["報案受理","案件分派","事故與保單審核","文件補件","損失評估","核賠審批","付款結案"].map((x,i)=><div key={x}><span>{i+1}</span><b>{x}</b></div>)}</div></section>

    <section className="demo-section" id="demo"><div className="section-heading"><p className="marketing-eyebrow">Live Demo</p><h2>直接操作 Jvision 智慧理賠管理工作台</h2><p>搜尋與切換案件、建立新案件、切換作業頁籤、完成待辦任務並送出付款審核。</p></div>
    <div className="demo-frame"><div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision"/><span>CLAIMS</span></div>
      <nav>{["理賠總覽","案件管理","工作佇列","文件中心","付款作業","分析報表"].map((x,i)=><button className={i===1?"active":""} key={x}><i>{["▦","◫","✓","▤","＄","⌁"][i]}</i>{x}</button>)}</nav>
      <div className="sidebar-note"><b>Jvision 智慧助理</b><p>已分析今日 18 件案件，3 件需要優先處理。</p></div>
      <div className="user"><span>王</span><div><b>王思涵</b><small>資深理賠專員</small></div></div>
    </aside>
    <main>
      <header><div><h1>理賠案件管理</h1><p>統一掌握案件、文件、任務與付款進度</p></div><div className="header-actions"><button className="icon">⌕</button><button className="primary" onClick={()=>setShowNew(true)}>＋ 建立新案件</button></div></header>
      <section className="metrics">
        {[['進行中案件','42','較上週 +8%'],['今日新報案','7','2 件待指派'],['平均處理天數','4.6','縮短 0.8 天'],['本月核賠金額','$2.84M','預算使用 68%']].map((m,i)=><article key={m[0]}><div className={`metric-icon c${i}`}>{['◫','＋','◷','$'][i]}</div><div><span>{m[0]}</span><strong>{m[1]}</strong><small>{m[2]}</small></div></article>)}
      </section>
      <section className="workspace">
        <div className="claim-list">
          <div className="list-head"><h2>案件佇列 <em>{filtered.length}</em></h2><select><option>依更新時間</option><option>依風險排序</option></select></div>
          <div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜尋案件編號、客戶或車輛"/></div>
          <div className="filters"><button className="on">全部</button><button>待處理</button><button>高風險</button></div>
          <div className="rows">{filtered.map(c=><button key={c.id} onClick={()=>setSelected(c)} className={selected.id===c.id?"selected":""}><div><b>{c.id}</b><span className={`risk ${c.risk}`}>{c.risk}風險</span></div><strong>{c.insured}</strong><p>{c.vehicle}</p><footer><span>{c.status}</span><small>準備金 ${c.reserve.toLocaleString()}</small></footer></button>)}</div>
        </div>
        <div className="claim-detail">
          <div className="detail-title"><div><span className="eyebrow">{selected.status}</span><h2>{selected.id}</h2><p>{selected.insured} · {selected.loss}</p></div><button className="more">•••</button></div>
          <div className="tabs">{["總覽","保單與事故","文件","溝通紀錄","財務"].map(x=><button key={x} onClick={()=>setTab(x)} className={tab===x?"on":""}>{x}</button>)}</div>
          {tab==="總覽" ? <>
            <div className="alert"><span>✦</span><div><b>Jvision 智慧摘要</b><p>事故描述與照片一致，承保範圍有效。建議先取得第三方行車紀錄器影像，再進行責任比例判定。</p></div><button>查看分析</button></div>
            <div className="detail-grid"><article><h3>案件資訊</h3><dl><div><dt>承辦人</dt><dd>{selected.owner}</dd></div><div><dt>事故類型</dt><dd>{selected.loss}</dd></div><div><dt>車輛</dt><dd>{selected.vehicle}</dd></div><div><dt>事故日期</dt><dd>2026 / 07 / 11</dd></div></dl></article><article><h3>財務概況</h3><div className="money"><small>目前準備金</small><strong>${selected.reserve.toLocaleString()}</strong></div><div className="bar"><i style={{width:"64%"}}/></div><p className="muted">預估損失 $82,000 · 已付款 $0</p><button className="outline" onClick={()=>alert("付款審核已送出")}>送出付款審核</button></article></div>
            <article className="tasks"><div><h3>待辦任務</h3><button onClick={()=>setTasks([...tasks,{t:"新增追蹤任務",done:false}])}>＋ 新增任務</button></div>{tasks.map((x,i)=><label key={i}><input type="checkbox" checked={x.done} onChange={()=>setTasks(tasks.map((t,j)=>j===i?{...t,done:!t.done}:t))}/><span>{x.t}</span><small>{i===0?'今天 16:00':i===1?'已完成':'明天 10:00'}</small></label>)}</article>
          </>:<div className="empty-panel"><b>{tab}</b><p>此 Demo 已建立可操作的頁籤結構；可切換回總覽繼續測試任務與付款流程。</p><button className="primary" onClick={()=>setTab("總覽")}>返回總覽</button></div>}
        </div>
      </section>
    </main>
    {showNew&&<div className="modal"><div><button className="close" onClick={()=>setShowNew(false)}>×</button><span className="eyebrow">NEW CLAIM</span><h2>建立新理賠案件</h2><label>被保險人<input defaultValue="新報案客戶"/></label><label>事故類型<select><option>車體碰撞</option><option>竊盜</option><option>天災損失</option></select></label><label>初始準備金<input defaultValue="50,000"/></label><button className="primary full" onClick={addClaim}>建立並開啟案件</button></div></div>}
    </div></div></section>

    <section className="cta-section"><div><p className="marketing-eyebrow">Jvision AI</p><h2>用更完整的案件視角，加速每一次理賠決策</h2></div><a href="#demo">再次操作 Demo</a></section>
    <footer className="site-footer"><img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo"/><p>Jvision 智慧理賠管理 Demo｜案件、文件、任務、準備金與付款流程互動展示</p></footer>
  </div>
}
