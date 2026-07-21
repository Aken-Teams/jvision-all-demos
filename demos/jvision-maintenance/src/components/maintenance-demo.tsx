"use client";

import { useMemo, useState } from "react";

type Stage = "待派工" | "處理中" | "待驗收" | "已完成";
type Priority = "高" | "中" | "低";

type Ticket = {
  id: number;
  equipment: string;
  issue: string;
  area: string;
  owner: string;
  priority: Priority;
  downtime: number;
  stage: Stage;
  due: string;
};

type Equipment = {
  code: string;
  name: string;
  area: string;
  mtbf: number;
  mttr: number;
  nextService: string;
  health: number;
};

const stages: Stage[] = ["待派工", "處理中", "待驗收", "已完成"];

const initialTickets: Ticket[] = [
  { id: 1001, equipment: "CNC-03", issue: "主軸溫度偏高", area: "加工一線", owner: "Leo", priority: "高", downtime: 2.5, stage: "處理中", due: "7/02" },
  { id: 1002, equipment: "PACK-02", issue: "封口壓力不穩", area: "包裝線", owner: "Mia", priority: "中", downtime: 1.2, stage: "待派工", due: "7/03" },
  { id: 1003, equipment: "AOI-01", issue: "影像校正後待驗收", area: "檢測站", owner: "Nina", priority: "中", downtime: 0.8, stage: "待驗收", due: "7/01" },
  { id: 1004, equipment: "AIR-05", issue: "空壓機例行保養", area: "公用設備", owner: "Ryan", priority: "低", downtime: 0.4, stage: "已完成", due: "7/05" }
];

const equipmentList: Equipment[] = [
  { code: "CNC-03", name: "五軸加工機", area: "加工一線", mtbf: 186, mttr: 3.2, nextService: "7/04", health: 68 },
  { code: "PACK-02", name: "自動包裝機", area: "包裝線", mtbf: 242, mttr: 2.1, nextService: "7/03", health: 74 },
  { code: "AOI-01", name: "光學檢測機", area: "檢測站", mtbf: 318, mttr: 1.6, nextService: "7/08", health: 86 },
  { code: "AIR-05", name: "空壓機", area: "公用設備", mtbf: 410, mttr: 1.2, nextService: "7/12", health: 91 }
];

function priorityScore(priority: Priority) {
  return priority === "高" ? 3 : priority === "中" ? 2 : 1;
}

export default function MaintenanceDemo({ logoUrl }: { logoUrl: string }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [form, setForm] = useState({
    equipment: "CNC-03",
    issue: "異音與震動偏高",
    area: "加工一線",
    owner: "Ariel",
    priority: "高" as Priority,
    downtime: "1.5",
    due: "7/06"
  });
  const [message, setMessage] = useState("請新增維修請求或移動工單狀態，系統會即時更新維護看板與統計。");
  const [aiSummary, setAiSummary] = useState("AI 維護摘要尚未產生。");

  const metrics = useMemo(() => {
    const active = tickets.filter((ticket) => ticket.stage !== "已完成").length;
    const high = tickets.filter((ticket) => ticket.priority === "高" && ticket.stage !== "已完成").length;
    const downtime = tickets.reduce((sum, ticket) => sum + (ticket.stage === "已完成" ? 0 : ticket.downtime), 0);
    const completion = Math.round((tickets.filter((ticket) => ticket.stage === "已完成").length / tickets.length) * 100);
    return { active, high, downtime, completion };
  }, [tickets]);

  const riskTickets = useMemo(
    () => [...tickets].filter((ticket) => ticket.stage !== "已完成").sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority) || b.downtime - a.downtime),
    [tickets]
  );

  function addTicket() {
    const downtime = Number(form.downtime);
    if (!form.equipment || !form.issue || !Number.isFinite(downtime) || downtime < 0) {
      setMessage("請確認設備、異常內容與預估停機時間都已正確填寫。");
      return;
    }
    const next: Ticket = {
      id: Date.now(),
      equipment: form.equipment,
      issue: form.issue,
      area: form.area || "未指定區域",
      owner: form.owner || "待派工",
      priority: form.priority,
      downtime,
      stage: "待派工",
      due: form.due || "待排程"
    };
    setTickets((current) => [next, ...current]);
    setMessage(`${next.equipment} 的維修請求已建立，系統已放入待派工看板。`);
  }

  function moveTicket(id: number, direction: -1 | 1) {
    setTickets((current) =>
      current.map((ticket) => {
        if (ticket.id !== id) return ticket;
        const index = stages.indexOf(ticket.stage);
        const nextStage = stages[Math.min(Math.max(index + direction, 0), stages.length - 1)];
        setMessage(`${ticket.equipment} 已移動到「${nextStage}」。`);
        return { ...ticket, stage: nextStage };
      })
    );
  }

  function createSchedule() {
    const next = equipmentList
      .filter((equipment) => equipment.health < 80)
      .map((equipment) => `${equipment.code} ${equipment.nextService}`)
      .join("、");
    setMessage(next ? `已依健康分數建立預防保養提醒：${next}。` : "目前設備健康分數良好，維持既有保養週期。");
  }

  function generateAiSummary() {
    const top = riskTickets[0];
    const healthRisk = [...equipmentList].sort((a, b) => a.health - b.health)[0];
    setAiSummary(
      top
        ? `目前有 ${metrics.active} 張未完成工單，預估停機 ${metrics.downtime.toFixed(1)} 小時。優先處理 ${top.equipment}「${top.issue}」，同時安排 ${healthRisk.code} 的預防保養，避免健康分數 ${healthRisk.health}% 持續下滑。`
        : `目前沒有未完成維修工單，保養完成率 ${metrics.completion}%。建議維持本週巡檢並追蹤 MTBF 趨勢。`
    );
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision" />
        <div className="metric"><span>未完成工單</span><strong>{metrics.active}</strong></div>
        <div className="metric"><span>高優先</span><strong>{metrics.high}</strong></div>
        <div className="metric"><span>預估停機</span><strong>{metrics.downtime.toFixed(1)}h</strong></div>
        <div className="metric"><span>完成率</span><strong>{metrics.completion}%</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>維修請求</span>
              <h3>新增設備異常</h3>
            </div>
          </div>
          <div className="form-grid">
            <input value={form.equipment} onChange={(event) => setForm({ ...form, equipment: event.target.value })} aria-label="設備編號" />
            <input value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} aria-label="異常內容" />
            <input value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} aria-label="區域" />
            <input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} aria-label="負責人" />
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })} aria-label="優先度">
              <option>高</option>
              <option>中</option>
              <option>低</option>
            </select>
            <input value={form.downtime} onChange={(event) => setForm({ ...form, downtime: event.target.value })} aria-label="預估停機小時" />
            <input value={form.due} onChange={(event) => setForm({ ...form, due: event.target.value })} aria-label="期限" />
            <button type="button" onClick={addTicket}>新增維修請求</button>
          </div>
          <p className="status-message">{message}</p>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <div>
              <span>Jvision AI</span>
              <h3>維護行動摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button className="scan-button" type="button" onClick={generateAiSummary}>生成 AI 維護摘要</button>
          <button className="portal-button full-button" type="button" onClick={createSchedule}>建立預防保養提醒</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>維修看板</span>
              <h3>工單狀態追蹤</h3>
            </div>
          </div>
          <div className="kanban-grid">
            {stages.map((stage) => (
              <div className="kanban-column" key={stage}>
                <h4>{stage}</h4>
                {tickets.filter((ticket) => ticket.stage === stage).map((ticket) => (
                  <article className="ticket-card" key={ticket.id}>
                    <span>{ticket.area} · {ticket.due}</span>
                    <strong>{ticket.equipment}</strong>
                    <p>{ticket.issue}</p>
                    <div className="chip-row">
                      <em className={`pill ${ticket.priority === "高" ? "danger" : ticket.priority === "中" ? "warn" : ""}`}>{ticket.priority}優先</em>
                      <em className="pill">{ticket.owner}</em>
                      <em className="pill">{ticket.downtime}h</em>
                    </div>
                    <div className="ticket-actions">
                      <button type="button" onClick={() => moveTicket(ticket.id, -1)} aria-label="往前一階段">←</button>
                      <button type="button" onClick={() => moveTicket(ticket.id, 1)} aria-label="往後一階段">→</button>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>設備績效</span>
              <h3>MTBF / MTTR</h3>
            </div>
          </div>
          <div className="equipment-list">
            {equipmentList.map((equipment) => (
              <article key={equipment.code}>
                <div>
                  <strong>{equipment.code}</strong>
                  <span>{equipment.name} · {equipment.area}</span>
                </div>
                <b>MTBF {equipment.mtbf}h</b>
                <b>MTTR {equipment.mttr}h</b>
                <i><span style={{ width: `${equipment.health}%` }} /></i>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>保養日曆</span>
              <h3>本週預防保養</h3>
            </div>
          </div>
          <div className="calendar-list">
            {equipmentList.map((equipment) => (
              <article key={equipment.code}>
                <strong>{equipment.nextService}</strong>
                <span>{equipment.code} · {equipment.name}</span>
                <b>{equipment.health < 75 ? "需優先" : "例行"}</b>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
