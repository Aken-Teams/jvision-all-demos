"use client";

import { FormEvent, useMemo, useState } from "react";

type RoomStatus = "可售" | "已入住" | "待清潔" | "維修中";
type BookingStatus = "已預訂" | "已入住" | "已退房";
type Room = { id: number; name: string; rate: number; status: RoomStatus };
type Booking = { id: number; guest: string; room: string; channel: string; status: BookingStatus };

const initialRooms: Room[] = [
  { id: 1, name: "海景雙人房 301", rate: 4200, status: "已入住" },
  { id: 2, name: "山景四人房 205", rate: 5600, status: "可售" },
  { id: 3, name: "標準雙床房 102", rate: 3200, status: "待清潔" },
];

const roomStatuses: RoomStatus[] = ["可售", "已入住", "待清潔", "維修中"];
const bookingStatuses: BookingStatus[] = ["已預訂", "已入住", "已退房"];

export function HospitalityDemo() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [bookings, setBookings] = useState<Booking[]>([
    { id: 1, guest: "林小姐", room: "海景雙人房 301", channel: "官網", status: "已入住" },
  ]);
  const [addons, setAddons] = useState(["林小姐 早餐加購 x2 NT$ 760"]);
  const [syncLog, setSyncLog] = useState(["Booking.com / Agoda / 官網庫存已同步"]);
  const [payments, setPayments] = useState(["林小姐 尾款 NT$ 3,200 已結清"]);

  const kpis = useMemo(() => {
    const occupied = rooms.filter((room) => room.status === "已入住").length;
    const available = rooms.filter((room) => room.status === "可售").length;
    const revenue = bookings.length * 4200 + addons.length * 760;
    const tasks = rooms.filter((room) => room.status === "待清潔" || room.status === "維修中").length;
    return { occupied, available, revenue, tasks };
  }, [addons.length, bookings.length, rooms]);

  function addBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBookings((rows) => [
      {
        id: Date.now(),
        guest: String(form.get("guest")),
        room: String(form.get("room")),
        channel: String(form.get("channel")),
        status: "已預訂",
      },
      ...rows,
    ]);
    event.currentTarget.reset();
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日營收預估</span>
          <strong>NT$ {kpis.revenue.toLocaleString("zh-TW")}</strong>
          <p>
            入住 {kpis.occupied} 間，可售 {kpis.available} 間，房務任務 {kpis.tasks} 件
          </p>
          <button
            type="button"
            onClick={() => setSyncLog((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 訂房平台 房價與庫存已同步`, ...rows])}
          >
            同步 訂房平台
          </button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>房況與房價控台</h3>
            <span>房況與房價控台</span>
          </div>
          <div className="unit-list">
            {rooms.map((room) => (
              <article className="unit-card" key={room.id}>
                <div>
                  <strong>{room.name}</strong>
                  <p>
                    NT$ {room.rate.toLocaleString("zh-TW")} · {room.status}
                  </p>
                </div>
                <div className="status-actions">
                  {roomStatuses.map((status) => (
                    <button
                      key={status}
                      disabled={room.status === status}
                      onClick={() => setRooms((rows) => rows.map((row) => (row.id === room.id ? { ...row, status } : row)))}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <button
                  className="inline-action"
                  type="button"
                  onClick={() => setRooms((rows) => rows.map((row) => (row.id === room.id ? { ...row, rate: row.rate + 300 } : row)))}
                >
                  旺日加價
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>官網與 訂房平台 訂單</h3>
            <span>Booking</span>
          </div>
          <form className="property-form" onSubmit={addBooking}>
            <input name="guest" required placeholder="旅客姓名" aria-label="旅客姓名" />
            <input name="room" required placeholder="房型房號" aria-label="房型房號" />
            <input name="channel" required placeholder="通路" aria-label="通路" />
            <button type="submit">新增訂房</button>
          </form>
          <div className="unit-list">
            {bookings.map((booking) => (
              <article className="unit-card" key={booking.id}>
                <div>
                  <strong>{booking.guest}</strong>
                  <p>
                    {booking.room} · {booking.channel} · {booking.status}
                  </p>
                </div>
                <div className="status-actions">
                  {bookingStatuses.map((status) => (
                    <button
                      key={status}
                      disabled={booking.status === status}
                      onClick={() => setBookings((rows) => rows.map((row) => (row.id === booking.id ? { ...row, status } : row)))}
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
            <h3>加購服務</h3>
            <span>Add-ons</span>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={() => setAddons((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 加購接駁服務 NT$ 1,200`, ...rows])}
          >
            新增加購
          </button>
          <div className="tag-list">
            {addons.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>通路同步紀錄</h3>
            <span>Channel Manager</span>
          </div>
          <div className="tag-list">
            {syncLog.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>營收與結算</h3>
            <span>Revenue</span>
          </div>
          <div className="metric-grid">
            <div>
              <span>營收</span>
              <strong>NT$ {kpis.revenue.toLocaleString("zh-TW")}</strong>
            </div>
            <div>
              <span>入住</span>
              <strong>{kpis.occupied}</strong>
            </div>
            <div>
              <span>可售</span>
              <strong>{kpis.available}</strong>
            </div>
            <div>
              <span>房務任務</span>
              <strong>{kpis.tasks}</strong>
            </div>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={() => setPayments((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 訂房平台 佣金扣除後 NT$ 8,420 已入帳`, ...rows])}
          >
            新增結算
          </button>
          <div className="tag-list">
            {payments.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
