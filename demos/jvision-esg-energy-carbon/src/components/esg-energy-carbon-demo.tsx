"use client";

import { FormEvent, useMemo, useState } from "react";

type MeterStatus = "正常" | "注意" | "異常";
type ScopeName = "Scope 1" | "Scope 2" | "Scope 3";

type Meter = {
  id: number;
  name: string;
  area: string;
  kw: number;
  kwh: number;
  status: MeterStatus;
};

type EmissionItem = {
  id: number;
  site: string;
  source: string;
  scope: ScopeName;
  amount: number;
  unit: string;
  factor: number;
  owner: string;
};

type SavingTask = {
  id: number;
  title: string;
  owner: string;
  saving: number;
  status: "待評估" | "執行中" | "已完成";
};

const logoUrl = "https://www.jvision-ai.com/public/logo.png";
const statuses: MeterStatus[] = ["正常", "注意", "異常"];

const factorOptions = [
  { source: "外購電力", scope: "Scope 2" as ScopeName, unit: "kWh", factor: 0.494 },
  { source: "天然氣", scope: "Scope 1" as ScopeName, unit: "立方公尺", factor: 1.879 },
  { source: "公務車汽油", scope: "Scope 1" as ScopeName, unit: "公升", factor: 2.606 },
  { source: "物流運輸", scope: "Scope 3" as ScopeName, unit: "公里", factor: 0.12 },
  { source: "外包廢棄物", scope: "Scope 3" as ScopeName, unit: "公斤", factor: 0.115 },
];

const scopeNotes: Record<ScopeName, string> = {
  "Scope 1": "直接排放",
  "Scope 2": "外購能源排放",
  "Scope 3": "價值鏈間接排放",
};

function displayScope(scope: ScopeName) {
  return `${scopeNotes[scope]}（${scope}）`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 }).format(value);
}

function emission(item: EmissionItem) {
  return (item.amount * item.factor) / 1000;
}

function formatTon(value: number) {
  return `${formatNumber(value)} tCO2e`;
}

export function EsgEnergyCarbonDemo() {
  const [meters, setMeters] = useState<Meter[]>([
    { id: 1, name: "A 棟空調主機", area: "總部 5F", kw: 168, kwh: 1260, status: "正常" },
    { id: 2, name: "產線空壓機", area: "工廠 3F", kw: 92, kwh: 780, status: "注意" },
    { id: 3, name: "照明迴路", area: "倉儲區", kw: 54, kwh: 420, status: "正常" },
  ]);
  const [emissions, setEmissions] = useState<EmissionItem[]>([
    { id: 1, site: "總部辦公室", source: "外購電力", scope: "Scope 2", amount: 42800, unit: "kWh", factor: 0.494, owner: "行政部" },
    { id: 2, site: "桃園廠", source: "天然氣", scope: "Scope 1", amount: 3200, unit: "立方公尺", factor: 1.879, owner: "廠務部" },
    { id: 3, site: "物流配送", source: "物流運輸", scope: "Scope 3", amount: 18500, unit: "公里", factor: 0.12, owner: "供應鏈" },
  ]);
  const [tasks, setTasks] = useState<SavingTask[]>([
    { id: 1, title: "空壓機離峰排程", owner: "廠務部", saving: 8, status: "執行中" },
    { id: 2, title: "辦公室照明自動關閉", owner: "行政部", saving: 5, status: "待評估" },
  ]);
  const [logs, setLogs] = useState<string[]>([
    "已同步能源資料並更新外購能源排放（Scope 2）。",
    "產線空壓機用電高於基準，已建立改善任務。",
  ]);
  const [aiSummary, setAiSummary] = useState(
    "目前外購電力是主要排放來源，建議優先檢查空調、空壓機與尖峰用電排程。",
  );

  const [form, setForm] = useState({
    site: "新竹辦公室",
    owner: "營運部",
    amount: "12600",
    selected: "外購電力",
  });

  const selectedFactor = factorOptions.find((item) => item.source === form.selected) ?? factorOptions[0];

  const totals = useMemo(() => {
    const byScope: Record<ScopeName, number> = { "Scope 1": 0, "Scope 2": 0, "Scope 3": 0 };
    for (const item of emissions) byScope[item.scope] += emission(item);
    const total = Object.values(byScope).reduce((sum, value) => sum + value, 0);
    const kwh = meters.reduce((sum, meter) => sum + meter.kwh, 0);
    const kw = meters.reduce((sum, meter) => sum + meter.kw, 0);
    const warning = meters.filter((meter) => meter.status !== "正常").length;
    const saving = tasks.reduce((sum, task) => sum + task.saving, 0);
    return { byScope, total, kwh, kw, warning, saving };
  }, [emissions, meters, tasks]);

  const sortedSources = useMemo(
    () => [...emissions].sort((a, b) => emission(b) - emission(a)),
    [emissions],
  );

  function addEmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setLogs((rows) => ["請輸入大於 0 的活動數據。", ...rows]);
      return;
    }

    const next: EmissionItem = {
      id: Date.now(),
      site: form.site || "未命名場域",
      owner: form.owner || "待指派",
      source: selectedFactor.source,
      scope: selectedFactor.scope,
      amount,
      unit: selectedFactor.unit,
      factor: selectedFactor.factor,
    };

    setEmissions((rows) => [next, ...rows]);
    setLogs((rows) => [`已新增 ${next.site} / ${next.source}，換算 ${formatTon(emission(next))}。`, ...rows]);
  }

  function addMeter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const meter = {
      id: Date.now(),
      name: String(data.get("name")),
      area: String(data.get("area")),
      kw: Number(data.get("kw")) || 0,
      kwh: Number(data.get("kwh")) || 0,
      status: "正常" as MeterStatus,
    };
    setMeters((rows) => [meter, ...rows]);
    setLogs((rows) => [`已接入 ${meter.name} 能源資料，系統將同步估算外購能源排放（Scope 2）。`, ...rows]);
    event.currentTarget.reset();
  }

  function createTask() {
    const source = sortedSources[0];
    const task: SavingTask = {
      id: Date.now(),
      title: `${source.site} ${source.source} 節能改善`,
      owner: source.owner,
      saving: 10,
      status: "待評估",
    };
    setTasks((rows) => [task, ...rows]);
    setLogs((rows) => [`已依排放熱點建立任務：${task.title}。`, ...rows]);
  }

  function generateSummary() {
    const top = sortedSources[0];
    const scopeTwoShare = totals.total ? (totals.byScope["Scope 2"] / totals.total) * 100 : 0;
    setAiSummary(
      `目前總排放 ${formatTon(totals.total)}，最大來源是「${top.site} / ${top.source}」。外購能源排放（Scope 2）佔比 ${formatNumber(scopeTwoShare)}%，建議先處理尖峰用電、設備排程與綠電採購。`,
    );
    setLogs((rows) => ["AI 已完成能源與碳排熱點分析。", ...rows]);
  }

  return (
    <div className="demo-shell">
      <aside className="demo-sidebar">
        <img src={logoUrl} alt="Jvision logo" />
        <div className="metric"><span>年度排放量</span><strong>{formatTon(totals.total)}</strong></div>
        <div className="metric"><span>即時用電</span><strong>{formatNumber(totals.kw)} kW</strong></div>
        <div className="metric"><span>本月用電</span><strong>{formatNumber(totals.kwh)} kWh</strong></div>
        <div className="metric"><span>預估節能</span><strong>{totals.saving}%</strong></div>
      </aside>

      <div className="demo-main">
        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>碳盤查資料</span>
              <h3>新增活動數據</h3>
            </div>
          </div>
          <form className="input-grid" onSubmit={addEmission}>
            <input value={form.site} onChange={(event) => setForm({ ...form, site: event.target.value })} aria-label="場域名稱" />
            <input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} aria-label="負責單位" />
            <select value={form.selected} onChange={(event) => setForm({ ...form, selected: event.target.value })} aria-label="排放來源">
              {factorOptions.map((item) => <option key={item.source}>{item.source}</option>)}
            </select>
            <input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} aria-label="活動數據" />
            <button type="submit">新增盤查資料</button>
          </form>
          <p className="status-message">
            目前係數：{selectedFactor.source} / 單位 {selectedFactor.unit} / {selectedFactor.factor} kgCO2e / {displayScope(selectedFactor.scope)}。
          </p>
        </section>

        <section className="demo-panel ai-panel">
          <div className="panel-heading">
            <div>
              <span>Jvision AI</span>
              <h3>能源與碳排摘要</h3>
            </div>
          </div>
          <p className="ai-summary">{aiSummary}</p>
          <div className="button-row">
            <button type="button" onClick={generateSummary}>生成 AI 摘要</button>
            <button type="button" onClick={createTask}>建立節能任務</button>
          </div>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>能源監控</span>
              <h3>接入電表與設備</h3>
            </div>
          </div>
          <form className="meter-form" onSubmit={addMeter}>
            <input name="name" required placeholder="設備名稱" aria-label="設備名稱" />
            <input name="area" required placeholder="場域" aria-label="設備場域" />
            <input name="kw" required type="number" min="1" placeholder="即時 kW" aria-label="即時用電" />
            <input name="kwh" required type="number" min="1" placeholder="本月 kWh" aria-label="本月用電" />
            <button type="submit">新增能源設備</button>
          </form>
          <div className="meter-grid">
            {meters.map((meter) => (
              <article className="meter-card" key={meter.id}>
                <div>
                  <strong>{meter.name}</strong>
                  <span>{meter.area} · {meter.kw} kW · {meter.kwh} kWh</span>
                </div>
                <em className={`state state-${meter.status}`}>{meter.status}</em>
                <div className="status-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={meter.status === status}
                      onClick={() => setMeters((rows) => rows.map((row) => row.id === meter.id ? { ...row, status } : row))}
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
            <div>
              <span>排放熱點</span>
              <h3>來源排序</h3>
            </div>
          </div>
          <div className="hotspot-list">
            {sortedSources.map((item) => {
              const ratio = totals.total ? Math.max(6, (emission(item) / totals.total) * 100) : 0;
              return (
                <article className="hotspot-row" key={item.id}>
                  <strong>{item.source}</strong>
                  <span>{item.site} · {item.owner}</span>
                  <div className="hotspot-track"><i style={{ width: `${ratio}%` }} /></div>
                  <b>{formatTon(emission(item))}</b>
                </article>
              );
            })}
          </div>
        </section>

        <section className="demo-panel">
          <div className="panel-heading">
            <div>
              <span>減碳行動</span>
              <h3>改善任務看板</h3>
            </div>
          </div>
          <div className="task-list">
            {tasks.map((task) => (
              <article className="task-card" key={task.id}>
                <strong>{task.title}</strong>
                <span>{task.owner} · 預估節能 {task.saving}%</span>
                <select
                  value={task.status}
                  aria-label={`${task.title} 狀態`}
                  onChange={(event) => setTasks((rows) => rows.map((row) => row.id === task.id ? { ...row, status: event.target.value as SavingTask["status"] } : row))}
                >
                  <option>待評估</option>
                  <option>執行中</option>
                  <option>已完成</option>
                </select>
              </article>
            ))}
          </div>
        </section>

        <section className="demo-panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>操作紀錄</span>
              <h3>系統同步狀態</h3>
            </div>
          </div>
          <div className="log-list">
            {logs.slice(0, 6).map((log, index) => <p key={`${log}-${index}`}>{log}</p>)}
          </div>
        </section>
      </div>
    </div>
  );
}
