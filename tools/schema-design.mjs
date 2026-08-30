#!/usr/bin/env node
/**
 * 替「畫面上沒有表格」的 demo 設計資料表。
 *
 * 站上有 206 套的資料是用 div 排出來的（<strong>標籤</strong><small>說明</small>
 * <b>數值</b>），沒有 <th>、沒有欄位名稱，也沒有內嵌的資料陣列——決定論的抽取
 * 對它們完全無效，所以它們一直不能被複製成可用的系統。
 *
 * 這一支讓 codex 讀那個 demo，依它實際在管的東西設計資料表。用 LLM 而不是再寫
 * 一套 div 解析：從 <strong>／<b> 硬湊只能得到「項目／說明／數值」這種沒有領域
 * 意義的欄位，而客戶複製到的表要跟他看到的畫面對得上才有價值。
 *
 * 產出格式與 schema-scan 完全一致，下游（instance-bind、instance-db、購物流程）
 * 不必知道這一套是怎麼來的。
 *
 *   node tools/schema-design.mjs [--workers=4] [--daily=100] [--limit=N] [--repos=a,b] [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, num, list, makeLogger } from "./lib/forge-common.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";
import { extractTables } from "./lib/schema-extract.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);
const DEMOS = path.join(ROOT, "demos");
const OUT = path.join(ROOT, "content", "schema");
const STATE = path.join(ROOT, "docs", "_state", "schema-design.json");
const SCHEMA = path.join(ROOT, "tools", "schemas", "schema-design.schema.json");
const WORKERS = Math.max(1, Math.min(8, num(args.workers, 4)));
const KEY_RE = /^[a-z][a-z0-9_]{0,62}$/;
const TYPES = new Set(["text", "int", "number", "percent", "date", "enum"]);

let state = null;
function saveState() {
  state.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  const tmp = `${STATE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  fs.renameSync(tmp, STATE);
}

/** 誰需要設計：沒有 schema、而且畫面上真的抽不出表格。 */
function targets() {
  const have = new Set(fs.readdirSync(OUT).map((f) => f.replace(/\.json$/, "")));
  const out = [];
  for (const d of fs.readdirSync(DEMOS)) {
    if (!d.startsWith("jvision-") || have.has(d)) continue;
    const file = path.join(DEMOS, d, "index.html");
    if (!fs.existsSync(file)) continue;
    /* 有表格可抽的交給 schema-scan，那條路便宜又決定論，不該花 codex。 */
    try { if (extractTables(fs.readFileSync(file, "utf8")).length) continue; } catch { /* 抽不動就是這裡的目標 */ }
    out.push(d);
  }
  return out;
}

/** 送給 codex 的內容。整份 HTML 太大也太多雜訊，只留看得到的文字與結構線索。 */
function digest(html) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  /* 前 6000 字通常已經涵蓋前兩三個畫面，足以看出它在管什麼。
     整份送進去會讓 prompt 膨脹到逾時——那個坑 demo-forge 踩過。 */
  return body.slice(0, 6000);
}

function prompt(repo, title, html) {
  return `這是一套企業系統的展示畫面，但它的資料是用卡片與清單排出來的，沒有表格。
請依它實際在管理的東西，設計出這套系統背後應該有的資料表。

系統代號：${repo}
系統名稱：${title || repo}

畫面上看得到的文字：
${digest(html)}

## 要求
- 設計 1～3 張表。只設計這套系統真正需要的，不要為了湊數而多開。
- 每張表 3～10 個欄位。欄位要貼近這個領域實際會記的東西，不要用「項目／說明／數值」
  這種放到任何系統都成立的通用名稱——那種表對使用者沒有意義。
- label 用繁體中文，就是畫面上會顯示的欄位名。
- key 用小寫英文與底線（例如 order_no、risk_level），開頭必須是英文字母。
- type 從 text / int / number / percent / date / enum 挑一個最貼切的。
- 每張表給 3～8 筆範例資料（seed）。每一筆是一個字串陣列，**依 columns 的順序**
  一一對應（第一個值對第一個欄位），長度要與 columns 相同。
- 範例資料要像畫面上那種擬真資料，不要用「範例1」「測試」這種佔位字；
  值要與 type 相符（date 就給日期、percent 就給百分比）。
- 表的數量 1～3 張，每張 3～10 個欄位。

只輸出 JSON，不要任何說明文字。`;
}

/** 把 codex 的產出檢查乾淨。不合格就整份退回——半對的資料表比沒有更難處理。 */
function normalize(repo, out) {
  if (!out || !Array.isArray(out.tables) || !out.tables.length) return { ok: false, why: "沒有回傳資料表" };
  const tables = [];
  for (let i = 0; i < out.tables.length && i < 3; i += 1) {
    const t = out.tables[i];
    if (!t || !Array.isArray(t.columns) || t.columns.length < 3) return { ok: false, why: "欄位太少" };
    const seen = new Set();
    const columns = [];
    for (const c of t.columns) {
      const key = String(c.key || "").trim().toLowerCase();
      const label = String(c.label || "").trim();
      if (!KEY_RE.test(key)) return { ok: false, why: `欄位代號不合法：${key}` };
      if (!label) return { ok: false, why: "欄位缺少名稱" };
      if (seen.has(key)) return { ok: false, why: `欄位代號重複：${key}` };
      seen.add(key);
      columns.push({ key, label, type: TYPES.has(c.type) ? c.type : "text" });
    }
    /* 種子是依欄位順序的字串陣列——JSON schema 的嚴格模式沒辦法描述「鍵是動態的
       物件」，所以改成位置對應。長度對不上或有空值的整筆丟掉：缺值的列灌進
       資料庫會變成一排空格，客戶看到的第一眼就是壞掉的資料。 */
    const seed = (Array.isArray(t.seed) ? t.seed : [])
      .map((row) => {
        if (!Array.isArray(row) || row.length !== columns.length) return null;
        const r = {};
        for (let k = 0; k < columns.length; k += 1) {
          const v = row[k];
          if (v == null || String(v).trim() === "") return null;
          r[columns[k].key] = String(v).slice(0, 120);
        }
        return r;
      })
      .filter(Boolean)
      .slice(0, 8);

    tables.push({
      name: `table_${i + 1}`,
      title: String(t.title || `資料表 ${i + 1}`).slice(0, 60),
      /* 畫面上本來就沒有這張表，所以沒有選擇器可以對——runtime 會用退路面板
         把它畫出來。這裡明講，之後看檔案的人不會以為是漏填。 */
      selector: null,
      screen: null,
      renderedByJs: false,
      designedBy: "codex",
      columns,
      seed,
    });
  }
  return { ok: true, tables };
}

async function designOne(repo, title) {
  const file = path.join(DEMOS, repo, "index.html");
  const html = fs.readFileSync(file, "utf8");
  if (DRY) return { repo, ok: true, why: "dry-run" };

  const r = await runCodexWithRetry({
    prompt: prompt(repo, title, html),
    cwd: ROOT,
    sandbox: "read-only",
    schemaPath: SCHEMA,
    timeoutMs: num(args.timeout, 600) * 1000,
    model: args.model,
  }, { retries: 1 });

  if (!r.ok) return { repo, ok: false, why: `codex 失敗：${String(r.error || "").slice(0, 50)}` };
  const norm = normalize(repo, r.json);
  if (!norm.ok) return { repo, ok: false, why: norm.why };

  const doc = {
    repoName: repo,
    generatedAt: new Date().toISOString(),
    readyState: "ready",
    tables: norm.tables,
  };
  const tmp = path.join(OUT, `${repo}.json.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(doc, null, 2) + "\n");
  fs.renameSync(tmp, path.join(OUT, `${repo}.json`));
  return { repo, ok: true, tables: norm.tables.length,
    cols: norm.tables.map((t) => t.columns.length).join("+"),
    sample: norm.tables[0].columns.map((c) => c.label).slice(0, 4).join("、") };
}

async function main() {
  const catalog = (() => {
    try {
      const c = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalog-index.json"), "utf8"));
      return new Map((c.projects || []).map((x) => [x.repoName, x.title]));
    } catch { return new Map(); }
  })();

  let queue = args.repos ? list(args.repos) : targets();
  const prev = (() => { try { return JSON.parse(fs.readFileSync(STATE, "utf8")); } catch { return null; } })();
  const done = new Set((prev?.failed || []).map((f) => f.repo));
  if (!args.repos && prev) queue = queue.filter((r) => !done.has(r));   // 失敗過的先跳過，用 --repos 單獨重試
  if (args.limit) queue = queue.slice(0, num(args.limit, 0));

  if (!queue.length) { log.step("沒有需要設計的專案"); return; }
  state = prev && !args.repos
    ? { ...prev, running: true, total: (prev.done || []).length + queue.length }
    : { startedAt: new Date().toISOString(), total: queue.length, done: [], failed: [], running: true };
  state.workers = WORKERS;
  state.pid = process.pid;
  saveState();

  log.step(`為 ${queue.length} 套設計資料表，${WORKERS} 條線${DRY ? "（dry-run）" : ""}`);
  let next = 0;
  async function worker() {
    while (next < queue.length) {
      const repo = queue[next++];
      const r = await designOne(repo, catalog.get(repo));
      if (r.ok && !DRY) {
        state.done.push({ repo, tables: r.tables, at: Date.now() });
        log.info(`  ✓ ${repo.replace(/^jvision-/, "").padEnd(46)} ${r.tables} 張表（${r.cols} 欄）　${r.sample}`);
      } else if (r.ok) log.info(`  ✓ ${repo}（dry-run）`);
      else { state.failed.push({ repo, why: r.why, at: Date.now() }); log.warn(`  ✖ ${repo}：${r.why}`); }
      if (!DRY) saveState();
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, () => worker()));
  state.running = false;
  state.finishedAt = new Date().toISOString();
  saveState();
  log.step(`完成：成功 ${state.done.length}、失敗 ${state.failed.length}`);
}

main().catch((e) => { log.error(e.stack || e.message); process.exitCode = EXIT.BAD_INPUT; });
