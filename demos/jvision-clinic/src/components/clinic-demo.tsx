"use client";

import { FormEvent, useMemo, useState } from "react";

type Patient = {
  id: number;
  name: string;
  time: string;
  doctor: string;
  status: "已預約" | "候診中" | "看診中" | "待收款" | "完成";
};

const initialPatients: Patient[] = [
  { id: 1, name: "陳小姐", time: "09:30", doctor: "林醫師", status: "候診中" },
  { id: 2, name: "王先生", time: "10:00", doctor: "張醫師", status: "看診中" },
  { id: 3, name: "李小弟", time: "10:30", doctor: "林醫師", status: "已預約" }
];

const supplies = [
  { name: "檢查手套", stock: 18, min: 30 },
  { name: "酒精棉片", stock: 42, min: 40 },
  { name: "口罩", stock: 26, min: 35 }
];

export function ClinicDemo() {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [notes, setNotes] = useState(["陳小姐：主訴牙齦不適，安排回診追蹤。"]);
  const [shifts, setShifts] = useState(["林醫師 09:00-12:00、護理師 A 09:00-13:00"]);
  const [inventory, setInventory] = useState(supplies);
  const [payments, setPayments] = useState(["王先生 掛號費 NT$150 已收款"]);

  const kpis = useMemo(() => {
    const waiting = patients.filter((p) => p.status === "候診中").length;
    const active = patients.filter((p) => p.status === "看診中").length;
    const lowStock = inventory.filter((item) => item.stock < item.min).length;
    return { waiting, active, lowStock, visits: patients.length };
  }, [inventory, patients]);

  function addAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPatients((current) => [{
      id: Math.floor(Math.random() * 9000) + 100,
      name: String(form.get("name")),
      time: String(form.get("time")),
      doctor: String(form.get("doctor")),
      status: "已預約"
    }, ...current]);
    event.currentTarget.reset();
  }

  function updateStatus(id: number, status: Patient["status"]) {
    setPatients((current) => current.map((p) => p.id === id ? { ...p, status } : p));
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setNotes((current) => [`${form.get("patient")}：${form.get("summary")}`, ...current].slice(0, 5));
    event.currentTarget.reset();
  }

  return (
    <div className="clinic-demo">
      <aside className="clinic-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="assistant-card">
          <span>AI 數位助理</span>
          <strong>{kpis.lowStock + kpis.waiting} 件待辦</strong>
          <p>候診 {kpis.waiting} · 看診中 {kpis.active} · 低庫存 {kpis.lowStock}</p>
          <button type="button" onClick={() => setShifts((rows) => [`${new Date().toLocaleTimeString("zh-TW")} AI 建議增派櫃台支援`, ...rows])}>產生營運建議</button>
        </div>
        <div className="metric-stack">
          <div><span>今日人次</span><strong>{kpis.visits}</strong></div>
          <div><span>待收款</span><strong>{patients.filter((p) => p.status === "待收款").length}</strong></div>
        </div>
      </aside>

      <div className="clinic-workspace">
        <section className="demo-panel">
          <div className="panel-heading"><h3>預約與候診</h3><span>Front Desk</span></div>
          <form className="clinic-form" onSubmit={addAppointment}>
            <input name="name" required placeholder="患者姓名" aria-label="患者姓名" />
            <input name="time" required placeholder="11:00" aria-label="預約時間" />
            <input name="doctor" required placeholder="醫師" aria-label="醫師" />
            <button type="submit">新增預約</button>
          </form>
          <div className="patient-list">
            {patients.map((patient) => (
              <article className="patient-card" key={patient.id}>
                <div><strong>{patient.time} {patient.name}</strong><p>{patient.doctor} · {patient.status}</p></div>
                <div className="status-actions">
                  {(["候診中", "看診中", "待收款", "完成"] as Patient["status"][]).map((status) => (
                    <button key={status} type="button" disabled={patient.status === status} onClick={() => updateStatus(patient.id, status)}>{status}</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>病歷摘要與回診</h3><span>Chart Summary</span></div>
          <form className="clinic-form note-form" onSubmit={addNote}>
            <input name="patient" required placeholder="患者姓名" aria-label="病歷患者" />
            <input name="summary" required placeholder="摘要與回診計畫" aria-label="摘要" />
            <button type="submit">建立摘要</button>
          </form>
          <div className="tag-list">{notes.map((note) => <span key={note}>{note}</span>)}</div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>排班薪資</h3><span>HR</span></div>
          <form className="clinic-form note-form" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setShifts((rows) => [`${form.get("role")} ${form.get("hours")} 小時，估算薪資 NT$ ${Number(form.get("hours")) * 260}`, ...rows]);
            event.currentTarget.reset();
          }}>
            <input name="role" required placeholder="角色 / 人員" aria-label="角色" />
            <input name="hours" required type="number" min="1" placeholder="工時" aria-label="工時" />
            <button type="submit">新增班表</button>
          </form>
          <div className="tag-list">{shifts.map((shift) => <span key={shift}>{shift}</span>)}</div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>倉管耗材</h3><span>Inventory</span></div>
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
          <div className="panel-heading"><h3>財務與營運儀表板</h3><span>營運總覽</span></div>
          <div className="metric-grid">
            <div><span>今日人次</span><strong>{kpis.visits}</strong></div>
            <div><span>候診中</span><strong>{kpis.waiting}</strong></div>
            <div><span>低庫存</span><strong>{kpis.lowStock}</strong></div>
            <div><span>收款紀錄</span><strong>{payments.length}</strong></div>
          </div>
          <button className="primary-action" type="button" onClick={() => setPayments((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 療程費 NT$1200 已收款`, ...rows])}>新增收款</button>
          <div className="tag-list">{payments.map((payment) => <span key={payment}>{payment}</span>)}</div>
        </section>
      </div>
    </div>
  );
}
