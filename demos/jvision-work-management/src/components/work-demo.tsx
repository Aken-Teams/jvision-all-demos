"use client";

import { FormEvent, useMemo, useState } from "react";

type Status = "待整理" | "進行中" | "審核中" | "已完成";
type Priority = "高" | "中" | "低";

type Task = {
  id: number;
  title: string;
  owner: string;
  status: Status;
  priority: Priority;
  due: string;
  hours: number;
};

type Goal = {
  id: number;
  title: string;
  progress: number;
};

const statuses: Status[] = ["待整理", "進行中", "審核中", "已完成"];

const seedTasks: Task[] = [
  { id: 1, title: "產品發佈需求盤點", owner: "Mia", status: "待整理", priority: "高", due: "7/05", hours: 6 },
  { id: 2, title: "首頁新版線框", owner: "Leo", status: "進行中", priority: "中", due: "7/07", hours: 8 },
  { id: 3, title: "AI 狀態摘要規則", owner: "Nina", status: "審核中", priority: "高", due: "7/09", hours: 5 },
  { id: 4, title: "上線 QA 檢查表", owner: "Ryan", status: "已完成", priority: "低", due: "7/10", hours: 3 }
];

export function WorkDemo() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, title: "Q3 產品發佈準時完成", progress: 62 },
    { id: 2, title: "客戶回覆 SLA 達標", progress: 48 }
  ]);
  const [ruleEnabled, setRuleEnabled] = useState(true);
  const [message, setMessage] = useState("新增任務或移動卡片後，Jvision 會即時更新目標與工作負荷。");
  const [aiSummary, setAiSummary] = useState("AI 摘要尚未生成。");

  const doneCount = tasks.filter((task) => task.status === "已完成").length;
  const highRisk = tasks.filter((task) => task.priority === "高" && task.status !== "已完成").length;
  const workload = useMemo(() => {
    return ["Mia", "Leo", "Nina", "Ryan"].map((owner) => ({
      owner,
      hours: tasks.filter((task) => task.owner === owner).reduce((sum, task) => sum + task.hours, 0)
    }));
  }, [tasks]);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const task: Task = {
      id: Date.now(),
      title: String(form.get("title") || "新任務"),
      owner: String(form.get("owner") || "Mia"),
      status: "待整理",
      priority: String(form.get("priority") || "中") as Priority,
      due: String(form.get("due") || "7/15"),
      hours: Number(form.get("hours") || 4)
    };
    setTasks((current) => [task, ...current]);
    setMessage(ruleEnabled && task.priority === "高" ? "自動化規則已觸發：高優先任務已加入專案更新。" : "新任務已加入待整理清單。");
    event.currentTarget.reset();
  }

  function moveTask(id: number, direction: 1 | -1) {
    setTasks((current) => current.map((task) => {
      if (task.id !== id) return task;
      const nextIndex = Math.max(0, Math.min(statuses.length - 1, statuses.indexOf(task.status) + direction));
      return { ...task, status: statuses[nextIndex] };
    }));
    setGoals((current) => current.map((goal) => ({ ...goal, progress: Math.min(100, goal.progress + 4) })));
    setMessage("任務狀態已更新，目標進度與工作負荷也同步刷新。");
  }

  function balanceWorkload() {
    setTasks((current) => current.map((task) => task.owner === "Leo" && task.hours >= 8 ? { ...task, owner: "Ryan", hours: 5 } : task));
    setMessage("工作量已重新平衡，部分任務改由 Ryan 協助分擔。");
  }

  function generateAiSummary() {
    const summary = `本週共有 ${tasks.length} 項任務，${doneCount} 項已完成，${highRisk} 項需要優先追蹤。AI 建議先處理審核中與高優先任務。`;
    setAiSummary(summary);
    setMessage("AI 已生成本週專案狀態摘要。");
  }

  return (
    <div className="work-shell">
      <aside className="work-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="metric"><span>任務總數</span><strong>{tasks.length}</strong></div>
        <div className="metric"><span>已完成</span><strong>{doneCount}</strong></div>
        <div className="metric"><span>需優先追蹤</span><strong>{highRisk}</strong></div>
        <div className="metric"><span>自動化規則</span><strong>{ruleEnabled ? "啟用" : "停用"}</strong></div>
      </aside>

      <div className="work-main">
        <section className="work-panel intake-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">新增工作</p>
              <h3>新增任務</h3>
            </div>
            <label className="rule-toggle">
              <input type="checkbox" checked={ruleEnabled} onChange={() => setRuleEnabled((value) => !value)} />
              自動化規則
            </label>
          </div>
          <form className="task-form" onSubmit={addTask}>
            <input name="title" required placeholder="任務名稱" aria-label="任務名稱" />
            <select name="owner" aria-label="負責人" defaultValue="Mia">
              <option>Mia</option>
              <option>Leo</option>
              <option>Nina</option>
              <option>Ryan</option>
            </select>
            <select name="priority" aria-label="優先順序" defaultValue="高">
              <option>高</option>
              <option>中</option>
              <option>低</option>
            </select>
            <input name="due" required placeholder="截止日 7/15" aria-label="截止日" />
            <input name="hours" required type="number" min="1" placeholder="預估工時" aria-label="預估工時" />
            <button type="submit">新增任務</button>
          </form>
          <p className="demo-message">{message}</p>
        </section>

        <section className="work-panel ai-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Jvision AI</p>
              <h3>狀態摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button type="button" onClick={generateAiSummary}>生成 AI 摘要</button>
        </section>

        <section className="work-panel board-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">專案看板</p>
              <h3>專案看板</h3>
            </div>
          </div>
          <div className="kanban">
            {statuses.map((status) => (
              <div className="stage" key={status}>
                <strong>{status}</strong>
                {tasks.filter((task) => task.status === status).map((task) => (
                  <article className="task-card" key={task.id}>
                    <b>{task.title}</b>
                    <span>{task.owner} · {task.due} · {task.hours}h</span>
                    <small>{task.priority}</small>
                    <div>
                      <button type="button" aria-label="往前移動" onClick={() => moveTask(task.id, -1)}>←</button>
                      <button type="button" aria-label="往後移動" onClick={() => moveTask(task.id, 1)}>→</button>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="work-panel goals-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">目標與工作量</p>
              <h3>目標與工作負荷</h3>
            </div>
            <button type="button" onClick={balanceWorkload}>平衡工作量</button>
          </div>
          <div className="goal-grid">
            {goals.map((goal) => (
              <div className="goal-card" key={goal.id}>
                <strong>{goal.title}</strong>
                <meter min="0" max="100" value={goal.progress} />
                <span>{goal.progress}%</span>
              </div>
            ))}
          </div>
          <div className="workload-grid">
            {workload.map((row) => (
              <div key={row.owner}>
                <span>{row.owner}</span>
                <meter min="0" max="14" value={row.hours} />
                <b>{row.hours}h</b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
