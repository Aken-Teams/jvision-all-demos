"use client";

import { useMemo, useState } from "react";

const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const stages = ["待排產", "生產中", "品檢中", "已入庫"];

type WorkOrder = {
  id: number;
  product: string;
  line: string;
  qty: number;
  due: string;
  stage: string;
  priority: "高" | "中" | "低";
};

const initialOrders: WorkOrder[] = [
  { id: 1, product: "智慧感測器 A104", line: "一線", qty: 320, due: "7/03", stage: "生產中", priority: "高" },
  { id: 2, product: "控制模組 B225", line: "二線", qty: 180, due: "7/05", stage: "待排產", priority: "中" },
  { id: 3, product: "包裝套件 C918", line: "包裝線", qty: 520, due: "7/02", stage: "品檢中", priority: "高" },
  { id: 4, product: "維修備品 D077", line: "小批量線", qty: 90, due: "7/01", stage: "已入庫", priority: "低" }
];

function ProductionOrderDemo() {
  const [orders, setOrders] = useState(initialOrders);
  const [form, setForm] = useState({ product: "新產品試產批", line: "三線", qty: "120", due: "7/08", priority: "中" as WorkOrder["priority"] });
  const [message, setMessage] = useState("請新增工單或移動生產狀態，系統會即時更新排程與產能。");
  const [summary, setSummary] = useState("AI 摘要尚未產生。");

  const kpi = useMemo(() => {
    const active = orders.filter((order) => order.stage !== "已入庫").length;
    const qty = orders.reduce((sum, order) => sum + order.qty, 0);
    const urgent = orders.filter((order) => order.priority === "高" && order.stage !== "已入庫").length;
    const done = Math.round((orders.filter((order) => order.stage === "已入庫").length / orders.length) * 100);
    return { active, qty, urgent, done };
  }, [orders]);

  function addOrder() {
    const qty = Number(form.qty);
    if (!form.product || !Number.isFinite(qty) || qty <= 0) {
      setMessage("請確認產品名稱與數量正確。");
      return;
    }
    setOrders((rows) => [{ id: Date.now(), product: form.product, line: form.line, qty, due: form.due, priority: form.priority, stage: "待排產" }, ...rows]);
    setMessage(`${form.product} 已建立生產工單，排入 ${form.line}。`);
  }

  function moveOrder(id: number, direction: -1 | 1) {
    setOrders((rows) => rows.map((order) => {
      if (order.id !== id) return order;
      const index = stages.indexOf(order.stage);
      const next = stages[Math.min(Math.max(index + direction, 0), stages.length - 1)];
      setMessage(`${order.product} 已移動到「${next}」。`);
      return { ...order, stage: next };
    }));
  }

  function generateSummary() {
    const urgent = orders.find((order) => order.priority === "高" && order.stage !== "已入庫");
    setSummary(
      urgent
        ? `目前有 ${kpi.active} 張未完成工單，總生產量 ${kpi.qty.toLocaleString("zh-TW")} 件。請優先追蹤 ${urgent.product}，期限 ${urgent.due}，建議先確認物料與品檢人力。`
        : `目前工單進度穩定，完成率 ${kpi.done}%。建議維持今日排程並追蹤入庫節點。`
    );
  }

  return (
    <section className="po-demo" id="demo">
      <aside>
        <img src={logoUrl} alt="Jvision" />
        <div><span>未完成工單</span><strong>{kpi.active}</strong></div>
        <div><span>高優先</span><strong>{kpi.urgent}</strong></div>
        <div><span>總生產量</span><strong>{kpi.qty.toLocaleString("zh-TW")}</strong></div>
        <div><span>完成率</span><strong>{kpi.done}%</strong></div>
      </aside>
      <div className="po-workspace">
        <article className="po-panel">
          <span>新增工單</span>
          <h3>建立生產工單</h3>
          <div className="po-form">
            <input value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} aria-label="產品名稱" />
            <input value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} aria-label="產線" />
            <input value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} aria-label="數量" />
            <input value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} aria-label="期限" />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as WorkOrder["priority"] })} aria-label="優先度">
              <option>高</option><option>中</option><option>低</option>
            </select>
            <button type="button" onClick={addOrder}>新增工單</button>
          </div>
          <p>{message}</p>
        </article>

        <article className="po-panel">
          <span>Jvision AI</span>
          <h3>生產排程摘要</h3>
          <p>{summary}</p>
          <button type="button" onClick={generateSummary}>生成 AI 摘要</button>
        </article>

        <article className="po-panel po-wide">
          <span>看板</span>
          <h3>工單狀態流轉</h3>
          <div className="po-kanban">
            {stages.map((stage) => (
              <div key={stage}>
                <h4>{stage}</h4>
                {orders.filter((order) => order.stage === stage).map((order) => (
                  <section key={order.id}>
                    <b>{order.product}</b>
                    <small>{order.line} · {order.qty} 件 · {order.due}</small>
                    <em>{order.priority}優先</em>
                    <nav>
                      <button type="button" onClick={() => moveOrder(order.id, -1)}>←</button>
                      <button type="button" onClick={() => moveOrder(order.id, 1)}>→</button>
                    </nav>
                  </section>
                ))}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="po-page">
      <header className="po-header">
        <a href="#top"><img src={logoUrl} alt="Jvision" /></a>
        <nav><a href="#features">功能</a><a href="#demo">Demo</a><a href="#contact">諮詢</a></nav>
        <a href="#demo">立即試用</a>
      </header>
      <section className="po-hero" id="top">
        <div>
          <p>Production Order / Scheduling / Shop Floor</p>
          <h1>Jvision 生產工單管理平台</h1>
          <p>整合訂單轉工單、排產派工、進度追蹤、品檢入庫與 AI 排程摘要，讓現場、業務與主管看到同一份生產狀態。</p>
          <a href="#demo">開啟功能 Demo</a>
        </div>
        <div className="po-preview">
          <strong>今日排程</strong>
          <span>待排產 8 張</span>
          <span>生產中 14 張</span>
          <span>品檢中 5 張</span>
          <span>準交率 93%</span>
        </div>
      </section>
      <section className="po-features" id="features">
        {[
          ["訂單轉工單", "銷售需求可快速轉成生產工單，保留交期、數量與優先度。"],
          ["排產派工", "依產線、人員與物料狀態安排生產順序。"],
          ["現場回報", "工單可回報進度、異常、停線與完成數量。"],
          ["品檢入庫", "完成後進入品檢與入庫，讓庫存同步更新。"]
        ].map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
      </section>
      <ProductionOrderDemo />
      <footer id="contact">
        <img src={logoUrl} alt="Jvision" />
        <p>Jvision 生產工單管理 Demo，展示排產、派工、工單流轉與 AI 摘要。</p>
      </footer>
    </main>
  );
}
