/**
 * 導入與使用分析頁。
 *
 * 兩份資料來源刻意分開：
 *   content/import-timeline.json  靜態產物，由 tools/build-import-timeline.mjs 產生，
 *                                 直接開檔也看得到（不需要跑 gateway）。
 *   /api/usage                    只有經 npm run dev 的 gateway 才有；取不到時
 *                                 整頁仍可用，只是使用統計區塊顯示如何啟用。
 * 圖表用內嵌 SVG 自己畫，不引入任何圖表庫——管理頁要能離線開。
 */
const $ = (s) => document.querySelector(s);
const state = { timeline: null, usage: null, viewsByRepo: new Map(), page: 1 };
const PAGE_SIZE = 60;

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf = (n) => Number(n || 0).toLocaleString("zh-TW");

function fmt(iso, withTime = true) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" });
  return withTime ? `${date} ${d.toLocaleTimeString("zh-TW", { hour12: false, hour: "2-digit", minute: "2-digit" })}` : date;
}

/**
 * 水平長條圖。用 HTML + CSS grid 畫，不用 SVG——在 SVG 裡混用 viewBox 座標
 * 與百分比寬度會在窄視窗撐破版面（實測 390px 時溢出 708px）。
 */
function barChart(items, { labelKey = "label", valueKey = "value", alt = () => false } = {}) {
  if (!items.length) return '<p class="hint">沒有資料。</p>';
  const max = Math.max(...items.map((i) => i[valueKey])) || 1;
  return `<div class="bars">${items.map((item) => {
    const label = String(item[labelKey]);
    const ratio = Math.max(0.01, item[valueKey] / max);
    return `<div class="bar-row" title="${esc(label)}：${nf(item[valueKey])}">
      <span class="bar-label">${esc(label)}</span>
      <span class="bar-track"><i class="bar-fill${alt(item) ? " alt" : ""}" style="width:${(ratio * 100).toFixed(2)}%"></i></span>
      <span class="bar-value">${nf(item[valueKey])}</span>
    </div>`;
  }).join("")}</div>`;
}

/* ── 導入 ─────────────────────────────────────────────── */
function renderImport() {
  const t = state.timeline;
  const days = t.days.filter((d) => d.date !== "未知");
  $("#importHint").textContent =
    `共 ${nf(t.total)} 個專案，分 ${days.length} 個批次導入；最早 ${days[0]?.date}，最新 ${days.at(-1)?.date}。`;
  $("#importChart").innerHTML = barChart(
    days.map((d) => ({ label: d.date, value: d.count, date: d.date })),
    { alt: (i) => i.date === days.at(-1)?.date },
  );

  $("#batchRows").innerHTML = days.slice().reverse().map((d) => `<tr>
      <td><b>${esc(d.date)}</b></td>
      <td class="num">${nf(d.count)}</td>
      <td>${d.subjects.length ? d.subjects.map((s) => `<div>${esc(s)}</div>`).join("") : '<span class="hint">—</span>'}
        <span class="pill">${d.categories} 個分類</span></td>
    </tr>`).join("");

  const filter = $("#batchFilter");
  for (const d of days.slice().reverse()) filter.add(new Option(`${d.date}（${d.count}）`, d.date));
}

/* ── 使用 ─────────────────────────────────────────────── */
function renderUsage() {
  const u = state.usage;
  const body = $("#usageBody");

  if (!u || !u.available) {
    $("#usageHint").textContent = "目前沒有使用紀錄。";
    body.innerHTML = `<div class="notice">
      使用統計由 <code>npm run dev</code> 的 gateway 記錄，經它造訪過的頁面才會進統計。<br />
      直接用 <code>npx serve</code> 或開本機檔案不會留下紀錄。<br /><br />
      ${esc(u?.note || "")}
    </div>`;
    $("#usagePanels").hidden = true;
    return;
  }

  $("#usageHint").textContent = `統計區間：最近 ${u.windowDays} 天。`;
  const t = u.totals;
  body.innerHTML = `
    <div class="kpi-row">
      <div class="kpi"><b>${nf(t.views)}</b><span>總瀏覽</span></div>
      <div class="kpi"><b>${nf(t.visitors)}</b><span>不重複訪客</span></div>
      <div class="kpi"><b>${nf(t.demoViews)}</b><span>Demo 開啟次數</span></div>
      <div class="kpi"><b>${nf(t.distinctDemos)}</b><span>被開過的 Demo 數</span></div>
    </div>
    <p class="hint">裝置分布：桌機 ${nf(t.device.desktop || 0)}　手機 ${nf(t.device.mobile || 0)}
      （${nf(t.distinctDemos)} / ${nf(state.timeline.total)} 套曾被開啟，
      ${((t.distinctDemos / Math.max(1, state.timeline.total)) * 100).toFixed(1)}%）</p>
    ${u.byDay.length > 1 ? `<h4 style="margin:16px 0 6px;font-size:.9rem">每日瀏覽</h4>${
      barChart(u.byDay.map((d) => ({ label: d.date, value: d.views })))}` : ""}`;

  $("#usagePanels").hidden = !u.topDemos.length;
  const titleOf = new Map(state.timeline.projects.map((p) => [p.repoName, p.title]));
  $("#topDemoRows").innerHTML = u.topDemos.map((d) => `<tr>
      <td><b>${esc(titleOf.get(d.target) || d.target)}</b><br /><small class="hint">${esc(d.target)}</small></td>
      <td class="num">${nf(d.views)}</td>
      <td class="num">${nf(d.visitors)}</td>
      <td>${fmt(d.last)}</td>
    </tr>`).join("");
}

/* ── 明細表 ────────────────────────────────────────────── */
function visibleProjects() {
  const q = $("#search").value.trim().toLowerCase();
  const batch = $("#batchFilter").value;
  const sort = $("#sortBy").value;
  let rows = state.timeline.projects.filter((p) => {
    if (batch && (p.importedAt || "").slice(0, 10) !== batch) return false;
    if (!q) return true;
    return [p.title, p.repoName, p.category, p.id].join(" ").toLowerCase().includes(q);
  });
  const views = (p) => state.viewsByRepo.get(p.repoName) || 0;
  if (sort === "views") rows = rows.slice().sort((a, b) => views(b) - views(a));
  else if (sort === "title") rows = rows.slice().sort((a, b) => String(a.title).localeCompare(String(b.title), "zh-Hant"));
  else rows = rows.slice().sort((a, b) => String(b.importedAt || "").localeCompare(String(a.importedAt || "")));
  return rows;
}

function renderList() {
  const rows = visibleProjects();
  const slice = rows.slice(0, state.page * PAGE_SIZE);
  $("#projectRows").innerHTML = slice.map((p) => {
    const v = state.viewsByRepo.get(p.repoName) || 0;
    return `<tr>
      <td><b>${esc(p.title)}</b><br /><small class="hint">#${esc(p.id)} · ${esc(p.repoName)}</small></td>
      <td>${esc(p.category || "—")}</td>
      <td>${fmt(p.importedAt)}${p.origin === "manifest" ? ' <span class="pill new">本批</span>' : ""}</td>
      <td>${fmt(p.publishedAt)}</td>
      <td class="num">${v ? nf(v) : '<span class="hint">—</span>'}</td>
    </tr>`;
  }).join("");
  $("#listSummary").innerHTML = `顯示 ${nf(slice.length)} / ${nf(rows.length)} 筆` +
    (slice.length < rows.length ? '　<button id="moreBtn" type="button">載入更多</button>' : "");
  const more = $("#moreBtn");
  if (more) more.addEventListener("click", () => { state.page += 1; renderList(); });
}

/* ── 載入 ─────────────────────────────────────────────── */
async function loadUsage() {
  const days = $("#windowSelect").value;
  try {
    const r = await fetch(`/api/usage?days=${days}`, { cache: "no-store" });
    state.usage = r.ok ? await r.json() : { available: false, note: `伺服器回應 ${r.status}` };
  } catch (e) {
    state.usage = { available: false, note: `無法連線：${e.message}` };
  }
  state.viewsByRepo = new Map((state.usage?.topDemos || []).map((d) => [d.target, d.views]));
  renderUsage();
  renderList();
}

async function boot() {
  try {
    const r = await fetch("./content/import-timeline.json", { cache: "no-store" });
    if (!r.ok) throw new Error(`讀取失敗（${r.status}）`);
    state.timeline = await r.json();
  } catch (e) {
    $("#pageSummary").textContent = "無法載入導入資料，請先執行 node tools/build-import-timeline.mjs";
    $("#importHint").textContent = e.message;
    return;
  }
  const days = state.timeline.days.filter((d) => d.date !== "未知");
  $("#pageSummary").textContent =
    `${nf(state.timeline.total)} 個專案 · ${days.length} 個導入批次 · 資料產生於 ${fmt(state.timeline.generatedAt)}`;
  renderImport();
  renderList();
  await loadUsage();
}

$("#refreshBtn").addEventListener("click", loadUsage);
$("#windowSelect").addEventListener("change", loadUsage);
for (const id of ["#search", "#batchFilter", "#sortBy"]) {
  $(id).addEventListener("input", () => { state.page = 1; renderList(); });
}
boot();
