"use client";

import { FormEvent, useMemo, useState } from "react";

type BookingStatus = "已預約" | "已到店" | "服務中" | "已結帳";
type Client = { id: number; name: string; phone: string; tier: string; preference: string; points: number };
type Booking = { id: number; client: string; service: string; staff: string; room: string; time: string; price: number; paid: number; status: BookingStatus };
type Message = { id: number; target: string; title: string; status: string };

const bookingStatuses: BookingStatus[] = ["已預約", "已到店", "服務中", "已結帳"];
const services = ["頭皮護理", "深層臉部保養", "精油按摩", "美甲凝膠", "醫美諮詢", "男士修容"];
const staff = ["Mia", "Evan", "Ivy", "Noah", "Tina"];

export function SelfCareDemo() {
  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: "林小姐", phone: "0912-100-200", tier: "金卡會員", preference: "偏好安靜房與低敏精油", points: 1280 },
    { id: 2, name: "陳先生", phone: "0922-300-500", tier: "一般會員", preference: "週五晚上可預約", points: 360 },
    { id: 3, name: "王小姐", phone: "0933-888-168", tier: "套票會員", preference: "美甲指定 Ivy", points: 760 },
  ]);
  const [bookings, setBookings] = useState<Booking[]>([
    { id: 1, client: "林小姐", service: "深層臉部保養", staff: "Mia", room: "A2", time: "14:30", price: 3600, paid: 0, status: "已到店" },
    { id: 2, client: "陳先生", service: "男士修容", staff: "Evan", room: "B1", time: "16:00", price: 1800, paid: 1800, status: "已結帳" },
    { id: 3, client: "王小姐", service: "美甲凝膠", staff: "Ivy", room: "Nail 3", time: "17:30", price: 2200, paid: 600, status: "已預約" },
  ]);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, target: "沉睡客戶", title: "三個月未回訪優惠", status: "排程中" },
    { id: 2, target: "金卡會員", title: "生日禮遇提醒", status: "已發送" },
  ]);
  const [logs, setLogs] = useState<string[]>(["今日預約、客戶檔案、POS 結帳與回訪訊息已同步。"]);

  const kpis = useMemo(() => {
    const revenue = bookings.reduce((sum, row) => sum + row.paid, 0);
    const deposit = bookings.reduce((sum, row) => sum + Math.max(0, row.price - row.paid), 0);
    const checkedIn = bookings.filter((row) => row.status === "已到店" || row.status === "服務中").length;
    const complete = bookings.filter((row) => row.status === "已結帳").length;
    return { revenue, deposit, checkedIn, complete, messages: messages.length };
  }, [bookings, messages.length]);

  function addBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const client = String(form.get("client"));
    const service = String(form.get("service"));
    const price = Number(form.get("price"));
    setBookings((rows) => [
      { id: Date.now(), client, service, staff: String(form.get("staff")), room: "候補安排", time: String(form.get("time")), price, paid: Math.round(price * 0.2), status: "已預約" },
      ...rows,
    ]);
    setLogs((rows) => [`${client} 已完成線上預約 ${service}，系統自動收取 20% 訂金。`, ...rows]);
    event.currentTarget.reset();
  }

  function addClientNote() {
    const client = clients[0];
    setClients((rows) => rows.map((row) => row.id === client.id ? { ...row, preference: "剛完成諮詢表單：偏乾膚質，需避開果酸類產品。" } : row));
    setLogs((rows) => [`${client.name} 客戶檔案已更新表單與服務偏好。`, ...rows]);
  }

  function checkout() {
    const booking = bookings.find((row) => row.status !== "已結帳") || bookings[0];
    setBookings((rows) => rows.map((row) => row.id === booking.id ? { ...row, paid: row.price, status: "已結帳" } : row));
    setClients((rows) => rows.map((row) => row.name === booking.client ? { ...row, points: row.points + Math.round(booking.price / 10) } : row));
    setLogs((rows) => [`${booking.client} 已完成 POS 結帳，會員點數已自動累積。`, ...rows]);
  }

  function sendCampaign() {
    setMessages((rows) => [{ id: Date.now(), target: "未回訪客戶", title: "療程後 14 天回訪提醒", status: "已發送" }, ...rows]);
    setLogs((rows) => ["已發送療程後 14 天回訪訊息，並加入下次預約連結。", ...rows]);
  }

  return (
    <div className="dispatch-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日體驗營運</span>
          <strong>NT$ {kpis.revenue.toLocaleString("zh-TW")}</strong>
          <div className="ops-status-list" aria-label="今日美業預約營運指標">
            <p><span>到店服務中</span><b>{kpis.checkedIn} 位</b></p>
            <p><span>未收尾款</span><b>NT$ {kpis.deposit.toLocaleString("zh-TW")}</b></p>
            <p><span>回訪訊息</span><b>{kpis.messages} 則</b></p>
          </div>
          <button type="button" onClick={checkout}>快速 POS 結帳</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel worker-panel">
          <div className="panel-heading">
            <h3>自助預約與智慧排班</h3>
            <span>服務 / 員工 / 房間</span>
          </div>
          <form className="dispatch-form" onSubmit={addBooking}>
            <input name="client" required placeholder="客戶姓名" aria-label="客戶姓名" suppressHydrationWarning />
            <select name="service" required aria-label="服務項目" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>服務項目</option>
              {services.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select name="staff" required aria-label="服務人員" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>服務人員</option>
              {staff.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input name="time" required placeholder="預約時間 18:30" aria-label="預約時間" suppressHydrationWarning />
            <input name="price" required type="number" min="1" placeholder="服務金額" aria-label="服務金額" suppressHydrationWarning />
            <button type="submit">新增預約</button>
          </form>
          <div className="record-list">
            {bookings.map((booking) => (
              <article className="record-card" key={booking.id}>
                <div>
                  <strong>{booking.client} · {booking.service}</strong>
                  <p>{booking.staff} · {booking.room} · {booking.time} · 應收 NT$ {booking.price.toLocaleString("zh-TW")} · 已收 NT$ {booking.paid.toLocaleString("zh-TW")}</p>
                </div>
                <div className="status-actions">
                  {bookingStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={booking.status === status}
                      onClick={() => {
                        setBookings((rows) => rows.map((row) => (row.id === booking.id ? { ...row, status } : row)));
                        setLogs((rows) => [`${booking.client} 的 ${booking.service} 狀態更新為 ${status}。`, ...rows]);
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
            <h3>客戶檔案與表單紀錄</h3>
            <span>偏好 / 表單 / 照片</span>
          </div>
          <button className="primary-action" type="button" onClick={addClientNote}>更新諮詢表單</button>
          <div className="record-list">
            {clients.map((client) => (
              <article className="record-card" key={client.id}>
                <div>
                  <strong>{client.name} · {client.tier}</strong>
                  <p>{client.phone} · {client.preference} · 點數 {client.points.toLocaleString("zh-TW")}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>POS 會員與行銷訊息</h3>
            <span>付款 / 點數 / 回訪</span>
          </div>
          <div className="shop-actions">
            <button type="button" onClick={checkout}>完成結帳</button>
            <button type="button" onClick={sendCampaign}>發送回訪</button>
            <button type="button" onClick={() => setLogs((rows) => ["已套用會員方案：精油按摩 6 堂套票。", ...rows])}>套用會員方案</button>
            <button type="button" onClick={() => setLogs((rows) => ["已新增候補客戶，若時段釋出會自動通知。", ...rows])}>加入候補</button>
          </div>
          <div className="tag-list">
            {messages.map((message) => <span key={message.id}>{message.target} · {message.title} · {message.status}</span>)}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>多店營運儀表板</h3>
            <span>預約 / 留存 / 營收</span>
          </div>
          <div className="metric-grid">
            <div><span>預約數</span><strong>{bookings.length}</strong></div>
            <div><span>已結帳</span><strong>{kpis.complete}</strong></div>
            <div><span>會員數</span><strong>{clients.length}</strong></div>
            <div><span>訊息數</span><strong>{messages.length}</strong></div>
          </div>
          <div className="log-list">
            {logs.slice(0, 5).map((log) => <p key={log}>{log}</p>)}
          </div>
        </section>
      </div>
    </div>
  );
}
