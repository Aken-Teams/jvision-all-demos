/**
 * 佈署前的完整度檢查。
 *
 * 公開網址跟自己看是兩件事：自己看的時候「這張表還沒填資料」只是待辦，
 * 給客戶看的時候就是一張空白的表格擺在畫面上。所以在按下部署之前先跑一遍，
 * 把「拿出去會被看到的問題」列出來，讓他自己決定要先改還是就這樣送。
 *
 * 只做**看得到的**判斷，不做風格評分——「這個配色好不好看」我們給不出可靠的答案，
 * 給了他也不知道該怎麼改。每一條都要能回答「哪裡、為什麼、怎麼修」。
 *
 * 分三級：
 *   block —— 拿出去會被當成沒做完（空表、存不住、樣板字還在）
 *   warn  —— 能看，但展示效果會打折（資料太少、沒改過）
 *   pass  —— 沒問題
 *
 * 檢查本身不改任何東西，也不擋佈署——決定權在使用者手上，我們只負責讓他
 * 知道自己在送什麼出去。
 */
import fs from "node:fs";
import path from "node:path";
import { describe, list } from "./instance-db.mjs";
import * as versions from "./instance-versions.mjs";

/* 樣板殘留字。這些是 detail-template 與 demo-forge 的預設值，
   出現在正式畫面上等於告訴客戶「這是還沒做的半成品」。 */
const GENERIC_HEADERS = ["編號", "項目", "負責人", "期限", "階段"];
const PLACEHOLDER_RE = [
  { re: /\bENT-\d{3}\b/, why: "ENT-001 這種樣板編號" },
  { re: /(^|[^0-9A-Za-z])D\+\d+([^0-9A-Za-z]|$)/, why: "D+1 這種樣板日期" },
  { re: /lorem ipsum/i, why: "Lorem ipsum 填充文字" },
  { re: /(待補|待填|範例文字|請輸入內容|TODO|FIXME|XXX)/, why: "待補/TODO 字樣" },
  { re: /\b(範例公司|測試公司|某某公司|王小明|測試用)\b/, why: "測試用的假名字" },
];

const text = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

function tablesIn(html) {
  return (html.match(/<table[\s\S]*?<\/table>/gi) || []).map((t) => ({
    headers: (t.match(/<th\b[^>]*>([\s\S]*?)<\/th>/gi) || [])
      .map((x) => x.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()).filter(Boolean),
    bodyRows: (t.match(/<tr\b[^>]*>/gi) || []).length - 1,
  })).filter((t) => t.headers.length);
}

const sig = (labels) => labels.join("|");

/* 給人看的表名。title 是 table_1／資料表 3 這種內部代號時，
   改列前幾個欄位——使用者認得的是「支出單號、廠商、金額」，不是 table_1。 */
function nameOf(t) {
  const title = String(t.title || "").trim();
  if (title && !/^(table_\d+|資料表\s*\d+)$/.test(title)) return title;
  const cols = (t.columns || []).map((c) => c.label).filter(Boolean).slice(0, 3);
  return cols.length ? `${cols.join("、")}…` : t.name;
}

/**
 * 跑一遍。回 { verdict, score, blocks, warns, checks:[{id,level,title,detail,fix}] }。
 *
 * dir 是實例目錄（var/instances/<id>），dbName 是它的資料庫，
 * inst 是控制台那筆（要 display_name 與 repo_name）。
 * 任何一項查不到就把那一項標成 skip，不要讓整份報告掛掉——
 * 報告掛掉的話使用者只會看到「檢查失敗」，那比沒有檢查更沒用。
 */
export async function check({ dir, dbName, inst }) {
  const checks = [];
  const add = (id, level, title, detail, fix) => checks.push({ id, level, title, detail, fix });

  const file = path.join(dir, "public", "index.html");
  let html = "";
  try { html = fs.readFileSync(file, "utf8"); } catch {
    add("html", "block", "讀不到這套系統的檔案", "找不到 index.html。", "請聯絡我們，這是我們這邊的問題。");
    return summarise(checks);
  }
  const plain = text(html);
  const htmlTables = tablesIn(html);

  /* ── 1. 樣板表頭還在嗎 ───────────────────────────────── */
  const genericTables = htmlTables.filter((t) => GENERIC_HEADERS.every((g) => t.headers.includes(g)));
  if (genericTables.length) {
    add("generic-headers", "block", `有 ${genericTables.length} 張表還是樣板欄位`,
      `欄位名稱還是「編號／項目／負責人／期限／階段」，不是這套系統真正在管的東西。`,
      "在對話框說「把第 N 張表的欄位改成…」，或直接說這張表要管什麼，我來改。");
  }

  /* ── 2. 樣板文字還在嗎 ───────────────────────────────── */
  const found = PLACEHOLDER_RE.filter((p) => p.re.test(plain));
  if (found.length) {
    add("placeholder", "block", "畫面上還留著樣板文字",
      `看到 ${found.map((f) => f.why).join("、")}。公開出去客戶會直接讀到這些字。`,
      "在對話框說「把假資料換成我們公司真的會用到的內容」。");
  }

  /* ── 3. 畫面數 ──────────────────────────────────────── */
  /* 只數寫死的 data-i="0"、data-i="1"。有些版本的畫面是 JS 迴圈畫出來的，
     原始碼裡只有一個 data-i="${i}"——照數的話每一套都會報「只有 1 個畫面」，
     而一個永遠會出現的警告等於沒有警告，只會讓人把整份報告一起忽略。
     數不出來就不猜，這一項直接不報。 */
  const screens = (html.match(/data-i="\d+"/g) || []).length;
  const jsRendered = /data-i="\$\{/.test(html);
  if (screens && screens < 6 && !jsRendered) {
    add("screens", "warn", `只有 ${screens} 個畫面`,
      "一般一套系統會有 6 個可切換的畫面，畫面少會顯得功能單薄。",
      "在對話框說要補哪個畫面（例如「加一個報表畫面」）。");
  }

  /* ── 4. 資料層：綁得上嗎、有資料嗎 ──────────────────── */
  let db = null;
  try { db = await describe(dbName); } catch (e) {
    add("db", "warn", "查不到這套系統的資料庫",
      `${String(e.message).slice(0, 80)}。畫面還是看得到，但存不存得住沒辦法確認。`,
      "可以先部署看看，或先在資料頁隨便改一筆確認存得住。");
  }

  if (db) {
    const inDb = new Set(db.tables.map((t) => sig(t.columns.map((c) => c.label))));
    /* jv-live 是用 <th> 的文字去 DOM 找表，schema 裡沒有對應條目的表格
       不會被綁上——畫面看得到、輸入存不住，而且不會報錯。 */
    const unbound = htmlTables.filter((t) => !inDb.has(sig(t.headers)));
    if (unbound.length) {
      add("unbound", "block", `有 ${unbound.length} 張表存不住資料`,
        `「${unbound[0].headers.slice(0, 3).join("／")}…」這張表在畫面上看得到，但背後沒有對應的資料表，`
        + "訪客輸入的東西按下去就沒了，而且不會跳錯誤。",
        "在對話框說「這張表要能存資料」，我會補上對應的資料表。");
    }

    const counts = [];
    for (const t of db.tables) {
      try { const r = await list(dbName, t.name, { limit: 1 }); counts.push({ t, n: Number(r.total ?? r.rows?.length ?? 0) }); }
      catch { /* 單張查不到就跳過，不要讓整份報告掛掉 */ }
    }
    const empty = counts.filter((c) => c.n === 0);
    const thin = counts.filter((c) => c.n > 0 && c.n < 3);
    if (empty.length) {
      add("empty", "block", `有 ${empty.length} 張表是空的`,
        `${empty.map((c) => `「${nameOf(c.t)}」`).join("、")} 一筆資料都沒有，`
        + "訪客點進去會看到一張空白的表格。",
        "在資料頁自己補幾筆，或在對話框說「幫我補一些示範資料」。");
    } else if (thin.length) {
      add("thin", "warn", `有 ${thin.length} 張表只有一兩筆`,
        "資料太少的話，排序、篩選、統計這些功能展示不出效果。",
        "補到 5 筆以上會比較像真的在用的系統。");
    }
  }

  /* ── 5. 改過了嗎 ────────────────────────────────────── */
  let vs = [];
  try { vs = versions.list(dir); } catch { /* 沒有版本檔就當作沒改過 */ }
  if (vs.length <= 1) {
    add("untouched", "warn", "這套系統還沒有改過",
      "目前跟展示站上的樣板一模一樣。公開出去的話，對方看到的不是你們公司的系統。",
      "先在對話框改幾件事——系統名稱、欄位、資料——再部署。");
  }

  /* ── 6. 名字 ───────────────────────────────────────── */
  const name = String(inst?.display_name || "").trim();
  if (!name) {
    add("name", "warn", "還沒取名字",
      "畫面最上方顯示的還是預設標題。",
      "在對話框說「把系統名稱改成…」。");
  }

  return summarise(checks);
}

function summarise(checks) {
  const blocks = checks.filter((c) => c.level === "block");
  const warns = checks.filter((c) => c.level === "warn");
  const verdict = blocks.length ? "fix-first" : warns.length ? "ok-with-notes" : "ready";
  return {
    verdict, checks, blocks: blocks.length, warns: warns.length,
    headline: blocks.length
      ? `建議先改再部署——有 ${blocks.length} 件事拿出去會被看到`
      : warns.length
        ? `可以部署，但有 ${warns.length} 件事值得先看一眼`
        : "看起來完整，可以部署",
  };
}
