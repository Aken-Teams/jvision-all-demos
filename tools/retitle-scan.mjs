#!/usr/bin/env node
/**
 * 全站專案名稱易懂度總檢：逐批請 codex 審每個標題，難懂的提出白話改名。
 *
 * 只產提案（docs/_state/retitle-proposals.json），不動任何目錄檔——
 * 套用是另一支 retitle-apply.mjs 的事，改 1,700 個名稱這種不可逆動作
 * 要有獨立的單一入口。
 *
 * 可中斷續跑：每批完成就落盤，重跑會跳過已處理的批次。
 *
 *   node tools/retitle-scan.mjs [--batch=50] [--limit=N] [--timeout=300]
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, num, makeLogger, loadCatalog, writeJson } from "./lib/forge-common.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const OUT = path.join(ROOT, "docs", "_state", "retitle-proposals.json");
const SCHEMA = path.join(ROOT, "tools", "schemas", "retitle.schema.json");
const BATCH = num(args.batch, 50);
const TIMEOUT_MS = num(args.timeout, 300) * 1000;

const catalog = loadCatalog();
let projects = catalog.projects.map((p) => ({
  repoName: p.repoName,
  title: p.title,
  category: p.category || "",
  desc: String(p.description || "").slice(0, 40),
}));
if (args.limit) projects = projects.slice(0, num(args.limit, 0));

const state = fs.existsSync(OUT)
  ? JSON.parse(fs.readFileSync(OUT, "utf8"))
  : { startedAt: new Date().toISOString(), reviewed: {}, failedBatches: [] };

const pending = projects.filter((p) => !state.reviewed[p.repoName]);
log.step(`共 ${projects.length} 個標題，已審 ${projects.length - pending.length}，待審 ${pending.length}`);
if (!pending.length) { log.info("全部審完"); summarize(); process.exit(0); }

function buildPrompt(chunk) {
  return `你是台灣企業軟體的產品命名顧問。下面是一批系統名稱，請逐一判斷：
「一位台灣中小企業的一般員工（非工程師、非該領域專家），看到這個名稱能不能馬上知道這套系統是做什麼的？」

## 判斷與改名規則
1. 看得懂 → ok:true，newTitle 填空字串 ""。
2. 看不懂 → ok:false，並給 newTitle：
   - 以中文為主，6–16 個字，講清楚「對象＋做什麼」
   - **絕不可以英文開頭**；括號裡的英文副標整段拿掉
   - 廣為人知的縮寫（AI、ERP、POS、CRM、API、PCB、GPS）可以保留，但要放在中文之後
     或配上中文說明；冷門縮寫（OEE、UNS、ESD、IMDS、AVI、EA、SOP、BI、HRIS…）必須換成白話中文
   - 不可改變系統的本質與領域——參考附上的分類與描述，改名不是重新發明
   - 同一批裡的 newTitle 不可互相相同
3. 「XX管理台／作業台／預警台」這類收尾是本站慣例，看得懂就保留。
4. repoName 原樣抄回，一個都不能少。

## 待審名單（共 ${chunk.length} 個）
${chunk.map((p) => `- repoName: ${p.repoName}｜名稱: ${p.title}｜分類: ${p.category}｜描述: ${p.desc}`).join("\n")}`;
}

let batches = 0, changed = 0;
for (let i = 0; i < pending.length; i += BATCH) {
  const chunk = pending.slice(i, i + BATCH);
  batches += 1;
  log.step(`第 ${batches} 批（${chunk.length} 個）…`);
  const r = await runCodexWithRetry({
    prompt: buildPrompt(chunk), cwd: ROOT, sandbox: "read-only",
    schemaPath: SCHEMA, timeoutMs: TIMEOUT_MS,
  });
  const items = r.json?.items;
  if (!r.ok || !Array.isArray(items)) {
    log.warn(`  批次失敗：${r.error || "回傳非陣列"}——記下跳過，之後重跑會再試`);
    state.failedBatches.push({ at: new Date().toISOString(), first: chunk[0].repoName, error: r.error || "bad json" });
    writeJson(OUT, state);
    continue;
  }
  const byRepo = new Map(items.map((x) => [x.repoName, x]));
  for (const p of chunk) {
    const v = byRepo.get(p.repoName);
    if (!v) continue; // 漏答的留在待審，下次重跑補
    const newTitle = String(v.newTitle || "").trim();
    const usable = !v.ok && newTitle && newTitle !== p.title && newTitle.length >= 4 && newTitle.length <= 24;
    state.reviewed[p.repoName] = usable ? { old: p.title, new: newTitle } : { old: p.title, ok: true };
    if (usable) changed += 1;
  }
  writeJson(OUT, state);
  log.info(`  完成，累計提案改名 ${changed} 個`);
}

summarize();

function summarize() {
  const all = Object.values(state.reviewed);
  const renames = all.filter((x) => x.new);
  log.step(`審畢 ${all.length} 個：維持 ${all.length - renames.length}、提案改名 ${renames.length}`);
  for (const s of renames.slice(0, 10)) log.info(`  ${s.old} → ${s.new}`);
  if (renames.length > 10) log.info(`  …其餘見 ${path.relative(ROOT, OUT)}`);
}
