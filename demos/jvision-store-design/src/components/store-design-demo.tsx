"use client";

import { FormEvent, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  inventory: number;
};

type CartItem = Product & { qty: number };

const products: Product[] = [
  { id: 1, name: "森系香氛組", price: 1280, inventory: 24 },
  { id: 2, name: "手工陶杯", price: 860, inventory: 18 },
  { id: 3, name: "有機棉托特包", price: 980, inventory: 12 },
  { id: 4, name: "植萃保養旅行組", price: 1680, inventory: 9 }
];

const palettes = [
  { name: "清新綠意", primary: "#0f9f7a", bg: "#f3fbf7" },
  { name: "質感藍調", primary: "#246bfe", bg: "#f3f7ff" },
  { name: "簡約黑金", primary: "#101820", bg: "#f7f7f2" }
];

export function StoreDesignDemo() {
  const [headline, setHeadline] = useState("讓美好生活，自然發生");
  const [subcopy, setSubcopy] = useState("以溫柔材質與日常香氣，打造你的生活選物品牌。");
  const [palette, setPalette] = useState(palettes[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState(["#JV-1024 已建立：森系香氛組 x1"]);
  const [leads, setLeads] = useState(["mika@example.com 已訂閱新品通知"]);
  const [seo, setSeo] = useState({ title: "Jvision 自然生活選物", description: "生活選物品牌網店，香氛、陶杯、棉質包款與保養旅行組。" });
  const [sections, setSections] = useState(["首頁主視覺", "精選商品", "顧客表單", "品牌故事"]);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const avgOrder = orders.length ? Math.round((total + 1280) / orders.length) : 0;

  const previewStyle = useMemo(() => ({
    "--demo-primary": palette.primary,
    "--demo-bg": palette.bg
  }) as React.CSSProperties, [palette]);

  function addToCart(product: Product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) return current.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...current, { ...product, qty: 1 }];
    });
  }

  function createOrder() {
    if (!cart.length) return;
    const summary = cart.map((item) => `${item.name} x${item.qty}`).join("、");
    setOrders((current) => [`#JV-${Math.floor(Math.random() * 8000) + 2000} 已建立：${summary}，NT$ ${total.toLocaleString("zh-TW")}`, ...current].slice(0, 5));
    setCart([]);
  }

  function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLeads((current) => [`${form.get("email")} 已提交：${form.get("message")}`, ...current].slice(0, 5));
    event.currentTarget.reset();
  }

  return (
    <div className="builder-demo" style={previewStyle}>
      <aside className="builder-controls">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <label>
          主標題
          <input value={headline} onChange={(event) => setHeadline(event.target.value)} aria-label="主標題" />
        </label>
        <label>
          副標
          <textarea value={subcopy} onChange={(event) => setSubcopy(event.target.value)} aria-label="副標" />
        </label>
        <label>
          設計主題
          <select value={palette.name} onChange={(event) => setPalette(palettes.find((item) => item.name === event.target.value) || palettes[0])}>
            {palettes.map((item) => <option key={item.name}>{item.name}</option>)}
          </select>
        </label>
        <button className="primary-action" type="button" onClick={() => setSections((current) => ["活動橫幅", ...current])}>新增活動區塊</button>
      </aside>

      <div className="builder-workspace">
        <section className="demo-panel live-site">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">商店頁面編輯</p>
              <h3>即時網店預覽</h3>
            </div>
            <span>即時預覽</span>
          </div>
          <div className="storefront">
            <div className="storefront-hero">
              <span>Jvision 生活選物</span>
              <h2>{headline}</h2>
              <p>{subcopy}</p>
              <button type="button">立即選購</button>
            </div>
            <div className="section-tags">
              {sections.map((section) => <span key={section}>{section}</span>)}
            </div>
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>商品與快速購物車</h3><span>{cart.length} 種商品</span></div>
          <div className="product-grid">
            {products.map((product) => (
              <button className="product-button" type="button" key={product.id} onClick={() => addToCart(product)}>
                <strong>{product.name}</strong>
                <b>NT$ {product.price.toLocaleString("zh-TW")}</b>
                <small>庫存 {product.inventory}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="demo-panel bill-panel">
          <div className="panel-heading"><h3>購物車與訂單</h3><span>結帳預覽</span></div>
          <div className="bill-list">
            {cart.length === 0 ? <p className="empty">點選商品測試加入購物車。</p> : cart.map((item) => (
              <div className="bill-row" key={item.id}>
                <span>{item.name} x {item.qty}</span>
                <strong>NT$ {(item.price * item.qty).toLocaleString("zh-TW")}</strong>
              </div>
            ))}
          </div>
          <div className="total-box">
            <span>平均訂單 NT$ {avgOrder.toLocaleString("zh-TW")}</span>
            <strong>總計 NT$ {total.toLocaleString("zh-TW")}</strong>
          </div>
          <button className="primary-action" type="button" onClick={createOrder}>建立訂單</button>
          <div className="tag-list">{orders.map((row) => <span key={row}>{row}</span>)}</div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>表單管理</h3><span>名單收集</span></div>
          <form className="transfer-form" onSubmit={submitLead}>
            <input name="email" type="email" required placeholder="email@example.com" aria-label="Email" />
            <input name="message" required placeholder="想了解的商品或活動" aria-label="訊息" />
            <button type="submit">送出表單</button>
          </form>
          <div className="tag-list">{leads.map((row) => <span key={row}>{row}</span>)}</div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading"><h3>搜尋與商店設定</h3><span>搜尋結果預覽</span></div>
          <div className="seo-grid">
            <label>商店標題<input value={seo.title} onChange={(event) => setSeo({ ...seo, title: event.target.value })} /></label>
            <label>商店介紹<input value={seo.description} onChange={(event) => setSeo({ ...seo, description: event.target.value })} /></label>
          </div>
          <div className="search-preview">
            <strong>{seo.title}</strong>
            <span>https://jvision.store</span>
            <p>{seo.description}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
