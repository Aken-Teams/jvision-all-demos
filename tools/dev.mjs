// 一鍵啟動「前端靜態站 (:3000) + Agents 後端 (aiohttp :4610)」。
// 用法：npm run dev   （Ctrl+C 會一起關閉兩者）
import { spawn, spawnSync, execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import * as usage from "./lib/usage-log.mjs";
import * as actions from "./lib/action-log.mjs";
import * as auth from "./lib/admin-auth.mjs";
import * as google from "./lib/google-auth.mjs";
import * as visitor from "./lib/visitor-auth.mjs";
import * as builds from "./lib/build-records.mjs";
import * as guard from "./lib/rate-guard.mjs";
import * as wishes from "./lib/wish-requests.mjs";
import * as control from "./lib/control-db.mjs";
import { spawn as spawnProc } from "node:child_process";

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
/* 客戶實例的服務。獨立的 unit，型錄站重啟不該把客戶的系統一起收掉。 */
const APP_PORT = Number(process.env.JV_APP_PORT || 4700);

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

/* ── AI 引擎健康（claude / codex CLI）─────────────────────
   首頁右上角要在引擎掛掉時顯示「伺服尚未準備好」。真的跑 --version 而不是
   只查 PATH——帳號過期、安裝半損時二進位還在，which 會騙人。
   60 秒快取＋同時只查一次，免得每個訪客各 spawn 兩個程序。 */
const engineHealth = { at: 0, inflight: null, result: null };
function checkEngine(bin) {
  return new Promise((resolve) => {
    try { execFile(bin, ["--version"], { timeout: 10000, shell: isWin }, (err) => resolve(!err)); }
    catch { resolve(false); }
  });
}
function enginesReady() {
  if (engineHealth.result && Date.now() - engineHealth.at < 60000) return Promise.resolve(engineHealth.result);
  if (!engineHealth.inflight) {
    engineHealth.inflight = Promise.all([checkEngine("claude"), checkEngine("codex")]).then(([cl, cx]) => {
      engineHealth.result = { ready: cl && cx, engines: { claude: cl, codex: cx }, checkedAt: new Date().toISOString() };
      engineHealth.at = Date.now();
      engineHealth.inflight = null;
      return engineHealth.result;
    });
  }
  return engineHealth.inflight;
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

/* 回到原目的地的網址要先把 .html 拿掉。serve 的 clean-URL 會把 /x.html 301
   到 /x，而那一跳**不帶查詢字串**——/project.html?repo=jvision-crm 登入完會變成
   /project，詳細頁少了 repo 就開不出東西。先正規化就不會多那一跳。 */
function normalizeNext(url) {
  const i = url.indexOf("?");
  const path = (i < 0 ? url : url.slice(0, i)).replace(/\.html$/, "");
  return path + (i < 0 ? "" : url.slice(i));
}

/* 靜態資源不記。一次開頁會帶出幾十個 css/js/圖，全部記下來會把真正的
   動作淹沒在雜訊裡；非 GET 一律記，那些都是有副作用的操作。 */
const ASSET = /\.(css|js|mjs|map|svg|png|jpe?g|webp|gif|ico|woff2?|txt)$/i;

/* Cloudflare 預設不快取這個站的任何東西（實測 cf-cache-status: DYNAMIC），
   於是每個訪客的每一張圖都要穿過隧道回源抓。原站沒有給快取標頭是主因——
   沒有 Cache-Control，邊緣就只能當成動態內容。
   圖檔與字型給七天：它們改動時檔名通常也會換（webp 是新檔），不會拿到舊的。
   HTML 與 JSON 不快取：目錄與最近新增每天都在變，拿到舊的比慢更糟。 */
const LONG_CACHE = /\.(png|jpe?g|webp|gif|ico|svg|woff2?)$/i;
const cacheHeaderFor = (p) => {
  if (LONG_CACHE.test(p)) return "public, max-age=604800, stale-while-revalidate=86400";
  /* bridge 注入在 1,628 套 demo 裡,快取一小時會讓改版後的功能(如 operate)
     在使用者端啞火;它只有幾 KB,每次重驗證的代價遠小於「舊版斷功能」 */
  if (p === "/shared/jv-agent-bridge.js") return "no-cache, must-revalidate";
  if (/\.(css|js|mjs)$/i.test(p)) return "public, max-age=3600";
  return null;
};
const shouldLog = (method, p) => method !== "GET" || !ASSET.test(p);

// /run 與 /health 轉給 Agents 後端，其餘轉給靜態站。SSE 要逐塊送出，不能緩衝。
// /wish 兩邊都有：GET 是靜態的許願池頁面，POST/OPTIONS 才是後端分析 API，所以要看 method。
function isBackend(method, p) {
  if (p === "/run" || p === "/health") return true;
  if (p === "/systems" || p.startsWith("/systems/")) return true; // 系統工具層(agent 資料查詢)
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
    const ip = actions.ipOf(req);
    const who = actions.visitorOf(ip);

    /* 反爬蟲底線：明顯的抓取 UA 與超速 IP 擋在這裡。迴環不限（自家產線與
       監看都走本機）；上層更強的防線是 Cloudflare 的 bot 防護。 */
    {
      /* 健康端點不占配額：它是頁面每分鐘自動打的，不是人的行為；
         被限流會讓右上角誤亮「伺服尚未準備好」——監看機制自己成為假警報源。 */
      const hit = p === "/api/health/engines" ? null : guard.check(ip, p, req.headers["user-agent"]);
      if (hit) {
        if (hit.firstBlock) actions.record({ actor: "訪客", action: hit.status === 403 ? "爬蟲 UA 被擋" : "超速被限流",
          target: p, status: hit.status, visitor: who, ip, note: hit.why });
        res.writeHead(hit.status, { "content-type": "text/plain; charset=utf-8", "retry-after": "60" });
        return res.end(hit.status === 403 ? "forbidden" : "too many requests");
      }
    }

    // ── 進站身分 ──────────────────────────────────────────
    /* 訪客入口已關閉。端點留著並明確拒絕，而不是直接移除——舊分頁上的按鈕
       還會打過來，回 404 看起來像站壞了，回 403 才說得清楚發生什麼事。 */
    if (p === "/api/visitor/guest" && req.method === "POST") {
      actions.record({ actor: "訪客", action: "訪客入口已關閉", status: 403, visitor: who });
      return json(res, 403, { error: "本站需要以 Google 帳號登入", needsGoogle: true });
    }
    if (p === "/api/visitor/google/start") {
      if (!google.configured(auth.conf())) return json(res, 503, { error: "尚未設定 Google 登入" });
      const next = new URL(req.url, "http://x").searchParams.get("next") || "/";
      res.writeHead(302, { location: google.startUrl(auth.conf(), req, next, "visitor") });
      return res.end();
    }
    if (p === "/api/visitor/logout" && req.method === "POST") {
      visitor.clear(req, res);
      actions.record({ actor: "訪客", action: "離開（清除身分）", status: 200, visitor: who });
      return json(res, 200, { ok: true });
    }
    /* ── 客戶的系統（實例）────────────────────────────
       路徑形式 /-/i/<實例編號>/... 先上線，之後第四期換成子網域分流時
       這條會保留當內部備援（不必動 DNS 就能驗收）。
       實例身分由這裡解析後用標頭傳給 app-server，前端傳什麼都跨不過去。 */
    {
      const m = /^\/-\/i\/([a-z0-9_]+)(\/.*)?$/.exec(p);
      if (m) {
        const [, instanceId, rest] = m;
        const id = visitor.read(req);
        if (!visitor.isNamed(id)) {
          res.writeHead(302, { location: `/api/visitor/google/start?next=${encodeURIComponent(req.url)}` });
          return res.end();
        }
        try {
          const inst = await control.getInstance(instanceId);
          if (!inst) return json(res, 404, { error: "找不到這個系統" });
          /* 只有這個客戶白名單裡的信箱進得去。權限每次查而不放進 cookie——
             站主或客戶把某個信箱移除時要能馬上生效。 */
          const role = await control.memberRole({ customerId: inst.customer_id, email: id.email });
          if (!role) {
            actions.record({ actor: "訪客", action: "非成員嘗試進入客戶系統", target: instanceId,
              status: 403, visitor: who, who: visitor.labelOf(id), ip });
            return json(res, 403, { error: "你的帳號不在這個系統的使用名單內" });
          }
          const target = rest && rest !== "/" ? rest : "/";
          const up = http.request({
            host: "127.0.0.1", port: APP_PORT, method: req.method, path: target,
            headers: { ...req.headers, host: `127.0.0.1:${APP_PORT}`,
              "x-jv-instance": instanceId, "x-jv-actor": id.email, "x-jv-role": role },
          }, (upRes) => {
            res.writeHead(upRes.statusCode, upRes.headers);
            upRes.pipe(res);
          });
          up.on("error", () => json(res, 503, { error: "系統暫時無法使用（實例服務未啟動）" }));
          req.pipe(up);
          return;
        } catch (error) {
          console.error("[instance]", error.message);
          return json(res, 503, { error: "系統暫時無法使用" });
        }
      }
    }

    /* AI 引擎狀態：claude 或 codex 任一無法使用時 ready=false，
       前端右上角據此顯示「伺服尚未準備好」。 */
    if (p === "/api/health/engines") return json(res, 200, await enginesReady());

    if (p === "/api/visitor/me") {
      const id = visitor.read(req);
      return json(res, 200, { signedIn: visitor.isNamed(id), kind: id?.kind || null,
        email: id?.email || null, name: id?.name || null, google: google.configured(auth.conf()),
        /* 是否為後臺白名單成員。只回布林——把名單本身送到前端等於公告攻擊目標。 */
        admin: Boolean(id?.email && google.allowed(auth.conf(), id.email)) });
    }

    /* 許願池只給具名使用者。訪客身分看得到站上所有 demo，但許願會進到產線、
       佔用 codex 與人的時間，而且後台需要知道是誰提的才有辦法回頭聯繫——
       匿名的需求收進來，做完了也不知道要通知誰。
       把關一定要在這裡：前端藏起按鈕擋得住手滑，擋不住直接打 API。 */
    /* 需求單：客戶從目錄挑幾套系統，寫下想改成什麼樣子。
       把關與許願池同一條——那條已經跑了幾個月，不另外開一套。
       金流之後才接，現在送出就是留下需求，狀態停在 draft。 */
    if (p === "/api/orders" && req.method === "POST") {
      const id = visitor.read(req);
      if (!id) return json(res, 401, { error: "請先登入" });
      if (id.kind !== "google") return json(res, 403, { error: "請用 Google 帳號登入", needsGoogle: true });
      const body = await readBody(req);
      const items = Array.isArray(body.items) ? body.items.filter((x) => x && typeof x.repoName === "string") : [];
      if (!items.length) return json(res, 400, { error: "沒有挑選任何系統" });
      if (items.length > 20) return json(res, 400, { error: "一次最多 20 套" });
      const company = String(body.company || "").trim().slice(0, 60);
      if (!company) return json(res, 400, { error: "請填公司名稱" });

      try {
        const customer = await control.ensureCustomer({ email: id.email, company });
        const order = await control.createOrder({
          customerId: customer.id,
          buyerEmail: id.email,
          items: items.slice(0, 20).map((x) => ({
            repoName: x.repoName,
            title: String(x.title || x.repoName).slice(0, 80),
            want: String(x.want || "").slice(0, 600),
          })),
          note: [String(body.contact || "").trim().slice(0, 40), String(body.note || "").trim().slice(0, 1000)]
            .filter(Boolean).join(" / ") || null,
        });
        await control.recordEvent({ kind: "order.created", customerId: customer.id, actor: id.email,
          detail: { orderId: order.id, count: items.length } });
        actions.record({ actor: "訪客", action: "送出系統需求單", target: order.id, status: 200,
          visitor: who, who: visitor.labelOf(id), ip, note: `${company}｜${items.length} 套` });
        return json(res, 200, { ok: true, id: order.id });
      } catch (error) {
        /* 資料庫在共用主機上，連不上是會發生的。給明確訊息而不是 500 空白，
           使用者才知道是暫時性問題、值得再試一次。 */
        console.error("[orders] 建立失敗：", error.message);
        return json(res, 503, { error: "資料庫暫時無法連線，請稍後再試" });
      }
    }

    if (p === "/api/orders" && req.method === "GET") {
      const id = visitor.read(req);
      if (!visitor.isNamed(id)) return json(res, 401, { error: "請先登入" });
      try { return json(res, 200, { orders: await control.listOrders({ buyerEmail: id.email, limit: 50 }) }); }
      catch { return json(res, 503, { error: "資料庫暫時無法連線" }); }
    }

    if (p === "/api/wish/request" && req.method === "POST") {
      const id = visitor.read(req);
      if (!id) return json(res, 401, { error: "請先選擇身分再送出" });
      if (id.kind !== "google") {
        actions.record({ actor: "訪客", action: "訪客身分嘗試許願被擋", status: 403, visitor: who });
        return json(res, 403, { error: "許願池需要 Google 帳號登入", needsGoogle: true });
      }
      const body = await readBody(req);
      const r = wishes.create(root, {
        need: body.need, analysis: body.analysis,
        who: visitor.labelOf(id), visitor: who,
      });
      if (!r.ok) return json(res, 400, r);
      actions.record({ actor: "訪客", action: r.duplicate ? "重複送出許願申請" : "許願申請做成 Demo",
        status: 200, visitor: who, who: visitor.labelOf(id),
        note: String(body.need || "").slice(0, 60) });
      return json(res, 200, { ok: true, id: r.request.id, duplicate: Boolean(r.duplicate) });
    }

    /* 進站閘門：沒有身分就先到入口頁選一個。放行的路徑寫在
       visitor-auth 的 needsGate 裡，集中一處才看得出「什麼東西不用登入」。 */
    if (visitor.needsGate(p) && !visitor.isNamed(visitor.read(req))) {
      res.writeHead(302, { location: `/welcome?next=${encodeURIComponent(normalizeNext(req.url))}` });
      return res.end();
    }

    // ── 後台認證 ──────────────────────────────────────────
    if (p === "/api/admin/login" && req.method === "POST") {
      /* 共用密碼可被停用：白名單制下留著密碼，等於任何知道密碼的人都進得來，
         「只有這兩個帳號」就不成立。設定放 var/admin.json 的 passwordLogin。 */
      if (auth.conf()?.passwordLogin === false) {
        actions.record({ actor: "後台", action: "密碼登入已停用被擋", status: 403, visitor: who });
        return json(res, 403, { error: "密碼登入已停用，請使用 Google 帳號登入" });
      }
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
      /* state 一次性，比對不過就是偽造的回呼或使用者按了舊連結。
         要先取出來才知道這次是進站還是後台，錯誤才退得回正確的頁面。 */
      const rec = google.takePending(q.get("state") || "");
      const backTo = rec?.purpose === "visitor" ? "/welcome" : "/admin-login";
      const fail = (why) => {
        actions.record({ actor: rec?.purpose === "visitor" ? "訪客" : "後台",
          action: "Google 登入失敗", status: 401, visitor: who, note: why });
        res.writeHead(302, { location: `${backTo}?error=${encodeURIComponent(why)}` });
        res.end();
      };
      if (q.get("error")) return fail(`Google 回報：${q.get("error")}`);
      if (!rec) return fail("登入連結已失效，請重新登入");
      try {
        const user = await google.exchange(auth.conf(), q.get("code") || "", rec);

        /* 進站具名：任何 Google 帳號都可以，這只是「願意具名的訪客」。
           若這個信箱剛好也在後台白名單，順手一併發後台 session——反正他
           走後台登入也會過，讓他多按一次沒有多換到任何安全性。 */
        if (rec.purpose === "visitor") {
          visitor.issue(req, res, { kind: "google", email: user.email, name: user.name });
          if (google.allowed(auth.conf(), user.email)) auth.setCookie(req, res);
          actions.record({ actor: "訪客", action: "Google 具名進站", status: 200, visitor: who, note: user.email });
          res.writeHead(302, { location: rec.next || "/" });
          return res.end();
        }

        /* 後台：白名單是唯一的門檻。 */
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
      const pw = auth.conf()?.passwordLogin !== false;
      return auth.verify(req)
        ? json(res, 200, { authenticated: true, google: g, password: pw })
        : json(res, 401, { authenticated: false, configured: auth.ready(), google: g, password: pw });
    }

    if (isAdminPath(p) && !auth.verify(req)) {
      actions.record({ actor: "後台", action: "未登入被擋", target: p, status: 401, visitor: who });
      /* 頁面導去登入畫面，API 回 401 讓前端自己處理。判斷條件不能用
         .html 結尾——serve 的 clean-URL 會讓瀏覽器最後停在 /admin-actions，
         那個路徑就會收到一段 401 JSON 而不是登入畫面。 */
      if (!p.startsWith("/api/")) {
        res.writeHead(302, { location: `/admin-login?next=${encodeURIComponent(normalizeNext(req.url))}` });
        return res.end();
      }
      return json(res, 401, { error: "請先登入管理後台" });
    }

    // ── 許願申請 API（管理端）─────────────────────────────
    if (p === "/api/admin/orders") {
      try {
        const status = new URL(req.url, "http://x").searchParams.get("status") || undefined;
        return json(res, 200, { orders: await control.listOrders({ status, limit: 200 }) });
      } catch { return json(res, 503, { error: "資料庫暫時無法連線" }); }
    }

    if (p === "/api/admin/wishes") {
      const q = new URL(req.url, "http://x").searchParams;
      return json(res, 200, wishes.list(root, {
        status: q.get("status") || null,
        limit: Math.min(500, Number(q.get("limit")) || 200),
      }));
    }
    if (p === "/api/admin/wishes/act" && req.method === "POST") {
      const { id, action } = await readBody(req);
      const wish = wishes.get(root, id);
      if (!wish) return json(res, 404, { error: "找不到這筆申請" });

      if (action === "reject") {
        wishes.update(root, id, { status: "rejected", note: "管理者婉拒" });
        actions.record({ actor: "後台", action: "婉拒許願申請", target: id, status: 200, visitor: who });
        return json(res, 200, { ok: true });
      }
      if (action !== "now" && action !== "later") return json(res, 400, { error: "action 只能是 now / later / reject" });

      /* 產生規格要呼叫 codex，一次好幾分鐘——不能讓管理者的瀏覽器等在那裡。
         丟到背景跑，狀態寫回申請紀錄，前端輪詢就看得到。 */
      wishes.update(root, id, { status: "queued", note: "正在產生規格書…" });
      const child = spawnProc(process.execPath,
        ["tools/wish-to-topic.mjs", `--id=${id}`, ...(action === "now" ? ["--front"] : [])],
        { cwd: root, detached: true, stdio: "ignore" });
      child.unref();
      actions.record({ actor: "後台", action: action === "now" ? "立即製作許願申請" : "許願申請排入排程",
        target: id, status: 200, visitor: who });
      return json(res, 200, { ok: true, queued: true });
    }

    // ── 專案生成紀錄 API ─────────────────────────────────
    if (p === "/api/admin/builds") {
      const q = new URL(req.url, "http://x").searchParams;
      return json(res, 200, builds.list({
        root,
        limit: Math.min(2000, Number(q.get("limit")) || 200),
        state: q.get("state") || null,
        q: q.get("q") || null,
      }));
    }
    if (p === "/api/admin/build-log") {
      const repo = new URL(req.url, "http://x").searchParams.get("repo") || "";
      const r = builds.readLog({ root, repo });
      return json(res, r.ok ? 200 : 404, r);
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

    /* /wish 的 POST 是 AI 分析，也要具名才能用——那一次分析是真的在燒算力，
       而且它就是許願流程的第一步，只擋後半段等於沒擋。 */
    if (p === "/wish" && (req.method === "POST" || req.method === "OPTIONS")) {
      const id = visitor.read(req);
      if (!id || id.kind !== "google") {
        actions.record({ actor: "訪客", action: "訪客身分嘗試 AI 分析被擋", status: 403, visitor: who });
        return json(res, 403, { error: "AI 許願池需要 Google 帳號登入", needsGoogle: true });
      }
    }

    /* /run 是 AI 任務編排,一次會動用多個 LLM 呼叫;頁面雖有登入閘門,
       但 API 可被直接呼叫,所以自己也要把關(比照 /wish)。 */
    if (p === "/run" && req.method === "POST") {
      const id = visitor.read(req);
      if (!id || id.kind !== "google") {
        actions.record({ actor: "訪客", action: "訪客身分嘗試 AI 任務被擋", status: 403, visitor: who });
        return json(res, 403, { error: "AI 任務需要 Google 帳號登入", needsGoogle: true });
      }
    }

    /* serve 的 clean-URL 會把 /x.html 301 到 /x，但那一跳會把查詢字串弄丟——
       /project.html?repo=jvision-crm 於是變成 /project，詳細頁沒有 repo 就顯示
       「找不到這個專案」。舊書籤與外部分享出去的連結都是這個形式，所以在這裡
       自己轉一次，把查詢字串帶過去。 */
    if (p.endsWith(".html") && req.method === "GET") {
      const clean = p.slice(0, -5) + req.url.slice(p.length);
      res.writeHead(301, { location: clean, "cache-control": "no-store" });
      return res.end();
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
        } else if (upRes.statusCode === 200) {
          const cc = cacheHeaderFor(p);
          if (cc) h["cache-control"] = cc;
        }
        usage.record(req, upRes.statusCode);
        /* 後台要看得到「全部的動作」，所以每一個請求都記——但靜態資源
           （css/js/圖檔／字型）一頁就是幾十筆，全記下來只會把真正的動作
           淹掉，所以交給 shouldLog 判斷。 */
        if (shouldLog(req.method, p)) {
          actions.record({
            actor: "訪客", action: req.method === "GET" ? "瀏覽" : req.method,
            target: p, status: upRes.statusCode, visitor: who, ip,
            who: visitor.labelOf(visitor.read(req)),
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
  /* 進站 cookie 與後台 cookie 共用同一把簽章金鑰。兩者的內容與 cookie 名稱
     都不同，共用金鑰不會讓其中一種被拿去偽造成另一種。 */
  visitor.init(auth.conf()?.secret || "");
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
