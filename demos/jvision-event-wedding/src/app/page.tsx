"use client";

import { useMemo, useState } from "react";

type Lead = {
  name: string;
  eventType: string;
  date: string;
  guests: number;
  budget: number;
  stage: string;
};

type Task = {
  title: string;
  owner: string;
  due: string;
  done: boolean;
};

const stages = ["新詢價", "報價中", "合約簽核", "收訂金", "籌備中", "活動完成"];

const initialLeads: Lead[] = [
  { name: "林小姐婚宴", eventType: "婚禮晚宴", date: "2026-09-18", guests: 168, budget: 820000, stage: "報價中" },
  { name: "科技論壇", eventType: "企業會議", date: "2026-08-22", guests: 260, budget: 560000, stage: "合約簽核" },
  { name: "品牌春酒", eventType: "活動派對", date: "2026-10-05", guests: 120, budget: 380000, stage: "收訂金" },
];

const initialTasks: Task[] = [
  { title: "確認主桌與賓客桌次", owner: "Mia", due: "7/12", done: false },
  { title: "更新外燴菜單與酒水", owner: "Leo", due: "7/14", done: false },
  { title: "寄送合約與訂金連結", owner: "Nina", due: "7/15", done: true },
];

export default function Page() {
  const [leads, setLeads] = useState(initialLeads);
  const [tasks, setTasks] = useState(initialTasks);
  const [selected, setSelected] = useState(0);
  const [notice, setNotice] = useState("請選擇案件，可推進階段、產生報價，也能切換籌備任務狀態。");
  const [form, setForm] = useState<Lead>({
    name: "王先生求婚派對",
    eventType: "私人派對",
    date: "2026-11-21",
    guests: 48,
    budget: 160000,
    stage: "新詢價",
  });

  const totals = useMemo(() => {
    const revenue = leads.reduce((sum, lead) => sum + lead.budget, 0);
    const guests = leads.reduce((sum, lead) => sum + lead.guests, 0);
    const pendingTasks = tasks.filter((task) => !task.done).length;
    return { revenue, guests, pendingTasks };
  }, [leads, tasks]);

  const current = leads[selected] ?? leads[0];
  const aiSummary = `目前共有 ${leads.length} 個活動案件，預估營收 NT$ ${totals.revenue.toLocaleString()}，服務人數 ${totals.guests} 位。優先追蹤 ${current.name} 的「${current.stage}」進度，尚有 ${totals.pendingTasks} 個籌備任務待完成。`;

  function addLead() {
    setLeads((rows) => [{ ...form, guests: Number(form.guests) || 0, budget: Number(form.budget) || 0 }, ...rows]);
    setSelected(0);
    setNotice(`${form.name} 已加入詢價清單，系統已建立報價、檔期與任務追蹤。`);
  }

  function advanceStage() {
    setLeads((rows) =>
      rows.map((lead, index) => {
        if (index !== selected) return lead;
        const next = stages[Math.min(stages.indexOf(lead.stage) + 1, stages.length - 1)] ?? lead.stage;
        return { ...lead, stage: next };
      }),
    );
    setNotice(`${current.name} 已推進到下一個階段，相關提醒與待辦已同步更新。`);
  }

  function generateQuote() {
    const serviceFee = Math.round(current.budget * 0.12);
    setNotice(`${current.name} 報價完成：活動預算 NT$ ${current.budget.toLocaleString()}，服務費 NT$ ${serviceFee.toLocaleString()}，建議收取 30% 訂金。`);
  }

  function toggleTask(index: number) {
    setTasks((rows) => rows.map((task, taskIndex) => (taskIndex === index ? { ...task, done: !task.done } : task)));
    setNotice("籌備任務狀態已更新，客戶端與內部工作看板會同步顯示。");
  }

  return (
    <main>
      <nav className="topbar">
        <a className="brand" href="#demo">
          <img src="/logo.png" alt="Jvision" />
          <span>活動會展與婚禮場地管理平台</span>
        </a>
        <div className="nav-actions">
          <a href="#lead">詢價報價</a>
          <a href="#planning">籌備任務</a>
          <a href="#overview">活動總覽</a>
        </div>
      </nav>

      <section className="hero" id="demo">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Event Planning Platform</p>
          <h1>詢價、檔期、報價、合約、訂金、桌次與任務，一套完成活動籌備。</h1>
          <p>
            Jvision 協助婚禮顧問、宴會場地、活動公司與外燴團隊，把客戶詢價、場地檔期、報價合約、訂金付款、賓客桌次、籌備任務與客戶溝通整合成同一個可操作的工作台。
          </p>
          <div className="hero-actions">
            <a className="primary" href="#lead">操作 Demo</a>
            <a className="secondary" href="#overview">查看總覽</a>
          </div>
        </div>

        <div className="console" aria-label="Jvision 活動籌備 Demo 控制台">
          <div className="window-bar">
            <span />
            <span />
            <span />
            <strong>Jvision Event Console</strong>
          </div>
          <div className="metrics">
            <article>
              <span>活動案件</span>
              <strong>{leads.length}</strong>
            </article>
            <article>
              <span>預估營收</span>
              <strong>{Math.round(totals.revenue / 1000)}K</strong>
            </article>
            <article>
              <span>服務人數</span>
              <strong>{totals.guests}</strong>
            </article>
          </div>
          <div className="ai-box">
            <small>Jvision AI</small>
            <p>{aiSummary}</p>
          </div>
        </div>
      </section>

      <section className="feature-row">
        {[
          ["銷售與詢價", "從詢價、需求、預算、檔期到報價版本，讓每個潛在客戶都有清楚進度。"],
          ["活動籌備", "管理桌次、流程、供應商、菜單、任務與內部協作，減少遺漏。"],
          ["付款合約", "把報價單、合約簽核、訂金付款與尾款提醒集中處理。"],
          ["客戶協作", "提供客戶可理解的進度視圖，讓確認事項與溝通紀錄集中保存。"],
        ].map(([title, text]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="demo-grid">
        <div className="panel" id="lead">
          <p className="eyebrow">Lead & Quote</p>
          <h2>新增詢價與報價</h2>
          <div className="form-grid">
            <label>
              案件名稱
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              活動類型
              <select value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value })}>
                <option>婚禮晚宴</option>
                <option>企業會議</option>
                <option>活動派對</option>
                <option>私人派對</option>
                <option>展覽發表</option>
              </select>
            </label>
            <label>
              日期
              <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </label>
            <label>
              人數
              <input type="number" value={form.guests} onChange={(event) => setForm({ ...form, guests: Number(event.target.value) })} />
            </label>
            <label>
              預算
              <input type="number" value={form.budget} onChange={(event) => setForm({ ...form, budget: Number(event.target.value) })} />
            </label>
            <label>
              階段
              <select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })}>
                {stages.map((stage) => <option key={stage}>{stage}</option>)}
              </select>
            </label>
          </div>
          <button className="wide-button" onClick={addLead}>新增詢價</button>
        </div>

        <div className="panel" id="planning">
          <p className="eyebrow">Planning Workspace</p>
          <h2>活動籌備 Demo</h2>
          <div className="candidate-list">
            {leads.map((lead, index) => (
              <button key={`${lead.name}-${lead.date}`} className={selected === index ? "active" : ""} onClick={() => setSelected(index)}>
                <span>
                  <strong>{lead.name}</strong>
                  <small>{lead.eventType} / {lead.date}</small>
                </span>
                <b>{lead.stage}</b>
                <em>{lead.guests}</em>
              </button>
            ))}
          </div>
          <div className="button-row">
            <button onClick={advanceStage}>推進階段</button>
            <button onClick={generateQuote}>產生報價</button>
          </div>
          <p className="notice">{notice}</p>
        </div>
      </section>

      <section className="panel full" id="overview">
        <div className="section-head">
          <div>
            <p className="eyebrow">Event Operations</p>
            <h2>案件總覽與當日任務</h2>
          </div>
          <div className="summary-card">
            <span>待完成任務</span>
            <strong>{totals.pendingTasks} 項</strong>
            <small>同步給內部團隊與客戶確認。</small>
          </div>
        </div>
        <div className="task-grid">
          {tasks.map((task, index) => (
            <button key={task.title} className={task.done ? "task done" : "task"} onClick={() => toggleTask(index)}>
              <span>{task.title}</span>
              <small>{task.owner} / {task.due}</small>
              <b>{task.done ? "已完成" : "待處理"}</b>
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>案件</th>
                <th>類型</th>
                <th>日期</th>
                <th>人數</th>
                <th>預算</th>
                <th>階段</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={`${lead.name}-${lead.date}`}>
                  <td>{lead.name}</td>
                  <td>{lead.eventType}</td>
                  <td>{lead.date}</td>
                  <td>{lead.guests} 位</td>
                  <td>NT$ {lead.budget.toLocaleString()}</td>
                  <td><span className="status">{lead.stage}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/logo.png" alt="Jvision" />
          <span>Jvision 活動會展與婚禮場地管理平台 Demo</span>
        </div>
        <div className="footer-links">
          <a href="https://jvision-event-wedding.vercel.app">Demo 網址</a>
          <a href="https://github.com/yunghua817/jvision-event-wedding">GitHub</a>
        </div>
      </footer>
    </main>
  );
}
