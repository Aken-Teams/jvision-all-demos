"use client";

import { FormEvent, useMemo, useState } from "react";

type Attendance = "未到校" | "已到校" | "請假" | "已接走";
type Student = { id: number; name: string; parent: string; className: string; attendance: Attendance; feeDue: number };
type Course = { id: number; name: string; teacher: string; room: string; time: string };
type Message = { id: number; target: string; content: string; type: "聯絡簿" | "接送" | "繳費" };

const statuses: Attendance[] = ["未到校", "已到校", "請假", "已接走"];
const classOptions = ["幼幼班 A", "小一安親 B", "英文才藝 C", "課後照顧 D"];

export function EducationCareDemo() {
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "陳小安", parent: "陳媽媽", className: "幼幼班 A", attendance: "已到校", feeDue: 0 },
    { id: 2, name: "林小語", parent: "林爸爸", className: "小一安親 B", attendance: "未到校", feeDue: 6800 },
    { id: 3, name: "王小晴", parent: "王媽媽", className: "課後照顧 D", attendance: "已接走", feeDue: 1200 },
  ]);
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: "幼幼班 A", teacher: "Amy 老師", room: "教室 201", time: "16:30" },
    { id: 2, name: "小一安親 B", teacher: "Ben 老師", room: "閱讀區", time: "15:40" },
  ]);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, target: "陳小安", content: "今日午睡穩定，下午完成拼音練習，請帶回閱讀單。", type: "聯絡簿" },
    { id: 2, target: "王小晴", content: "已由媽媽接走，離校時間 18:10。", type: "接送" },
  ]);

  const kpis = useMemo(() => {
    const arrived = students.filter((row) => row.attendance === "已到校" || row.attendance === "已接走").length;
    const unpaid = students.filter((row) => row.feeDue > 0).length;
    const totalDue = students.reduce((sum, row) => sum + row.feeDue, 0);
    const pickup = students.filter((row) => row.attendance === "已到校").length;
    return { arrived, unpaid, totalDue, pickup };
  }, [students]);

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    setStudents((rows) => [
      {
        id: Date.now(),
        name,
        parent: String(form.get("parent")),
        className: String(form.get("className")),
        attendance: "未到校",
        feeDue: Number(form.get("feeDue")),
      },
      ...rows,
    ]);
    setMessages((rows) => [{ id: Date.now(), target: name, content: "新生資料已建立，請行政確認家長聯絡方式與收費項目。", type: "聯絡簿" }, ...rows]);
    event.currentTarget.reset();
  }

  function addCourse() {
    const id = Date.now();
    setCourses((rows) => [
      { id, name: "自然探索課", teacher: "Nina 老師", room: "教室 101", time: "17:30" },
      ...rows,
    ]);
    setMessages((rows) => [{ id, target: "全班家長", content: "已新增自然探索課，可在聯絡簿確認課程與接送時間。", type: "聯絡簿" }, ...rows]);
  }

  function sendMessage(type: Message["type"]) {
    const student = students[0];
    const content =
      type === "接送"
        ? `${student.name} 已到校並完成點名，待放學接送確認。`
        : type === "繳費"
          ? `${student.name} 的本月費用已產生，請家長於期限內完成繳費。`
          : `${student.name} 今日學習與生活紀錄已更新。`;
    setMessages((rows) => [{ id: Date.now(), target: student.name, content, type }, ...rows]);
  }

  return (
    <div className="care-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日到校狀態</span>
          <strong>{kpis.arrived}/{students.length} 已到校</strong>
          <div className="ops-status-list" aria-label="園務重點">
            <p>
              <span>未收款</span>
              <b>{kpis.unpaid} 筆</b>
            </p>
            <p>
              <span>待接送確認</span>
              <b>{kpis.pickup} 位</b>
            </p>
            <p>
              <span>應收金額</span>
              <b>NT$ {kpis.totalDue.toLocaleString("zh-TW")}</b>
            </p>
          </div>
          <button type="button" onClick={() => sendMessage("聯絡簿")}>
            產生今日通知
          </button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel student-panel">
          <div className="panel-heading">
            <h3>學童名冊</h3>
            <span>資料 / 班級 / 收費</span>
          </div>
          <form className="care-form" onSubmit={addStudent}>
            <input name="name" required placeholder="學童姓名" aria-label="學童姓名" suppressHydrationWarning />
            <input name="parent" required placeholder="家長姓名" aria-label="家長姓名" suppressHydrationWarning />
            <select name="className" required aria-label="班級" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>
                選擇班級
              </option>
              {classOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input name="feeDue" required type="number" min="0" placeholder="應收金額" aria-label="應收金額" suppressHydrationWarning />
            <button type="submit">新增學童</button>
          </form>
          <div className="record-list">
            {students.map((student) => (
              <article className="record-card" key={student.id}>
                <div>
                  <strong>
                    {student.name} · {student.className}
                  </strong>
                  <p>
                    家長：{student.parent} · 狀態：{student.attendance} · 應收 NT$ {student.feeDue.toLocaleString("zh-TW")}
                  </p>
                </div>
                <div className="status-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={student.attendance === status}
                      onClick={() => {
                        setStudents((rows) => rows.map((row) => (row.id === student.id ? { ...row, attendance: status } : row)));
                        setMessages((rows) => [{ id: Date.now(), target: student.name, content: `${student.name} 狀態已更新為「${status}」。`, type: "接送" }, ...rows]);
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
            <h3>課表與排班</h3>
            <span>老師與教室</span>
          </div>
          <button className="primary-action" type="button" onClick={addCourse}>
            新增課程
          </button>
          <div className="tag-list">
            {courses.map((course) => (
              <span key={course.id}>
                {course.name} · {course.teacher} · {course.room} · {course.time}
              </span>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>聯絡簿與提醒</h3>
            <span>家長溝通</span>
          </div>
          <div className="shop-actions">
            <button type="button" onClick={() => sendMessage("聯絡簿")}>生活紀錄</button>
            <button type="button" onClick={() => sendMessage("接送")}>接送提醒</button>
            <button type="button" onClick={() => sendMessage("繳費")}>繳費通知</button>
          </div>
          <div className="log-list">
            {messages.slice(0, 6).map((message) => (
              <p key={message.id}>
                {message.type} · {message.target}：{message.content}
              </p>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>園務 KPI</h3>
            <span>即時統計</span>
          </div>
          <div className="metric-grid">
            <div>
              <span>學童數</span>
              <strong>{students.length}</strong>
            </div>
            <div>
              <span>已到校</span>
              <strong>{kpis.arrived}</strong>
            </div>
            <div>
              <span>未收款</span>
              <strong>{kpis.unpaid}</strong>
            </div>
            <div>
              <span>應收金額</span>
              <strong>{kpis.totalDue.toLocaleString("zh-TW")}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
