"use client";

import { FormEvent, useMemo, useState } from "react";

type Elder = {
  id: number;
  name: string;
  bed: string;
  level: string;
  risk: "一般" | "跌倒風險" | "壓傷風險" | "需追蹤";
};

const initialElders: Elder[] = [
  { id: 1, name: "林美玉", bed: "A-203", level: "中度照護", risk: "跌倒風險" },
  { id: 2, name: "陳國雄", bed: "B-110", level: "輕度照護", risk: "壓傷風險" },
  { id: 3, name: "張秀蘭", bed: "A-118", level: "重度照護", risk: "一般" }
];

const supplies = [
  { name: "成人紙尿褲", stock: 24, min: 40 },
  { name: "照護手套", stock: 18, min: 30 },
  { name: "管灌營養品", stock: 36, min: 28 }
];

export function EcareDemo() {
  const [elders, setElders] = useState<Elder[]>(initialElders);
  const [records, setRecords] = useState(["林美玉 08:00 血壓 128/76，已完成晨間照護"]);
  const [shifts, setShifts] = useState(["早班：護理 2、照服員 8、待追蹤 1"]);
  const [inventory, setInventory] = useState(supplies);
  const [billing, setBilling] = useState(["陳國雄 月照護費 NT$ 38,000 已入帳"]);

  const kpis = useMemo(() => {
    const risks = elders.filter((elder) => elder.risk !== "一般").length;
    const lowStock = inventory.filter((item) => item.stock < item.min).length;
    return { elders: elders.length, risks, lowStock, bills: billing.length };
  }, [billing.length, inventory, elders]);

  function addElder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setElders((current) => [{
      id: Math.floor(Math.random() * 9000) + 100,
      name: String(form.get("name")),
      bed: String(form.get("bed")),
      level: String(form.get("level")),
      risk: "需追蹤"
    }, ...current]);
    event.currentTarget.reset();
  }

  function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setRecords((current) => [`${form.get("elder")} ${form.get("record")}`, ...current].slice(0, 6));
    event.currentTarget.reset();
  }

  function setRisk(id: number, risk: Elder["risk"]) {
    setElders((current) => current.map((elder) => elder.id === id ? { ...elder, risk } : elder));
  }

  return (
    <div className="clinic-demo">
      <aside className="clinic-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="assistant-card">
          <span>照護營運提醒</span>
          <strong>{kpis.risks + kpis.lowStock} 項待處理</strong>
          <p>長者 {kpis.elders} · 高風險 {kpis.risks} · 低庫存 {kpis.lowStock}</p>
          <button type="button" onClick={() => setShifts((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 新增交班提醒：家屬回覆追蹤`, ...rows])}>新增交班提醒</button>
        </div>
        <div className="metric-stack">
          <div><span>入住長者</span><strong>{kpis.elders}</strong></div>
          <div><span>帳務筆數</span><strong>{kpis.bills}</strong></div>
        </div>
      </aside>

      <div className="clinic-workspace">
        <section className="demo-panel">
          <div className="panel-heading"><h3>長者與床位</h3><span>Elder</span></div>
          <form className="clinic-form" onSubmit={addElder}>
            <input name="name" required placeholder="長者姓名" aria-label="長者姓名" />
            <input name="bed" required placeholder="床號" aria-label="床號" />
            <input name="level" required placeholder="照護等級" aria-label="照護等級" />
            <button type="submit">新增長者</button>
          </form>
          <div className="patient-list">
            {elders.map((elder) => (
              <article className="patient-card" key={elder.id}>
                <div><strong>{elder.bed} {elder.name}</strong><p>{elder.level} · {elder.risk}</p></div>
                <div className="status-actions">
                  {(["一般", "跌倒風險", "壓傷風險", "需追蹤"] as Elder["risk"][]).map((risk) => (
                    <button key={risk} type="button" disabled={elder.risk === risk} onClick={() => setRisk(elder.id, risk)}>{risk}</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>照護紀錄與交班</h3><span>Care Notes</span></div>
          <form className="clinic-form note-form" onSubmit={addRecord}>
            <input name="elder" required placeholder="長者姓名" aria-label="紀錄長者" />
            <input name="record" required placeholder="生命徵象 / 用藥 / 飲食 / 交班" aria-label="照護紀錄" />
            <button type="submit">新增紀錄</button>
          </form>
          <div className="tag-list">{records.map((record) => <span key={record}>{record}</span>)}</div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>班表與人力</h3><span>Staffing</span></div>
          <form className="clinic-form note-form" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setShifts((rows) => [`${form.get("shift")}：${form.get("staff")}，床位 ${form.get("beds")}`, ...rows]);
            event.currentTarget.reset();
          }}>
            <input name="shift" required placeholder="班別" aria-label="班別" />
            <input name="staff" required placeholder="人員配置" aria-label="人員配置" />
            <input name="beds" required type="number" min="1" placeholder="床位數" aria-label="床位數" />
            <button type="submit">新增班表</button>
          </form>
          <div className="tag-list">{shifts.map((shift) => <span key={shift}>{shift}</span>)}</div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>耗材庫存</h3><span>Supplies</span></div>
          <div className="supply-list">
            {inventory.map((item) => (
              <div className="supply-row" key={item.name}>
                <span>{item.name}</span>
                <strong>{item.stock}</strong>
                <button type="button" onClick={() => setInventory((rows) => rows.map((row) => row.name === item.name ? { ...row, stock: row.stock + 20 } : row))}>補貨</button>
              </div>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading"><h3>帳務與營運指標</h3><span>營運總覽</span></div>
          <div className="metric-grid">
            <div><span>長者數</span><strong>{kpis.elders}</strong></div>
            <div><span>高風險</span><strong>{kpis.risks}</strong></div>
            <div><span>低庫存</span><strong>{kpis.lowStock}</strong></div>
            <div><span>帳務</span><strong>{kpis.bills}</strong></div>
          </div>
          <button className="primary-action" type="button" onClick={() => setBilling((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 照護加購服務 NT$ 4,800 已入帳`, ...rows])}>新增帳務</button>
          <div className="tag-list">{billing.map((bill) => <span key={bill}>{bill}</span>)}</div>
        </section>
      </div>
    </div>
  );
}
