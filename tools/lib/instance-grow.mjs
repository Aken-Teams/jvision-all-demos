/**
 * 讓資料層跟上畫面。
 *
 * 客戶說「增加一個後台管理頁面」，codex 在 index.html 裡加了新表格，
 * 但那張表在資料庫裡不存在——jv-live 是走訪 schema.tables 再用 <th> 的文字
 * 去 DOM 找對應的表，沒有 schema 條目就不會被綁定。結果會是「畫面上多了
 * 一張表，看起來做好了，但輸入的東西存不住」，那比直接失敗更糟：
 * 使用者要用一陣子才會發現，而且不會知道是哪一步出的問題。
 *
 * 所以每次成功的畫面修改之後，比對前後的表格，替新出現的那幾張建好資料表。
 *
 * 建表本身完全重用 instance-db 的 createFromSchema——它是
 * CREATE TABLE IF NOT EXISTS ＋ ON DUPLICATE KEY UPDATE，本來就冪等且可累加，
 * 不需要另外寫一套建表邏輯（寫第二套的下場是兩邊的型別推斷會慢慢走散）。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./forge-common.mjs";
import { extractTables } from "./schema-extract.mjs";
import { createFromSchema, describe } from "./instance-db.mjs";

/* 全站累積下來的「欄位中文名 → 英文 key」字典，7,678 筆，schema-scan 建的。
   查得到就用它，整站的欄位命名才會一致（「狀態」到哪裡都是 status）。
   讀一次留著：這支會在每次修改後被呼叫，而那個檔有 300KB。 */
let keymap = null;
function keyFor(label, i) {
  if (!keymap) {
    try { keymap = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "_state", "schema-keymap.json"), "utf8")).map || {}; }
    catch { keymap = {}; }
  }
  const hit = keymap[String(label).trim()];
  if (hit && /^[a-z][a-z0-9_]{0,62}$/.test(hit)) return hit;
  /* 查不到就給一個位置編號。不從中文硬拼英文——拼出來的東西沒有人看得懂，
     而 key 只是內部識別，畫面上顯示的一律是 label。 */
  return `col_${i + 1}`;
}

/** 一張表的身分：表頭文字串起來。跟 instance-edit 的判斷方式一致。 */
const sigOf = (labels) => labels.join("|");

function signatures(html) {
  const out = new Set();
  for (const t of html.match(/<table[\s\S]*?<\/table>/gi) || []) {
    const ths = t.match(/<th\b[^>]*>([\s\S]*?)<\/th>/gi) || [];
    if (!ths.length) continue;
    out.add(ths.map((x) => x.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()).join("|"));
  }
  return out;
}

/**
 * 比對改動前後，替新出現的表格建資料表。
 * 回 { added: [{name, title, columns}], why }。沒有新表就 added 為空。
 *
 * 呼叫端必須把失敗當成「這一項沒做成」而不是「整次修改失敗」——
 * 畫面已經改好也記了版本，建表補不成只要照實說就好。
 */
export async function growTables(dbName, beforeHtml, afterHtml, dir) {
  /* dir 是必要的，不給就丟例外。做成可選的話，哪天有第二個呼叫端忘了帶，
     新表就又不會寫回 schema.json——而那個失敗是安靜的：表建好了、畫面也對，
     只有交付出去的專案會少一張表，要等客戶回報才會發現。 */
  if (!dir) throw new Error("growTables 需要實例目錄（要把新表寫回 schema.json）");
  const had = signatures(beforeHtml);
  let fresh = extractTables(afterHtml).filter((t) => !had.has(sigOf(t.labels)));
  if (!fresh.length) return { added: [] };

  /* 表名接續既有編號。用既有的最大號 +1 而不是「數量 +1」——
     中間如果有被刪過，數量會跟編號對不上，撞名就會靜靜地寫進別人的表。 */
  const cur = await describe(dbName);

  /* 資料庫裡已經有同樣表頭的表就跳過。只比對「改動前的 HTML」是不夠的：
     同一次修改被重跑時（重試、或使用者再說一次一樣的話），那張表對
     beforeHtml 來說永遠是新的，於是每跑一次就多建一張一模一樣的表。
     實測第二次跑就多出 table_6。 */
  const inDb = new Set(cur.tables.map((t) => sigOf(t.columns.map((c) => c.label))));
  fresh = fresh.filter((t) => !inDb.has(sigOf(t.labels)));
  if (!fresh.length) return { added: [] };
  let next = cur.tables.reduce((m, t) => {
    const n = Number(String(t.name).replace(/^table_/, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);

  const tables = [];
  const seen = new Set();
  for (const t of fresh) {
    const sig = sigOf(t.labels);
    if (seen.has(sig)) continue;      // 同一份 HTML 裡兩張一模一樣的表，建一次就好
    seen.add(sig);
    next += 1;

    /* key 不可以重複——同一張表出現兩個「狀態」的話，後面那個會蓋掉前面那個。
       撞到就在後面加序號。 */
    const used = new Set();
    const columns = t.labels.map((label, i) => {
      let key = keyFor(label, i);
      while (used.has(key)) key = `${key}_${i + 1}`;
      used.add(key);
      return { key, label, type: t.types[i] || "text" };
    });

    tables.push({
      name: `table_${next}`,
      title: t.caption || `資料表 ${next}`,
      screen: t.screen,
      selector: t.selector,
      renderedByJs: t.rendered,
      columns,
      /* 畫面上原本就有的那幾列當種子資料。沒有的話（JS 畫的表）就空著，
         客戶自己新增第一筆。 */
      seed: t.sample.map((row) => Object.fromEntries(columns.map((c, i) => [c.key, row[i] ?? null]))),
    });
  }

  if (!tables.length) return { added: [] };
  await createFromSchema(dbName, { repoName: cur.repoName, tables }, { seed: true });
  registerInSchemaFile(dir, tables);
  return { added: tables.map((t) => ({ name: t.name, title: t.title, columns: t.columns.map((c) => c.label) })) };
}

/**
 * 把新建的表寫回 public/_jv/schema.json。
 *
 * 沒有這一步的話，那張表只存在於資料庫裡，而 schema.json 是兩個地方的依據：
 *
 * 一、「資料」那一頁的表名。app-server 的 nameTables() 讀這個檔，讀不到就
 *     只能叫「資料表 3」——實測就是這樣，AI 建的表在下拉選單裡永遠沒有名字。
 * 二、交付出去的專案。nextjs-bundle 產生的啟動腳本是照 schema.json 建表的，
 *     漏掉的話客戶把 repo 跑起來會少一張表，而畫面上還畫著它。
 *
 * 寫入用「先寫暫存再改名」：寫到一半斷掉的話留下的是舊的那一份，
 * 而不是一個半截的 JSON——那個檔壞掉會讓整個資料頁與交付一起壞。
 */
function registerInSchemaFile(dir, tables) {
  const file = path.join(dir, "public", "_jv", "schema.json");
  let sc;
  try { sc = JSON.parse(fs.readFileSync(file, "utf8")); } catch { return; }
  if (!Array.isArray(sc.tables)) return;
  const have = new Set(sc.tables.map((t) => t.name));
  let changed = false;
  for (const t of tables) {
    if (have.has(t.name)) continue;
    sc.tables.push({
      name: t.name, title: t.title, selector: t.selector || null,
      screen: t.screen, renderedByJs: Boolean(t.renderedByJs), columns: t.columns,
    });
    changed = true;
  }
  if (!changed) return;
  try {
    fs.writeFileSync(`${file}.tmp`, `${JSON.stringify(sc, null, 2)}\n`);
    fs.renameSync(`${file}.tmp`, file);
  } catch { /* 寫不進去不該讓整次修改失敗——表已經建好了，名字之後補得回來 */ }
}
