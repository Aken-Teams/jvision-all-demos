#!/usr/bin/env node
/**
 * 實例綁定率驗收：開通一批 demo，用真瀏覽器量測 runtime 接得上多少。
 *
 * 這是第三期唯一有意義的品質指標。1,878 套 demo 的 HTML 結構差異很大，
 * 「能不能接管客戶原本熟悉的畫面」不是用想的，要實際跑才知道。
 *
 * 三種結果：
 *   native   接管了 demo 原本的表格——客戶看到的還是他買的那個畫面（最好）
 *   fallback 走退路面板——功能完整但多一塊面板，客戶會覺得不太一樣
 *   none     連退路都沒出現——這是壞掉，要查
 *
 * 跑完會把測試用的實例清掉，除非加 --keep。
 *
 *   node tools/instance-verify.mjs [--count=12] [--repos=a,b] [--keep] [--port=3000]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, num, list, makeLogger } from "./lib/forge-common.mjs";
import * as control from "./lib/control-db.mjs";
import * as data from "./lib/instance-db.mjs";
import { bind } from "./instance-bind.mjs";
import { close } from "./lib/mysql.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const PORT = num(args.port, 3000);
const SCHEMA_DIR = path.join(ROOT, "content", "schema");
const TEST_EMAIL = "instance-verify@jvision.local";

/** 挑一批「結構上有代表性」的 demo，不要全是同一種。 */
function pickRepos(n) {
  const all = fs.readdirSync(SCHEMA_DIR).map((f) => {
    const s = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, f), "utf8"));
    return { repo: s.repoName, tables: s.tables.length,
      rendered: s.tables.filter((t) => t.renderedByJs).length,
      seeded: s.tables.filter((t) => t.seed.length).length, ready: s.readyState === "ready" };
  }).filter((x) => x.ready);

  /* 四個分層各取一些：靜態有資料、靜態無資料、JS 渲染、多表。
     只抽同一種會得到漂亮但沒有意義的數字。 */
  const buckets = [
    all.filter((x) => !x.rendered && x.seeded && x.tables === 1),
    all.filter((x) => !x.rendered && !x.seeded),
    all.filter((x) => x.rendered),
    all.filter((x) => x.tables >= 3),
  ];
  const out = [], seen = new Set();
  for (let i = 0; out.length < n; i += 1) {
    const b = buckets[i % buckets.length];
    if (!b.length) { if (buckets.every((x) => !x.length)) break; continue; }
    const pick = b[Math.floor(i / buckets.length) % b.length];
    if (pick && !seen.has(pick.repo)) { seen.add(pick.repo); out.push(pick); }
    if (i > n * 8) break;
  }
  return out;
}

async function main() {
  const repos = args.repos ? list(args.repos).map((r) => ({ repo: r })) : pickRepos(num(args.count, 12));
  if (!repos.length) { log.error("挑不到可測的 demo"); process.exit(EXIT.BAD_INPUT); }
  log.step(`驗收 ${repos.length} 套`);

  const customer = await control.ensureCustomer({ email: TEST_EMAIL, company: "verify" });
  const made = [];
  for (const r of repos) {
    try {
      const schema = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, `${r.repo}.json`), "utf8"));
      const host = `verify-${r.repo.slice(0, 30)}-${Date.now().toString(36)}.c.jvdemo.jvision-ai.com`;
      const inst = await control.createInstance({ customerId: customer.id, orderId: null,
        repoName: r.repo, host, dir: path.join(ROOT, "var", "instances", "__v__") });
      const dir = path.join(ROOT, "var", "instances", inst.id);
      bind({ repo: r.repo, outDir: dir });
      await data.createFromSchema(inst.db_name, schema);
      await control.setInstanceState(inst.id, "live", { dir });
      made.push({ ...r, id: inst.id, tables: schema.tables.length, schema });
    } catch (error) { log.warn(`  ✖ ${r.repo} 開通失敗：${error.message}`); }
  }
  log.info(`  開通 ${made.length}/${repos.length} 套`);
  if (!made.length) return;

  /* 用真瀏覽器看。只有這樣才知道 runtime 在真實 DOM 上接不接得上。 */
  const { chromium } = await import("playwright");
  const cookie = mintCookie();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  await ctx.addCookies([{ name: "jv_visitor", value: cookie, url: `http://127.0.0.1:${PORT}` }]);

  const results = [];
  for (const m of made) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 80)));
    try {
      await page.goto(`http://127.0.0.1:${PORT}/-/i/${m.id}/`, { waitUntil: "networkidle", timeout: 30000 });
      /* 逛過每個畫面：demo 的表常常要點到那一頁才由 JS 建出來，
         不逛就看不到 runtime 真正的接管能力。 */
      const navs = await page.$$("[data-i]");
      for (let n = 0; n < Math.min(navs.length, 6); n += 1) {
        await navs[n].click().catch(() => {});
        await page.waitForTimeout(350);
      }
      await page.waitForTimeout(1200);
      const r = await page.evaluate(() => {
        const bound = [...document.querySelectorAll("table[data-jv-bound]")];
        return {
          native: bound.filter((t) => !t.closest("[data-jv-fallback-for]")).length,
          fallback: bound.filter((t) => t.closest("[data-jv-fallback-for]")).length,
          rows: bound.reduce((n, t) => n + t.querySelectorAll("tbody tr").length, 0),
        };
      });
      results.push({ repo: m.repo, tables: m.tables, ...r, errors: errors.length });
    } catch (error) {
      results.push({ repo: m.repo, tables: m.tables, native: 0, fallback: 0, rows: 0, errors: 1, failed: error.message.slice(0, 60) });
    }
    await page.close();
  }
  await browser.close();

  /* ── 報告 ─────────────────────────────────────────── */
  const tot = results.reduce((a, r) => ({
    tables: a.tables + r.tables, native: a.native + r.native, fallback: a.fallback + r.fallback,
  }), { tables: 0, native: 0, fallback: 0 });
  const none = tot.tables - tot.native - tot.fallback;

  log.step("結果");
  for (const r of results) {
    const mark = r.failed ? "✖" : r.native === r.tables ? "✅" : r.native ? "◐" : "○";
    log.info(`  ${mark} ${r.repo.padEnd(46)} 原生 ${r.native}/${r.tables}　退路 ${r.fallback}${r.errors ? `　錯誤 ${r.errors}` : ""}${r.failed ? `　${r.failed}` : ""}`);
  }
  const pct = (n) => `${Math.round((n / tot.tables) * 100)}%`;
  log.step(`共 ${tot.tables} 張表：接管原生 ${tot.native}（${pct(tot.native)}）、退路面板 ${tot.fallback}（${pct(tot.fallback)}）、完全沒接上 ${none}`);
  log.info("  接管原生＝客戶看到的還是他買的那個畫面；退路面板＝功能完整但多一塊");

  if (!args.keep) {
    for (const m of made) {
      await control.destroyInstance(m.id).catch(() => {});
      fs.rmSync(path.join(ROOT, "var", "instances", m.id), { recursive: true, force: true });
    }
    log.info(`  已清除 ${made.length} 個測試實例（--keep 可保留）`);
  }
}

/** 用站台自己的密鑰簽一顆測試身分，不必真的走 Google 登入。 */
function mintCookie() {
  const crypto = require("node:crypto");
  const conf = JSON.parse(fs.readFileSync(path.join(ROOT, "var", "admin.json"), "utf8"));
  const payload = Buffer.from(JSON.stringify({
    kind: "google", email: TEST_EMAIL, name: "verify", exp: Date.now() + 3600e3,
  })).toString("base64url");
  return `${payload}.${crypto.createHmac("sha256", conf.secret).update(payload).digest("base64url")}`;
}

const require = (await import("node:module")).createRequire(import.meta.url);

main()
  .catch((error) => { log.error(error.stack || error.message); process.exitCode = EXIT.BAD_INPUT; })
  .finally(() => close());
