"use client";

import { useMemo, useState } from "react";

type JobStage = "預約確認" | "零件待訂" | "已派工" | "待簽名收款" | "已完成";
type PartStatus = "待查料" | "已訂購" | "已到貨";
type ClaimStatus = "待開單" | "保險送件" | "已收款";

type GlassJob = {
  id: string;
  customer: string;
  vehicle: string;
  service: string;
  tech: string;
  part: string;
  time: string;
  amount: number;
  stage: JobStage;
};

type Part = {
  jobId: string;
  name: string;
  supplier: string;
  status: PartStatus;
};

type Claim = {
  jobId: string;
  payer: string;
  amount: number;
  status: ClaimStatus;
};

const stages: JobStage[] = ["預約確認", "零件待訂", "已派工", "待簽名收款", "已完成"];

const initialJobs: GlassJob[] = [
  { id: "AG-2601", customer: "王小姐", vehicle: "Toyota RAV4 2023", service: "前擋更換", tech: "Mia", part: "FW05678", time: "7/18 10:00", amount: 16800, stage: "已派工" },
  { id: "AG-2602", customer: "安泰保險", vehicle: "Honda CR-V 2022", service: "保險理賠前擋", tech: "Leo", part: "FW04421", time: "7/18 14:30", amount: 22500, stage: "零件待訂" },
  { id: "AG-2603", customer: "林先生", vehicle: "Tesla Model 3", service: "石擊修補", tech: "Nina", part: "免換片", time: "7/19 09:30", amount: 2800, stage: "待簽名收款" },
  { id: "AG-2604", customer: "捷運車隊", vehicle: "Ford Transit", service: "側窗更換", tech: "Ryan", part: "DG09112", time: "7/20 11:00", amount: 9600, stage: "預約確認" },
];

const initialParts: Part[] = [
  { jobId: "AG-2601", name: "RAV4 前擋玻璃 FW05678", supplier: "北區玻璃倉", status: "已到貨" },
  { jobId: "AG-2602", name: "CR-V 前擋玻璃 FW04421", supplier: "原廠零件商", status: "待查料" },
  { jobId: "AG-2604", name: "Transit 側窗 DG09112", supplier: "南區玻璃倉", status: "已訂購" },
];

const initialClaims: Claim[] = [
  { jobId: "AG-2601", payer: "王小姐", amount: 16800, status: "待開單" },
  { jobId: "AG-2602", payer: "安泰保險", amount: 22500, status: "保險送件" },
  { jobId: "AG-2603", payer: "林先生", amount: 2800, status: "已收款" },
];

const money = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

export default function AutoGlassDemo() {
  const [jobs, setJobs] = useState<GlassJob[]>(initialJobs);
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [claims, setClaims] = useState<Claim[]>(initialClaims);
  const [customer, setCustomer] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [service, setService] = useState("前擋更換");
  const [tech, setTech] = useState("Ryan");
  const [amount, setAmount] = useState("");
  const [aiSummary, setAiSummary] = useState("AI 摘要尚未生成。");
  const [activity, setActivity] = useState([
    "AG-2601 技師已確認到店，前擋玻璃已到貨。",
    "AG-2602 保險資料已建立，等待零件供應商回覆。",
    "AG-2603 已完成石擊修補，等待客戶簽名確認。",
  ]);

  const stats = useMemo(() => {
    const active = jobs.filter((job) => job.stage !== "已完成").length;
    const revenue = jobs.reduce((sum, job) => sum + job.amount, 0);
    const waitingParts = parts.filter((part) => part.status !== "已到貨").length;
    const receivables = claims.filter((claim) => claim.status !== "已收款").length;
    return { active, revenue, waitingParts, receivables };
  }, [jobs, parts, claims]);

  const addJob = () => {
    if (!customer.trim() || !vehicle.trim() || !amount.trim()) return;
    const nextId = `AG-${2601 + jobs.length}`;
    const value = Number(amount.replace(/[^\d]/g, "")) || 0;
    const job: GlassJob = {
      id: nextId,
      customer: customer.trim(),
      vehicle: vehicle.trim(),
      service,
      tech,
      part: service === "石擊修補" ? "免換片" : "待查料",
      time: "7/22 13:30",
      amount: value,
      stage: "預約確認",
    };
    setJobs((current) => [job, ...current]);
    setParts((current) => service === "石擊修補" ? current : [{ jobId: nextId, name: `${vehicle.trim()} 玻璃料號待確認`, supplier: "待詢價", status: "待查料" }, ...current]);
    setClaims((current) => [{ jobId: nextId, payer: job.customer, amount: value, status: "待開單" }, ...current]);
    setActivity((current) => [`新增 ${nextId} ${job.service}，已建立預約、車輛與請款資料。`, ...current]);
    setCustomer("");
    setVehicle("");
    setAmount("");
  };

  const moveJob = (id: string, direction: 1 | -1) => {
    const changed = jobs.find((job) => job.id === id);
    setJobs((current) => current.map((job) => {
      if (job.id !== id) return job;
      const index = stages.indexOf(job.stage);
      return { ...job, stage: stages[Math.min(stages.length - 1, Math.max(0, index + direction))] };
    }));
    if (changed) {
      const nextStage = stages[Math.min(stages.length - 1, Math.max(0, stages.indexOf(changed.stage) + direction))];
      setActivity((current) => [`${changed.id} 已移到「${nextStage}」，技師 ${changed.tech} 與櫃台同步更新。`, ...current]);
    }
  };

  const orderPart = () => {
    const target = parts.find((part) => part.status === "待查料");
    if (!target) return;
    setParts((current) => current.map((part) => part.jobId === target.jobId ? { ...part, status: "已訂購", supplier: "北區玻璃倉" } : part));
    setActivity((current) => [`${target.jobId} 已送出玻璃訂購需求，供應商更新為北區玻璃倉。`, ...current]);
  };

  const updateClaim = () => {
    const target = claims.find((claim) => claim.status !== "已收款");
    if (!target) return;
    setClaims((current) => current.map((claim) => claim.jobId === target.jobId ? { ...claim, status: claim.status === "待開單" ? "保險送件" : "已收款" } : claim));
    setActivity((current) => [`${target.jobId} 請款狀態已更新，金額 ${money.format(target.amount)}。`, ...current]);
  };

  const generateAiSummary = () => {
    const insurance = claims.filter((claim) => claim.status === "保險送件").length;
    setAiSummary(`目前有 ${stats.active} 張進行中工單，預估金額 ${money.format(stats.revenue)}。待零件 ${stats.waitingParts} 件、保險送件 ${insurance} 筆；建議優先追蹤待查料與待簽名收款案件。`);
  };

  return (
    <section className="demo-shell" id="demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision" className="demo-logo" />
        <div className="metric-card"><span>進行中工單</span><strong>{stats.active}</strong></div>
        <div className="metric-card"><span>預估金額</span><strong>{money.format(stats.revenue)}</strong></div>
        <div className="metric-card"><span>待零件</span><strong>{stats.waitingParts}</strong></div>
        <div className="metric-card"><span>待請款</span><strong>{stats.receivables}</strong></div>
      </aside>

      <div className="demo-main">
        <div className="demo-panel form-panel">
          <div className="panel-label">預約與工單</div>
          <h3>新增汽車玻璃工單</h3>
          <div className="form-grid">
            <input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="客戶或保險單位" />
            <input value={vehicle} onChange={(event) => setVehicle(event.target.value)} placeholder="車型或 VIN 資訊" />
            <select value={service} onChange={(event) => setService(event.target.value)}>
              <option>前擋更換</option>
              <option>側窗更換</option>
              <option>石擊修補</option>
              <option>ADAS 校正</option>
              <option>保險理賠前擋</option>
            </select>
            <select value={tech} onChange={(event) => setTech(event.target.value)}>
              <option>Ryan</option><option>Mia</option><option>Leo</option><option>Nina</option>
            </select>
            <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="預估金額" />
          </div>
          <button onClick={addJob} className="primary-action">新增工單</button>
          <button onClick={orderPart} className="secondary-action">送出玻璃訂購</button>
        </div>

        <div className="demo-panel ai-panel">
          <div className="panel-label">Jvision AI</div>
          <h3>店務與請款摘要</h3>
          <p>{aiSummary}</p>
          <button onClick={generateAiSummary} className="dark-action">生成 AI 摘要</button>
        </div>

        <div className="demo-panel board-panel">
          <div className="panel-label">工單流程</div>
          <h3>汽車玻璃工單看板</h3>
          <div className="job-board">
            {stages.map((stage) => (
              <div className="job-column" key={stage}>
                <h4>{stage}</h4>
                {jobs.filter((job) => job.stage === stage).map((job) => (
                  <article className="job-card" key={job.id}>
                    <strong>{job.customer}</strong>
                    <span>{job.service} · {job.vehicle}</span>
                    <span>{job.tech} · {job.part} · {job.time}</span>
                    <span>{money.format(job.amount)}</span>
                    <div className="card-actions">
                      <button onClick={() => moveJob(job.id, -1)} aria-label={`${job.id} 回上一階段`}>←</button>
                      <button onClick={() => moveJob(job.id, 1)} aria-label={`${job.id} 到下一階段`}>→</button>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="demo-panel file-panel">
          <div className="panel-header">
            <div><div className="panel-label">零件與請款</div><h3>玻璃訂購與收款追蹤</h3></div>
            <button onClick={updateClaim}>更新請款</button>
          </div>
          <div className="fleet-grid">
            {parts.map((part) => (
              <div className="fleet-card" key={`${part.jobId}-${part.name}`}>
                <strong>{part.jobId}</strong><span>{part.name}</span><em>{part.status}</em><small>{part.supplier}</small>
              </div>
            ))}
          </div>
          <div className="file-list invoice-list">
            {claims.map((claim) => (
              <div className="file-row" key={claim.jobId}>
                <strong>{claim.jobId} · {claim.payer}</strong><span>{money.format(claim.amount)}</span><em>{claim.status}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="demo-panel activity-panel">
          <div className="panel-label">同步紀錄</div>
          <h3>櫃台、技師、零件與請款通知</h3>
          <div className="activity-list">{activity.slice(0, 5).map((item) => <p key={item}>{item}</p>)}</div>
        </div>
      </div>
    </section>
  );
}
