"use client";

import { FormEvent, useMemo, useState } from "react";

type Appointment = {
  id: number;
  time: string;
  owner: string;
  plate: string;
  service: string;
  status: "預約" | "進廠" | "完工";
};

type JobItem = {
  id: number;
  name: string;
  part: string;
  qty: number;
  labor: number;
  partPrice: number;
};

type StockItem = {
  id: number;
  name: string;
  sku: string;
  stock: number;
  safe: number;
  cost: number;
};

const initialAppointments: Appointment[] = [
  { id: 1, time: "09:30", owner: "林先生", plate: "ABC-2588", service: "5,000km 保養", status: "進廠" },
  { id: 2, time: "11:00", owner: "張小姐", plate: "RDX-9135", service: "煞車異音檢查", status: "預約" },
  { id: 3, time: "15:30", owner: "陳先生", plate: "KLA-6672", service: "冷氣不冷", status: "預約" }
];

const stockSeed: StockItem[] = [
  { id: 1, name: "機油 5W-40", sku: "OIL-540", stock: 28, safe: 10, cost: 420 },
  { id: 2, name: "機油芯", sku: "FIL-102", stock: 7, safe: 8, cost: 160 },
  { id: 3, name: "煞車皮", sku: "BRK-220", stock: 14, safe: 6, cost: 920 },
  { id: 4, name: "冷媒補充", sku: "AC-134A", stock: 5, safe: 4, cost: 580 }
];

const catalog = [
  { name: "基本保養套餐", part: "機油 5W-40", labor: 800, partPrice: 1800 },
  { name: "更換機油芯", part: "機油芯", labor: 300, partPrice: 420 },
  { name: "前輪煞車皮更換", part: "煞車皮", labor: 1200, partPrice: 2800 },
  { name: "冷氣冷媒檢測", part: "冷媒補充", labor: 900, partPrice: 1300 }
];

export function GarageDemo() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [activeAppointmentId, setActiveAppointmentId] = useState(1);
  const [jobItems, setJobItems] = useState<JobItem[]>([
    { id: 1, name: "基本保養套餐", part: "機油 5W-40", qty: 1, labor: 800, partPrice: 1800 }
  ]);
  const [stocks, setStocks] = useState<StockItem[]>(stockSeed);
  const [paidOrders, setPaidOrders] = useState([
    { plate: "TXA-5520", amount: 4200 },
    { plate: "PQQ-1208", amount: 7600 }
  ]);
  const [message, setMessage] = useState("選擇預約後可建立工單、加入維修項目並結帳。");

  const active = appointments.find((item) => item.id === activeAppointmentId) ?? appointments[0];
  const subtotal = jobItems.reduce((sum, item) => sum + (item.labor + item.partPrice) * item.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const revenue = paidOrders.reduce((sum, row) => sum + row.amount, 0);
  const lowStock = stocks.filter((item) => item.stock <= item.safe).length;

  const dashboard = useMemo(() => {
    const inbound = appointments.filter((item) => item.status !== "完工").length;
    const completed = appointments.filter((item) => item.status === "完工").length;
    return { inbound, completed, revenue, lowStock };
  }, [appointments, revenue, lowStock]);

  function addAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const row: Appointment = {
      id: Date.now(),
      time: String(form.get("time") || "16:00"),
      owner: String(form.get("owner") || "新車主"),
      plate: String(form.get("plate") || "NEW-0000").toUpperCase(),
      service: String(form.get("service") || "一般檢修"),
      status: "預約"
    };
    setAppointments((current) => [row, ...current]);
    setActiveAppointmentId(row.id);
    setMessage("新預約已建立，可一鍵轉進廠工單。");
    event.currentTarget.reset();
  }

  function updateStatus(id: number, status: Appointment["status"]) {
    setAppointments((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    setMessage(status === "進廠" ? "已轉為進廠工單，技師可開始登錄項目。" : "工單狀態已更新。");
  }

  function addJobItem(index: number) {
    const item = catalog[index];
    setJobItems((current) => [
      ...current,
      {
        id: Date.now(),
        name: item.name,
        part: item.part,
        qty: 1,
        labor: item.labor,
        partPrice: item.partPrice
      }
    ]);
    setStocks((current) => current.map((stock) => (stock.name === item.part ? { ...stock, stock: Math.max(0, stock.stock - 1) } : stock)));
    setMessage(`${item.name} 已加入工單，相關零件庫存同步扣除。`);
  }

  function removeJobItem(id: number) {
    setJobItems((current) => current.filter((item) => item.id !== id));
    setMessage("維修項目已移除，估價金額已重新計算。");
  }

  function sendLineNotice() {
    setMessage(`已傳送 LINE 通知給 ${active.owner}：${active.plate} 工單估價 NT$ ${total.toLocaleString("zh-TW")}。`);
  }

  function checkout() {
    setPaidOrders((current) => [{ plate: active.plate, amount: total }, ...current].slice(0, 8));
    setAppointments((current) => current.map((item) => (item.id === active.id ? { ...item, status: "完工" } : item)));
    setJobItems([]);
    setMessage(`已完成 ${active.plate} 結帳，發票與車歷紀錄已自動保存。`);
  }

  return (
    <div className="garage-shell">
      <aside className="garage-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="garage-metric"><span>今日進廠</span><strong>{dashboard.inbound}</strong></div>
        <div className="garage-metric"><span>完工車輛</span><strong>{dashboard.completed}</strong></div>
        <div className="garage-metric"><span>低庫存</span><strong>{dashboard.lowStock}</strong></div>
        <div className="garage-metric"><span>已收款</span><strong>NT$ {dashboard.revenue.toLocaleString("zh-TW")}</strong></div>
      </aside>

      <div className="garage-main">
        <section className="garage-panel appointment-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Appointments</p>
              <h3>預約與車主資料</h3>
            </div>
            <span>{appointments.length} 筆</span>
          </div>
          <form className="appointment-form" onSubmit={addAppointment}>
            <input name="time" required placeholder="時間 16:00" aria-label="時間" />
            <input name="owner" required placeholder="車主姓名" aria-label="車主姓名" />
            <input name="plate" required placeholder="車牌 ABC-1234" aria-label="車牌" />
            <input name="service" required placeholder="服務項目" aria-label="服務項目" />
            <button type="submit">新增預約</button>
          </form>
          <div className="appointment-list">
            {appointments.map((item) => (
              <article className={`appointment-row ${item.id === activeAppointmentId ? "active" : ""}`} key={item.id}>
                <button type="button" onClick={() => setActiveAppointmentId(item.id)}>
                  <strong>{item.time} · {item.plate}</strong>
                  <span>{item.owner} · {item.service}</span>
                </button>
                <b>{item.status}</b>
                <button type="button" onClick={() => updateStatus(item.id, item.status === "預約" ? "進廠" : "完工")}>
                  {item.status === "預約" ? "轉工單" : "完工"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="garage-panel workorder-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Work Order</p>
              <h3>{active.plate} 維修工單</h3>
            </div>
            <span>{active.owner}</span>
          </div>
          <div className="catalog-grid">
            {catalog.map((item, index) => (
              <button type="button" key={item.name} onClick={() => addJobItem(index)}>
                <strong>{item.name}</strong>
                <span>{item.part}</span>
                <b>NT$ {(item.labor + item.partPrice).toLocaleString("zh-TW")}</b>
              </button>
            ))}
          </div>
          <div className="job-list">
            {jobItems.length === 0 ? <p className="empty-state">尚未加入維修項目。</p> : jobItems.map((item) => (
              <div className="job-row" key={item.id}>
                <button type="button" onClick={() => removeJobItem(item.id)}>-</button>
                <span>{item.name} · {item.part}</span>
                <strong>NT$ {((item.labor + item.partPrice) * item.qty).toLocaleString("zh-TW")}</strong>
              </div>
            ))}
          </div>
          <div className="totals">
            <span>小計 NT$ {subtotal.toLocaleString("zh-TW")}</span>
            <span>稅額 NT$ {tax.toLocaleString("zh-TW")}</span>
            <strong>總計 NT$ {total.toLocaleString("zh-TW")}</strong>
          </div>
          <div className="workorder-actions">
            <button type="button" onClick={sendLineNotice}>傳送 LINE 估價</button>
            <button type="button" onClick={checkout} disabled={!jobItems.length}>結帳並存車歷</button>
          </div>
          <p className="demo-message">{message}</p>
        </section>

        <section className="garage-panel stock-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inventory</p>
              <h3>零件庫存與供應商</h3>
            </div>
          </div>
          <div className="stock-list">
            {stocks.map((item) => (
              <article className="stock-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.sku} · 成本 NT$ {item.cost}</span>
                </div>
                <meter min="0" max="30" value={item.stock} />
                <b className={item.stock <= item.safe ? "danger" : ""}>{item.stock} 件</b>
              </article>
            ))}
          </div>
        </section>

        <section className="garage-panel report-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Reports</p>
              <h3>營收與服務分析</h3>
            </div>
          </div>
          <div className="report-grid">
            <div><span>今日營收</span><strong>NT$ {revenue.toLocaleString("zh-TW")}</strong></div>
            <div><span>平均客單</span><strong>NT$ {Math.round(revenue / Math.max(1, paidOrders.length)).toLocaleString("zh-TW")}</strong></div>
            <div><span>熱銷服務</span><strong>基本保養</strong></div>
            <div><span>待追蹤車主</span><strong>{appointments.filter((item) => item.status !== "完工").length}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
