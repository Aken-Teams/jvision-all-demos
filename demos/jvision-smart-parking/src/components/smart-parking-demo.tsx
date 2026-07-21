"use client";

import { FormEvent, useMemo, useState } from "react";

type SpaceStatus = "空位" | "佔用" | "保留" | "異常";
type VehicleType = "一般" | "月租" | "VIP" | "訪客" | "EV";
type Vehicle = { id: number; plate: string; type: VehicleType; gate: string; time: string; allowed: boolean };
type Space = { id: number; zone: string; code: string; type: "一般" | "EV" | "VIP"; status: SpaceStatus; lock: "升起" | "降下" };
type EventItem = { id: number; type: string; location: string; status: "新事件" | "處理中" | "已結案" };

const spaceStatuses: SpaceStatus[] = ["空位", "佔用", "保留", "異常"];

export function SmartParkingDemo() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: 1, plate: "ABC-1688", type: "月租", gate: "入口 A", time: "10:21", allowed: true },
    { id: 2, plate: "EVP-0520", type: "EV", gate: "入口 B", time: "10:34", allowed: true },
    { id: 3, plate: "ZZZ-9988", type: "訪客", gate: "入口 A", time: "10:48", allowed: false },
  ]);
  const [spaces, setSpaces] = useState<Space[]>([
    { id: 1, zone: "B1", code: "A-012", type: "一般", status: "空位", lock: "降下" },
    { id: 2, zone: "B1", code: "E-003", type: "EV", status: "佔用", lock: "降下" },
    { id: 3, zone: "B2", code: "V-008", type: "VIP", status: "保留", lock: "升起" },
    { id: 4, zone: "B2", code: "A-089", type: "一般", status: "異常", lock: "降下" },
  ]);
  const [events, setEvents] = useState<EventItem[]>([
    { id: 1, type: "違規停車", location: "B2 A-089", status: "處理中" },
    { id: 2, type: "人員徘徊", location: "B1 電梯廳", status: "新事件" },
  ]);
  const [logs, setLogs] = useState<string[]>(["系統已同步入口車牌辨識與 B1/B2 車位狀態。"]);

  const kpis = useMemo(() => {
    const vacant = spaces.filter((row) => row.status === "空位").length;
    const ev = spaces.filter((row) => row.type === "EV").length;
    const vip = spaces.filter((row) => row.type === "VIP").length;
    const denied = vehicles.filter((row) => !row.allowed).length;
    return { vacant, ev, vip, denied, events: events.length };
  }, [events.length, spaces, vehicles]);

  function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const plate = String(form.get("plate")).toUpperCase();
    const type = String(form.get("type")) as VehicleType;
    const allowed = type !== "訪客" || plate.startsWith("VIP");
    setVehicles((rows) => [
      { id: Date.now(), plate, type, gate: String(form.get("gate")), time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }), allowed },
      ...rows,
    ]);
    setLogs((rows) => [`車牌 ${plate} 已辨識，${allowed ? "允許進場" : "需人工確認"}。`, ...rows]);
    event.currentTarget.reset();
  }

  function guideVehicle() {
    const target = spaces.find((row) => row.status === "空位") || spaces[0];
    setLogs((rows) => [`已導引車輛前往 ${target.zone} ${target.code}。`, ...rows]);
  }

  function toggleEvLock() {
    setSpaces((rows) => rows.map((row) => row.type === "EV" ? { ...row, lock: row.lock === "升起" ? "降下" : "升起" } : row));
    setLogs((rows) => ["電動車位地鎖狀態已更新。", ...rows]);
  }

  function addSecurityEvent(type: string) {
    setEvents((rows) => [{ id: Date.now(), type, location: "B1 車道", status: "新事件" }, ...rows]);
    setLogs((rows) => [`新增安全事件：${type}。`, ...rows]);
  }

  return (
    <div className="dispatch-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>停車場即時狀態</span>
          <strong>{kpis.vacant} 格空位</strong>
          <div className="ops-status-list" aria-label="停車場即時指標">
            <p><span>EV 車位</span><b>{kpis.ev} 格</b></p>
            <p><span>VIP 車位</span><b>{kpis.vip} 格</b></p>
            <p><span>待確認車輛</span><b>{kpis.denied} 台</b></p>
          </div>
          <button type="button" onClick={guideVehicle}>AI 導引空位</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel worker-panel">
          <div className="panel-heading">
            <h3>車牌辨識進出</h3>
            <span>月租 / 訪客 / EV</span>
          </div>
          <form className="dispatch-form" onSubmit={addVehicle}>
            <input name="plate" required placeholder="車牌號碼" aria-label="車牌號碼" suppressHydrationWarning />
            <select name="type" required aria-label="車輛類型" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>車輛類型</option>
              <option>一般</option>
              <option>月租</option>
              <option>VIP</option>
              <option>訪客</option>
              <option>EV</option>
            </select>
            <select name="gate" required aria-label="入口" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>入口</option>
              <option>入口 A</option>
              <option>入口 B</option>
              <option>出口 C</option>
            </select>
            <button type="submit">辨識進出</button>
          </form>
          <div className="record-list">
            {vehicles.map((vehicle) => (
              <article className="record-card" key={vehicle.id}>
                <div>
                  <strong>{vehicle.plate} · {vehicle.type}</strong>
                  <p>{vehicle.gate} · {vehicle.time} · {vehicle.allowed ? "允許通行" : "人工確認"}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>車位狀態與電動車位管制</h3>
            <span>空位 / 電動車位 / VIP 車位</span>
          </div>
          <button className="primary-action" type="button" onClick={toggleEvLock}>開啟 / 關閉電動車位地鎖</button>
          <div className="record-list">
            {spaces.map((space) => (
              <article className="record-card" key={space.id}>
                <div>
                  <strong>{space.zone} {space.code} · {space.type}</strong>
                  <p>{space.status} · 地鎖 {space.lock}</p>
                </div>
                <div className="status-actions">
                  {spaceStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={space.status === status}
                      onClick={() => {
                        setSpaces((rows) => rows.map((row) => (row.id === space.id ? { ...row, status } : row)));
                        setLogs((rows) => [`${space.zone} ${space.code} 車位狀態更新為 ${status}。`, ...rows]);
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
            <h3>尋車與安全事件</h3>
            <span>導引 / 監控 / 處理</span>
          </div>
          <div className="shop-actions">
            <button type="button" onClick={guideVehicle}>AI 尋車</button>
            <button type="button" onClick={() => addSecurityEvent("違規停車")}>違規停車</button>
            <button type="button" onClick={() => addSecurityEvent("火警預警")}>火警預警</button>
            <button type="button" onClick={() => addSecurityEvent("遺留物")}>遺留物</button>
          </div>
          <div className="tag-list">
            {events.map((event) => (
              <span key={event.id}>{event.type} · {event.location} · {event.status}</span>
            ))}
          </div>
          <div className="log-list">
            {logs.slice(0, 5).map((log) => <p key={log}>{log}</p>)}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>營運儀表板</h3>
            <span>車流與事件</span>
          </div>
          <div className="metric-grid">
            <div><span>車輛紀錄</span><strong>{vehicles.length}</strong></div>
            <div><span>空位</span><strong>{kpis.vacant}</strong></div>
            <div><span>安全事件</span><strong>{kpis.events}</strong></div>
            <div><span>待確認</span><strong>{kpis.denied}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
