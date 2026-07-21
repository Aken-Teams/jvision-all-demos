"use client";

import { useMemo, useState } from "react";

type ScopeName = "範疇一" | "範疇二" | "範疇三";

type Activity = {
  id: number;
  site: string;
  source: string;
  scope: ScopeName;
  scopeNote: string;
  amount: number;
  unit: string;
  factor: number;
  owner: string;
};

const scopeNotes: Record<ScopeName, string> = {
  "範疇一": "直接排放",
  "範疇二": "外購能源排放",
  "範疇三": "其他間接排放"
};

const initialActivities: Activity[] = [
  { id: 1, site: "台北總部", source: "外購電力", scope: "範疇二", scopeNote: scopeNotes["範疇二"], amount: 42800, unit: "度電", factor: 0.494, owner: "行政部" },
  { id: 2, site: "桃園廠", source: "天然氣", scope: "範疇一", scopeNote: scopeNotes["範疇一"], amount: 3200, unit: "立方公尺", factor: 1.879, owner: "廠務部" },
  { id: 3, site: "台中倉", source: "物流運輸", scope: "範疇三", scopeNote: scopeNotes["範疇三"], amount: 18500, unit: "噸公里", factor: 0.12, owner: "供應鏈" },
  { id: 4, site: "高雄據點", source: "冷媒逸散", scope: "範疇一", scopeNote: scopeNotes["範疇一"], amount: 18, unit: "公斤", factor: 1430, owner: "總務部" }
];

const factorOptions = [
  { source: "外購電力", scope: "範疇二" as ScopeName, unit: "度電", factor: 0.494 },
  { source: "天然氣", scope: "範疇一" as ScopeName, unit: "立方公尺", factor: 1.879 },
  { source: "柴油", scope: "範疇一" as ScopeName, unit: "公升", factor: 2.606 },
  { source: "物流運輸", scope: "範疇三" as ScopeName, unit: "噸公里", factor: 0.12 },
  { source: "員工差旅", scope: "範疇三" as ScopeName, unit: "公里", factor: 0.115 },
  { source: "冷媒逸散", scope: "範疇一" as ScopeName, unit: "公斤", factor: 1430 }
];

function emission(activity: Activity) {
  return (activity.amount * activity.factor) / 1000;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 }).format(value);
}

function formatEmission(value: number) {
  return `${formatNumber(value)} 公噸 CO2e`;
}

export default function CarbonDemo({ logoUrl }: { logoUrl: string }) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [form, setForm] = useState({
    site: "新竹研發中心",
    owner: "永續辦公室",
    amount: "12600",
    selected: "外購電力"
  });
  const [message, setMessage] = useState("請新增一筆活動資料，系統會即時更新排放清冊。");
  const [aiSummary, setAiSummary] = useState("AI 查核摘要尚未生成。");

  const selectedFactor = factorOptions.find((item) => item.source === form.selected) ?? factorOptions[0];

  const totals = useMemo(() => {
    const byScope: Record<ScopeName, number> = { "範疇一": 0, "範疇二": 0, "範疇三": 0 };
    for (const item of activities) byScope[item.scope] += emission(item);
    const total = byScope["範疇一"] + byScope["範疇二"] + byScope["範疇三"];
    return { byScope, total };
  }, [activities]);

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => emission(b) - emission(a)),
    [activities]
  );

  function addActivity() {
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("請輸入大於 0 的活動資料數量。");
      return;
    }
    const next: Activity = {
      id: Date.now(),
      site: form.site || "未指定場域",
      owner: form.owner || "未指定責任單位",
      source: selectedFactor.source,
      scope: selectedFactor.scope,
      scopeNote: scopeNotes[selectedFactor.scope],
      amount,
      unit: selectedFactor.unit,
      factor: selectedFactor.factor
    };
    setActivities((current) => [next, ...current]);
    setMessage(`已新增「${next.site} / ${next.source}」，試算排放量為 ${formatEmission(emission(next))}。`);
  }

  function generateSummary() {
    const hotspot = sortedActivities[0];
    const scopeTwoShare = totals.total ? (totals.byScope["範疇二"] / totals.total) * 100 : 0;
    setAiSummary(
      `本次盤查總排放為 ${formatEmission(totals.total)}。目前最大熱點是「${hotspot.site} / ${hotspot.source}」，約占 ${formatNumber((emission(hotspot) / totals.total) * 100)}%。範疇二用電排放占比 ${formatNumber(scopeTwoShare)}%，建議優先檢查用電資料完整性、再生能源憑證與高用量場域。`
    );
  }

  const reportCards = [
    ["總排放量", formatEmission(totals.total), "依目前清冊即時計算"],
    ["範疇一", formatEmission(totals.byScope["範疇一"]), "公司自己直接產生的排放"],
    ["範疇二", formatEmission(totals.byScope["範疇二"]), "外購電力或能源造成的排放"],
    ["範疇三", formatEmission(totals.byScope["範疇三"]), "供應鏈、運輸、差旅等間接排放"]
  ];

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision" />
        <div className="metric"><span>盤查年度</span><strong>2026</strong></div>
        <div className="metric"><span>活動資料筆數</span><strong>{activities.length}</strong></div>
        <div className="metric"><span>資料審核率</span><strong>86%</strong></div>
        <div className="metric"><span>係數版本</span><strong>第 3 版</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>活動資料輸入</span>
              <h3>新增盤查資料</h3>
            </div>
          </div>
          <div className="input-grid">
            <input value={form.site} onChange={(event) => setForm({ ...form, site: event.target.value })} aria-label="場域名稱" />
            <input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} aria-label="責任單位" />
            <select value={form.selected} onChange={(event) => setForm({ ...form, selected: event.target.value })} aria-label="排放來源">
              {factorOptions.map((item) => (
                <option key={item.source}>{item.source}</option>
              ))}
            </select>
            <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} aria-label="活動資料數量" />
            <button type="button" onClick={addActivity}>新增並試算排放量</button>
          </div>
          <p className="status-message">
            目前係數：{selectedFactor.source} / 每 {selectedFactor.unit} 約 {selectedFactor.factor} 公斤 CO2e / {selectedFactor.scope}（{scopeNotes[selectedFactor.scope]}）
          </p>
          <p className="status-message">{message}</p>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <div>
              <span>AI 資料檢查</span>
              <h3>查核摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <button type="button" onClick={generateSummary}>生成 AI 查核摘要</button>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>盤查成果</span>
              <h3>排放清冊總覽</h3>
            </div>
            <button className="report-button" type="button" onClick={() => setMessage("已模擬匯出盤查報告：包含邊界、活動資料、係數來源與排放清冊。")}>
              匯出報告
            </button>
          </div>
          <div className="report-grid">
            {reportCards.map(([label, value, note]) => (
              <article className="report-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>資料明細</span>
              <h3>活動資料列表</h3>
            </div>
          </div>
          <div className="inventory-list">
            {activities.map((item) => (
              <article className="inventory-card" key={item.id}>
                <span>{item.site} / {item.owner}</span>
                <strong>{item.source}</strong>
                <div className="chip-row">
                  <em className="chip">{item.scope}：{item.scopeNote}</em>
                  <em className="chip">{formatNumber(item.amount)} {item.unit}</em>
                  <em className="chip">{formatEmission(emission(item))}</em>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>熱點分析</span>
              <h3>高排放來源排序</h3>
            </div>
          </div>
          <div className="hotspot-list">
            {sortedActivities.slice(0, 5).map((item) => {
              const ratio = totals.total ? Math.max(5, (emission(item) / totals.total) * 100) : 0;
              return (
                <article className="hotspot-row" key={item.id}>
                  <strong>{item.source}</strong>
                  <div className="hotspot-track"><i style={{ width: `${ratio}%` }} /></div>
                  <span>{formatEmission(emission(item))}</span>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
