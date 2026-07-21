"use client";

import { useMemo, useState } from "react";

type VisitStatus = "待確認" | "已預約" | "驗光完成" | "配鏡取件" | "回訪追蹤";

type Booking = {
  id: number;
  customer: string;
  optometrist: string;
  time: string;
  service: string;
  product: string;
  status: VisitStatus;
  risk: number;
  priorityReason: string;
  note: string;
};

const statuses: VisitStatus[] = ["待確認", "已預約", "驗光完成", "配鏡取件", "回訪追蹤"];

const initialBookings: Booking[] = [
  { id: 1, customer: "王小姐", optometrist: "陳驗光師", time: "10:00", service: "成人驗光", product: "漸進多焦", status: "回訪追蹤", risk: 26, priorityReason: "配戴滿 30 天，需確認適應狀況", note: "配戴滿 30 天，需確認適應狀況" },
  { id: 2, customer: "林先生", optometrist: "周驗光師", time: "13:30", service: "隱形眼鏡評估", product: "日拋隱眼", status: "已預約", risk: 42, priorityReason: "曾詢問散光日拋，可提醒商城補貨", note: "上次詢問散光日拋，可推薦商城補貨" },
  { id: 3, customer: "張同學", optometrist: "陳驗光師", time: "15:00", service: "兒童視力檢查", product: "防控鏡片", status: "待確認", risk: 68, priorityReason: "家長尚未確認到店時間", note: "家長尚未確認到店時間" },
  { id: 4, customer: "黃太太", optometrist: "李驗光師", time: "18:00", service: "取件服務", product: "防藍光鏡片", status: "配鏡取件", risk: 18, priorityReason: "已取件，可邀請 Google 好評", note: "可邀請 Google 好評" }
];

function getPriorityReason(status: VisitStatus, service: string, product: string, note: string) {
  if (status === "待確認") return "尚未確認到店時間，建議先發 LINE 提醒";
  if (status === "回訪追蹤") return "已到回訪週期，建議確認配戴舒適度";
  if (status === "配鏡取件") return "已完成服務，可邀請好評或提醒保養";
  if (service.includes("隱形")) return `可提醒 ${product} 回購或商城補貨`;
  return note || "建議例行提醒，維持顧客互動";
}

export default function OpticalDemo({ logoUrl }: { logoUrl: string }) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [form, setForm] = useState({
    customer: "吳小姐",
    optometrist: "林驗光師",
    time: "16:30",
    service: "配鏡諮詢",
    product: "抗疲勞鏡片",
    note: "第一次到店，想了解電腦族鏡片"
  });
  const [message, setMessage] = useState("請新增驗光預約，或用按鈕更新服務狀態。");
  const [aiSummary, setAiSummary] = useState("AI 門市摘要尚未生成。");

  const metrics = useMemo(() => {
    const follow = bookings.filter((item) => item.status === "回訪追蹤").length;
    const pending = bookings.filter((item) => item.status === "待確認").length;
    const review = bookings.filter((item) => item.status === "配鏡取件").length;
    return { follow, pending, review };
  }, [bookings]);

  const riskList = useMemo(() => [...bookings].sort((a, b) => b.risk - a.risk), [bookings]);
  const followList = useMemo(
    () => bookings.filter((item) => item.status === "回訪追蹤" || item.status === "配鏡取件").slice(0, 4),
    [bookings]
  );

  function addBooking() {
    const next: Booking = {
      id: Date.now(),
      customer: form.customer || "未命名顧客",
      optometrist: form.optometrist || "未指定驗光師",
      time: form.time || "待安排",
      service: form.service || "一般服務",
      product: form.product || "待確認商品",
      status: "待確認",
      risk: Math.min(88, Math.max(12, form.note.length * 2 + form.product.length * 3)),
      priorityReason: getPriorityReason("待確認", form.service, form.product, form.note),
      note: form.note || "無備註"
    };
    setBookings((current) => [next, ...current]);
    setMessage(`已新增「${next.customer} / ${next.service}」，目前等待預約確認。`);
  }

  function moveStatus(id: number, direction: -1 | 1) {
    setBookings((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const index = statuses.indexOf(item.status);
        const nextStatus = statuses[Math.min(Math.max(index + direction, 0), statuses.length - 1)];
        setMessage(`「${item.customer}」狀態已更新為：${nextStatus}`);
        return { ...item, status: nextStatus };
      })
    );
  }

  function sendLine(customer: string) {
    setMessage(`已模擬發送「${customer}」的 LINE 回訪訊息與好評邀請。`);
  }

  function generateSummary() {
    const highRisk = riskList[0];
    setAiSummary(
      `今日共有 ${bookings.length} 筆門市服務，${metrics.pending} 筆待確認，${metrics.follow} 位顧客需要回訪追蹤。最需要優先提醒的是「${highRisk.customer} / ${highRisk.service}」，原因是：${highRisk.priorityReason}。`
    );
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision" />
        <div className="metric"><span>今日預約</span><strong>{bookings.length}</strong></div>
        <div className="metric"><span>待確認</span><strong>{metrics.pending}</strong></div>
        <div className="metric"><span>回訪追蹤</span><strong>{metrics.follow}</strong></div>
        <div className="metric"><span>好評邀請</span><strong>{metrics.review}</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>預約建立</span>
              <h3>新增驗光預約</h3>
            </div>
          </div>
          <div className="form-grid">
            <input value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} aria-label="顧客姓名" />
            <input value={form.optometrist} onChange={(event) => setForm({ ...form, optometrist: event.target.value })} aria-label="驗光師" />
            <input value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} aria-label="預約時間" />
            <select value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })} aria-label="服務項目">
              <option>成人驗光</option>
              <option>兒童視力檢查</option>
              <option>隱形眼鏡評估</option>
              <option>配鏡諮詢</option>
              <option>取件服務</option>
            </select>
            <input value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} aria-label="商品偏好" />
            <input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} aria-label="顧客備註" />
            <button type="button" onClick={addBooking}>新增預約</button>
          </div>
          <p className="status-message">{message}</p>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <div>
              <span>AI 門市助理</span>
              <h3>今日營運摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button type="button" onClick={generateSummary}>生成 AI 門市摘要</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>回訪名單</span>
              <h3>配鏡追蹤與好評邀請</h3>
            </div>
            <button className="line-button" type="button" onClick={() => setMessage("已模擬批次發送配戴追蹤、保養提醒與好評邀請。")}>
              批次發送 LINE 訊息
            </button>
          </div>
          <div className="follow-grid">
            {followList.map((item) => (
              <article className="follow-card" key={item.id}>
                <span>{item.status}</span>
                <strong>{item.customer}</strong>
                <p>{item.product} / {item.note}</p>
                <button className="line-button" type="button" onClick={() => sendLine(item.customer)}>發送 LINE 訊息</button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>預約列表</span>
              <h3>今日門市排程</h3>
            </div>
          </div>
          <div className="booking-list">
            {bookings.map((item) => (
              <article className="booking-card" key={item.id}>
                <span>{item.time} / {item.status}</span>
                <strong>{item.customer} · {item.service}</strong>
                <span>{item.optometrist} · {item.product}</span>
                <p>{item.note}</p>
                <div className="chip-row">
                  <em className="chip">提醒優先度 {item.risk}</em>
                  <em className="chip">{item.status}</em>
                </div>
                <div className="booking-actions">
                  <button type="button" onClick={() => moveStatus(item.id, -1)}>退回上一狀態</button>
                  <button type="button" onClick={() => moveStatus(item.id, 1)}>更新下一狀態</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>優先處理</span>
              <h3>優先提醒名單</h3>
            </div>
          </div>
          <div className="risk-list">
            {riskList.slice(0, 5).map((item) => (
              <article className="risk-card risk-row" key={item.id}>
                <div>
                  <strong>{item.customer}</strong>
                  <p>{item.service} / {item.status}</p>
                  <span>{item.priorityReason}</span>
                </div>
                <div className="risk-track"><i style={{ width: `${item.risk}%` }} /></div>
                <span>{item.risk} 分</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
