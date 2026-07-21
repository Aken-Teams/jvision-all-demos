"use client";

import { FormEvent, useMemo, useState } from "react";

type Stage = "新商機" | "已確認" | "提案中" | "已成交";

type Contact = {
  id: number;
  name: string;
  company: string;
  email: string;
  owner: string;
  score: number;
};

type Deal = {
  id: number;
  title: string;
  contactId: number;
  stage: Stage;
  amount: number;
};

type Task = {
  id: number;
  text: string;
  due: string;
  done: boolean;
};

const stages: Stage[] = ["新商機", "已確認", "提案中", "已成交"];

const initialContacts: Contact[] = [
  { id: 1, name: "林欣怡", company: "Atlas Retail", email: "grace@atlas.example", owner: "Mia", score: 82 },
  { id: 2, name: "張柏翰", company: "Northstar SaaS", email: "ben@northstar.example", owner: "Leo", score: 74 },
  { id: 3, name: "陳以柔", company: "Blue Peak", email: "irene@bluepeak.example", owner: "Nina", score: 91 }
];

const initialDeals: Deal[] = [
  { id: 1, title: "Atlas CRM 導入", contactId: 1, stage: "提案中", amount: 680000 },
  { id: 2, title: "Northstar 續約", contactId: 2, stage: "已確認", amount: 420000 },
  { id: 3, title: "Blue Peak 顧問方案", contactId: 3, stage: "新商機", amount: 260000 }
];

export function CrmDemo() {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "回覆 Atlas 報價問題", due: "今天", done: false },
    { id: 2, text: "安排 Northstar demo call", due: "明天", done: false }
  ]);
  const [activeContactId, setActiveContactId] = useState(1);
  const [activity, setActivity] = useState(["已建立 Atlas CRM 導入商機。"]);
  const [message, setMessage] = useState("選擇客戶後，可建立商機、任務與活動紀錄。");

  const activeContact = contacts.find((contact) => contact.id === activeContactId) ?? contacts[0];
  const openRevenue = deals.filter((deal) => deal.stage !== "已成交").reduce((sum, deal) => sum + deal.amount, 0);
  const wonRevenue = deals.filter((deal) => deal.stage === "已成交").reduce((sum, deal) => sum + deal.amount, 0);
  const taskOpen = tasks.filter((task) => !task.done).length;
  const stageTotals = useMemo(() => stages.map((stage) => ({
    stage,
    count: deals.filter((deal) => deal.stage === stage).length,
    amount: deals.filter((deal) => deal.stage === stage).reduce((sum, deal) => sum + deal.amount, 0)
  })), [deals]);

  function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const contact: Contact = {
      id: Date.now(),
      name: String(form.get("name") || "新客戶"),
      company: String(form.get("company") || "New Company"),
      email: String(form.get("email") || "new@example.com"),
      owner: String(form.get("owner") || "Mia"),
      score: 65
    };
    setContacts((current) => [contact, ...current]);
    setActiveContactId(contact.id);
    setActivity((current) => [`新增客戶 ${contact.name}。`, ...current].slice(0, 6));
    setMessage("新客戶已建立，可立即新增商機或待辦。");
    event.currentTarget.reset();
  }

  function addDeal() {
    const deal: Deal = {
      id: Date.now(),
      title: `${activeContact.company} 導入專案`,
      contactId: activeContact.id,
      stage: "新商機",
      amount: 300000
    };
    setDeals((current) => [deal, ...current]);
    setTasks((current) => [{ id: Date.now() + 1, text: `跟進 ${activeContact.company} 需求訪談`, due: "今天", done: false }, ...current]);
    setActivity((current) => [`新增商機：${deal.title}。`, ...current].slice(0, 6));
    setMessage("商機已建立，系統也同步建立跟進任務。");
  }

  function moveDeal(id: number, direction: 1 | -1) {
    setDeals((current) => current.map((deal) => {
      if (deal.id !== id) return deal;
      const index = stages.indexOf(deal.stage);
      const nextStage = stages[Math.max(0, Math.min(stages.length - 1, index + direction))];
      return { ...deal, stage: nextStage };
    }));
    setActivity((current) => ["商機階段已更新。", ...current].slice(0, 6));
    setMessage("銷售進度已更新，報表同步刷新。");
  }

  function completeTask(id: number) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: true } : task)));
    setActivity((current) => ["完成一項業務待辦。", ...current].slice(0, 6));
  }

  function logActivity() {
    setActivity((current) => [`已記錄 ${activeContact.name} 的 demo call 與需求摘要。`, ...current].slice(0, 6));
    setMessage("活動紀錄已寫入客戶時間軸。");
  }

  return (
    <div className="crm-shell">
      <aside className="crm-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="metric"><span>客戶數</span><strong>{contacts.length}</strong></div>
        <div className="metric"><span>進行中金額</span><strong>NT$ {openRevenue.toLocaleString("zh-TW")}</strong></div>
        <div className="metric"><span>成交金額</span><strong>NT$ {wonRevenue.toLocaleString("zh-TW")}</strong></div>
        <div className="metric"><span>待辦任務</span><strong>{taskOpen}</strong></div>
      </aside>

      <div className="crm-main">
        <section className="crm-panel contacts-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">客戶名單</p>
              <h3>客戶資料庫</h3>
            </div>
            <span>{contacts.length} 筆資料</span>
          </div>
          <form className="contact-form" onSubmit={addContact}>
            <input name="name" required placeholder="姓名" aria-label="姓名" />
            <input name="company" required placeholder="公司" aria-label="公司" />
            <input name="email" required placeholder="Email" aria-label="Email" />
            <select name="owner" aria-label="負責人" defaultValue="Mia">
              <option>Mia</option>
              <option>Leo</option>
              <option>Nina</option>
            </select>
            <button type="submit">新增客戶</button>
          </form>
          <div className="contact-list">
            {contacts.map((contact) => (
              <button className={contact.id === activeContactId ? "active" : ""} key={contact.id} type="button" onClick={() => setActiveContactId(contact.id)}>
                <strong>{contact.name}</strong>
                <span>{contact.company} · {contact.owner}</span>
                <small>分數 {contact.score} · {contact.email}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="crm-panel profile-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">客戶完整資料</p>
              <h3>{activeContact.company}</h3>
            </div>
            <span>{activeContact.name}</span>
          </div>
          <div className="profile-card">
            <strong>{activeContact.name}</strong>
            <span>{activeContact.email}</span>
            <span>負責人：{activeContact.owner}</span>
            <b>潛在成交分數 {activeContact.score}</b>
          </div>
          <div className="quick-actions">
            <button type="button" onClick={addDeal}>建立商機</button>
            <button type="button" onClick={logActivity}>記錄活動</button>
          </div>
          <p className="demo-message">{message}</p>
        </section>

        <section className="crm-panel pipeline-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">銷售進度</p>
              <h3>銷售管線</h3>
            </div>
          </div>
          <div className="pipeline-grid">
            {stageTotals.map((column) => (
              <div className="stage-column" key={column.stage}>
                <strong>{column.stage}</strong>
                <span>{column.count} 筆商機 · NT$ {column.amount.toLocaleString("zh-TW")}</span>
                {deals.filter((deal) => deal.stage === column.stage).map((deal) => (
                  <article className="deal-card" key={deal.id}>
                    <b>{deal.title}</b>
                    <span>NT$ {deal.amount.toLocaleString("zh-TW")}</span>
                    <div>
                      <button type="button" onClick={() => moveDeal(deal.id, -1)}>←</button>
                      <button type="button" onClick={() => moveDeal(deal.id, 1)}>→</button>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="crm-panel tasks-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">任務與活動</p>
              <h3>任務與活動紀錄</h3>
            </div>
          </div>
          <div className="task-list">
            {tasks.map((task) => (
              <label className={task.done ? "done" : ""} key={task.id}>
                <input type="checkbox" checked={task.done} onChange={() => completeTask(task.id)} />
                <span>{task.text}</span>
                <small>{task.due}</small>
              </label>
            ))}
          </div>
          <div className="activity-list">
            {activity.map((row) => <span key={row}>{row}</span>)}
          </div>
        </section>
      </div>
    </div>
  );
}
