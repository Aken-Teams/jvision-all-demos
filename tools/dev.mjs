// 一鍵啟動「前端靜態站 (:3000) + Agents 後端 (aiohttp :4610)」。
// 用法：npm run dev   （Ctrl+C 會一起關閉兩者）
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import * as usage from "./lib/usage-log.mjs";
import * as actions from "./lib/action-log.mjs";
import * as auth from "./lib/admin-auth.mjs";
import * as google from "./lib/google-auth.mjs";

// 對外只開一個 port（PUBLIC_PORT）。靜態站和 Agents 後端都只綁 127.0.0.1，
// 由下面的 gateway 依路徑分流。這樣區網只要放行 3000，不必再開第二個 port
// ——先前 4610 從別台機器連進來會 ERR_CONNECTION_TIMED_OUT，就是被中間網路擋掉。
const PUBLIC_PORT = Number(process.env.JV_PORT || 3000);
/* serve 綁不到指定的 port 時不會報錯，它會自己換一個然後照常啟動。gateway
   仍然代理到 3100，於是整站回 502 而 log 看起來一切正常——實測 3100 被上一個
   還沒收乾淨的程序占住時就是這樣，站台整整黑掉沒人知道原因。所以這裡不寫死，
   改成讀 serve 自己印出來的位址為準。 */
let STATIC_PORT = 3100;
const STATIC_PORT_WANTED = STATIC_PORT;
const BACKEND_PORT = 4610;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverDir = path.join(root, "jvision-agents-office", "server");
const isWin = process.platform === "win32";

// 找一個可用的 python（依序試 python / py / python3）
function pickPython() {
  const cands = isWin ? ["python", "py", "python3"] : ["python3", "python"];
  for (const c of cands) {
    try {
      const r = spawnSync(c, ["--version"], { shell: isWin, stdio: "ignore" });
      if (r.status === 0) return c;
    } catch { /* try next */ }
  }
  return cands[0];
}

const procs = [];
function pref(tag, buf) {
  return String(buf).split(/\r?\n/).filter(Boolean).map((l) => `${tag} ${l}`).join("\n") + "\n";
}
function run(name, cmd, args, cwd) {
  const tag = `[${name}]`;
  const p = spawn(cmd, args, { cwd, shell: isWin, env: process.env });
  p.stdout.on("data", (d) => { sniffStaticPort(name, d); process.stdout.write(pref(tag, d)); });
  p.stderr.on("data", (d) => process.stdout.write(pref(tag, d)));
  p.on("error", (e) => console.log(`${tag} 無法啟動：${e.message}`));
  p.on("exit", (code) => console.log(`${tag} 已結束（code ${code}）。若是後端 4610 已被占用，代表它可能已在執行。`));
  procs.push(p);
}
/* serve 啟動時會印「Accepting connections at http://localhost:NNNN」。
   那個 NNNN 才是它真正綁上的 port。 */
function sniffStaticPort(name, chunk) {
  if (name !== "frontend") return;
  const m = /Accepting connections at https?:\/\/[^:]+:(\d+)/.exec(String(chunk));
  if (!m) return;
  const actual = Number(m[1]);
  if (actual === STATIC_PORT) return;
  console.log(`[frontend] ⚠ 要的是 ${STATIC_PORT_WANTED}，serve 實際綁在 ${actual}（那個 port 大概被占著）——gateway 改指向 ${actual}`);
  STATIC_PORT = actual;
}

/* 靜態資源不記。一次開頁會帶出幾十個 css/js/圖，全部記下來會把真正的
   動作淹沒在雜訊裡；非 GET 一律記，那些都是有副作用的操作。 */
const ASSET = /\.(css|js|mjs|map|svg|png|jpe?g|webp|gif|ico|woff2?|txt)$/i;
const shouldLog = (method, p) => method !== "GET" || !ASSET.test(p);

// /run 與 /health 轉給 Agents 後端，其餘轉給靜態站。SSE 要逐塊送出，不能緩衝。
// /wish 兩邊都有：GET 是靜態的許願池頁面，POST/OPTIONS 才是後端分析 API，所以要看 method。
function isBackend(method, p) {
  if (p === "/run" || p === "/health") return true;
  return p === "/wish" && (method === "POST" || method === "OPTIONS");
}
/* 後台的頁面與 API 都要先登入。判斷寫在這裡而不是散在各處，是為了
   「哪些東西沒有密碼就看得到」這件事有單一個地方可以核對。

   不能用完整檔名列白名單：serve 有 clean-URL 改寫，/admin-actions.html 會 301
   到 /admin-actions，而那個路徑不在清單裡——實測未登入直接開 /admin-actions
   整頁照常回 200。所以改成看正規化後的檔名前綴，admin 開頭的一律要密碼。
   登入頁自己當然要放行，否則沒有人進得來。 */
const normalize = (p) => decodeURIComponent(p).replace(/\/+$/, "").replace(/\.html$/, "").toLowerCase();
const isAdminPath = (p) => {
  if (p.startsWith("/api/admin/")) return true;
  if (p === "/api/usage") return true;
  const n = normalize(p);
  if (n === "/admin-login") return false;
  return n === "/admin" || n.startsWith("/admin-") || n.startsWith("/admin.");
};

const json = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};

const readBody = (req) => new Promise((resolve) => {
  let raw = "";
  req.on("data", (c) => { raw += c; if (raw.length > 4096) req.destroy(); });
  req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
});

function startGateway() {
  const gw = http.createServer(async (req, res) => {
    const p = req.url.split("?")[0];
    const t0 = Date.now();
    const who = actions.visitorOf(req.socket?.remoteAddress);

    // ── 後台認證 ──────────────────────────────────────────
    if (p === "/api/admin/login" && req.method === "POST") {
      if (!auth.ready()) return json(res, 503, { error: "後台密碼尚未設定（var/admin.json）" });
      const wait = auth.throttle(who);
      if (wait) {
        actions.record({ actor: "後台", action: "登入被限流", status: 429, visitor: who, note: `還要等 ${wait} 秒` });
        return json(res, 429, { error: `嘗試太多次，請等 ${wait} 秒` });
      }
      const { password } = await readBody(req);
      if (!auth.passwordMatches(password)) {
        auth.noteFail(who);
        actions.record({ actor: "後台", action: "登入失敗", status: 401, visitor: who });
        return json(res, 401, { error: "管理密碼不正確" });
      }
      auth.noteSuccess(who);
      auth.setCookie(req, res);
      actions.record({ actor: "後台", action: "登入成功", status: 200, visitor: who });
      return json(res, 200, { ok: true });
    }
    // ── Google 登入 ──────────────────────────────────────
    if (p === "/api/admin/google/start") {
      if (!google.configured(auth.conf())) return json(res, 503, { error: "尚未設定 Google 登入" });
      const next = new URL(req.url, "http://x").searchParams.get("next") || "/admin-actions.html";
      res.writeHead(302, { location: google.startUrl(auth.conf(), req, next) });
      return res.end();
    }
    if (p === "/api/admin/google/callback") {
      const q = new URL(req.url, "http://x").searchParams;
      const fail = (why) => {
        actions.record({ actor: "後台", action: "Google 登入失敗", status: 401, visitor: who, note: why });
        res.writeHead(302, { location: `/admin-login.html?error=${encodeURIComponent(why)}` });
        res.end();
      };
      if (q.get("error")) return fail(`Google 回報：${q.get("error")}`);
      /* state 一次性，比對不過就是偽造的回呼或使用者按了舊連結。 */
      const rec = google.takePending(q.get("state") || "");
      if (!rec) return fail("登入連結已失效，請重新登入");
      try {
        const user = await google.exchange(auth.conf(), q.get("code") || "", rec);
        if (!google.allowed(auth.conf(), user.email)) {
          return fail(`${user.email} 不在允許清單內`);
        }
        auth.setCookie(req, res);
        actions.record({ actor: "後台", action: "Google 登入成功", status: 200, visitor: who, note: user.email });
        res.writeHead(302, { location: rec.next });
        return res.end();
      } catch (error) {
        return fail(String(error.message).slice(0, 120));
      }
    }

    if (p === "/api/admin/logout" && req.method === "POST") {
      auth.clearCookie(req, res);
      actions.record({ actor: "後台", action: "登出", status: 200, visitor: who });
      return json(res, 200, { ok: true });
    }
    if (p === "/api/admin/session") {
      const g = google.configured(auth.conf());
      return auth.verify(req)
        ? json(res, 200, { authenticated: true, google: g })
        : json(res, 401, { authenticated: false, configured: auth.ready(), google: g });
    }

    if (isAdminPath(p) && !auth.verify(req)) {
      actions.record({ actor: "後台", action: "未登入被擋", target: p, status: 401, visitor: who });
      /* 頁面導去登入畫面，API 回 401 讓前端自己處理。判斷條件不能用
         .html 結尾——serve 的 clean-URL 會讓瀏覽器最後停在 /admin-actions，
         那個路徑就會收到一段 401 JSON 而不是登入畫面。 */
      if (!p.startsWith("/api/")) {
        res.writeHead(302, { location: `/admin-login.html?next=${encodeURIComponent(p)}` });
        return res.end();
      }
      return json(res, 401, { error: "請先登入管理後台" });
    }

    // ── 動作紀錄 API ─────────────────────────────────────
    if (p === "/api/admin/actions") {
      const q = new URL(req.url, "http://x").searchParams;
      return json(res, 200, actions.read({
        root,
        limit: Math.min(2000, Number(q.get("limit")) || 300),
        actor: q.get("actor") || null,
        action: q.get("action") || null,
      }));
    }

    // 管理後台的使用統計：gateway 自己回，不轉給靜態站也不依賴 Vercel functions。
    if (p === "/api/usage") {
      const days = Number(new URL(req.url, "http://x").searchParams.get("days")) || 14;
      const body = JSON.stringify(usage.summarize({ root, days }));
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(body);
    }

    const port = isBackend(req.method, p) ? BACKEND_PORT : STATIC_PORT;
    const up = http.request(
      { host: "127.0.0.1", port, method: req.method, path: req.url,
        headers: { ...req.headers, host: `127.0.0.1:${port}` } },
      (upRes) => {
        const h = { ...upRes.headers };
        // 前面隔著 nginx/openresty + Cloudflare。nginx 預設 proxy_buffering on 會把 SSE
        // 整包緩衝到結束才送，串流因此卡死或被 proxy_read_timeout 砍掉（瀏覽器端看到
        // ERR_HTTP2_PROTOCOL_ERROR）。這個標頭會讓 nginx 對本筆回應關閉緩衝。
        if (port === BACKEND_PORT) {
          h["x-accel-buffering"] = "no";
          h["cache-control"] = "no-cache, no-transform";
        }
        usage.record(req, upRes.statusCode);
        /* 後台要看得到「全部的動作」，所以每一個請求都記——但靜態資源
           （css/js/圖檔／字型）一頁就是幾十筆，全記下來只會把真正的動作
           淹掉，所以交給 shouldLog 判斷。 */
        if (shouldLog(req.method, p)) {
          actions.record({
            actor: "訪客", action: req.method === "GET" ? "瀏覽" : req.method,
            target: p, status: upRes.statusCode, visitor: who,
            device: /Mobi|Android|iPhone|iPad/i.test(String(req.headers["user-agent"] || "")) ? "mobile" : "desktop",
            ms: Date.now() - t0,
          });
        }
        res.writeHead(upRes.statusCode, h);
        upRes.on("data", (c) => res.write(c));
        upRes.on("end", () => res.end());
      }
    );
    up.on("error", (e) => {
      if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`gateway: 無法連到 127.0.0.1:${port} — ${e.message}`);
    });
    req.pipe(up);
  });
  gw.on("clientError", (_e, socket) => socket.destroy());
  const logFile = usage.open(root);
  const actionFile = actions.open(root);
  const authConf = auth.load(root);
  gw.listen(PUBLIC_PORT, "0.0.0.0", () => {
    console.log(`[gateway] 對外服務於 0.0.0.0:${PUBLIC_PORT}`);
    console.log(`[gateway] 使用紀錄 → ${path.relative(root, logFile)}（不含 IP，僅存雜湊）`);
    console.log(`[gateway] 動作紀錄 → ${path.relative(root, actionFile)}`);
    console.log(authConf.ready
      ? `[gateway] 後台密碼已載入（${authConf.source}）`
      : `[gateway] ⚠ 後台密碼未設定（${authConf.source}）——/admin*.html 一律擋下`);
    actions.record({ actor: "系統", action: "gateway 啟動", target: `:${PUBLIC_PORT}`, status: 200 });
  });
  procs.push({ kill: () => gw.close() });
}

function shutdown() {
  procs.forEach((p) => { try { p.kill(); } catch { /* noop */ } });
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const py = pickPython();
console.log("── JVision 一鍵啟動 ──");
console.log(`後端： ${py} app.py            → 127.0.0.1:${BACKEND_PORT}（內部）`);
console.log(`前端： npx serve .              → 127.0.0.1:${STATIC_PORT}（內部）`);
console.log(`對外： http://localhost:${PUBLIC_PORT}  ← 只有這個 port 需要開`);
console.log(`（Ctrl+C 一起關閉；請開 http://localhost:${PUBLIC_PORT}/agents-mission）\n`);

run("backend", py, ["app.py"], serverDir);
run("frontend", isWin ? "npx.cmd" : "npx", ["serve", ".", "-l", `tcp://127.0.0.1:${STATIC_PORT}`], root);
startGateway();
