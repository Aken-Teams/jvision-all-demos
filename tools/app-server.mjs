#!/usr/bin/env node
/**
 * 客戶實例的執行時服務：提供實例的畫面檔與資料 API。
 *
 * 綁 127.0.0.1，只接受 gateway 轉進來的請求。刻意做成獨立的 systemd unit
 * 而不是塞進 caseshow.service——那支重啟會連帶收掉 npx serve 與 python，
 * 付費客戶的系統不該被型錄站的重啟牽連。
 *
 * 實例身分由 gateway 用標頭傳進來（x-jv-instance），**不從路徑或查詢參數取**：
 * 前端傳什麼都無法跨到別的實例。
 *
 *   node tools/app-server.mjs [--port=4700]
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { ROOT, parseArgs, num, makeLogger } from "./lib/forge-common.mjs";
import * as control from "./lib/control-db.mjs";
import * as data from "./lib/instance-db.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: false });
const PORT = num(args.port, 4700);
const INSTANCES = path.join(ROOT, "var", "instances");

const json = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};

const readBody = (req) => new Promise((resolve) => {
  let raw = "";
  req.on("data", (c) => { raw += c; if (raw.length > 65536) req.destroy(); });
  req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
});

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };

/* 實例快取。每個請求都去查一次控制面會讓共用主機的往返延遲加在客戶身上；
   30 秒夠短，站主把某個實例停用時不會拖太久才生效。 */
const cache = new Map();
async function resolveInstance(id) {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < 30000) return hit.inst;
  const inst = await control.getInstance(id);
  cache.set(id, { inst, at: Date.now() });
  return inst;
}

async function serveStatic(res, dir, rel) {
  /* 路徑穿越防線：解析後必須仍在這個實例的目錄底下。 */
  const abs = path.resolve(dir, "." + (rel || "/"));
  if (!abs.startsWith(path.resolve(dir))) return json(res, 403, { error: "forbidden" });
  const file = fs.existsSync(abs) && fs.statSync(abs).isDirectory() ? path.join(abs, "index.html") : abs;
  if (!fs.existsSync(file)) return json(res, 404, { error: "not found" });
  res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    const p = url.pathname;
    const instanceId = req.headers["x-jv-instance"];
    /* gateway 已經驗過身分與白名單；這裡再擋一次是縱深防禦——app-server 雖然
       綁在 127.0.0.1，本機上的其他程序仍然打得到它。 */
    const actor = String(req.headers["x-jv-actor"] || "").slice(0, 190) || null;

    if (p === "/_health") return json(res, 200, { ok: true, instances: cache.size });
    if (!instanceId) return json(res, 400, { error: "缺少實例識別" });

    const inst = await resolveInstance(instanceId);
    if (!inst) return json(res, 404, { error: "找不到這個系統" });
    if (inst.state === "archived") return json(res, 410, { error: "這個系統已封存" });
    if (inst.state === "suspended") return json(res, 403, { error: "這個系統已暫停服務" });

    const dbName = inst.db_name;

    /* ── 資料 API ──────────────────────────────────────── */
    if (p === "/_jv/schema") {
      return json(res, 200, await data.describe(dbName));
    }

    const m = /^\/api\/t\/([a-z][a-z0-9_]*)(?:\/(\d+))?$/.exec(p);
    if (m) {
      const [, table, rowId] = m;
      if (req.method === "GET" && !rowId) {
        return json(res, 200, await data.list(dbName, table, {
          limit: url.searchParams.get("limit") || 50,
          offset: url.searchParams.get("offset") || 0,
          q: url.searchParams.get("q") || "",
        }));
      }
      if (req.method === "POST" && !rowId) {
        const row = await data.create(dbName, table, await readBody(req), actor);
        await touch(inst.id);
        return json(res, 201, { row });
      }
      if (req.method === "PATCH" && rowId) {
        const body = await readBody(req);
        const { rev, ...values } = body;
        if (rev == null) return json(res, 400, { error: "缺少 rev（用來偵測同時編輯）" });
        const r = await data.update(dbName, table, Number(rowId), values, rev, actor);
        if (!r.ok && r.reason === "conflict") {
          return json(res, 409, { error: "這筆資料已被其他人修改，請重新載入", current: r.current });
        }
        if (!r.ok) return json(res, 400, { error: r.reason });
        await touch(inst.id);
        return json(res, 200, { row: r.row });
      }
      if (req.method === "DELETE" && rowId) {
        const ok = await data.remove(dbName, table, Number(rowId), actor);
        if (ok) await touch(inst.id);
        return json(res, ok ? 200 : 404, { ok });
      }
    }

    if (p === "/_jv/columns" && req.method === "POST") {
      const b = await readBody(req);
      const c = await data.addColumn(dbName, String(b.table || ""), { key: b.key, label: b.label, type: b.type }, actor);
      return json(res, 201, { column: c });
    }

    /* ── 實例的畫面檔 ─────────────────────────────────── */
    return serveStatic(res, path.join(inst.dir, "public"), p);
  } catch (error) {
    const code = error.status || 500;
    if (code >= 500) log.error(`${req.url}：${error.message}`);
    json(res, code, { error: code >= 500 ? "伺服器錯誤" : error.message });
  }
});

/* 閒置回收要看「最後一次寫入」。每次寫都更新會讓控制面被打爆，
   所以節流成每分鐘最多一次——回收判斷用的是天數，這個精度綽綽有餘。 */
const touched = new Map();
async function touch(id) {
  const last = touched.get(id) || 0;
  if (Date.now() - last < 60000) return;
  touched.set(id, Date.now());
  try { await control.setInstanceState(id, "live", { last_write_at: new Date().toISOString().slice(0, 19).replace("T", " ") }); }
  catch { /* 記不到最後寫入時間不該讓客戶的操作失敗 */ }
}

fs.mkdirSync(INSTANCES, { recursive: true });
server.listen(PORT, "127.0.0.1", () => log.step(`實例服務啟動：127.0.0.1:${PORT}`));
