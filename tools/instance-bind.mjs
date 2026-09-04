#!/usr/bin/env node
/**
 * 把一套 demo 複製成客戶的實例，並注入 live runtime。
 *
 * 原 demo 一個位元組都不動——它是目錄展示品，由 static-gate 保證單檔自足，
 * demo-forge 的 diffGuard 也會把白名單外的變動還原。實例一律在 var/instances/。
 * 這條界線在下面有一道硬性檢查，不只是靠註解自律。
 *
 * 注入手法沿用 apply-agent-bridge.mjs 那套（1,628 套實戰驗證過）：
 * 標記包住、可重複執行、先移除舊的再插新的。
 *
 *   node tools/instance-bind.mjs --repo=<repo> --out=<dir> [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, makeLogger } from "./lib/forge-common.mjs";
import { extractTables } from "./lib/schema-extract.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);

const MARK_OPEN = "<!-- jv-live:start -->";
const MARK_CLOSE = "<!-- jv-live:end -->";
const INJECT = `${MARK_OPEN}
<script src="./_jv/live.js"></script>
<script src="./_jv/assist.js"></script>
<script src="./_jv/tour.js"></script>
${MARK_CLOSE}`;

/**
 * 注入（或重新注入）runtime。冪等：先把舊的標記段整段拿掉再插新的，
 * 重跑不會疊出兩份。
 */
export function injectRuntime(html) {
  const cleaned = html.replace(new RegExp(`${MARK_OPEN}[\\s\\S]*?${MARK_CLOSE}\\s*`, "g"), "");
  const i = cleaned.lastIndexOf("</body>");
  return i < 0 ? `${cleaned}\n${INJECT}\n` : `${cleaned.slice(0, i)}${INJECT}\n${cleaned.slice(i)}`;
}

/**
 * favicon 指向 ../../favicon.svg，那是站台根目錄的檔案。實例是獨立部署，
 * 那個相對路徑必然 404，順手改成實例自己帶的一份。
 */
export function fixAssets(html) {
  return html.replace(/href="\.\.\/\.\.\/favicon\.svg"/g, 'href="./_jv/favicon.svg"');
}

export function bind({ repo, outDir }) {
  const demoDir = path.join(ROOT, "demos", repo);
  const srcHtml = path.join(demoDir, "index.html");
  const schemaPath = path.join(ROOT, "content", "schema", `${repo}.json`);

  if (!fs.existsSync(srcHtml)) throw new Error(`找不到 demo：${repo}`);
  if (!fs.existsSync(schemaPath)) throw new Error(`${repo} 還沒有資料表定義（跑 tools/schema-scan.mjs）`);

  /* 硬性保護：絕不可以寫進 demos/。註解擋不住手滑，這裡才擋得住。 */
  const abs = path.resolve(outDir);
  if (abs === path.resolve(ROOT, "demos") || abs.startsWith(path.resolve(ROOT, "demos") + path.sep)) {
    throw Object.assign(new Error("輸出路徑不可以在 demos/ 底下——那是目錄展示品"), { code: EXIT.BAD_INPUT });
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  if (schema.readyState !== "ready") log.warn(`  ${repo} 的 schema 狀態是 ${schema.readyState}`);

  const html = fixAssets(injectRuntime(fs.readFileSync(srcHtml, "utf8")));

  /* 抄過來的那份 schema 是產線預先產好的，裡面的表名是「<系統名> 資料表 1」
     這種佔位名——每張表只差最後一個數字，在下拉選單裡等於沒有名字。
     真正的名字就寫在畫面上（表格上方那個 <h3>），這裡順手換掉。

     為什麼不改產線那 2000 多份檔：那是一次性的大批次，而這裡是每次開通都會
     跑到的一行，改在這裡對新舊兩邊都有效，也不必等那個批次跑完。
     對不上的就留著原本的名字——寧可難看，也不要把 A 表的名字寫到 B 表上。 */
  {
    const byCols = new Map();
    for (const t of extractTables(html)) if (t.caption) byCols.set(t.labels.join("|"), t.caption);
    let fixed = 0;
    for (const t of schema.tables || []) {
      const hit = byCols.get((t.columns || []).map((c) => c.label).join("|"));
      if (hit && hit !== t.title) { t.title = hit; fixed += 1; }
    }
    if (fixed) log.info(`  表名以畫面為準修正了 ${fixed} 個`);
  }
  const pub = path.join(outDir, "public");
  const jv = path.join(pub, "_jv");

  if (DRY) {
    log.info(`  將寫入 ${path.relative(ROOT, pub)}/index.html（${(Buffer.byteLength(html) / 1024).toFixed(1)} KB）`);
    log.info(`  將寫入 ${path.relative(ROOT, jv)}/live.js、assist.js、tour.js、tour.json、schema.json、favicon.svg`);
    log.info(`  資料表：${schema.tables.map((t) => `${t.name}(${t.columns.length}欄)`).join(" ")}`);
    return { dryRun: true, schema };
  }

  fs.mkdirSync(jv, { recursive: true });
  fs.writeFileSync(path.join(pub, "index.html"), html);
  fs.copyFileSync(path.join(ROOT, "shared", "jv-live.js"), path.join(jv, "live.js"));
  /* 右下角的修改助理。跟 live.js 一樣複製進實例而不是連回站台——
     實例交付給客戶之後是獨立部署的，連回來就會斷。 */
  fs.copyFileSync(path.join(ROOT, "shared", "jv-assist.js"), path.join(jv, "assist.js"));
  /* 第一次進來的導覽。 */
  fs.copyFileSync(path.join(ROOT, "shared", "jv-tour.js"), path.join(jv, "tour.js"));

  /* 導覽要講的內容。寫成檔而不是讓腳本自己去猜：系統叫什麼、管哪些欄位，
     這些站台這邊就知道，交付出去之後客戶端也讀得到同一份。 */
  const meta = (() => {
    try {
      const c = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalog-index.json"), "utf8"));
      return (c.projects || []).find((x) => x.repoName === repo) || {};
    } catch { return {}; }
  })();
  const t0 = schema.tables[0];
  fs.writeFileSync(path.join(jv, "tour.json"), JSON.stringify({
    title: meta.title || repo.replace(/^jvision-/, ""),
    description: meta.description || null,
    primaryUser: meta.primaryUser || null,
    tables: schema.tables.length,
    fields: t0 ? t0.columns.map((c) => c.label) : [],
  }, null, 2) + "\n");
  fs.copyFileSync(path.join(ROOT, "favicon.svg"), path.join(jv, "favicon.svg"));
  /* schema 也放一份在實例裡：交付 repo 給客戶時他要看得懂自己的資料結構。
     runtime 走的是 API（./_jv/schema），不讀這個檔。 */
  fs.writeFileSync(path.join(jv, "schema.json"), JSON.stringify(schema, null, 2) + "\n");

  const readme = path.join(demoDir, "README.md");
  if (fs.existsSync(readme)) fs.copyFileSync(readme, path.join(outDir, "README.md"));

  return { schema, htmlBytes: Buffer.byteLength(html) };
}

/* ── CLI ────────────────────────────────────────────── */
if (import.meta.url === `file://${process.argv[1]}`) {
  const repo = args.repo;
  const out = args.out;
  if (!repo || !out) {
    log.error("用法：node tools/instance-bind.mjs --repo=<repo> --out=<dir> [--dry-run]");
    process.exit(EXIT.BAD_INPUT);
  }
  try {
    const r = bind({ repo, outDir: out });
    if (!r.dryRun) log.step(`已產出實例：${path.relative(ROOT, out)}（${(r.htmlBytes / 1024).toFixed(1)} KB，${r.schema.tables.length} 張表）`);
  } catch (error) {
    log.error(error.message);
    process.exit(error.code || EXIT.BAD_INPUT);
  }
}
