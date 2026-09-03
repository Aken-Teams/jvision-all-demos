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
import * as head from "./lib/instance-head.mjs";
import * as outline from "./lib/page-outline.mjs";
import * as refs from "./lib/instance-refs.mjs";
import * as files from "./lib/instance-files.mjs";
import * as shots from "./lib/shots.mjs";
import * as versions from "./lib/instance-versions.mjs";
import * as grow from "./lib/instance-grow.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: false });
const PORT = num(args.port, 4700);
const INSTANCES = path.join(ROOT, "var", "instances");
/* 型錄站的網址。客戶的系統在自己的子網域上，要連回工作台就需要知道它。
   做成環境變數是為了本機開發，正式環境用預設值即可。 */
const SITE = process.env.JV_SITE_ORIGIN || "https://jvdemo.jvision-ai.com";

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
      /* 順便帶上實例編號與型錄站網址。客戶在自己的子網域上時，右下角的助理
         要能把他送到工作台，而子網域的網址裡沒有實例編號可以推。 */
      const sc = await data.describe(dbName);
      /* 帶上資料庫名。使用者要自己連進去看、或接自己的工具時，第一個問題就是
         「我的資料庫叫什麼」——那個名字是從實例編號推出來的（去掉底線再加
         jv_ 前綴），猜不出來，而以前畫面上任何地方都沒寫。 */
      return json(res, 200, {
        ...sc, tables: nameTables(inst, sc.tables),
        instanceId: inst.id, dbName, site: SITE,
      });
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
      const c = await addColumnSynced(inst, dbName, String(b.table || ""),
        { key: b.key, label: b.label, type: b.type }, actor);
      return json(res, 201, { column: c.column, headerSynced: c.headerSynced });
    }

    /* 改欄位顯示名稱。右下角的助理用得到——客戶最常提的修改就是
       「這個欄位在我們公司不叫這個名字」。 */
    if (p === "/_jv/columns" && req.method === "PATCH") {
      const b = await readBody(req);
      const c = await renameColumnSynced(inst, dbName, String(b.table || ""),
        String(b.key || ""), b.label, actor);
      return json(res, 200, { column: c.column, headerSynced: c.headerSynced });
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

    /* 這個實例由哪些檔案組成。「程式碼」那一頁以前只抓 index.html 一個檔，
       看起來像「這套系統就是一個 HTML」——旁邊的執行時、助理、資料表定義
       全都看不到，使用者也就不知道能改什麼、不能改什麼。 */
    if (p === "/_jv/files" && req.method === "GET") {
      return json(res, 200, { files: files.list(inst.dir) });
    }
    if (p === "/_jv/file" && req.method === "GET") {
      const rel = new URL(req.url, "http://x").searchParams.get("path") || "";
      const f = files.read(inst.dir, rel);
      if (!f) return json(res, 404, { error: "讀不到這個檔案" });
      return json(res, 200, f);
    }

    /* 對話裡貼過的截圖。檔案一直都存著（uploads/），檔名也一直記在
       chat_messages.shot 裡——只是以前沒有地方讀得回來，於是重新整理之後
       那張圖就從對話裡消失了，看起來像沒存到。

       檔名是外部輸入，所以交給 shots.shotPath() 驗：格式白名單之外，
       還要確認組出來的路徑真的落在 uploads/ 底下。 */
    {
      const m = /^\/_jv\/shots\/([^/]+)$/.exec(p);
      if (m && req.method === "GET") {
        const file = shots.shotPath(path.join(inst.dir, "uploads"), decodeURIComponent(m[1]));
        if (!file) return json(res, 404, { error: "找不到這張圖" });
        /* 檔名帶亂數且永不重複，所以可以放心長快取。private：這是客戶的畫面。 */
        res.writeHead(200, {
          "content-type": shots.MIME[path.extname(file).slice(1)] || "application/octet-stream",
          "cache-control": "private, max-age=86400",
        });
        return fs.createReadStream(file).pipe(res);
      }
    }

    /* 客戶自己丟進來的參考資料（規劃文件、資料樣本）。修改助理會拿它當依據，
       所以欄位名稱、用語、流程都會照著他公司實際的樣子走，而不是我們模板的假資料。 */
    if (p === "/_jv/refs") {
      if (req.method === "GET") return json(res, 200, { refs: refs.list(inst.dir), maxBytes: refs.MAX_BYTES });
      if (req.method === "POST") {
        /* 上限抓單檔的兩倍：JSON 字串化之後會膨脹，卡在這裡的話錯誤訊息會變成
           「請求太大」而不是「檔案太大」，使用者不知道該怎麼辦。 */
        const b = await readBody(req, refs.MAX_BYTES * 2 + 4096);
        const r = refs.save(inst.dir, b.name, b.text);
        if (!r.ok) return json(res, 400, { error: r.why });
        await control.recordEvent({ kind: "instance.ref_added", customerId: inst.customer_id,
          instanceId: inst.id, actor, detail: { name: r.name, bytes: r.bytes } }).catch(() => {});
        return json(res, 201, { ref: r, refs: refs.list(inst.dir) });
      }
      if (req.method === "DELETE") {
        const name = new URL(req.url, "http://x").searchParams.get("name") || "";
        return json(res, refs.remove(inst.dir, name) ? 200 : 404, { refs: refs.list(inst.dir) });
      }
    }

    /* 用講的改系統。LLM 只負責「把一句話翻成一個動作」，動作本身仍然走
       上面那幾支既有的 API——讓它直接碰資料庫的話，想錯一次就是客戶的資料出事。 */
    /* 改程式碼是背景工作（要好幾分鐘），前端靠這一路問「做完了沒」。 */
    if (p === "/_jv/job") {
      const j = editJobs.get(inst.id);
      if (!j) return json(res, 200, { state: "idle" });
      return json(res, 200, {
        state: j.state, reply: j.reply || null,
        /* 做完之後秒數要定格。不定格的話它會一直往上加，而使用者回頭點開
           那張收合的卡時看到的就不是「這次花了多久」，是「從那時候到現在」。
           舊版還更糟：完成時換掉整個 job 物件、把 startedAt 丟了，
           於是算出來是「從完成到現在」＝永遠 0～1 秒。 */
        seconds: j.totalSec != null ? j.totalSec
          : Math.round((Date.now() - (j.startedAt || j.at)) / 1000),
        /* 正在跑的那一關要回即時秒數，做完的回定格的。前端不該自己算——
           它只知道自己第一次看到那一關是什麼時候，那不是真正的起點。 */
        stages: j.stages.map((x) => ({
          ...x,
          sec: x.s === "doing" && x.at ? Math.round((Date.now() - x.at) / 1000) : (x.sec ?? null),
        })),
        plan: j.plan, checks: j.checks, highlights: j.highlights || null,
        /* 只回最後幾行。整段歷程對「現在在做什麼」沒有幫助，而且這一路
           每 1.5 秒被打一次。超過 45 秒沒有新訊息的就不回了——寧可讓前端說
           「還在改」，也不要掛著一句三分鐘前的話假裝是現在。 */
        log: j.log.filter((x) => Date.now() - x.at < 45000).slice(-4).map((x) => x.t),
      });
    }

    /* 這套系統的幾次對話。v0 側欄那個「專案 → 這個專案的幾次 Chat」的形狀。 */
    if (p === "/_jv/sessions") {
      if (req.method === "GET") return json(res, 200, { sessions: await control.listSessions(inst.id) });
      if (req.method === "POST") return json(res, 201, { session: await control.createSession(inst.id) });
    }
    {
      const m = /^\/_jv\/sessions\/([a-z0-9_]+)$/.exec(p);
      if (m && req.method === "GET") {
        /* 這次對話必須屬於這個實例。前端傳什麼編號都不該跨到別人的系統上。 */
        if (!await control.sessionInInstance(m[1], inst.id)) return json(res, 404, { error: "找不到這次對話" });
        return json(res, 200, { messages: await control.listMessages(m[1]) });
      }
    }

    /* 版本。每一次成功的修改都留一份，隨時回得去。 */
    if (p === "/_jv/versions" && req.method === "GET") {
      return json(res, 200, { versions: versions.list(inst.dir).slice().reverse() });
    }
    {
      /* 先看看那一版長什麼樣，再決定要不要還原。直接吐那一版的 HTML——
         它本來就在這個實例的網域上跑過，沒有比現在多開任何東西。 */
      const m = /^\/_jv\/versions\/([a-z0-9-]+)\/html$/.exec(p);
      if (m && req.method === "GET") {
        const body = versions.read(inst.dir, m[1]);
        if (body == null) return json(res, 404, { error: "找不到這個版本" });
        /* 注入 <base>。這一版是從 /_jv/versions/<id>/html 吐出來的，而裡面的
           相對路徑寫的是 ./_jv/live.js——不改基準的話那些會被解析成
           /_jv/versions/<id>/_jv/live.js 而全部 404，看到的是一個沒有樣式、
           沒有資料的殘骸，而使用者以為那就是那一版的樣子。 */
        const based = body.replace(/<head(\s[^>]*)?>/i,
          (t) => `${t}<base href="/-/i/${inst.id}/">`);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        return res.end(based);
      }
    }
    if (p === "/_jv/versions/restore" && req.method === "POST") {
      const b = await readBody(req);
      const r = versions.restore(inst.dir, String(b.id || "").slice(0, 40));
      if (!r.ok) return json(res, 400, { error: r.why });
      /* 畫面退回去了，資料庫記的系統名稱也要跟著退——不然清單上顯示的名字
         跟畫面上寫的會是兩回事。 */
      if (r.displayName !== undefined) {
        await control.renameInstance(inst.id, r.displayName);
        cache.delete(inst.id);
      }
      await control.recordEvent({ kind: "instance.reverted", customerId: inst.customer_id,
        instanceId: inst.id, actor, detail: { to: String(b.id).slice(0, 40) } });
      /* 還原也要留在對話裡。以前只有畫面上閃一行，重新整理就沒了——而「這套
         系統為什麼變成現在這樣」少了這一步就對不起來：中間明明退回去過一次，
         紀錄上卻只看得到一路往前的修改。

         版次與說明由前端給：它手上有完整的版本清單，後端這裡只認得 id。
         第一行是標題、第二行是說明，跟做法紀錄同一個約定。 */
      const label = String(b.label || "").slice(0, 20);
      const note = String(b.note || "").slice(0, 200);
      const sid = String(b.sessionId || "").slice(0, 40);
      if (sid && await control.sessionInInstance(sid, inst.id)) {
        control.addMessage({ sessionId: sid, role: "assistant",
          text: "已經回到 " + (label || "先前那一版") + (note ? "\n" + note : ""),
          action: "restore", actor }).catch(() => {});
      }
      return json(res, 200, { ok: true });
    }

    if (p === "/_jv/chat" && req.method === "POST") {
      /* 帶截圖時 body 會大很多，前端已經縮到最寬 1400px。 */
      const b = await readBody(req, 6 * 1024 * 1024);
      const message = String(b.message || "").trim().slice(0, 500);
      if (!message) return json(res, 400, { error: "請說一下你想改什麼" });

      /* 截圖只存一次。原本是在 edit_page 那一支裡才存，但現在使用者說的每一句
         都要落地，圖也要跟著那句話留下來——存兩次會在 uploads 裡留下孤兒檔。 */
      let shotName = null;
      let shotPath = null;
      if (b.shot) {
        try {
          const saved = shots.saveShot(path.join(inst.dir, "uploads"), b.shot);
          if (saved) { shotName = saved.name; shotPath = path.join(inst.dir, "uploads", saved.name); }
        } catch { /* 存不進去就純用文字，不要因為圖而整件事做不成 */ }
      }

      /* 對話要留得住。原本只存在前端一個陣列裡，關掉視窗就沒了——
         而那些話正是「這套系統為什麼變成現在這樣」的唯一紀錄。
         落地失敗一律降級成「這次不記」：記不下來不該讓他連話都說不了。 */
      let sessionId = null;
      try {
        const want = String(b.sessionId || "").slice(0, 40);
        if (want && await control.sessionInInstance(want, inst.id)) sessionId = want;
        if (!sessionId) sessionId = (await control.createSession(inst.id)).id;
        await control.addMessage({ sessionId, role: "user", text: message, actor, shot: shotName });
      } catch { sessionId = null; }

      /* 每一條回覆都要走這裡才會被記下來。原本有七個 return，
         逐一補一次寫入必然會漏掉其中一兩個。 */
      const done = async (payload) => {
        if (sessionId) {
          try {
            await control.addMessage({ sessionId, role: "assistant", text: payload.reply,
              action: payload.action || null, versionId: payload.versionId || null });
          } catch { /* 記不下來不影響他已經拿到的結果 */ }
        }
        return json(res, 200, { ...payload, sessionId });
      };

      const schema = await data.describe(dbName);
      /* 有沒有附圖要傳給分類器。它看不到圖，但知道「有圖」就足以把
         「照這樣改」這種含糊的話路由到 edit_page——真正看圖做事的是
         下一步的 codex，那一段本來就收得到圖。 */
      /* 把「畫面現在長什麼樣」一起給它。沒有這一份的話它只看得到資料表清單，
         於是任何跟版面、其他畫面、窄螢幕有關的判斷都不可能發生——
         那正是「只加了一欄，其他都沒顧到」的來源。
         讀不到就照舊只給資料表：少一份資訊比整句話回不出來好。 */
      let pageText = null;
      try {
        pageText = outline.describe(fs.readFileSync(path.join(inst.dir, "public", "index.html"), "utf8"));
      } catch { /* 讀不到就不給 */ }
      /* 只給檔名。內容有時好幾十 KB，而這一步只需要知道「有這些東西可以參考」
         ——真正要讀內容的是下一步的 codex，那邊本來就會拿到全文。 */
      const d = await chat.decide(schema, message, Array.isArray(b.history) ? b.history : [],
        Boolean(shotPath), pageText, refs.list(inst.dir).map((x) => x.name));

      try {
        if (d.action === "add_column") {
          const r = await addColumnSynced(inst, dbName, d.table,
            { key: d.key, label: d.label, type: d.type }, actor);
          return done({ reply: d.reply + headerNote(r), action: "add_column", changed: true });
        }
        if (d.action === "rename_column") {
          const r = await renameColumnSynced(inst, dbName, d.table, d.key, d.label, actor);
          return done({ reply: d.reply + headerNote(r), action: "rename_column", changed: true });
        }
        if (d.action === "undo") {
          const ok = edit.undo(inst.dir);
          return done({
            reply: ok ? "已經還原成上一版了。" : "沒有可以還原的版本。",
            action: "undo", changed: ok });
        }
        if (d.action === "edit_page") {
          /* 右下角那個小視窗不做程式修改，改請他去工作台。
             不是做不到（下面那段就是），而是在一個 400px 的浮動視窗裡等三分鐘、
             改完只能靠重新整理去猜哪裡變了，體驗是壞的；工作台左邊講話、
             右邊當場重載，同一件事在那裡才成立。把他要說的話一起帶過去，
             到了那邊按送出就好，不必再打一次。 */
          if (b.from === "assist") {
            return done({ action: "handoff", changed: false,
              reply: "這種修改要動到程式與畫面，在工作台做比較好——那裡左邊講話、右邊當場看到結果。我把你剛才說的帶過去。",
              url: `${SITE}/workspace.html?i=${encodeURIComponent(inst.id)}&q=${encodeURIComponent(message)}` });
          }
          /* 改程式碼要好幾分鐘，不能讓請求掛在那裡等——瀏覽器會先逾時。
             開成背景工作，前端用 /_jv/job 問進度。 */
          const running = editJobs.get(inst.id);
          if (running && running.state === "running") {
            return done({ reply: "上一個修改還在進行中，等它做完再說下一個。", action: "none", changed: false });
          }
          startEdit(inst, message, shotPath, sessionId);
          /* 這一則只是「我要開始改了」，還沒有任何東西被改。標成 edit_page 的話，
             重新整理之後它會被當成「已完成」而畫成綠色——同一句話當下是白的、
             回頭看變綠的，看起來像事後被改過。 */
          return done({ reply: d.reply, action: "edit_started", job: true, changed: false });
        }
        if (d.action === "rename_system") {
          const r = renameSystem(inst, d.label);
          if (!r) return done({ reply: "我找不到畫面上原本的系統名稱，可能被改過了。你可以直接說「把畫面上的 ○○ 改成 ××」。", action: "none", changed: false });
          await control.renameInstance(inst.id, d.label);
          cache.delete(inst.id);   // 名稱換了，快取裡那份要作廢
          /* 只換到瀏覽器分頁標題時要照實說。原本一律回模型那句
             「畫面最上方的標題會直接更新」，但畫面上根本沒變——
             他會盯著沒變的畫面以為系統壞了。 */
          return done({
            reply: r.visible ? d.reply
              : `已經改成「${d.label}」了，不過畫面上那個標題的字跟目錄上的不完全一樣，所以只換到了瀏覽器分頁的名稱。你可以直接說「把畫面上的 ○○ 改成 ${d.label}」，我就能連畫面一起改。`,
            action: "rename_system", changed: true });
        }
      } catch (error) {
        /* 動作本身失敗（欄位已存在、名稱不合法…）要照實說，不要回一句
           「已完成」——那會讓他以為改好了而不再追。 */
        return done({ reply: `這個我做不到：${error.message}`, action: "none", changed: false });
      }

      /* 做不到的收成待辦，跟右下角助理的「其他修改」走同一條路。 */
      await control.recordEvent({ kind: "change.request", customerId: inst.customer_id,
        instanceId: inst.id, actor, detail: { text: message, repo: inst.repo_name, via: "chat" } });
      return done({ reply: d.reply, action: "none", changed: false });
    }

    /* ── 實例的畫面檔 ─────────────────────────────────── */
    return serveStatic(res, path.join(inst.dir, "public"), p);
  } catch (error) {
    const code = error.status || 500;
    if (code >= 500) log.error(`${req.url}：${error.message}`);
    json(res, code, { error: code >= 500 ? "伺服器錯誤" : error.message });
  }
});

/**
 * 給資料表一個看得懂的名字。
 *
 * 資料表在資料庫裡叫 table_1、table_2——那是產線生成的，沒有人看得懂。
 * 前端以前的做法是「把前三個欄位名串起來」當標題，於是下拉選單長成
 * 「承辦人·文件與正本序號·印章組合（6）」，看起來像一句話而不是一個名字。
 *
 * 實例裡的 public/_jv/schema.json 記著每張表是**從哪一個畫面掃出來的**
 * （screen: 5），而那個畫面在頁面上有 aria-label（「事後稽核」）。
 * 兩邊兜起來，table_1 就叫得出「事後稽核」。
 *
 * 兜不起來就退回「資料表 N」——那至少是一個名字，而不是一串欄位。
 */
function nameTables(inst, tables) {
  let screens = [];
  let byName = {};
  try {
    const sc = JSON.parse(fs.readFileSync(path.join(inst.dir, "public", "_jv", "schema.json"), "utf8"));
    for (const t of sc.tables || []) byName[t.name] = t;
  } catch { /* 沒有這份檔就只給編號 */ }
  try {
    screens = outline.outline(fs.readFileSync(path.join(inst.dir, "public", "index.html"), "utf8")).screens;
  } catch { /* 讀不到畫面名稱就只給編號 */ }

  const used = {};
  return (tables || []).map((t, i) => {
    const meta = byName[t.name];
    let title = null;
    if (meta && typeof meta.screen === "number" && screens[meta.screen]) title = screens[meta.screen];
    if (!title) title = `資料表 ${i + 1}`;
    /* 同一個畫面上有兩張表的話，名字會撞。加序號而不是讓兩項長得一樣——
       下拉選單裡兩個一模一樣的選項，選了也不知道自己選到哪一個。 */
    used[title] = (used[title] || 0) + 1;
    if (used[title] > 1) title = `${title} ${used[title]}`;
    return { ...t, title };
  });
}

/* ── 欄位動作要連畫面一起改 ──────────────────────────
   jv-live 認表格的方式是「拿資料庫的 label 去比對畫面上 <th> 的文字」，
   所以只改資料庫會讓兩邊對不上，整張表從原生接管掉回退路面板，
   而助理還回一句「好的，已改好」——那是最糟的失敗：他要用一陣子才發現。

   labelsBefore 必須在動資料庫**之前**取。那份順序就是畫面上現在的樣子，
   也是 findTable 比對的依據；動完再取就對不回去了。 */
async function labelsOf(dbName, table) {
  const s = await data.describe(dbName);
  const t = (s.tables || []).find((x) => x.name === table);
  return t ? t.columns.map((c) => c.label) : [];
}

/* 畫面沒同步到不算失敗——有些表本來就不是用 <table> 呈現的（表單、卡片），
   那種情況沒有表頭要改。但要照實說，不能讓他以為畫面也跟著變了。 */
function headerNote(r) {
  if (r.headerSynced !== false) return "";
  return "\n\n（這張表在畫面上不是用表格呈現的，所以只有資料層加好了；"
    + "要畫面上也看得到，跟我說「把它顯示在畫面上」。）";
}

async function addColumnSynced(inst, dbName, table, spec, actor) {
  const before = await labelsOf(dbName, table);
  const column = await data.addColumn(dbName, table, spec, actor);
  const sync = head.addHeader(inst.dir, before, column.label);
  return { column, headerSynced: sync.ok };
}

async function renameColumnSynced(inst, dbName, table, key, label, actor) {
  const before = await labelsOf(dbName, table);
  const old = (await data.describe(dbName)).tables
    .find((x) => x.name === table)?.columns.find((c) => c.key === key);
  const column = await data.renameColumn(dbName, table, key, label, actor);
  const sync = old ? head.renameHeader(inst.dir, before, old.label, column.label)
    : { ok: false };
  return { column, headerSynced: sync.ok };
}

/* 正在進行的頁面修改。放記憶體：這是「現在做到哪」的狀態，服務重啟時那件事
   本來就沒做完，記在檔案裡反而會留下一個永遠 running 的假象。 */
const editJobs = new Map();

/**
 * 把這次修改的過程寫成一則留得住的訊息。
 *
 * 以前對話裡只剩頭尾兩句：「我來改」與「改好了」。中間那份計畫、做了哪幾步、
 * 檢查過什麼，重新整理就沒了——而那正是「這套系統為什麼變成現在這樣」
 * 最有價值的一段。
 *
 * 存成 Markdown 而不是結構化資料：對話的渲染本來就吃 Markdown，
 * 多一種格式就要多一條渲染路徑，而這段內容不需要互動。
 *
 * **第一行是摘要，後面才是內容。** 前端靠這個切成可收合的卡片：
 * 收起來只剩那一行，點開才是全文。這一段攤在對話裡會把後面的話全推下去，
 * 而它是「回頭查」用的，不是每次都要讀的。
 */
function processNote(job) {
  const L = [];
  const secOf = (id) => {
    const x = job.stages.find((y) => y.id === id);
    return x && x.sec != null ? x.sec : null;
  };
  const steps = (job.plan && job.plan.steps) || [];
  const okSteps = steps.filter((x) => x.s === "ok").length;
  const okChecks = (job.checks || []).filter((c) => c.s === "ok").length;
  const total = job.totalSec != null ? job.totalSec : null;

  /* 第一行＝收合時看到的那一行。 */
  L.push([
    steps.length ? `做了 ${okSteps} 件事` : null,
    okChecks ? `${okChecks} 項檢查通過` : null,
    total != null ? `${total} 秒` : null,
  ].filter(Boolean).join(" · ") || "這次的做法");

  /* 底下這一段要能被前端**還原成跟進行中那張卡一模一樣的東西**：階段、各段
     秒數、編號步驟、風險、檢查。以前只存「已完成 ＋ 條列」，於是重新整理之後
     看到的跟當下看到的長得像兩個不同的系統。

     同時要保證直接讀原文也看得懂——這段內容後台看得到、也可能被匯出。
     所以階段用 Markdown 的二級標題、步驟用「編號 標題 — 狀態」，
     而不是自創符號。前端認不出格式時會退回一般的 Markdown 渲染。 */
  const stageLine = (id) => {
    const x = job.stages.find((y) => y.id === id);
    if (!x) return;
    const tail = [x.sec != null ? `${x.sec} 秒` : null, x.note || null].filter(Boolean).join("　");
    L.push("", `## ${x.t}${tail ? ` — ${tail}` : ""}`);
  };

  stageLine("plan");
  if (job.plan) {
    if (job.plan.understanding) L.push(job.plan.understanding);
    (job.plan.steps || []).forEach((st, i) => {
      const mark = st.s === "ok" ? "已完成" : st.s === "skip" ? "沒做" : "不確定";
      L.push(`${i + 1}. ${st.title} — ${mark}${st.note ? `（${st.note}）` : ""}`);
      if (st.why) L.push(`   ${st.why}`);
    });
    for (const r of job.plan.risks || []) L.push(`注意：${r}`);
  }

  stageLine("edit");
  stageLine("check");
  const ok = (job.checks || []).filter((c) => c.s === "ok");
  const bad = (job.checks || []).filter((c) => c.s !== "ok");
  if (ok.length) L.push(`檢查：${ok.map((c) => c.t).join("、")}`);
  if (bad.length) L.push(`沒過：${bad.map((c) => c.t).join("、")}`);
  stageLine("grow");

  return L.join("\n");
}

/* 一次修改的四個階段。固定寫在這裡而不是讓 editPage 自己長出來：
   使用者一按下去就要看到「總共會經過哪幾關」，而不是一關一關冒出來——
   看得到全貌才知道現在走到哪、還剩多少。 */
const STAGES = [
  { id: "plan", t: "看懂現在的畫面，想一份做法" },
  { id: "edit", t: "動手改" },
  { id: "check", t: "檢查沒有改壞" },
  { id: "grow", t: "把新表格的資料層補上" },
];

function startEdit(inst, instruction, imagePath, sessionId) {
  const startedAt = Date.now();
  const job = {
    state: "running", startedAt, instruction,
    stages: STAGES.map((x) => ({ ...x, s: "todo" })),
    plan: null, checks: [], log: [],
  };
  editJobs.set(inst.id, job);

  /* 每一關各自計時。只有一個總秒數的話，使用者看不出「是在想很久還是改很久」
     ——而那正是他判斷「要不要把要求說小一點」的依據。 */
  const setStage = (id, st, note) => {
    const x = job.stages.find((y) => y.id === id);
    if (!x) return;
    if (st === "doing") x.at = Date.now();
    else if (x.at) x.sec = Math.round((Date.now() - x.at) / 1000);
    x.s = st;
    if (note) x.note = note;
  };
  const onProgress = (e) => {
    if (e.k === "stage") setStage(e.id, e.s, e.note);
    else if (e.k === "plan") job.plan = { understanding: e.understanding, steps: e.steps, risks: e.risks };
    else if (e.k === "check") job.checks.push({ id: e.id, t: e.t, s: e.s });
    /* 模型回報「計畫的哪幾步真的做完了」。蓋回計畫上而不是另外列一份：
       使用者要看的是同一份清單前後的狀態，不是兩份看起來很像的清單。 */
    else if (e.k === "steps" && job.plan) job.plan.steps = e.steps;
    /* log 只留最後 40 行。這是「現在在想什麼」，不是稽核紀錄；
       一次修改可能吐上千行，留著只是把記憶體吃掉。 */
    /* 帶上時間。推理事件很稀疏——實測一次大改動在第 73 秒之後直到第 284 秒
       都沒有再送過任何一則。不記時間的話，那三分半鐘畫面上會一直掛著同一句
       話，看起來像卡住了。 */
    else if (e.k === "log") {
      job.log.push({ t: e.line, at: Date.now() });
      if (job.log.length > 40) job.log.shift();
    }
  };

  edit.editPage(inst.dir, instruction,
    { imagePath, displayName: inst.display_name || null, onProgress })
    .then(async (r) => {
      /* 畫面加了新表格的話，資料層要跟上。沒有這一步的話，新表格在 schema 裡
         不存在，jv-live 不會綁它——畫面上看起來多了一張表、輸入的東西卻存不住，
         那比直接失敗更糟：使用者要用一陣子才發現，而且不會知道是哪一步的問題。

         建表失敗不可以讓整次修改失敗：畫面已經改好也記了版本，
         這一項沒做成就照實說。 */
      let grown = "";
      if (r.ok) {
        setStage("grow", "doing");
        try {
          const g = await grow.growTables(inst.db_name, r.before, r.after);
          if (g.added.length) {
            grown = `　另外替新的${g.added.map((t) => `「${t.columns.slice(0, 3).join("、")}…」`).join("")}建好了資料表，那張表存得住東西。`;
          }
          setStage("grow", "ok", g.added.length ? `建好 ${g.added.length} 張新表` : "沒有新表格要建");
        } catch (e) {
          grown = "　不過新加的那張表目前還存不住資料，我們會處理。";
          setStage("grow", "fail", "新表格還存不住資料");
          control.recordEvent({ kind: "instance.grow_failed", customerId: inst.customer_id,
            instanceId: inst.id, actor: null,
            detail: { why: String(e.message).slice(0, 200) } }).catch(() => {});
        }
      }
      /* 成功時通常一句話都不用說。
         「改好了」那張綠色泡泡在做的事，旁邊三樣東西已經各做過一次了：
         做法紀錄那張卡收合成一行、預覽自己重載並把改動圈起來、階段全部打勾。
         而「畫面重新整理就會看到」更是錯的——預覽本來就自己重載了。
         只有真的多出一句話要講（新表格建好了，或是建不起來）才回內容。 */
      const okMsg = String(grown || "").trim();
      /* 就地改狀態，不要換掉整個物件——計畫、檢查清單、階段都要留著，
         使用者做完之後還會回頭看「它到底做了哪幾件事」。 */
      job.state = r.ok ? "done" : "failed";
      job.at = Date.now();
      job.totalSec = Math.round((Date.now() - startedAt) / 1000);
      /* 改完之後畫面上多了哪些字。前端拿它去預覽裡把那幾處圈出來——
         不然使用者只會看到「畫面突然多了東西」，而且不知道要找什麼。 */
      if (r.ok && r.highlights && r.highlights.length) job.highlights = r.highlights;
      job.reply = r.ok ? okMsg : r.why;
      if (!r.ok) job.stages.forEach((x) => { if (x.s === "todo" || x.s === "doing") x.s = "skip"; });
      /* 結果也要進對話。這件事要跑好幾分鐘，回覆是在請求早就結束之後才出現的
         ——不在這裡補記的話，對話裡就只剩「我來改」而永遠沒有下文。 */
      if (sessionId) {
        /* 過程先寫，結果後寫——順序就是它們發生的順序，重新整理之後
           讀起來才跟當下看到的一樣。 */
        if (job.plan || (job.checks || []).length) {
          control.addMessage({ sessionId, role: "assistant", text: processNote(job),
            action: "edit_process" }).catch(() => {});
        }
        /* 沒話可講就不要在對話裡留一則空的。失敗那則一定要留——那是唯一
           說得出「為什麼沒改成」的地方。 */
        const tail = r.ok ? okMsg : r.why;
        if (tail) {
          control.addMessage({ sessionId, role: "assistant", text: tail,
            action: r.ok ? "edit_page" : "edit_failed",
            versionId: r.versionId || null }).catch(() => {});
        }
      }
      /* how／applied 記下來才量得出「退回整份重寫」的比例。那個數字一直高的話，
         代表取代區塊的說明還沒寫對，而不是這條路走不通。 */
      control.recordEvent({ kind: r.ok ? "instance.edited" : "instance.edit_failed",
        customerId: inst.customer_id, instanceId: inst.id, actor: null,
        detail: { instruction: String(instruction).slice(0, 300), why: r.why || null,
          how: r.how || null, applied: r.applied || null,
          seconds: Math.round((Date.now() - startedAt) / 1000) } }).catch(() => {});
    })
    .catch((e) => {
      job.state = "failed";
      job.at = Date.now();
      job.totalSec = Math.round((Date.now() - startedAt) / 1000);
      job.reply = `改的時候出錯了：${String(e.message).slice(0, 80)}`;
      job.stages.forEach((x) => { if (x.s === "todo" || x.s === "doing") x.s = "skip"; });
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
  /* 改名也是動到 index.html，所以一樣要留版本。少了這一段，客戶改完名字
     說「還原」，退回去的會是更早以前那一版，而中間那次改名憑空消失。
     凡是寫這個檔的地方都要走版本，不能只有 instance-edit 記得。 */
  versions.ensureBaseline(inst.dir);
  fs.writeFileSync(file, html.split(old).join(label));
  versions.record(inst.dir, { note: `把系統名稱改成「${label}」`, action: "edit", displayName: label });
  /* 有沒有改到畫面上看得到的地方。目錄上的標題常常比畫面上的標題長
     （目錄寫「語音轉錄與智慧校對工作台」，畫面上的 h1 只有「語音轉錄與智慧校對」），
     那種情況下只有 <title> 會被換到——分頁名稱變了、畫面沒變，
     而助理照樣回一句「畫面最上方的標題會直接更新」。說了不實的話比沒改更糟。 */
  const visible = html.replace(/<title>[\s\S]*?<\/title>/i, "").includes(old);
  return { ok: true, visible };
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
