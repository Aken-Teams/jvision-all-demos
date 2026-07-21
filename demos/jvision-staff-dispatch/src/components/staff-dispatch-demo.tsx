"use client";

import { FormEvent, useMemo, useState } from "react";

type Attendance = "待派工" | "已派工" | "出勤完成" | "缺勤";
type Worker = { id: number; name: string; trade: string; phone: string; rate: number; status: Attendance };
type Job = { id: number; site: string; customer: string; trade: string; workers: number; hours: number; status: "待派" | "進行中" | "完成" };
type Payroll = { id: number; worker: string; site: string; hours: number; allowance: number; deduction: number; amount: number };

const statuses: Attendance[] = ["待派工", "已派工", "出勤完成", "缺勤"];
const tradeOptions = ["水電工", "粗工", "清潔工", "拆除工", "木工", "油漆工", "臨時工"];

export function StaffDispatchDemo() {
  const [workers, setWorkers] = useState<Worker[]>([
    { id: 1, name: "阿賢", trade: "水電工", phone: "0912-000-168", rate: 2200, status: "已派工" },
    { id: 2, name: "志明", trade: "粗工", phone: "0922-100-268", rate: 1800, status: "出勤完成" },
    { id: 3, name: "小林", trade: "清潔工", phone: "0933-200-368", rate: 1600, status: "待派工" },
  ]);
  const [jobs, setJobs] = useState<Job[]>([
    { id: 1, site: "信義商辦拆除", customer: "東禾營造", trade: "拆除工", workers: 6, hours: 8, status: "進行中" },
    { id: 2, site: "新店社區清潔", customer: "明曜物業", trade: "清潔工", workers: 4, hours: 7, status: "完成" },
  ]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([
    { id: 1, worker: "志明", site: "新店社區清潔", hours: 7, allowance: 200, deduction: 0, amount: 1800 },
  ]);
  const [logs, setLogs] = useState<string[]>(["已匯入今日 2 筆派工單與 3 名派遣員工。"]);

  const kpis = useMemo(() => {
    const dispatched = workers.filter((row) => row.status === "已派工" || row.status === "出勤完成").length;
    const completed = jobs.filter((row) => row.status === "完成").length;
    const payrollTotal = payrolls.reduce((sum, row) => sum + row.amount + row.allowance - row.deduction, 0);
    const required = jobs.reduce((sum, row) => sum + row.workers, 0);
    return { dispatched, completed, payrollTotal, required };
  }, [jobs, payrolls, workers]);

  function addWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    setWorkers((rows) => [
      {
        id: Date.now(),
        name,
        trade: String(form.get("trade")),
        phone: String(form.get("phone")),
        rate: Number(form.get("rate")),
        status: "待派工",
      },
      ...rows,
    ]);
    setLogs((rows) => [`新增派遣員工 ${name}，狀態為待派工。`, ...rows]);
    event.currentTarget.reset();
  }

  function addJob() {
    const id = Date.now();
    setJobs((rows) => [
      { id, site: "臨時支援案場", customer: "全興工程", trade: "粗工", workers: 3, hours: 8, status: "待派" },
      ...rows,
    ]);
    setLogs((rows) => ["新增臨時支援派工單，需求粗工 3 人。", ...rows]);
  }

  function settlePayroll() {
    const worker = workers.find((row) => row.status !== "待派工") || workers[0];
    const job = jobs[0];
    const amount = Math.round((worker.rate / 8) * job.hours);
    setPayrolls((rows) => [
      { id: Date.now(), worker: worker.name, site: job.site, hours: job.hours, allowance: 300, deduction: 0, amount },
      ...rows,
    ]);
    setLogs((rows) => [`已結算 ${worker.name} 於 ${job.site} 的 ${job.hours} 小時薪資。`, ...rows]);
  }

  return (
    <div className="dispatch-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日派遣狀態</span>
          <strong>{kpis.dispatched}/{workers.length} 已派工</strong>
          <div className="ops-status-list" aria-label="今日派遣指標">
            <p><span>需求人力</span><b>{kpis.required} 人</b></p>
            <p><span>完成案場</span><b>{kpis.completed} 件</b></p>
            <p><span>待發薪資</span><b>NT$ {kpis.payrollTotal.toLocaleString("zh-TW")}</b></p>
          </div>
          <button type="button" onClick={settlePayroll}>產生薪資清冊</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel worker-panel">
          <div className="panel-heading">
            <h3>派遣員工管理</h3>
            <span>建檔 / 工種 / 狀態</span>
          </div>
          <form className="dispatch-form" onSubmit={addWorker}>
            <input name="name" required placeholder="員工姓名" aria-label="員工姓名" suppressHydrationWarning />
            <select name="trade" required aria-label="工種" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>選擇工種</option>
              {tradeOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input name="phone" required placeholder="聯絡電話" aria-label="聯絡電話" suppressHydrationWarning />
            <input name="rate" required type="number" min="1" placeholder="日薪" aria-label="日薪" suppressHydrationWarning />
            <button type="submit">新增員工</button>
          </form>
          <div className="record-list">
            {workers.map((worker) => (
              <article className="record-card" key={worker.id}>
                <div>
                  <strong>{worker.name} · {worker.trade}</strong>
                  <p>{worker.phone} · 日薪 NT$ {worker.rate.toLocaleString("zh-TW")} · {worker.status}</p>
                </div>
                <div className="status-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={worker.status === status}
                      onClick={() => {
                        setWorkers((rows) => rows.map((row) => (row.id === worker.id ? { ...row, status } : row)));
                        setLogs((rows) => [`${worker.name} 狀態更新為 ${status}。`, ...rows]);
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
            <h3>派工出勤</h3>
            <span>案場與工時</span>
          </div>
          <button className="primary-action" type="button" onClick={addJob}>新增派工單</button>
          <div className="tag-list">
            {jobs.map((job) => (
              <span key={job.id}>{job.site} · {job.customer} · {job.trade} {job.workers} 人 · {job.hours} 小時 · {job.status}</span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>薪資結算</h3>
            <span>清冊與調整</span>
          </div>
          <div className="shop-actions">
            <button type="button" onClick={settlePayroll}>結算薪資</button>
            <button type="button" onClick={() => setLogs((rows) => ["已產生客戶請款摘要。", ...rows])}>產生請款</button>
            <button type="button" onClick={() => setLogs((rows) => ["已匯出派遣薪資明細。", ...rows])}>匯出清冊</button>
          </div>
          <div className="log-list">
            {logs.slice(0, 6).map((log) => <p key={log}>{log}</p>)}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>管理儀表板</h3>
            <span>即時指標</span>
          </div>
          <div className="metric-grid">
            <div><span>員工數</span><strong>{workers.length}</strong></div>
            <div><span>已派工</span><strong>{kpis.dispatched}</strong></div>
            <div><span>案場數</span><strong>{jobs.length}</strong></div>
            <div><span>待發薪資</span><strong>{kpis.payrollTotal.toLocaleString("zh-TW")}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
