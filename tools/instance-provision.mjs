#!/usr/bin/env node
/**
 * 開通一套客戶的系統：複製 demo → 注入 runtime → 建專屬資料庫 → 灌種子資料。
 *
 * 每一步都冪等，中途失敗可以直接重跑——共用主機的連線會斷，重跑比回滾實際。
 * 失敗時不留半成品：資料庫建了但登錄失敗會自動 DROP（見 control-db 的
 * createInstance），檔案目錄留著沒關係，重跑會覆蓋。
 *
 *   node tools/instance-provision.mjs --repo=<repo> --email=<買家信箱> [--company=名稱] [--dry-run]
 *   node tools/instance-provision.mjs --order=<需求單編號>            （整張單一次開通）
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, makeLogger } from "./lib/forge-common.mjs";
import * as control from "./lib/control-db.mjs";
import * as data from "./lib/instance-db.mjs";
import { bind } from "./instance-bind.mjs";
import { close } from "./lib/mysql.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);
const INSTANCES = path.join(ROOT, "var", "instances");

/** 子網域：<公司>-<系統>，撞名加序號。host 在資料庫是 UNIQUE，這裡先讓它好看。 */
async function pickHost(customerSlug, repo) {
  const short = repo.replace(/^jvision-/, "").split("-").slice(0, 2).join("-").slice(0, 20);
  const base = `${customerSlug}-${short}`.replace(/[^a-z0-9-]/g, "").slice(0, 50);
  let host = `${base}.c.jvdemo.jvision-ai.com`;
  let n = 1;
  while (await control.instanceByHost(host)) host = `${base}-${++n}.c.jvdemo.jvision-ai.com`;
  return host;
}

async function provisionOne({ repo, customer, orderId }) {
  const schemaPath = path.join(ROOT, "content", "schema", `${repo}.json`);
  if (!fs.existsSync(schemaPath)) throw new Error(`${repo} 還沒有資料表定義`);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  if (schema.readyState !== "ready") throw new Error(`${repo} 的資料表定義狀態是 ${schema.readyState}，還不能開通`);

  const host = await pickHost(customer.slug, repo);
  if (DRY) {
    log.info(`  ${repo} → ${host}（${schema.tables.length} 張表）`);
    return null;
  }

  /* 先在控制面登錄並建資料庫——它會保證 host 與資料庫名唯一，
     檔案先寫好卻登錄失敗的話會留下沒人認領的目錄。 */
  const dir = path.join(INSTANCES, "__pending__");
  const inst = await control.createInstance({
    customerId: customer.id, orderId, repoName: repo, host, dir,
  });
  const realDir = path.join(INSTANCES, inst.id);

  try {
    bind({ repo, outDir: realDir });
    await data.createFromSchema(inst.db_name, schema);
    await control.setInstanceState(inst.id, "live", { dir: realDir });
    await control.recordEvent({ kind: "instance.live", customerId: customer.id, instanceId: inst.id,
      actor: customer.owner_email, detail: { repo, host } });
    log.info(`  ✅ ${repo} → ${host}`);
    return { ...inst, dir: realDir, host };
  } catch (error) {
    await control.setInstanceState(inst.id, "failed", {}).catch(() => {});
    throw new Error(`${repo} 開通失敗：${error.message}`);
  }
}

async function main() {
  let customer, repos = [], orderId = null;

  if (args.order) {
    const order = await control.getOrder(args.order);
    if (!order) throw new Error(`找不到需求單 ${args.order}`);
    orderId = order.id;
    customer = await control.ensureCustomer({ email: order.buyer_email });
    repos = order.items.map((x) => x.repoName);
    log.step(`需求單 ${order.id}：${order.buyer_email}，${repos.length} 套`);
    /* 先把單推進「開通中」再動手。條件由資料庫判，兩個人同時按開通只有一個
       會贏，另一個直接被擋下來——不然會開出兩套一模一樣的系統。
       dry-run 不動狀態：那是拿來看會做什麼的，不該留下痕跡。 */
    if (!DRY) {
      const won = await control.beginProvision(order.id);
      if (!won) {
        log.error(`這張單目前是「${order.status}」，不是可以開通的狀態（已經有人在處理或已完成）`);
        process.exit(EXIT.BAD_INPUT);
      }
    }
  } else {
    if (!args.repo || !args.email) {
      log.error("用法：--repo=<repo> --email=<信箱> [--company=名稱]  或  --order=<需求單編號>");
      process.exit(EXIT.BAD_INPUT);
    }
    customer = await control.ensureCustomer({ email: args.email, company: args.company });
    repos = String(args.repo).split(",").map((s) => s.trim()).filter(Boolean);
    log.step(`為 ${customer.name}（${customer.owner_email}）開通 ${repos.length} 套`);
  }

  const done = [];
  for (const repo of repos) {
    try { const r = await provisionOne({ repo, customer, orderId }); if (r) done.push(r); }
    catch (error) { log.error(`  ✖ ${error.message}`); }
  }

  /* 全部成功才算交付。一張單開了三套只成功兩套，那張單不是「完成」——
     標成完成的話，沒開出來的那一套就再也沒有人會回頭處理。 */
  if (orderId && !DRY) {
    const ok = done.length === repos.length && done.length > 0;
    await control.finishProvision(orderId, ok);
    await control.recordEvent({ kind: ok ? "order.delivered" : "order.failed",
      customerId: customer.id, actor: customer.owner_email,
      detail: { orderId, done: done.length, total: repos.length } });
    log.info(ok ? "  需求單標記為已交付" : `  需求單標記為失敗（成功 ${done.length}/${repos.length}）`);
  }
  if (!DRY) log.step(`完成 ${done.length}/${repos.length} 套`);
  for (const d of done) log.info(`  https://${d.host}`);
}

main()
  .catch((error) => { log.error(error.message); process.exitCode = EXIT.BAD_INPUT; })
  .finally(() => close());
