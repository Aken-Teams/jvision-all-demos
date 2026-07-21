"use client";

import { FormEvent, useMemo, useState } from "react";

type RepairStatus = "接車" | "維修中" | "待取車" | "已結帳";
type Customer = { id: number; name: string; phone: string; plate: string; model: string; insurance: string };
type Part = { id: number; name: string; stock: number; safe: number; cost: number; price: number };
type Repair = { id: number; plate: string; item: string; part: string; labor: number; status: RepairStatus; paid: boolean };

const statuses: RepairStatus[] = ["接車", "維修中", "待取車", "已結帳"];
const modelOptions = ["Yamaha 勁戰", "SYM DRG", "Kymco Racing", "Honda CB350", "Vespa Sprint"];

export function MotorcycleShopDemo() {
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 1, name: "陳先生", phone: "0912-168-168", plate: "NQA-2088", model: "Yamaha 勁戰", insurance: "2026-08-12" },
    { id: 2, name: "林小姐", phone: "0922-268-268", plate: "BEE-9911", model: "SYM DRG", insurance: "2026-07-18" },
  ]);
  const [parts, setParts] = useState<Part[]>([
    { id: 1, name: "機油 10W40", stock: 12, safe: 8, cost: 180, price: 350 },
    { id: 2, name: "煞車皮", stock: 3, safe: 5, cost: 260, price: 520 },
    { id: 3, name: "空氣濾芯", stock: 7, safe: 6, cost: 150, price: 300 },
  ]);
  const [repairs, setRepairs] = useState<Repair[]>([
    { id: 1, plate: "NQA-2088", item: "定期保養", part: "機油 10W40", labor: 300, status: "待取車", paid: false },
    { id: 2, plate: "BEE-9911", item: "煞車檢修", part: "煞車皮", labor: 500, status: "維修中", paid: false },
  ]);
  const [logs, setLogs] = useState<string[]>(["今日已建立 2 張維修單，1 項零件低於安全庫存。"]);

  const kpis = useMemo(() => {
    const revenue = repairs.reduce((sum, repair) => {
      const part = parts.find((row) => row.name === repair.part);
      return sum + (part?.price || 0) + repair.labor;
    }, 0);
    const cost = repairs.reduce((sum, repair) => sum + (parts.find((row) => row.name === repair.part)?.cost || 0), 0);
    const lowStock = parts.filter((row) => row.stock <= row.safe).length;
    const unpaid = repairs.filter((row) => !row.paid).length;
    return { revenue, gross: revenue - cost, lowStock, unpaid };
  }, [parts, repairs]);

  function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const plate = String(form.get("plate"));
    setCustomers((rows) => [
      {
        id: Date.now(),
        name: String(form.get("name")),
        phone: String(form.get("phone")),
        plate,
        model: String(form.get("model")),
        insurance: String(form.get("insurance")),
      },
      ...rows,
    ]);
    setLogs((rows) => [`新增車籍 ${plate}，可建立維修單。`, ...rows]);
    event.currentTarget.reset();
  }

  function addRepair() {
    const customer = customers[0];
    const part = parts[0];
    setRepairs((rows) => [
      { id: Date.now(), plate: customer.plate, item: "快速保養", part: part.name, labor: 350, status: "接車", paid: false },
      ...rows,
    ]);
    setParts((rows) => rows.map((row) => (row.id === part.id ? { ...row, stock: Math.max(0, row.stock - 1) } : row)));
    setLogs((rows) => [`已建立 ${customer.plate} 快速保養單，${part.name} 庫存扣 1。`, ...rows]);
  }

  function checkout() {
    const repair = repairs.find((row) => !row.paid) || repairs[0];
    setRepairs((rows) => rows.map((row) => (row.id === repair.id ? { ...row, paid: true, status: "已結帳" } : row)));
    setLogs((rows) => [`${repair.plate} 已完成付款沖銷與取車。`, ...rows]);
  }

  return (
    <div className="dispatch-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日門市狀態</span>
          <strong>{repairs.length} 張維修單</strong>
          <div className="ops-status-list" aria-label="今日門市指標">
            <p><span>今日營收</span><b>NT$ {kpis.revenue.toLocaleString("zh-TW")}</b></p>
            <p><span>毛利</span><b>NT$ {kpis.gross.toLocaleString("zh-TW")}</b></p>
            <p><span>低庫存</span><b>{kpis.lowStock} 項</b></p>
          </div>
          <button type="button" onClick={addRepair}>新增維修單</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel worker-panel">
          <div className="panel-heading">
            <h3>客戶與車籍</h3>
            <span>建檔 / 車牌 / 車型</span>
          </div>
          <form className="dispatch-form" onSubmit={addCustomer}>
            <input name="name" required placeholder="客戶姓名" aria-label="客戶姓名" suppressHydrationWarning />
            <input name="phone" required placeholder="聯絡電話" aria-label="聯絡電話" suppressHydrationWarning />
            <input name="plate" required placeholder="車牌號碼" aria-label="車牌號碼" suppressHydrationWarning />
            <select name="model" required aria-label="廠牌車型" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>選擇車型</option>
              {modelOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input name="insurance" required type="date" aria-label="保險到期" suppressHydrationWarning />
            <button type="submit">新增車籍</button>
          </form>
          <div className="record-list">
            {customers.map((customer) => (
              <article className="record-card" key={customer.id}>
                <div>
                  <strong>{customer.name} · {customer.plate}</strong>
                  <p>{customer.phone} · {customer.model} · 保險到期 {customer.insurance}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>維修保養單</h3>
            <span>零件與工資</span>
          </div>
          <button className="primary-action" type="button" onClick={addRepair}>新增維修單</button>
          <div className="record-list">
            {repairs.map((repair) => (
              <article className="record-card" key={repair.id}>
                <div>
                  <strong>{repair.plate} · {repair.item}</strong>
                  <p>{repair.part} · 工資 NT$ {repair.labor} · {repair.paid ? "已收款" : "未收款"}</p>
                </div>
                <div className="status-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={repair.status === status}
                      onClick={() => {
                        setRepairs((rows) => rows.map((row) => (row.id === repair.id ? { ...row, status } : row)));
                        setLogs((rows) => [`${repair.plate} 維修狀態更新為 ${status}。`, ...rows]);
                      }}
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
            <h3>零件庫存與付款</h3>
            <span>低庫存 / 沖銷</span>
          </div>
          <div className="shop-actions">
            <button type="button" onClick={checkout}>付款沖銷</button>
            <button type="button" onClick={() => setLogs((rows) => ["已產生日報與毛利分析。", ...rows])}>產生日報</button>
            <button type="button" onClick={() => setLogs((rows) => ["已備份今日維修與庫存資料。", ...rows])}>資料備份</button>
          </div>
          <div className="tag-list">
            {parts.map((part) => (
              <span key={part.id}>{part.name} · 庫存 {part.stock} · 售價 NT$ {part.price}{part.stock <= part.safe ? " · 低庫存" : ""}</span>
            ))}
          </div>
          <div className="log-list">
            {logs.slice(0, 5).map((log) => <p key={log}>{log}</p>)}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>管理儀表板</h3>
            <span>即時指標</span>
          </div>
          <div className="metric-grid">
            <div><span>客戶車籍</span><strong>{customers.length}</strong></div>
            <div><span>維修單</span><strong>{repairs.length}</strong></div>
            <div><span>未收款</span><strong>{kpis.unpaid}</strong></div>
            <div><span>毛利</span><strong>{kpis.gross.toLocaleString("zh-TW")}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
