"use client";

import { FormEvent, useMemo, useState } from "react";

type Unit = { id: number; name: string; rent: number; status: "空置" | "出租中" | "待簽約" };
type Repair = { id: number; unit: string; issue: string; status: "待派工" | "處理中" | "已完成" };
type Contract = {
  id: number;
  unit: string;
  tenant: string;
  term: string;
  rent: number;
  status: "草稿" | "主管簽核" | "承租人簽署" | "已完成";
};
type Bill = {
  id: number;
  unit: string;
  item: string;
  amount: number;
  received: number;
  dueDate: string;
  status: "待收款" | "有差額" | "待對帳" | "已對帳";
};

const initialUnits: Unit[] = [
  { id: 1, name: "信義 A 棟 5F-2", rent: 32000, status: "出租中" },
  { id: 2, name: "中山套房 301", rent: 18500, status: "待簽約" },
  { id: 3, name: "板橋電梯兩房 8B", rent: 28000, status: "空置" }
];

export function PropertyDemo() {
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [repairs, setRepairs] = useState<Repair[]>([{ id: 1, unit: "信義 A 棟 5F-2", issue: "冷氣漏水", status: "待派工" }]);
  const [bills, setBills] = useState<Bill[]>([
    { id: 1, unit: "信義 A 棟 5F-2", item: "八月租金", amount: 32000, received: 32000, dueDate: "2026/08/05", status: "待對帳" },
    { id: 2, unit: "中山套房 301", item: "水電雜費", amount: 1860, received: 1800, dueDate: "2026/08/10", status: "有差額" }
  ]);
  const [selectedBillId, setSelectedBillId] = useState(1);
  const [contracts, setContracts] = useState<Contract[]>([
    { id: 1, unit: "中山套房 301", tenant: "林怡君", term: "2026/08/01－2027/07/31", rent: 18500, status: "主管簽核" }
  ]);
  const [selectedContractId, setSelectedContractId] = useState(1);
  const [previewContractId, setPreviewContractId] = useState<number | null>(null);
  const [inspection, setInspection] = useState(["AI 現況：牆面正常、地板輕微刮痕、水電可用。"]);

  const kpis = useMemo(() => {
    const rented = units.filter((u) => u.status === "出租中").length;
    const rent = units.filter((u) => u.status === "出租中").reduce((sum, u) => sum + u.rent, 0);
    return { rented, vacancy: units.length - rented, rent, repairs: repairs.filter((r) => r.status !== "已完成").length };
  }, [repairs, units]);

  function addUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setUnits((rows) => [{ id: Math.random(), name: String(form.get("name")), rent: Number(form.get("rent")), status: "空置" }, ...rows]);
    event.currentTarget.reset();
  }

  function addRepair(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setRepairs((rows) => [{ id: Math.random(), unit: String(form.get("unit")), issue: String(form.get("issue")), status: "待派工" }, ...rows]);
    event.currentTarget.reset();
  }

  function addContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const contract: Contract = {
      id: Date.now(),
      unit: String(form.get("unit")),
      tenant: String(form.get("tenant")),
      term: String(form.get("term")),
      rent: Number(form.get("rent")),
      status: "草稿"
    };
    setContracts((rows) => [contract, ...rows]);
    setSelectedContractId(contract.id);
    event.currentTarget.reset();
  }

  function advanceContract(contract: Contract) {
    const nextStatus: Record<Contract["status"], Contract["status"]> = {
      草稿: "主管簽核",
      主管簽核: "承租人簽署",
      承租人簽署: "已完成",
      已完成: "已完成"
    };
    setContracts((rows) => rows.map((row) => row.id === contract.id ? { ...row, status: nextStatus[row.status] } : row));
  }

  function addBill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const bill: Bill = {
      id: Date.now(),
      unit: String(form.get("unit")),
      item: String(form.get("item")),
      amount: Number(form.get("amount")),
      received: 0,
      dueDate: String(form.get("dueDate")),
      status: "待收款"
    };
    setBills((rows) => [bill, ...rows]);
    setSelectedBillId(bill.id);
    event.currentTarget.reset();
  }

  function registerPayment(bill: Bill) {
    const input = window.prompt(`請輸入「${bill.unit}－${bill.item}」實際入帳金額`, String(bill.amount));
    if (input === null) return;
    const received = Number(input);
    if (!Number.isFinite(received) || received < 0) return;
    setBills((rows) => rows.map((row) => row.id === bill.id
      ? { ...row, received, status: received === row.amount ? "待對帳" : "有差額" }
      : row));
  }

  function reconcileBill(bill: Bill) {
    if (bill.received !== bill.amount) return;
    setBills((rows) => rows.map((row) => row.id === bill.id ? { ...row, status: "已對帳" } : row));
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>租務營運中心</span>
          <strong>NT$ {kpis.rent.toLocaleString("zh-TW")}</strong>
          <p>出租 {kpis.rented} · 空置 {kpis.vacancy} · 未結修繕 {kpis.repairs}</p>
          <button type="button" onClick={() => setInspection((rows) => [`${new Date().toLocaleTimeString("zh-TW")} AI 現況：門鎖正常、浴室排水需追蹤、窗框良好。`, ...rows])}>生成 AI 現況</button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading"><h3>房源列表</h3><span>Units</span></div>
          <form className="property-form" onSubmit={addUnit}>
            <input name="name" required placeholder="房源名稱" aria-label="房源名稱" />
            <input name="rent" required type="number" min="1" placeholder="月租金" aria-label="月租金" />
            <button type="submit">新增房源</button>
          </form>
          <div className="unit-list">
            {units.map((unit) => (
              <article className="unit-card" key={unit.id}>
                <div><strong>{unit.name}</strong><p>NT$ {unit.rent.toLocaleString("zh-TW")} · {unit.status}</p></div>
                <div className="status-actions">
                  {(["空置", "待簽約", "出租中"] as Unit["status"][]).map((status) => (
                    <button key={status} disabled={unit.status === status} onClick={() => setUnits((rows) => rows.map((row) => row.id === unit.id ? { ...row, status } : row))}>{status}</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>租約與線上簽署</h3><span>Contract</span></div>
          <p className="panel-help">先填寫租約資料產生草稿，再從下方「租約簽核中心」逐步完成主管簽核與承租人線上簽署。</p>
          <form className="contract-form" onSubmit={addContract}>
            <input name="unit" required placeholder="房源，例如：中山套房 301" aria-label="租約房源" />
            <input name="tenant" required placeholder="承租人姓名" aria-label="承租人姓名" />
            <input name="term" required placeholder="租期，例如：2026/08/01－2027/07/31" aria-label="租約期間" />
            <input name="rent" required type="number" min="1" placeholder="月租金" aria-label="租約月租金" />
            <button className="primary-action" type="submit">產生合約草稿</button>
          </form>
          <div className="contract-center">
            <div className="contract-center-heading">
              <div><strong>租約簽核中心</strong><p>新產生的合約會出現在這裡</p></div>
              <span>{contracts.filter((row) => row.status !== "已完成").length} 件待處理</span>
            </div>
            <div className="contract-list">
              {contracts.map((contract) => (
                <article className={`contract-card ${selectedContractId === contract.id ? "is-selected" : ""}`} key={contract.id}>
                  <button className="contract-summary" type="button" onClick={() => setSelectedContractId(contract.id)}>
                    <span><strong>{contract.unit}</strong><small>{contract.tenant} · {contract.term}</small></span>
                    <span className="contract-status">{contract.status}</span>
                  </button>
                  {selectedContractId === contract.id && (
                    <div className="contract-detail">
                      <dl>
                        <div><dt>承租人</dt><dd>{contract.tenant}</dd></div>
                        <div><dt>月租金</dt><dd>NT$ {contract.rent.toLocaleString("zh-TW")}</dd></div>
                        <div><dt>租期</dt><dd>{contract.term}</dd></div>
                        <div><dt>目前位置</dt><dd>{contract.status === "主管簽核" ? "租務主管待辦匣" : contract.status === "承租人簽署" ? "承租人線上簽署頁" : contract.status === "已完成" ? "已簽租約檔案庫" : "租約草稿匣"}</dd></div>
                      </dl>
                      <div className="contract-actions">
                        <button type="button" onClick={() => setPreviewContractId(previewContractId === contract.id ? null : contract.id)}>
                          {previewContractId === contract.id ? "收起合約" : "預覽合約"}
                        </button>
                        {contract.status !== "已完成" && (
                          <button className="primary-action" type="button" onClick={() => advanceContract(contract)}>
                            {contract.status === "草稿" ? "送主管簽核" : contract.status === "主管簽核" ? "核准並送承租人" : "完成線上簽署"}
                          </button>
                        )}
                        {contract.status === "已完成" && <span className="completion-note">雙方簽署完成，可下載正式租約</span>}
                      </div>
                      {previewContractId === contract.id && (
                        <div className="contract-preview">
                          <strong>住宅租賃契約書（Demo）</strong>
                          <p>出租標的：{contract.unit}</p>
                          <p>承租人：{contract.tenant}</p>
                          <p>租賃期間：{contract.term}</p>
                          <p>每月租金：NT$ {contract.rent.toLocaleString("zh-TW")}</p>
                          <p>簽署狀態：{contract.status}</p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>修繕管理</h3><span>Maintenance</span></div>
          <form className="property-form" onSubmit={addRepair}>
            <input name="unit" required placeholder="房源" aria-label="修繕房源" />
            <input name="issue" required placeholder="修繕問題" aria-label="修繕問題" />
            <button type="submit">建立報修</button>
          </form>
          <div className="unit-list">
            {repairs.map((repair) => (
              <article className="unit-card" key={repair.id}>
                <div><strong>{repair.unit}</strong><p>{repair.issue} · {repair.status}</p></div>
                <div className="status-actions">
                  {(["待派工", "處理中", "已完成"] as Repair["status"][]).map((status) => (
                    <button key={status} disabled={repair.status === status} onClick={() => setRepairs((rows) => rows.map((row) => row.id === repair.id ? { ...row, status } : row))}>{status}</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>帳單與租金對帳</h3><span>Billing</span></div>
          <p className="panel-help">建立應收帳單後登錄實際入帳金額；金額一致才能完成對帳，有差額時會保留待查。</p>
          <form className="billing-form" onSubmit={addBill}>
            <input name="unit" required placeholder="房源" aria-label="帳單房源" />
            <input name="item" required placeholder="費用項目，例如：八月租金" aria-label="帳單費用項目" />
            <input name="amount" required type="number" min="1" placeholder="應收金額" aria-label="帳單應收金額" />
            <input name="dueDate" required type="date" aria-label="帳單繳款期限" />
            <button className="primary-action" type="submit">建立應收帳單</button>
          </form>
          <div className="billing-summary">
            <span>應收 <strong>NT$ {bills.reduce((sum, row) => sum + row.amount, 0).toLocaleString("zh-TW")}</strong></span>
            <span>已入帳 <strong>NT$ {bills.reduce((sum, row) => sum + row.received, 0).toLocaleString("zh-TW")}</strong></span>
            <span>差額 <strong>NT$ {bills.reduce((sum, row) => sum + row.amount - row.received, 0).toLocaleString("zh-TW")}</strong></span>
          </div>
          <div className="bill-list">
            {bills.map((bill) => (
              <article className={`bill-card ${selectedBillId === bill.id ? "is-selected" : ""}`} key={bill.id}>
                <button className="bill-summary" type="button" onClick={() => setSelectedBillId(bill.id)}>
                  <span><strong>{bill.unit}－{bill.item}</strong><small>應收 NT$ {bill.amount.toLocaleString("zh-TW")} · 到期 {bill.dueDate}</small></span>
                  <span className={`bill-status status-${bill.status}`}>{bill.status}</span>
                </button>
                {selectedBillId === bill.id && (
                  <div className="bill-detail">
                    <div><span>應收金額</span><strong>NT$ {bill.amount.toLocaleString("zh-TW")}</strong></div>
                    <div><span>實際入帳</span><strong>NT$ {bill.received.toLocaleString("zh-TW")}</strong></div>
                    <div><span>對帳差額</span><strong>NT$ {(bill.amount - bill.received).toLocaleString("zh-TW")}</strong></div>
                    <div className="bill-actions">
                      <button type="button" onClick={() => registerPayment(bill)}>登錄入帳</button>
                      <button className="primary-action" type="button" disabled={bill.received !== bill.amount || bill.status === "已對帳"} onClick={() => reconcileBill(bill)}>
                        {bill.status === "已對帳" ? "對帳完成" : bill.received !== bill.amount ? "差額未排除" : "確認完成對帳"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading"><h3>點交與 AI 現況</h3><span>Inspection</span></div>
          <div className="metric-grid">
            <div><span>月租金</span><strong>NT$ {kpis.rent.toLocaleString("zh-TW")}</strong></div>
            <div><span>出租</span><strong>{kpis.rented}</strong></div>
            <div><span>空置</span><strong>{kpis.vacancy}</strong></div>
            <div><span>未結修繕</span><strong>{kpis.repairs}</strong></div>
          </div>
          <div className="tag-list">{inspection.map((row) => <span key={row}>{row}</span>)}</div>
        </section>
      </div>
    </div>
  );
}
