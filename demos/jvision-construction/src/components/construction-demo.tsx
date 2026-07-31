"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type IssueStatus = "待處理" | "改善中" | "待複驗" | "已結案";
type Report = { id: string; date: string; weather: string; note: string; createdAt: string };
type Issue = { id: string; title: string; area: string; owner: string; status: IssueStatus; dueDate: string; createdAt: string };
type Approval = { id: string; title: string; status: "待主管簽核" | "已核准"; createdAt: string };
type DemoState = { reports: Report[]; issues: Issue[]; approvals: Approval[] };

const storageKey = "jvision-construction-demo:v2";
const initialState: DemoState = {
  reports: [{ id: "DR-20260629-01", date: "2026-06-29", weather: "晴", note: "8F 梁柱鋼筋綁紮完成，B2 機電套管複核。", createdAt: "2026/06/29 17:30" }],
  issues: [
    { id: "QH-20260630-01", title: "B2 機電管線與梁底衝突", area: "地下二層", owner: "機電分包", status: "待處理", dueDate: "2026-07-02", createdAt: "2026/06/30 09:15" },
    { id: "QH-20260629-02", title: "西側外牆鷹架踢腳板缺漏", area: "外牆", owner: "安衛工程師", status: "改善中", dueDate: "2026-07-01", createdAt: "2026/06/29 15:40" },
  ],
  approvals: [{ id: "AP-20260630-01", title: "消防材料採購單", status: "待主管簽核", createdAt: "2026/06/30 10:20" }],
};
const statusFlow: IssueStatus[] = ["待處理", "改善中", "待複驗", "已結案"];
const nowLabel = () => new Date().toLocaleString("zh-TW", { hour12: false });
const dateCode = () => {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
};

export function ConstructionDemo() {
  const [state, setState] = useState<DemoState>(initialState);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("可新增日報、建立缺失，資料會保留在此瀏覽器。");
  const [selectedIssueId, setSelectedIssueId] = useState(initialState.issues[0].id);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setState(JSON.parse(saved) as DemoState);
    } catch {
      setNotice("展示資料讀取失敗，已改用預設資料。");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(storageKey, JSON.stringify(state));
  }, [ready, state]);

  const selectedIssue = state.issues.find((issue) => issue.id === selectedIssueId) ?? state.issues[0];
  const kpis = useMemo(() => {
    const open = state.issues.filter((issue) => issue.status !== "已結案").length;
    const closed = state.issues.filter((issue) => issue.status === "已結案").length;
    return {
      open,
      reports: state.reports.length,
      approvals: state.approvals.filter((row) => row.status === "待主管簽核").length,
      progress: Math.min(100, 68 + state.reports.length),
      completion: state.issues.length ? Math.round((closed / state.issues.length) * 100) : 0,
    };
  }, [state]);

  function addReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = `DR-${dateCode()}-${String(state.reports.length + 1).padStart(2, "0")}`;
    const report: Report = { id, date: String(form.get("date")), weather: String(form.get("weather")), note: String(form.get("note")), createdAt: nowLabel() };
    setState((current) => ({ ...current, reports: [report, ...current.reports] }));
    setNotice(`新增成功：工地日報 ${id} 已加入「歷史日報」。`);
    event.currentTarget.reset();
  }

  function addIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = `QH-${dateCode()}-${String(state.issues.length + 1).padStart(2, "0")}`;
    const issue: Issue = {
      id, title: String(form.get("title")), area: String(form.get("area")), owner: String(form.get("owner")),
      dueDate: String(form.get("dueDate")), status: "待處理", createdAt: nowLabel(),
    };
    setState((current) => ({ ...current, issues: [issue, ...current.issues] }));
    setSelectedIssueId(id);
    setNotice(`建立成功：缺失單 ${id} 已加入「缺失追蹤清單」。`);
    event.currentTarget.reset();
  }

  function moveIssue(id: string, status: IssueStatus) {
    setState((current) => ({ ...current, issues: current.issues.map((issue) => issue.id === id ? { ...issue, status } : issue) }));
    setSelectedIssueId(id);
    setNotice(`缺失單 ${id} 已推進至「${status}」。`);
  }

  function submitApproval() {
    const id = `AP-${dateCode()}-${String(state.approvals.length + 1).padStart(2, "0")}`;
    const approval: Approval = { id, title: "本期估驗請款", status: "待主管簽核", createdAt: nowLabel() };
    setState((current) => ({ ...current, approvals: [approval, ...current.approvals] }));
    setNotice(`送出成功：${id} 已進入下方「審批中心」。`);
  }

  function approve(id: string) {
    setState((current) => ({ ...current, approvals: current.approvals.map((row) => row.id === id ? { ...row, status: "已核准" } : row) }));
    setNotice(`審批單 ${id} 已核准並保留操作紀錄。`);
  }

  function resetDemo() {
    setState(initialState);
    setSelectedIssueId(initialState.issues[0].id);
    localStorage.removeItem(storageKey);
    setNotice("已還原預設展示資料。");
  }

  return (
    <div className="construction-demo">
      <div className="demo-notice" role="status">
        <strong>資料流向</strong><span>{notice}</span>
        <button type="button" onClick={resetDemo}>還原展示資料</button>
      </div>
      <div className="pos-shell">
        <aside className="pos-sidebar">
          <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
          <label>專案<select aria-label="選擇專案"><option>台北南辦新建工程</option><option>桃園物流中心增建</option></select></label>
          <div className="member-card">
            <span>專案 KPI</span><strong>進度 {kpis.progress}%</strong>
            <p>未結缺失 {kpis.open} · 日報 {kpis.reports} · 待簽 {kpis.approvals}</p>
            <button type="button" onClick={submitApproval}>送出估驗審批</button>
          </div>
        </aside>
        <div className="pos-main">
          <section className="pos-panel">
            <div className="panel-heading"><div><h3>工地日報</h3><span className="section-hint">新增後立即進入歷史日報</span></div><span>現場即時回報</span></div>
            <form className="reservation-form" onSubmit={addReport}>
              <input name="date" type="date" required defaultValue="2026-06-30" aria-label="日期" />
              <input name="weather" required placeholder="天氣" aria-label="天氣" />
              <input name="note" required placeholder="今日施工重點" aria-label="施工重點" />
              <button type="submit">新增日報</button>
            </form>
            <div className="record-list" aria-label="歷史日報">
              {state.reports.map((report) => <article key={report.id}>
                <div><strong>{report.id}</strong><span>{report.date} · {report.weather}</span></div>
                <p>{report.note}</p><small>建立時間 {report.createdAt}</small>
              </article>)}
            </div>
          </section>
          <section className="pos-panel cart-panel">
            <div className="panel-heading"><div><h3>品質安衛缺失</h3><span className="section-hint">建立、指派、複驗到結案</span></div><span>派工追蹤</span></div>
            <form className="issue-form" onSubmit={addIssue}>
              <input name="title" required placeholder="缺失描述" aria-label="缺失描述" />
              <input name="area" required placeholder="區域" aria-label="區域" />
              <input name="owner" required placeholder="負責單位" aria-label="負責單位" />
              <input name="dueDate" type="date" required aria-label="改善期限" />
              <button type="submit">建立缺失</button>
            </form>
            <div className="cart-list">
              {state.issues.map((issue) => <article className={`online-order ${issue.id === selectedIssue?.id ? "selected" : ""}`} key={issue.id} onClick={() => setSelectedIssueId(issue.id)}>
                <div><span className="record-id">{issue.id}</span><strong>{issue.title}</strong><p>{issue.area} · {issue.owner} · 期限 {issue.dueDate}</p></div>
                <b>{issue.status}</b>
                <div className="order-actions">{statusFlow.map((status) => <button key={status} type="button" disabled={issue.status === status} onClick={(event) => { event.stopPropagation(); moveIssue(issue.id, status); }}>{status}</button>)}</div>
              </article>)}
            </div>
            {selectedIssue && <aside className="detail-card">
              <span>目前選取</span><strong>{selectedIssue.id} · {selectedIssue.title}</strong>
              <dl><div><dt>責任單位</dt><dd>{selectedIssue.owner}</dd></div><div><dt>改善期限</dt><dd>{selectedIssue.dueDate}</dd></div><div><dt>目前狀態</dt><dd>{selectedIssue.status}</dd></div><div><dt>建立時間</dt><dd>{selectedIssue.createdAt}</dd></div></dl>
            </aside>}
          </section>
          <section className="pos-panel analytics-panel">
            <div className="panel-heading"><div><h3>材料成本與審批中心</h3><span className="section-hint">送審後會出現在這裡，由主管核准</span></div><span>即時儀表板</span></div>
            <div className="metric-grid">
              <div><span>鋼筋預算</span><strong>88%</strong></div><div><span>混凝土用量</span><strong>76%</strong></div>
              <div><span>缺失結案率</span><strong>{kpis.completion}%</strong></div><div><span>待簽紀錄</span><strong>{kpis.approvals}</strong></div>
            </div>
            <div className="approval-list">{state.approvals.map((row) => <article key={row.id}>
              <div><strong>{row.id} · {row.title}</strong><span>{row.createdAt}</span></div><b>{row.status}</b>
              {row.status === "待主管簽核" && <button type="button" onClick={() => approve(row.id)}>主管核准</button>}
            </article>)}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
