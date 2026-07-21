"use client";

import { FormEvent, useMemo, useState } from "react";

type Course = { id: number; title: string; teacher: string; price: number; lessons: number; students: number; status: "草稿" | "已上架" };
type Booking = { id: number; title: string; time: string; teacher: string; seats: number; waitlist: number };
type Student = { id: number; name: string; course: string; progress: number; status: "學習中" | "待回饋" | "已完課" };

export function CourseSuiteDemo() {
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, title: "AI 行銷實戰課", teacher: "Mia", price: 6800, lessons: 12, students: 186, status: "已上架" },
    { id: 2, title: "品牌內容變現課", teacher: "Leo", price: 4600, lessons: 18, students: 260, status: "已上架" },
  ]);
  const [bookings, setBookings] = useState<Booking[]>([
    { id: 1, title: "直播導讀課", time: "週三 19:30", teacher: "Mia", seats: 6, waitlist: 3 },
    { id: 2, title: "小班實作課", time: "週六 10:00", teacher: "Leo", seats: 2, waitlist: 5 },
  ]);
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "王小姐", course: "AI 行銷實戰課", progress: 72, status: "學習中" },
    { id: 2, name: "陳先生", course: "品牌內容變現課", progress: 100, status: "待回饋" },
  ]);
  const [logs, setLogs] = useState<string[]>(["已同步課程、課表、購課、學習進度與營運資料。"]);

  const kpis = useMemo(() => {
    const revenue = courses.reduce((sum, course) => sum + course.price * course.students, 0);
    const totalStudents = courses.reduce((sum, course) => sum + course.students, 0);
    const completion = Math.round(students.reduce((sum, student) => sum + student.progress, 0) / students.length);
    const published = courses.filter((course) => course.status === "已上架").length;
    return { revenue, totalStudents, completion, published };
  }, [courses, students]);

  function addCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const course: Course = {
      id: Date.now(),
      title: String(form.get("title")),
      teacher: String(form.get("teacher")),
      price: Number(form.get("price")) || 0,
      lessons: Number(form.get("lessons")) || 1,
      students: 0,
      status: "草稿",
    };
    setCourses((rows) => [course, ...rows]);
    setLogs((rows) => [`${course.title} 已建立為課程草稿。`, ...rows]);
    event.currentTarget.reset();
  }

  function publishCourse(id: number) {
    setCourses((rows) => rows.map((course) => course.id === id ? { ...course, status: "已上架", students: course.students + 12 } : course));
    setLogs((rows) => ["課程已上架，銷售頁與會員端課表同步更新。", ...rows]);
  }

  function reserveClass(id: number) {
    setBookings((rows) => rows.map((item) => item.id === id ? { ...item, seats: Math.max(0, item.seats - 1), waitlist: item.seats > 0 ? item.waitlist : item.waitlist + 1 } : item));
    setLogs((rows) => ["已完成預約；若座位額滿會自動加入候補。", ...rows]);
  }

  function addLesson() {
    setCourses((rows) => rows.map((course, index) => index === 0 ? { ...course, lessons: course.lessons + 1 } : course));
    setLogs((rows) => ["已新增影音單元與作業任務。", ...rows]);
  }

  function reviewHomework() {
    setStudents((rows) => rows.map((student) => student.status === "待回饋" ? { ...student, status: "已完課" } : { ...student, progress: Math.min(100, student.progress + 8) }));
    setLogs((rows) => ["已回覆作業並更新學員進度。", ...rows]);
  }

  return (
    <div className="suite-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="metric"><span>課程營收</span><strong>NT$ {Math.round(kpis.revenue / 1000)}K</strong></div>
        <div className="metric"><span>學員人數</span><strong>{kpis.totalStudents}</strong></div>
        <div className="metric"><span>平均進度</span><strong>{kpis.completion}%</strong></div>
        <div className="metric"><span>已上架課程</span><strong>{kpis.published}</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading"><h3>課程上架</h3><span>內容 / 價格 / 講師</span></div>
          <form className="form-grid" onSubmit={addCourse}>
            <input name="title" required placeholder="課程名稱" aria-label="課程名稱" suppressHydrationWarning />
            <input name="teacher" required placeholder="講師" aria-label="講師" suppressHydrationWarning />
            <input name="price" required type="number" min="1" placeholder="售價" aria-label="售價" suppressHydrationWarning />
            <input name="lessons" required type="number" min="1" placeholder="單元數" aria-label="單元數" suppressHydrationWarning />
            <button type="submit">新增課程</button>
          </form>
          <div className="course-list">
            {courses.map((course) => (
              <article key={course.id}>
                <div className="course-copy">
                  <strong>{course.title}</strong>
                  <span>{course.teacher} · {course.lessons} 單元 · {course.students} 位學員</span>
                </div>
                <span className={`status-pill ${course.status === "已上架" ? "is-live" : "is-draft"}`}>{course.status}</span>
                <button type="button" onClick={() => publishCourse(course.id)} disabled={course.status === "已上架"}>
                  {course.status === "已上架" ? "已發布" : "發布上架"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading"><h3>Jvision AI 營運摘要</h3><span>銷售 / 學習 / 候補</span></div>
          <p className="ai-summary">目前營收 NT$ {Math.round(kpis.revenue / 1000)}K，平均學習進度 {kpis.completion}%。建議優先補開「{[...bookings].sort((a, b) => b.waitlist - a.waitlist)[0].title}」，並追蹤待回饋作業。</p>
          <button type="button" onClick={addLesson}>新增影音單元</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading"><h3>課表預約與購課</h3><span>座位 / 候補 / 通知</span></div>
          <div className="booking-grid">
            {bookings.map((booking) => (
              <article key={booking.id}>
                <div>
                  <strong>{booking.title}</strong>
                  <span>{booking.time} · {booking.teacher}</span>
                </div>
                <p><b>{booking.seats}</b> 席可預約</p>
                <p><b>{booking.waitlist}</b> 位候補中</p>
                <button type="button" onClick={() => reserveClass(booking.id)}>{booking.seats > 0 ? "預約課程" : "加入候補"}</button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>學員進度</h3><button type="button" onClick={reviewHomework}>回覆作業</button></div>
          <div className="student-list">
            {students.map((student) => (
              <article key={student.id}>
                <div>
                  <strong>{student.name}</strong>
                  <span>{student.course} · {student.status}</span>
                </div>
                <meter min="0" max="100" value={student.progress} />
                <b>{student.progress}%</b>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>操作紀錄</h3><span>流程同步</span></div>
          <div className="log-list">{logs.slice(0, 6).map((log, index) => <p key={`${log}-${index}`}>{log}</p>)}</div>
        </section>
      </div>
    </div>
  );
}
