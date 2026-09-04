/**
 * 把舊的檔案帳目（var/token-usage.jsonl）匯進 token_usage 表。
 *
 * 用量從檔案搬到資料庫的一次性搬遷。舊檔不刪——留著是為了萬一比對得回去；
 * 匯完之後 record() 只寫資料庫，那個檔就不會再長。
 *
 * 重跑安全：用 (at, actor, tok_in, tok_out) 判斷已經有沒有。沒有做唯一索引
 * 是因為同一個人在同一秒發兩次一模一樣的呼叫是可能的——那時候寧可漏判成
 * 重複、少匯一筆，也不要為了完全精確而在正式表上加一個會擋掉合法資料的限制。
 * 預設試跑，--apply 才寫。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, parseArgs, makeLogger, EXIT } from "./lib/forge-common.mjs";
import * as control from "./lib/control-db.mjs";
import { q, close } from "./lib/mysql.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const APPLY = Boolean(args.apply);

async function main() {
  await control.listMembers("x");          // 確保建表跑過
  const files = [
    path.join(ROOT, "var", "token-usage.jsonl"),
    path.join(ROOT, "var", "token-usage-spill.jsonl"),
  ].filter((f) => fs.existsSync(f));
  if (!files.length) { log.info("沒有舊帳目要匯入"); return; }

  let seen = 0; let added = 0; let dup = 0; let bad = 0;
  for (const file of files) {
    log.step(path.relative(ROOT, file));
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      if (!line.trim()) continue;
      let r;
      try { r = JSON.parse(line); } catch { bad += 1; continue; }
      if (!r.actor || !r.at) { bad += 1; continue; }
      seen += 1;
      const at = new Date(r.at);
      if (Number.isNaN(at.getTime())) { bad += 1; continue; }
      const n = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0);
      const vals = {
        at, actor: String(r.actor).slice(0, 190), kind: String(r.kind || "llm").slice(0, 20),
        model: r.model ? String(r.model).slice(0, 80) : null,
        instance: r.instance || null, repo: r.repo || null,
        in: n(r.in), out: n(r.out), cacheWrite: n(r.cacheWrite), cacheRead: n(r.cacheRead),
        reasoning: n(r.reasoning), turns: n(r.turns),
        cost: r.cost == null ? null : Number(r.cost),
      };
      const [hit] = await q(
        `SELECT id FROM token_usage WHERE at = ? AND actor = ? AND tok_in = ? AND tok_out = ? LIMIT 1`,
        [vals.at, vals.actor, vals.in, vals.out]);
      if (hit) { dup += 1; continue; }
      if (APPLY) {
        await q(`INSERT INTO token_usage
            (at, actor, kind, model, instance_id, repo_name,
             tok_in, tok_out, tok_cache_write, tok_cache_read, tok_reasoning, turns, cost)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [vals.at, vals.actor, vals.kind, vals.model, vals.instance, vals.repo,
          vals.in, vals.out, vals.cacheWrite, vals.cacheRead, vals.reasoning, vals.turns, vals.cost]);
      }
      added += 1;
    }
  }
  log.step(`${APPLY ? "已匯入" : "試跑"}：讀 ${seen} 筆，新增 ${added}，已存在 ${dup}，跳過 ${bad}`);
  if (!APPLY) log.info("（試跑，什麼都沒寫。要真的匯入請加 --apply）");
}

main().catch((e) => { log.error(e.message); process.exitCode = EXIT.BAD_INPUT; }).finally(() => close());
