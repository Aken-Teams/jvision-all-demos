"use client";

import { FormEvent, useMemo, useState } from "react";

type CaseStatus = "受理中" | "準備中" | "開庭中" | "結案";
type LegalCase = {
  id: number; title: string; client: string; lawyer: string; status: CaseStatus;
  caseNo: string; court: string; nextAction: string; notes: string[];
};
type Hearing = { id: number; caseId: number; caseTitle: string; court: string; date: string; reminder: string };
type Task = { id: number; title: string; owner: string; status: "待辦" | "進行中" | "已完成" };

const caseStatuses: CaseStatus[] = ["受理中", "準備中", "開庭中", "結案"];

export function LegalOpsDemo() {
  const [cases, setCases] = useState<LegalCase[]>([
    { id: 1, title: "買賣契約損害賠償", client: "林先生", lawyer: "陳律師", status: "準備中", caseNo: "北院民字第 114-328 號", court: "臺北地方法院", nextAction: "完成準備書狀並確認證物編號", notes: ["已收齊契約、付款紀錄與往來郵件"] },
    { id: 2, title: "勞資爭議調解", client: "和信公司", lawyer: "王律師", status: "受理中", caseNo: "北市勞調字第 114-086 號", court: "臺北市勞動局", nextAction: "整理出勤與薪資資料", notes: ["等待客戶補充加班紀錄"] },
    { id: 3, title: "家事親權協議", client: "張小姐", lawyer: "李律師", status: "開庭中", caseNo: "北院家親字第 114-051 號", court: "臺北地方法院家事庭", nextAction: "確認庭前協議修訂內容", notes: ["雙方已交換第二版協議草案"] },
  ]);
  const [selectedId, setSelectedId] = useState(1);
  const [hearings, setHearings] = useState<Hearing[]>([
    { id: 1, caseId: 3, caseTitle: "家事親權協議", court: "臺北地方法院", date: "2026-08-07T10:30", reminder: "24 小時前" },
  ]);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "整理買賣契約證物清冊", owner: "陳律師", status: "進行中" },
  ]);
  const [timeLogs, setTimeLogs] = useState(["陳律師｜買賣契約損害賠償｜2.5h"]);
  const [notices, setNotices] = useState(["家事親權協議｜開庭前 24 小時提醒"]);
  const [billings, setBillings] = useState(["林先生｜第一階段委任費 NT$ 80,000｜待請款"]);
  const [note, setNote] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [hearingCourt, setHearingCourt] = useState("");

  const selectedCase = cases.find((row) => row.id === selectedId) || cases[0];
  const selectedHearings = hearings.filter((row) => row.caseId === selectedCase?.id);
  const kpis = useMemo(() => ({
    active: cases.filter((row) => row.status !== "結案").length,
    pendingTasks: tasks.filter((row) => row.status !== "已完成").length,
    hours: timeLogs.length * 2.5,
    receivable: billings.length * 80000,
  }), [billings.length, cases, tasks, timeLogs.length]);

  function addCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = Date.now();
    const row: LegalCase = {
      id, title: String(form.get("title")), client: String(form.get("client")), lawyer: String(form.get("lawyer")),
      status: "受理中", caseNo: `JV-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, "0")}`,
      court: "尚未指定", nextAction: "進行利益衝突檢查並建立委任文件", notes: ["案件建立完成"],
    };
    setCases((rows) => [row, ...rows]);
    setSelectedId(id);
    event.currentTarget.reset();
  }

  function updateSelected(patch: Partial<LegalCase>) {
    setCases((rows) => rows.map((row) => row.id === selectedCase.id ? { ...row, ...patch } : row));
  }

  function saveNote() {
    if (!note.trim()) return;
    updateSelected({ notes: [`${new Date().toLocaleTimeString("zh-TW")}｜${note.trim()}`, ...selectedCase.notes] });
    setNote("");
  }

  function addHearing() {
    if (!hearingDate || !hearingCourt.trim()) return;
    setHearings((rows) => [{
      id: Date.now(), caseId: selectedCase.id, caseTitle: selectedCase.title,
      court: hearingCourt.trim(), date: hearingDate, reminder: "24 小時前",
    }, ...rows]);
    setNotices((rows) => [`${selectedCase.title}｜${hearingCourt.trim()}｜開庭前 24 小時提醒`, ...rows]);
    setHearingDate("");
    setHearingCourt("");
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>案件營運摘要</span><strong>{kpis.active} 件</strong>
          <p>待辦 {kpis.pendingTasks} 件・已登錄 {kpis.hours} 小時・應收 NT$ {kpis.receivable.toLocaleString("zh-TW")}</p>
          <button type="button" onClick={() => setBillings((rows) => [`${selectedCase.client}｜${selectedCase.title}｜NT$ 60,000｜待請款`, ...rows])}>建立階段請款</button>
        </div>
      </aside>

      <div className="property-workspace legal-workspace">
        <section className="demo-panel">
          <div className="panel-heading"><div><h3>案件管理</h3><p className="panel-help">選取案件後，在右側完成階段、紀錄與庭期作業。</p></div><span>Cases</span></div>
          <form className="property-form" onSubmit={addCase}>
            <input name="title" required placeholder="案件名稱" aria-label="案件名稱" />
            <input name="client" required placeholder="當事人" aria-label="當事人" />
            <input name="lawyer" required placeholder="承辦律師" aria-label="承辦律師" />
            <button type="submit">新增案件</button>
          </form>
          <div className="unit-list">
            {cases.map((legalCase) => (
              <article className={`unit-card selectable-case ${selectedId === legalCase.id ? "is-selected" : ""}`} key={legalCase.id}>
                <button className="case-select" type="button" onClick={() => setSelectedId(legalCase.id)}>
                  <span><strong>{legalCase.title}</strong><small>{legalCase.caseNo}</small></span>
                  <span className="case-status">{legalCase.status}</span>
                </button>
                <p>{legalCase.client}・{legalCase.lawyer}</p><p>下一步：{legalCase.nextAction}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel case-console">
          <div className="panel-heading"><div><span className="section-kicker">目前選取</span><h3>{selectedCase.title}</h3></div><span>{selectedCase.status}</span></div>
          <dl className="case-facts">
            <div><dt>案號</dt><dd>{selectedCase.caseNo}</dd></div><div><dt>當事人</dt><dd>{selectedCase.client}</dd></div>
            <div><dt>承辦律師</dt><dd>{selectedCase.lawyer}</dd></div><div><dt>法院／機關</dt><dd>{selectedCase.court}</dd></div>
          </dl>
          <div className="case-action-block">
            <label htmlFor="case-stage">案件階段與下一步</label>
            <div className="action-row">
              <select id="case-stage" value={selectedCase.status} onChange={(event) => updateSelected({ status: event.target.value as CaseStatus })}>{caseStatuses.map((status) => <option key={status}>{status}</option>)}</select>
              <input value={selectedCase.nextAction} onChange={(event) => updateSelected({ nextAction: event.target.value })} aria-label="下一步工作" />
            </div>
          </div>
          <div className="case-action-block">
            <label htmlFor="case-note">新增案件紀錄</label>
            <div className="action-row"><input id="case-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：已收到對方書狀，待確認答辯方向" /><button type="button" onClick={saveNote}>儲存紀錄</button></div>
            <div className="case-timeline">{selectedCase.notes.map((row, index) => <p key={`${row}-${index}`}>{row}</p>)}</div>
          </div>
          <div className="case-action-block">
            <label>建立庭期與提醒</label>
            <div className="action-row hearing-fields">
              <input type="datetime-local" value={hearingDate} onChange={(event) => setHearingDate(event.target.value)} aria-label="庭期時間" />
              <input value={hearingCourt} onChange={(event) => setHearingCourt(event.target.value)} placeholder="法院、股別或調解機關" aria-label="法院或機關" />
              <button type="button" onClick={addHearing}>加入行事曆</button>
            </div>
            <div className="hearing-list">{selectedHearings.length ? selectedHearings.map((row) => <p key={row.id}><strong>{row.court}</strong><span>{row.date.replace("T", " ")}・{row.reminder}提醒</span></p>) : <p className="empty-state">此案件尚未建立庭期。</p>}</div>
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>待辦回報</h3><span>Tasks</span></div>
          <div className="unit-list">{tasks.map((task) => <article className="unit-card" key={task.id}><div><strong>{task.title}</strong><p>{task.owner}・{task.status}</p></div><button className="inline-action" type="button" onClick={() => setTasks((rows) => rows.map((row) => row.id === task.id ? { ...row, status: "已完成" } : row))}>完成並回報</button></article>)}</div>
        </section>
        <section className="demo-panel">
          <div className="panel-heading"><h3>通知、工時與請款</h3><span>Activity</span></div>
          <div className="activity-actions">
            <button type="button" onClick={() => setTimeLogs((rows) => [`${selectedCase.lawyer}｜${selectedCase.title}｜1.5h`, ...rows])}>登錄 1.5 小時</button>
            <button type="button" onClick={() => setNotices((rows) => [`${selectedCase.title}｜已發送承辦團隊提醒`, ...rows])}>發送案件提醒</button>
          </div>
          <div className="tag-list">{[...notices, ...timeLogs, ...billings].map((row, index) => <span key={`${row}-${index}`}>{row}</span>)}</div>
        </section>
      </div>
    </div>
  );
}
