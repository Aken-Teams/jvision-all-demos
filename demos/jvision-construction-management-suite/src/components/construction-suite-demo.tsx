"use client";

import { FormEvent, useMemo, useState } from "react";

type QuoteStatus = "估價中" | "送簽中" | "已核准" | "轉工程";
type ProjectStatus = "規劃中" | "施工中" | "查驗中" | "驗收中";
type IssueType = "日報" | "品質" | "安衛" | "請款";

type Quote = { id: number; name: string; customer: string; amount: number; status: QuoteStatus };
type Project = { id: number; name: string; progress: number; budget: number; status: ProjectStatus; cost: number };
type Issue = { id: number; title: string; owner: string; due: string; type: IssueType; status: string; detail: string };

const quoteStatuses: QuoteStatus[] = ["估價中", "送簽中", "已核准", "轉工程"];
const projectStatuses: ProjectStatus[] = ["規劃中", "施工中", "查驗中", "驗收中"];

export function ConstructionSuiteDemo() {
  const [quotes, setQuotes] = useState<Quote[]>([
    { id: 1, name: "商辦機電追加工程", customer: "宏昇建設", amount: 1860000, status: "送簽中" },
    { id: 2, name: "物流中心裝修統包", customer: "捷運物流", amount: 4280000, status: "已核准" },
  ]);
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: "台北商辦新建工程", progress: 62, budget: 8200000, cost: 6100000, status: "施工中" },
    { id: 2, name: "桃園物流中心增建", progress: 38, budget: 5400000, cost: 3120000, status: "查驗中" },
  ]);
  const [issues, setIssues] = useState<Issue[]>([
    { id: 1, title: "8F 梁柱鋼筋綁紮日報", owner: "現場工程師", due: "7/18", type: "日報", status: "已送出", detail: "出工 26 人｜晴｜完成 8F 梁柱鋼筋綁紮與查驗照片 6 張" },
    { id: 2, title: "B2 防水試水高度不足", owner: "防水分包", due: "7/20", type: "品質", status: "待改善", detail: "查驗點 B2-WP-08｜要求補測 24 小時並上傳前後照片" },
    { id: 3, title: "西側鷹架踢腳板缺漏", owner: "安衛工程師", due: "7/19", type: "安衛", status: "改善中", detail: "巡檢區域：西側 3–5 軸｜風險等級：高｜已通知架設班" },
    { id: 4, title: "第 6 期估驗請款", owner: "工務經理", due: "7/25", type: "請款", status: "待簽核", detail: "本期完成 18.6%｜申請 NT$ 1,860,000｜監造計價待確認" },
  ]);
  const [activeIssueType, setActiveIssueType] = useState<IssueType>("日報");
  const [selectedIssueId, setSelectedIssueId] = useState(1);
  const [logs, setLogs] = useState<string[]>(["已同步估價、工程、日報、品質與請款資料。"]);

  const metrics = useMemo(() => {
    const quoteTotal = quotes.reduce((sum, quote) => sum + quote.amount, 0);
    const budgetTotal = projects.reduce((sum, project) => sum + project.budget, 0);
    const costTotal = projects.reduce((sum, project) => sum + project.cost, 0);
    const avgProgress = Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length);
    return { quoteTotal, budgetTotal, costTotal, avgProgress, margin: budgetTotal - costTotal };
  }, [quotes, projects]);

  function addQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quote: Quote = {
      id: Date.now(),
      name: String(form.get("name")),
      customer: String(form.get("customer")),
      amount: Number(form.get("amount")) || 0,
      status: "估價中",
    };
    setQuotes((rows) => [quote, ...rows]);
    setLogs((rows) => [`${quote.name} 已建立估價草稿。`, ...rows]);
    event.currentTarget.reset();
  }

  function advanceQuote(id: number) {
    setQuotes((rows) =>
      rows.map((quote) => {
        if (quote.id !== id) return quote;
        const next = quoteStatuses[Math.min(quoteStatuses.indexOf(quote.status) + 1, quoteStatuses.length - 1)];
        if (next === "轉工程") {
          setProjects((items) => [
            { id: Date.now(), name: quote.name, progress: 8, budget: quote.amount, cost: Math.round(quote.amount * 0.18), status: "規劃中" },
            ...items,
          ]);
        }
        setLogs((items) => [`${quote.name} 已推進到「${next}」。`, ...items]);
        return { ...quote, status: next };
      }),
    );
  }

  function addIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = Date.now();
    const statusMap: Record<IssueType, string> = { 日報: "草稿", 品質: "待改善", 安衛: "待處置", 請款: "草稿" };
    const issue: Issue = {
      id,
      type: activeIssueType,
      title: String(form.get("title")),
      owner: String(form.get("owner")),
      due: String(form.get("due")),
      detail: String(form.get("detail")),
      status: statusMap[activeIssueType],
    };
    setIssues((rows) => [issue, ...rows]);
    setSelectedIssueId(id);
    setLogs((rows) => [`${activeIssueType}「${issue.title}」已建立並進入${activeIssueType}工作區。`, ...rows]);
    event.currentTarget.reset();
  }

  function advanceIssue(issue: Issue) {
    const flows: Record<IssueType, string[]> = {
      日報: ["草稿", "已送出", "主管確認"],
      品質: ["待改善", "改善中", "待複驗", "已結案"],
      安衛: ["待處置", "改善中", "待複查", "已結案"],
      請款: ["草稿", "待簽核", "監造審查", "業主核定", "已入帳"],
    };
    const flow = flows[issue.type];
    const next = flow[Math.min(flow.indexOf(issue.status) + 1, flow.length - 1)];
    setIssues((rows) => rows.map((row) => row.id === issue.id ? { ...row, status: next } : row));
    setLogs((rows) => [`${issue.type}「${issue.title}」已推進至「${next}」。`, ...rows]);
  }

  function updateProgress() {
    setProjects((rows) => rows.map((project, index) => (index === 0 ? { ...project, progress: Math.min(100, project.progress + 7), cost: project.cost + 120000 } : project)));
    setLogs((rows) => ["已更新工程進度與材料成本。", ...rows]);
  }

  return (
    <div className="suite-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="metric"><span>報價總額</span><strong>NT$ {Math.round(metrics.quoteTotal / 10000)}萬</strong></div>
        <div className="metric"><span>工程預算</span><strong>NT$ {Math.round(metrics.budgetTotal / 10000)}萬</strong></div>
        <div className="metric"><span>平均進度</span><strong>{metrics.avgProgress}%</strong></div>
        <div className="metric"><span>預估毛利</span><strong>NT$ {Math.round(metrics.margin / 10000)}萬</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>新增工程估價</h3>
            <span>估價 / 報價 / 簽核</span>
          </div>
          <form className="form-grid" onSubmit={addQuote}>
            <input name="name" required placeholder="工程名稱" aria-label="工程名稱" suppressHydrationWarning />
            <input name="customer" required placeholder="客戶 / 業主" aria-label="客戶" suppressHydrationWarning />
            <input name="amount" required type="number" min="1" placeholder="估價金額" aria-label="估價金額" suppressHydrationWarning />
            <button type="submit">新增估價</button>
          </form>
          <div className="quote-list">
            {quotes.map((quote) => (
              <article key={quote.id}>
                <div>
                  <strong>{quote.name}</strong>
                  <span>{quote.customer} · NT$ {quote.amount.toLocaleString("zh-TW")}</span>
                </div>
                <b>{quote.status}</b>
                <button type="button" onClick={() => advanceQuote(quote.id)} disabled={quote.status === "轉工程"}>{quote.status === "轉工程" ? "已轉工程" : "推進流程"}</button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <h3>Jvision AI 工程摘要</h3>
            <span>進度 / 品質 / 成本</span>
          </div>
          <p className="ai-summary">
            目前平均進度 {metrics.avgProgress}%，預估毛利 NT$ {Math.round(metrics.margin / 10000)} 萬。
            建議優先確認「{issues[0]?.title}」，並追蹤材料成本是否超過預算。
          </p>
          <button type="button" onClick={updateProgress}>更新進度與成本</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <h3>工程專案看板</h3>
            <span>進度、預算、成本與狀態</span>
          </div>
          <div className="project-grid">
            {projectStatuses.map((status) => (
              <div className="project-column" key={status}>
                <h4>{status}</h4>
                {projects.filter((project) => project.status === status).map((project) => (
                  <article className="project-card" key={project.id}>
                    <strong>{project.name}</strong>
                    <span>進度 {project.progress}%</span>
                    <meter min="0" max="100" value={project.progress} />
                    <small>預算 NT$ {Math.round(project.budget / 10000)}萬 · 成本 NT$ {Math.round(project.cost / 10000)}萬</small>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>現場回報</h3>
            <span>日報 / 品質 / 安衛 / 請款</span>
          </div>
          <div className="quick-actions">
            {(["日報", "品質", "安衛", "請款"] as IssueType[]).map((type) => (
              <button className={activeIssueType === type ? "active" : ""} type="button" key={type} onClick={() => {
                setActiveIssueType(type);
                const first = issues.find((issue) => issue.type === type);
                if (first) setSelectedIssueId(first.id);
              }}>{type}</button>
            ))}
          </div>
          <div className="field-workspace">
            <form className="field-form" onSubmit={addIssue}>
              <h4>{activeIssueType === "日報" ? "填寫工地日報" : activeIssueType === "品質" ? "建立品質缺失單" : activeIssueType === "安衛" ? "建立安衛巡檢紀錄" : "建立估驗請款單"}</h4>
              <input name="title" required placeholder={activeIssueType === "日報" ? "施工項目／樓層" : activeIssueType === "請款" ? "請款期別／計價主旨" : "缺失描述"} />
              <input name="owner" required placeholder={activeIssueType === "請款" ? "請款承辦人" : "負責人／責任廠商"} />
              <input name="due" required placeholder={activeIssueType === "日報" ? "回報日期" : activeIssueType === "請款" ? "送審日期" : "改善期限"} />
              <textarea name="detail" required placeholder={activeIssueType === "日報" ? "天候、出工人數、完成數量、照片說明" : activeIssueType === "品質" ? "查驗位置、規範依據、改善要求" : activeIssueType === "安衛" ? "巡檢區域、風險等級、立即處置" : "本期完成比例、申請金額、計價依據"} />
              <button type="submit">建立{activeIssueType}資料</button>
            </form>
            <div className="issue-list">
              {issues.filter((issue) => issue.type === activeIssueType).map((issue) => (
                <article className={selectedIssueId === issue.id ? "selected" : ""} key={issue.id} onClick={() => setSelectedIssueId(issue.id)}>
                  <div><b>{issue.status}</b><strong>{issue.title}</strong><span>{issue.owner} · {issue.due}</span></div>
                  <button type="button" onClick={(event) => { event.stopPropagation(); advanceIssue(issue); }}>推進流程</button>
                </article>
              ))}
            </div>
            {issues.find((issue) => issue.id === selectedIssueId && issue.type === activeIssueType) && (() => {
              const selected = issues.find((issue) => issue.id === selectedIssueId)!;
              return <aside className="field-detail">
                <span>{selected.type}明細</span><h4>{selected.title}</h4><p>{selected.detail}</p>
                <dl><div><dt>負責人</dt><dd>{selected.owner}</dd></div><div><dt>期限／日期</dt><dd>{selected.due}</dd></div><div><dt>目前狀態</dt><dd>{selected.status}</dd></div></dl>
                <button type="button" onClick={() => advanceIssue(selected)}>執行下一步</button>
              </aside>;
            })()}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>操作紀錄</h3>
            <span>流程同步</span>
          </div>
          <div className="log-list">
            {logs.slice(0, 6).map((log, index) => <p key={`${log}-${index}`}>{log}</p>)}
          </div>
        </section>
      </div>
    </div>
  );
}
