"use client";

import { FormEvent, useMemo, useState } from "react";

type QuoteStatus = "草稿" | "送簽中" | "已核准" | "轉工程";
type ProjectStatus = "規劃" | "施工中" | "查驗中" | "驗收";
type IssueType = "品質" | "送審" | "請款" | "會議";
type Quote = {
  id: number;
  customer: string;
  name: string;
  category: string;
  area: string;
  amount: number;
  received: number;
  extra: number;
  lastPaid: string;
  margin: number;
  status: QuoteStatus;
};
type Project = { id: number; name: string; progress: number; budget: number; status: ProjectStatus };
type Issue = { id: number; title: string; owner: string; due: string; type: IssueType };

const quoteStatuses: QuoteStatus[] = ["草稿", "送簽中", "已核准", "轉工程"];
const projectStatuses: ProjectStatus[] = ["規劃", "施工中", "查驗中", "驗收"];
const categories = ["木作", "油漆", "水電", "泥作", "系統櫃", "機電"];
const areas = ["客廳", "廚房", "玄關", "臥室", "浴室", "公共區"];

export function EstimatePmisDemo() {
  const [quotes, setQuotes] = useState<Quote[]>([
    {
      id: 1,
      customer: "宏昇營造",
      name: "商辦機電追加工程",
      category: "機電",
      area: "公共區",
      amount: 2680000,
      received: 1200000,
      extra: 180000,
      lastPaid: "2026-06-28",
      margin: 18,
      status: "送簽中",
    },
    {
      id: 2,
      customer: "青禾建設",
      name: "住宅公共區裝修",
      category: "木作",
      area: "客廳",
      amount: 4200000,
      received: 4200000,
      extra: 0,
      lastPaid: "2026-06-22",
      margin: 22,
      status: "已核准",
    },
  ]);
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: "A 棟公共區裝修", progress: 62, budget: 4200000, status: "施工中" },
    { id: 2, name: "機電追加工程", progress: 35, budget: 2680000, status: "查驗中" },
  ]);
  const [issues, setIssues] = useState<Issue[]>([
    { id: 1, title: "消防配管自主檢查", owner: "監造", due: "2026-07-08", type: "品質" },
    { id: 2, title: "機電圖說 R2 送審", owner: "承包商", due: "2026-07-10", type: "送審" },
  ]);
  const [logs, setLogs] = useState<string[]>(["已同步 2 筆報價與 2 件工程專案。"]);

  const kpis = useMemo(() => {
    const quoteTotal = quotes.reduce((sum, row) => sum + row.amount + row.extra, 0);
    const receivedTotal = quotes.reduce((sum, row) => sum + row.received, 0);
    const unpaid = Math.max(0, quoteTotal - receivedTotal);
    const closed = quotes.filter((row) => row.received >= row.amount + row.extra).length;
    const avgMargin = Math.round((quotes.reduce((sum, row) => sum + row.margin, 0) / quotes.length) * 10) / 10;
    const avgProgress = Math.round(projects.reduce((sum, row) => sum + row.progress, 0) / projects.length);
    return { quoteTotal, receivedTotal, unpaid, closed, avgMargin, avgProgress, pending: issues.length };
  }, [issues.length, projects, quotes]);

  function addQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const amount = Number(form.get("amount"));
    const received = Number(form.get("received"));
    const extra = Number(form.get("extra"));
    setQuotes((rows) => [
      {
        id: Date.now(),
        customer: String(form.get("customer")),
        name,
        category: String(form.get("category")),
        area: String(form.get("area")),
        amount,
        received,
        extra,
        lastPaid: String(form.get("lastPaid")),
        margin: Number(form.get("margin")),
        status: received >= amount + extra ? "已核准" : "草稿",
      },
      ...rows,
    ]);
    setLogs((rows) => [`新增報價：${name}，系統已自動計算未收款。`, ...rows]);
    event.currentTarget.reset();
  }

  function convertToProject() {
    const quote = quotes.find((row) => row.status === "已核准") || quotes[0];
    setQuotes((rows) => rows.map((row) => (row.id === quote.id ? { ...row, status: "轉工程" } : row)));
    setProjects((rows) => [
      { id: Date.now(), name: quote.name, progress: 0, budget: quote.amount + quote.extra, status: "規劃" },
      ...rows,
    ]);
    setLogs((rows) => [`${quote.name} 已由報價轉成工程專案，預算已帶入。`, ...rows]);
  }

  function printQuote() {
    const quote = quotes[0];
    setLogs((rows) => [`已產生 ${quote.customer} 的報價單列印版，含工程類型與施工區域明細。`, ...rows]);
  }

  function addIssue(type: IssueType) {
    const labels = {
      品質: "新增自主檢查缺失",
      送審: "新增圖說送審",
      請款: "新增估驗請款",
      會議: "新增會議待辦",
    };
    setIssues((rows) => [
      { id: Date.now(), title: labels[type], owner: type === "請款" ? "財務" : "工務", due: "2026-07-15", type },
      ...rows,
    ]);
    setLogs((rows) => [`${labels[type]} 已加入追蹤。`, ...rows]);
  }

  return (
    <div className="dispatch-demo estimate-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>估價工程總覽</span>
          <strong>{kpis.avgProgress}% 進度</strong>
          <div className="ops-status-list" aria-label="估價工程指標">
            <p><span>報價總額</span><b>NT$ {Math.round(kpis.quoteTotal / 10000).toLocaleString("zh-TW")} 萬</b></p>
            <p><span>未收金額</span><b>NT$ {Math.round(kpis.unpaid / 10000).toLocaleString("zh-TW")} 萬</b></p>
            <p><span>自動結案</span><b>{kpis.closed} 件</b></p>
          </div>
          <button type="button" onClick={convertToProject}>核准轉工程</button>
        </div>
      </aside>

      <div className="demo-workspace estimate-workspace">
        <section className="demo-panel worker-panel quote-panel">
          <div className="panel-heading">
            <h3>報價估價</h3>
            <span>類型 / 區域 / 收款</span>
          </div>
          <form className="dispatch-form quote-form" onSubmit={addQuote}>
            <input name="customer" required placeholder="客戶名稱" aria-label="客戶名稱" suppressHydrationWarning />
            <input name="name" required placeholder="工程名稱" aria-label="工程名稱" suppressHydrationWarning />
            <select name="category" required aria-label="工程類型" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>工程類型</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select name="area" required aria-label="施工區域" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>施工區域</option>
              {areas.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input name="amount" required type="number" min="1" placeholder="估價金額" aria-label="估價金額" suppressHydrationWarning />
            <input name="extra" required type="number" min="0" placeholder="追加金額" aria-label="追加金額" suppressHydrationWarning />
            <input name="received" required type="number" min="0" placeholder="已收款" aria-label="已收款" suppressHydrationWarning />
            <input name="lastPaid" required type="date" aria-label="最後收款日" suppressHydrationWarning />
            <input name="margin" required type="number" min="1" max="80" placeholder="毛利率 %" aria-label="毛利率" suppressHydrationWarning />
            <button type="submit">新增報價</button>
          </form>

          <div className="quote-list">
            {quotes.map((quote) => {
              const total = quote.amount + quote.extra;
              const unpaid = Math.max(0, total - quote.received);
              const isClosed = unpaid === 0;
              return (
                <article className="quote-card" key={quote.id}>
                  <div className="quote-card-head">
                    <div>
                      <strong>{quote.name}</strong>
                      <p>{quote.customer} · {quote.category} / {quote.area}</p>
                    </div>
                    <span className={isClosed ? "state-pill closed" : "state-pill"}>{isClosed ? "自動結案" : quote.status}</span>
                  </div>
                  <div className="quote-money-grid">
                    <div><span>總額</span><strong>NT$ {total.toLocaleString("zh-TW")}</strong></div>
                    <div><span>已收</span><strong>NT$ {quote.received.toLocaleString("zh-TW")}</strong></div>
                    <div><span>未收</span><strong>NT$ {unpaid.toLocaleString("zh-TW")}</strong></div>
                    <div><span>毛利</span><strong>{quote.margin}%</strong></div>
                  </div>
                  <div className="quote-foot">
                    <span>最後收款 {quote.lastPaid}</span>
                    <div className="status-actions compact-actions">
                      {quoteStatuses.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={quote.status === status}
                          onClick={() => {
                            setQuotes((rows) => rows.map((row) => (row.id === quote.id ? { ...row, status } : row)));
                            setLogs((rows) => [`${quote.name} 報價狀態更新為 ${status}。`, ...rows]);
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="demo-panel project-panel">
          <div className="panel-heading">
            <h3>工程進度</h3>
            <span>專案管控</span>
          </div>
          <button className="primary-action" type="button" onClick={convertToProject}>報價轉專案</button>
          <div className="project-list">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <div className="project-card-head">
                  <strong>{project.name}</strong>
                  <span>{project.status}</span>
                </div>
                <p>預算 NT$ {project.budget.toLocaleString("zh-TW")} · 進度 {project.progress}%</p>
                <div className="progress-track" aria-label={`${project.name} 進度 ${project.progress}%`}>
                  <i style={{ width: `${project.progress}%` }} />
                </div>
                <div className="status-actions compact-actions">
                  {projectStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={project.status === status}
                      onClick={() => setProjects((rows) => rows.map((row) => (row.id === project.id ? { ...row, status, progress: Math.min(100, row.progress + 8) } : row)))}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel finance-panel">
          <div className="panel-heading">
            <h3>品質圖說與財務</h3>
            <span>送審 / 缺失 / 估驗</span>
          </div>
          <div className="shop-actions finance-actions">
            <button type="button" onClick={printQuote}>列印報價</button>
            <button type="button" onClick={() => addIssue("品質")}>品質缺失</button>
            <button type="button" onClick={() => addIssue("送審")}>圖說送審</button>
            <button type="button" onClick={() => addIssue("請款")}>估驗請款</button>
          </div>
          <div className="issue-list">
            {issues.map((issue) => (
              <span key={issue.id}>{issue.type} · {issue.title} · {issue.owner} · {issue.due}</span>
            ))}
          </div>
          <div className="log-list">
            {logs.slice(0, 5).map((log) => <p key={log}>{log}</p>)}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>管理儀表板</h3>
            <span>即時指標</span>
          </div>
          <div className="metric-grid">
            <div><span>報價數</span><strong>{quotes.length}</strong></div>
            <div><span>專案數</span><strong>{projects.length}</strong></div>
            <div><span>未收款</span><strong>{Math.round(kpis.unpaid / 10000).toLocaleString("zh-TW")} 萬</strong></div>
            <div><span>待辦</span><strong>{kpis.pending}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
