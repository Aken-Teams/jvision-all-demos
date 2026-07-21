"use client";

import { useMemo, useState } from "react";

type JobStage = "洽談中" | "報價中" | "製作中" | "安裝排程" | "已完成";
type FileStatus = "待整理" | "已上傳" | "已確認";

type Job = {
  id: string;
  customer: string;
  project: string;
  type: string;
  owner: string;
  due: string;
  amount: number;
  margin: number;
  stage: JobStage;
};

type ShopFile = {
  name: string;
  job: string;
  status: FileStatus;
};

const stages: JobStage[] = ["洽談中", "報價中", "製作中", "安裝排程", "已完成"];

const initialJobs: Job[] = [
  {
    id: "ST-2601",
    customer: "遠景建設",
    project: "接待中心外牆招牌",
    type: "戶外招牌",
    owner: "Mia",
    due: "7/18",
    amount: 186000,
    margin: 32,
    stage: "製作中",
  },
  {
    id: "ST-2602",
    customer: "青禾餐飲",
    project: "門市燈箱與菜單板",
    type: "燈箱招牌",
    owner: "Leo",
    due: "7/20",
    amount: 92000,
    margin: 28,
    stage: "報價中",
  },
  {
    id: "ST-2603",
    customer: "晨光診所",
    project: "室內導視與玻璃貼",
    type: "導視工程",
    owner: "Nina",
    due: "7/23",
    amount: 128000,
    margin: 35,
    stage: "安裝排程",
  },
  {
    id: "ST-2604",
    customer: "新港物流",
    project: "車體貼膜更新",
    type: "車貼包膜",
    owner: "Ryan",
    due: "7/27",
    amount: 76000,
    margin: 24,
    stage: "洽談中",
  },
];

const initialFiles: ShopFile[] = [
  { name: "外牆招牌設計稿.ai", job: "ST-2601", status: "已上傳" },
  { name: "燈箱尺寸丈量照片.zip", job: "ST-2602", status: "待整理" },
  { name: "導視施工圖.pdf", job: "ST-2603", status: "已確認" },
];

const money = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default function SignShopDemo() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [files, setFiles] = useState<ShopFile[]>(initialFiles);
  const [customer, setCustomer] = useState("");
  const [project, setProject] = useState("");
  const [type, setType] = useState("戶外招牌");
  const [owner, setOwner] = useState("Mia");
  const [amount, setAmount] = useState("");
  const [aiSummary, setAiSummary] = useState("AI 摘要尚未生成。");
  const [activity, setActivity] = useState([
    "已更新 ST-2601 製作進度，等待烤漆完成。",
    "青禾餐飲報價單已補上燈箱電源施工項目。",
    "晨光診所導視圖面已完成客戶確認。",
  ]);

  const stats = useMemo(() => {
    const active = jobs.filter((job) => job.stage !== "已完成").length;
    const total = jobs.reduce((sum, job) => sum + job.amount, 0);
    const averageMargin = Math.round(jobs.reduce((sum, job) => sum + job.margin, 0) / jobs.length);
    const installs = jobs.filter((job) => job.stage === "安裝排程").length;
    return { active, total, averageMargin, installs };
  }, [jobs]);

  const addJob = () => {
    if (!customer.trim() || !project.trim() || !amount.trim()) return;
    const nextId = `ST-${2601 + jobs.length}`;
    const value = Number(amount.replace(/[^\d]/g, "")) || 0;
    const job: Job = {
      id: nextId,
      customer: customer.trim(),
      project: project.trim(),
      type,
      owner,
      due: "7/30",
      amount: value,
      margin: 30,
      stage: "洽談中",
    };
    setJobs((current) => [job, ...current]);
    setActivity((current) => [`新增 ${nextId} ${job.project}，已建立客戶與報價資料。`, ...current]);
    setCustomer("");
    setProject("");
    setAmount("");
  };

  const moveJob = (id: string, direction: 1 | -1) => {
    setJobs((current) =>
      current.map((job) => {
        if (job.id !== id) return job;
        const index = stages.indexOf(job.stage);
        const nextStage = stages[Math.min(stages.length - 1, Math.max(0, index + direction))];
        return { ...job, stage: nextStage };
      }),
    );
    const changed = jobs.find((job) => job.id === id);
    if (changed) {
      const nextStage = stages[Math.min(stages.length - 1, Math.max(0, stages.indexOf(changed.stage) + direction))];
      setActivity((current) => [`${changed.id} 已移到「${nextStage}」，同步通知負責人 ${changed.owner}。`, ...current]);
    }
  };

  const createQuote = () => {
    const top = [...jobs].sort((a, b) => b.amount - a.amount)[0];
    if (!top) return;
    setActivity((current) => [
      `${top.customer} 報價單已套用招牌工程模板，毛利率 ${top.margin}% 可送審。`,
      ...current,
    ]);
  };

  const uploadFile = () => {
    const target = jobs[0];
    if (!target) return;
    setFiles((current) => [
      { name: `${target.project}-現場丈量照片.zip`, job: target.id, status: "已上傳" },
      ...current,
    ]);
    setActivity((current) => [`${target.id} 已補上現場照片，設計與施工團隊可直接查看。`, ...current]);
  };

  const generateAiSummary = () => {
    const quoteCount = jobs.filter((job) => job.stage === "報價中").length;
    const installing = jobs.filter((job) => job.stage === "安裝排程").map((job) => job.customer).join("、") || "目前無";
    setAiSummary(
      `目前有 ${stats.active} 件進行中案件，總金額 ${money.format(stats.total)}。報價中 ${quoteCount} 件，安裝排程為 ${installing}；建議優先確認高金額案件的施工圖與收款節點。`,
    );
  };

  return (
    <section className="demo-shell" id="demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision" className="demo-logo" />
        <div className="metric-card">
          <span>進行中案件</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="metric-card">
          <span>預估營收</span>
          <strong>{money.format(stats.total)}</strong>
        </div>
        <div className="metric-card">
          <span>平均毛利率</span>
          <strong>{stats.averageMargin}%</strong>
        </div>
        <div className="metric-card">
          <span>待安裝</span>
          <strong>{stats.installs}</strong>
        </div>
      </aside>

      <div className="demo-main">
        <div className="demo-panel form-panel">
          <div className="panel-label">客戶與報價</div>
          <h3>新增招牌工程案件</h3>
          <div className="form-grid">
            <input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="客戶名稱" />
            <input value={project} onChange={(event) => setProject(event.target.value)} placeholder="案件名稱" />
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option>戶外招牌</option>
              <option>燈箱招牌</option>
              <option>導視工程</option>
              <option>車貼包膜</option>
              <option>輸出與施工</option>
            </select>
            <select value={owner} onChange={(event) => setOwner(event.target.value)}>
              <option>Mia</option>
              <option>Leo</option>
              <option>Nina</option>
              <option>Ryan</option>
            </select>
            <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="報價金額" />
          </div>
          <button onClick={addJob} className="primary-action">新增案件</button>
          <button onClick={createQuote} className="secondary-action">產生報價提醒</button>
        </div>

        <div className="demo-panel ai-panel">
          <div className="panel-label">Jvision AI</div>
          <h3>店務狀態摘要</h3>
          <p>{aiSummary}</p>
          <button onClick={generateAiSummary} className="dark-action">生成 AI 摘要</button>
        </div>

        <div className="demo-panel board-panel">
          <div className="panel-label">工單流程</div>
          <h3>招牌案件看板</h3>
          <div className="job-board">
            {stages.map((stage) => (
              <div className="job-column" key={stage}>
                <h4>{stage}</h4>
                {jobs
                  .filter((job) => job.stage === stage)
                  .map((job) => (
                    <article className="job-card" key={job.id}>
                      <strong>{job.project}</strong>
                      <span>{job.customer} · {job.type}</span>
                      <span>{job.owner} · 期限 {job.due} · 毛利 {job.margin}%</span>
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
            <div>
              <div className="panel-label">檔案管理</div>
              <h3>設計稿、照片與施工文件</h3>
            </div>
            <button onClick={uploadFile}>上傳檔案</button>
          </div>
          <div className="file-list">
            {files.map((file) => (
              <div className="file-row" key={`${file.name}-${file.job}`}>
                <strong>{file.name}</strong>
                <span>{file.job}</span>
                <em>{file.status}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="demo-panel activity-panel">
          <div className="panel-label">同步紀錄</div>
          <h3>團隊任務與客戶跟進</h3>
          <div className="activity-list">
            {activity.slice(0, 5).map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
