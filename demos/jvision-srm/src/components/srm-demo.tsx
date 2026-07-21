"use client";

import { useMemo, useState } from "react";

type CaseStage = "詢價中" | "議價中" | "待決標" | "訂單履約" | "完成驗收";

type PurchaseCase = {
  id: number;
  title: string;
  buyer: string;
  category: string;
  budget: number;
  dueDate: string;
  supplier: string;
  quote: number;
  risk: number;
  stage: CaseStage;
};

const stages: CaseStage[] = ["詢價中", "議價中", "待決標", "訂單履約", "完成驗收"];

const initialCases: PurchaseCase[] = [
  { id: 1001, title: "無塵室耗材年度採購", buyer: "Mia", category: "製造耗材", budget: 820000, dueDate: "7/12", supplier: "台灣精材", quote: 768000, risk: 28, stage: "議價中" },
  { id: 1002, title: "倉儲條碼設備更新", buyer: "Leo", category: "資訊設備", budget: 460000, dueDate: "7/18", supplier: "迅捷科技", quote: 442000, risk: 42, stage: "待決標" },
  { id: 1003, title: "物流外包合約續約", buyer: "Nina", category: "委外服務", budget: 1200000, dueDate: "7/25", supplier: "達運物流", quote: 1265000, risk: 68, stage: "詢價中" },
  { id: 1004, title: "產線保養零件採購", buyer: "Ryan", category: "設備零件", budget: 350000, dueDate: "7/10", supplier: "宏盛機電", quote: 336000, risk: 18, stage: "完成驗收" }
];

function money(value: number) {
  return `NT$ ${new Intl.NumberFormat("zh-TW").format(value)}`;
}

export default function SrmDemo({ logoUrl }: { logoUrl: string }) {
  const [cases, setCases] = useState<PurchaseCase[]>(initialCases);
  const [form, setForm] = useState({
    title: "包裝材料季度採購",
    buyer: "Ariel",
    category: "包材",
    budget: "560000",
    dueDate: "8/05",
    supplier: "永信包材",
    quote: "538000"
  });
  const [message, setMessage] = useState("請新增採購案件，或用「退回上一關 / 前往下一關」按鈕調整案件流程。");
  const [aiSummary, setAiSummary] = useState("AI 採購摘要尚未生成。");

  const metrics = useMemo(() => {
    const active = cases.filter((item) => item.stage !== "完成驗收").length;
    const risk = cases.filter((item) => item.risk >= 50).length;
    const saving = cases.reduce((sum, item) => sum + Math.max(0, item.budget - item.quote), 0);
    return { active, risk, saving };
  }, [cases]);

  const sortedByRisk = useMemo(() => [...cases].sort((a, b) => b.risk - a.risk), [cases]);
  const bestQuotes = useMemo(() => [...cases].sort((a, b) => (a.quote / a.budget) - (b.quote / b.budget)).slice(0, 4), [cases]);

  function addCase() {
    const budget = Number(form.budget);
    const quote = Number(form.quote);
    if (!Number.isFinite(budget) || !Number.isFinite(quote) || budget <= 0 || quote <= 0) {
      setMessage("請輸入正確的預算與報價金額。");
      return;
    }
    const risk = Math.min(92, Math.max(8, Math.round((quote / budget) * 38 + (form.category.length * 3))));
    const next: PurchaseCase = {
      id: Date.now(),
      title: form.title || "未命名採購案件",
      buyer: form.buyer || "未指定",
      category: form.category || "未分類",
      budget,
      dueDate: form.dueDate || "待確認",
      supplier: form.supplier || "待邀請供應商",
      quote,
      risk,
      stage: "詢價中"
    };
    setCases((current) => [next, ...current]);
    setMessage(`已建立「${next.title}」，目前進入詢價流程。`);
  }

  function moveCase(id: number, direction: -1 | 1) {
    setCases((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const index = stages.indexOf(item.stage);
        const nextStage = stages[Math.min(Math.max(index + direction, 0), stages.length - 1)];
        setMessage(`「${item.title}」已移動到：${nextStage}`);
        return { ...item, stage: nextStage };
      })
    );
  }

  function generateSummary() {
    const highestRisk = sortedByRisk[0];
    const best = bestQuotes[0];
    setAiSummary(
      `今日共有 ${metrics.active} 件採購案件進行中，${metrics.risk} 件需要注意交期或報價風險。最高風險為「${highestRisk.title}」，建議先確認 ${highestRisk.supplier} 的交期承諾。最佳節省機會是「${best.title}」，目前報價低於預算 ${money(best.budget - best.quote)}。`
    );
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision" />
        <div className="metric"><span>進行中案件</span><strong>{metrics.active}</strong></div>
        <div className="metric"><span>風險案件</span><strong>{metrics.risk}</strong></div>
        <div className="metric"><span>預估節省</span><strong>{money(metrics.saving)}</strong></div>
        <div className="metric"><span>供應商回覆</span><strong>92%</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>採購案件建立</span>
              <h3>新增採購需求</h3>
            </div>
          </div>
          <div className="form-grid">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} aria-label="採購案件名稱" />
            <input value={form.buyer} onChange={(event) => setForm({ ...form, buyer: event.target.value })} aria-label="採購負責人" />
            <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} aria-label="採購品類" />
            <input value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} aria-label="需求日期" />
            <input value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} aria-label="建議供應商" />
            <input value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} aria-label="預算金額" />
            <input value={form.quote} onChange={(event) => setForm({ ...form, quote: event.target.value })} aria-label="供應商報價" />
            <button type="button" onClick={addCase}>新增採購案件</button>
          </div>
          <p className="status-message">{message}</p>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <div>
              <span>AI 採購助理</span>
              <h3>今日協作摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button type="button" onClick={generateSummary}>生成 AI 採購摘要</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>報價比較</span>
              <h3>預算與供應商報價</h3>
            </div>
            <button className="portal-button" type="button" onClick={() => setMessage("已模擬發布供應商入口通知：請供應商補齊報價附件與交期承諾。")}>
              發布供應商通知
            </button>
          </div>
          <div className="quote-grid">
            {bestQuotes.map((item) => (
              <article className="quote-card" key={item.id}>
                <span>{item.supplier}</span>
                <strong>{money(item.quote)}</strong>
                <p>{item.title}</p>
                <em className="chip">低於預算 {money(Math.max(0, item.budget - item.quote))}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>案件流程</span>
              <h3>採購案件列表</h3>
            </div>
          </div>
          <div className="case-list">
            {cases.map((item) => (
              <article className="case-card" key={item.id}>
                <span>{item.category} / {item.stage}</span>
                <strong>{item.title}</strong>
                <span>{item.buyer} · {item.supplier} · 需求日 {item.dueDate}</span>
                <div className="chip-row">
                  <em className="chip">預算 {money(item.budget)}</em>
                  <em className="chip">報價 {money(item.quote)}</em>
                  <em className="chip">風險 {item.risk}</em>
                </div>
                <div className="case-actions">
                  <button type="button" onClick={() => moveCase(item.id, -1)} aria-label="退回上一階段">退回上一關</button>
                  <button type="button" onClick={() => moveCase(item.id, 1)} aria-label="推進下一階段">前往下一關</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>風險排序</span>
              <h3>交期與履約風險</h3>
            </div>
          </div>
          <div className="risk-list">
            {sortedByRisk.slice(0, 5).map((item) => (
              <article className="risk-card risk-row" key={item.id}>
                <strong>{item.supplier}</strong>
                <div className="risk-track"><i style={{ width: `${item.risk}%` }} /></div>
                <span>{item.risk}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
