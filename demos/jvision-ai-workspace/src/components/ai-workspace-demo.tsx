"use client";

import { FormEvent, useMemo, useState } from "react";

type Doc = { id: number; title: string; type: string; status: "草稿" | "審閱中" | "已發布" };
type Task = { id: number; title: string; owner: string; status: "待辦" | "進行中" | "完成" };
type Meeting = { id: number; title: string; summary: string };

const docStatuses: Doc["status"][] = ["草稿", "審閱中", "已發布"];

export function AiWorkspaceDemo() {
  const [docs, setDocs] = useState<Doc[]>([
    { id: 1, title: "AI 客服產品規格", type: "PRD", status: "審閱中" },
    { id: 2, title: "企業知識庫治理準則", type: "SOP", status: "已發布" },
  ]);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "完成權限矩陣", owner: "產品經理", status: "進行中" },
    { id: 2, title: "整理客服常見問答", owner: "營運", status: "待辦" },
  ]);
  const [meetings, setMeetings] = useState<Meeting[]>([
    { id: 1, title: "週會同步", summary: "決議：本週完成知識庫匯入與權限審核。" },
  ]);
  const [answers, setAnswers] = useState(["知識庫回答：目前專案準時率 91%，主要風險是文件審閱延遲。"]);
  const [agents, setAgents] = useState(["研究代理人：已整理 6 篇競品筆記"]);
  const [reports, setReports] = useState(["專案報告：本週完成 12 項任務，3 項需主管協調"]);

  const kpis = useMemo(() => {
    const published = docs.filter((doc) => doc.status === "已發布").length;
    const openTasks = tasks.filter((task) => task.status !== "完成").length;
    return { docs: docs.length, published, openTasks, meetings: meetings.length };
  }, [docs, meetings.length, tasks]);

  function addDoc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setDocs((rows) => [
      { id: Date.now(), title: String(form.get("title")), type: String(form.get("type")), status: "草稿" },
      ...rows,
    ]);
    event.currentTarget.reset();
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>工作區總覽</span>
          <strong>{kpis.docs} 份文件</strong>
          <p>
            已發布 {kpis.published} 份，未完成任務 {kpis.openTasks} 項，會議筆記 {kpis.meetings} 則
          </p>
          <button type="button" onClick={() => setReports((rows) => [`${new Date().toLocaleTimeString("zh-TW")} AI 專案報告已產生`, ...rows])}>
            產生報告
          </button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>文件與知識庫</h3>
            <span>Docs</span>
          </div>
          <form className="property-form" onSubmit={addDoc}>
            <input name="title" required placeholder="文件標題" aria-label="文件標題" />
            <input name="type" required placeholder="文件類型" aria-label="文件類型" />
            <input name="owner" placeholder="負責人" aria-label="負責人" />
            <button type="submit">新增文件</button>
          </form>
          <div className="unit-list">
            {docs.map((doc) => (
              <article className="unit-card" key={doc.id}>
                <div>
                  <strong>{doc.title}</strong>
                  <p>
                    {doc.type} · {doc.status}
                  </p>
                </div>
                <div className="status-actions">
                  {docStatuses.map((status) => (
                    <button
                      key={status}
                      disabled={doc.status === status}
                      onClick={() => setDocs((rows) => rows.map((row) => (row.id === doc.id ? { ...row, status } : row)))}
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
            <h3>任務與會議</h3>
            <span>Projects</span>
          </div>
          <div className="status-actions">
            <button type="button" onClick={() => setTasks((rows) => [{ id: Date.now(), title: "測試任務：整理需求", owner: "測試同事", status: "待辦" }, ...rows])}>新增任務</button>
            <button type="button" onClick={() => setTasks((rows) => rows.map((row, index) => (index === 0 ? { ...row, status: "完成" } : row)))}>完成任務</button>
            <button type="button" onClick={() => setMeetings((rows) => [{ id: Date.now(), title: "測試會議筆記", summary: "AI 摘要：確認下週上線清單與阻塞事項。" }, ...rows])}>新增會議</button>
            <button type="button" onClick={() => setAnswers((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 知識庫回答：測試專案負責人為產品經理`, ...rows])}>知識問答</button>
          </div>
          <div className="tag-list">
            {[...tasks.map((task) => `${task.title} · ${task.owner} · ${task.status}`), ...meetings.map((meeting) => `${meeting.title} · ${meeting.summary}`)].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>AI 代理人</h3>
            <span>Agents</span>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={() => setAgents((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 報告代理人：已整理主管摘要`, ...rows])}
          >
            指派代理人
          </button>
          <div className="tag-list">
            {agents.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>知識回答</h3>
            <span>Search</span>
          </div>
          <div className="tag-list">
            {answers.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>專案報告</h3>
            <span>Reports</span>
          </div>
          <div className="metric-grid">
            <div><span>文件數</span><strong>{kpis.docs}</strong></div>
            <div><span>已發布</span><strong>{kpis.published}</strong></div>
            <div><span>未完成任務</span><strong>{kpis.openTasks}</strong></div>
            <div><span>會議筆記</span><strong>{kpis.meetings}</strong></div>
          </div>
          <div className="tag-list">
            {reports.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
