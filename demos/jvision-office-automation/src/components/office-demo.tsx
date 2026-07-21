"use client";

import { useMemo, useState } from "react";

type RequestItem = {
  id: number;
  title: string;
  owner: string;
  type: string;
  amount: string;
  status: "待主管簽核" | "財務覆核" | "資訊協作" | "完成歸檔";
  note: string;
};

const stages: RequestItem["status"][] = ["待主管簽核", "財務覆核", "資訊協作", "完成歸檔"];

const initialRequests: RequestItem[] = [
  { id: 1001, title: "台北總部會議室設備採購", owner: "Mia", type: "請購", amount: "NT$ 86,000", status: "待主管簽核", note: "投影機與無線麥克風更新" },
  { id: 1002, title: "年度資安教育訓練合約", owner: "Leo", type: "合約", amount: "NT$ 160,000", status: "財務覆核", note: "法務已標記付款條款" },
  { id: 1003, title: "新人到職帳號與筆電申請", owner: "Nina", type: "人事", amount: "3 位新人", status: "資訊協作", note: "需同步開通郵件與雲端硬碟" },
  { id: 1004, title: "高雄據點固定資產盤點", owner: "Ryan", type: "資產", amount: "42 項", status: "完成歸檔", note: "盤點差異已補充照片" }
];

const portalItems = [
  { title: "差旅費申請辦法", tag: "制度", text: "國內出差需於返程後 7 日內完成費用申請，附上票據與主管簽核紀錄。" },
  { title: "資訊設備領用規範", tag: "IT", text: "筆電、手機與周邊設備需建立資產編號，離職或調任時由資訊部回收。" },
  { title: "會議室預約公告", tag: "公告", text: "大型會議室開放跨部門預約，超過 20 人會議可申請視訊設備支援。" },
  { title: "合約用印流程", tag: "法務", text: "合約定稿後需完成法務審閱、財務付款確認與授權主管簽核。" }
];

export default function OfficeDemo({ logoUrl }: { logoUrl: string }) {
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [form, setForm] = useState({
    title: "員工福利平台續約申請",
    owner: "Ariel",
    type: "合約",
    amount: "NT$ 120,000",
    note: "需要法務確認續約條款"
  });
  const [query, setQuery] = useState("合約");
  const [message, setMessage] = useState("請送出一張簽核單，或用箭頭推進流程狀態。");
  const [aiSummary, setAiSummary] = useState("AI 摘要尚未生成。");

  const filteredPortal = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return portalItems;
    return portalItems.filter((item) => `${item.title}${item.tag}${item.text}`.toLowerCase().includes(keyword));
  }, [query]);

  const metrics = useMemo(() => {
    const pending = requests.filter((item) => item.status !== "完成歸檔").length;
    const done = requests.filter((item) => item.status === "完成歸檔").length;
    const finance = requests.filter((item) => item.status === "財務覆核").length;
    return { pending, done, finance };
  }, [requests]);

  function submitRequest() {
    const next: RequestItem = {
      id: Date.now(),
      title: form.title || "未命名簽核單",
      owner: form.owner || "未指定",
      type: form.type,
      amount: form.amount || "待補充",
      note: form.note || "無備註",
      status: "待主管簽核"
    };
    setRequests((current) => [next, ...current]);
    setMessage(`已建立「${next.title}」，目前送到主管簽核。`);
  }

  function moveRequest(id: number, direction: -1 | 1) {
    setRequests((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const currentIndex = stages.indexOf(item.status);
        const nextIndex = Math.min(Math.max(currentIndex + direction, 0), stages.length - 1);
        const nextStatus = stages[nextIndex];
        setMessage(`「${item.title}」已移動到：${nextStatus}`);
        return { ...item, status: nextStatus };
      })
    );
  }

  function generateSummary() {
    const urgent = requests.filter((item) => item.status !== "完成歸檔").slice(0, 3);
    const lines = urgent.map((item) => `「${item.title}」目前在${item.status}，負責人 ${item.owner}`).join("；");
    setAiSummary(`今日共有 ${metrics.pending} 件待辦、${metrics.finance} 件需財務覆核。建議優先處理：${lines || "目前沒有待辦流程"}。`);
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision" />
        <div className="metric"><span>待辦流程</span><strong>{metrics.pending}</strong></div>
        <div className="metric"><span>已完成</span><strong>{metrics.done}</strong></div>
        <div className="metric"><span>財務覆核</span><strong>{metrics.finance}</strong></div>
        <div className="metric"><span>平台狀態</span><strong>正常</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>FLOW DESIGN</span>
              <h3>新增流程簽核單</h3>
            </div>
          </div>
          <div className="form-grid">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} aria-label="流程標題" />
            <input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} aria-label="負責人" />
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} aria-label="流程類型">
              <option>請購</option>
              <option>合約</option>
              <option>人事</option>
              <option>資產</option>
              <option>公文</option>
            </select>
            <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} aria-label="金額或數量" />
            <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} aria-label="備註" />
            <button type="button" onClick={submitRequest}>送出簽核單</button>
          </div>
          <p className="status-message">{message}</p>
        </section>

        <section className="demo-panel ai-card">
          <div className="panel-heading">
            <div>
              <span>JVISION AI</span>
              <h3>今日辦公摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button type="button" onClick={generateSummary}>生成 AI 摘要</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>PORTAL & KNOWLEDGE</span>
              <h3>企業門戶搜尋</h3>
            </div>
            <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜尋門戶內容" />
          </div>
          <div className="portal-grid">
            {filteredPortal.map((item) => (
              <article className="portal-card" key={item.title}>
                <span>{item.tag}</span>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                <button className="portal-action" type="button" onClick={() => setMessage(`已開啟「${item.title}」內容。`)}>
                  開啟內容
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>PROCESS TRACKING</span>
              <h3>流程處理佇列</h3>
            </div>
          </div>
          <div className="request-list">
            {requests.map((item) => (
              <article className="request-card" key={item.id}>
                <span>{item.type} / {item.status}</span>
                <strong>{item.title}</strong>
                <span>{item.owner} · {item.amount}</span>
                <p>{item.note}</p>
                <div className="request-actions">
                  <button type="button" onClick={() => moveRequest(item.id, -1)} aria-label="退回上一關">←</button>
                  <button type="button" onClick={() => moveRequest(item.id, 1)} aria-label="送到下一關">→</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>DATA CENTER</span>
              <h3>資料管理中心</h3>
            </div>
          </div>
          <div className="data-table">
            <div className="data-row"><span>本月簽核</span><strong>438</strong><span>較上月 +12%</span></div>
            <div className="data-row"><span>平均處理</span><strong>1.8 天</strong><span>縮短 0.6 天</span></div>
            <div className="data-row"><span>知識文件</span><strong>1,264</strong><span>權限控管中</span></div>
            <div className="data-row"><span>服務事件</span><strong>96.4%</strong><span>自動完成率</span></div>
          </div>
          <div className="log-list">
            <div className="log-row"><span>09:20</span><strong>合約流程觸發付款條件檢查</strong><em className="pill">自動化</em></div>
            <div className="log-row"><span>10:05</span><strong>會議紀錄產生三項待辦</strong><em className="pill">AI</em></div>
            <div className="log-row"><span>11:30</span><strong>資產盤點資料同步到報表</strong><em className="pill">資料中心</em></div>
          </div>
        </section>
      </div>
    </div>
  );
}
