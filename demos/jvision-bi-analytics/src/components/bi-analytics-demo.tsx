"use client";

import { FormEvent, useMemo, useState } from "react";

type Dataset = { id: number; name: string; source: string; rows: number; status: "已連線" | "刷新中" | "需治理" };
type Metric = { id: number; name: string; value: number; trend: number };
type Report = { id: number; title: string; status: "草稿" | "已發布" | "已分享" };

const datasetStatuses: Dataset["status"][] = ["已連線", "刷新中", "需治理"];

export function BiAnalyticsDemo() {
  const [datasets, setDatasets] = useState<Dataset[]>([
    { id: 1, name: "銷售訂單資料集", source: "ERP", rows: 128400, status: "已連線" },
    { id: 2, name: "CRM 商機資料集", source: "CRM", rows: 42800, status: "已連線" },
  ]);
  const [metrics, setMetrics] = useState<Metric[]>([
    { id: 1, name: "營收", value: 18200000, trend: 18 },
    { id: 2, name: "毛利率", value: 38, trend: 5 },
    { id: 3, name: "轉換率", value: 12, trend: -2 },
  ]);
  const [reports, setReports] = useState<Report[]>([
    { id: 1, title: "本月營收儀表板", status: "已發布" },
  ]);
  const [answers, setAnswers] = useState(["AI 洞察：華北區營收成長 24%，主要來自企業方案續約。"]);
  const [governance, setGovernance] = useState(["治理紀錄：已審核銷售資料集的敏感欄位權限"]);
  const [shares, setShares] = useState(["分享紀錄：管理週會已嵌入本月營收儀表板"]);

  const kpis = useMemo(() => {
    const totalRows = datasets.reduce((sum, dataset) => sum + dataset.rows, 0);
    const published = reports.filter((report) => report.status !== "草稿").length;
    const alerts = datasets.filter((dataset) => dataset.status === "需治理").length;
    const revenue = metrics.find((metric) => metric.name === "營收")?.value ?? 0;
    return { totalRows, published, alerts, revenue };
  }, [datasets, metrics, reports]);

  function addDataset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setDatasets((rows) => [
      {
        id: Date.now(),
        name: String(form.get("name")),
        source: String(form.get("source")),
        rows: Number(form.get("rows")),
        status: "刷新中",
      },
      ...rows,
    ]);
    event.currentTarget.reset();
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>分析總覽</span>
          <strong>NT$ {kpis.revenue.toLocaleString("zh-TW")}</strong>
          <p>
            資料列 {kpis.totalRows.toLocaleString("zh-TW")}，已發布報表 {kpis.published}，治理警示 {kpis.alerts}
          </p>
          <button type="button" onClick={() => setAnswers((rows) => [`${new Date().toLocaleTimeString("zh-TW")} AI 洞察：新增資料集帶來 12% 成長機會`, ...rows])}>
            詢問 AI
          </button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>資料集與語意模型</h3>
            <span>Datasets</span>
          </div>
          <form className="property-form" onSubmit={addDataset}>
            <input name="name" required placeholder="資料集名稱" aria-label="資料集名稱" />
            <input name="source" required placeholder="資料來源" aria-label="資料來源" />
            <input name="rows" required type="number" min="1" placeholder="資料列數" aria-label="資料列數" />
            <button type="submit">匯入資料集</button>
          </form>
          <div className="unit-list">
            {datasets.map((dataset) => (
              <article className="unit-card" key={dataset.id}>
                <div>
                  <strong>{dataset.name}</strong>
                  <p>
                    {dataset.source} · {dataset.rows.toLocaleString("zh-TW")} rows · {dataset.status}
                  </p>
                </div>
                <div className="status-actions">
                  {datasetStatuses.map((status) => (
                    <button
                      key={status}
                      disabled={dataset.status === status}
                      onClick={() => setDatasets((rows) => rows.map((row) => (row.id === dataset.id ? { ...row, status } : row)))}
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
            <h3>KPI 與報表</h3>
            <span>Reports</span>
          </div>
          <div className="status-actions">
            <button type="button" onClick={() => setMetrics((rows) => rows.map((row) => (row.name === "營收" ? { ...row, value: row.value + 960000, trend: row.trend + 1 } : row)))}>更新指標</button>
            <button type="button" onClick={() => setReports((rows) => [{ id: Date.now(), title: "測試營運分析報表", status: "草稿" }, ...rows])}>產生報表</button>
            <button type="button" onClick={() => setReports((rows) => rows.map((row, index) => (index === 0 ? { ...row, status: "已發布" } : row)))}>發布報表</button>
            <button type="button" onClick={() => setShares((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 分享連結已建立`, ...rows])}>分享報表</button>
          </div>
          <div className="tag-list">
            {[...metrics.map((metric) => `${metric.name}：${metric.value.toLocaleString("zh-TW")} / 趨勢 ${metric.trend}%`), ...reports.map((report) => `${report.title} · ${report.status}`)].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>AI 洞察</h3>
            <span>Copilot</span>
          </div>
          <button className="primary-action" type="button" onClick={() => setAnswers((rows) => [`${new Date().toLocaleTimeString("zh-TW")} AI 摘要：庫存週轉下降，建議檢查高庫齡品項`, ...rows])}>
            產生摘要
          </button>
          <div className="tag-list">
            {answers.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>治理與分享</h3>
            <span>Governance</span>
          </div>
          <button className="primary-action" type="button" onClick={() => setGovernance((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 新增治理紀錄：財務資料集權限已審核`, ...rows])}>
            建立治理紀錄
          </button>
          <div className="tag-list">
            {[...governance, ...shares].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>視覺化分析</h3>
            <span>Dashboard</span>
          </div>
          <div className="metric-grid">
            <div><span>營收</span><strong>NT$ {kpis.revenue.toLocaleString("zh-TW")}</strong></div>
            <div><span>資料列</span><strong>{kpis.totalRows.toLocaleString("zh-TW")}</strong></div>
            <div><span>已發布報表</span><strong>{kpis.published}</strong></div>
            <div><span>治理警示</span><strong>{kpis.alerts}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
