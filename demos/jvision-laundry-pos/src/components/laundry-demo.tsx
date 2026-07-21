"use client";

import { FormEvent, useMemo, useState } from "react";

type LaundryStatus = "收件" | "送洗中" | "已入庫" | "已取件";
type Customer = { id: number; name: string; phone: string; member: string; balance: number; lastVisit: string };
type Order = { id: number; customer: string; item: string; method: string; color: string; rack: string; amount: number; paid: number; status: LaundryStatus };
type Expense = { id: number; item: string; amount: number; date: string };

const statuses: LaundryStatus[] = ["收件", "送洗中", "已入庫", "已取件"];
const itemTypes = ["襯衫", "西裝外套", "大衣", "棉被", "洋裝", "皮衣"];
const methods = ["水洗", "乾洗", "精緻洗", "熨燙", "去漬", "皮革保養"];
const colors = ["白色", "黑色", "藍色", "米色", "灰色", "花色"];

export function LaundryDemo() {
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 1, name: "林小姐", phone: "0912-100-200", member: "金卡", balance: 420, lastVisit: "2026-06-28" },
    { id: 2, name: "陳先生", phone: "0922-300-500", member: "一般", balance: 0, lastVisit: "2026-06-30" },
  ]);
  const [orders, setOrders] = useState<Order[]>([
    { id: 1, customer: "林小姐", item: "西裝外套", method: "乾洗", color: "黑色", rack: "A-12", amount: 360, paid: 0, status: "已入庫" },
    { id: 2, customer: "陳先生", item: "棉被", method: "精緻洗", color: "米色", rack: "外送廠", amount: 680, paid: 680, status: "送洗中" },
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, item: "包材與吊牌", amount: 320, date: "2026-07-01" },
  ]);
  const [logs, setLogs] = useState<string[]>(["今日已建立 2 筆送洗單，1 件衣物完成入庫。"]);

  const kpis = useMemo(() => {
    const revenue = orders.reduce((sum, row) => sum + row.paid, 0);
    const receivable = orders.reduce((sum, row) => sum + Math.max(0, row.amount - row.paid), 0);
    const expense = expenses.reduce((sum, row) => sum + row.amount, 0);
    const ready = orders.filter((row) => row.status === "已入庫").length;
    return { revenue, receivable, expense, ready };
  }, [expenses, orders]);

  function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    setCustomers((rows) => [
      {
        id: Date.now(),
        name,
        phone: String(form.get("phone")),
        member: String(form.get("member")),
        balance: Number(form.get("balance")),
        lastVisit: "2026-07-01",
      },
      ...rows,
    ]);
    setLogs((rows) => [`新增客戶 ${name}，系統已建立會員資料。`, ...rows]);
    event.currentTarget.reset();
  }

  function addOrder() {
    const customer = customers[0];
    setOrders((rows) => [
      { id: Date.now(), customer: customer.name, item: "襯衫", method: "水洗", color: "白色", rack: "待分類", amount: 120, paid: 0, status: "收件" },
      ...rows,
    ]);
    setLogs((rows) => [`新增 ${customer.name} 的襯衫水洗收件單。`, ...rows]);
  }

  function checkout() {
    const order = orders.find((row) => row.paid < row.amount) || orders[0];
    setOrders((rows) => rows.map((row) => (row.id === order.id ? { ...row, paid: row.amount, status: "已取件" } : row)));
    setLogs((rows) => [`${order.customer} 已完成付款與取件。`, ...rows]);
  }

  function addExpense() {
    setExpenses((rows) => [
      { id: Date.now(), item: "協力洗衣廠費用", amount: 560, date: "2026-07-01" },
      ...rows,
    ]);
    setLogs((rows) => ["已新增每日支出：協力洗衣廠費用。", ...rows]);
  }

  return (
    <div className="dispatch-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日門市狀態</span>
          <strong>{orders.length} 筆送洗</strong>
          <div className="ops-status-list" aria-label="今日洗衣門市指標">
            <p><span>已收款</span><b>NT$ {kpis.revenue.toLocaleString("zh-TW")}</b></p>
            <p><span>未收款</span><b>NT$ {kpis.receivable.toLocaleString("zh-TW")}</b></p>
            <p><span>待取件</span><b>{kpis.ready} 件</b></p>
          </div>
          <button type="button" onClick={addOrder}>新增送洗單</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel worker-panel">
          <div className="panel-heading">
            <h3>客戶與收件</h3>
            <span>會員 / 未收 / 送洗</span>
          </div>
          <form className="dispatch-form" onSubmit={addCustomer}>
            <input name="name" required placeholder="客戶姓名" aria-label="客戶姓名" suppressHydrationWarning />
            <input name="phone" required placeholder="聯絡電話" aria-label="聯絡電話" suppressHydrationWarning />
            <select name="member" required aria-label="會員類別" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>會員類別</option>
              <option>一般</option>
              <option>銀卡</option>
              <option>金卡</option>
            </select>
            <input name="balance" required type="number" min="0" placeholder="未收帳款" aria-label="未收帳款" suppressHydrationWarning />
            <button type="submit">新增客戶</button>
          </form>
          <div className="record-list">
            {customers.map((customer) => (
              <article className="record-card" key={customer.id}>
                <div>
                  <strong>{customer.name} · {customer.member}</strong>
                  <p>{customer.phone} · 未收 NT$ {customer.balance.toLocaleString("zh-TW")} · 上次送洗 {customer.lastVisit}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>送洗衣物</h3>
            <span>衣物 / 洗法 / 入庫</span>
          </div>
          <button className="primary-action" type="button" onClick={addOrder}>新增送洗單</button>
          <div className="record-list">
            {orders.map((order) => (
              <article className="record-card" key={order.id}>
                <div>
                  <strong>{order.customer} · {order.item}</strong>
                  <p>{order.method} · {order.color} · 架位 {order.rack} · 應收 NT$ {order.amount} · 已收 NT$ {order.paid}</p>
                </div>
                <div className="status-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={order.status === status}
                      onClick={() => {
                        setOrders((rows) => rows.map((row) => (row.id === order.id ? { ...row, status, rack: status === "已入庫" ? "B-08" : row.rack } : row)));
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
            <h3>付款與報表</h3>
            <span>取件 / 支出 / 日報</span>
          </div>
          <div className="shop-actions">
            <button type="button" onClick={checkout}>取件付款</button>
            <button type="button" onClick={addExpense}>新增支出</button>
            <button type="button" onClick={() => setLogs((rows) => ["已產生營業日報與月報表。", ...rows])}>列印報表</button>
            <button type="button" onClick={() => setLogs((rows) => ["已完成資料備份與重整。", ...rows])}>資料備份</button>
          </div>
          <div className="tag-list">
            {[...itemTypes.slice(0, 3), ...methods.slice(0, 3), ...colors.slice(0, 2)].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="log-list">
            {logs.slice(0, 5).map((log) => <p key={log}>{log}</p>)}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>營業儀表板</h3>
            <span>日報指標</span>
          </div>
          <div className="metric-grid">
            <div><span>客戶數</span><strong>{customers.length}</strong></div>
            <div><span>送洗件數</span><strong>{orders.length}</strong></div>
            <div><span>今日支出</span><strong>{kpis.expense.toLocaleString("zh-TW")}</strong></div>
            <div><span>未收款</span><strong>{kpis.receivable.toLocaleString("zh-TW")}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
