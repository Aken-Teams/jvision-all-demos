"use client";

import { FormEvent, useMemo, useState } from "react";

type ProposalStatus = "草稿" | "待客戶確認" | "已核准";
type SelectionStatus = "待確認" | "已核准" | "需替換";
type ProcurementStatus = "未下單" | "已下單" | "運送中" | "已到貨";

type Proposal = {
  id: number;
  client: string;
  project: string;
  room: string;
  budget: number;
  status: ProposalStatus;
};

type Selection = {
  id: number;
  room: string;
  item: string;
  vendor: string;
  price: number;
  status: SelectionStatus;
};

type Procurement = {
  id: number;
  item: string;
  vendor: string;
  eta: string;
  status: ProcurementStatus;
};

const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const selectionStatuses: SelectionStatus[] = ["待確認", "已核准", "需替換"];
const procurementStatuses: ProcurementStatus[] = ["未下單", "已下單", "運送中", "已到貨"];

function money(value: number) {
  return `NT$ ${new Intl.NumberFormat("zh-TW").format(value)}`;
}

export function InteriorDesignDemo() {
  const [proposals, setProposals] = useState<Proposal[]>([
    { id: 1, client: "林小姐", project: "信義住宅軟裝", room: "客廳", budget: 860000, status: "待客戶確認" },
    { id: 2, client: "周先生", project: "新店老屋翻新", room: "主臥", budget: 520000, status: "草稿" },
  ]);
  const [selections, setSelections] = useState<Selection[]>([
    { id: 1, room: "客廳", item: "弧形布沙發", vendor: "Casa Studio", price: 118000, status: "待確認" },
    { id: 2, room: "餐廳", item: "胡桃木餐桌", vendor: "Woodline", price: 76000, status: "已核准" },
    { id: 3, room: "主臥", item: "織紋窗簾", vendor: "Soft Home", price: 42000, status: "需替換" },
  ]);
  const [procurements, setProcurements] = useState<Procurement[]>([
    { id: 1, item: "胡桃木餐桌", vendor: "Woodline", eta: "7/22", status: "已下單" },
    { id: 2, item: "壁燈組", vendor: "Light Lab", eta: "7/26", status: "運送中" },
  ]);
  const [clientNotes, setClientNotes] = useState([
    "林小姐已在選品板留言：沙發希望改成米灰色。",
    "周先生已確認主臥風格方向，等待預算版提案。",
  ]);
  const [aiSummary, setAiSummary] = useState(
    "目前客廳選品最接近核准，建議先處理沙發布料替換與餐桌到貨追蹤，避免影響下週提案簡報。",
  );

  const totals = useMemo(() => {
    const approved = selections.filter((item) => item.status === "已核准").length;
    const pending = selections.filter((item) => item.status !== "已核准").length;
    const budget = proposals.reduce((sum, row) => sum + row.budget, 0);
    const procurementRisk = procurements.filter((row) => row.status !== "已到貨").length;
    return { approved, pending, budget, procurementRisk };
  }, [proposals, procurements, selections]);

  function addProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const proposal: Proposal = {
      id: Date.now(),
      client: String(form.get("client")),
      project: String(form.get("project")),
      room: String(form.get("room")),
      budget: Number(form.get("budget")) || 0,
      status: "草稿",
    };
    setProposals((rows) => [proposal, ...rows]);
    setClientNotes((rows) => [`已新增 ${proposal.client} 的 ${proposal.project} 提案草稿。`, ...rows]);
    event.currentTarget.reset();
  }

  function approveProposal(id: number) {
    setProposals((rows) => rows.map((row) => row.id === id ? { ...row, status: "已核准" } : row));
    setClientNotes((rows) => ["提案已核准，系統同步更新客戶儀表板與採購清單。", ...rows]);
  }

  function updateSelection(id: number, status: SelectionStatus) {
    setSelections((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
    setClientNotes((rows) => [`選品狀態已更新為「${status}」。`, ...rows]);
  }

  function createPurchaseOrder(selection: Selection) {
    setProcurements((rows) => [
      { id: Date.now(), item: selection.item, vendor: selection.vendor, eta: "待供應商確認", status: "未下單" },
      ...rows,
    ]);
    setClientNotes((rows) => [`已把 ${selection.item} 送進採購追蹤。`, ...rows]);
  }

  function updateProcurement(id: number, status: ProcurementStatus) {
    setProcurements((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
  }

  function generateAiSummary() {
    const delayed = procurements.filter((row) => row.status !== "已到貨");
    const replacement = selections.find((row) => row.status === "需替換");
    setAiSummary(
      `目前共有 ${totals.pending} 個選品待處理，${delayed.length} 筆採購尚未到貨。建議優先處理「${replacement?.item ?? "客戶待確認選品"}」，並把最新到貨日同步到客戶儀表板。`,
    );
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision logo" />
        <div className="metric"><span>提案總額</span><strong>{money(totals.budget)}</strong></div>
        <div className="metric"><span>已核准選品</span><strong>{totals.approved}</strong></div>
        <div className="metric"><span>待確認選品</span><strong>{totals.pending}</strong></div>
        <div className="metric"><span>採購追蹤</span><strong>{totals.procurementRisk}</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>設計提案</span>
              <h3>新增設計提案</h3>
            </div>
          </div>
          <form className="input-grid" onSubmit={addProposal}>
            <input name="client" required placeholder="客戶姓名" aria-label="客戶姓名" />
            <input name="project" required placeholder="專案名稱" aria-label="專案名稱" />
            <input name="room" required placeholder="空間區域" aria-label="空間區域" />
            <input name="budget" required type="number" min="1" placeholder="預算金額" aria-label="預算金額" />
            <button type="submit">新增提案</button>
          </form>
          <div className="proposal-list">
            {proposals.map((proposal) => (
              <article key={proposal.id}>
                <div>
                  <strong>{proposal.project}</strong>
                  <span>{proposal.client} · {proposal.room} · {money(proposal.budget)}</span>
                </div>
                <em>{proposal.status}</em>
                <button type="button" disabled={proposal.status === "已核准"} onClick={() => approveProposal(proposal.id)}>
                  {proposal.status === "已核准" ? "已核准" : "核准提案"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <div>
              <span>Jvision AI</span>
              <h3>專案摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button type="button" onClick={generateAiSummary}>生成 AI 專案摘要</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>選品確認板</span>
              <h3>選品板與客戶確認</h3>
            </div>
          </div>
          <div className="selection-grid">
            {selections.map((selection) => (
              <article key={selection.id}>
                <div className="sample-card">
                  <span>{selection.room}</span>
                  <strong>{selection.item}</strong>
                  <small>{selection.vendor} · {money(selection.price)}</small>
                </div>
                <select value={selection.status} aria-label={`${selection.item} 狀態`} onChange={(event) => updateSelection(selection.id, event.target.value as SelectionStatus)}>
                  {selectionStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
                <button type="button" onClick={() => createPurchaseOrder(selection)}>加入採購</button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>採購追蹤</span>
              <h3>採購與到貨追蹤</h3>
            </div>
          </div>
          <div className="procurement-list">
            {procurements.map((row) => (
              <article key={row.id}>
                <div>
                  <strong>{row.item}</strong>
                  <span>{row.vendor} · 預計 {row.eta}</span>
                </div>
                <select value={row.status} aria-label={`${row.item} 採購狀態`} onChange={(event) => updateProcurement(row.id, event.target.value as ProcurementStatus)}>
                  {procurementStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>客戶儀表板</span>
              <h3>客戶儀表板紀錄</h3>
            </div>
          </div>
          <div className="log-list">
            {clientNotes.slice(0, 6).map((note, index) => <p key={`${note}-${index}`}>{note}</p>)}
          </div>
        </section>
      </div>
    </div>
  );
}
