"use client";

import { FormEvent, useMemo, useState } from "react";

type SupplierStatus = "合格" | "觀察" | "改善中";
type Supplier = {
  id: number;
  name: string;
  category: string;
  score: number;
  delivery: number;
  defect: number;
  status: SupplierStatus;
};
type IncomingLot = {
  id: number;
  lot: string;
  supplier: string;
  material: string;
  qty: number;
  result: "待檢" | "合格" | "退回" | "MRB";
};
type DocumentItem = {
  id: number;
  supplier: string;
  name: string;
  daysLeft: number;
  status: "有效" | "即將到期" | "缺件";
};
type AuditItem = {
  id: number;
  supplier: string;
  date: string;
  scope: string;
  status: "已排程" | "待改善" | "完成";
};

const statusOptions: SupplierStatus[] = ["合格", "觀察", "改善中"];
const resultOptions: IncomingLot["result"][] = ["待檢", "合格", "退回", "MRB"];

export function SqmDemo() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: 1, name: "宏達精密", category: "金屬件", score: 94, delivery: 98, defect: 0.8, status: "合格" },
    { id: 2, name: "東辰電子", category: "PCB", score: 86, delivery: 93, defect: 1.9, status: "觀察" },
    { id: 3, name: "新曜材料", category: "塑膠件", score: 78, delivery: 88, defect: 3.6, status: "改善中" },
  ]);
  const [lots, setLots] = useState<IncomingLot[]>([
    { id: 1, lot: "IQC-240701-001", supplier: "宏達精密", material: "外殼 A12", qty: 1200, result: "合格" },
    { id: 2, lot: "IQC-240701-002", supplier: "東辰電子", material: "控制板 B8", qty: 460, result: "待檢" },
  ]);
  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: 1, supplier: "東辰電子", name: "RoHS 證明", daysLeft: 12, status: "即將到期" },
    { id: 2, supplier: "新曜材料", name: "材料承認書", daysLeft: 0, status: "缺件" },
    { id: 3, supplier: "宏達精密", name: "COA 出貨報告", daysLeft: 90, status: "有效" },
  ]);
  const [audits, setAudits] = useState<AuditItem[]>([
    { id: 1, supplier: "新曜材料", date: "2026-07-12", scope: "製程與出貨檢驗", status: "待改善" },
  ]);
  const [logs, setLogs] = useState<string[]>(["系統已同步 3 家供應商評分與 2 筆進料檢驗。"]);

  const kpis = useMemo(() => {
    const avgScore = Math.round((suppliers.reduce((sum, row) => sum + row.score, 0) / suppliers.length) * 10) / 10;
    const passLots = lots.filter((row) => row.result === "合格").length;
    const pendingLots = lots.filter((row) => row.result === "待檢" || row.result === "MRB").length;
    const riskDocs = documents.filter((row) => row.status !== "有效").length;
    const improving = suppliers.filter((row) => row.status === "改善中").length;
    return { avgScore, passLots, pendingLots, riskDocs, improving };
  }, [documents, lots, suppliers]);

  function addSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const category = String(form.get("category"));
    setSuppliers((rows) => [
      {
        id: Date.now(),
        name,
        category,
        score: Number(form.get("score")),
        delivery: Number(form.get("delivery")),
        defect: Number(form.get("defect")),
        status: "觀察",
      },
      ...rows,
    ]);
    setLogs((rows) => [`新增供應商 ${name}，已列入觀察名單。`, ...rows]);
    event.currentTarget.reset();
  }

  function addLot() {
    const supplier = suppliers[0]?.name || "新供應商";
    const id = Date.now();
    setLots((rows) => [
      { id, lot: `IQC-${String(id).slice(-6)}`, supplier, material: "關鍵零組件", qty: 300, result: "待檢" },
      ...rows,
    ]);
    setLogs((rows) => [`新增 ${supplier} 進料批次，等待 IQC 檢驗。`, ...rows]);
  }

  function requestDocument() {
    const supplier = suppliers.find((row) => row.status !== "合格")?.name || suppliers[0].name;
    setDocuments((rows) => [
      { id: Date.now(), supplier, name: "供應商改善報告", daysLeft: 7, status: "即將到期" },
      ...rows,
    ]);
    setLogs((rows) => [`已通知 ${supplier} 補交供應商改善報告。`, ...rows]);
  }

  function scheduleAudit() {
    const supplier = suppliers.find((row) => row.status === "改善中")?.name || suppliers[0].name;
    setAudits((rows) => [
      { id: Date.now(), supplier, date: "2026-07-24", scope: "品質系統與文件稽核", status: "已排程" },
      ...rows,
    ]);
    setLogs((rows) => [`已安排 ${supplier} 品質系統稽核。`, ...rows]);
  }

  return (
    <div className="sqm-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>供應商品質總覽</span>
          <strong>{kpis.avgScore} 分</strong>
          <p>
            {suppliers.length} 家供應商，{kpis.pendingLots} 批待處理，{kpis.riskDocs} 件文件需追蹤。
          </p>
          <button type="button" onClick={() => setLogs((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 已產生主管品質週報。`, ...rows])}>
            產生週報
          </button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel supplier-panel">
          <div className="panel-heading">
            <h3>供應商資料</h3>
            <span>評分與狀態</span>
          </div>
          <form className="supplier-form" onSubmit={addSupplier}>
            <input name="name" required placeholder="供應商名稱" aria-label="供應商名稱" />
            <input name="category" required placeholder="供應品類" aria-label="供應品類" />
            <input name="score" required type="number" min="1" max="100" placeholder="品質分數" aria-label="品質分數" />
            <input name="delivery" required type="number" min="1" max="100" placeholder="交付率" aria-label="交付率" />
            <input name="defect" required type="number" min="0" step="0.1" placeholder="不良率 %" aria-label="不良率" />
            <button type="submit">新增</button>
          </form>
          <div className="record-list">
            {suppliers.map((supplier) => (
              <article className="record-card" key={supplier.id}>
                <div>
                  <strong>{supplier.name}</strong>
                  <p>
                    {supplier.category} · 品質 {supplier.score} 分 · 交付 {supplier.delivery}% · 不良 {supplier.defect}%
                  </p>
                </div>
                <div className="status-actions">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      disabled={supplier.status === status}
                      onClick={() => {
                        setSuppliers((rows) => rows.map((row) => (row.id === supplier.id ? { ...row, status } : row)));
                        setLogs((rows) => [`${supplier.name} 狀態更新為 ${status}。`, ...rows]);
                      }}
                      type="button"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>IQC 進料檢驗</h3>
            <span>批次判定</span>
          </div>
          <button className="primary-action" type="button" onClick={addLot}>
            新增待檢批次
          </button>
          <div className="record-list compact">
            {lots.map((lot) => (
              <article className="record-card" key={lot.id}>
                <div>
                  <strong>{lot.lot}</strong>
                  <p>
                    {lot.supplier} · {lot.material} · {lot.qty.toLocaleString("zh-TW")} pcs · {lot.result}
                  </p>
                </div>
                <div className="status-actions">
                  {resultOptions.map((result) => (
                    <button
                      key={result}
                      disabled={lot.result === result}
                      onClick={() => {
                        setLots((rows) => rows.map((row) => (row.id === lot.id ? { ...row, result } : row)));
                        setLogs((rows) => [`${lot.lot} 檢驗結果更新為 ${result}。`, ...rows]);
                      }}
                      type="button"
                    >
                      {result}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>文件與綠色資料</h3>
            <span>到期追蹤</span>
          </div>
          <button className="primary-action" type="button" onClick={requestDocument}>
            通知補件
          </button>
          <div className="tag-list">
            {documents.map((doc) => (
              <span key={doc.id}>
                {doc.supplier} · {doc.name} · {doc.status}
                {doc.daysLeft > 0 ? ` · ${doc.daysLeft} 天` : ""}
              </span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>稽核與改善</h3>
            <span>CAPA 追蹤</span>
          </div>
          <button className="primary-action" type="button" onClick={scheduleAudit}>
            安排稽核
          </button>
          <div className="tag-list">
            {audits.map((audit) => (
              <span key={audit.id}>
                {audit.date} · {audit.supplier} · {audit.scope} · {audit.status}
              </span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>管理儀表板</h3>
            <span>即時指標</span>
          </div>
          <div className="metric-grid">
            <div>
              <span>平均品質分數</span>
              <strong>{kpis.avgScore}</strong>
            </div>
            <div>
              <span>合格批次</span>
              <strong>{kpis.passLots}</strong>
            </div>
            <div>
              <span>待處理批次</span>
              <strong>{kpis.pendingLots}</strong>
            </div>
            <div>
              <span>改善中供應商</span>
              <strong>{kpis.improving}</strong>
            </div>
          </div>
          <div className="log-list">
            {logs.slice(0, 5).map((log) => (
              <p key={log}>{log}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
