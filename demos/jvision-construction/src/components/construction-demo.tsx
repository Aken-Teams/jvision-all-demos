"use client";

import { FormEvent, useMemo, useState } from "react";

type Issue = {
  id: number;
  title: string;
  area: string;
  owner: string;
  status: "待處理" | "改善中" | "已完成";
};

const initialIssues: Issue[] = [
  { id: 101, title: "B2 機電管線與梁底衝突", area: "地下二層", owner: "機電分包", status: "待處理" },
  { id: 102, title: "西側外牆鷹架踢腳板缺漏", area: "外牆", owner: "安衛工程師", status: "改善中" }
];

export function ConstructionDemo() {
  const [reports, setReports] = useState([
    "2026-06-29 晴：8F 梁柱鋼筋綁紮完成，B2 機電套管複核。"
  ]);
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [approvals, setApprovals] = useState(["消防材料採購單已送出主管簽核"]);

  const kpis = useMemo(() => {
    const open = issues.filter((issue) => issue.status !== "已完成").length;
    return { open, reports: reports.length, approvals: approvals.length, progress: 68 + reports.length };
  }, [approvals.length, issues, reports.length]);

  function addReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setReports((current) => [`${form.get("date")} ${form.get("weather")}：${form.get("note")}`, ...current]);
    event.currentTarget.reset();
  }

  function addIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIssues((current) => [{
      id: Math.floor(Math.random() * 900) + 100,
      title: String(form.get("title")),
      area: String(form.get("area")),
      owner: String(form.get("owner")),
      status: "待處理"
    }, ...current]);
    event.currentTarget.reset();
  }

  function moveIssue(id: number, status: Issue["status"]) {
    setIssues((current) => current.map((issue) => issue.id === id ? { ...issue, status } : issue));
  }

  return (
    <div className="pos-shell">
      <aside className="pos-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <label>專案<select><option>台北商辦新建工程</option><option>桃園物流中心增建</option></select></label>
        <div className="member-card">
          <span>專案 KPI</span>
          <strong>進度 {kpis.progress}%</strong>
          <p>未結缺失 {kpis.open} · 日報 {kpis.reports} · 待簽 {kpis.approvals}</p>
          <button type="button" onClick={() => setApprovals((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 估驗請款已送簽`, ...rows])}>送出審批</button>
        </div>
      </aside>
      <div className="pos-main">
        <section className="pos-panel">
          <div className="panel-heading"><h3>工地日報</h3><span>現場即時回報</span></div>
          <form className="reservation-form" onSubmit={addReport}>
            <input name="date" type="date" required defaultValue="2026-06-30" aria-label="日期" />
            <input name="weather" required placeholder="天氣" aria-label="天氣" />
            <input name="note" required placeholder="今日施工重點" aria-label="施工重點" />
            <button type="submit">新增日報</button>
          </form>
          <div className="reservation-list">{reports.map((row) => <span key={row}>{row}</span>)}</div>
        </section>
        <section className="pos-panel cart-panel">
          <div className="panel-heading"><h3>品質安衛缺失</h3><span>派工追蹤</span></div>
          <form className="reservation-form" onSubmit={addIssue}>
            <input name="title" required placeholder="缺失描述" aria-label="缺失描述" />
            <input name="area" required placeholder="區域" aria-label="區域" />
            <input name="owner" required placeholder="負責單位" aria-label="負責單位" />
            <button type="submit">建立缺失</button>
          </form>
          <div className="cart-list">
            {issues.map((issue) => (
              <article className="online-order" key={issue.id}>
                <div><strong>{issue.title}</strong><p>{issue.area} · {issue.owner}</p></div>
                <b>{issue.status}</b>
                <div className="order-actions">
                  {(["待處理", "改善中", "已完成"] as Issue["status"][]).map((status) => (
                    <button key={status} type="button" disabled={issue.status === status} onClick={() => moveIssue(issue.id, status)}>{status}</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="pos-panel analytics-panel">
          <div className="panel-heading"><h3>材料成本與審批</h3><span>即時儀表板</span></div>
          <div className="metric-grid">
            <div><span>鋼筋預算</span><strong>88%</strong></div>
            <div><span>混凝土用量</span><strong>76%</strong></div>
            <div><span>模板系統</span><strong>81%</strong></div>
            <div><span>待簽紀錄</span><strong>{approvals.length}</strong></div>
          </div>
          <div className="reservation-list">{approvals.map((row) => <span key={row}>{row}</span>)}</div>
        </section>
      </div>
    </div>
  );
}
