"use client";

import { FormEvent, useMemo, useState } from "react";

type QuoteStatus = "估價中" | "已核准" | "已轉訂單" | "已出貨";
type JobStatus = "印前確認" | "合版排程" | "印刷中" | "託外中" | "已入庫";
type Quote = { id: number; customer: string; product: string; qty: number; paper: string; process: string; quote: number; cost: number; status: QuoteStatus };
type Job = { id: number; orderNo: string; product: string; machine: string; due: string; status: JobStatus; outsource: string; waste: number };
type Material = { id: number; name: string; stock: number; unit: string; safety: number };

const quoteStatuses: QuoteStatus[] = ["估價中", "已核准", "已轉訂單", "已出貨"];
const jobStatuses: JobStatus[] = ["印前確認", "合版排程", "印刷中", "託外中", "已入庫"];
const products = ["彩盒包裝", "貼紙標籤", "型錄 DM", "名片合版", "紙袋", "吊牌"];

export function PrintingDemo() {
  const [quotes, setQuotes] = useState<Quote[]>([
    { id: 1, customer: "宏昇食品", product: "彩盒包裝", qty: 5000, paper: "白卡 350g", process: "上光+軋型", quote: 68000, cost: 49200, status: "已轉訂單" },
    { id: 2, customer: "青禾設計", product: "型錄 DM", qty: 1200, paper: "銅版 150g", process: "雙面彩印", quote: 18600, cost: 13900, status: "已核准" },
    { id: 3, customer: "星河文創", product: "貼紙標籤", qty: 3000, paper: "霧面貼紙", process: "覆膜+裁切", quote: 22400, cost: 17100, status: "估價中" },
  ]);
  const [jobs, setJobs] = useState<Job[]>([
    { id: 1, orderNo: "MO-260701-01", product: "彩盒包裝", machine: "四色印刷機 A", due: "2026-07-05", status: "印刷中", outsource: "軋型協力廠", waste: 22 },
    { id: 2, orderNo: "MO-260701-02", product: "名片合版", machine: "數位印刷機 B", due: "2026-07-02", status: "合版排程", outsource: "無", waste: 4 },
  ]);
  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, name: "白卡 350g", stock: 820, unit: "張", safety: 600 },
    { id: 2, name: "銅版 150g", stock: 460, unit: "張", safety: 500 },
    { id: 3, name: "黑色油墨", stock: 18, unit: "kg", safety: 15 },
  ]);
  const [logs, setLogs] = useState<string[]>(["今日已同步估價、訂單、製令、領料與託外加工狀態。"]);

  const kpis = useMemo(() => {
    const sales = quotes.reduce((sum, row) => sum + row.quote, 0);
    const cost = quotes.reduce((sum, row) => sum + row.cost, 0);
    const margin = sales ? Math.round(((sales - cost) / sales) * 1000) / 10 : 0;
    const wip = jobs.filter((row) => row.status !== "已入庫").length;
    const outsource = jobs.filter((row) => row.status === "託外中" || row.outsource !== "無").length;
    const lowStock = materials.filter((row) => row.stock <= row.safety).length;
    return { sales, cost, margin, wip, outsource, lowStock };
  }, [jobs, materials, quotes]);

  function addQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customer = String(form.get("customer"));
    const product = String(form.get("product"));
    const qty = Number(form.get("qty"));
    const paper = String(form.get("paper"));
    const process = String(form.get("process"));
    const base = product.includes("彩盒") ? 12 : product.includes("貼紙") ? 6 : 8;
    const quote = qty * base + (process.includes("軋型") ? 8500 : 3600);
    const cost = Math.round(quote * 0.72);
    setQuotes((rows) => [
      { id: Date.now(), customer, product, qty, paper, process, quote, cost, status: "估價中" },
      ...rows,
    ]);
    setLogs((rows) => [`${customer} 的 ${product} 已完成估價試算，毛利率約 ${Math.round(((quote - cost) / quote) * 100)}%。`, ...rows]);
    event.currentTarget.reset();
  }

  function approveAndConvert() {
    const quote = quotes.find((row) => row.status !== "已轉訂單") || quotes[0];
    setQuotes((rows) => rows.map((row) => row.id === quote.id ? { ...row, status: "已轉訂單" } : row));
    setJobs((rows) => [
      { id: Date.now(), orderNo: `MO-${Date.now().toString().slice(-6)}`, product: quote.product, machine: quote.product.includes("名片") ? "數位印刷機 B" : "四色印刷機 A", due: "2026-07-06", status: "印前確認", outsource: quote.process.includes("軋型") ? "軋型協力廠" : "無", waste: 0 },
      ...rows,
    ]);
    setLogs((rows) => [`${quote.customer} 報價已核准並自動轉成製令。`, ...rows]);
  }

  function confirmArtwork() {
    setLogs((rows) => ["客戶圖檔 V3 與刀模 D-014 已完成線上確認，可進入合版排程。", ...rows]);
  }

  function issueMaterial() {
    setMaterials((rows) => rows.map((row) => row.name === "白卡 350g" ? { ...row, stock: Math.max(0, row.stock - 120) } : row));
    setLogs((rows) => ["已依製令自動產生領料單，白卡 350g 扣料 120 張。", ...rows]);
  }

  function dispatchOutsource() {
    const job = jobs.find((row) => row.outsource !== "無") || jobs[0];
    setJobs((rows) => rows.map((row) => row.id === job.id ? { ...row, status: "託外中" } : row));
    setLogs((rows) => [`${job.orderNo} 已派送 ${job.outsource}，等待完工回報。`, ...rows]);
  }

  return (
    <div className="dispatch-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日印刷管理</span>
          <strong>{kpis.margin}% 毛利</strong>
          <div className="ops-status-list" aria-label="今日印刷管理指標">
            <p><span>在製工單</span><b>{kpis.wip} 張</b></p>
            <p><span>託外追蹤</span><b>{kpis.outsource} 件</b></p>
            <p><span>低庫存紙材</span><b>{kpis.lowStock} 項</b></p>
          </div>
          <button type="button" onClick={approveAndConvert}>核准並轉工單</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel worker-panel">
          <div className="panel-heading">
            <h3>估價與訂單轉單</h3>
            <span>紙材 / 色數 / 加工</span>
          </div>
          <form className="dispatch-form" onSubmit={addQuote}>
            <input name="customer" required placeholder="客戶名稱" aria-label="客戶名稱" suppressHydrationWarning />
            <select name="product" required aria-label="印件品項" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>印件品項</option>
              {products.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input name="qty" required type="number" min="1" placeholder="印刷數量" aria-label="印刷數量" suppressHydrationWarning />
            <select name="paper" required aria-label="紙材" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>紙材</option>
              <option>白卡 350g</option>
              <option>銅版 150g</option>
              <option>霧面貼紙</option>
              <option>牛皮紙</option>
            </select>
            <select name="process" required aria-label="後加工" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>後加工</option>
              <option>雙面彩印</option>
              <option>上光+軋型</option>
              <option>覆膜+裁切</option>
              <option>燙金+裝訂</option>
            </select>
            <button type="submit">新增估價</button>
          </form>
          <div className="record-list">
            {quotes.map((quote) => (
              <article className="record-card" key={quote.id}>
                <div>
                  <strong>{quote.customer} · {quote.product}</strong>
                  <p>{quote.paper} · {quote.process} · {quote.qty.toLocaleString("zh-TW")} 份 · 報價 NT$ {quote.quote.toLocaleString("zh-TW")}</p>
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
            <h3>圖檔版模與合版</h3>
            <span>版本 / 排版 / 確認</span>
          </div>
          <button className="primary-action" type="button" onClick={confirmArtwork}>確認圖檔與刀模版本</button>
          <div className="shop-actions">
            <button type="button" onClick={approveAndConvert}>估價轉製令</button>
            <button type="button" onClick={() => setLogs((rows) => ["已將 4 張名片訂單合併為同一張合版製令。", ...rows])}>建立合版</button>
            <button type="button" onClick={issueMaterial}>自動領料</button>
            <button type="button" onClick={dispatchOutsource}>派託外</button>
          </div>
          <div className="tag-list">
            {["圖檔 V3", "刀模 D-014", "合版批次", "急單插單", "排版匯入", "客戶確認"].map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>製程移轉與託外追蹤</h3>
            <span>WIP / 設備 / 完工</span>
          </div>
          <div className="record-list">
            {jobs.map((job) => (
              <article className="record-card" key={job.id}>
                <div>
                  <strong>{job.orderNo} · {job.product}</strong>
                  <p>{job.machine} · 交期 {job.due} · 託外 {job.outsource} · 報廢 {job.waste}</p>
                </div>
                <div className="status-actions">
                  {jobStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={job.status === status}
                      onClick={() => {
                        setJobs((rows) => rows.map((row) => (row.id === job.id ? { ...row, status, waste: status === "已入庫" ? row.waste + 2 : row.waste } : row)));
                        setLogs((rows) => [`${job.orderNo} 製程更新為 ${status}。`, ...rows]);
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
            <h3>成本與出貨儀表板</h3>
            <span>材料 / 工時 / 毛利</span>
          </div>
          <div className="metric-grid">
            <div><span>估價金額</span><strong>{Math.round(kpis.sales / 1000)}K</strong></div>
            <div><span>預估成本</span><strong>{Math.round(kpis.cost / 1000)}K</strong></div>
            <div><span>在製工單</span><strong>{kpis.wip}</strong></div>
            <div><span>低庫存</span><strong>{kpis.lowStock}</strong></div>
          </div>
          <div className="tag-list">
            {materials.map((item) => (
              <span key={item.id}>{item.name} {item.stock}{item.unit}</span>
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
