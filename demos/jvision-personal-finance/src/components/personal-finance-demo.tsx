"use client";

import { FormEvent, useMemo, useState } from "react";

type Account = { id: number; name: string; type: string; balance: number };
type Transaction = { id: number; merchant: string; amount: number; category: string };
type Budget = { id: number; category: string; limit: number; spent: number };

const categoryOptions = ["餐飲", "交通", "購物", "娛樂", "投資", "生活"];

export function PersonalFinanceDemo() {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 1, name: "主要銀行帳戶", type: "銀行", balance: 286000 },
    { id: 2, name: "信用卡帳戶", type: "信用卡", balance: -18600 },
    { id: 3, name: "投資帳戶", type: "投資", balance: 420000 },
  ]);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, merchant: "超市採買", amount: -1280, category: "生活" },
    { id: 2, merchant: "薪資入帳", amount: 68000, category: "收入" },
  ]);
  const [budgets, setBudgets] = useState<Budget[]>([
    { id: 1, category: "餐飲", limit: 12000, spent: 7200 },
    { id: 2, category: "交通", limit: 5000, spent: 2100 },
    { id: 3, category: "娛樂", limit: 6000, spent: 4600 },
  ]);
  const [bills, setBills] = useState(["信用卡帳單 7/05 到期 NT$ 18,600"]);
  const [goals, setGoals] = useState(["緊急預備金 68% 達成"]);

  const kpis = useMemo(() => {
    const netWorth = accounts.reduce((sum, account) => sum + account.balance, 0);
    const monthlyExpense = transactions.filter((row) => row.amount < 0).reduce((sum, row) => sum + Math.abs(row.amount), 0);
    const monthlyIncome = transactions.filter((row) => row.amount > 0).reduce((sum, row) => sum + row.amount, 0);
    const savingsRate = monthlyIncome ? Math.max(0, Math.round(((monthlyIncome - monthlyExpense) / monthlyIncome) * 100)) : 0;
    return { netWorth, monthlyExpense, savingsRate };
  }, [accounts, transactions]);

  function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setAccounts((rows) => [
      { id: Date.now(), name: String(form.get("name")), type: String(form.get("type")), balance: Number(form.get("balance")) },
      ...rows,
    ]);
    event.currentTarget.reset();
  }

  function addTransaction() {
    setTransactions((rows) => [{ id: Date.now(), merchant: "測試咖啡消費", amount: -180, category: "未分類" }, ...rows]);
  }

  function autoCategorize() {
    setTransactions((rows) => rows.map((row) => (row.category === "未分類" ? { ...row, category: "餐飲" } : row)));
  }

  function addBudget() {
    setBudgets((rows) => [{ id: Date.now(), category: "購物", limit: 9000, spent: 3200 }, ...rows]);
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>財務總覽</span>
          <strong>NT$ {kpis.netWorth.toLocaleString("zh-TW")}</strong>
          <p>
            本月支出 NT$ {kpis.monthlyExpense.toLocaleString("zh-TW")}，儲蓄率 {kpis.savingsRate}%，帳單提醒 {bills.length} 筆
          </p>
          <button type="button" onClick={() => setGoals((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 新增旅遊基金目標 NT$ 80,000`, ...rows])}>
            新增目標
          </button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>帳戶資產</h3>
            <span>Accounts</span>
          </div>
          <form className="property-form" onSubmit={addAccount}>
            <input name="name" required placeholder="帳戶名稱" aria-label="帳戶名稱" />
            <input name="type" required placeholder="帳戶類型" aria-label="帳戶類型" />
            <input name="balance" required type="number" placeholder="餘額" aria-label="餘額" />
            <button type="submit">新增帳戶</button>
          </form>
          <div className="unit-list">
            {accounts.map((account) => (
              <article className="unit-card" key={account.id}>
                <div>
                  <strong>{account.name}</strong>
                  <p>
                    {account.type} · NT$ {account.balance.toLocaleString("zh-TW")}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>交易記帳</h3>
            <span>Transactions</span>
          </div>
          <div className="status-actions">
            <button type="button" onClick={addTransaction}>匯入交易</button>
            <button type="button" onClick={autoCategorize}>自動分類</button>
            <button type="button" onClick={() => setBills((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 新增房租提醒 NT$ 22,000`, ...rows])}>新增帳單</button>
            <button type="button" onClick={addBudget}>新增預算</button>
          </div>
          <div className="tag-list">
            {transactions.map((row) => (
              <span key={row.id}>
                {row.merchant} · NT$ {row.amount.toLocaleString("zh-TW")} · {row.category}
              </span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>預算控管</h3>
            <span>Budgets</span>
          </div>
          <div className="unit-list">
            {budgets.map((budget) => {
              const percent = Math.min(100, Math.round((budget.spent / budget.limit) * 100));
              return (
                <article className="unit-card" key={budget.id}>
                  <div>
                    <strong>{budget.category}</strong>
                    <p>
                      已用 NT$ {budget.spent.toLocaleString("zh-TW")} / NT$ {budget.limit.toLocaleString("zh-TW")} · {percent}%
                    </p>
                  </div>
                  <button
                    className="inline-action"
                    type="button"
                    onClick={() => setBudgets((rows) => rows.map((row) => (row.id === budget.id ? { ...row, spent: row.spent + 500 } : row)))}
                  >
                    增加支出
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>帳單與目標</h3>
            <span>Reminders</span>
          </div>
          <div className="tag-list">
            {[...bills, ...goals].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>財務分析</h3>
            <span>Analytics</span>
          </div>
          <div className="metric-grid">
            <div>
              <span>淨資產</span>
              <strong>NT$ {kpis.netWorth.toLocaleString("zh-TW")}</strong>
            </div>
            <div>
              <span>本月支出</span>
              <strong>NT$ {kpis.monthlyExpense.toLocaleString("zh-TW")}</strong>
            </div>
            <div>
              <span>儲蓄率</span>
              <strong>{kpis.savingsRate}%</strong>
            </div>
            <div>
              <span>分類數</span>
              <strong>{categoryOptions.length}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
