"use client";

import { useMemo, useState } from "react";

type VisitStatus = "待確認" | "已確認" | "已到診" | "術後追蹤" | "定檢追蹤";

type Appointment = {
  id: number;
  patient: string;
  doctor: string;
  time: string;
  treatment: string;
  channel: string;
  status: VisitStatus;
  risk: number;
  note: string;
};

const statuses: VisitStatus[] = ["待確認", "已確認", "已到診", "術後追蹤", "定檢追蹤"];

const initialAppointments: Appointment[] = [
  { id: 1, patient: "林小姐", doctor: "陳醫師", time: "09:30", treatment: "洗牙定檢", channel: "線上預約", status: "已確認", risk: 18, note: "半年定檢，提醒帶健保卡" },
  { id: 2, patient: "王先生", doctor: "許醫師", time: "11:00", treatment: "植牙術後回診", channel: "LINE", status: "術後追蹤", risk: 38, note: "需追蹤腫脹與疼痛狀況" },
  { id: 3, patient: "張同學", doctor: "李醫師", time: "15:30", treatment: "矯正調線", channel: "櫃檯預約", status: "待確認", risk: 66, note: "上次曾臨時改約，需提前提醒" },
  { id: 4, patient: "黃太太", doctor: "陳醫師", time: "17:00", treatment: "美白諮詢", channel: "Google 預約", status: "定檢追蹤", risk: 24, note: "可推薦居家美白衛教" }
];

export default function DentalDemo({ logoUrl }: { logoUrl: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [form, setForm] = useState({
    patient: "吳先生",
    doctor: "周醫師",
    time: "14:00",
    treatment: "根管治療追蹤",
    channel: "LINE",
    note: "需提醒術前注意事項"
  });
  const [message, setMessage] = useState("請新增預約，或用按鈕調整患者狀態。");
  const [aiSummary, setAiSummary] = useState("AI 診所摘要尚未生成。");

  const metrics = useMemo(() => {
    const confirmed = appointments.filter((item) => item.status === "已確認" || item.status === "已到診").length;
    const care = appointments.filter((item) => item.status === "術後追蹤" || item.status === "定檢追蹤").length;
    const risk = appointments.filter((item) => item.risk >= 50).length;
    return { confirmed, care, risk };
  }, [appointments]);

  const riskList = useMemo(() => [...appointments].sort((a, b) => b.risk - a.risk), [appointments]);
  const careList = useMemo(
    () => appointments.filter((item) => item.status === "術後追蹤" || item.status === "定檢追蹤").slice(0, 4),
    [appointments]
  );

  function addAppointment() {
    const next: Appointment = {
      id: Date.now(),
      patient: form.patient || "未命名患者",
      doctor: form.doctor || "未指定醫師",
      time: form.time || "待安排",
      treatment: form.treatment || "一般約診",
      channel: form.channel,
      status: "待確認",
      risk: Math.min(88, Math.max(12, form.note.length * 3 + form.treatment.length * 2)),
      note: form.note || "無備註"
    };
    setAppointments((current) => [next, ...current]);
    setMessage(`已新增「${next.patient} / ${next.treatment}」，目前等待到診確認。`);
  }

  function moveStatus(id: number, direction: -1 | 1) {
    setAppointments((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const index = statuses.indexOf(item.status);
        const nextStatus = statuses[Math.min(Math.max(index + direction, 0), statuses.length - 1)];
        setMessage(`「${item.patient}」狀態已更新為：${nextStatus}`);
        return { ...item, status: nextStatus };
      })
    );
  }

  function sendCare(patient: string) {
    setMessage(`已模擬發送「${patient}」的 LINE 追蹤訊息與回診提醒。`);
  }

  function generateSummary() {
    const highRisk = riskList[0];
    setAiSummary(
      `今日共有 ${appointments.length} 筆預約，${metrics.confirmed} 筆已確認或到診，${metrics.care} 位患者需要術後或定檢追蹤。爽約風險最高的是「${highRisk.patient} / ${highRisk.treatment}」，建議櫃檯在看診前再次發送確認提醒。`
    );
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision" />
        <div className="metric"><span>今日預約</span><strong>{appointments.length}</strong></div>
        <div className="metric"><span>已確認/到診</span><strong>{metrics.confirmed}</strong></div>
        <div className="metric"><span>待追蹤患者</span><strong>{metrics.care}</strong></div>
        <div className="metric"><span>爽約風險</span><strong>{metrics.risk}</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>預約建立</span>
              <h3>新增患者約診</h3>
            </div>
          </div>
          <div className="form-grid">
            <input value={form.patient} onChange={(event) => setForm({ ...form, patient: event.target.value })} aria-label="患者姓名" />
            <input value={form.doctor} onChange={(event) => setForm({ ...form, doctor: event.target.value })} aria-label="看診醫師" />
            <input value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} aria-label="預約時間" />
            <select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} aria-label="預約來源">
              <option>線上預約</option>
              <option>LINE</option>
              <option>Google 預約</option>
              <option>櫃檯預約</option>
            </select>
            <input value={form.treatment} onChange={(event) => setForm({ ...form, treatment: event.target.value })} aria-label="療程項目" />
            <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} aria-label="患者備註" />
            <button type="button" onClick={addAppointment}>新增約診</button>
          </div>
          <p className="status-message">{message}</p>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <div>
              <span>AI 診所助理</span>
              <h3>今日營運摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button type="button" onClick={generateSummary}>生成 AI 診所摘要</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>追蹤名單</span>
              <h3>術後與定檢追蹤</h3>
            </div>
            <button className="care-button" type="button" onClick={() => setMessage("已模擬批次發送今日術後追蹤與定檢提醒。")}>
              批次發送追蹤提醒
            </button>
          </div>
          <div className="care-grid">
            {careList.map((item) => (
              <article className="care-card" key={item.id}>
                <span>{item.status}</span>
                <strong>{item.patient}</strong>
                <p>{item.treatment} / {item.note}</p>
                <button className="care-button" type="button" onClick={() => sendCare(item.patient)}>發送追蹤提醒</button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>約診列表</span>
              <h3>今日患者排程</h3>
            </div>
          </div>
          <div className="appointment-list">
            {appointments.map((item) => (
              <article className="appointment-card" key={item.id}>
                <span>{item.time} / {item.status}</span>
                <strong>{item.patient} · {item.treatment}</strong>
                <span>{item.doctor} · {item.channel}</span>
                <p>{item.note}</p>
                <div className="chip-row">
                  <em className="chip">風險 {item.risk}</em>
                  <em className="chip">{item.status}</em>
                </div>
                <div className="appointment-actions">
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
              <span>風險排序</span>
              <h3>爽約與追蹤優先序</h3>
            </div>
          </div>
          <div className="queue-list">
            {riskList.slice(0, 5).map((item) => (
              <article className="queue-card queue-row" key={item.id}>
                <strong>{item.patient}</strong>
                <div className="queue-track"><i style={{ width: `${item.risk}%` }} /></div>
                <span>{item.risk}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
