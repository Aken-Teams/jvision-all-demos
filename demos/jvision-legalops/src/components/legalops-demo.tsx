"use client";

import { FormEvent, useMemo, useState } from "react";

type CaseStatus = "受理中" | "準備中" | "開庭中" | "結案";
type LegalCase = { id: number; title: string; client: string; lawyer: string; status: CaseStatus };
type Hearing = { id: number; caseTitle: string; court: string; date: string };
type Task = { id: number; title: string; owner: string; status: "待處理" | "進行中" | "已完成" };

const caseStatuses: CaseStatus[] = ["受理中", "準備中", "開庭中", "結案"];

export function LegalOpsDemo() {
  const [cases, setCases] = useState<LegalCase[]>([
    { id: 1, title: "買賣契約損害賠償", client: "林先生", lawyer: "陳律師", status: "準備中" },
    { id: 2, title: "勞資爭議調解", client: "和信公司", lawyer: "王律師", status: "受理中" },
    { id: 3, title: "家事親權協議", client: "張小姐", lawyer: "李律師", status: "開庭中" },
  ]);
  const [hearings, setHearings] = useState<Hearing[]>([
    { id: 1, caseTitle: "家事親權協議", court: "台北地方法院", date: "2026-07-08 10:30" },
  ]);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "整理證據清冊", owner: "法務助理", status: "進行中" },
  ]);
  const [timeLogs, setTimeLogs] = useState(["陳律師 買賣契約損害賠償 2.5h"]);
  const [notices, setNotices] = useState(["家事親權協議 開庭前 24 小時提醒"]);
  const [billings, setBillings] = useState(["林先生 委任費第二期 NT$ 80,000 待請款"]);

  const kpis = useMemo(() => {
    const active = cases.filter((row) => row.status !== "結案").length;
    const pendingTasks = tasks.filter((row) => row.status !== "已完成").length;
    const hours = timeLogs.length * 2.5;
    const receivable = billings.length * 80000;
    return { active, pendingTasks, hours, receivable };
  }, [billings.length, cases, tasks, timeLogs.length]);

  function addCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCases((rows) => [
      {
        id: Date.now(),
        title: String(form.get("title")),
        client: String(form.get("client")),
        lawyer: String(form.get("lawyer")),
        status: "受理中",
      },
      ...rows,
    ]);
    event.currentTarget.reset();
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>事務所總覽</span>
          <strong>{kpis.active} 件</strong>
          <p>
            待辦 {kpis.pendingTasks} 件，已登錄 {kpis.hours} 小時，應收 NT$ {kpis.receivable.toLocaleString("zh-TW")}
          </p>
          <button type="button" onClick={() => setBillings((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 新增請款 NT$ 60,000`, ...rows])}>
            新增請款
          </button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>案件管理</h3>
            <span>Cases</span>
          </div>
          <form className="property-form" onSubmit={addCase}>
            <input name="title" required placeholder="案件名稱" aria-label="案件名稱" />
            <input name="client" required placeholder="當事人" aria-label="當事人" />
            <input name="lawyer" required placeholder="承辦律師" aria-label="承辦律師" />
            <button type="submit">新增案件</button>
          </form>
          <div className="unit-list">
            {cases.map((legalCase) => (
              <article className="unit-card" key={legalCase.id}>
                <div>
                  <strong>{legalCase.title}</strong>
                  <p>
                    {legalCase.client} · {legalCase.lawyer} · {legalCase.status}
                  </p>
                </div>
                <div className="status-actions">
                  {caseStatuses.map((status) => (
                    <button
                      key={status}
                      disabled={legalCase.status === status}
                      onClick={() => setCases((rows) => rows.map((row) => (row.id === legalCase.id ? { ...row, status } : row)))}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>庭期與提醒</h3>
            <span>庭期提醒</span>
          </div>
          <div className="status-actions">
            <button type="button" onClick={() => setHearings((rows) => [{ id: Date.now(), caseTitle: "測試案件", court: "智慧法院", date: "2026-07-15 14:00" }, ...rows])}>新增庭期</button>
            <button type="button" onClick={() => setTasks((rows) => [{ id: Date.now(), title: "測試待辦撰寫書狀", owner: "測試律師", status: "待處理" }, ...rows])}>新增待辦</button>
            <button type="button" onClick={() => setNotices((rows) => [`${new Date().toLocaleTimeString("zh-TW")} HotLine 強制提醒已發送`, ...rows])}>發送提醒</button>
            <button type="button" onClick={() => setTimeLogs((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 測試案件 工時 1.5h`, ...rows])}>登錄工時</button>
          </div>
          <div className="tag-list">
            {hearings.map((row) => (
              <span key={row.id}>{row.caseTitle} · {row.court} · {row.date}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>待辦回報</h3>
            <span>待辦事項</span>
          </div>
          <div className="unit-list">
            {tasks.map((task) => (
              <article className="unit-card" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.owner} · {task.status}</p>
                </div>
                <button
                  className="inline-action"
                  type="button"
                  onClick={() => setTasks((rows) => rows.map((row) => (row.id === task.id ? { ...row, status: "已完成" } : row)))}
                >
                  完成回報
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>通知與工時</h3>
            <span>Logs</span>
          </div>
          <div className="tag-list">
            {[...notices, ...timeLogs].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>請款與績效</h3>
            <span>Billing</span>
          </div>
          <div className="metric-grid">
            <div><span>進行中案件</span><strong>{kpis.active}</strong></div>
            <div><span>未完成待辦</span><strong>{kpis.pendingTasks}</strong></div>
            <div><span>已登錄工時</span><strong>{kpis.hours}h</strong></div>
            <div><span>應收金額</span><strong>NT$ {kpis.receivable.toLocaleString("zh-TW")}</strong></div>
          </div>
          <div className="tag-list">
            {billings.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
