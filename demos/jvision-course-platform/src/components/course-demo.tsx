"use client";

import { FormEvent, useMemo, useState } from "react";

type Course = { id: number; title: string; price: number; lessons: number; students: number };
type CartItem = Course & { qty: number };

const initialCourses: Course[] = [
  { id: 1, title: "AI 產品經理實戰班", price: 6800, lessons: 24, students: 420 },
  { id: 2, title: "Notion 工作流課", price: 2800, lessons: 12, students: 880 },
  { id: 3, title: "品牌內容變現課", price: 4600, lessons: 18, students: 260 }
];

export function CourseDemo() {
  const [courses, setCourses] = useState(initialCourses);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [orders, setOrders] = useState(["#JV-C1024 AI 產品經理實戰班 已付款"]);
  const [lessons, setLessons] = useState(["01 課程定位", "02 銷售頁撰寫", "03 影音錄製流程"]);
  const [assignments, setAssignments] = useState(["Mika：已提交作業，等待老師回饋"]);
  const [leads, setLeads] = useState(["amy@example.com 下載免費講義"]);

  const discount = coupon.toUpperCase() === "JVISION20" ? 0.8 : 1;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.round(subtotal * discount);
  const kpis = useMemo(() => ({
    revenue: orders.length * 6800 + total,
    students: courses.reduce((sum, c) => sum + c.students, 0),
    completion: 68 + assignments.length,
    leads: leads.length
  }), [assignments.length, courses, leads.length, orders.length, total]);

  function addCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCourses((current) => [{
      id: Math.floor(Math.random() * 9000) + 100,
      title: String(form.get("title")),
      price: Number(form.get("price")),
      lessons: Number(form.get("lessons")),
      students: 0
    }, ...current]);
    event.currentTarget.reset();
  }

  function addToCart(course: Course) {
    setCart((current) => {
      const found = current.find((item) => item.id === course.id);
      if (found) return current.map((item) => item.id === course.id ? { ...item, qty: item.qty + 1 } : item);
      return [...current, { ...course, qty: 1 }];
    });
  }

  function checkout() {
    if (!cart.length) return;
    setOrders((rows) => [`#JV-C${Math.floor(Math.random() * 8000) + 2000} ${cart.map((item) => item.title).join("、")} 已付款 NT$ ${total.toLocaleString("zh-TW")}`, ...rows].slice(0, 5));
    setCart([]);
    setCoupon("");
  }

  return (
    <div className="course-demo">
      <aside className="course-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="mentor-card">
          <span>Creator Dashboard</span>
          <strong>NT$ {kpis.revenue.toLocaleString("zh-TW")}</strong>
          <p>學員 {kpis.students} · 完課率 {kpis.completion}% · 名單 {kpis.leads}</p>
          <button type="button" onClick={() => setLeads((rows) => [`lead${rows.length + 1}@example.com 報名直播`, ...rows])}>模擬直播報名</button>
        </div>
      </aside>

      <div className="course-workspace">
        <section className="demo-panel">
          <div className="panel-heading"><h3>課程產品管理</h3><span>Course Builder</span></div>
          <form className="course-form" onSubmit={addCourse}>
            <input name="title" required placeholder="課程名稱" aria-label="課程名稱" />
            <input name="price" required type="number" min="1" placeholder="價格" aria-label="價格" />
            <input name="lessons" required type="number" min="1" placeholder="單元數" aria-label="單元數" />
            <button type="submit">新增課程</button>
          </form>
          <div className="course-grid">
            {courses.map((course) => (
              <button className="course-card" type="button" key={course.id} onClick={() => addToCart(course)}>
                <strong>{course.title}</strong>
                <span>{course.lessons} 單元 · {course.students} 學員</span>
                <b>NT$ {course.price.toLocaleString("zh-TW")}</b>
              </button>
            ))}
          </div>
        </section>

        <section className="demo-panel cart-panel">
          <div className="panel-heading"><h3>銷售與金流</h3><span>Checkout</span></div>
          <div className="cart-list">
            {cart.length === 0 ? <p className="empty">點選課程加入購物車。折扣碼：JVISION20</p> : cart.map((item) => (
              <div className="cart-row" key={item.id}><span>{item.title} x {item.qty}</span><strong>NT$ {(item.price * item.qty).toLocaleString("zh-TW")}</strong></div>
            ))}
          </div>
          <label>折扣碼<input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="JVISION20" aria-label="折扣碼" /></label>
          <div className="total-box"><span>小計 NT$ {subtotal.toLocaleString("zh-TW")}</span><strong>總計 NT$ {total.toLocaleString("zh-TW")}</strong></div>
          <button className="primary-action" type="button" onClick={checkout}>完成結帳</button>
          <div className="tag-list">{orders.map((row) => <span key={row}>{row}</span>)}</div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>影音單元</h3><span>Streaming</span></div>
          <form className="course-form small" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setLessons((rows) => [`${form.get("lesson")}`, ...rows]);
            event.currentTarget.reset();
          }}>
            <input name="lesson" required placeholder="新增單元標題" aria-label="新增單元標題" />
            <button type="submit">新增單元</button>
          </form>
          <div className="tag-list">{lessons.map((lesson) => <span key={lesson}>{lesson}</span>)}</div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading"><h3>作業與回饋</h3><span>Learning</span></div>
          <form className="course-form small" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setAssignments((rows) => [`${form.get("student")}：${form.get("feedback")}`, ...rows]);
            event.currentTarget.reset();
          }}>
            <input name="student" required placeholder="學員" aria-label="學員" />
            <input name="feedback" required placeholder="作業 / 回饋" aria-label="作業回饋" />
            <button type="submit">送出回饋</button>
          </form>
          <div className="tag-list">{assignments.map((row) => <span key={row}>{row}</span>)}</div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading"><h3>營運報表</h3><span>Analytics</span></div>
          <div className="metric-grid">
            <div><span>營收</span><strong>NT$ {kpis.revenue.toLocaleString("zh-TW")}</strong></div>
            <div><span>學員</span><strong>{kpis.students}</strong></div>
            <div><span>完課率</span><strong>{kpis.completion}%</strong></div>
            <div><span>名單</span><strong>{kpis.leads}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
