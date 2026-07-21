"use client";

import { FormEvent, useMemo, useState } from "react";

type StyleStage = "企劃中" | "打樣中" | "試穿修正" | "核准量產";
type MaterialStatus = "待詢價" | "已詢價" | "已核准" | "需替代";

type StyleItem = {
  id: number;
  code: string;
  name: string;
  category: string;
  owner: string;
  targetCost: number;
  stage: StyleStage;
};

type Material = {
  id: number;
  styleCode: string;
  name: string;
  supplier: string;
  cost: number;
  status: MaterialStatus;
};

type FileItem = {
  id: number;
  name: string;
  kind: string;
  owner: string;
};

const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const styleStages: StyleStage[] = ["企劃中", "打樣中", "試穿修正", "核准量產"];
const materialStatuses: MaterialStatus[] = ["待詢價", "已詢價", "已核准", "需替代"];

function money(value: number) {
  return `NT$ ${new Intl.NumberFormat("zh-TW").format(value)}`;
}

export function FashionPlmDemo() {
  const [styles, setStyles] = useState<StyleItem[]>([
    { id: 1, code: "SS26-DR-018", name: "亞麻綁帶洋裝", category: "女裝 / 洋裝", owner: "Mia", targetCost: 780, stage: "打樣中" },
    { id: 2, code: "SS26-TP-044", name: "機能短版外套", category: "外套", owner: "Leo", targetCost: 1260, stage: "試穿修正" },
    { id: 3, code: "SS26-PT-012", name: "高腰寬褲", category: "褲裝", owner: "Nina", targetCost: 690, stage: "企劃中" },
  ]);
  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, styleCode: "SS26-DR-018", name: "水洗亞麻布", supplier: "Green Textile", cost: 310, status: "已詢價" },
    { id: 2, styleCode: "SS26-TP-044", name: "防潑水尼龍", supplier: "Future Fabric", cost: 520, status: "需替代" },
    { id: 3, styleCode: "SS26-PT-012", name: "彈性斜紋布", supplier: "Twill Lab", cost: 260, status: "待詢價" },
  ]);
  const [files, setFiles] = useState<FileItem[]>([
    { id: 1, name: "SS26-DR-018 技術包.pdf", kind: "技術包", owner: "Mia" },
    { id: 2, name: "外套試穿修正紀錄.xlsx", kind: "試穿紀錄", owner: "Leo" },
  ]);
  const [logs, setLogs] = useState([
    "已同步款式資料與物料成本，商品開發會議可直接查看。",
    "機能短版外套布料需替代，已標示上市風險。",
  ]);
  const [aiSummary, setAiSummary] = useState(
    "目前外套款式卡在試穿修正與替代布料，建議優先確認防潑水尼龍替代方案，避免影響上市排程。",
  );

  const totals = useMemo(() => {
    const launchReady = styles.filter((style) => style.stage === "核准量產").length;
    const riskyMaterials = materials.filter((material) => material.status === "需替代" || material.status === "待詢價").length;
    const avgCost = Math.round(styles.reduce((sum, style) => sum + style.targetCost, 0) / styles.length);
    const filesCount = files.length;
    return { launchReady, riskyMaterials, avgCost, filesCount };
  }, [files.length, materials, styles]);

  function addStyle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const style: StyleItem = {
      id: Date.now(),
      code: String(form.get("code")),
      name: String(form.get("name")),
      category: String(form.get("category")),
      owner: String(form.get("owner")),
      targetCost: Number(form.get("targetCost")) || 0,
      stage: "企劃中",
    };
    setStyles((rows) => [style, ...rows]);
    setLogs((rows) => [`已新增款式 ${style.code} / ${style.name}，進入系列企劃。`, ...rows]);
    event.currentTarget.reset();
  }

  function updateStage(id: number, stage: StyleStage) {
    setStyles((rows) => rows.map((style) => style.id === id ? { ...style, stage } : style));
    setLogs((rows) => [`款式階段已更新為「${stage}」。`, ...rows]);
  }

  function updateMaterial(id: number, status: MaterialStatus) {
    setMaterials((rows) => rows.map((material) => material.id === id ? { ...material, status } : material));
    setLogs((rows) => [`物料狀態已更新為「${status}」。`, ...rows]);
  }

  function uploadFile() {
    const file: FileItem = {
      id: Date.now(),
      name: `系列開發會議紀錄-${files.length + 1}.pdf`,
      kind: "會議紀錄",
      owner: "商品企劃",
    };
    setFiles((rows) => [file, ...rows]);
    setLogs((rows) => [`已上傳 ${file.name} 到雲端檔案庫。`, ...rows]);
  }

  function generateAiSummary() {
    const riskStyle = styles.find((style) => style.stage === "試穿修正") ?? styles[0];
    const riskMaterial = materials.find((material) => material.status === "需替代" || material.status === "待詢價");
    setAiSummary(
      `本系列共有 ${styles.length} 個款式，${totals.riskyMaterials} 個物料需追蹤。建議優先處理「${riskStyle.name}」與「${riskMaterial?.name ?? "待詢價物料"}」，並在本週完成成本與試穿確認。`,
    );
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision logo" />
        <div className="metric"><span>系列款式</span><strong>{styles.length}</strong></div>
        <div className="metric"><span>可量產款式</span><strong>{totals.launchReady}</strong></div>
        <div className="metric"><span>平均目標成本</span><strong>{money(totals.avgCost)}</strong></div>
        <div className="metric"><span>雲端檔案</span><strong>{totals.filesCount}</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>系列企劃</span>
              <h3>新增款式資料</h3>
            </div>
          </div>
          <form className="input-grid" onSubmit={addStyle}>
            <input name="code" required placeholder="款式編號" aria-label="款式編號" />
            <input name="name" required placeholder="款式名稱" aria-label="款式名稱" />
            <input name="category" required placeholder="品類" aria-label="品類" />
            <input name="owner" required placeholder="負責人" aria-label="負責人" />
            <input name="targetCost" required type="number" min="1" placeholder="目標成本" aria-label="目標成本" />
            <button type="submit">新增款式</button>
          </form>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <div>
              <span>Jvision AI</span>
              <h3>系列上市摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button type="button" onClick={generateAiSummary}>生成 AI 摘要</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>款式開發看板</span>
              <h3>即時產品監控</h3>
            </div>
          </div>
          <div className="style-grid">
            {styles.map((style) => (
              <article key={style.id}>
                <strong>{style.code}</strong>
                <h4>{style.name}</h4>
                <span>{style.category} · {style.owner} · {money(style.targetCost)}</span>
                <select value={style.stage} aria-label={`${style.name} 階段`} onChange={(event) => updateStage(style.id, event.target.value as StyleStage)}>
                  {styleStages.map((stage) => <option key={stage}>{stage}</option>)}
                </select>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>物料與成本</span>
              <h3>BOM 物料追蹤</h3>
            </div>
          </div>
          <div className="material-list">
            {materials.map((material) => (
              <article key={material.id}>
                <div>
                  <strong>{material.name}</strong>
                  <span>{material.styleCode} · {material.supplier} · {money(material.cost)}</span>
                </div>
                <select value={material.status} aria-label={`${material.name} 狀態`} onChange={(event) => updateMaterial(material.id, event.target.value as MaterialStatus)}>
                  {materialStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>雲端檔案</span>
              <h3>技術包與開發文件</h3>
            </div>
            <button className="soft-button" type="button" onClick={uploadFile}>上傳文件</button>
          </div>
          <div className="file-list">
            {files.map((file) => (
              <article key={file.id}>
                <strong>{file.name}</strong>
                <span>{file.kind} · {file.owner}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>操作紀錄</span>
              <h3>跨部門同步狀態</h3>
            </div>
          </div>
          <div className="log-list">
            {logs.slice(0, 6).map((log, index) => <p key={`${log}-${index}`}>{log}</p>)}
          </div>
        </section>
      </div>
    </div>
  );
}
