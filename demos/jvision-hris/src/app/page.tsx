"use client";

import { useMemo, useState } from "react";

type Employee = {
  name: string;
  role: string;
  team: string;
  salary: number;
  status: string;
  leave: number;
};

type Candidate = {
  name: string;
  role: string;
  stage: string;
  score: number;
};

const initialEmployees: Employee[] = [
  { name: "林佳穎", role: "產品經理", team: "產品部", salary: 78000, status: "在職", leave: 6 },
  { name: "陳柏宇", role: "前端工程師", team: "研發部", salary: 92000, status: "試用期", leave: 3 },
  { name: "王怡君", role: "HR 專員", team: "人資部", salary: 62000, status: "在職", leave: 4 },
];

const initialCandidates: Candidate[] = [
  { name: "張凱翔", role: "資料分析師", stage: "面試安排", score: 86 },
  { name: "李宜蓁", role: "客服主管", stage: "主管複試", score: 78 },
  { name: "許哲維", role: "後端工程師", stage: "錄取簽核", score: 91 },
];

const stages = ["履歷篩選", "面試安排", "主管複試", "錄取簽核", "入職準備"];

export default function Page() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [candidates, setCandidates] = useState(initialCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState(0);
  const [notice, setNotice] = useState("選擇候選人或員工後，可測試招募推進、薪資試算與請假核准。");
  const [employeeForm, setEmployeeForm] = useState<Employee>({
    name: "黃品妤",
    role: "行銷企劃",
    team: "行銷部",
    salary: 68000,
    status: "待入職",
    leave: 0,
  });

  const totals = useMemo(() => {
    const payroll = employees.reduce((sum, row) => sum + row.salary, 0);
    const avgSalary = Math.round(payroll / employees.length);
    const openOffers = candidates.filter((row) => row.stage !== "入職準備").length;
    return { payroll, avgSalary, openOffers };
  }, [employees, candidates]);

  const currentCandidate = candidates[selectedCandidate] ?? candidates[0];
  const aiSummary = `目前員工 ${employees.length} 人，月薪資預估 NT$ ${totals.payroll.toLocaleString()}。招募中 ${candidates.length} 位，其中 ${currentCandidate.name} 分數最高可優先推進；建議本週完成 ${totals.openOffers} 筆招募追蹤與新人入職任務。`;

  function addEmployee() {
    setEmployees((rows) => [{ ...employeeForm, salary: Number(employeeForm.salary) || 0 }, ...rows]);
    setNotice(`${employeeForm.name} 已加入員工名冊，系統同步建立入職任務與薪資資料。`);
  }

  function advanceCandidate() {
    setCandidates((rows) =>
      rows.map((row, index) => {
        if (index !== selectedCandidate) return row;
        const current = stages.indexOf(row.stage);
        const next = stages[Math.min(current + 1, stages.length - 1)] ?? row.stage;
        return { ...row, stage: next };
      }),
    );
    setNotice(`${currentCandidate.name} 的招募流程已推進，下一步由 HR 安排相關任務。`);
  }

  function approveLeave() {
    setEmployees((rows) => rows.map((row, index) => (index === 0 ? { ...row, leave: Math.max(row.leave - 1, 0) } : row)));
    setNotice(`${employees[0].name} 的請假已核准，剩餘假別已自動更新。`);
  }

  function simulatePayroll() {
    const bonus = Math.round(totals.payroll * 0.08);
    setNotice(`薪資試算完成：本月薪資 NT$ ${totals.payroll.toLocaleString()}，預估獎金池 NT$ ${bonus.toLocaleString()}，待主管簽核。`);
  }

  return (
    <main>
      <nav className="topbar">
        <a className="brand" href="#demo">
          <img src="/logo.png" alt="Jvision" />
          <span>人資薪酬招募管理平台</span>
        </a>
        <div className="nav-actions">
          <a href="#people">員工名冊</a>
          <a href="#hiring">招募流程</a>
          <a href="#payroll">薪資試算</a>
        </div>
      </nav>

      <section className="hero" id="demo">
        <div className="hero-copy">
          <p className="eyebrow">Jvision People Platform</p>
          <h1>把員工資料、招募、薪資、請假與 AI 摘要整合成一個人資工作台。</h1>
          <p>
            參考現代 HRIS 平台的架構，提供員工主檔、招募追蹤、入職任務、薪資試算、請假核准與人資決策摘要，讓 HR 不再分散在多個表格與系統裡。
          </p>
          <div className="hero-actions">
            <a className="primary" href="#people">開始測試</a>
            <a className="secondary" href="#hiring">查看招募</a>
          </div>
        </div>

        <div className="console" aria-label="Jvision HRIS Demo 工作台">
          <div className="window-bar">
            <span />
            <span />
            <span />
            <strong>Jvision HR Console</strong>
          </div>
          <div className="metrics">
            <article>
              <span>員工人數</span>
              <strong>{employees.length}</strong>
            </article>
            <article>
              <span>月薪資預估</span>
              <strong>{Math.round(totals.payroll / 1000)}K</strong>
            </article>
            <article>
              <span>招募中</span>
              <strong>{candidates.length}</strong>
            </article>
          </div>
          <div className="ai-box">
            <small>Jvision AI</small>
            <p>{aiSummary}</p>
          </div>
        </div>
      </section>

      <section className="feature-row">
        {[
          ["招募與入職", "招募、面試、錄取簽核與入職任務一條線追蹤。"],
          ["人資資料與報表", "員工主檔、薪資、假別與部門資料即時彙整。"],
          ["薪資與假勤", "薪資試算、請假核准與待簽核提醒集中處理。"],
          ["績效管理", "人員狀態、團隊負荷與候選人評分快速掌握。"],
        ].map(([title, text]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="demo-grid">
        <div className="panel" id="people">
          <p className="eyebrow">Employee Data</p>
          <h2>新增員工與入職資料</h2>
          <div className="form-grid">
            <label>
              姓名
              <input value={employeeForm.name} onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })} />
            </label>
            <label>
              職稱
              <input value={employeeForm.role} onChange={(event) => setEmployeeForm({ ...employeeForm, role: event.target.value })} />
            </label>
            <label>
              部門
              <select value={employeeForm.team} onChange={(event) => setEmployeeForm({ ...employeeForm, team: event.target.value })}>
                <option>人資部</option>
                <option>研發部</option>
                <option>產品部</option>
                <option>行銷部</option>
                <option>客服部</option>
              </select>
            </label>
            <label>
              狀態
              <select value={employeeForm.status} onChange={(event) => setEmployeeForm({ ...employeeForm, status: event.target.value })}>
                <option>待入職</option>
                <option>試用期</option>
                <option>在職</option>
              </select>
            </label>
            <label>
              月薪
              <input type="number" value={employeeForm.salary} onChange={(event) => setEmployeeForm({ ...employeeForm, salary: Number(event.target.value) })} />
            </label>
            <label>
              剩餘假別
              <input type="number" value={employeeForm.leave} onChange={(event) => setEmployeeForm({ ...employeeForm, leave: Number(event.target.value) })} />
            </label>
          </div>
          <button className="wide-button" onClick={addEmployee}>新增員工</button>
        </div>

        <div className="panel" id="hiring">
          <p className="eyebrow">Hiring Pipeline</p>
          <h2>招募流程 Demo</h2>
          <div className="candidate-list">
            {candidates.map((candidate, index) => (
              <button key={candidate.name} className={index === selectedCandidate ? "active" : ""} onClick={() => setSelectedCandidate(index)}>
                <span>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.role}</small>
                </span>
                <b>{candidate.stage}</b>
                <em>{candidate.score}</em>
              </button>
            ))}
          </div>
          <div className="button-row">
            <button onClick={advanceCandidate}>推進招募</button>
            <button onClick={simulatePayroll}>薪資試算</button>
            <button onClick={approveLeave}>核准請假</button>
          </div>
          <p className="notice">{notice}</p>
        </div>
      </section>

      <section className="panel full" id="payroll">
        <div className="section-head">
          <div>
            <p className="eyebrow">People Operations</p>
            <h2>員工名冊與薪酬總覽</h2>
          </div>
          <div className="summary-card">
            <span>平均薪資</span>
            <strong>NT$ {totals.avgSalary.toLocaleString()}</strong>
            <small>依目前名冊即時試算</small>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>職稱</th>
                <th>部門</th>
                <th>月薪</th>
                <th>狀態</th>
                <th>剩餘假別</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={`${employee.name}-${employee.role}`}>
                  <td>{employee.name}</td>
                  <td>{employee.role}</td>
                  <td>{employee.team}</td>
                  <td>NT$ {employee.salary.toLocaleString()}</td>
                  <td><span className="status">{employee.status}</span></td>
                  <td>{employee.leave} 天</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/logo.png" alt="Jvision" />
          <span>Jvision 人資薪酬招募管理平台 Demo</span>
        </div>
        <div className="footer-links">
          <a href="https://jvision-hris.vercel.app">Demo 網址</a>
          <a href="https://github.com/yunghua817/jvision-hris">GitHub</a>
        </div>
      </footer>
    </main>
  );
}
