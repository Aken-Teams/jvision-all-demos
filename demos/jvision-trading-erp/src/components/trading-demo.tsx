"use client";

import { FormEvent, useMemo, useState } from "react";

type TradeStatus = "報價中" | "已轉訂單" | "已採購" | "已出貨";
type ShipmentStatus = "待排船" | "裝箱單" | "商業發票" | "已收款";
type Quote = { id: number; customer: string; product: string; qty: number; supplier: string; price: number; cost: number; status: TradeStatus };
type Shipment = { id: number; scNo: string; customer: string; product: string; amount: number; ar: number; ap: number; status: ShipmentStatus; mark: string };
type Supplier = { id: number; name: string; item: string; leadTime: number; balance: number };

const quoteStatuses: TradeStatus[] = ["報價中", "已轉訂單", "已採購", "已出貨"];
const shipmentStatuses: ShipmentStatus[] = ["待排船", "裝箱單", "商業發票", "已收款"];
const products = ["戶外露營椅", "五金工具組", "文具禮品包", "自行車零件", "家用品收納盒", "電子配件"];

export function TradingDemo() {
  const [quotes, setQuotes] = useState<Quote[]>([
    { id: 1, customer: "Ocean Retail", product: "戶外露營椅", qty: 1200, supplier: "台中協力廠", price: 18.5, cost: 13.2, status: "已轉訂單" },
    { id: 2, customer: "North Star", product: "五金工具組", qty: 800, supplier: "深圳五金廠", price: 22.8, cost: 16.4, status: "已採購" },
    { id: 3, customer: "Green Mart", product: "文具禮品包", qty: 2000, supplier: "寧波包材廠", price: 4.2, cost: 2.9, status: "報價中" },
  ]);
  const [shipments, setShipments] = useState<Shipment[]>([
    { id: 1, scNo: "SC-260701-01", customer: "Ocean Retail", product: "戶外露營椅", amount: 22200, ar: 22200, ap: 15840, status: "裝箱單", mark: "OR-CHAIR-01" },
    { id: 2, scNo: "SC-260701-02", customer: "North Star", product: "五金工具組", amount: 18240, ar: 9200, ap: 13120, status: "商業發票", mark: "NS-TOOLS-22" },
  ]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: 1, name: "台中協力廠", item: "戶外用品", leadTime: 18, balance: 15840 },
    { id: 2, name: "深圳五金廠", item: "五金工具", leadTime: 24, balance: 13120 },
    { id: 3, name: "寧波包材廠", item: "禮品包材", leadTime: 14, balance: 0 },
  ]);
  const [logs, setLogs] = useState<string[]>(["今日已同步報價、訂單、採購、裝箱單、商業發票與帳款資料。"]);

  const kpis = useMemo(() => {
    const sales = shipments.reduce((sum, row) => sum + row.amount, 0);
    const ar = shipments.reduce((sum, row) => sum + row.ar, 0);
    const ap = shipments.reduce((sum, row) => sum + row.ap, 0);
    const margin = sales ? Math.round(((sales - ap) / sales) * 1000) / 10 : 0;
    const po = quotes.filter((row) => row.status === "已轉訂單").length;
    return { sales, ar, ap, margin, po };
  }, [quotes, shipments]);

  function addQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customer = String(form.get("customer"));
    const product = String(form.get("product"));
    const qty = Number(form.get("qty"));
    const supplier = String(form.get("supplier"));
    const price = Number(form.get("price"));
    const cost = Math.round(price * 0.72 * 10) / 10;
    setQuotes((rows) => [{ id: Date.now(), customer, product, qty, supplier, price, cost, status: "報價中" }, ...rows]);
    setLogs((rows) => [`已建立 ${customer} 的 ${product} 報價，產品圖片與電子型錄可隨表單輸出。`, ...rows]);
    event.currentTarget.reset();
  }

  function convertToOrder() {
    const quote = quotes.find((row) => row.status === "報價中") || quotes[0];
    setQuotes((rows) => rows.map((row) => row.id === quote.id ? { ...row, status: "已轉訂單" } : row));
    setShipments((rows) => [
      { id: Date.now(), scNo: `SC-${Date.now().toString().slice(-6)}`, customer: quote.customer, product: quote.product, amount: Math.round(quote.qty * quote.price), ar: Math.round(quote.qty * quote.price), ap: Math.round(quote.qty * quote.cost), status: "待排船", mark: `${quote.customer.slice(0, 2).toUpperCase()}-${quote.product.slice(0, 2)}` },
      ...rows,
    ]);
    setLogs((rows) => [`${quote.customer} 報價已轉銷售確認單，並建立分批出貨排程。`, ...rows]);
  }

  function createPurchase() {
    const quote = quotes.find((row) => row.status === "已轉訂單") || quotes[0];
    setQuotes((rows) => rows.map((row) => row.id === quote.id ? { ...row, status: "已採購" } : row));
    setSuppliers((rows) => rows.map((row) => row.name === quote.supplier ? { ...row, balance: row.balance + Math.round(quote.qty * quote.cost * 0.3) } : row));
    setLogs((rows) => [`已由銷售確認單自動產生 ${quote.supplier} 的採購單與訂金付款。`, ...rows]);
  }

  function createInvoice() {
    const shipment = shipments.find((row) => row.status !== "商業發票" && row.status !== "已收款") || shipments[0];
    setShipments((rows) => rows.map((row) => row.id === shipment.id ? { ...row, status: "商業發票" } : row));
    setLogs((rows) => [`${shipment.scNo} 已由裝箱單產生商業發票，並建立應收與應付明細。`, ...rows]);
  }

  function settleAccounts() {
    const shipment = shipments.find((row) => row.ar > 0) || shipments[0];
    setShipments((rows) => rows.map((row) => row.id === shipment.id ? { ...row, ar: 0, ap: 0, status: "已收款" } : row));
    setLogs((rows) => [`${shipment.scNo} 已完成應收應付沖銷並更新利潤分析。`, ...rows]);
  }

  return (
    <div className="dispatch-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日貿易管理</span>
          <strong>{kpis.margin}% 毛利</strong>
          <div className="ops-status-list" aria-label="今日貿易管理指標">
            <p><span>銷售金額</span><b>US$ {kpis.sales.toLocaleString("en-US")}</b></p>
            <p><span>待收款</span><b>US$ {kpis.ar.toLocaleString("en-US")}</b></p>
            <p><span>待採購</span><b>{kpis.po} 張</b></p>
          </div>
          <button type="button" onClick={convertToOrder}>報價轉訂單</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel worker-panel">
          <div className="panel-heading">
            <h3>報價與銷售確認單</h3>
            <span>產品 / 客戶 / 利潤</span>
          </div>
          <form className="dispatch-form" onSubmit={addQuote}>
            <input name="customer" required placeholder="客戶名稱" aria-label="客戶名稱" suppressHydrationWarning />
            <select name="product" required aria-label="產品" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>產品</option>
              {products.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input name="qty" required type="number" min="1" placeholder="數量" aria-label="數量" suppressHydrationWarning />
            <select name="supplier" required aria-label="供應商" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>供應商</option>
              {suppliers.map((item) => <option key={item.id}>{item.name}</option>)}
            </select>
            <input name="price" required type="number" min="1" step="0.1" placeholder="客戶單價 USD" aria-label="客戶單價 USD" suppressHydrationWarning />
            <button type="submit">新增報價</button>
          </form>
          <div className="record-list">
            {quotes.map((quote) => (
              <article className="record-card" key={quote.id}>
                <div>
                  <strong>{quote.customer} · {quote.product}</strong>
                  <p>{quote.supplier} · {quote.qty.toLocaleString("zh-TW")} pcs · 售價 US$ {quote.price} · 成本 US$ {quote.cost}</p>
                </div>
                <div className="status-actions">
                  {quoteStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={quote.status === status}
                      onClick={() => {
                        setQuotes((rows) => rows.map((row) => (row.id === quote.id ? { ...row, status } : row)));
                        setLogs((rows) => [`${quote.customer} 的 ${quote.product} 狀態更新為 ${status}。`, ...rows]);
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
            <h3>採購與出口文件</h3>
            <span>採購單 / 裝箱單 / 商業發票</span>
          </div>
          <button className="primary-action" type="button" onClick={createPurchase}>訂單自動產生採購單</button>
          <div className="shop-actions">
            <button type="button" onClick={convertToOrder}>報價轉訂單</button>
            <button type="button" onClick={createInvoice}>產生商業發票</button>
            <button type="button" onClick={() => setLogs((rows) => ["已產生外箱標示：JVIS-EXPORT-01，並嵌入裝箱單。", ...rows])}>產生出貨嘜頭</button>
            <button type="button" onClick={settleAccounts}>帳款沖銷</button>
          </div>
          <div className="tag-list">
            {["電子型錄", "彩色報價單", "採購單", "裝箱單", "商業發票", "出貨嘜頭"].map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>分批出貨與帳款</h3>
            <span>應收 / 應付 / 利潤</span>
          </div>
          <div className="record-list">
            {shipments.map((shipment) => (
              <article className="record-card" key={shipment.id}>
                <div>
                  <strong>{shipment.scNo} · {shipment.customer}</strong>
                  <p>{shipment.product} · 金額 US$ {shipment.amount.toLocaleString("en-US")} · 應收 {shipment.ar.toLocaleString("en-US")} · 應付 {shipment.ap.toLocaleString("en-US")} · 出貨嘜頭 {shipment.mark}</p>
                </div>
                <div className="status-actions">
                  {shipmentStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={shipment.status === status}
                      onClick={() => {
                        setShipments((rows) => rows.map((row) => (row.id === shipment.id ? { ...row, status } : row)));
                        setLogs((rows) => [`${shipment.scNo} 出貨狀態更新為 ${status}。`, ...rows]);
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

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>貿易利潤與對帳儀表板</h3>
            <span>客戶 / 供應商 / 統計</span>
          </div>
          <div className="metric-grid">
            <div><span>報價筆數</span><strong>{quotes.length}</strong></div>
            <div><span>出貨批次</span><strong>{shipments.length}</strong></div>
            <div><span>應收</span><strong>{Math.round(kpis.ar / 1000)}K</strong></div>
            <div><span>應付</span><strong>{Math.round(kpis.ap / 1000)}K</strong></div>
          </div>
          <div className="tag-list">
            {suppliers.map((item) => (
              <span key={item.id}>{item.name} · {item.item} · {item.leadTime} 天</span>
            ))}
          </div>
          <div className="log-list">
            {logs.slice(0, 5).map((log) => <p key={log}>{log}</p>)}
          </div>
        </section>
      </div>
    </div>
  );
}
