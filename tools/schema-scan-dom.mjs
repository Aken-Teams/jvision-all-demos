#!/usr/bin/env node
/**
 * 從渲染後的畫面抽資料表定義。
 *
 * schema-scan 讀的是靜態 HTML。有一批 demo 的表格是 JS 在執行時畫出來的，
 * 原始碼裡連 <table> 都沒有，於是被判成 unsupported——而它們的
 * content/schema 還留著更早以前擷取到的欄位，跟現在的畫面對不上。
 *
 * 對不上的後果不是好不好看：jv-live 是靠 <th> 的文字去 DOM 找表，
 * 客戶複製了這種 demo，畫面看得到、輸入存不住，而且不會報錯。
 *
 * 所以這一支用真的瀏覽器把畫面跑起來，讀 DOM 裡實際的表格——
 * 那正是 jv-live 綁定時看到的東西，沒有比它更貼近事實的來源。
 *
 * 只處理「畫面上真的有表格」的那批（audit-unsupported-schema 分好的）。
 * 畫面根本沒有表格的那 121 套不在這裡處理：它們需要的是把 schema 拿掉，
 * 不是換一份新的，用同一套辦法對待兩種問題只會把事情弄混。
 *
 * 產出併進 schema-proposals.json，落檔仍然交給 schema-apply——
 * 寫入共用資料要有單一入口，這裡多寫一套就會跟它慢慢走散。
 *
 *   node tools/schema-scan-dom.mjs [--limit=N] [--port=4891] [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { ROOT, EXIT, parseArgs, num, makeLogger, writeJson } from "./lib/forge-common.mjs";
import { inferType } from "./lib/schema-extract.mjs";
import * as staticServer from "./lib/static-server.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);
const PORT = num(args.port, 4891);
const AUDIT = path.join(ROOT, "docs", "_state", "unsupported-schema-audit.json");
const PROPOSALS = path.join(ROOT, "docs", "_state", "schema-proposals.json");
const KEYMAP = path.join(ROOT, "docs", "_state", "schema-keymap.json");

/* 全站累積的「中文欄位名 → 英文 key」字典。查得到就用，整站命名才會一致
   （「狀態」到哪裡都是 status）。查不到就給位置編號——不從中文硬拼英文，
   拼出來沒有人看得懂，而 key 只是內部識別，畫面上顯示的一律是 label。 */
const keymap = (() => {
  try { return JSON.parse(fs.readFileSync(KEYMAP, "utf8")).map || {}; } catch { return {}; }
})();
const KEY_RE = /^[a-z][a-z0-9_]{0,62}$/;
const keyFor = (label, i) => {
  const hit = keymap[String(label).trim()];
  return hit && KEY_RE.test(hit) ? hit : `col_${i + 1}`;
};

const audit = JSON.parse(fs.readFileSync(AUDIT, "utf8"));
let todo = audit.rows.filter((r) => r.kind === "畫面有表格但 schema 是舊的").map((r) => r.repo);
if (args.limit) todo = todo.slice(0, num(args.limit, 0));
if (!todo.length) { log.warn("沒有要處理的"); process.exit(EXIT.OK); }

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "projects-index.json"), "utf8"));
const titleOf = new Map(catalog.projects.map((p) => [p.repoName, p.title]));

log.step(`從畫面重抽 ${todo.length} 套${DRY ? "（試跑）" : ""}`);
const server = await staticServer.start({ root: ROOT, port: PORT });
const browser = await chromium.launch();
const results = {};
let failed = 0;

for (const repo of todo) {
  const page = await browser.newPage();
  /* 表格用「表頭簽章」當身分，同一組表頭只收一次——同一張表會在切畫面時
     被重複看到，不去重的話會產生一堆一模一樣的資料表。 */
  const found = new Map();
  try {
    await page.goto(`http://127.0.0.1:${PORT}/demos/${repo}/`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(500);
    /* 導覽的遮罩會擋住切畫面的點擊。那是它本來的行為，不是壞掉，先移掉。 */
    await page.evaluate(() => {
      document.querySelectorAll(".shepherd-modal-overlay-container,.shepherd-element").forEach((e) => e.remove());
    });
    const btns = await page.$$("[data-i]");
    for (let i = 0; i < btns.length; i++) {
      try { await btns[i].click({ timeout: 1200 }); await page.waitForTimeout(180); } catch { /* 點不到就看目前這頁 */ }
      const tables = await page.evaluate(() => [...document.querySelectorAll("table")].map((t, idx) => {
        const labels = [...t.querySelectorAll("thead th, tr:first-child th")]
          .map((x) => x.textContent.replace(/\s+/g, " ").trim());
        const rows = [...t.querySelectorAll("tbody tr")].slice(0, 8).map((tr) =>
          [...tr.querySelectorAll("td")].map((td) => td.textContent.replace(/\s+/g, " ").trim()));
        /* 表格所在的畫面：往上找帶 data-i 的容器，找不到就 null。
           jv-live 用它決定要在哪一頁綁這張表。 */
        let el = t, screen = null;
        while (el && el !== document.body) {
          const d = el.getAttribute && el.getAttribute("data-i");
          if (d != null && /^\d+$/.test(d)) { screen = Number(d); break; }
          el = el.parentElement;
        }
        return { labels, rows, screen, idx };
      }));
      for (const t of tables) {
        if (t.labels.length < 2 || t.labels.some((l) => !l)) continue;
        const sig = t.labels.join("|");
        /* 留列數最多的那一次。切畫面的瞬間表格可能還在重畫，
           先看到的那次常常是空的。 */
        const prev = found.get(sig);
        if (!prev || t.rows.length > prev.rows.length) found.set(sig, t);
      }
    }
  } catch (e) {
    failed += 1;
    log.error(`✖ ${repo}　${String(e.message).slice(0, 60)}`);
    await page.close();
    continue;
  }
  await page.close();

  if (!found.size) {
    failed += 1;
    log.error(`✖ ${repo}　畫面上讀不到表格（盤點時讀得到，可能是這次沒渲染完）`);
    continue;
  }

  const title = titleOf.get(repo) || repo;
  const tables = [...found.values()].map((t, n) => {
    const used = new Set();
    const columns = t.labels.map((label, i) => {
      let key = keyFor(label, i);
      /* key 不可以重複——同一張表兩個「狀態」的話，後面那個會蓋掉前面那個。 */
      while (used.has(key)) key = `${key}_${i + 1}`;
      used.add(key);
      const col = t.rows.map((r) => r[i]).filter((x) => x != null);
      return { key, label, type: inferType(col) };
    });
    return {
      name: `table_${n + 1}`,
      title: `${title} 資料表 ${n + 1}`,
      selector: `table:nth-of-type(${t.idx + 1})`,
      screen: t.screen,
      renderedByJs: true,
      columns,
      seed: t.rows.filter((r) => r.length === columns.length)
        .map((r) => Object.fromEntries(columns.map((c, i) => [c.key, r[i] ?? null]))),
    };
  });
  results[repo] = { readyState: "ready", source: "dom", tables };
  log.step(`✓ ${repo}　${tables.length} 張表　${tables.map((t) => t.columns.length).join("/")} 欄`);
}

await browser.close();
server.close?.();

log.step(`重抽完成：成功 ${Object.keys(results).length}、失敗 ${failed}`);
if (DRY) { log.info("dry-run：不寫任何檔"); process.exit(EXIT.OK); }
if (!Object.keys(results).length) process.exit(EXIT.OK);

/* 併進提案檔。只覆蓋這次重抽到的那幾套，其餘原封不動——
   整份重寫的話會把 schema-scan 剛掃好的結果一起蓋掉。 */
const doc = JSON.parse(fs.readFileSync(PROPOSALS, "utf8"));
for (const [repo, p] of Object.entries(results)) doc.proposals[repo] = p;
doc.stats = doc.stats || {};
doc.stats.ready = Object.values(doc.proposals).filter((x) => x.readyState === "ready").length;
doc.stats.unsupported = Object.values(doc.proposals).filter((x) => x.readyState === "unsupported").length;
writeJson(PROPOSALS, doc);
log.info(`  已併入 ${path.relative(ROOT, PROPOSALS)}（ready ${doc.stats.ready}、unsupported ${doc.stats.unsupported}）`);
log.info(`  下一步：node tools/schema-apply.mjs --fix-details --repo=${Object.keys(results).slice(0, 3).join(",")}…（或不帶 --repo 套用全部）`);
process.exit(EXIT.OK);
