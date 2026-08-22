#!/usr/bin/env node
/**
 * 量測式水平溢出修正器。
 *
 * 為什麼不用一段共用 CSS 蓋過去：實測「把所有 grid 收成單欄」會連
 * .shell（78px 導軌 + 主區）一起壓掉，且 !important 會贏過 demo 自己
 * 原本正確的 mobile 規則，反而讓本來通過的版面壞掉（實測 12 個樣本
 * 有 4 個因此變差）。所以改成：在瀏覽器裡量出真正溢出的元素，只對
 * 那些元素產生規則，改完立刻重量，不通過就升級手段再試。
 *
 *   node tools/fix-demo-overflow.mjs <repo...> [--dry-run] [--concurrency=4]
 *   node tools/fix-demo-overflow.mjs --from-log=/tmp/_forge/verify2.log
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { ROOT, EXIT, parseArgs, num, makeLogger } from "./lib/forge-common.mjs";
import * as staticServer from "./lib/static-server.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);
const ROUNDS = num(args.rounds, 3);
const WIDTHS = [390, 768, 1360];
const MARK = "量測式水平溢出修正";

let repos = args._;
if (args["from-log"]) {
  repos = fs.readFileSync(args["from-log"], "utf8").split("\n")
    .filter((l) => l.startsWith("XX ") && /overflow=\d/.test(l))
    .map((l) => l.trim().split(/\s+/)[1]);
}
repos = [...new Set(repos)].filter((r) => fs.existsSync(path.join(ROOT, "demos", r, "index.html")));
if (!repos.length) { log.error("沒有要處理的 demo"); process.exit(EXIT.BAD_INPUT); }

const server = await staticServer.start({ root: ROOT, port: num(args.port, 4599) });
const browser = await chromium.launch();

/** 在頁面內找出溢出元素，並回傳可用的唯一選擇器與該用的修法。 */
const SCAN = () => {
  const W = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth - W <= 2) return [];
  const selectorOf = (el) => {
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body && parts.length < 6) {
      let s = cur.tagName.toLowerCase();
      const cls = [...cur.classList].filter((c) => /^[A-Za-z][\w-]*$/.test(c)).slice(0, 2);
      if (cls.length) s += "." + cls.join(".");
      const par = cur.parentElement;
      if (par) {
        let same = 0;
        try { same = [...par.children].filter((x) => x.matches(s)).length; } catch { same = 2; }
        if (same > 1) s += `:nth-child(${[...par.children].indexOf(cur) + 1})`;
      }
      parts.unshift(s);
      cur = par;
    }
    return "body " + parts.join(" > ");
  };
  /* 已經被某個捲動／裁切祖先包住的元素不算數：它再寬也不會把文件撐開，
     對它下規則只是白費，還會擠掉真正該修的目標。 */
  const clipped = (el) => {
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const ox = getComputedStyle(a).overflowX;
      if (ox === "auto" || ox === "scroll" || ox === "hidden") return true;
    }
    return false;
  };
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const rc = el.getBoundingClientRect();
    if (rc.width <= W + 2 && rc.right <= W + 2) continue;
    if (clipped(el)) continue;
    const cs = getComputedStyle(el);
    let kind = "clamp";
    if (el.tagName === "TABLE") kind = "table";
    else if (cs.display.includes("grid")) kind = "grid";
    else if (cs.display.includes("flex")) kind = "flex";
    out.push({ sel: selectorOf(el), kind, w: Math.round(rc.width) });
    /* 溢出的常常是「橫向列裡的某個子項」，該加捲動的是那一列而不是子項。
       往上找第一個內容已經超出自身寬度的祖先，一併給它捲動規則。 */
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (p.scrollWidth > p.clientWidth + 2) { out.push({ sel: selectorOf(p), kind: "scroll", w: p.scrollWidth }); break; }
    }
    if (out.length >= 20) break;
  }
  return out;
};

const RULE = {
  grid: "grid-template-columns:minmax(0,1fr);",
  flex: "min-width:0;flex-wrap:wrap;",
  table: "display:block;max-width:100%;overflow-x:auto;",
  clamp: "max-width:100%;min-width:0;overflow-x:auto;overflow-wrap:anywhere;",
  scroll: "overflow-x:auto;min-width:0;max-width:100%;",
};

async function measure(page) {
  let worst = 0;
  const found = new Map();
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (let v = 0; v < 6; v += 1) {
      await page.evaluate((n) => { location.hash = `#go=${n}`; }, v);
      await page.waitForTimeout(120);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > worst) worst = over;
      if (over > 2) for (const hit of await page.evaluate(SCAN)) {
        const key = `${width}|${hit.sel}`;
        if (!found.has(key)) found.set(key, { ...hit, width });
      }
    }
  }
  return { worst, hits: [...found.values()] };
}

function buildCss(hits, important) {
  const byWidth = new Map();
  for (const h of hits) {
    const cap = h.width <= 400 ? 720 : h.width <= 800 ? 900 : 4000;
    const bucket = byWidth.get(cap) || new Map();
    const decl = RULE[h.kind] + (h.kind === "grid" && cap > 720 ? "" : "");
    bucket.set(h.sel, (bucket.get(h.sel) || "") + decl);
    byWidth.set(cap, bucket);
  }
  let css = "";
  for (const [cap, bucket] of [...byWidth].sort((a, b) => a[0] - b[0])) {
    const body = [...bucket].map(([sel, decl]) => {
      const d = important ? decl.replace(/;/g, " !important;") : decl;
      return `  ${sel}{${d}}`;
    }).join("\n");
    css += cap >= 4000 ? `${body}\n` : `@media (max-width:${cap}px){\n${body}\n}\n`;
  }
  return css;
}

const results = { fixed: [], improved: [], stuck: [], clean: [] };
const CONC = Math.min(6, Math.max(1, num(args.concurrency, 4)));
let cursor = 0;

async function worker() {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  while (cursor < repos.length) {
    const repo = repos[cursor++];
    const page = await context.newPage();
    try {
      await page.goto(`${server.url}/demos/${repo}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
      const before = await measure(page);
      if (before.worst <= 2) { results.clean.push(repo); await page.close(); continue; }

      let css = "";
      let last = before;
      for (let round = 1; round <= ROUNDS && last.worst > 2; round += 1) {
        /* 文件會橫向捲、卻找不到任何未被裁切的過寬元素，代表撐開的東西
           已經在某個捲動容器裡（例如頁籤列自動捲到後段）。這種情況沒有
           版面元素可修，用 overflow-x:hidden 收掉多餘的捲動範圍即可，
           不會遮住任何內容。 */
        const add = last.hits.length
          ? buildCss(last.hits, round > 1)
          : "@media (max-width:900px){\n  html,body{overflow-x:hidden;}\n}\n";
        if (!add || css.includes(add)) break;
        css += add;
        await page.addStyleTag({ content: add });
        last = await measure(page);
      }

      if (last.worst <= 2) {
        results.fixed.push(repo);
        if (!DRY) {
          const file = path.join(ROOT, "demos", repo, "index.html");
          let html = fs.readFileSync(file, "utf8");
          const i = html.lastIndexOf("</style>");
          const block = `\n\n/* ── ${MARK} ─────────────────────────────\n   由 tools/fix-demo-overflow.mjs 量測產生，只針對實際溢出的元素。 */\n${css}`;
          fs.writeFileSync(file, html.slice(0, i) + block + html.slice(i));
        }
      } else if (last.worst < before.worst) results.improved.push([repo, before.worst, last.worst]);
      else results.stuck.push([repo, before.worst, last.worst]);
      console.log(`  ${last.worst <= 2 ? "✓" : "·"} ${repo.padEnd(46)} +${before.worst} → +${last.worst}`);
    } catch (error) {
      results.stuck.push([repo, -1, String(error.message).slice(0, 60)]);
    }
    await page.close();
  }
  await context.close();
}

await Promise.all(Array.from({ length: CONC }, worker));
await browser.close();

console.log(`\n  完全修正 ${results.fixed.length}　本來就沒溢出 ${results.clean.length}　改善但未達標 ${results.improved.length}　無效 ${results.stuck.length}`);
if (results.improved.length) results.improved.slice(0, 8).forEach(([r, a, b]) => console.log(`    改善 ${r} +${a} → +${b}`));
if (results.stuck.length) results.stuck.slice(0, 8).forEach(([r, a, b]) => console.log(`    無效 ${r} ${a} ${b}`));
if (DRY) console.log("\n  （--dry-run：未寫入任何檔案）");
process.exit(results.stuck.length ? EXIT.PARTIAL : EXIT.OK);
