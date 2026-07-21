"use client";

import { FormEvent, useMemo, useState } from "react";

type Stage = "準備處理" | "正在進行" | "等待確認" | "已完成";
type Priority = "高" | "中" | "低";
type Task = { id: number; title: string; project: string; owner: string; due: string; hours: number; stage: Stage; priority: Priority };
type Goal = { id: number; title: string; owner: string; progress: number };

const stages: Stage[] = ["準備處理", "正在進行", "等待確認", "已完成"];
const priorities: Priority[] = ["高", "中", "低"];
const owners = ["Mia", "Leo", "Nina", "Ryan"];

export function WorkProjectDemo() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "產品發布需求盤點", project: "CRM 專案", owner: "Mia", due: "7/12", hours: 8, stage: "正在進行", priority: "高" },
    { id: 2, title: "首頁新版線框設計", project: "網站改版", owner: "Leo", due: "7/15", hours: 6, stage: "準備處理", priority: "中" },
    { id: 3, title: "AI 狀態摘要規則", project: "營運中台", owner: "Nina", due: "7/18", hours: 4, stage: "等待確認", priority: "高" },
    { id: 4, title: "上線 QA 檢查表", project: "系統上線", owner: "Ryan", due: "7/19", hours: 3, stage: "已完成", priority: "低" },
  ]);
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, title: "本週完成高風險項目", owner: "Mia", progress: 68 },
    { id: 2, title: "跨部門回覆縮短 3 小時", owner: "Leo", progress: 42 },
  ]);
  const [message, setMessage] = useState("新增任務、推進看板或點擊 AI 摘要，系統會即時更新工作狀態。");

  const metrics = useMemo(() => {
    const pending = tasks.filter((task) => task.stage !== "已完成").length;
    const highRisk = tasks.filter((task) => task.priority === "高" && task.stage !== "已完成").length;
    const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);
    const byOwner = owners.map((owner) => ({
      owner,
      hours: tasks.filter((task) => task.owner === owner && task.stage !== "已完成").reduce((sum, task) => sum + task.hours, 0),
    }));
    return { pending, highRisk, totalHours, byOwner };
  }, [tasks]);

  const aiSummary = `目前共有 ${tasks.length} 個任務，${metrics.pending} 個尚未完成。高優先級項目 ${metrics.highRisk} 個，建議先處理「${
    tasks.find((task) => task.priority === "高" && task.stage !== "已完成")?.title ?? "無"
  }」。目前工作量最高的是 ${[...metrics.byOwner].sort((a, b) => b.hours - a.hours)[0].owner}。`;

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title"));
    const task: Task = {
      id: Date.now(),
      title,
      project: String(form.get("project")),
      owner: String(form.get("owner")),
      due: String(form.get("due")),
      hours: Number(form.get("hours")) || 1,
      stage: "準備處理",
      priority: String(form.get("priority")) as Priority,
    };
    setTasks((rows) => [task, ...rows]);
    setMessage(`${title} 已加入準備處理，Jvision 會同步更新看板與工作負荷。`);
    event.currentTarget.reset();
  }

  function moveTask(id: number, direction: -1 | 1) {
    setTasks((rows) =>
      rows.map((task) => {
        if (task.id !== id) return task;
        const index = stages.indexOf(task.stage);
        const next = stages[Math.max(0, Math.min(stages.length - 1, index + direction))];
        return { ...task, stage: next };
      }),
    );
    setMessage(direction > 0 ? "任務已送到下一階段，專案進度與 AI 摘要會同步更新。" : "任務已退回上一階段，方便重新補資料或修正內容。");
  }

  function balanceWorkload() {
    setTasks((rows) => rows.map((task, index) => (index === 0 ? { ...task, owner: "Ryan", hours: Math.max(2, task.hours - 2) } : task)));
    setMessage("已模擬平衡工作負荷，把高壓任務重新分派並降低預估工時。");
  }

  function improveGoal() {
    setGoals((rows) => rows.map((goal) => ({ ...goal, progress: Math.min(100, goal.progress + 8) })));
    setMessage("目標進度已更新，主管可以直接看到 KPI 推進。");
  }

  return (
    <div className="suite-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="metric-card">
          <span>未完成任務</span>
          <strong>{metrics.pending}</strong>
        </div>
        <div className="metric-card">
          <span>高優先項目</span>
          <strong>{metrics.highRisk}</strong>
        </div>
        <div className="metric-card">
          <span>總預估工時</span>
          <strong>{metrics.totalHours}h</strong>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>新增任務</h3>
            <span>專案 / 負責人 / 工時</span>
          </div>
          <form className="task-form" onSubmit={addTask}>
            <input name="title" required placeholder="任務名稱" aria-label="任務名稱" suppressHydrationWarning />
            <input name="project" required placeholder="專案名稱" aria-label="專案名稱" suppressHydrationWarning />
            <select name="owner" required defaultValue="" aria-label="負責人" suppressHydrationWarning>
              <option value="" disabled>負責人</option>
              {owners.map((owner) => <option key={owner}>{owner}</option>)}
            </select>
            <select name="priority" required defaultValue="" aria-label="優先級" suppressHydrationWarning>
              <option value="" disabled>優先級</option>
              {priorities.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
            <input name="due" required placeholder="截止日 7/25" aria-label="截止日" suppressHydrationWarning />
            <input name="hours" required type="number" min="1" placeholder="工時" aria-label="工時" suppressHydrationWarning />
            <button type="submit">新增任務</button>
          </form>
          <p className="notice">{message}</p>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <h3>Jvision AI 摘要</h3>
            <span>風險與下一步</span>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button type="button" onClick={balanceWorkload}>平衡工作負荷</button>
        </section>

        <section className="demo-panel board-panel">
          <div className="panel-heading">
            <h3>專案看板</h3>
            <span>按按鈕就能把任務送到下一階段或退回修正</span>
          </div>
          <div className="kanban">
            {stages.map((stage) => (
              <div className="stage" key={stage}>
                <strong>{stage}</strong>
                {tasks.filter((task) => task.stage === stage).map((task) => {
                  const index = stages.indexOf(task.stage);
                  return (
                    <article className="task-card" key={task.id}>
                      <b>{task.title}</b>
                      <span>{task.project}</span>
                      <small>{task.owner} · {task.due} · {task.hours}h · 優先級 {task.priority}</small>
                      <div className="workflow-actions">
                        <button type="button" onClick={() => moveTask(task.id, -1)} disabled={index === 0}>退回</button>
                        <button type="button" onClick={() => moveTask(task.id, 1)} disabled={index === stages.length - 1}>
                          {index === stages.length - 2 ? "標記完成" : "送下一步"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="demo-panel goals-panel">
          <div className="panel-heading">
            <h3>目標與工作負荷</h3>
            <button type="button" onClick={improveGoal}>更新目標</button>
          </div>
          <div className="goal-grid">
            {goals.map((goal) => (
              <article className="goal-card" key={goal.id}>
                <strong>{goal.title}</strong>
                <span>{goal.owner}</span>
                <meter min="0" max="100" value={goal.progress} />
                <b>{goal.progress}%</b>
              </article>
            ))}
          </div>
          <div className="workload-grid">
            {metrics.byOwner.map((item) => (
              <div key={item.owner}>
                <span>{item.owner}</span>
                <strong>{item.hours}h</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
