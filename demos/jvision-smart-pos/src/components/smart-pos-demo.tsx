"use client";

import { FormEvent, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock: number;
  commission: number;
};

type CartItem = Product & {
  qty: number;
};

const products: Product[] = [
  { id: 1, name: "機能外套", brand: "Urban Lab", price: 2680, stock: 18, commission: 0.18 },
  { id: 2, name: "香氛蠟燭", brand: "Daily Mood", price: 980, stock: 9, commission: 0.25 },
  { id: 3, name: "聯名托特包", brand: "Pop-up Select", price: 1280, stock: 6, commission: 0.22 },
  { id: 4, name: "智慧水壺", brand: "Tech Life", price: 1680, stock: 12, commission: 0.15 }
];

export function SmartPosDemo() {
  const [inventory, setInventory] = useState(products);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [member, setMember] = useState({ name: "林品萱", tier: "Gold", points: 860, onlineOrders: 12 });
  const [payment, setPayment] = useState("Apple Pay");
  const [discount, setDiscount] = useState(0);
  const [signage, setSignage] = useState("春夏新品會員 9 折，滿 3000 贈 NFC 互動禮");
  const [transfers, setTransfers] = useState(["信義店 -> 中山店：聯名托特包 4 件"]);
  const [traffic, setTraffic] = useState({ visitors: 128, conversion: 23, dwell: 11 });
  const [receipt, setReceipt] = useState("尚未結帳");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const commission = Math.round(cart.reduce((sum, item) => sum + item.price * item.qty * item.commission, 0));
  const lowStock = inventory.filter((item) => item.stock <= 8).length;

  const brandSplit = useMemo(() => {
    const rows = cart.map((item) => ({
      brand: item.brand,
      amount: Math.round(item.price * item.qty * item.commission)
    }));
    return rows.length ? rows : [{ brand: "尚未結帳", amount: 0 }];
  }, [cart]);

  function addProduct(product: Product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) return current.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...current, { ...product, qty: 1 }];
    });
  }

  function checkout() {
    if (!cart.length) return;
    setInventory((current) => current.map((product) => {
      const sold = cart.find((item) => item.id === product.id)?.qty || 0;
      return { ...product, stock: Math.max(0, product.stock - sold) };
    }));
    setMember((current) => ({ ...current, points: current.points + Math.floor(total / 20), onlineOrders: current.onlineOrders + 1 }));
    setTraffic((current) => ({ ...current, conversion: Math.min(99, current.conversion + 2) }));
    setReceipt(`已用 ${payment} 結帳 NT$ ${total.toLocaleString("zh-TW")}，分潤 NT$ ${commission.toLocaleString("zh-TW")}`);
    setCart([]);
    setDiscount(0);
  }

  function addTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setTransfers((current) => [`${form.get("from")} -> ${form.get("to")}：${form.get("item")} ${form.get("qty")} 件`, ...current].slice(0, 5));
    event.currentTarget.reset();
  }

  return (
    <div className="smart-demo">
      <aside className="demo-nav">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="member-card">
          <span>門市會員</span>
          <strong>{member.name}</strong>
          <p>{member.tier} · {member.points} 點 · 線上訂單 {member.onlineOrders}</p>
          <button type="button" onClick={() => setDiscount(200)}>套用會員 200 元券</button>
        </div>
        <div className="sensor-card">
          <span>AI 人流辨識</span>
          <strong>{traffic.visitors}</strong>
          <p>轉換率 {traffic.conversion}% · 停留 {traffic.dwell} 分</p>
          <button type="button" onClick={() => setTraffic((row) => ({ ...row, visitors: row.visitors + 18, dwell: row.dwell + 1 }))}>模擬人流增加</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel pos-register">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">門市結帳</p>
              <h3>門市收銀與多元支付</h3>
            </div>
            <span>低庫存 {lowStock}</span>
          </div>
          <div className="product-grid">
            {inventory.map((product) => (
              <button className="product-button" type="button" key={product.id} onClick={() => addProduct(product)}>
                <span>{product.brand}</span>
                <strong>{product.name}</strong>
                <b>NT$ {product.price.toLocaleString("zh-TW")}</b>
                <small>庫存 {product.stock}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="demo-panel bill-panel">
          <div className="panel-heading">
            <h3>即時帳單</h3>
            <span>{cart.length} 種商品</span>
          </div>
          <div className="bill-list">
            {cart.length === 0 ? <p className="empty">點選商品開始測試收銀流程。</p> : cart.map((item) => (
              <div className="bill-row" key={item.id}>
                <span>{item.name} x {item.qty}</span>
                <strong>NT$ {(item.price * item.qty).toLocaleString("zh-TW")}</strong>
              </div>
            ))}
          </div>
          <label>支付方式<select value={payment} onChange={(event) => setPayment(event.target.value)}><option>Apple Pay</option><option>信用卡</option><option>LINE Pay</option><option>現金</option></select></label>
          <label>折扣<input type="number" value={discount} min="0" onChange={(event) => setDiscount(Number(event.target.value))} /></label>
          <div className="total-box">
            <span>小計 NT$ {subtotal.toLocaleString("zh-TW")}</span>
            <span>品牌分潤 NT$ {commission.toLocaleString("zh-TW")}</span>
            <strong>總計 NT$ {total.toLocaleString("zh-TW")}</strong>
          </div>
          <button className="primary-action" type="button" onClick={checkout}>完成結帳並扣庫存</button>
          <p className="receipt">{receipt}</p>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>庫存調撥</h3>
            <span>跨店補貨</span>
          </div>
          <form className="transfer-form" onSubmit={addTransfer}>
            <input name="from" required placeholder="來源店" aria-label="來源店" />
            <input name="to" required placeholder="目的店" aria-label="目的店" />
            <input name="item" required placeholder="商品" aria-label="商品" />
            <input name="qty" required type="number" min="1" placeholder="數量" aria-label="數量" />
            <button type="submit">建立調撥</button>
          </form>
          <div className="tag-list">
            {transfers.map((row) => <span key={row}>{row}</span>)}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>電子標籤與數位看板</h3>
            <span>門市內容推送</span>
          </div>
          <textarea value={signage} onChange={(event) => setSignage(event.target.value)} aria-label="數位看板內容" />
          <div className="signage-preview">
            <strong>門市活動看板</strong>
            <p>{signage}</p>
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>分潤與營運儀表板</h3>
            <span>即時營運資料</span>
          </div>
          <div className="metric-grid">
            <div><span>今日營收</span><strong>NT$ {(86240 + total).toLocaleString("zh-TW")}</strong></div>
            <div><span>AI 人流</span><strong>{traffic.visitors}</strong></div>
            <div><span>轉換率</span><strong>{traffic.conversion}%</strong></div>
            <div><span>低庫存</span><strong>{lowStock}</strong></div>
          </div>
          <div className="split-list">
            {brandSplit.map((row) => (
              <div className="split-row" key={row.brand}>
                <span>{row.brand}</span>
                <div><i style={{ width: `${Math.min(100, row.amount / 20)}%` }} /></div>
                <b>NT$ {row.amount.toLocaleString("zh-TW")}</b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
