"use client";

import { FormEvent, useMemo, useState } from "react";

type OrderStatus = "已結帳" | "待尾款" | "待取貨" | "已完成";
type BatchStatus = "待生產" | "烘焙中" | "已入庫" | "報廢扣料";
type Order = { id: number; customer: string; channel: string; item: string; qty: number; amount: number; paid: number; status: OrderStatus };
type Batch = { id: number; product: string; qty: number; store: string; status: BatchStatus; waste: number };
type Material = { id: number; name: string; stock: number; unit: string; safety: number };

const orderStatuses: OrderStatus[] = ["已結帳", "待尾款", "待取貨", "已完成"];
const batchStatuses: BatchStatus[] = ["待生產", "烘焙中", "已入庫", "報廢扣料"];
const products = ["可頌禮盒", "中秋蛋黃酥 12 入", "草莓塔", "法式餐包", "焦糖布丁", "生日蛋糕"];

export function BakeryDemo() {
  const [orders, setOrders] = useState<Order[]>([
    { id: 1, customer: "王小姐", channel: "門市", item: "可頌禮盒", qty: 2, amount: 1360, paid: 1360, status: "待取貨" },
    { id: 2, customer: "宏達企業", channel: "企業預購", item: "中秋蛋黃酥 12 入", qty: 18, amount: 12600, paid: 6000, status: "待尾款" },
    { id: 3, customer: "林先生", channel: "外送平台", item: "焦糖布丁", qty: 3, amount: 780, paid: 780, status: "已結帳" },
  ]);
  const [batches, setBatches] = useState<Batch[]>([
    { id: 1, product: "中秋蛋黃酥 12 入", qty: 18, store: "中央廚房", status: "待生產", waste: 0 },
    { id: 2, product: "法式餐包", qty: 36, store: "一店門市", status: "烘焙中", waste: 2 },
  ]);
  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, name: "高筋麵粉", stock: 42, unit: "kg", safety: 35 },
    { id: 2, name: "奶油", stock: 18, unit: "kg", safety: 20 },
    { id: 3, name: "禮盒包材", stock: 96, unit: "組", safety: 80 },
  ]);
  const [logs, setLogs] = useState<string[]>(["今日已同步門市 POS、預購、庫存與後場生產資料。"]);

  const kpis = useMemo(() => {
    const revenue = orders.reduce((sum, row) => sum + row.paid, 0);
    const receivable = orders.reduce((sum, row) => sum + Math.max(0, row.amount - row.paid), 0);
    const waiting = batches.filter((row) => row.status !== "已入庫").length;
    const waste = batches.reduce((sum, row) => sum + row.waste, 0);
    const lowStock = materials.filter((row) => row.stock <= row.safety).length;
    return { revenue, receivable, waiting, waste, lowStock };
  }, [batches, materials, orders]);

  function addOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customer = String(form.get("customer"));
    const item = String(form.get("item"));
    const qty = Number(form.get("qty"));
    const amount = Number(form.get("amount"));
    const channel = String(form.get("channel"));
    const paid = channel === "企業預購" ? Math.round(amount * 0.4) : amount;
    setOrders((rows) => [
      { id: Date.now(), customer, channel, item, qty, amount, paid, status: item.includes("禮盒") || channel === "企業預購" ? "待尾款" : "已結帳" },
      ...rows,
    ]);
    setLogs((rows) => [`新增 ${customer} 的 ${item} 訂單，來源為 ${channel}。`, ...rows]);
    event.currentTarget.reset();
  }

  function createGiftBox() {
    setOrders((rows) => [
      { id: Date.now(), customer: "新客禮盒訂單", channel: "門市", item: "自由組合禮盒", qty: 1, amount: 880, paid: 880, status: "已結帳" },
      ...rows,
    ]);
    setMaterials((rows) => rows.map((row) => row.name === "禮盒包材" ? { ...row, stock: row.stock - 1 } : row));
    setLogs((rows) => ["已建立自由組合禮盒，系統同步扣除 1 組包材。", ...rows]);
  }

  function createBatch() {
    const order = orders.find((row) => row.status === "待尾款") || orders[0];
    setBatches((rows) => [
      { id: Date.now(), product: order.item, qty: order.qty, store: "中央廚房", status: "待生產", waste: 0 },
      ...rows,
    ]);
    setMaterials((rows) => rows.map((row) => row.name === "高筋麵粉" ? { ...row, stock: Math.max(0, row.stock - 3) } : row));
    setLogs((rows) => [`${order.item} 已建立生產批次，預估扣除高筋麵粉 3kg。`, ...rows]);
  }

  function applyCampaign() {
    setLogs((rows) => ["已套用會員回購優惠，系統建議本週推送 2 則活動通知。", ...rows]);
  }

  function payBalance() {
    const order = orders.find((row) => row.paid < row.amount) || orders[0];
    setOrders((rows) => rows.map((row) => row.id === order.id ? { ...row, paid: row.amount, status: "已完成" } : row));
    setLogs((rows) => [`${order.customer} 已完成尾款收款並更新取貨狀態。`, ...rows]);
  }

  return (
    <div className="dispatch-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日營收</span>
          <strong>NT$ {kpis.revenue.toLocaleString("zh-TW")}</strong>
          <div className="ops-status-list" aria-label="烘焙營運重點">
            <p><span>待生產批次</span><b>{kpis.waiting} 項</b></p>
            <p><span>未收尾款</span><b>NT$ {kpis.receivable.toLocaleString("zh-TW")}</b></p>
            <p><span>低庫存</span><b>{kpis.lowStock} 項</b></p>
          </div>
          <button type="button" onClick={createGiftBox}>快速建立禮盒</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel worker-panel">
          <div className="panel-heading">
            <h3>門市 POS 與預購訂單</h3>
            <span>門市 / 禮盒 / 外送</span>
          </div>
          <form className="dispatch-form" onSubmit={addOrder}>
            <input name="customer" required placeholder="客戶或訂單名稱" aria-label="客戶或訂單名稱" suppressHydrationWarning />
            <select name="channel" required aria-label="來源" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>來源</option>
              <option>門市</option>
              <option>企業預購</option>
              <option>外送平台</option>
              <option>電話預訂</option>
            </select>
            <select name="item" required aria-label="商品" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>商品</option>
              {products.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input name="qty" required type="number" min="1" placeholder="數量" aria-label="數量" suppressHydrationWarning />
            <input name="amount" required type="number" min="1" placeholder="訂單金額" aria-label="訂單金額" suppressHydrationWarning />
            <button type="submit">新增訂單</button>
          </form>
          <div className="record-list">
            {orders.map((order) => (
              <article className="record-card" key={order.id}>
                <div>
                  <strong>{order.customer} · {order.item}</strong>
                  <p>{order.channel} · {order.qty} 組 · 應收 NT$ {order.amount.toLocaleString("zh-TW")} · 已收 NT$ {order.paid.toLocaleString("zh-TW")}</p>
                </div>
                <div className="status-actions">
                  {orderStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={order.status === status}
                      onClick={() => {
                        setOrders((rows) => rows.map((row) => (row.id === order.id ? { ...row, status } : row)));
                        setLogs((rows) => [`${order.customer} 的 ${order.item} 狀態更新為「${status}」。`, ...rows]);
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
            <h3>禮盒與會員行銷</h3>
            <span>組合 / 優惠 / 通知</span>
          </div>
          <button className="primary-action" type="button" onClick={createGiftBox}>新增自由組合禮盒</button>
          <div className="shop-actions">
            <button type="button" onClick={applyCampaign}>推送回購優惠</button>
            <button type="button" onClick={payBalance}>收取尾款</button>
            <button type="button" onClick={() => setLogs((rows) => ["已建立滿 NT$ 1,000 折 NT$ 100 促銷規則。", ...rows])}>建立促銷規則</button>
            <button type="button" onClick={() => setLogs((rows) => ["已產生今日熱銷商品與補貨建議。", ...rows])}>產生營運摘要</button>
          </div>
          <div className="tag-list">
            {["自由組合", "生日蛋糕", "企業預購", "會員點數", "分批取貨", "LINE 通知"].map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>前店後廠與庫存</h3>
            <span>批次 / 入庫 / 扣料</span>
          </div>
          <button className="primary-action" type="button" onClick={createBatch}>訂單轉生產批次</button>
          <div className="record-list">
            {batches.map((batch) => (
              <article className="record-card" key={batch.id}>
                <div>
                  <strong>{batch.product} · {batch.store}</strong>
                  <p>{batch.qty} 組 · 報廢 {batch.waste} · 狀態：{batch.status}</p>
                </div>
                <div className="status-actions">
                  {batchStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={batch.status === status}
                      onClick={() => {
                        setBatches((rows) => rows.map((row) => (row.id === batch.id ? { ...row, status, waste: status === "報廢扣料" ? row.waste + 1 : row.waste } : row)));
                        setLogs((rows) => [`${batch.product} 生產狀態更新為「${status}」。`, ...rows]);
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

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>營運看板</h3>
            <span>銷售 / 庫存 / 風險</span>
          </div>
          <div className="metric-grid">
            <div><span>訂單數</span><strong>{orders.length}</strong></div>
            <div><span>批次數</span><strong>{batches.length}</strong></div>
            <div><span>報廢數</span><strong>{kpis.waste}</strong></div>
            <div><span>低庫存</span><strong>{kpis.lowStock}</strong></div>
          </div>
          <div className="tag-list">
            {materials.map((item) => (
              <span key={item.id}>{item.name} {item.stock}{item.unit}</span>
            ))}
          </div>
          <div className="log-list">
            {logs.slice(0, 5).map((log) => <p key={log}>{log}</p>)}
          </div>
        </section>
      </div>
    </div>
  );
}
