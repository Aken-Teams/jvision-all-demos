#!/usr/bin/env node
/**
 * 訂單建置 worker：把付過款的需求單自動變成可用的系統。
 *
 * 設計成「主動拉單」而不是「由付款回呼觸發」。回呼是外部打進來的，會掉、會重複、
 * 會在我們正好重啟時打進來；把建置綁在回呼上，掉一次就有一張單永遠沒人處理。
 * 拉單的話：回呼只負責把狀態推到 paid，剩下的由這支定期掃。
 *
 * claimOrder 用資料庫的租約搶單，所以：
 *   - 同時跑好幾支不會搶到同一張
 *   - 這支中途死掉，租約到期後別人會接手，訂單不會永遠卡住
 *
 *   node tools/order-worker.mjs [--interval=30] [--once]
 */
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { ROOT, parseArgs, num, makeLogger } from "./lib/forge-common.mjs";
import * as control from "./lib/control-db.mjs";
import { close } from "./lib/mysql.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const INTERVAL = num(args.interval, 30) * 1000;
const WORKER_ID = `${os.hostname()}:${process.pid}`;

let stopping = false;
process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });

function provision(orderId) {
  return new Promise((resolve) => {
    execFile(process.execPath, [path.join(ROOT, "tools", "instance-provision.mjs"), `--order=${orderId}`],
      { cwd: ROOT, timeout: 600000, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout, stderr) => resolve({ ok: !err, out: String(stdout || stderr || err?.message || "").slice(-800) }));
  });
}

async function tick() {
  const order = await control.claimOrder({ workerId: WORKER_ID, leaseMinutes: 20 });
  if (!order) return false;

  log.step(`接到需求單 ${order.id}（${order.buyer_email}，${order.items.length} 套）`);
  /* claimOrder 已經把狀態推到 provisioning，而 instance-provision 會再推一次
     ——它接受 draft/paid，遇到 provisioning 會拒絕。所以這裡直接叫它會失敗。
     把狀態放回 paid 再交給它，讓「怎麼開通、怎麼標記結果」只有一份邏輯。 */
  await control.resetPaid(order.id);
  const r = await provision(order.id);
  if (r.ok) log.info(`  ✅ ${order.id} 已交付`);
  else log.warn(`  ✖ ${order.id} 開通失敗：${r.out.split("\n").filter(Boolean).slice(-1)[0] || "未知"}`);
  return true;
}

async function main() {
  log.step(`訂單 worker 啟動（${WORKER_ID}），每 ${INTERVAL / 1000} 秒掃一次`);
  do {
    try {
      /* 一次把手上能做的都做完再睡，不要一輪只做一張——付款常常是一次進來
         好幾張，逐輪處理會讓最後一張等上好幾分鐘。 */
      while (!stopping && await tick()) { /* continue */ }
    } catch (error) {
      log.error(`掃單失敗：${error.message}`);
    }
    if (args.once || stopping) break;
    await new Promise((r) => setTimeout(r, INTERVAL));
  } while (!stopping);
  log.step("worker 結束");
}

main()
  .catch((e) => { log.error(e.stack || e.message); process.exitCode = 1; })
  .finally(() => close());
