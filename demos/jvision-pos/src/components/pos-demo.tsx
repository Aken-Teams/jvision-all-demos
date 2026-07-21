"use client";

import { FormEvent, useMemo, useState } from "react";

type MenuItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  cost: number;
};

type CartItem = MenuItem & {
  qty: number;
};

type OnlineOrder = {
  id: string;
  source: string;
  customer: string;
  items: string;
  amount: number;
  status: "待接單" | "製作中" | "已完成";
};

const menu: MenuItem[] = [
  { id: 1, name: "松露野菇燉飯", category: "主餐", price: 320, cost: 118 },
  { id: 2, name: "炙燒牛排沙拉", category: "主餐", price: 380, cost: 155 },
  { id: 3, name: "焦糖拿鐵", category: "飲品", price: 150, cost: 42 },
  { id: 4, name: "檸檬氣泡咖啡", category: "飲品", price: 170, cost: 48 },
  { id: 5, name: "巴斯克乳酪蛋糕", category: "甜點", price: 180, cost: 63 },
  { id: 6, name: "季節水果塔", category: "甜點", price: 210, cost: 76 }
];

const initialOnlineOrders: OnlineOrder[] = [
  { id: "L-1028", source: "LINE", customer: "陳小姐", items: "焦糖拿鐵 x2、蛋糕 x1", amount: 480, status: "待接單" },
  { id: "D-3412", source: "外送", customer: "平台訂單", items: "燉飯 x1、氣泡咖啡 x1", amount: 490, status: "製作中" }
];

export function PosDemo() {
  const [table, setTable] = useState("A1");
  const [orderType, setOrderType] = useState("內用");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState("信用卡");
  const [invoice, setInvoice] = useState("手機載具");
  const [member, setMember] = useState({ name: "王小美", points: 128, visits: 7 });
  const [orders, setOrders] = useState<OnlineOrder[]>(initialOnlineOrders);
  const [reservations, setReservations] = useState(["19:00 林先生 4 位，已預點牛排沙拉"]);
  const [sales, setSales] = useState([
    { label: "午餐", amount: 18560 },
    { label: "下午茶", amount: 8240 },
    { label: "晚餐", amount: 15880 }
  ]);
  const [lastReceipt, setLastReceipt] = useState("尚未結帳");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.cost * item.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const profit = total - totalCost;

  const analytics = useMemo(() => {
    const daySales = sales.reduce((sum, row) => sum + row.amount, 0);
    const orderCount = sales.length + orders.length;
    const avgTicket = Math.round(daySales / orderCount);
    const margin = daySales ? Math.round(((daySales * 0.64) / daySales) * 100) : 0;
    return { daySales, orderCount, avgTicket, margin };
  }, [orders.length, sales]);

  function addToCart(item: MenuItem) {
    setCart((current) => {
      const found = current.find((cartItem) => cartItem.id === item.id);
      if (found) {
        return current.map((cartItem) => (cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem));
      }
      return [...current, { ...item, qty: 1 }];
    });
  }

  function removeFromCart(id: number) {
    setCart((current) => current.flatMap((item) => {
      if (item.id !== id) return [item];
      if (item.qty <= 1) return [];
      return [{ ...item, qty: item.qty - 1 }];
    }));
  }

  function checkout() {
    if (!cart.length) return;
    const label = `${orderType} ${table}`;
    setSales((current) => [{ label, amount: total }, ...current].slice(0, 6));
    setMember((current) => ({ ...current, points: current.points + Math.floor(total / 10), visits: current.visits + 1 }));
    setLastReceipt(`${label} 已以 ${payment} 結帳 NT$ ${total.toLocaleString("zh-TW")}，發票：${invoice}`);
    setCart([]);
    setDiscount(0);
  }

  function updateOnlineOrder(id: string, status: OnlineOrder["status"]) {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
  }

  function addReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const row = `${form.get("time")} ${form.get("name")} ${form.get("party")} 位，${form.get("note")}`;
    setReservations((current) => [row, ...current].slice(0, 5));
    event.currentTarget.reset();
  }

  return (
    <div className="pos-shell">
      <aside className="pos-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <label>
          桌位
          <select value={table} onChange={(event) => setTable(event.target.value)}>
            <option>A1</option>
            <option>A2</option>
            <option>B1</option>
            <option>外帶櫃台</option>
          </select>
        </label>
        <label>
          訂單類型
          <select value={orderType} onChange={(event) => setOrderType(event.target.value)}>
            <option>內用</option>
            <option>外帶</option>
            <option>線上</option>
          </select>
        </label>
        <div className="member-card">
          <span>會員</span>
          <strong>{member.name}</strong>
          <p>{member.points} 點 · 回訪 {member.visits} 次</p>
          <button type="button" onClick={() => setDiscount(50)}>套用 50 元折抵</button>
        </div>
      </aside>

      <div className="pos-main">
        <section className="pos-panel order-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Ordering</p>
              <h3>點餐與結帳</h3>
            </div>
            <span>{orderType} · {table}</span>
          </div>
          <div className="menu-grid">
            {menu.map((item) => (
              <button className="menu-item" type="button" key={item.id} onClick={() => addToCart(item)}>
                <span>{item.category}</span>
                <strong>{item.name}</strong>
                <b>NT$ {item.price}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="pos-panel cart-panel">
          <div className="panel-heading">
            <h3>即時帳單</h3>
            <span>{cart.length} 項</span>
          </div>
          <div className="cart-list">
            {cart.length === 0 ? <p className="empty">點選左側餐點開始測試。</p> : cart.map((item) => (
              <div className="cart-row" key={item.id}>
                <button type="button" onClick={() => removeFromCart(item.id)}>-</button>
                <span>{item.name} x {item.qty}</span>
                <strong>NT$ {(item.price * item.qty).toLocaleString("zh-TW")}</strong>
              </div>
            ))}
          </div>
          <div className="checkout-box">
            <label>
              折扣
              <input type="number" value={discount} min="0" onChange={(event) => setDiscount(Number(event.target.value))} />
            </label>
            <label>
              支付
              <select value={payment} onChange={(event) => setPayment(event.target.value)}>
                <option>信用卡</option>
                <option>LINE Pay</option>
                <option>現金</option>
                <option>禮券</option>
              </select>
            </label>
            <label>
              發票
              <select value={invoice} onChange={(event) => setInvoice(event.target.value)}>
                <option>手機載具</option>
                <option>統一編號</option>
                <option>紙本發票</option>
              </select>
            </label>
            <div className="totals">
              <span>小計 NT$ {subtotal.toLocaleString("zh-TW")}</span>
              <span>毛利 NT$ {profit.toLocaleString("zh-TW")}</span>
              <strong>總計 NT$ {total.toLocaleString("zh-TW")}</strong>
            </div>
            <button className="pay-button" type="button" onClick={checkout}>完成結帳</button>
            <p className="receipt">{lastReceipt}</p>
          </div>
        </section>

        <section className="pos-panel online-panel">
          <div className="panel-heading">
            <h3>線上接單</h3>
            <span>LINE / 外送整合</span>
          </div>
          {orders.map((order) => (
            <article className="online-order" key={order.id}>
              <div>
                <strong>{order.source} {order.id}</strong>
                <p>{order.customer} · {order.items}</p>
              </div>
              <b>NT$ {order.amount}</b>
              <div className="order-actions">
                {(["待接單", "製作中", "已完成"] as OnlineOrder["status"][]).map((status) => (
                  <button key={status} type="button" disabled={order.status === status} onClick={() => updateOnlineOrder(order.id, status)}>
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="pos-panel reservation-panel">
          <div className="panel-heading">
            <h3>線上訂位</h3>
            <span>訂位與預點整合</span>
          </div>
          <form className="reservation-form" onSubmit={addReservation}>
            <input name="time" required placeholder="19:30" aria-label="訂位時間" />
            <input name="name" required placeholder="訂位姓名" aria-label="訂位姓名" />
            <input name="party" required type="number" min="1" placeholder="人數" aria-label="人數" />
            <input name="note" required placeholder="備註或預點餐" aria-label="備註" />
            <button type="submit">新增訂位</button>
          </form>
          <div className="reservation-list">
            {reservations.map((row) => <span key={row}>{row}</span>)}
          </div>
        </section>

        <section className="pos-panel analytics-panel">
          <div className="panel-heading">
            <h3>銷售分析與成本</h3>
            <span>即時報表</span>
          </div>
          <div className="metric-grid">
            <div><span>今日營收</span><strong>NT$ {analytics.daySales.toLocaleString("zh-TW")}</strong></div>
            <div><span>訂單數</span><strong>{analytics.orderCount}</strong></div>
            <div><span>平均客單</span><strong>NT$ {analytics.avgTicket}</strong></div>
            <div><span>估算毛利率</span><strong>{analytics.margin}%</strong></div>
          </div>
          <div className="sales-bars">
            {sales.map((row) => (
              <div className="sales-row" key={`${row.label}-${row.amount}`}>
                <span>{row.label}</span>
                <div><i style={{ width: `${Math.min(100, row.amount / 240)}%` }} /></div>
                <b>NT$ {row.amount.toLocaleString("zh-TW")}</b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
