"use client";

import { FormEvent, useMemo, useState } from "react";

type ConversationStatus = "新訊息" | "處理中" | "等待客戶" | "已解決";
type Conversation = { id: number; customer: string; channel: string; topic: string; owner: string; priority: string; status: ConversationStatus; aiDraft: string };
type Article = { id: number; title: string; category: string; views: number };
type Campaign = { id: number; target: string; message: string; status: string };

const statuses: ConversationStatus[] = ["新訊息", "處理中", "等待客戶", "已解決"];
const channels = ["Email", "網站聊天", "社群訊息", "產品內訊息", "表單"];
const owners = ["Mia", "Evan", "Ivy", "Noah"];

export function SupportDemo() {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 1, customer: "Ocean Retail", channel: "Email", topic: "發票資料需要修改", owner: "Mia", priority: "高", status: "處理中", aiDraft: "已草擬：我們可以協助更新發票抬頭，請提供統編與公司名稱。" },
    { id: 2, customer: "Green Mart", channel: "網站聊天", topic: "無法登入後台", owner: "Evan", priority: "緊急", status: "新訊息", aiDraft: "已草擬：請先重設密碼，我也會同步檢查帳號狀態。" },
    { id: 3, customer: "Star Studio", channel: "產品內訊息", topic: "如何匯出報表", owner: "Ivy", priority: "一般", status: "等待客戶", aiDraft: "已草擬：報表可從管理後台右上角匯出 CSV。" },
  ]);
  const [articles, setArticles] = useState<Article[]>([
    { id: 1, title: "如何重設密碼與解除登入鎖定", category: "帳號", views: 1420 },
    { id: 2, title: "發票資料修改流程", category: "帳務", views: 860 },
    { id: 3, title: "客服報表匯出教學", category: "報表", views: 540 },
  ]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: 1, target: "新客戶", message: "歡迎教學與快速上手指南", status: "發送中" },
    { id: 2, target: "已解決案件", message: "滿意度調查", status: "已排程" },
  ]);
  const [logs, setLogs] = useState<string[]>(["今日所有客服對話、AI 草稿、知識庫與報表已同步。"]);

  const kpis = useMemo(() => {
    const open = conversations.filter((row) => row.status !== "已解決").length;
    const urgent = conversations.filter((row) => row.priority === "緊急" || row.priority === "高").length;
    const resolved = conversations.filter((row) => row.status === "已解決").length;
    const views = articles.reduce((sum, row) => sum + row.views, 0);
    return { open, urgent, resolved, views, campaigns: campaigns.length };
  }, [articles, campaigns.length, conversations]);

  function addConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customer = String(form.get("customer"));
    const topic = String(form.get("topic"));
    setConversations((rows) => [
      { id: Date.now(), customer, channel: String(form.get("channel")), topic, owner: String(form.get("owner")), priority: String(form.get("priority")), status: "新訊息", aiDraft: `已草擬：您好，我們收到「${topic}」，會先確認資料並提供下一步。` },
      ...rows,
    ]);
    setLogs((rows) => [`新增 ${customer} 的客服對話，系統已自動建立摘要與回覆草稿。`, ...rows]);
    event.currentTarget.reset();
  }

  function assignUrgent() {
    const conversation = conversations.find((row) => row.priority === "緊急" || row.priority === "高") || conversations[0];
    setConversations((rows) => rows.map((row) => row.id === conversation.id ? { ...row, owner: "Noah", status: "處理中" } : row));
    setLogs((rows) => [`${conversation.topic} 已依工作流程分派給 Noah，並標記為優先處理。`, ...rows]);
  }

  function useKnowledgeBase() {
    const article = articles[0];
    setArticles((rows) => rows.map((row) => row.id === article.id ? { ...row, views: row.views + 1 } : row));
    setLogs((rows) => [`已套用知識庫文章「${article.title}」到回覆草稿。`, ...rows]);
  }

  function sendSurvey() {
    setCampaigns((rows) => [{ id: Date.now(), target: "已解決客戶", message: "客服滿意度調查", status: "已發送" }, ...rows]);
    setLogs((rows) => ["已向已解決案件發送滿意度調查，回覆會同步進報表。", ...rows]);
  }

  function resolveTicket() {
    const conversation = conversations.find((row) => row.status !== "已解決") || conversations[0];
    setConversations((rows) => rows.map((row) => row.id === conversation.id ? { ...row, status: "已解決" } : row));
    setLogs((rows) => [`${conversation.customer} 的「${conversation.topic}」已完成回覆並結案。`, ...rows]);
  }

  return (
    <div className="dispatch-demo">
      <aside className="demo-sidebar">
        <img src="https://www.jvision-ai.com/public/logo.png" alt="Jvision logo" />
        <div className="ops-card">
          <span>今日支援狀態</span>
          <strong>{kpis.open} 件待處理</strong>
          <div className="ops-status-list" aria-label="今日客服支援指標">
            <p><span>高優先案件</span><b>{kpis.urgent} 件</b></p>
            <p><span>知識庫瀏覽</span><b>{kpis.views.toLocaleString("zh-TW")}</b></p>
            <p><span>主動訊息</span><b>{kpis.campaigns} 則</b></p>
          </div>
          <button type="button" onClick={assignUrgent}>自動分派急件</button>
        </div>
      </aside>

      <div className="demo-workspace">
        <section className="demo-panel worker-panel">
          <div className="panel-heading">
            <h3>共享客服收件箱</h3>
            <span>對話 / 分派 / SLA</span>
          </div>
          <form className="dispatch-form" onSubmit={addConversation}>
            <input name="customer" required placeholder="客戶或公司名稱" aria-label="客戶或公司名稱" suppressHydrationWarning />
            <select name="channel" required aria-label="來源渠道" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>來源渠道</option>
              {channels.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input name="topic" required placeholder="問題主旨" aria-label="問題主旨" suppressHydrationWarning />
            <select name="owner" required aria-label="負責人" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>負責人</option>
              {owners.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select name="priority" required aria-label="優先度" defaultValue="" suppressHydrationWarning>
              <option value="" disabled>優先度</option>
              <option>一般</option>
              <option>高</option>
              <option>緊急</option>
            </select>
            <button type="submit">新增客服對話</button>
          </form>
          <div className="record-list">
            {conversations.map((conversation) => (
              <article className="record-card" key={conversation.id}>
                <div>
                  <strong>{conversation.customer} · {conversation.topic}</strong>
                  <p>{conversation.channel} · 負責 {conversation.owner} · 優先度 {conversation.priority}</p>
                  <p>{conversation.aiDraft}</p>
                </div>
                <div className="status-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={conversation.status === status}
                      onClick={() => {
                        setConversations((rows) => rows.map((row) => (row.id === conversation.id ? { ...row, status } : row)));
                        setLogs((rows) => [`${conversation.customer} 的對話狀態更新為 ${status}。`, ...rows]);
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
            <h3>AI 回覆與知識庫</h3>
            <span>摘要 / 草稿 / 文章</span>
          </div>
          <button className="primary-action" type="button" onClick={useKnowledgeBase}>套用知識庫文章</button>
          <div className="record-list">
            {articles.map((article) => (
              <article className="record-card" key={article.id}>
                <div>
                  <strong>{article.title}</strong>
                  <p>{article.category} · 瀏覽 {article.views.toLocaleString("zh-TW")} 次</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <h3>工作流程與主動訊息</h3>
            <span>分派 / 調查 / 通知</span>
          </div>
          <div className="shop-actions">
            <button type="button" onClick={assignUrgent}>自動分派</button>
            <button type="button" onClick={resolveTicket}>完成結案</button>
            <button type="button" onClick={sendSurvey}>發送滿意度調查</button>
            <button type="button" onClick={() => setLogs((rows) => ["已將退款與錯誤回報加入專屬客服視圖。", ...rows])}>建立客服視圖</button>
          </div>
          <div className="tag-list">
            {campaigns.map((campaign) => <span key={campaign.id}>{campaign.target} · {campaign.message} · {campaign.status}</span>)}
          </div>
        </section>

        <section className="demo-panel analytics-panel">
          <div className="panel-heading">
            <h3>客服洞察儀表板</h3>
            <span>量體 / 回覆 / 滿意度</span>
          </div>
          <div className="metric-grid">
            <div><span>待處理</span><strong>{kpis.open}</strong></div>
            <div><span>已解決</span><strong>{kpis.resolved}</strong></div>
            <div><span>高優先</span><strong>{kpis.urgent}</strong></div>
            <div><span>自助瀏覽</span><strong>{Math.round(kpis.views / 100) / 10}K</strong></div>
          </div>
          <div className="log-list">
            {logs.slice(0, 5).map((log) => <p key={log}>{log}</p>)}
          </div>
        </section>
      </div>
    </div>
  );
}
