"use client";

import { FormEvent, useMemo, useState } from "react";

type Transaction = { id: number; memo: string; amount: number; category: string; project: string };
type Receivable = { id: number; name: string; amount: number; status: "待收款" | "已收款" | "逾期" };
type Expense = { id: number; name: string; amount: number; status: "待核銷" | "已核銷" };

export function BizBooksDemo() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, memo: "顧問服務收入", amount: 180000, category: "收入", project: "品牌顧問案" },
    { id: 2, memo: "雲端服務費", amount: -12800, category: "軟體費", project: "營運支出" },
  ]);
  const [receivables, setReceivables] = useState<Receivable[]>([
    { id: 1, name: "品牌顧問案尾款", amount: 240000, status: "待收款" },
  ]);
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, name: "業務差旅代墊", amount: 8600, status: "待核銷" },
  ]);
  const [reports, setReports] = useState(["損益表已更新：本月毛利率 38%"]);
  const [projects, setProjects] = useState(["品牌顧問案 收入 NT$ 420,000 / 成本 NT$ 188,000"]);

  const kpis = useMemo(() => {
    const income = transactions.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0);
    const cost = Math.abs(transactions.filter((row) => row.amount < 0).reduce((sum, row) => sum + row.amount, 0));
    const ar = receivables.filter((row) => row.status !== "已收款").reduce((sum, row) => sum + row.amount, 0);
    const advance = expenses.filter((row) => row.status === "待核銷").reduce((sum, row) => sum + row.amount, 0);
    return { income, cost, ar, advance, profit: income - cost };
  }, [expenses, receivables, transactions]);

  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setTransactions((rows) => [
      {
        id: Date.now(),
        memo: String(form.get("memo")),
        amount: Number(form.get("amount")),
        category: "未分類",
        project: String(form.get("project")),
      },
      ...rows,
    ]);
    event.currentTarget.reset();
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>財務總覽</span>
          <strong>NT$ {kpis.profit.toLocaleString("zh-TW")}</strong>
          <p>
            收入 NT$ {kpis.income.toLocaleString("zh-TW")}，成本 NT$ {kpis.cost.toLocaleString("zh-TW")}，應收 NT$ {kpis.ar.toLocaleString("zh-TW")}
          </p>
          <button type="button" onClick={() => setReports((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 三大財報已產生`, ...rows])}>
            產生財報
          </button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>銀行明細與記帳</h3>
            <span>Transactions</span>
          </div>
          <form className="property-form" onSubmit={addTransaction}>
            <input name="memo" required placeholder="交易摘要" aria-label="交易摘要" />
            <input name="amount" required type="number" placeholder="金額" aria-label="金額" />
            <input name="project" required placeholder="歸屬專案" aria-label="歸屬專案" />
            <button type="submit">匯入明細</button>
          </form>
          <div className="unit-list">
            {transactions.map((row) => (
              <article className="unit-card" key={row.id}>
                <div>
                  <strong>{row.memo}</strong>
                  <p>
                    NT$ {row.amount.toLocaleString("zh-TW")} · {row.category} · {row.project}
                  </p>
                </div>
                <button
                  className="inline-action"
                  type="button"
                  onClick={() => setTransactions((rows) => rows.map((item) => (item.id === row.id ? { ...item, category: item.amount >= 0 ? "營業收入" : "營業費用" } : item)))}
                >
                  自動分類
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>應收應付與代墊</h3>
            <span>AR/AP</span>
          </div>
          <div className="status-actions">
            <button type="button" onClick={() => setReceivables((rows) => [{ id: Date.now(), name: "測試客戶應收款", amount: 96000, status: "待收款" }, ...rows])}>新增應收</button>
            <button type="button" onClick={() => setReceivables((rows) => rows.map((row, index) => (index === 0 ? { ...row, status: "已收款" } : row)))}>收款入帳</button>
            <button type="button" onClick={() => setExpenses((rows) => [{ id: Date.now(), name: "測試代墊款", amount: 5200, status: "待核銷" }, ...rows])}>新增代墊</button>
            <button type="button" onClick={() => setExpenses((rows) => rows.map((row, index) => (index === 0 ? { ...row, status: "已核銷" } : row)))}>核銷代墊</button>
          </div>
          <div className="tag-list">
            {[...receivables.map((row) => `${row.name} NT$ ${row.amount.toLocaleString("zh-TW")} ${row.status}`), ...expenses.map((row) => `${row.name} NT$ ${row.amount.toLocaleString("zh-TW")} ${row.status}`)].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>專案損益</h3>
            <span>Projects</span>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={() => setProjects((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 測試專案損益：毛利率 41%`, ...rows])}
          >
            新增專案損益
          </button>
          <div className="tag-list">
            {projects.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>財報紀錄</h3>
            <span>Reports</span>
          </div>
          <div className="tag-list">
            {reports.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>管理儀表板</h3>
            <span>財務總覽</span>
          </div>
          <div className="metric-grid">
            <div><span>營業收入</span><strong>NT$ {kpis.income.toLocaleString("zh-TW")}</strong></div>
            <div><span>營業成本</span><strong>NT$ {kpis.cost.toLocaleString("zh-TW")}</strong></div>
            <div><span>應收款</span><strong>NT$ {kpis.ar.toLocaleString("zh-TW")}</strong></div>
            <div><span>待核代墊</span><strong>NT$ {kpis.advance.toLocaleString("zh-TW")}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
