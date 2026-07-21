"use client";

import { FormEvent, useMemo, useState } from "react";

type ProjectStatus = "規劃中" | "施工中" | "驗收中" | "已結案";
type Project = { id: number; name: string; owner: string; budget: number; status: ProjectStatus };
type Purchase = { id: number; item: string; project: string; amount: number };
type Labor = { id: number; crew: string; project: string; workers: number };
type Quote = { id: number; title: string; project: string; amount: number; status: "草稿" | "已送出" | "已簽約" };

const projectStatuses: ProjectStatus[] = ["規劃中", "施工中", "驗收中", "已結案"];

const initialProjects: Project[] = [
  { id: 1, name: "青埔集合住宅 A 棟", owner: "宏昇建設", budget: 8600000, status: "施工中" },
  { id: 2, name: "南港辦公室裝修", owner: "禾田科技", budget: 2400000, status: "規劃中" },
  { id: 3, name: "台中機電統包", owner: "景泰營造", budget: 5200000, status: "驗收中" },
];

export function ConstructionErpDemo() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [purchases, setPurchases] = useState<Purchase[]>([
    { id: 1, item: "鋼筋 SD420 12 噸", project: "青埔集合住宅 A 棟", amount: 620000 },
  ]);
  const [labors, setLabors] = useState<Labor[]>([
    { id: 1, crew: "模板班", project: "青埔集合住宅 A 棟", workers: 18 },
  ]);
  const [quotes, setQuotes] = useState<Quote[]>([
    { id: 1, title: "南港辦公室追加隔間", project: "南港辦公室裝修", amount: 380000, status: "已送出" },
  ]);
  const [settlements, setSettlements] = useState(["青埔集合住宅 A 棟 第 2 期請款 NT$ 1,200,000"]);

  const kpis = useMemo(() => {
    const budget = projects.reduce((sum, project) => sum + project.budget, 0);
    const cost = purchases.reduce((sum, row) => sum + row.amount, 0) + labors.reduce((sum, row) => sum + row.workers * 3200, 0);
    const quoteTotal = quotes.reduce((sum, quote) => sum + quote.amount, 0);
    const active = projects.filter((project) => project.status !== "已結案").length;
    return { budget, cost, quoteTotal, active };
  }, [labors, projects, purchases, quotes]);

  function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setProjects((rows) => [
      {
        id: Date.now(),
        name: String(form.get("name")),
        owner: String(form.get("owner")),
        budget: Number(form.get("budget")),
        status: "規劃中",
      },
      ...rows,
    ]);
    event.currentTarget.reset();
  }

  function addPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPurchases((rows) => [
      { id: Date.now(), item: String(form.get("item")), project: String(form.get("project")), amount: Number(form.get("amount")) },
      ...rows,
    ]);
    event.currentTarget.reset();
  }

  function addLabor() {
    setLabors((rows) => [{ id: Date.now(), crew: "泥作班", project: "南港辦公室裝修", workers: 9 }, ...rows]);
  }

  function addQuote() {
    setQuotes((rows) => [
      { id: Date.now(), title: "地下室防水追加工程", project: "台中機電統包", amount: 460000, status: "草稿" },
      ...rows,
    ]);
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>專案損益快照</span>
          <strong>NT$ {kpis.budget.toLocaleString("zh-TW")}</strong>
          <p>
            進行中 {kpis.active} 案，已掛帳成本 NT$ {kpis.cost.toLocaleString("zh-TW")}，報價中 NT$ {kpis.quoteTotal.toLocaleString("zh-TW")}
          </p>
          <button type="button" onClick={() => setSettlements((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 新增請款結算 NT$ 880,000`, ...rows])}>
            新增結算
          </button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>工程專案</h3>
            <span>Projects</span>
          </div>
          <form className="property-form" onSubmit={addProject}>
            <input name="name" required placeholder="工程案名稱" aria-label="工程案名稱" />
            <input name="owner" required placeholder="業主名稱" aria-label="業主名稱" />
            <input name="budget" required type="number" min="1" placeholder="預算" aria-label="預算" />
            <button type="submit">新增工程案</button>
          </form>
          <div className="unit-list">
            {projects.map((project) => (
              <article className="unit-card" key={project.id}>
                <div>
                  <strong>{project.name}</strong>
                  <p>
                    {project.owner} · NT$ {project.budget.toLocaleString("zh-TW")} · {project.status}
                  </p>
                </div>
                <div className="status-actions">
                  {projectStatuses.map((status) => (
                    <button
                      key={status}
                      disabled={project.status === status}
                      onClick={() => setProjects((rows) => rows.map((row) => (row.id === project.id ? { ...row, status } : row)))}
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
            <h3>採購與用料</h3>
            <span>Purchasing</span>
          </div>
          <form className="property-form" onSubmit={addPurchase}>
            <input name="item" required placeholder="材料品項" aria-label="材料品項" />
            <input name="project" required placeholder="歸屬工程" aria-label="歸屬工程" />
            <input name="amount" required type="number" min="1" placeholder="金額" aria-label="金額" />
            <button type="submit">新增採購</button>
          </form>
          <div className="tag-list">
            {purchases.map((row) => (
              <span key={row.id}>
                {row.item} · {row.project} · NT$ {row.amount.toLocaleString("zh-TW")}
              </span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>出工紀錄</h3>
            <span>Labor</span>
          </div>
          <button className="primary-action" type="button" onClick={addLabor}>
            新增出工
          </button>
          <div className="tag-list">
            {labors.map((row) => (
              <span key={row.id}>
                {row.crew} · {row.project} · {row.workers} 人
              </span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>報價與合約</h3>
            <span>Quotes</span>
          </div>
          <button className="primary-action" type="button" onClick={addQuote}>
            新增報價單
          </button>
          <div className="tag-list">
            {quotes.map((quote) => (
              <span key={quote.id}>
                {quote.title} · {quote.project} · NT$ {quote.amount.toLocaleString("zh-TW")} · {quote.status}
              </span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>成本與請款</h3>
            <span>Finance</span>
          </div>
          <div className="metric-grid">
            <div>
              <span>合約預算</span>
              <strong>NT$ {kpis.budget.toLocaleString("zh-TW")}</strong>
            </div>
            <div>
              <span>已掛帳成本</span>
              <strong>NT$ {kpis.cost.toLocaleString("zh-TW")}</strong>
            </div>
            <div>
              <span>報價金額</span>
              <strong>NT$ {kpis.quoteTotal.toLocaleString("zh-TW")}</strong>
            </div>
            <div>
              <span>進行中案</span>
              <strong>{kpis.active}</strong>
            </div>
          </div>
          <div className="tag-list">
            {settlements.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
