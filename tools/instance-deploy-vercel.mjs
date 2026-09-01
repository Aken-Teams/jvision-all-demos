#!/usr/bin/env node
/**
 * 把一個客戶的系統部署到 Vercel，變成一個公開網址。
 *
 * 這是交付的其中一個「選項」，跟既有的兩條路並存：
 *   GitHub repo   客戶自己 clone 下來 docker compose up（instance-deliver.mjs）
 *   Vercel        一個網址就能給人看，不必他自己架東西      ← 這一支
 *
 * ── 為什麼要另外開一個資料庫 ──
 * 站台上的實例躲在 Google 登入與成員白名單後面。Vercel 的部署是公開網址，
 * 任何拿到連結的人都能讀，而且照樣打得到寫入的 API。所以部署版用自己的一份
 * 資料庫（jv_<實例編號>_pub），從實例現況複製過去：公開的那份完全能用，
 * 但碰不到客戶真正的資料。重新部署就重新複製一次。
 *
 * ── 為什麼不是 vercel CLI 的整包上傳 ──
 * 用得到，但 CLI 會把整個目錄當專案、還會問互動式問題。這支自己組一個乾淨的
 * 暫存目錄再交給 CLI，內容完全可控——不會夾帶 var/、.env 或其他實例的東西。
 *
 *   node tools/instance-deploy-vercel.mjs --instance=<實例編號> [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { ROOT, EXIT, parseArgs, makeLogger } from "./lib/forge-common.mjs";
import * as control from "./lib/control-db.mjs";
import { q, ident, createDatabase, close } from "./lib/mysql.mjs";
import { describe } from "./lib/instance-db.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env"), "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch { return null; }
}

/* ── 公開版的資料庫 ────────────────────────────────────
   結構與資料都從實例那份複製。用 CREATE TABLE LIKE ＋ INSERT SELECT，
   不重新推導 schema——推導第二次的下場是兩邊的型別慢慢走散。 */
async function mirrorDatabase(from, to) {
  await createDatabase(to);
  const tables = await q(
    "SELECT TABLE_NAME t FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?", [from]);
  for (const { t } of tables) {
    /* 每次部署都從乾淨的狀態複製。留著舊資料的話，客戶在站台上刪掉的東西
       會繼續留在公開版上——那是他以為已經拿掉的資料。 */
    await q(`DROP TABLE IF EXISTS ${ident(to)}.${ident(t)}`);
    await q(`CREATE TABLE ${ident(to)}.${ident(t)} LIKE ${ident(from)}.${ident(t)}`);
    await q(`INSERT INTO ${ident(to)}.${ident(t)} SELECT * FROM ${ident(from)}.${ident(t)}`);
  }
  return tables.length;
}

/* ── 部署包 ────────────────────────────────────────────
   public/ 由 Vercel 的 CDN 直接送；資料 API 走一支 serverless function。
   路由用 vercel.json 的 rewrites 明確帶參數，不靠函式去猜原本的路徑——
   rewrite 之後 req.url 已經是改寫後的樣子，猜的那條路很容易靜靜地錯。 */
const VERCEL_JSON = {
  rewrites: [
    { source: "/_jv/schema", destination: "/api/data?schema=1" },
    { source: "/api/t/:table", destination: "/api/data?table=:table" },
    { source: "/api/t/:table/:id", destination: "/api/data?table=:table&id=:id" },
  ],
};

const PKG = {
  name: "jv-instance",
  private: true,
  type: "module",
  dependencies: { mysql2: "^3.11.0" },
};

const API = `/**
 * 這套系統的資料 API。三個路徑都被 vercel.json 導到這裡，參數走 query，
 * 不從 req.url 猜——rewrite 之後那個值已經是改寫後的樣子。
 *
 * 連線資訊全部走環境變數，程式碼裡沒有任何密碼。
 */
import * as data from "../lib/instance-db.mjs";

const DB = process.env.MYSQL_DB;

export default async function handler(req, res) {
  const send = (code, body) => {
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.status(code).send(JSON.stringify(body));
  };
  try {
    const { schema, table, id } = req.query || {};
    if (schema) return send(200, await data.describe(DB));
    if (!table || !/^[a-z][a-z0-9_]*$/.test(String(table))) return send(400, { error: "表名不正確" });

    /* 公開網址沒有登入，所以記不到是誰做的。寫成 public 而不是留空——
       日後看稽核表時，「這筆是從公開版來的」本身就是有用的資訊。 */
    const actor = "public";

    if (req.method === "GET" && !id) {
      return send(200, await data.list(DB, String(table), {
        limit: req.query.limit || 50, offset: req.query.offset || 0, q: req.query.q || "",
      }));
    }
    if (req.method === "POST" && !id) {
      return send(201, { row: await data.create(DB, String(table), req.body || {}, actor) });
    }
    if (req.method === "PATCH" && id) {
      const { rev, ...values } = req.body || {};
      if (rev == null) return send(400, { error: "缺少 rev（用來偵測同時編輯）" });
      const r = await data.update(DB, String(table), Number(id), values, rev, actor);
      if (!r.ok && r.reason === "conflict") return send(409, { error: "這筆資料已被其他人修改，請重新載入", current: r.current });
      if (!r.ok) return send(400, { error: r.reason });
      return send(200, { row: r.row });
    }
    if (req.method === "DELETE" && id) {
      const ok = await data.remove(DB, String(table), Number(id), actor);
      return send(ok ? 200 : 404, { ok });
    }
    return send(405, { error: "不支援這個方法" });
  } catch (error) {
    return send(error.status || 500, { error: error.message || "伺服器錯誤" });
  }
}
`;

function readme(inst, url) {
  return `# ${inst.display_name || inst.repo_name}

這是「${inst.repo_name}」的公開展示版，部署在 Vercel。

${url ? `網址：${url}\n` : ""}
## 它跟你在平台上那一套的差別

| | 平台上那一套 | 這個公開版 |
|---|---|---|
| 誰進得去 | 只有你的成員名單 | **任何拿到網址的人** |
| 資料庫 | \`${inst.db_name}\` | \`${inst.db_name}_pub\`（部署時複製的副本） |
| 改動 | 會同步 | **不會**回寫到你那一套 |

公開版動到的是副本，所以在上面新增或刪除都不會影響你真正的資料。
反過來也一樣：你在平台上改的東西，要重新部署一次才會出現在這裡。

## 重新部署

在工作台的「交付」分頁按一次「部署到 Vercel」，資料會重新複製一份。
`;
}

/* ── 主流程 ─────────────────────────────────────────── */
const instanceId = String(args.instance || "").trim();
if (!instanceId) { log.error("請指定 --instance=<實例編號>"); process.exit(EXIT.BAD_INPUT); }

const TOKEN = env("VERCEL_TOKEN");
if (!TOKEN) { log.error("找不到 VERCEL_TOKEN（放在 .env）"); process.exit(EXIT.BAD_INPUT); }

const inst = await control.getInstance(instanceId);
if (!inst) { log.error(`找不到實例 ${instanceId}`); await close(); process.exit(EXIT.BAD_INPUT); }

const pubDb = `${inst.db_name}_pub`;
/* Vercel 專案名只吃小寫英數與連字號，且有長度上限。 */
const project = `jv-${inst.repo_name.replace(/^jvision-/, "").replace(/[^a-z0-9-]/g, "-")}`
  .slice(0, 52).replace(/-+$/, "");

log.step(`部署 ${inst.repo_name}　專案 ${project}　公開資料庫 ${pubDb}`);

if (DRY) {
  const s = await describe(inst.db_name);
  log.info(`  將複製 ${s.tables.length} 張資料表到 ${pubDb}`);
  log.info(`  將上傳 public/ 與一支資料 API`);
  await close();
  process.exit(EXIT.OK);
}

const copied = await mirrorDatabase(inst.db_name, pubDb);
log.step(`資料庫已複製（${copied} 張表）`);

/* 組一個乾淨的暫存目錄再交給 CLI。直接把實例目錄丟給 vercel 的話，
   uploads/ 與 versions/ 那些東西也會跟著上傳。 */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jv-vercel-"));
try {
  fs.cpSync(path.join(inst.dir, "public"), path.join(tmp, "public"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "api"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "lib"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "api", "data.mjs"), API);
  fs.copyFileSync(path.join(ROOT, "tools", "templates", "deliver", "db.mjs"), path.join(tmp, "lib", "mysql.mjs"));
  fs.copyFileSync(path.join(ROOT, "tools", "lib", "instance-db.mjs"), path.join(tmp, "lib", "instance-db.mjs"));
  /* instance-db 匯入的是 ./mysql.mjs，交付樣板的 db.mjs 就是那一份的對應物。 */
  fs.writeFileSync(path.join(tmp, "vercel.json"), JSON.stringify(VERCEL_JSON, null, 2));
  fs.writeFileSync(path.join(tmp, "package.json"), JSON.stringify(PKG, null, 2));
  fs.writeFileSync(path.join(tmp, "README.md"), readme(inst, null));

  /* 每個 execFileSync 都要 encoding:"utf8"。少了它，失敗時 error.stdout／stderr
     是 Buffer，印出來是一整片位元組陣列——實測第一次跑就撞到，真正的訊息
     （「codebase isn't linked to a project」）完全被那片數字蓋住。 */
  const run = (a, input) => execFileSync("vercel", a, {
    cwd: tmp, encoding: "utf8", input,
    stdio: input === undefined ? "pipe" : ["pipe", "pipe", "pipe"],
    timeout: 10 * 60 * 1000,
  });
  const say = (e) => String(e.stdout || "") + String(e.stderr || "") + String(e.message || "");

  /* 先建立並連結專案。env add 與 deploy 都要求目錄已經連到某個專案，
     沒有這一步的話第一次部署一定失敗。--yes 用預設團隊與設定，不問問題。 */
  try {
    run(["link", "--project", project, "--token", TOKEN, "--yes"]);
  } catch (e) {
    log.error(`連結專案失敗：${say(e).slice(-300)}`);
    throw e;
  }

  /* 環境變數先設好再部署——部署當下讀不到連線資訊的話，
     第一次開啟會是 500，而那個錯誤看起來像程式壞了。 */
  for (const [k, v] of [
    ["MYSQL_HOST", env("MYSQL_HOST")], ["MYSQL_PORT", env("MYSQL_PORT")],
    ["MYSQL_USER", env("MYSQL_USER")], ["MYSQL_PASSWORD", env("MYSQL_PASSWORD")],
    ["MYSQL_DB", pubDb],
  ]) {
    if (!v) continue;
    try { run(["env", "rm", k, "production", "--token", TOKEN, "--yes"]); }
    catch { /* 本來就沒有這個變數 */ }
    try { run(["env", "add", k, "production", "--token", TOKEN], `${v}\n`); }
    catch (e) { log.warn(`  設定 ${k} 失敗：${say(e).slice(-160)}`); }
  }

  let out;
  try {
    out = run(["deploy", "--prod", "--token", TOKEN, "--yes"]);
  } catch (e) {
    log.error(`部署失敗：${say(e).slice(-400)}`);
    throw e;
  }

  /* 關掉 Vercel 的登入保護。新專案預設是 all_except_custom_domains，
     結果連專案擁有者自己打開網址都會被 302 到 vercel.com 的 SSO——
     那讓「一個網址就能給人看」這件事整個不成立。

     關掉是安全的，因為公開版跑的是複製出來的資料庫：任何人在上面做的事
     都碰不到客戶真正的資料（這一點實測過）。 */
  try {
    const r = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(project)}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ ssoProtection: null }),
    });
    if (!r.ok) log.warn(`  關閉登入保護失敗（${r.status}），網址可能會要求 Vercel 登入`);
  } catch (e) {
    log.warn(`  關閉登入保護失敗：${String(e.message).slice(0, 80)}`);
  }
  /* CLI 印的是這一次部署專屬的網址（含亂數），每部署一次就變一個。
     要給人看的是專案的正式網址，那個不會變——重新部署之後同一條連結
     仍然指向最新版。拿不到就退回 CLI 印的那個。 */
  let url = (String(out).match(/https:\/\/[^\s]+\.vercel\.app/g) || []).pop();
  try {
    const r = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(project)}`,
      { headers: { authorization: `Bearer ${TOKEN}` } });
    const j = await r.json();
    const alias = j?.targets?.production?.alias || [];
    /* 挑最短的那個——Vercel 會同時給 jv-x.vercel.app 與
       jv-x-<團隊雜湊>.vercel.app，前者才是給人看的。 */
    const best = alias.slice().sort((a, b) => a.length - b.length)[0];
    if (best) url = `https://${best}`;
  } catch { /* 取不到就用 CLI 印的那個 */ }
  log.step(`部署完成：${url || "(看不到網址，請查 vercel dashboard)"}`);

  await control.recordEvent({ kind: "instance.vercel_deployed", customerId: inst.customer_id,
    instanceId: inst.id, actor: null, detail: { url, project, db: pubDb, tables: copied } });
  if (url) console.log(url);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
  await close();
}
process.exit(EXIT.OK);
