"use client";

import { FormEvent, useMemo, useState } from "react";

type BookingStatus = "待確認" | "已確認" | "入住中" | "已完成";
type Booking = {
  id: number;
  pet: string;
  parent: string;
  service: string;
  date: string;
  addOn: string;
  room: string;
  status: BookingStatus;
};
type Product = { id: number; name: string; price: number; qty: number };

const services = ["寵物安親", "寵物美容", "寵物旅館", "健康課程"];
const statuses: BookingStatus[] = ["待確認", "已確認", "入住中", "已完成"];
const rooms = ["陽光房 A", "貓咪房 B", "安靜房 C", "活動室 D"];

export function PetBookingDemo() {
  const [bookings, setBookings] = useState<Booking[]>([
    { id: 1, pet: "抹茶", parent: "Jason", service: "寵物旅館", date: "2026-07-04", addOn: "健康鮮食", room: "陽光房 A", status: "已確認" },
    { id: 2, pet: "Momo", parent: "Kelly", service: "寵物美容", date: "2026-07-05", addOn: "護毛精華", room: "美容台 2", status: "待確認" },
    { id: 3, pet: "BOBO", parent: "Anna", service: "寵物安親", date: "2026-07-05", addOn: "玩具組", room: "活動室 D", status: "入住中" },
  ]);
  const [cart, setCart] = useState<Product[]>([
    { id: 1, name: "健康鮮食", price: 180, qty: 2 },
    { id: 2, name: "舒眠毯", price: 480, qty: 1 },
  ]);
  const [notes, setNotes] = useState<string[]>([
    "已通知 Jason：抹茶 7/4 入住，請攜帶慣用飼料。",
    "BOBO 今日散步 20 分鐘，用餐正常。",
  ]);

  const kpis = useMemo(() => {
    const active = bookings.filter((row) => row.status === "入住中").length;
    const pending = bookings.filter((row) => row.status === "待確認").length;
    const revenue =
      bookings.length * 900 + cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    return { active, pending, revenue };
  }, [bookings, cart]);

  function addBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const pet = String(form.get("pet"));
    const parent = String(form.get("parent"));
    const service = String(form.get("service"));
    setBookings((rows) => [
      {
        id: Date.now(),
        pet,
        parent,
        service,
        date: String(form.get("date")),
        addOn: String(form.get("addOn")),
        room: rooms[rows.length % rooms.length],
        status: "待確認",
      },
      ...rows,
    ]);
    setNotes((rows) => [`新增 ${pet} 的 ${service} 預約，等待櫃台確認。`, ...rows]);
    event.currentTarget.reset();
  }

  function addProduct(name: string, price: number) {
    setCart((rows) => {
      const existing = rows.find((row) => row.name === name);
      if (existing) return rows.map((row) => (row.name === name ? { ...row, qty: row.qty + 1 } : row));
      return [{ id: Date.now(), name, price, qty: 1 }, ...rows];
    });
    setNotes((rows) => [`已加入加購商品：${name}。`, ...rows]);
  }

  function notifyParent() {
    const booking = bookings[0];
    setNotes((rows) => [`已傳送通知給 ${booking.parent}：${booking.pet} 今日照護狀態正常。`, ...rows]);
  }

  return (
    <div className="booking-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日營運</span>
          <strong>{bookings.length} 筆預約</strong>
          <p>
            入住中 {kpis.active} 位，待確認 {kpis.pending} 筆，預估營收 NT$ {kpis.revenue.toLocaleString("zh-TW")}。
          </p>
          <button type="button" onClick={notifyParent}>
            傳送照護通知
          </button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel booking-panel">
          <div className="panel-heading">
            <h3>線上預約</h3>
            <span>服務與毛孩資料</span>
          </div>
          <form className="booking-form" onSubmit={addBooking}>
            <input name="pet" required placeholder="毛孩名字" aria-label="毛孩名字" suppressHydrationWarning />
            <input name="parent" required placeholder="家長姓名" aria-label="家長姓名" suppressHydrationWarning />
            <select name="service" required aria-label="服務類別" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>
                選擇服務
              </option>
              {services.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
            <input name="date" required type="date" aria-label="預約日期" suppressHydrationWarning />
            <input name="addOn" required placeholder="加購或備註" aria-label="加購或備註" suppressHydrationWarning />
            <button type="submit">建立預約</button>
          </form>
          <div className="record-list">
            {bookings.map((booking) => (
              <article className="record-card" key={booking.id}>
                <div>
                  <strong>
                    {booking.pet} · {booking.service}
                  </strong>
                  <p>
                    {booking.parent} · {booking.date} · {booking.room} · 加購：{booking.addOn}
                  </p>
                </div>
                <div className="status-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={booking.status === status}
                      onClick={() => {
                        setBookings((rows) => rows.map((row) => (row.id === booking.id ? { ...row, status } : row)));
                        setNotes((rows) => [`${booking.pet} 狀態更新為 ${status}。`, ...rows]);
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
            <h3>商品加購</h3>
            <span>預約同步結帳</span>
          </div>
          <div className="shop-actions">
            <button type="button" onClick={() => addProduct("健康鮮食", 180)}>健康鮮食</button>
            <button type="button" onClick={() => addProduct("舒眠毯", 480)}>舒眠毯</button>
            <button type="button" onClick={() => addProduct("玩具組", 320)}>玩具組</button>
            <button type="button" onClick={() => addProduct("護毛精華", 260)}>護毛精華</button>
          </div>
          <div className="tag-list">
            {cart.map((item) => (
              <span key={item.id}>
                {item.name} x {item.qty} · NT$ {(item.price * item.qty).toLocaleString("zh-TW")}
              </span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>照護通知</h3>
            <span>家長訊息紀錄</span>
          </div>
          <button className="primary-action" type="button" onClick={notifyParent}>
            新增通知紀錄
          </button>
          <div className="log-list">
            {notes.slice(0, 6).map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>營運儀表板</h3>
            <span>即時狀態</span>
          </div>
          <div className="metric-grid">
            <div>
              <span>今日預約</span>
              <strong>{bookings.length}</strong>
            </div>
            <div>
              <span>入住中</span>
              <strong>{kpis.active}</strong>
            </div>
            <div>
              <span>待確認</span>
              <strong>{kpis.pending}</strong>
            </div>
            <div>
              <span>預估營收</span>
              <strong>{kpis.revenue.toLocaleString("zh-TW")}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
