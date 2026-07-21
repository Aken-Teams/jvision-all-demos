"use client";

import { useMemo, useState } from "react";

type ClaimStatus = "待檢核" | "可申報" | "需修正" | "已申報";

type Prescription = {
  id: number;
  patient: string;
  clinic: string;
  drug: string;
  days: number;
  identity: string;
  status: ClaimStatus;
  cost: number;
  issueScore: number;
  issueReason: string;
};

const drugOptions = [
  { name: "降血壓藥 A", daily: 22, risk: 12 },
  { name: "胃藥 B", daily: 10, risk: 8 },
  { name: "抗生素 C", daily: 34, risk: 28 },
  { name: "止痛藥 D", daily: 16, risk: 18 },
  { name: "糖尿病用藥 E", daily: 40, risk: 32 }
];

const initialPrescriptions: Prescription[] = [
  { id: 1, patient: "林先生", clinic: "仁安診所", drug: "降血壓藥 A", days: 28, identity: "一般健保", status: "可申報", cost: 706, issueScore: 12, issueReason: "資料完整，例行檢查即可" },
  { id: 2, patient: "王小姐", clinic: "明德診所", drug: "抗生素 C", days: 7, identity: "一般健保", status: "需修正", cost: 348, issueScore: 64, issueReason: "抗生素處方需確認給藥天數與診斷碼" },
  { id: 3, patient: "張太太", clinic: "康和診所", drug: "糖尿病用藥 E", days: 30, identity: "慢性處方", status: "待檢核", cost: 1290, issueScore: 36, issueReason: "慢性處方需確認連續處方註記" },
  { id: 4, patient: "陳同學", clinic: "新城診所", drug: "胃藥 B", days: 14, identity: "兒童", status: "已申報", cost: 225, issueScore: 10, issueReason: "兒童身分已套用服務費" }
];

function money(value: number) {
  return `NT$ ${new Intl.NumberFormat("zh-TW").format(Math.round(value))}`;
}

function serviceFee(identity: string) {
  if (identity === "兒童") return 70;
  if (identity === "慢性處方") return 95;
  return 60;
}

function getIssueReason(drugName: string, days: number, identity: string, score: number) {
  if (days > 30) return "給藥天數超過 30 天，請確認是否符合申報規則";
  if (identity === "兒童") return "兒童身分需確認年齡與服務費是否正確";
  if (drugName.includes("抗生素")) return "抗生素處方需確認給藥天數與診斷碼";
  if (drugName.includes("糖尿病")) return "慢性用藥需確認連續處方或慢箋註記";
  if (score >= 50) return "申報資料分數偏高，建議先檢查身分別與部分負擔";
  return "資料完整，例行檢查即可";
}

export default function PharmacyDemo({ logoUrl }: { logoUrl: string }) {
  const [items, setItems] = useState<Prescription[]>(initialPrescriptions);
  const [form, setForm] = useState({
    patient: "吳先生",
    clinic: "安欣診所",
    drug: "止痛藥 D",
    days: "5",
    identity: "一般健保"
  });
  const [message, setMessage] = useState("請新增一筆處方，系統會試算費用並提示申報風險。");
  const [aiSummary, setAiSummary] = useState("AI 申報摘要尚未生成。");

  const metrics = useMemo(() => {
    const ready = items.filter((item) => item.status === "可申報" || item.status === "已申報").length;
    const errors = items.filter((item) => item.status === "需修正" || item.issueScore >= 50).length;
    const total = items.reduce((sum, item) => sum + item.cost, 0);
    return { ready, errors, total };
  }, [items]);

  const riskList = useMemo(() => [...items].sort((a, b) => b.issueScore - a.issueScore), [items]);

  function addPrescription() {
    const days = Number(form.days);
    const drug = drugOptions.find((item) => item.name === form.drug) ?? drugOptions[0];
    if (!Number.isFinite(days) || days <= 0) {
      setMessage("請輸入正確的給藥天數。");
      return;
    }
    const cost = drug.daily * days + serviceFee(form.identity);
    const issueScore = Math.min(92, Math.max(8, drug.risk + (days > 30 ? 35 : 0) + (form.identity === "兒童" ? 10 : 0)));
    const next: Prescription = {
      id: Date.now(),
      patient: form.patient || "未命名患者",
      clinic: form.clinic || "未指定診所",
      drug: drug.name,
      days,
      identity: form.identity,
      status: issueScore >= 55 ? "需修正" : "待檢核",
      cost,
      issueScore,
      issueReason: getIssueReason(drug.name, days, form.identity, issueScore)
    };
    setItems((current) => [next, ...current]);
    setMessage(`已新增「${next.patient} / ${next.drug}」，費用試算為 ${money(next.cost)}，目前狀態：${next.status}。`);
  }

  function updateStatus(id: number, nextStatus: ClaimStatus) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    setMessage(`處方狀態已更新為：${nextStatus}`);
  }

  function generateSummary() {
    const topRisk = riskList[0];
    setAiSummary(
      `今日共有 ${items.length} 筆處方，${metrics.ready} 筆可申報或已申報，${metrics.errors} 筆需要先修正。最需要優先檢查的是「${topRisk.patient} / ${topRisk.drug}」，原因是：${topRisk.issueReason}。`
    );
  }

  const reports = [
    ["申報金額", money(metrics.total), "依目前處方試算"],
    ["可申報筆數", `${metrics.ready} 筆`, "已通過或已送出"],
    ["待修正錯誤", `${metrics.errors} 筆`, "建議先處理"],
    ["藥價版本", "2026.07", "已套用最新版本"]
  ];

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision" />
        <div className="metric"><span>今日處方</span><strong>{items.length}</strong></div>
        <div className="metric"><span>可申報</span><strong>{metrics.ready}</strong></div>
        <div className="metric"><span>待修正</span><strong>{metrics.errors}</strong></div>
        <div className="metric"><span>申報試算</span><strong>{money(metrics.total)}</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>處方建立</span>
              <h3>新增調劑處方</h3>
            </div>
          </div>
          <div className="form-grid">
            <input value={form.patient} onChange={(event) => setForm({ ...form, patient: event.target.value })} aria-label="患者姓名" />
            <input value={form.clinic} onChange={(event) => setForm({ ...form, clinic: event.target.value })} aria-label="診所名稱" />
            <select value={form.drug} onChange={(event) => setForm({ ...form, drug: event.target.value })} aria-label="藥品名稱">
              {drugOptions.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
            <select value={form.identity} onChange={(event) => setForm({ ...form, identity: event.target.value })} aria-label="身分別">
              <option>一般健保</option>
              <option>慢性處方</option>
              <option>兒童</option>
            </select>
            <input value={form.days} onChange={(event) => setForm({ ...form, days: event.target.value })} aria-label="給藥天數" />
            <button type="button" onClick={addPrescription}>新增處方並試算</button>
          </div>
          <p className="status-message">{message}</p>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <div>
              <span>AI 申報助理</span>
              <h3>今日申報摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button type="button" onClick={generateSummary}>生成 AI 申報摘要</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>申報統計</span>
              <h3>費用與申報狀態</h3>
            </div>
            <button className="print-button" type="button" onClick={() => setMessage("已模擬列印藥袋、藥品明細與收據。")}>
              列印藥袋與收據
            </button>
          </div>
          <div className="report-grid">
            {reports.map(([title, value, note]) => (
              <article className="report-card" key={title}>
                <span>{title}</span>
                <strong>{value}</strong>
                <p>{note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>處方清單</span>
              <h3>調劑與申報狀態</h3>
            </div>
          </div>
          <div className="prescription-list">
            {items.map((item) => (
              <article className="prescription-card" key={item.id}>
                <span>{item.clinic} / {item.status}</span>
                <strong>{item.patient} · {item.drug}</strong>
                <span>{item.identity} · {item.days} 天 · {money(item.cost)}</span>
                <div className="chip-row">
                  <em className="chip">檢查分數 {item.issueScore}</em>
                  <em className="chip">{item.status}</em>
                </div>
                <div className="prescription-actions">
                  <button type="button" onClick={() => updateStatus(item.id, "可申報")}>標記可申報</button>
                  <button type="button" onClick={() => updateStatus(item.id, "已申報")}>送出申報</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>錯誤檢核</span>
              <h3>待修正處方排序</h3>
            </div>
          </div>
          <div className="error-list">
            {riskList.slice(0, 5).map((item) => (
              <article className="error-card error-row" key={item.id}>
                <div>
                  <strong>{item.patient}</strong>
                  <p>{item.drug} / {item.days} 天 / {item.identity}</p>
                  <span>{item.issueReason}</span>
                </div>
                <div className="error-track"><i style={{ width: `${item.issueScore}%` }} /></div>
                <span>{item.issueScore} 分</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
