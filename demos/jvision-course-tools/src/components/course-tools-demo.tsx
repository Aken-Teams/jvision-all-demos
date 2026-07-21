"use client";

import { FormEvent, useMemo, useState } from "react";

type CourseStatus = "草稿" | "已發布" | "滿班";

type Course = {
  id: number;
  title: string;
  coach: string;
  room: string;
  time: string;
  capacity: number;
  booked: number;
  waitlist: number;
  status: CourseStatus;
  price: number;
};

type Contract = {
  id: string;
  member: string;
  plan: string;
  amount: number;
  signed: boolean;
  invoice: "未開立" | "已開立";
};

const initialCourses: Course[] = [
  { id: 1, title: "燃脂拳擊", coach: "Mia", room: "A 教室", time: "09:00", capacity: 12, booked: 12, waitlist: 2, status: "滿班", price: 880 },
  { id: 2, title: "皮拉提斯核心", coach: "Leo", room: "B 教室", time: "11:00", capacity: 10, booked: 7, waitlist: 0, status: "已發布", price: 980 },
  { id: 3, title: "瑜珈伸展", coach: "Nina", room: "A 教室", time: "14:30", capacity: 16, booked: 9, waitlist: 1, status: "已發布", price: 680 },
  { id: 4, title: "TRX 肌力循環", coach: "Ryan", room: "C 教室", time: "18:30", capacity: 14, booked: 5, waitlist: 0, status: "草稿", price: 780 }
];

const seats = Array.from({ length: 16 }, (_, index) => index + 1);

export function CourseToolsDemo() {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selectedCourseId, setSelectedCourseId] = useState(2);
  const [memberName, setMemberName] = useState("王小美");
  const [selectedSeat, setSelectedSeat] = useState(5);
  const [wallet, setWallet] = useState(12);
  const [message, setMessage] = useState("請選擇課程並完成預約。");
  const [contracts, setContracts] = useState<Contract[]>([
    { id: "JV-260630-001", member: "王小美", plan: "10 堂團課包", amount: 6800, signed: true, invoice: "已開立" }
  ]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const occupiedSeats = useMemo(() => new Set([1, 2, 4, 9, 12].slice(0, Math.min(5, selectedCourse.booked))), [selectedCourse.booked]);
  const revenue = contracts.reduce((sum, row) => sum + row.amount, 0);
  const published = courses.filter((course) => course.status !== "草稿").length;
  const totalBooked = courses.reduce((sum, course) => sum + course.booked, 0);
  const totalWaitlist = courses.reduce((sum, course) => sum + course.waitlist, 0);

  function publishCourse(id: number) {
    setCourses((current) => current.map((course) => (course.id === id ? { ...course, status: "已發布" } : course)));
    setMessage("課程已發布，會員端會立即同步看到最新課表。");
  }

  function copyWeekSchedule() {
    const nextId = Math.max(...courses.map((course) => course.id)) + 1;
    const copied = courses.slice(0, 3).map((course, index) => ({
      ...course,
      id: nextId + index,
      time: `${Number(course.time.slice(0, 2)) + 1}:00`,
      booked: Math.max(0, course.booked - 3),
      waitlist: 0,
      status: "草稿" as CourseStatus
    }));
    setCourses((current) => [...copied, ...current].slice(0, 8));
    setMessage("已複製上週常態課表，並建立為草稿等待確認。");
  }

  function addCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const course: Course = {
      id: Date.now(),
      title: String(form.get("title") || "新課程"),
      coach: String(form.get("coach") || "Coach"),
      room: String(form.get("room") || "A 教室"),
      time: String(form.get("time") || "20:00"),
      capacity: Number(form.get("capacity") || 12),
      booked: 0,
      waitlist: 0,
      status: "草稿",
      price: Number(form.get("price") || 780)
    };
    setCourses((current) => [course, ...current]);
    setSelectedCourseId(course.id);
    setMessage("新課程已建立為草稿，可在排課面板發布。");
    event.currentTarget.reset();
  }

  function bookCourse() {
    if (wallet <= 0) {
      setMessage("會員堂數不足，請先購買課程包。");
      return;
    }

    setCourses((current) =>
      current.map((course) => {
        if (course.id !== selectedCourse.id) return course;
        if (course.booked >= course.capacity) {
          return { ...course, waitlist: course.waitlist + 1, status: "滿班" };
        }
        const booked = course.booked + 1;
        return { ...course, booked, status: booked >= course.capacity ? "滿班" : course.status };
      })
    );
    setWallet((current) => current - 1);
    setMessage(`${memberName} 已預約 ${selectedCourse.title}，座位 ${selectedSeat} 已鎖定。`);
  }

  function buyPlan() {
    const amount = 6800;
    const id = `JV-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${String(contracts.length + 1).padStart(3, "0")}`;
    setWallet((current) => current + 10);
    setContracts((current) => [{ id, member: memberName, plan: "10 堂團課包", amount, signed: false, invoice: "未開立" }, ...current]);
    setMessage("已建立購課訂單，請完成電子合約簽署與發票開立。");
  }

  function signContract(id: string) {
    setContracts((current) => current.map((contract) => (contract.id === id ? { ...contract, signed: true } : contract)));
    setMessage("電子合約已簽署並自動留存。");
  }

  function issueInvoice(id: string) {
    setContracts((current) => current.map((contract) => (contract.id === id ? { ...contract, invoice: "已開立" } : contract)));
    setMessage("發票已開立並寄送到會員信箱。");
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="metric-card">
          <span>本日預約</span>
          <strong>{totalBooked}</strong>
        </div>
        <div className="metric-card">
          <span>候補人數</span>
          <strong>{totalWaitlist}</strong>
        </div>
        <div className="metric-card">
          <span>已發布課程</span>
          <strong>{published}</strong>
        </div>
        <button className="ghost-button" type="button" onClick={copyWeekSchedule}>複製上週課表</button>
      </aside>

      <div className="demo-main">
        <section className="demo-panel schedule-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Schedule</p>
              <h3>排課工作台</h3>
            </div>
            <span>{courses.length} 堂課</span>
          </div>
          <form className="course-form" onSubmit={addCourse}>
            <input name="title" placeholder="課程名稱" aria-label="課程名稱" required />
            <input name="coach" placeholder="教練" aria-label="教練" required />
            <select name="room" aria-label="教室" defaultValue="A 教室">
              <option>A 教室</option>
              <option>B 教室</option>
              <option>C 教室</option>
            </select>
            <input name="time" placeholder="20:00" aria-label="時間" required />
            <input name="capacity" type="number" min="1" placeholder="名額" aria-label="名額" required />
            <input name="price" type="number" min="0" placeholder="單堂價格" aria-label="單堂價格" required />
            <button type="submit">新增課程</button>
          </form>
          <div className="course-list">
            {courses.map((course) => (
              <article className={`course-row ${selectedCourseId === course.id ? "active" : ""}`} key={course.id}>
                <button type="button" onClick={() => setSelectedCourseId(course.id)}>
                  <strong>{course.time} {course.title}</strong>
                  <span>{course.coach} · {course.room}</span>
                  <small>{course.booked}/{course.capacity} 人 · 候補 {course.waitlist}</small>
                </button>
                <b>{course.status}</b>
                {course.status === "草稿" ? <button type="button" onClick={() => publishCourse(course.id)}>發布</button> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel member-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Reservation</p>
              <h3>會員預約與劃位</h3>
            </div>
            <span>剩餘 {wallet} 堂</span>
          </div>
          <label>
            會員姓名
            <input value={memberName} onChange={(event) => setMemberName(event.target.value)} />
          </label>
          <label>
            選擇課程
            <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(Number(event.target.value))}>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.time} {course.title}</option>
              ))}
            </select>
          </label>
          <div className="seat-map" aria-label="座位圖">
            {seats.map((seat) => {
              const occupied = occupiedSeats.has(seat);
              return (
                <button
                  className={selectedSeat === seat ? "selected" : ""}
                  disabled={occupied}
                  key={seat}
                  type="button"
                  onClick={() => setSelectedSeat(seat)}
                >
                  {seat}
                </button>
              );
            })}
          </div>
          <div className="booking-actions">
            <button className="primary-button" type="button" onClick={bookCourse}>預約並鎖定座位</button>
            <button className="secondary-button" type="button" onClick={buyPlan}>購買 10 堂課包</button>
          </div>
          <p className="demo-message">{message}</p>
        </section>

        <section className="demo-panel contract-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Contract & Invoice</p>
              <h3>電子合約與發票</h3>
            </div>
            <span>NT$ {revenue.toLocaleString("zh-TW")}</span>
          </div>
          <div className="contract-list">
            {contracts.map((contract) => (
              <article className="contract-row" key={contract.id}>
                <div>
                  <strong>{contract.member} · {contract.plan}</strong>
                  <span>{contract.id} · NT$ {contract.amount.toLocaleString("zh-TW")}</span>
                </div>
                <div className="contract-actions">
                  <button type="button" disabled={contract.signed} onClick={() => signContract(contract.id)}>
                    {contract.signed ? "已簽署" : "簽署合約"}
                  </button>
                  <button type="button" disabled={contract.invoice === "已開立"} onClick={() => issueInvoice(contract.id)}>
                    {contract.invoice}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Reports</p>
              <h3>營運即時指標</h3>
            </div>
          </div>
          <div className="analytics-grid">
            <div><span>平均滿班率</span><strong>{Math.round((totalBooked / courses.reduce((sum, course) => sum + course.capacity, 0)) * 100)}%</strong></div>
            <div><span>候補轉換機會</span><strong>{totalWaitlist} 人</strong></div>
            <div><span>課包收入</span><strong>NT$ {revenue.toLocaleString("zh-TW")}</strong></div>
            <div><span>待處理合約</span><strong>{contracts.filter((contract) => !contract.signed).length}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
