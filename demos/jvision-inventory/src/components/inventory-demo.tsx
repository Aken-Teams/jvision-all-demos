"use client";

import { useMemo, useState } from "react";

type MovementType = "入庫" | "出庫" | "盤點調整";

type Item = {
  id: number;
  sku: string;
  name: string;
  warehouse: string;
  location: string;
  stock: number;
  safety: number;
  leadTime: number;
  unitCost: number;
  status: "正常" | "低庫存" | "待驗收";
};

type Movement = {
  id: number;
  time: string;
  sku: string;
  type: MovementType;
  qty: number;
  note: string;
};

const initialItems: Item[] = [
  { id: 1, sku: "JV-INV-104", name: "智慧感測器", warehouse: "台北總倉", location: "A-03-02", stock: 86, safety: 45, leadTime: 5, unitCost: 1280, status: "正常" },
  { id: 2, sku: "JV-INV-225", name: "維修備品模組", warehouse: "新竹維修站", location: "B-11-08", stock: 18, safety: 36, leadTime: 7, unitCost: 2460, status: "低庫存" },
  { id: 3, sku: "JV-INV-367", name: "冷鏈標籤", warehouse: "台中門市", location: "C-06-01", stock: 240, safety: 120, leadTime: 3, unitCost: 36, status: "正常" },
  { id: 4, sku: "JV-INV-918", name: "包裝耗材組", warehouse: "高雄寄倉", location: "D-02-04", stock: 42, safety: 80, leadTime: 4, unitCost: 180, status: "待驗收" }
];

const initialMovements: Movement[] = [
  { id: 101, time: "09:20", sku: "JV-INV-104", type: "出庫", qty: 12, note: "北區急單揀貨" },
  { id: 102, time: "10:05", sku: "JV-INV-367", type: "入庫", qty: 60, note: "到貨驗收完成" },
  { id: 103, time: "11:30", sku: "JV-INV-225", type: "盤點調整", qty: -3, note: "維修站現場盤點" }
];

function formatMoney(value: number) {
  return `NT$ ${new Intl.NumberFormat("zh-TW").format(value)}`;
}

function getStatus(item: Item) {
  if (item.stock < item.safety) return "低庫存";
  if (item.status === "待驗收") return "待驗收";
  return "正常";
}

export default function InventoryDemo({ logoUrl }: { logoUrl: string }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [form, setForm] = useState({
    sku: "JV-INV-520",
    name: "門市展示耗材",
    warehouse: "台北總倉",
    location: "A-08-01",
    stock: "52",
    safety: "40",
    leadTime: "5",
    unitCost: "320"
  });
  const [scan, setScan] = useState({ sku: "JV-INV-225", type: "入庫" as MovementType, qty: "24", note: "供應商到貨" });
  const [message, setMessage] = useState("請新增品項或執行掃碼異動，系統會即時更新庫存與補貨建議。");
  const [aiSummary, setAiSummary] = useState("AI 摘要尚未產生。");

  const enrichedItems = useMemo(() => items.map((item) => ({ ...item, status: getStatus(item) })), [items]);
  const lowStock = enrichedItems.filter((item) => item.status === "低庫存");
  const totalValue = enrichedItems.reduce((sum, item) => sum + item.stock * item.unitCost, 0);
  const accuracy = Math.max(92, 100 - lowStock.length * 2);
  const replenishment = lowStock.map((item) => ({
    ...item,
    suggestedQty: Math.max(item.safety * 2 - item.stock, item.safety)
  }));
  const pickWaves = [
    { area: "A 區快銷品", orders: 18, distance: "320m", priority: "高" },
    { area: "B 區維修備品", orders: 9, distance: "180m", priority: "中" },
    { area: "冷鏈與效期品", orders: 6, distance: "95m", priority: "高" }
  ];

  function addItem() {
    const stock = Number(form.stock);
    const safety = Number(form.safety);
    const leadTime = Number(form.leadTime);
    const unitCost = Number(form.unitCost);
    if (!form.sku || !form.name || [stock, safety, leadTime, unitCost].some((value) => !Number.isFinite(value) || value < 0)) {
      setMessage("請確認 SKU、品名與數字欄位都已正確填寫。");
      return;
    }
    const next: Item = {
      id: Date.now(),
      sku: form.sku,
      name: form.name,
      warehouse: form.warehouse || "未指定倉別",
      location: form.location || "待上架",
      stock,
      safety,
      leadTime,
      unitCost,
      status: stock < safety ? "低庫存" : "正常"
    };
    setItems((current) => [next, ...current]);
    setMessage(`${next.name} 已新增到 ${next.warehouse}，目前庫存 ${next.stock}，系統已重新計算安全庫存。`);
  }

  function applyScan() {
    const qty = Number(scan.qty);
    if (!scan.sku || !Number.isFinite(qty) || qty <= 0) {
      setMessage("請輸入有效 SKU 與異動數量。");
      return;
    }
    let found = false;
    setItems((current) =>
      current.map((item) => {
        if (item.sku !== scan.sku) return item;
        found = true;
        const change = scan.type === "入庫" ? qty : scan.type === "出庫" ? -qty : qty;
        return { ...item, stock: Math.max(0, item.stock + change), status: "正常" };
      })
    );
    if (!found) {
      setMessage(`找不到 ${scan.sku}，請先新增品項。`);
      return;
    }
    const now = new Date();
    const movement: Movement = {
      id: Date.now(),
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      sku: scan.sku,
      type: scan.type,
      qty: scan.type === "出庫" ? -qty : qty,
      note: scan.note || "現場掃碼異動"
    };
    setMovements((current) => [movement, ...current].slice(0, 8));
    setMessage(`${scan.sku} 已完成${scan.type} ${qty} 件，庫存看板與異動紀錄已同步。`);
  }

  function generateAiSummary() {
    const topRisk = lowStock[0];
    const restockText = topRisk
      ? `優先補 ${topRisk.name}，目前 ${topRisk.stock} 件，低於安全庫存 ${topRisk.safety} 件，建議採購 ${Math.max(topRisk.safety * 2 - topRisk.stock, topRisk.safety)} 件。`
      : "目前沒有低庫存品項，可以維持既有補貨節奏。";
    setAiSummary(
      `今日庫存總值 ${formatMoney(totalValue)}，庫存準確率約 ${accuracy}%。${restockText} 建議倉管先完成高優先波次揀貨，再處理待驗收與盤點差異。`
    );
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision" />
        <div className="metric"><span>管理品項</span><strong>{items.length}</strong></div>
        <div className="metric"><span>低庫存</span><strong>{lowStock.length}</strong></div>
        <div className="metric"><span>庫存總值</span><strong>{formatMoney(totalValue)}</strong></div>
        <div className="metric"><span>準確率</span><strong>{accuracy}%</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>商品主檔</span>
              <h3>新增庫存品項</h3>
            </div>
          </div>
          <div className="form-grid">
            <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} aria-label="SKU" />
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} aria-label="品名" />
            <input value={form.warehouse} onChange={(event) => setForm({ ...form, warehouse: event.target.value })} aria-label="倉別" />
            <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} aria-label="儲位" />
            <input value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} aria-label="目前庫存" />
            <input value={form.safety} onChange={(event) => setForm({ ...form, safety: event.target.value })} aria-label="安全庫存" />
            <input value={form.leadTime} onChange={(event) => setForm({ ...form, leadTime: event.target.value })} aria-label="供應天數" />
            <input value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} aria-label="單位成本" />
            <button type="button" onClick={addItem}>新增品項</button>
          </div>
          <p className="status-message">{message}</p>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>條碼作業</span>
              <h3>掃碼入出庫</h3>
            </div>
          </div>
          <div className="scan-box">
            <input value={scan.sku} onChange={(event) => setScan({ ...scan, sku: event.target.value })} aria-label="掃描 SKU" />
            <select value={scan.type} onChange={(event) => setScan({ ...scan, type: event.target.value as MovementType })} aria-label="異動類型">
              <option>入庫</option>
              <option>出庫</option>
              <option>盤點調整</option>
            </select>
            <input value={scan.qty} onChange={(event) => setScan({ ...scan, qty: event.target.value })} aria-label="異動數量" />
            <input value={scan.note} onChange={(event) => setScan({ ...scan, note: event.target.value })} aria-label="異動備註" />
            <button type="button" onClick={applyScan}>執行掃碼異動</button>
          </div>
          <div className="movement-list">
            {movements.map((movement) => (
              <article key={movement.id}>
                <strong>{movement.time}</strong>
                <span>{movement.sku}</span>
                <b>{movement.type} {movement.qty}</b>
                <em>{movement.note}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>庫存看板</span>
              <h3>即時庫存與補貨狀態</h3>
            </div>
            <button className="portal-button" type="button" onClick={generateAiSummary}>生成 AI 庫存摘要</button>
          </div>
          <div className="inventory-table" role="table" aria-label="庫存清單">
            <div className="table-row table-head" role="row">
              <span>SKU / 品名</span><span>倉別</span><span>儲位</span><span>庫存</span><span>狀態</span>
            </div>
            {enrichedItems.map((item) => (
              <div className="table-row" role="row" key={item.id}>
                <span><b>{item.sku}</b><small>{item.name}</small></span>
                <span>{item.warehouse}</span>
                <span>{item.location}</span>
                <span>{item.stock} / 安全 {item.safety}</span>
                <span className={`pill ${item.status === "低庫存" ? "danger" : item.status === "待驗收" ? "warn" : ""}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>補貨</span>
              <h3>今日建議補貨</h3>
            </div>
          </div>
          <div className="replenish-list">
            {replenishment.length ? replenishment.map((item) => (
              <article key={item.id}>
                <strong>{item.name}</strong>
                <span>{item.warehouse} · 交期 {item.leadTime} 天</span>
                <b>建議採購 {item.suggestedQty} 件</b>
              </article>
            )) : <p className="empty-text">目前沒有低於安全庫存的品項。</p>}
          </div>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <div>
              <span>Jvision AI</span>
              <h3>庫存行動摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <div className="wave-list">
            {pickWaves.map((wave) => (
              <article key={wave.area}>
                <strong>{wave.area}</strong>
                <span>{wave.orders} 筆訂單 · 路徑 {wave.distance}</span>
                <b>{wave.priority}優先</b>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
