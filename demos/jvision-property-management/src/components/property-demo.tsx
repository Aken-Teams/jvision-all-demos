"use client";

import { FormEvent, useMemo, useState } from "react";

type Unit = { id: number; name: string; rent: number; status: "空置" | "出租中" | "待簽約" };
type Repair = { id: number; unit: string; issue: string; status: "待派工" | "處理中" | "已完成" };

const initialUnits: Unit[] = [
  { id: 1, name: "信義 A 棟 5F-2", rent: 32000, status: "出租中" },
  { id: 2, name: "中山套房 301", rent: 18500, status: "待簽約" },
  { id: 3, name: "板橋電梯兩房 8B", rent: 28000, status: "空置" }
];

export function PropertyDemo() {
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [repairs, setRepairs] = useState<Repair[]>([{ id: 1, unit: "信義 A 棟 5F-2", issue: "冷氣漏水", status: "待派工" }]);
  const [bills, setBills] = useState(["信義 A 棟 5F-2 六月租金 NT$ 32,000 已收款"]);
  const [contracts, setContracts] = useState(["中山套房 301 合約已送出線上簽署"]);
  const [inspection, setInspection] = useState(["AI 現況：牆面正常、地板輕微刮痕、水電可用。"]);

  const kpis = useMemo(() => {
    const rented = units.filter((u) => u.status === "出租中").length;
    const rent = units.filter((u) => u.status === "出租中").reduce((sum, u) => sum + u.rent, 0);
    return { rented, vacancy: units.length - rented, rent, repairs: repairs.filter((r) => r.status !== "已完成").length };
  }, [repairs, units]);

  function addUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setUnits((rows) => [{ id: Math.random(), name: String(form.get("name")), rent: Number(form.get("rent")), status: "空置" }, ...rows]);
    event.currentTarget.reset();
  }

  function addRepair(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setRepairs((rows) => [{ id: Math.random(), unit: String(form.get("unit")), issue: String(form.get("issue")), status: "待派工" }, ...rows]);
    event.currentTarget.reset();
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>租務營運中心</span>
          <strong>NT$ {kpis.rent.toLocaleString("zh-TW")}</strong>
          <p>出租 {kpis.rented} · 空置 {kpis.vacancy} · 未結修繕 {kpis.repairs}</p>
          <button type="button" onClick={() => setInspection((rows) => [`${new Date().toLocaleTimeString("zh-TW")} AI 現況：門鎖正常、浴室排水需追蹤、窗框良好。`, ...rows])}>生成 AI 現況</button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading"><h3>房源列表</h3><span>Units</span></div>
          <form className="property-form" onSubmit={addUnit}>
            <input name="name" required placeholder="房源名稱" aria-label="房源名稱" />
            <input name="rent" required type="number" min="1" placeholder="月租金" aria-label="月租金" />
            <button type="submit">新增房源</button>
          </form>
          <div className="unit-list">
            {units.map((unit) => (
              <article className="unit-card" key={unit.id}>
                <div><strong>{unit.name}</strong><p>NT$ {unit.rent.toLocaleString("zh-TW")} · {unit.status}</p></div>
                <div className="status-actions">
                  {(["空置", "待簽約", "出租中"] as Unit["status"][]).map((status) => (
                    <button key={status} disabled={unit.status === status} onClick={() => setUnits((rows) => rows.map((row) => row.id === unit.id ? { ...row, status } : row))}>{status}</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>租約與線上簽署</h3><span>Contract</span></div>
          <button className="primary-action" type="button" onClick={() => setContracts((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 合約模板已產生並送簽`, ...rows])}>產生合約並送簽</button>
          <div className="tag-list">{contracts.map((row) => <span key={row}>{row}</span>)}</div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>修繕管理</h3><span>Maintenance</span></div>
          <form className="property-form" onSubmit={addRepair}>
            <input name="unit" required placeholder="房源" aria-label="修繕房源" />
            <input name="issue" required placeholder="修繕問題" aria-label="修繕問題" />
            <button type="submit">建立報修</button>
          </form>
          <div className="unit-list">
            {repairs.map((repair) => (
              <article className="unit-card" key={repair.id}>
                <div><strong>{repair.unit}</strong><p>{repair.issue} · {repair.status}</p></div>
                <div className="status-actions">
                  {(["待派工", "處理中", "已完成"] as Repair["status"][]).map((status) => (
                    <button key={status} disabled={repair.status === status} onClick={() => setRepairs((rows) => rows.map((row) => row.id === repair.id ? { ...row, status } : row))}>{status}</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>帳單與租金對帳</h3><span>Billing</span></div>
          <button className="primary-action" type="button" onClick={() => setBills((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 水電雜費 NT$ 1,860 已入帳`, ...rows])}>新增收款</button>
          <div className="tag-list">{bills.map((row) => <span key={row}>{row}</span>)}</div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading"><h3>點交與 AI 現況</h3><span>Inspection</span></div>
          <div className="metric-grid">
            <div><span>月租金</span><strong>NT$ {kpis.rent.toLocaleString("zh-TW")}</strong></div>
            <div><span>出租</span><strong>{kpis.rented}</strong></div>
            <div><span>空置</span><strong>{kpis.vacancy}</strong></div>
            <div><span>未結修繕</span><strong>{kpis.repairs}</strong></div>
          </div>
          <div className="tag-list">{inspection.map((row) => <span key={row}>{row}</span>)}</div>
        </section>
      </div>
    </div>
  );
}
