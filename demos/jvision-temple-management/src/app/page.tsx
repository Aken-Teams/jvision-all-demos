"use client";

import { useMemo, useState } from "react";

type Devotee = {
  name: string;
  phone: string;
  address: string;
  lamp: string;
  ritual: string;
  amount: number;
  status: string;
};

const initialDevotees: Devotee[] = [
  { name: "林雅婷", phone: "0912-168-388", address: "台中市西區", lamp: "光明燈", ritual: "春季祈福法會", amount: 1800, status: "已收款" },
  { name: "王志明", phone: "0988-520-131", address: "彰化縣員林市", lamp: "安太歲", ritual: "中元普渡", amount: 2600, status: "待通知" },
  { name: "陳美惠", phone: "0933-779-221", address: "新北市板橋區", lamp: "財利燈", ritual: "補財庫", amount: 3200, status: "已開收據" },
];

const lampOptions = ["光明燈", "安太歲", "財利燈", "文昌燈", "姻緣燈"];
const ritualOptions = ["春季祈福法會", "中元普渡", "補財庫", "平安斗", "祖先超薦"];

export default function Page() {
  const [devotees, setDevotees] = useState(initialDevotees);
  const [form, setForm] = useState<Devotee>({
    name: "黃先生",
    phone: "0966-318-886",
    address: "台南市安平區",
    lamp: "光明燈",
    ritual: "補財庫",
    amount: 1200,
    status: "新登記",
  });
  const [selected, setSelected] = useState(0);
  const [notice, setNotice] = useState("LINE 通知尚未產生");

  const totals = useMemo(() => {
    const amount = devotees.reduce((sum, row) => sum + row.amount, 0);
    const receipts = devotees.filter((row) => row.status.includes("收據") || row.status.includes("收款")).length;
    return { amount, lamps: devotees.length, receipts };
  }, [devotees]);

  const current = devotees[selected] ?? devotees[0];
  const aiSummary = `${devotees.length} 位信眾完成登記，今日收入 NT$ ${totals.amount.toLocaleString()}。建議優先通知「待通知」名單，並在法會前一天推播交通與報到提醒。`;

  function addDevotee() {
    setDevotees((rows) => [{ ...form, amount: Number(form.amount) || 0 }, ...rows]);
    setSelected(0);
    setNotice(`${form.name} 已新增，收據與 LINE 通知可立即產生。`);
  }

  function markReceipt() {
    setDevotees((rows) =>
      rows.map((row, index) => (index === selected ? { ...row, status: "已開收據" } : row)),
    );
    setNotice(`${current.name} 的收據已建立，櫃檯可列印或傳送電子收據。`);
  }

  function sendLineNotice() {
    setNotice(`已排程傳送給 ${current.name}：${current.ritual} 報名成功，${current.lamp} 已登記，金額 NT$ ${current.amount.toLocaleString()}。`);
  }

  function balanceLedger() {
    setDevotees((rows) => rows.map((row) => (row.status === "新登記" ? { ...row, status: "已收款" } : row)));
    setNotice("今日新登記項目已批次轉為已收款，會計報表同步更新。");
  }

  return (
    <main>
      <nav className="topbar">
        <a className="brand" href="#dashboard">
          <img src="/logo.png" alt="Jvision" />
          <span>智慧廟務管理</span>
        </a>
        <div className="nav-actions">
          <a href="#counter">櫃檯登記</a>
          <a href="#devotees">信眾名冊</a>
          <a href="#receipt">收據測試</a>
        </div>
      </nav>

      <section className="hero" id="dashboard">
        <div className="hero-copy">
          <p className="eyebrow">Jvision Temple Operations</p>
          <h1>把宮廟櫃檯、點燈、法會報名與收據管理放在同一個工作台。</h1>
          <p>
            參考廟務數位化流程設計，提供信眾資料、點燈牌位、捐款收據、法會活動、發財金與 LINE 通知的完整互動 Demo。
          </p>
          <div className="hero-actions">
            <a className="primary" href="#counter">開始測試</a>
            <a className="secondary" href="#receipt">產生收據</a>
          </div>
        </div>
        <div className="temple-console" aria-label="Jvision 廟務 Demo 儀表板">
          <div className="window-bar">
            <span />
            <span />
            <span />
            <strong>Jvision Temple Console</strong>
          </div>
          <div className="metrics">
            <article>
              <span>今日登記</span>
              <strong>{totals.lamps}</strong>
            </article>
            <article>
              <span>今日收入</span>
              <strong>{totals.amount.toLocaleString()}</strong>
            </article>
            <article>
              <span>收據完成</span>
              <strong>{totals.receipts}</strong>
            </article>
          </div>
          <div className="timeline">
            {devotees.slice(0, 4).map((row, index) => (
              <button key={`${row.name}-${index}`} className={index === selected ? "active" : ""} onClick={() => setSelected(index)}>
                <span>{row.name}</span>
                <small>{row.lamp} · {row.ritual}</small>
                <b>{row.status}</b>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="workflow">
        {[
          ["信眾管理", "建立家戶、聯絡方式、歷年點燈與捐款紀錄。"],
          ["點燈牌位", "光明燈、安太歲、財利燈與文昌燈快速登記。"],
          ["法會活動", "報名、名單、供品與現場報到狀態集中追蹤。"],
          ["會計收據", "櫃檯收款、收據開立、日結與收入分類同步。"],
        ].map(([title, text]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="demo-grid">
        <div className="panel" id="counter">
          <p className="eyebrow">Counter Intake</p>
          <h2>櫃檯快速登記</h2>
          <div className="form-grid">
            <label>
              信眾姓名
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              手機
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label>
              地址
              <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
            <label>
              點燈項目
              <select value={form.lamp} onChange={(event) => setForm({ ...form, lamp: event.target.value })}>
                {lampOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              法會活動
              <select value={form.ritual} onChange={(event) => setForm({ ...form, ritual: event.target.value })}>
                {ritualOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              金額
              <input type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} />
            </label>
          </div>
          <button className="wide-button" onClick={addDevotee}>新增信眾登記</button>
        </div>

        <div className="panel" id="receipt">
          <p className="eyebrow">Receipt & LINE</p>
          <h2>收據與通知測試</h2>
          <div className="receipt-card">
            <img src="/logo.png" alt="Jvision" />
            <div>
              <span>收據抬頭</span>
              <strong>{current.name}</strong>
            </div>
            <div>
              <span>項目</span>
              <strong>{current.lamp} / {current.ritual}</strong>
            </div>
            <div>
              <span>金額</span>
              <strong>NT$ {current.amount.toLocaleString()}</strong>
            </div>
            <small>收據編號 JV-TMP-{String(selected + 1).padStart(4, "0")}</small>
          </div>
          <div className="button-row">
            <button onClick={markReceipt}>開立收據</button>
            <button onClick={sendLineNotice}>產生 LINE 通知</button>
            <button onClick={balanceLedger}>日結入帳</button>
          </div>
          <p className="notice">{notice}</p>
        </div>
      </section>

      <section className="panel full" id="devotees">
        <div className="section-head">
          <div>
            <p className="eyebrow">Devotee Registry</p>
            <h2>信眾名冊與 AI 摘要</h2>
          </div>
          <div className="ai-summary">{aiSummary}</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>手機</th>
                <th>地址</th>
                <th>點燈</th>
                <th>法會</th>
                <th>金額</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              {devotees.map((row, index) => (
                <tr key={`${row.phone}-${index}`} onClick={() => setSelected(index)}>
                  <td>{row.name}</td>
                  <td>{row.phone}</td>
                  <td>{row.address}</td>
                  <td>{row.lamp}</td>
                  <td>{row.ritual}</td>
                  <td>NT$ {row.amount.toLocaleString()}</td>
                  <td><span className="status">{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
