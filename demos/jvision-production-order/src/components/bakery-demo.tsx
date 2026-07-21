"use client";

import { FormEvent, useMemo, useState } from "react";

type OrderStatus = "已收單" | "待生產" | "可取貨" | "已完成";
type BatchStatus = "備料中" | "烘焙中" | "已入庫" | "部分報廢";
type Order = { id: number; customer: string; channel: string; item: string; qty: number; amount: number; paid: number; status: OrderStatus };
type Batch = { id: number; product: string; qty: number; store: string; status: BatchStatus; waste: number };
type Material = { id: number; name: string; stock: number; unit: string; safety: number };

const orderStatuses: OrderStatus[] = ["已收單", "待生產", "可取貨", "已完成"];
const batchStatuses: BatchStatus[] = ["備料中", "烘焙中", "已入庫", "部分報廢"];
const products = ["可頌禮盒", "鳳梨酥 12 入", "生日蛋糕", "吐司組合", "咖啡麵包套餐", "喜餅試吃盒"];

export function BakeryDemo() {
  const [orders, setOrders] = useState<Order[]>([
    { id: 1, customer: "林小姐", channel: "門市", item: "可頌禮盒", qty: 2, amount: 1360, paid: 1360, status: "可取貨" },
    { id: 2, customer: "宏昇企業", channel: "企業預購", item: "鳳梨酥 12 入", qty: 18, amount: 12600, paid: 6000, status: "待生產" },
    { id: 3, customer: "陳先生", channel: "外送平台", item: "咖啡麵包套餐", qty: 3, amount: 780, paid: 780, status: "已收單" },
  ]);
  const [batches, setBatches] = useState<Batch[]>([
    { id: 1, product: "鳳梨酥 12 入", qty: 18, store: "中央工廠", status: "備料中", waste: 0 },
    { id: 2, product: "吐司組合", qty: 36, store: "信義門市", status: "烘焙中", waste: 2 },
  ]);
  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, name: "高筋麵粉", stock: 42, unit: "kg", safety: 35 },
    { id: 2, name: "奶油", stock: 18, unit: "kg", safety: 20 },
    { id: 3, name: "禮盒紙盒", stock: 96, unit: "組", safety: 80 },
  ]);
  const [logs, setLogs] = useState<string[]>(["今日已同步門市 POS、禮盒預購與後廠生產資料。"]);

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
      { id: Date.now(), customer, channel, item, qty, amount, paid, status: item.includes("禮盒") || channel === "企業預購" ? "待生產" : "已收單" },
      ...rows,
    ]);
    setLogs((rows) => [`新增 ${customer} 的 ${item} 訂單，已套用 ${channel} 流程。`, ...rows]);
    event.currentTarget.reset();
  }

  function createGiftBox() {
    setOrders((rows) => [
      { id: Date.now(), customer: "節慶散客", channel: "門市", item: "自由組合禮盒", qty: 1, amount: 880, paid: 880, status: "已收單" },
      ...rows,
    ]);
    setMaterials((rows) => rows.map((row) => row.name === "禮盒紙盒" ? { ...row, stock: row.stock - 1 } : row));
    setLogs((rows) => ["已建立自由組合禮盒，系統自動計算組合價並扣除 1 組紙盒。", ...rows]);
  }

  function createBatch() {
    const order = orders.find((row) => row.status === "待生產") || orders[0];
    setBatches((rows) => [
      { id: Date.now(), product: order.item, qty: order.qty, store: "中央工廠", status: "備料中", waste: 0 },
      ...rows,
    ]);
    setMaterials((rows) => rows.map((row) => row.name === "高筋麵粉" ? { ...row, stock: Math.max(0, row.stock - 3) } : row));
    setLogs((rows) => [`${order.item} 已轉後廠派工，備料同步扣除高筋麵粉 3kg。`, ...rows]);
  }

  function applyCampaign() {
    setLogs((rows) => ["已發送會員回購推播：下午茶麵包套餐第 2 件 8 折。", ...rows]);
  }

  function payBalance() {
    const order = orders.find((row) => row.paid < row.amount) || orders[0];
    setOrders((rows) => rows.map((row) => row.id === order.id ? { ...row, paid: row.amount, status: "已完成" } : row));
    setLogs((rows) => [`${order.customer} 已完成尾款收款與取貨。`, ...rows]);
  }

  return (
    <div className="dispatch-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日營運狀態</span>
          <strong>NT$ {kpis.revenue.toLocaleString("zh-TW")}</strong>
          <div className="ops-status-list" aria-label="今日烘焙營運指標">
            <p><span>待生產批次</span><b>{kpis.waiting} 批</b></p>
            <p><span>未收尾款</span><b>NT$ {kpis.receivable.toLocaleString("zh-TW")}</b></p>
            <p><span>低庫存原料</span><b>{kpis.lowStock} 項</b></p>
          </div>
          <button type="button" onClick={createGiftBox}>快速組禮盒</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel worker-panel">
          <div className="panel-heading">
            <h3>門市 POS 與預購收單</h3>
            <span>收銀 / 禮盒 / 通路</span>
          </div>
          <form className="dispatch-form" onSubmit={addOrder}>
            <input name="customer" required placeholder="客戶或公司名稱" aria-label="客戶或公司名稱" suppressHydrationWarning />
            <select name="channel" required aria-label="通路" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>通路</option>
              <option>門市</option>
              <option>企業預購</option>
              <option>外送平台</option>
              <option>官網自取</option>
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
                        setLogs((rows) => [`${order.customer} 的 ${order.item} 狀態更新為 ${status}。`, ...rows]);
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
            <span>組合價 / 點數 / 推播</span>
          </div>
          <button className="primary-action" type="button" onClick={createGiftBox}>新增自由組合禮盒</button>
          <div className="shop-actions">
            <button type="button" onClick={applyCampaign}>發送會員推播</button>
            <button type="button" onClick={payBalance}>收取尾款</button>
            <button type="button" onClick={() => setLogs((rows) => ["已套用滿 NT$ 1,000 折 NT$ 100 促銷。", ...rows])}>套用滿額折扣</button>
            <button type="button" onClick={() => setLogs((rows) => ["已列印電子發票與手機載具資料。", ...rows])}>開立發票</button>
          </div>
          <div className="tag-list">
            {["自由組合", "喜餅試吃", "企業送禮", "會員日", "點數折抵", "分批取貨"].map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>前店後廠與報廢</h3>
            <span>派工 / 入庫 / 扣料</span>
          </div>
          <button className="primary-action" type="button" onClick={createBatch}>訂單轉後廠派工</button>
          <div className="record-list">
            {batches.map((batch) => (
              <article className="record-card" key={batch.id}>
                <div>
                  <strong>{batch.product} · {batch.store}</strong>
                  <p>{batch.qty} 批/組 · 報廢 {batch.waste} · 狀態 {batch.status}</p>
                </div>
                <div className="status-actions">
                  {batchStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={batch.status === status}
                      onClick={() => {
                        setBatches((rows) => rows.map((row) => (row.id === batch.id ? { ...row, status, waste: status === "部分報廢" ? row.waste + 1 : row.waste } : row)));
                        setLogs((rows) => [`${batch.product} 生產狀態更新為 ${status}。`, ...rows]);
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
            <h3>總部營運儀表板</h3>
            <span>營收 / 庫存 / 損耗</span>
          </div>
          <div className="metric-grid">
            <div><span>訂單數</span><strong>{orders.length}</strong></div>
            <div><span>生產批次</span><strong>{batches.length}</strong></div>
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
