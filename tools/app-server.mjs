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
import * as chat from "./lib/instance-chat.mjs";
import * as edit from "./lib/instance-edit.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: false });
const PORT = num(args.port, 4700);
const INSTANCES = path.join(ROOT, "var", "instances");

const json = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};

/* 上限預設 64KB；帶截圖的修改需求要放寬。不做成無上限：這支綁在本機，
   但本機上的其他程序打得到它，一個沒有上限的 body 就是一個記憶體開關。 */
const readBody = (req, limit = 65536) => new Promise((resolve) => {
  let raw = "";
  req.on("data", (c) => { raw += c; if (raw.length > limit) req.destroy(); });
  req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
});

/* 截圖存檔。只認影像、只認我們自己列出的副檔名——副檔名若由 base64 前綴
   直接決定，送個 image/svg+xml 進來就成了可執行內容。 */
const SHOT_EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
function saveShot(dir, dataUrl) {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (!buf.length || buf.length > 4 * 1024 * 1024) return null;
  const shots = path.join(dir, "uploads");
  fs.mkdirSync(shots, { recursive: true });
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${SHOT_EXT[m[1]]}`;
  fs.writeFileSync(path.join(shots, name), buf);
  return { name, bytes: buf.length };
}

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

    /* 改欄位顯示名稱。右下角的助理用得到——客戶最常提的修改就是
       「這個欄位在我們公司不叫這個名字」。 */
    if (p === "/_jv/columns" && req.method === "PATCH") {
      const b = await readBody(req);
      const c = await data.renameColumn(dbName, String(b.table || ""), String(b.key || ""), b.label, actor);
      return json(res, 200, { column: c });
    }

    /* 助理處理不了的修改，收下來排進待辦。寫進控制面的 events——
       那是既有的、會被後台看到的地方；只回一句「我們會處理」而不留下任何
       紀錄的話，客戶說了等於沒說。 */
    if (p === "/_jv/request" && req.method === "POST") {
      const b = await readBody(req, 6 * 1024 * 1024); // 截圖前端已縮過，6MB 綽綽有餘
      const text = String(b.text || "").trim().slice(0, 2000);
      if (!text) return json(res, 400, { error: "請先寫下你想改的地方" });
      /* 截圖存不進去不該讓整張需求單失敗——文字才是主體，圖是佐證。 */
      let shot = null;
      if (b.shot) { try { shot = saveShot(inst.dir, b.shot); } catch { shot = null; } }
      await control.recordEvent({ kind: "change.request", customerId: inst.customer_id,
        instanceId: inst.id, actor,
        detail: { text, repo: inst.repo_name, screen: String(b.screen || "").slice(0, 120) || null,
          shot: shot ? shot.name : null } });
      return json(res, 201, { ok: true, shot: Boolean(shot) });
    }

    /* 用講的改系統。LLM 只負責「把一句話翻成一個動作」，動作本身仍然走
       上面那幾支既有的 API——讓它直接碰資料庫的話，想錯一次就是客戶的資料出事。 */
    /* 改程式碼是背景工作（要好幾分鐘），前端靠這一路問「做完了沒」。 */
    if (p === "/_jv/job") {
      const j = editJobs.get(inst.id);
      if (!j) return json(res, 200, { state: "idle" });
      return json(res, 200, { state: j.state, reply: j.reply || null,
        seconds: Math.round((Date.now() - (j.startedAt || j.at)) / 1000) });
    }

    if (p === "/_jv/chat" && req.method === "POST") {
      const b = await readBody(req, 32768);
      const message = String(b.message || "").trim().slice(0, 500);
      if (!message) return json(res, 400, { error: "請說一下你想改什麼" });
      const schema = await data.describe(dbName);
      const d = await chat.decide(schema, message, Array.isArray(b.history) ? b.history : []);

      try {
        if (d.action === "add_column") {
          await data.addColumn(dbName, d.table, { key: d.key, label: d.label, type: d.type }, actor);
          return json(res, 200, { reply: d.reply, action: "add_column", changed: true });
        }
        if (d.action === "rename_column") {
          await data.renameColumn(dbName, d.table, d.key, d.label, actor);
          return json(res, 200, { reply: d.reply, action: "rename_column", changed: true });
        }
        if (d.action === "undo") {
          const ok = edit.undo(inst.dir);
          return json(res, 200, {
            reply: ok ? "已經還原成上一次修改前的樣子。" : "沒有可以還原的版本。",
            action: "undo", changed: ok });
        }
        if (d.action === "edit_page") {
          /* 改程式碼要好幾分鐘，不能讓請求掛在那裡等——瀏覽器會先逾時。
             開成背景工作，前端用 /_jv/job 問進度。 */
          const running = editJobs.get(inst.id);
          if (running && running.state === "running") {
            return json(res, 200, { reply: "上一個修改還在進行中，等它做完再說下一個。", action: "none", changed: false });
          }
          startEdit(inst, message);
          return json(res, 200, { reply: d.reply, action: "edit_page", job: true, changed: false });
        }
        if (d.action === "rename_system") {
          const ok = await renameSystem(inst, d.label);
          if (!ok) return json(res, 200, { reply: "我找不到畫面上原本的系統名稱，可能被改過了。你可以直接說「把畫面上的 ○○ 改成 ××」。", action: "none", changed: false });
          await control.renameInstance(inst.id, d.label);
          cache.delete(inst.id);   // 名稱換了，快取裡那份要作廢
          return json(res, 200, { reply: d.reply, action: "rename_system", changed: true });
        }
      } catch (error) {
        /* 動作本身失敗（欄位已存在、名稱不合法…）要照實說，不要回一句
           「已完成」——那會讓他以為改好了而不再追。 */
        return json(res, 200, { reply: `這個我做不到：${error.message}`, action: "none", changed: false });
      }

      /* 做不到的收成待辦，跟右下角助理的「其他修改」走同一條路。 */
      await control.recordEvent({ kind: "change.request", customerId: inst.customer_id,
        instanceId: inst.id, actor, detail: { text: message, repo: inst.repo_name, via: "chat" } });
      return json(res, 200, { reply: d.reply, action: "none", changed: false });
    }

    /* ── 實例的畫面檔 ─────────────────────────────────── */
    return serveStatic(res, path.join(inst.dir, "public"), p);
  } catch (error) {
    const code = error.status || 500;
    if (code >= 500) log.error(`${req.url}：${error.message}`);
    json(res, code, { error: code >= 500 ? "伺服器錯誤" : error.message });
  }
});

/* 正在進行的頁面修改。放記憶體：這是「現在做到哪」的狀態，服務重啟時那件事
   本來就沒做完，記在檔案裡反而會留下一個永遠 running 的假象。 */
const editJobs = new Map();

function startEdit(inst, instruction) {
  editJobs.set(inst.id, { state: "running", startedAt: Date.now(), instruction });
  edit.editPage(inst.dir, instruction)
    .then((r) => {
      editJobs.set(inst.id, r.ok
        ? { state: "done", at: Date.now(), reply: "改好了，畫面重新整理就會看到。" }
        : { state: "failed", at: Date.now(), reply: r.why });
      control.recordEvent({ kind: r.ok ? "instance.edited" : "instance.edit_failed",
        customerId: inst.customer_id, instanceId: inst.id, actor: null,
        detail: { instruction: String(instruction).slice(0, 300), why: r.why || null } }).catch(() => {});
    })
    .catch((e) => {
      editJobs.set(inst.id, { state: "failed", at: Date.now(), reply: `改的時候出錯了：${String(e.message).slice(0, 80)}` });
    });
}

/**
 * 改整套系統的名稱。
 *
 * 動的是這個客戶自己的那份 index.html——原始的 demo 是目錄展示品，永遠唯讀。
 * 只替換「原本那個標題字串」的完整比對，不做模糊處理：畫面上到處都是中文，
 * 模糊替換會改到不相干的字，而那種壞法客戶要用一陣子才會發現。
 */
function renameSystem(inst, label) {
  const file = path.join(inst.dir, "public", "index.html");
  if (!fs.existsSync(file)) return false;
  const html = fs.readFileSync(file, "utf8");
  /* 原本的名字：先用這個實例目前的名稱，沒有就用目錄上的標題。 */
  const old = inst.display_name || titleOf(inst.repo_name);
  if (!old || !html.includes(old)) return false;
  fs.writeFileSync(file, html.split(old).join(label));
  return true;
}

/* repo → 目錄上的標題。實例服務不該再去讀 1.4MB 的目錄索引，所以只讀一次留著。 */
let titles = null;
function titleOf(repoName) {
  if (!titles) {
    titles = new Map();
    try {
      const c = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "catalog-index.json"), "utf8"));
      for (const x of c.projects || []) if (x.repoName) titles.set(x.repoName, x.title);
    } catch { /* 讀不到就沒有原名可比對，改名會回 false 並請他講清楚 */ }
  }
  return titles.get(repoName) || null;
}

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
