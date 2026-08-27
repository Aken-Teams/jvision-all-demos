/**
 * Agent 資料抽取器(pilot)——把 demo 畫面上寫死的資料抽成結構化檔案。
 *
 * 原則:抽取而非生成。agent 之後查到的數字必須等於畫面上的數字,
 * 所以資料唯一來源是「實際渲染後的 DOM 與圖表實例」,不用 LLM 補。
 *
 *   node tools/agent-data-extract.mjs <repo...>          抽指定幾套
 *   node tools/agent-data-extract.mjs --pilot=20         自動挑 20 套(跨分類 + 固定旗艦)
 *
 * 產出:
 *   content/agent-data/<repo>.json    每畫面的 KPI / 表格 / 圖表資料
 *   content/agent-cards/<repo>.json   A2A 風格 agent card(能力 + 資料清單)
 *   content/agent-cards/index.json    全部卡片的彙總索引(之後給 list_systems 用)
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import * as staticServer from "./lib/static-server.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = 4599;
const DATA_DIR = path.join(ROOT, "content", "agent-data");
const CARD_DIR = path.join(ROOT, "content", "agent-cards");

/* 舊世代旗艦(464 時期、Chart.js/const 陣列寫法)一定要進 pilot,
   它們和新世代(forge 產出、ECharts/inline 資料)結構差最多,
   兩邊都抽得動,全站鋪開才有把握。 */
const CURATED = [
  "jvision-crm", "jvision-production-order", "jvision-attendance",
  "jvision-bizbooks", "jvision-construction", "jvision-course-tools",
];

function pickPilot(n) {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalog-index.json"), "utf8"));
  const picked = CURATED.filter((r) => fs.existsSync(path.join(ROOT, "demos", r, "index.html")));
  const byCat = new Map();
  for (const p of catalog.projects) {
    if (picked.includes(p.repoName)) continue;
    if (!byCat.has(p.category)) byCat.set(p.category, []);
    byCat.get(p.category).push(p.repoName);
  }
  // 每個分類取最新一套(陣列尾端),輪流補到 n 套為止
  const cats = [...byCat.keys()];
  let i = 0;
  while (picked.length < n && cats.length) {
    const cat = cats[i % cats.length];
    const repo = byCat.get(cat).pop();
    if (!repo) { cats.splice(i % cats.length, 1); continue; }
    if (fs.existsSync(path.join(ROOT, "demos", repo, "index.html"))) picked.push(repo);
    i += 1;
  }
  return picked.slice(0, n);
}

/* 在渲染完成的頁面上抽當前畫面的 KPI / 表格 / 圖表。跑在瀏覽器 context。 */
function extractScreen() {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 10 && r.height > 8; };
  /* 取文字時剔除 icon 字型的連字(material symbols 的 innerText 是
     "savings" 這類英文代號,混進標籤會汙染資料)。 */
  const ICON_SEL = '.material-symbols-outlined,[class*="material-symbols"],.material-icons,i[class*="fa-"]';
  const text = (el) => {
    if (!el) return "";
    if (!el.querySelector || !el.querySelector(ICON_SEL)) return (el.innerText || "").trim();
    const clone = el.cloneNode(true);
    clone.querySelectorAll(ICON_SEL).forEach((x) => x.remove());
    const holder = document.createElement("div");
    holder.style.cssText = "position:absolute;left:-9999px;top:0";
    holder.appendChild(clone);
    document.body.appendChild(holder);
    const s = (clone.innerText || clone.textContent || "").trim();
    holder.remove();
    return s;
  };
  const clip = (s, n = 80) => String(s ?? "").trim().slice(0, n);

  const heading = [...document.querySelectorAll("h1,h2,h3")].filter(vis).map(text).find(Boolean) || "";

  // KPI:class 帶 stat/kpi/metric 的葉容器,內文要有一行像數值
  const kpis = [];
  const seenKpi = new Set();
  const isValue = (s) => /^[≈~+\-−]?\d[\d.,]*\s*(%|人|件|筆|天|日|小時|分鐘|次|元|萬|億|張|台|套|班|批|項|kg|hr|h|pt)?$/i.test(s);
  for (const el of document.querySelectorAll('[class*="stat"],[class*="kpi"],[class*="metric"],[data-kpi],[data-metric]')) {
    if (!vis(el) || el.querySelector('[class*="stat"] [class*="stat"]')) continue;
    const lines = text(el).split("\n").map((s) => s.trim()).filter(Boolean);
    if (!lines.length || lines.length > 5) continue;
    const value = lines.find(isValue);
    if (!value) continue;
    const label = lines.find((s) => s !== value && !isValue(s)) || "";
    if (!label) continue;
    const key = `${label}=${value}`;
    if (seenKpi.has(key)) continue;
    seenKpi.add(key);
    kpis.push({ label: clip(label, 40), value: clip(value, 24) });
    if (kpis.length >= 12) break;
  }

  // 表格:caption 或最近的祖先卡片標題當表名
  const titleOf = (t) => {
    const cap = t.querySelector("caption");
    if (cap && text(cap)) return text(cap);
    let anc = t.parentElement;
    for (let d = 0; d < 4 && anc; d += 1, anc = anc.parentElement) {
      const h = anc.querySelector("h1,h2,h3,h4,.card-title,.panel-title");
      const s = h && text(h).split("\n")[0];
      if (s && s.length <= 40) return s;
    }
    return "";
  };
  const tables = [];
  for (const t of document.querySelectorAll("table")) {
    if (!vis(t)) continue;
    let columns = [...t.querySelectorAll("thead th, thead td")].map(text);
    let rowEls = [...t.querySelectorAll("tbody tr")];
    if (!columns.length && rowEls.length === 0) rowEls = [...t.querySelectorAll("tr")];
    if (!columns.length && rowEls.length) {
      const first = rowEls[0];
      if (first.querySelector("th")) { columns = [...first.children].map(text); rowEls = rowEls.slice(1); }
    }
    const rows = rowEls.slice(0, 60).map((tr) => [...tr.children].map((td) => clip(text(td))));
    if (!rows.length) continue;
    tables.push({ title: clip(titleOf(t), 40), columns: columns.map((c) => clip(c, 30)), rows });
  }

  // 圖表:直接向圖表庫實例拿 option,拿不到的(隱藏畫面)由 vis 濾掉
  const charts = [];
  const num = (d) => (d && typeof d === "object" ? (d.value ?? d.name ?? null) : d);
  try {
    if (window.echarts) {
      for (const el of document.querySelectorAll("[_echarts_instance_]")) {
        if (!vis(el)) continue;
        const inst = window.echarts.getInstanceByDom(el);
        if (!inst) continue;
        const o = inst.getOption();
        const categories = (o.xAxis?.[0]?.data) || (o.yAxis?.[0]?.data) || (o.radar?.[0]?.indicator || []).map((x) => x.name) || [];
        charts.push({
          lib: "echarts", type: o.series?.[0]?.type || "", title: clip(o.title?.[0]?.text || "", 40),
          categories: (categories || []).map((c) => clip(c, 30)),
          series: (o.series || []).map((s) => ({ name: clip(s.name || "", 30), type: s.type, data: (Array.isArray(s.data) ? s.data : []).map(num) })),
        });
      }
    }
  } catch { /* 個別圖表壞掉不擋整頁 */ }
  try {
    if (window.Chart?.instances) {
      for (const ch of Object.values(window.Chart.instances)) {
        const cv = ch.canvas || ch.ctx?.canvas;
        if (cv && !vis(cv)) continue;
        charts.push({
          lib: "chartjs", type: ch.config?.type || ch.config?._config?.type || "", title: "",
          categories: (ch.data?.labels || []).map((c) => clip(c, 30)),
          series: (ch.data?.datasets || []).map((d) => ({ name: clip(d.label || "", 30), data: (d.data || []).map(num) })),
        });
      }
    }
  } catch { /* 同上 */ }
  try {
    for (const it of (window.Apex?._chartInstances || [])) {
      const w = it.chart?.w;
      if (!w) continue;
      const el = it.chart.el;
      if (el && !vis(el)) continue;
      charts.push({
        lib: "apexcharts", type: w.config.chart?.type || "", title: clip(w.config.title?.text || "", 40),
        categories: (w.config.xaxis?.categories || w.config.labels || []).map((c) => clip(c, 30)),
        series: (w.config.series || []).map((s) => (typeof s === "number" ? { name: "", data: [s] } : { name: clip(s.name || "", 30), data: s.data || [] })),
      });
    }
  } catch { /* 同上 */ }

  return { heading: clip(heading, 60), kpis, tables, charts };
}

async function extractRepo(context, base, repo) {
  const detailPath = path.join(ROOT, "content", "details", `${repo}.json`);
  const details = fs.existsSync(detailPath) ? JSON.parse(fs.readFileSync(detailPath, "utf8")) : null;
  const stages = details?.flow?.stages || [];
  const screenCount = Math.max(stages.length, 6);

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 100)));
  try {
    await page.goto(`${base}/demos/${repo}/`, { waitUntil: "networkidle", timeout: 40000 });

    const screens = [];
    const tableSig = new Set();
    const chartSig = new Set();
    for (let v = 0; v < screenCount; v += 1) {
      await page.evaluate((n) => { location.hash = `#go=${n}`; }, v);
      // 多數 demo 切畫面才建圖表,等它畫完(與 verify-runner 同樣的輪詢理由)
      await page.waitForTimeout(v === 0 ? 700 : 450);
      const raw = await page.evaluate(extractScreen);
      // 跨畫面去重:同一份表格/圖表出現在多個畫面時只記第一次
      raw.tables = raw.tables.filter((t) => {
        const sig = JSON.stringify([t.columns, t.rows[0], t.rows.length]);
        if (tableSig.has(sig)) return false;
        tableSig.add(sig); return true;
      });
      raw.charts = raw.charts.filter((c) => {
        const sig = JSON.stringify([c.lib, c.categories, c.series.map((s) => s.name)]);
        if (chartSig.has(sig)) return false;
        chartSig.add(sig); return true;
      });
      screens.push({ index: v, stage: stages[v] ? { title: stages[v].title || "", demo: stages[v].demo || "" } : null, ...raw });
    }
    return { screens, errors, details };
  } finally {
    await page.close().catch(() => {});
  }
}

function buildCard(repo, details, screens, summary) {
  const modules = details?.architecture?.modules || [];
  return {
    protocolHint: "a2a-agent-card/lite",
    name: repo,
    displayName: details?.title || repo,
    description: details?.system?.summary || details?.hero?.tagline || "",
    category: details?.category || "",
    systemType: details?.systemType || "",
    provider: "JVision",
    url: `/demos/${repo}/`,
    users: details?.system?.users || [],
    skills: modules.map((m, i) => ({ id: `m${i}`, name: m.name || m.title || String(m), description: m.summary || m.description || "" })),
    flow: (details?.flow?.stages || []).map((s) => s.title || ""),
    tools: [
      { name: "get_metrics", description: "取得本系統各畫面的 KPI 現值" },
      { name: "query_data", description: "查詢本系統的明細表格資料(依表名/欄位過濾)" },
      { name: "goto_screen", description: "把畫面切到指定模組並讓內容進入視野(瀏覽器端)" },
    ],
    dataInventory: {
      screens: screens.map((s) => ({ index: s.index, title: s.stage?.title || s.heading })),
      kpis: summary.kpis,
      tables: screens.flatMap((s) => s.tables.map((t) => ({ screen: s.index, title: t.title, columns: t.columns, rowCount: t.rows.length }))),
      charts: summary.charts,
    },
    dataPath: `content/agent-data/${repo}.json`,
  };
}

const args = process.argv.slice(2);
const pilotArg = args.find((a) => a.startsWith("--pilot="));
let repos;
if (args.includes("--all")) {
  // 全站模式:已抽過的跳過,可中斷重跑接續
  repos = fs.readdirSync(path.join(ROOT, "demos"))
    .filter((r) => fs.existsSync(path.join(ROOT, "demos", r, "index.html")))
    .filter((r) => !fs.existsSync(path.join(DATA_DIR, `${r}.json`)));
} else if (pilotArg) {
  repos = pickPilot(Number(pilotArg.split("=")[1]) || 20);
} else {
  repos = args.filter((a) => !a.startsWith("--"));
}
if (!repos.length && !args.includes("--all")) {
  console.log("用法:node tools/agent-data-extract.mjs <repo...> 或 --pilot=20 或 --all");
  process.exit(1);
}
// --all 且無新檔:照樣走到最後重建索引(讓索引欄位變更也能補上)

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(CARD_DIR, { recursive: true });

const server = await staticServer.start({ root: ROOT, port: PORT });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1360, height: 900 } });

const cardsIndex = [];
let okCount = 0;
for (const repo of repos) {
  try {
    const { screens, errors, details } = await extractRepo(context, server.url, repo);
    const summary = {
      kpis: screens.reduce((n, s) => n + s.kpis.length, 0),
      tables: screens.reduce((n, s) => n + s.tables.length, 0),
      rows: screens.reduce((n, s) => n + s.tables.reduce((m, t) => m + t.rows.length, 0), 0),
      charts: screens.reduce((n, s) => n + s.charts.length, 0),
    };
    const ok = summary.tables + summary.charts + summary.kpis > 0;
    if (ok) okCount += 1;

    fs.writeFileSync(path.join(DATA_DIR, `${repo}.json`), JSON.stringify({
      repoName: repo, title: details?.title || repo, extractedAt: new Date().toISOString(),
      source: "playwright-dom", summary, screens,
    }, null, 2));
    const card = buildCard(repo, details, screens, summary);
    fs.writeFileSync(path.join(CARD_DIR, `${repo}.json`), JSON.stringify(card, null, 2));
    cardsIndex.push({ name: repo, displayName: card.displayName, category: card.category, systemType: card.systemType, summary });

    console.log(`${ok ? "OK " : "XX "}${repo.padEnd(46)} kpi=${String(summary.kpis).padStart(3)} tables=${String(summary.tables).padStart(2)} rows=${String(summary.rows).padStart(4)} charts=${String(summary.charts).padStart(2)}${errors.length ? ` err=${errors.length}` : ""}`);
  } catch (error) {
    console.log(`XX ${repo.padEnd(46)} 抽取失敗:${String(error.message).split("\n")[0].slice(0, 80)}`);
  }
}

// 彙總索引從卡片目錄整個重建(--all 分批續跑時才不會蓋掉先前的)
const allCards = fs.readdirSync(CARD_DIR)
  .filter((f) => f.endsWith(".json") && f !== "index.json")
  .map((f) => {
    const c = JSON.parse(fs.readFileSync(path.join(CARD_DIR, f), "utf8"));
    return {
      name: c.name, displayName: c.displayName, category: c.category, systemType: c.systemType,
      description: (c.description || "").slice(0, 120),
      summary: {
        kpis: c.dataInventory?.kpis ?? 0,
        tables: (c.dataInventory?.tables || []).length,
        charts: c.dataInventory?.charts ?? 0,
      },
    };
  });
fs.writeFileSync(path.join(CARD_DIR, "index.json"), JSON.stringify({
  generatedAt: new Date().toISOString(), total: allCards.length, systems: allCards,
}, null, 2));

console.log(`\n完成:${okCount}/${repos.length} 套抽到資料 → content/agent-data/ + content/agent-cards/`);
await browser.close();
await server.close();
