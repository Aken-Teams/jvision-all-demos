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
 *   node tools/instance-verify.mjs [--count=12] [--repos=a,b] [--keep] [--seed=N] [--port=3000]
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

/* 可重現的亂數。抽樣要隨機才有代表性，但出了問題要能用同一批重跑，
   所以用 seed 決定序列而不是 Math.random。 */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 挑一批「結構上有代表性」的 demo，不要全是同一種。 */
function pickRepos(n, seed) {
  const all = fs.readdirSync(SCHEMA_DIR).map((f) => {
    const s = JSON.parse(fs.readFileSync(path.join(SCHEMA_DIR, f), "utf8"));
    return { repo: s.repoName, tables: s.tables.length,
      rendered: s.tables.filter((t) => t.renderedByJs).length,
      seeded: s.tables.filter((t) => t.seed.length).length, ready: s.readyState === "ready" };
  }).filter((x) => x.ready && x.tables > 0);

  /* 四個分層各取一些：靜態有資料、靜態無資料、JS 渲染、多表。
     只抽同一種會得到漂亮但沒有意義的數字。 */
  const buckets = [
    all.filter((x) => !x.rendered && x.seeded && x.tables === 1),
    all.filter((x) => !x.rendered && !x.seeded),
    all.filter((x) => x.rendered),
    all.filter((x) => x.tables >= 3),
  ];
  /* 每一層先洗牌再取。原本是固定從每層開頭取，於是每次跑的都是同一批
     「字母排在前面」的專案——那樣的 100% 只證明那幾套沒問題，
     不能代表全站 1,700 多套。 */
  const rnd = mulberry(seed);
  for (const b of buckets) {
    for (let i = b.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
  }
  const out = [], seen = new Set();
  const cursor = buckets.map(() => 0);
  while (out.length < n) {
    let moved = false;
    for (let k = 0; k < buckets.length && out.length < n; k += 1) {
      const b = buckets[k];
      while (cursor[k] < b.length) {
        const pick = b[cursor[k]++];
        if (seen.has(pick.repo)) continue;
        seen.add(pick.repo); out.push(pick); moved = true;
        break;
      }
    }
    if (!moved) break; // 四層都取完了
  }
  return out;
}

async function main() {
  const seed = num(args.seed, Date.now() % 2147483647);
  const repos = args.repos ? list(args.repos).map((r) => ({ repo: r })) : pickRepos(num(args.count, 12), seed);
  if (!args.repos) log.info(`  抽樣種子 ${seed}（--seed=${seed} 可重跑同一批）`);
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

      /* 逛過每個畫面，並且**在每一頁都記一次**哪些表接上了原生畫面。
         很多 demo 換頁是整塊 innerHTML 重畫，同一時間只有當頁的表在 DOM 裡；
         只看最後一頁的瞬間，其他頁的表會被算成沒接上——但使用者切過去就看得到。
         客戶真正在意的是「這張表我點得到的時候是不是原本那個畫面」，
         所以認定標準是「巡過一輪之中曾經原生接上」。 */
      const seenNative = new Set();
      const snap = async () => {
        const names = await page.evaluate(() =>
          [...document.querySelectorAll("table[data-jv-bound][data-jv-table]")]
            .filter((t) => !t.closest("[data-jv-fallback-for]"))
            .map((t) => t.dataset.jvTable));
        names.forEach((n) => seenNative.add(n));
      };
      await page.waitForTimeout(900);
      await snap();
      const navCount = await page.evaluate(() => document.querySelectorAll("[data-i]").length);
      for (let n = 0; n < Math.min(navCount, 8); n += 1) {
        await page.evaluate((k) => document.querySelectorAll("[data-i]")[k]?.click(), n).catch(() => {});
        await page.waitForTimeout(700);
        await snap();
      }
      await page.waitForTimeout(900);
      await snap();

      const r = await page.evaluate(() => {
        const bound = [...document.querySelectorAll("table[data-jv-bound]")];
        return {
          fallbackNow: document.querySelectorAll("[data-jv-fallback-for]").length,
          rows: bound.reduce((n, t) => n + t.querySelectorAll("tbody tr").length, 0),
        };
      });
      r.native = seenNative.size;
      /* 逛完一輪都沒原生出現過的，才算真的只剩退路。 */
      r.fallback = Math.max(0, Math.min(m.tables - r.native, r.fallbackNow));
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
