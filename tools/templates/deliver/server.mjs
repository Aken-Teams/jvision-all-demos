#!/usr/bin/env node
/**
 * 這套系統的後端。
 *
 * 只做兩件事：把畫面檔送出去，以及提供畫面用得到的資料 API。
 * 第一次啟動會依 schema.json 建表並灌入範例資料；表已經存在就不動它，
 * 所以重啟不會洗掉你輸入的東西。
 *
 * 設定全部走環境變數，見 .env.example。
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import * as data from "./instance-db.mjs";
import { close } from "./db.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const PUBLIC = path.join(ROOT, "public");
const DB = process.env.MYSQL_DB || "app";

const json = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};

const readBody = (req, limit = 65536) => new Promise((resolve) => {
  let raw = "";
  req.on("data", (c) => { raw += c; if (raw.length > limit) req.destroy(); });
  req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
});

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };

function serveStatic(res, rel) {
  /* 路徑穿越防線：解析後必須仍在 public 底下。 */
  const abs = path.resolve(PUBLIC, "." + (rel || "/"));
  if (!abs.startsWith(PUBLIC)) return json(res, 403, { error: "forbidden" });
  const file = fs.existsSync(abs) && fs.statSync(abs).isDirectory() ? path.join(abs, "index.html") : abs;
  if (!fs.existsSync(file)) return json(res, 404, { error: "not found" });
  res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

/* 使用者身分：交付版預設不驗證，由你自己的登入機制或反向代理決定。
   代理有帶 X-Forwarded-User 的話就記到稽核紀錄裡。 */
const actorOf = (req) => String(req.headers["x-forwarded-user"] || "").slice(0, 190) || null;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    const p = url.pathname;
    const actor = actorOf(req);

    if (p === "/_health") return json(res, 200, { ok: true });
    if (p === "/_jv/schema") return json(res, 200, await data.describe(DB));

    const m = /^\/api\/t\/([a-z][a-z0-9_]*)(?:\/(\d+))?$/.exec(p);
    if (m) {
      const [, table, rowId] = m;
      if (req.method === "GET" && !rowId) {
        return json(res, 200, await data.list(DB, table, {
          limit: url.searchParams.get("limit") || 50,
          offset: url.searchParams.get("offset") || 0,
          q: url.searchParams.get("q") || "",
        }));
      }
      if (req.method === "POST" && !rowId) {
        return json(res, 201, { row: await data.create(DB, table, await readBody(req), actor) });
      }
      if (req.method === "PATCH" && rowId) {
        const { rev, ...values } = await readBody(req);
        if (rev == null) return json(res, 400, { error: "缺少 rev（用來偵測同時編輯）" });
        const r = await data.update(DB, table, Number(rowId), values, rev, actor);
        if (!r.ok && r.reason === "conflict") {
          return json(res, 409, { error: "這筆資料已被其他人修改，請重新載入", current: r.current });
        }
        if (!r.ok) return json(res, 400, { error: r.reason });
        return json(res, 200, { row: r.row });
      }
      if (req.method === "DELETE" && rowId) {
        const ok = await data.remove(DB, table, Number(rowId), actor);
        return json(res, ok ? 200 : 404, { ok });
      }
    }

    if (p === "/_jv/columns" && req.method === "POST") {
      const b = await readBody(req);
      return json(res, 201, { column: await data.addColumn(DB, String(b.table || ""), { key: b.key, label: b.label, type: b.type }, actor) });
    }
    if (p === "/_jv/columns" && req.method === "PATCH") {
      const b = await readBody(req);
      return json(res, 200, { column: await data.renameColumn(DB, String(b.table || ""), String(b.key || ""), b.label, actor) });
    }
    /* 站台版會把「其他修改」送回我們的後台；交付版沒有那個對象，
       所以只記在自己的稽核表裡，你可以自己查。 */
    if (p === "/_jv/request" && req.method === "POST") {
      const b = await readBody(req);
      const text = String(b.text || "").trim().slice(0, 2000);
      if (!text) return json(res, 400, { error: "請先寫下你想改的地方" });
      console.log(`[修改需求] ${actor || "匿名"}：${text}`);
      return json(res, 201, { ok: true });
    }

    return serveStatic(res, p);
  } catch (error) {
    const code = error.status || 500;
    if (code >= 500) console.error(`${req.url}：${error.message}`);
    json(res, code, { error: code >= 500 ? "伺服器錯誤" : error.message });
  }
});

async function boot() {
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "schema.json"), "utf8"));
  /* 建表是冪等的：已經有的表不會被動到，所以重啟不會洗掉資料。 */
  await data.createFromSchema(DB, schema, { seed: process.env.SEED !== "0" });
  server.listen(PORT, () => console.log(`系統已啟動：http://localhost:${PORT}`));
}

boot().catch((error) => {
  console.error("啟動失敗：", error.message);
  console.error("多半是資料庫還沒起來或連線設定不對，檢查 .env 後再試。");
  close().finally(() => process.exit(1));
});

for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => server.close(() => close().finally(() => process.exit(0))));
}
