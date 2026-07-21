"use client";

import { FormEvent, useMemo, useState } from "react";

type Meter = { id: number; name: string; area: string; kw: number; kwh: number; status: "正常" | "告警" | "離線" };
type Alert = { id: number; message: string; level: "提醒" | "警告" | "嚴重" };
type Policy = { id: number; name: string; saving: number; status: "待套用" | "已啟用" };

const statuses: Meter["status"][] = ["正常", "告警", "離線"];

export function EmsDemo() {
  const [meters, setMeters] = useState<Meter[]>([
    { id: 1, name: "A 棟主電表", area: "總務大樓", kw: 168, kwh: 1260, status: "正常" },
    { id: 2, name: "空調迴路 3F", area: "辦公區", kw: 92, kwh: 780, status: "告警" },
    { id: 3, name: "產線照明", area: "工廠一線", kw: 54, kwh: 420, status: "正常" },
  ]);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 1, message: "空調迴路 3F 需量超標 12%", level: "警告" },
  ]);
  const [policies, setPolicies] = useState<Policy[]>([
    { id: 1, name: "午休空調節能模式", saving: 8, status: "已啟用" },
  ]);
  const [reports, setReports] = useState(["能源月報：本月節電 14.8%，預估減碳 18.6 公噸 CO2e"]);
  const [carbonLogs, setCarbonLogs] = useState(["碳排試算：今日用電約 2.46 公噸 CO2e"]);

  const kpis = useMemo(() => {
    const kw = meters.reduce((sum, meter) => sum + meter.kw, 0);
    const kwh = meters.reduce((sum, meter) => sum + meter.kwh, 0);
    const carbonKg = Math.round(kwh * 0.494 * 100) / 100;
    const carbonTon = Math.round((carbonKg / 1000) * 100) / 100;
    const warning = meters.filter((meter) => meter.status !== "正常").length;
    return { kw, kwh, carbonKg, carbonTon, warning };
  }, [meters]);

  function addMeter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMeters((rows) => [
      {
        id: Date.now(),
        name: String(form.get("name")),
        area: String(form.get("area")),
        kw: Number(form.get("kw")),
        kwh: Number(form.get("kwh")),
        status: "正常",
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
          <span>能源總覽</span>
          <strong>{kpis.kw.toLocaleString("zh-TW")} kW</strong>
          <p>
            今日累計 {kpis.kwh.toLocaleString("zh-TW")} 度，約 {kpis.carbonTon.toLocaleString("zh-TW")} 公噸 CO2e，異常 {kpis.warning} 件
          </p>
          <button type="button" onClick={() => setReports((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 能源報表已產生`, ...rows])}>
            產生報表
          </button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>智慧電表</h3>
            <span>用電讀值</span>
          </div>
          <form className="property-form" onSubmit={addMeter}>
            <input name="name" required placeholder="電表名稱" aria-label="電表名稱" />
            <input name="area" required placeholder="場域" aria-label="場域" />
            <input name="kw" required type="number" min="1" placeholder="目前用電(kW)" aria-label="即時功率" />
            <input name="kwh" required type="number" min="1" placeholder="今日累計(度)" aria-label="累計電量" />
            <button type="submit">新增電表</button>
          </form>
          <div className="unit-list">
            {meters.map((meter) => (
              <article className="unit-card" key={meter.id}>
                <div>
                  <strong>{meter.name}</strong>
                  <p>
                    {meter.area} · 目前 {meter.kw} kW · 今日 {meter.kwh} 度 · {meter.status}
                  </p>
                </div>
                <div className="status-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      disabled={meter.status === status}
                      onClick={() => setMeters((rows) => rows.map((row) => (row.id === meter.id ? { ...row, status } : row)))}
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
            <h3>告警與節能策略</h3>
            <span>提醒與控制</span>
          </div>
          <div className="status-actions">
            <button type="button" onClick={() => setAlerts((rows) => [{ id: Date.now(), message: "測試需量超標告警", level: "嚴重" }, ...rows])}>建立告警</button>
            <button type="button" onClick={() => setPolicies((rows) => [{ id: Date.now(), name: "測試節能策略", saving: 12, status: "待套用" }, ...rows])}>新增策略</button>
            <button type="button" onClick={() => setPolicies((rows) => rows.map((row, index) => (index === 0 ? { ...row, status: "已啟用" } : row)))}>啟用策略</button>
            <button type="button" onClick={() => setCarbonLogs((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 碳排計算已更新：約 ${kpis.carbonTon.toLocaleString("zh-TW")} 公噸 CO2e`, ...rows])}>計算碳排</button>
          </div>
          <div className="tag-list">
            {[...alerts.map((row) => `${row.level} · ${row.message}`), ...policies.map((row) => `${row.name} · 節電 ${row.saving}% · ${row.status}`)].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>碳排與報表</h3>
            <span>減碳紀錄</span>
          </div>
          <button className="primary-action" type="button" onClick={() => setReports((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 節電比較報表：尖峰降低 9%`, ...rows])}>
            產生節電比較
          </button>
          <div className="tag-list">
            {[...carbonLogs, ...reports].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>能源分析</h3>
            <span>管理指標</span>
          </div>
          <div className="metric-grid">
            <div><span>目前總用電</span><strong>{kpis.kw.toLocaleString("zh-TW")} kW</strong></div>
            <div><span>今日累計用電</span><strong>{kpis.kwh.toLocaleString("zh-TW")} 度</strong></div>
            <div><span>碳排估算</span><strong>{kpis.carbonTon.toLocaleString("zh-TW")} 公噸</strong></div>
            <div><span>異常設備</span><strong>{kpis.warning}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
