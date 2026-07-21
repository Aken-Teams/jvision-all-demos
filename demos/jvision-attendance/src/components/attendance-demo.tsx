"use client";

import { FormEvent, useMemo, useState } from "react";

type EmployeeStatus = "未打卡" | "上班中" | "外勤中" | "已下班";
type Employee = { id: number; name: string; dept: string; status: EmployeeStatus; hours: number };
type Leave = { id: number; employee: string; type: string; status: "待簽核" | "已核准" | "退回" };

const statuses: EmployeeStatus[] = ["未打卡", "上班中", "外勤中", "已下班"];

export function AttendanceDemo() {
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: "林怡君", dept: "客服部", status: "上班中", hours: 7.5 },
    { id: 2, name: "陳柏翰", dept: "業務部", status: "外勤中", hours: 6 },
    { id: 3, name: "王心妤", dept: "營運部", status: "未打卡", hours: 0 },
  ]);
  const [leaves, setLeaves] = useState<Leave[]>([
    { id: 1, employee: "林怡君", type: "特休 1 天", status: "待簽核" },
  ]);
  const [exceptions, setExceptions] = useState(["王心妤 今日漏打卡，已通知主管"]);
  const [fieldLogs, setFieldLogs] = useState(["陳柏翰 外勤定位：台北信義客戶端"]);
  const [payroll, setPayroll] = useState(["本週加班試算 42h，預估加班費 NT$ 18,900"]);

  const kpis = useMemo(() => {
    const present = employees.filter((row) => row.status === "上班中" || row.status === "外勤中").length;
    const field = employees.filter((row) => row.status === "外勤中").length;
    const totalHours = employees.reduce((sum, row) => sum + row.hours, 0);
    const pending = leaves.filter((row) => row.status === "待簽核").length;
    return { present, field, totalHours, pending };
  }, [employees, leaves]);

  function addEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setEmployees((rows) => [
      { id: Date.now(), name: String(form.get("name")), dept: String(form.get("dept")), status: "未打卡", hours: 0 },
      ...rows,
    ]);
    event.currentTarget.reset();
  }

  return (
    <div className="property-demo">
      <aside className="property-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日出勤總覽</span>
          <strong>{kpis.present} 人到班</strong>
          <p>
            外勤 {kpis.field} 人，總工時 {kpis.totalHours}h，待簽核 {kpis.pending} 筆
          </p>
          <button type="button" onClick={() => setPayroll((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 新增薪時計算 NT$ 26,400`, ...rows])}>
            計算工時
          </button>
        </div>
      </aside>

      <div className="property-workspace">
        <section className="demo-panel">
          <div className="panel-heading">
            <h3>員工打卡</h3>
            <span>Clock-in</span>
          </div>
          <form className="property-form" onSubmit={addEmployee}>
            <input name="name" required placeholder="員工姓名" aria-label="員工姓名" />
            <input name="dept" required placeholder="部門" aria-label="部門" />
            <input name="role" placeholder="職務" aria-label="職務" />
            <button type="submit">新增員工</button>
          </form>
          <div className="unit-list">
            {employees.map((employee) => (
              <article className="unit-card" key={employee.id}>
                <div>
                  <strong>{employee.name}</strong>
                  <p>
                    {employee.dept} · {employee.status} · {employee.hours}h
                  </p>
                </div>
                <div className="status-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      disabled={employee.status === status}
                      onClick={() => setEmployees((rows) => rows.map((row) => (row.id === employee.id ? { ...row, status, hours: status === "已下班" ? row.hours + 1 : row.hours } : row)))}
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
            <h3>外勤與異常</h3>
            <span>Field</span>
          </div>
          <div className="status-actions">
            <button type="button" onClick={() => setFieldLogs((rows) => [`${new Date().toLocaleTimeString("zh-TW")} 測試外勤回報：新竹客戶端`, ...rows])}>新增外勤</button>
            <button type="button" onClick={() => setExceptions((rows) => [`${new Date().toLocaleTimeString("zh-TW")} GPS 地點異常，已建立補卡申請`, ...rows])}>標記異常</button>
            <button type="button" onClick={() => setLeaves((rows) => [{ id: Date.now(), employee: "測試員工", type: "病假 0.5 天", status: "待簽核" }, ...rows])}>送出請假</button>
            <button type="button" onClick={() => setLeaves((rows) => rows.map((row, index) => (index === 0 ? { ...row, status: "已核准" } : row)))}>主管簽核</button>
          </div>
          <div className="tag-list">
            {[...fieldLogs, ...exceptions].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>請假簽核</h3>
            <span>Leave</span>
          </div>
          <div className="unit-list">
            {leaves.map((leave) => (
              <article className="unit-card" key={leave.id}>
                <div>
                  <strong>{leave.employee}</strong>
                  <p>{leave.type} · {leave.status}</p>
                </div>
                <button
                  className="inline-action"
                  type="button"
                  onClick={() => setLeaves((rows) => rows.map((row) => (row.id === leave.id ? { ...row, status: "已核准" } : row)))}
                >
                  核准申請
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>薪時計算</h3>
            <span>Payroll</span>
          </div>
          <div className="tag-list">
            {payroll.map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>出勤分析</h3>
            <span>BI</span>
          </div>
          <div className="metric-grid">
            <div><span>到班人數</span><strong>{kpis.present}</strong></div>
            <div><span>外勤人數</span><strong>{kpis.field}</strong></div>
            <div><span>總工時</span><strong>{kpis.totalHours}h</strong></div>
            <div><span>待簽核</span><strong>{kpis.pending}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
