"use client";

import { useMemo, useState } from "react";

type CallStage = "新進來電" | "已派遣" | "拖吊中" | "待結帳" | "已完成";
type TruckStatus = "可派遣" | "出勤中" | "保養中";
type PaymentStatus = "待開單" | "已開單" | "已收款";

type ServiceCall = {
  id: string;
  customer: string;
  location: string;
  service: string;
  driver: string;
  truck: string;
  eta: string;
  fee: number;
  stage: CallStage;
};

type Truck = {
  plate: string;
  driver: string;
  status: TruckStatus;
  mileage: string;
};

type Invoice = {
  callId: string;
  payer: string;
  amount: number;
  status: PaymentStatus;
};

const stages: CallStage[] = ["新進來電", "已派遣", "拖吊中", "待結帳", "已完成"];

const initialCalls: ServiceCall[] = [
  {
    id: "TW-2601",
    customer: "王先生",
    location: "中山高北上 42K",
    service: "道路救援",
    driver: "Mia",
    truck: "T-08",
    eta: "12 分",
    fee: 3200,
    stage: "拖吊中",
  },
  {
    id: "TW-2602",
    customer: "安泰保險",
    location: "台北市民權東路",
    service: "事故拖吊",
    driver: "Leo",
    truck: "T-12",
    eta: "18 分",
    fee: 5200,
    stage: "已派遣",
  },
  {
    id: "TW-2603",
    customer: "信義停車場",
    location: "信義區松仁路",
    service: "違停移置",
    driver: "Nina",
    truck: "T-03",
    eta: "完成",
    fee: 2800,
    stage: "待結帳",
  },
  {
    id: "TW-2604",
    customer: "林小姐",
    location: "新北板橋文化路",
    service: "爆胎救援",
    driver: "待指派",
    truck: "待指派",
    eta: "待確認",
    fee: 1800,
    stage: "新進來電",
  },
];

const initialTrucks: Truck[] = [
  { plate: "T-03", driver: "Nina", status: "出勤中", mileage: "82,410 km" },
  { plate: "T-08", driver: "Mia", status: "出勤中", mileage: "64,220 km" },
  { plate: "T-12", driver: "Leo", status: "出勤中", mileage: "71,930 km" },
  { plate: "T-15", driver: "Ryan", status: "可派遣", mileage: "58,100 km" },
];

const initialInvoices: Invoice[] = [
  { callId: "TW-2601", payer: "王先生", amount: 3200, status: "待開單" },
  { callId: "TW-2602", payer: "安泰保險", amount: 5200, status: "已開單" },
  { callId: "TW-2603", payer: "信義停車場", amount: 2800, status: "已收款" },
];

const money = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

export default function TowingDispatchDemo() {
  const [calls, setCalls] = useState<ServiceCall[]>(initialCalls);
  const [trucks, setTrucks] = useState<Truck[]>(initialTrucks);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [customer, setCustomer] = useState("");
  const [location, setLocation] = useState("");
  const [service, setService] = useState("道路救援");
  const [driver, setDriver] = useState("Ryan");
  const [fee, setFee] = useState("");
  const [aiSummary, setAiSummary] = useState("AI 摘要尚未生成。");
  const [activity, setActivity] = useState([
    "TW-2601 已回報抵達現場，預計 15 分鐘內完成拖吊。",
    "TW-2602 已派 T-12 前往，保險公司案件資料已建立。",
    "TW-2603 已完成移置，等待帳務確認收款。",
  ]);

  const stats = useMemo(() => {
    const active = calls.filter((call) => call.stage !== "已完成").length;
    const todayRevenue = calls.reduce((sum, call) => sum + call.fee, 0);
    const available = trucks.filter((truck) => truck.status === "可派遣").length;
    const pendingBilling = invoices.filter((invoice) => invoice.status !== "已收款").length;
    return { active, todayRevenue, available, pendingBilling };
  }, [calls, trucks, invoices]);

  const addCall = () => {
    if (!customer.trim() || !location.trim() || !fee.trim()) return;
    const nextId = `TW-${2601 + calls.length}`;
    const value = Number(fee.replace(/[^\d]/g, "")) || 0;
    const assignedTruck = trucks.find((truck) => truck.driver === driver)?.plate || "T-15";
    const call: ServiceCall = {
      id: nextId,
      customer: customer.trim(),
      location: location.trim(),
      service,
      driver,
      truck: assignedTruck,
      eta: "20 分",
      fee: value,
      stage: "新進來電",
    };
    setCalls((current) => [call, ...current]);
    setInvoices((current) => [{ callId: nextId, payer: call.customer, amount: value, status: "待開單" }, ...current]);
    setActivity((current) => [`新增 ${nextId} ${call.service}，已建立客戶、位置與預估費用。`, ...current]);
    setCustomer("");
    setLocation("");
    setFee("");
  };

  const moveCall = (id: string, direction: 1 | -1) => {
    const changed = calls.find((call) => call.id === id);
    setCalls((current) =>
      current.map((call) => {
        if (call.id !== id) return call;
        const index = stages.indexOf(call.stage);
        const nextStage = stages[Math.min(stages.length - 1, Math.max(0, index + direction))];
        return { ...call, stage: nextStage, eta: nextStage === "已完成" ? "完成" : call.eta };
      }),
    );
    if (changed) {
      const nextStage = stages[Math.min(stages.length - 1, Math.max(0, stages.indexOf(changed.stage) + direction))];
      setActivity((current) => [`${changed.id} 已移到「${nextStage}」，司機 ${changed.driver} 與調度台同步更新。`, ...current]);
    }
  };

  const dispatchNearest = () => {
    const waiting = calls.find((call) => call.stage === "新進來電");
    if (!waiting) return;
    setCalls((current) =>
      current.map((call) =>
        call.id === waiting.id ? { ...call, stage: "已派遣", driver: "Ryan", truck: "T-15", eta: "14 分" } : call,
      ),
    );
    setTrucks((current) =>
      current.map((truck) => (truck.plate === "T-15" ? { ...truck, status: "出勤中", driver: "Ryan" } : truck)),
    );
    setActivity((current) => [`${waiting.id} 已指派最近車輛 T-15，預計 14 分鐘抵達。`, ...current]);
  };

  const updateBilling = () => {
    const target = invoices.find((invoice) => invoice.status !== "已收款");
    if (!target) return;
    setInvoices((current) =>
      current.map((invoice) =>
        invoice.callId === target.callId
          ? { ...invoice, status: invoice.status === "待開單" ? "已開單" : "已收款" }
          : invoice,
      ),
    );
    setActivity((current) => [`${target.callId} 帳務狀態已更新，金額 ${money.format(target.amount)}。`, ...current]);
  };

  const generateAiSummary = () => {
    const activeDrivers = trucks.filter((truck) => truck.status === "出勤中").length;
    const urgent = calls.find((call) => call.stage === "新進來電");
    setAiSummary(
      `目前有 ${stats.active} 件進行中任務、${activeDrivers} 台車出勤，今日金額 ${money.format(stats.todayRevenue)}。${urgent ? `建議優先派遣 ${urgent.id}，地點在 ${urgent.location}。` : "目前沒有未派遣來電。"}待帳務處理 ${stats.pendingBilling} 筆。`,
    );
  };

  return (
    <section className="demo-shell" id="demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision" className="demo-logo" />
        <div className="metric-card">
          <span>進行中任務</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="metric-card">
          <span>今日金額</span>
          <strong>{money.format(stats.todayRevenue)}</strong>
        </div>
        <div className="metric-card">
          <span>可派遣車輛</span>
          <strong>{stats.available}</strong>
        </div>
        <div className="metric-card">
          <span>待帳務</span>
          <strong>{stats.pendingBilling}</strong>
        </div>
      </aside>

      <div className="demo-main">
        <div className="demo-panel form-panel">
          <div className="panel-label">派遣接單</div>
          <h3>新增道路救援任務</h3>
          <div className="form-grid">
            <input value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="客戶或單位" />
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="事故或救援地點" />
            <select value={service} onChange={(event) => setService(event.target.value)}>
              <option>道路救援</option>
              <option>事故拖吊</option>
              <option>違停移置</option>
              <option>車輛運送</option>
              <option>爆胎救援</option>
            </select>
            <select value={driver} onChange={(event) => setDriver(event.target.value)}>
              <option>Ryan</option>
              <option>Mia</option>
              <option>Leo</option>
              <option>Nina</option>
            </select>
            <input value={fee} onChange={(event) => setFee(event.target.value)} placeholder="預估費用" />
          </div>
          <button onClick={addCall} className="primary-action">新增任務</button>
          <button onClick={dispatchNearest} className="secondary-action">指派最近車輛</button>
        </div>

        <div className="demo-panel ai-panel">
          <div className="panel-label">Jvision AI</div>
          <h3>派遣營運摘要</h3>
          <p>{aiSummary}</p>
          <button onClick={generateAiSummary} className="dark-action">生成 AI 摘要</button>
        </div>

        <div className="demo-panel board-panel">
          <div className="panel-label">派遣流程</div>
          <h3>道路救援任務看板</h3>
          <div className="job-board">
            {stages.map((stage) => (
              <div className="job-column" key={stage}>
                <h4>{stage}</h4>
                {calls
                  .filter((call) => call.stage === stage)
                  .map((call) => (
                    <article className="job-card" key={call.id}>
                      <strong>{call.customer}</strong>
                      <span>{call.service} · {call.location}</span>
                      <span>{call.driver} · {call.truck} · ETA {call.eta}</span>
                      <span>{money.format(call.fee)}</span>
                      <div className="card-actions">
                        <button onClick={() => moveCall(call.id, -1)} aria-label={`${call.id} 回上一階段`}>←</button>
                        <button onClick={() => moveCall(call.id, 1)} aria-label={`${call.id} 到下一階段`}>→</button>
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
              <div className="panel-label">車隊與帳務</div>
              <h3>車輛狀態與收款追蹤</h3>
            </div>
            <button onClick={updateBilling}>更新帳務</button>
          </div>
          <div className="fleet-grid">
            {trucks.map((truck) => (
              <div className="fleet-card" key={truck.plate}>
                <strong>{truck.plate}</strong>
                <span>{truck.driver}</span>
                <em>{truck.status}</em>
                <small>{truck.mileage}</small>
              </div>
            ))}
          </div>
          <div className="file-list invoice-list">
            {invoices.map((invoice) => (
              <div className="file-row" key={invoice.callId}>
                <strong>{invoice.callId} · {invoice.payer}</strong>
                <span>{money.format(invoice.amount)}</span>
                <em>{invoice.status}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="demo-panel activity-panel">
          <div className="panel-label">同步紀錄</div>
          <h3>司機、調度與帳務通知</h3>
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
