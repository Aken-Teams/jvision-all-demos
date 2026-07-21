"use client";

import { FormEvent, useMemo, useState } from "react";

type ShipmentStatus = "待派車" | "配送中" | "已簽收" | "異常";
type Shipment = { id: number; customer: string; destination: string; pieces: number; status: ShipmentStatus; vehicle: string };
type Fleet = { id: number; vehicle: string; driver: string; route: string; load: number; status: "待命" | "執行中" | "返場" };

const shipmentStatuses: ShipmentStatus[] = ["待派車", "配送中", "已簽收", "異常"];

const initialShipments: Shipment[] = [
  { id: 1, customer: "北區生鮮", destination: "台北內湖", pieces: 36, status: "配送中", vehicle: "KLA-2188" },
  { id: 2, customer: "安和藥局", destination: "新北板橋", pieces: 18, status: "待派車", vehicle: "未指派" },
  { id: 3, customer: "大港批發", destination: "桃園龜山", pieces: 52, status: "已簽收", vehicle: "KLB-7066" },
];

export function TmsDemo() {
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
  const [fleets, setFleets] = useState<Fleet[]>([
    { id: 1, vehicle: "KLA-2188", driver: "陳司機", route: "台北冷鏈 A 線", load: 72, status: "執行中" },
    { id: 2, vehicle: "KLB-7066", driver: "王司機", route: "桃園批發 B 線", load: 58, status: "返場" },
  ]);
  const [signatures, setSignatures] = useState(["大港批發 已完成電子簽收與簽單影像回傳"]);
  const [exceptions, setExceptions] = useState(["安和藥局 時段改約，待調度重新派車"]);
  const [settlements, setSettlements] = useState(["北區生鮮 冷鏈配送運費 NT$ 8,600"]);

  const kpis = useMemo(() => {
    const totalPieces = shipments.reduce((sum, row) => sum + row.pieces, 0);
    const active = shipments.filter((row) => row.status === "配送中").length;
    const signed = shipments.filter((row) => row.status === "已簽收").length;
    const revenue = shipments.reduce((sum, row) => sum + row.pieces * 120, 0) + settlements.length * 1600;
    return { totalPieces, active, signed, revenue };
  }, [settlements.length, shipments]);

  function addShipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setShipments((rows) => [
      {
        id: Date.now(),
        customer: String(form.get("customer")),
        destination: String(form.get("destination")),
        pieces: Number(form.get("pieces")),
        status: "待派車",
        vehicle: "未指派",
      },
      ...rows,
    ]);
    event.currentTarget.reset();
  }

  function dispatchVehicle() {
    setShipments((rows) => rows.map((row, index) => (index === 0 ? { ...row, vehicle: "KLC-3399", status: "配送中" } : row)));
    setFleets((rows) => [{ id: Date.now(), vehicle: "KLC-3399", driver: "林司機", route: "新北醫藥 C 線", load: 64, status: "執行中" }, ...rows]);
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日配送總覽</span>
          <strong>{kpis.totalPieces} 件</strong>
          <p>
            配送中 {kpis.active} 單，已簽收 {kpis.signed} 單，預估運費 NT$ {kpis.revenue.toLocaleString("zh-TW")}
          </p>
          <button type="button" onClick={() => setSettlements((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 新增運費結算 NT$ 12,400`, ...rows])}>
            新增結算
          </button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>配送訂單</h3>
            <span>Orders</span>
          </div>
          <form className="property-form" onSubmit={addShipment}>
            <input name="customer" required placeholder="客戶名稱" aria-label="客戶名稱" />
            <input name="destination" required placeholder="配送地點" aria-label="配送地點" />
            <input name="pieces" required type="number" min="1" placeholder="件數" aria-label="件數" />
            <button type="submit">新增配送單</button>
          </form>
          <div className="unit-list">
            {shipments.map((shipment) => (
              <article className="unit-card" key={shipment.id}>
                <div>
                  <strong>{shipment.customer}</strong>
                  <p>
                    {shipment.destination} · {shipment.pieces} 件 · {shipment.vehicle} · {shipment.status}
                  </p>
                </div>
                <div className="status-actions">
                  {shipmentStatuses.map((status) => (
                    <button
                      key={status}
                      disabled={shipment.status === status}
                      onClick={() => setShipments((rows) => rows.map((row) => (row.id === shipment.id ? { ...row, status } : row)))}
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
            <h3>車隊調度</h3>
            <span>Dispatch</span>
          </div>
          <button className="primary-action" type="button" onClick={dispatchVehicle}>
            指派車輛
          </button>
          <div className="tag-list">
            {fleets.map((fleet) => (
              <span key={fleet.id}>
                {fleet.vehicle} · {fleet.driver} · {fleet.route} · 載重 {fleet.load}% · {fleet.status}
              </span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>電子簽收</h3>
            <span>ePOD</span>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={() => setSignatures((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 測試客戶 已完成電子簽名與影像簽單`, ...rows])}
          >
            新增簽收
          </button>
          <div className="tag-list">
            {signatures.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>異常回報</h3>
            <span>Exceptions</span>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={() => setExceptions((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 地址無人收貨，已通知客服`, ...rows])}
          >
            新增異常
          </button>
          <div className="tag-list">
            {exceptions.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>運費與績效</h3>
            <span>Billing</span>
          </div>
          <div className="metric-grid">
            <div>
              <span>配送件數</span>
              <strong>{kpis.totalPieces}</strong>
            </div>
            <div>
              <span>配送中</span>
              <strong>{kpis.active}</strong>
            </div>
            <div>
              <span>已簽收</span>
              <strong>{kpis.signed}</strong>
            </div>
            <div>
              <span>預估運費</span>
              <strong>NT$ {kpis.revenue.toLocaleString("zh-TW")}</strong>
            </div>
          </div>
          <div className="tag-list">
            {settlements.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
