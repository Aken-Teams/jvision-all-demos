// 一鍵啟動「前端靜態站 (:3000) + Agents 後端 (aiohttp :4610)」。
// 用法：npm run dev   （Ctrl+C 會一起關閉兩者）
import { spawn, spawnSync, execFile, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
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
import * as meUsage from "./lib/me-usage.mjs";
import * as mysql from "./lib/mysql.mjs";
import * as shots from "./lib/shots.mjs";
import * as payment from "./lib/payment/index.mjs";
import * as agentQueue from "./lib/agent-queue.mjs";
import * as agentDir from "./lib/agent-direction.mjs";
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
/* 站台自己的程式碼。這些檔案改一次就要立刻生效，而快取一小時的代價是
   「畫面是新的、行為是舊的」——實測踩過：catalog.html 換成新按鈕、app.js 卻還是
   Cloudflare 快取的舊版（35,806 vs 33,381 bytes），按鈕看得到但按了完全沒反應。
   原本靠 ?v= 手動換版本字串來閃過，但那是人記得才有效的機制，而人就是會忘。
   這些檔只有幾十 KB，每次重驗證換來的 304 遠比「舊版斷功能」便宜。 */
const FIRST_PARTY_CODE = /^\/(app|agents|admin|project|project-expert)[a-z-]*\.js$|^\/shared\/.+\.(js|mjs)$/i;

const cacheHeaderFor = (p) => {
  if (LONG_CACHE.test(p)) return "public, max-age=604800, stale-while-revalidate=86400";
  if (FIRST_PARTY_CODE.test(p)) return "no-cache, must-revalidate";
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

/* 同一時間只允許一個 GitHub 同步在跑。兩個同時推同一批 repo 會互相打架，
   而且都會撞上 GitHub 的限流。 */
const ghSync = { child: null, startedAt: 0, lastCode: null };

/* repo → 中文名稱。目錄索引 1.4MB，每次查系統清單都重讀太浪費；
   而且那個檔一天才變幾次，快取十分鐘綽綽有餘。 */
const titleCache = { at: 0, map: null };
function titleFor(repoName) {
  const now = Date.now();
  if (!titleCache.map || now - titleCache.at > 600000) {
    const m = new Map();
    try {
      const c = JSON.parse(fs.readFileSync(path.join(root, "content", "catalog-index.json"), "utf8"));
      for (const x of c.projects || []) if (x.repoName) m.set(x.repoName, x.title);
    } catch { /* 讀不到就退回顯示代號——清單能不能出來，不該取決於名稱好不好看 */ }
    titleCache.map = m;
    titleCache.at = now;
  }
  return titleCache.map.get(repoName) || null;
}

/* 目錄排序資料的快取。 */
const catalogStats = { at: 0, body: "{}" };
/* 「最近熱門」的統計窗。站上每天都在新增系統，窗開太大等於在比誰上線得久，
   新做的永遠擠不進來；開太小又會被一兩天的偶然波動主導。 */
const HOT_DAYS = 30;

/* 上限預設 4KB——這裡的 API 收的都是短短的表單。帶截圖的需求單另外放寬，
   由呼叫端指定。不做成無上限：沒有上限的 body 就是一個記憶體開關。
   超過上限時直接斷線，前端會看到 "Failed to fetch"；那不是好訊息，但比
   讓伺服器吃下任意大小的東西好。 */
const readBody = (req, limit = 4096) => new Promise((resolve) => {
  let raw = "";
  req.on("data", (c) => { raw += c; if (raw.length > limit) req.destroy(); });
  req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
});

/* 客戶的子網域。只認這個形狀，其餘一律走主站的邏輯——用「查得到就算」
   當條件的話，每個進來的怪 Host 都要查一次資料庫。 */
/* 兩種都認：c-xxx.jvision-ai.com 是現在的命名（吃得到 *.jvision-ai.com 的
   憑證），xxx.c.jvdemo... 是舊的第四層命名，已開通的實例還指著它。
   只認 c- 開頭：tunnel 的 ingress 只能寫 *.jvision-ai.com，把關要在這裡做，
   否則任何指到這條 tunnel 的子網域都會被當成客戶系統。 */
const INSTANCE_HOST = /^(c-[a-z0-9-]+\.jvision-ai\.com|[a-z0-9-]+\.c\.jvdemo\.jvision-ai\.com)$/i;

/* host → 實例。每個請求查一次資料庫會把共用主機的往返延遲加在客戶身上；
   30 秒夠短，停用某個實例時不會拖太久才生效。 */
const hostCache = new Map();
async function instanceForHost(host) {
  const key = String(host || "").toLowerCase().split(":")[0];
  if (!INSTANCE_HOST.test(key)) return null;
  const hit = hostCache.get(key);
  if (hit && Date.now() - hit.at < 30000) return hit.inst;
  let inst = null;
  try { inst = await control.instanceByHost(key); } catch { /* 資料庫暫時不通就當作查不到 */ }
  hostCache.set(key, { inst, at: Date.now() });
  return inst;
}

/**
 * 把請求轉給實例服務。身分與白名單在這裡驗完才轉——app-server 綁在 127.0.0.1，
 * 但本機上的其他程序打得到它，所以那邊也會再擋一次（縱深防禦）。
 */
async function serveInstance(req, res, instanceId, target, { who, ip }) {
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
  } catch (error) {
    console.error("[instance]", error.message);
    return json(res, 503, { error: "系統暫時無法使用" });
  }
}

function startGateway() {
  const gw = http.createServer(async (req, res) => {
    const p = req.url.split("?")[0];
    const t0 = Date.now();
    const ip = actions.ipOf(req);
    const who = actions.visitorOf(ip);

    /* 客戶子網域最先判。放在反爬蟲與主站路由之前，是因為那些規則是為型錄站
       寫的（擋抓取 UA、限流、登入閘門），客戶自己的系統不該受那一套管；
       而且主站的靜態路由會先把 / 對到型錄首頁，順序反了就永遠進不到這裡。
       Host 不是這個形狀的話這一段幾乎零成本（只做一次正則）。 */
    {
      const inst = await instanceForHost(req.headers.host);
      if (inst) {
        if (inst.state === "archived") return json(res, 410, { error: "這個系統已封存" });
        if (inst.state === "suspended") return json(res, 403, { error: "這個系統已暫停服務" });
        return serveInstance(req, res, inst.id, req.url || "/", { who, ip });
      }
    }

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
       兩個入口共用同一套把關：
         /-/i/<實例編號>/...              內部備援，不必動 DNS 就能驗收
         <公司>-<系統>.c.jvdemo...        客戶對外用的網址
       實例身分在這裡解析後用標頭傳給 app-server，前端傳什麼都跨不過去。 */
    {
      const m = /^\/-\/i\/([a-z0-9_]+)(\/.*)?$/.exec(p);
      if (m) return serveInstance(req, res, m[1], m[2] && m[2] !== "/" ? m[2] : "/", { who, ip });
    }

    /* AI 引擎狀態：claude 或 codex 任一無法使用時 ready=false，
       前端右上角據此顯示「伺服尚未準備好」。 */
    /* 目錄的排序資料：每套是什麼時候上架的、被看過幾次。
       這兩個數字誰都看得到（目錄本身就是公開的），所以不設限；但它要掃
       usage.jsonl，所以快取五分鐘——目錄頁每次載入都重算會把 CPU 燒在
       一個五分鐘內幾乎不會變的答案上。 */
    if (p === "/api/catalog/stats") {
      const now = Date.now();
      if (!catalogStats.at || now - catalogStats.at > 300000) {
        const addedAt = {};
        try {
          const m = JSON.parse(fs.readFileSync(path.join(root, "docs", "DEMO_FORGE_MANIFEST.json"), "utf8"));
          const arr = Array.isArray(m) ? m : (m.entries || Object.values(m).find(Array.isArray) || []);
          for (const x of arr) if (x.repoName && x.createdAt) addedAt[x.repoName] = x.createdAt;
        } catch { /* 沒有 manifest 就只靠案例編號排序 */ }

        const views = {};
        const viewsAll = {};
        let oldest = null;
        const since = new Date(now - HOT_DAYS * 86400000).toISOString();
        try {
          /* 只認 demo 的瀏覽。整份掃過去——目前四千行，長到會慢再說，
             現在為它做索引是還沒發生的問題。 */
          for (const line of fs.readFileSync(path.join(root, "var", "usage.jsonl"), "utf8").split("\n")) {
            if (!line) continue;
            try {
              const r = JSON.parse(line);
              if (r.kind !== "demo" || !r.target) continue;
              if (!oldest || r.at < oldest) oldest = r.at;
              viewsAll[r.target] = (viewsAll[r.target] || 0) + 1;
              if (r.at >= since) views[r.target] = (views[r.target] || 0) + 1;
            } catch { /* 壞行跳過 */ }
          }
        } catch { /* 還沒有使用紀錄 */ }

        /* 一併回報紀錄實際涵蓋幾天。統計窗 30 天但只有 8 天的資料時，
           「最近熱門」其實等於「歷來累計」——前端要講清楚，不要讓人以為
           排序壞了。 */
        const coverDays = oldest
          ? Math.max(1, Math.round((now - Date.parse(oldest)) / 86400000)) : 0;

        /* 哪些還不能複製。前端據此把按鈕直接畫成不可用，而不是讓人按下去才
           跳一個錯誤對話框——那種「看起來可以、按了才說不行」最惱人。
           回「不能的」而不是「能的」：不能的只有兩百多筆，能的有一千七百多。 */
        const noSchema = [];
        try {
          const have = new Set(fs.readdirSync(path.join(root, "content", "schema"))
            .map((x) => x.replace(/\.json$/, "")));
          for (const d of fs.readdirSync(path.join(root, "demos"))) {
            if (d.startsWith("jvision-") && !have.has(d)) noSchema.push(d);
          }
        } catch { /* 讀不到就當作全部都能複製，按下去才擋——比整頁壞掉好 */ }

        catalogStats.body = JSON.stringify({ addedAt, views, viewsAll, hotDays: HOT_DAYS, coverDays, noSchema });
        catalogStats.at = now;
      }
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" });
      return res.end(catalogStats.body);
    }

    if (p === "/api/health/engines") return json(res, 200, await enginesReady());

    if (p === "/api/visitor/me") {
      const id = visitor.read(req);
      return json(res, 200, { signedIn: visitor.isNamed(id), kind: id?.kind || null,
        email: id?.email || null, name: id?.name || null, google: google.configured(auth.conf()),
        /* 是否為後臺白名單成員。只回布林——把名單本身送到前端等於公告攻擊目標。 */
        admin: Boolean(id?.email && google.allowed(auth.conf(), id.email)),
        /* 前端據此決定要不要顯示付款相關的東西。只回布林，不回金流設定。 */
        paymentEnabled: payment.enabled() });
    }

    /* 許願池只給具名使用者。訪客身分看得到站上所有 demo，但許願會進到產線、
       佔用 codex 與人的時間，而且後台需要知道是誰提的才有辦法回頭聯繫——
       匿名的需求收進來，做完了也不知道要通知誰。
       把關一定要在這裡：前端藏起按鈕擋得住手滑，擋不住直接打 API。 */
    /* 需求單：客戶從目錄挑幾套系統，寫下想改成什麼樣子。
       把關與許願池同一條——那條已經跑了幾個月，不另外開一套。
       金流之後才接，現在送出就是留下需求，狀態停在 draft。 */
    /* 一鍵複製模板：開好他自己的副本，直接把他送進去改。
       同步等開通完成——實測只要幾秒，而使用者就站在畫面前面等著進去；
       做成背景工作反而要多一套查進度的機制，還要處理「開好了要怎麼通知他」。 */
    if (p === "/api/templates/copy" && req.method === "POST") {
      const id = visitor.read(req);
      if (!visitor.isNamed(id)) return json(res, 401, { error: "請先登入", needsGoogle: true });
      const { repoName } = await readBody(req);
      if (!/^jvision-[a-z0-9-]+$/.test(String(repoName || ""))) return json(res, 400, { error: "專案代號不正確" });
      if (!fs.existsSync(path.join(root, "content", "schema", `${repoName}.json`))) {
        return json(res, 409, { error: "這一套還沒有資料表定義，暫時不能複製" });
      }
      try {
        /* 已經複製過就帶他回去那一套。按兩次不該開出兩套一樣的系統。 */
        const had = await control.instanceForRepo(id.email, repoName);
        if (had && had.state === "live") return json(res, 200, { id: had.id, existing: true });

        const customer = await control.ensureCustomer({ email: id.email });
        const order = await control.createOrder({
          status: "queued", customerId: customer.id, buyerEmail: id.email,
          items: [{ repoName, title: repoName, want: "" }],
          note: "從目錄一鍵複製",
        });
        execFileSync(process.execPath,
          [path.join(root, "tools", "instance-provision.mjs"), `--order=${order.id}`],
          { cwd: root, encoding: "utf8", timeout: 180000 });
        const made = await control.instanceForRepo(id.email, repoName);
        if (!made) return json(res, 500, { error: "開通沒有產出系統" });
        actions.record({ actor: "訪客", action: "一鍵複製模板", target: repoName, status: 200,
          visitor: who, who: visitor.labelOf(id), ip });
        return json(res, 200, { id: made.id, existing: false });
      } catch (error) {
        console.error("[copy]", String(error.message).slice(0, 200));
        return json(res, 503, { error: "開通失敗，請稍後再試" });
      }
    }

    if (p === "/api/orders" && req.method === "POST") {
      const id = visitor.read(req);
      if (!id) return json(res, 401, { error: "請先登入" });
      if (id.kind !== "google") return json(res, 403, { error: "請用 Google 帳號登入", needsGoogle: true });
      /* 每套可以附一張截圖，前端已經縮到最寬 1400px；20 套上限抓 24MB。 */
      const body = await readBody(req, 24 * 1024 * 1024);
      const items = Array.isArray(body.items) ? body.items.filter((x) => x && typeof x.repoName === "string") : [];
      if (!items.length) return json(res, 400, { error: "沒有挑選任何系統" });
      if (items.length > 20) return json(res, 400, { error: "一次最多 20 套" });
      const company = String(body.company || "").trim().slice(0, 60);
      if (!company) return json(res, 400, { error: "請填公司名稱" });

      try {
        const customer = await control.ensureCustomer({ email: id.email, company });
        /* 沒開收費就直接排進建置佇列，客戶完全不會看到付款這件事。
           開了收費才是 draft，等他走完付款流程。 */
        const order = await control.createOrder({
          status: payment.enabled() ? "draft" : "queued",
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
        /* 截圖等訂單建好、拿到編號才存——存了檔卻建單失敗，那些圖就成了
           沒有人認領的垃圾。存好之後把檔名補回訂單。 */
        const dir = path.join(root, "var", "order-shots", order.id);
        let shotCount = 0;
        const withShots = order.items.map((it, i) => {
          const raw = items[i] && items[i].shot;
          if (!raw) return it;
          try {
            const saved = shots.saveShot(dir, raw);
            if (saved) { shotCount += 1; return { ...it, shot: saved.name }; }
          } catch { /* 存不進去不該讓整張單失敗——文字才是主體 */ }
          return it;
        });
        if (shotCount) await control.setOrderItems(order.id, withShots);

        await control.recordEvent({ kind: "order.created", customerId: customer.id, actor: id.email,
          detail: { orderId: order.id, count: items.length, shots: shotCount } });
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

    /* 建立付款。金額在這一刻定案並寫進訂單——之後調價不該回頭影響
       客戶看到報價才按下付款的那一筆。 */
    if (p === "/api/orders/checkout" && req.method === "POST") {
      /* 收費關著的時候這一路根本不該有人走到。擋在最前面，
         免得關閉期間有殘留的前端或書籤把訂單推進 pending 而卡住。 */
      if (!payment.enabled()) return json(res, 404, { error: "目前不需要付款" });
      const id = visitor.read(req);
      if (!visitor.isNamed(id)) return json(res, 401, { error: "請先登入" });
      const { orderId } = await readBody(req);
      try {
        const order = await control.getOrder(String(orderId || ""));
        if (!order) return json(res, 404, { error: "找不到這張需求單" });
        /* 只能付自己的單。不看前端傳什麼，比對登入身分。 */
        if (order.buyer_email !== id.email) return json(res, 403, { error: "這不是你的需求單" });

        const co = await payment.createCheckout(order);
        if (order.status === "pending") {
          /* 重新開付款頁：換新的 ref，舊的回呼才不會把新的付款蓋掉。 */
          await control.updateCheckoutRef(order.id, co.ref);
          return json(res, 200, { url: co.url, amount: order.amount });
        }
        let price = 30000;
        try { price = Number(JSON.parse(fs.readFileSync(path.join(root, "docs/_state/pricing.json"), "utf8")).perSystem) || 0; }
        catch { /* 讀不到就用預設 */ }
        const amount = price * order.items.length;
        const ok = await control.beginCheckout(order.id, { amount, provider: payment.config().provider || "mock", providerRef: co.ref });
        if (!ok) return json(res, 409, { error: "這張單已經不是待付款的狀態" });
        return json(res, 200, { url: co.url, amount });
      } catch (error) {
        if (error.status) return json(res, error.status, { error: error.message });
        return json(res, 503, { error: "資料庫暫時無法連線" });
      }
    }

    /* 付款回呼。**只做一件事**：把訂單推進 paid。建置交給 worker 主動拉單——
       回呼掉了還有 worker 定期掃，回呼重複了狀態機擋住。
       這一路不看登入身分：金流商打過來時沒有使用者的 cookie，真偽由簽章決定。 */
    if (p === "/api/payment/callback" && (req.method === "POST" || req.method === "GET")) {
      if (!payment.enabled()) return json(res, 404, { error: "目前不需要付款" });
      const body = req.method === "POST"
        ? await readBody(req)
        : Object.fromEntries(new URL(req.url, "http://x").searchParams);
      let v;
      try { v = await payment.verifyCallback(req, body); }
      catch { v = { ok: false }; }
      if (!v.ok || !v.orderId) {
        actions.record({ actor: "金流", action: "付款回呼驗證失敗", status: 400, visitor: who, ip });
        return json(res, 400, { error: "回呼驗證失敗" });
      }
      try {
        const first = await control.markPaid({ orderId: v.orderId, provider: payment.config().provider || "mock", providerRef: v.ref });
        /* 重複的回呼拿到 false，什麼都不做也回 200——對金流商來說這通已經
           成功送達，回錯誤只會讓它一直重送。 */
        if (first) {
          await control.recordEvent({ kind: "order.paid", actor: null, detail: { orderId: v.orderId, ref: v.ref } });
          actions.record({ actor: "金流", action: "付款完成", target: v.orderId, status: 200, visitor: who, ip });
        }
        return json(res, 200, { ok: true, first });
      } catch { return json(res, 503, { error: "資料庫暫時無法連線" }); }
    }

    if (p === "/api/orders" && req.method === "GET") {
      const id = visitor.read(req);
      if (!visitor.isNamed(id)) return json(res, 401, { error: "請先登入" });
      try { return json(res, 200, { orders: await control.listOrders({ buyerEmail: id.email, limit: 50 }) }); }
      catch { return json(res, 503, { error: "資料庫暫時無法連線" }); }
    }

    /* 右上角帳號選單要顯示「我的系統」。只回這個人自己進得去的，
       名單由資料庫的 JOIN 決定而不是前端傳 email——前端傳什麼都不該影響結果。 */
    if (p === "/api/me/systems" && req.method === "GET") {
      const id = visitor.read(req);
      if (!visitor.isNamed(id)) return json(res, 401, { error: "請先登入" });
      try {
        const rows = await control.listInstancesFor(id.email);
        /* 帶上中文名稱。清單上顯示 crossborder-localization-compliance 這種代號，
           使用者認不出那是哪一套——他當初挑的是「跨境商品在地合規上架助手」。 */
        /* 客戶自己改過名字就用他的，沒有才用目錄上的標題。 */
        return json(res, 200, { systems: rows.map((r) => ({ ...r, title: r.display_name || titleFor(r.repo_name) })) });
      }
      catch { return json(res, 200, { systems: [], degraded: true }); }
    }

    /* 用量：token 與空間。兩者來源不同、各自允許失敗——資料庫連不上時
       token 那半仍然讀得到（它在本機檔案裡），沒理由一起變成錯誤。 */
    /* 自己的系統：分享、交付到 GitHub、開 PR。
       每一路都先確認「這套真的是他的」——擁有者才能做這些，一般成員只能用。 */
    {
      const m = /^\/api\/me\/instances\/([a-z0-9_]+)\/(share|deliver|pr)$/.exec(p);
      if (m && req.method === "POST") {
        const [, instanceId, what] = m;
        const id = visitor.read(req);
        if (!visitor.isNamed(id)) return json(res, 401, { error: "請先登入" });
        try {
          const inst = await control.getInstance(instanceId);
          if (!inst) return json(res, 404, { error: "找不到這個系統" });
          const role = await control.memberRole({ customerId: inst.customer_id, email: id.email });
          if (role !== "owner") return json(res, 403, { error: "只有這套系統的擁有者可以做這件事" });

          if (what === "share") {
            /* 分享＝把對方加進使用名單。名單是公司層級的，所以他會看得到這個
               客戶底下所有的系統——這件事要講清楚，不能讓人以為只分享了一套。 */
            const { email } = await readBody(req);
            const members = await control.addMember(inst.customer_id, email);
            await control.recordEvent({ kind: "instance.shared", customerId: inst.customer_id,
              instanceId: inst.id, actor: id.email, detail: { to: String(email || "").slice(0, 190) } });
            return json(res, 200, { members, link: `/-/i/${inst.id}/` });
          }

          /* 交付與 PR 都要跑 git 與 GitHub API，幾十秒到一兩分鐘。
             同步等完再回，前端顯示「處理中」——做成背景工作要多一套查進度的機制，
             而這件事一年做不到幾次。 */
          const argv = [path.join(root, "tools", "instance-deliver.mjs"), `--instance=${inst.id}`];
          if (what === "pr") argv.push("--pr");
          const out = execFileSync(process.execPath, argv, { cwd: root, encoding: "utf8", timeout: 300000 });
          const url = (String(out).match(/https:\/\/github\.com\/[^\s]+/g) || []).pop() || null;
          actions.record({ actor: id.email, action: what === "pr" ? "為自己的系統開 PR" : "把自己的系統交付到 GitHub",
            target: inst.repo_name, status: 200, visitor: who });
          return json(res, 200, { ok: true, url });
        } catch (error) {
          const msg = String(error.stdout || error.stderr || error.message).slice(-400);
          console.error("[me/instance]", msg.slice(0, 200));
          return json(res, 500, { error: "沒有成功，請稍後再試", detail: msg.slice(-200) });
        }
      }
    }

    if (p === "/api/me/usage" && req.method === "GET") {
      const id = visitor.read(req);
      if (!visitor.isNamed(id)) return json(res, 401, { error: "請先登入" });
      const tokens = meUsage.tokensFor(id.email);
      let storage = { files: 0, db: 0, systems: 0, partial: true };
      try {
        const rows = await control.listInstancePathsFor(id.email);
        storage = await meUsage.storageFor(rows, mysql.q);
      } catch { /* 空間算不出來就回 partial，token 照樣給 */ }
      return json(res, 200, { tokens, storage });
    }

    /* 個人資料。顯示名稱人人可改；公司名稱只有擁有者改得動，
       而「是不是擁有者」由資料庫查，不看前端送什麼。 */
    if (p === "/api/me/profile") {
      const id = visitor.read(req);
      if (!visitor.isNamed(id)) return json(res, 401, { error: "請先登入" });
      try {
        if (req.method === "GET") {
          const [prof, cust] = await Promise.all([
            control.getProfile(id.email), control.customerOwnedBy(id.email),
          ]);
          return json(res, 200, {
            email: id.email,
            googleName: id.name || null,
            displayName: (prof && prof.display_name) || null,
            company: cust ? cust.name : null,
            isOwner: Boolean(cust),
            admin: Boolean(google.allowed(auth.conf(), id.email)),
          });
        }
        if (req.method === "PATCH") {
          const body = await readBody(req);
          if ("displayName" in body) await control.setProfile(id.email, { displayName: body.displayName });
          if ("company" in body) {
            const cust = await control.customerOwnedBy(id.email);
            if (!cust) return json(res, 403, { error: "你還沒有自己的公司帳戶" });
            await control.renameCustomer(cust.id, body.company);
          }
          return json(res, 200, { ok: true });
        }
      } catch (error) { return json(res, error.status || 503, { error: error.message || "暫時無法處理" }); }
    }

    /* 使用名單：客戶自己決定公司裡誰進得去他買的系統。
       只有擁有者能看與改——成員看得到同事的信箱就是一種外洩。 */
    if (p === "/api/me/members") {
      const id = visitor.read(req);
      if (!visitor.isNamed(id)) return json(res, 401, { error: "請先登入" });
      try {
        const cust = await control.customerOwnedBy(id.email);
        if (!cust) return json(res, 403, { error: "你還沒有自己的公司帳戶" });
        if (req.method === "GET") return json(res, 200, { members: await control.listMembers(cust.id) });
        if (req.method === "POST") {
          const body = await readBody(req);
          return json(res, 200, { members: await control.addMember(cust.id, body.email) });
        }
        if (req.method === "DELETE") {
          const email = new URL(req.url, "http://x").searchParams.get("email") || "";
          return json(res, 200, { members: await control.removeMember(cust.id, email) });
        }
      } catch (error) { return json(res, error.status || 503, { error: error.message || "暫時無法處理" }); }
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
    /* ── 產線管理（全部限管理者）─────────────────────────
       這一組會啟停服務、改下一批要做什麼題目，權限比看報表嚴格得多，
       所以每一支都自己再確認一次身分，不倚賴上游的頁面閘門。 */
    const adminOk = () => {
      const id = visitor.read(req);
      return Boolean(id && id.email && google.allowed(auth.conf(), id.email)) ? id : null;
    };

    if (p === "/api/admin/agent/state") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      const active = (k) => {
        try { return execFileSync("systemctl", ["--user", "is-active", k], { encoding: "utf8" }).trim(); }
        catch (e) { return String(e.stdout || "unknown").trim(); }
      };
      return json(res, 200, {
        running: active("jvdemo-agent.service") === "active",
        watchdog: active("jvdemo-watchdog.timer") === "active",
        current: (() => { try { return fs.readFileSync(path.join(root, "docs/_state/agent-current.txt"), "utf8").trim(); } catch { return null; } })(),
        direction: agentDir.read(),
        queue: agentQueue.list(200),
      });
    }

    if (p === "/api/admin/agent/power" && req.method === "POST") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      const { action } = await readBody(req);
      if (action !== "start" && action !== "stop") return json(res, 400, { error: "action 只能是 start 或 stop" });
      /* 走既有的腳本而不是直接下 systemctl：停一個產線要同時處理看門狗、
         停止旗標與服務本身，那三件事的順序寫在腳本裡，兩邊各寫一份必然會分岔。 */
      try {
        execFileSync("bash", [path.join(root, "tools", action === "stop" ? "agent-stop.sh" : "agent-start.sh")],
          { cwd: root, encoding: "utf8", timeout: 60000 });
      } catch (error) { return json(res, 500, { error: `執行失敗：${String(error.message).slice(0, 120)}` }); }
      actions.record({ actor: id.email, action: action === "stop" ? "停止產線" : "啟動產線", status: 200, visitor: who });
      return json(res, 200, { ok: true });
    }

    if (p === "/api/admin/agent/direction" && req.method === "PUT") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      const b = await readBody(req);
      const d = agentDir.write(b, id.email);
      actions.record({ actor: id.email, action: "調整生成方向", status: 200, visitor: who,
        detail: `每日 ${d.dailyQuota} 套${d.categories.length ? "／" + d.categories.join("、") : ""}` });
      return json(res, 200, { direction: d });
    }

    if (p === "/api/admin/agent/queue") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      try {
        if (req.method === "GET") return json(res, 200, agentQueue.list(200));
        if (req.method === "POST") {
          const b = await readBody(req);
          return json(res, 201, agentQueue.add(b, id.email, { first: Boolean(b.first) }));
        }
        if (req.method === "PATCH") {
          const b = await readBody(req);
          if (b.promote) return json(res, 200, agentQueue.promote(String(b.slug || "")));
          return json(res, 200, agentQueue.update(String(b.slug || ""), b, id.email));
        }
        if (req.method === "DELETE") {
          const slug = new URL(req.url, "http://x").searchParams.get("slug") || "";
          return json(res, 200, agentQueue.remove(slug));
        }
      } catch (error) { return json(res, error.status || 500, { error: error.message }); }
    }

    /* 客戶從系統右下角助理送出的修改需求。收下來卻沒有人看得到，
       等於沒有收——所以連同截圖一起在後台列出。 */
    if (p === "/api/admin/change-requests") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      try {
        const rows = await mysql.q(
          `SELECT e.id, e.at, e.actor, e.instance_id, e.detail_json, i.repo_name, i.host, c.name AS company
             FROM events e
             LEFT JOIN instances i ON i.id = e.instance_id
             LEFT JOIN customers c ON c.id = e.customer_id
            WHERE e.kind = 'change.request'
            ORDER BY e.at DESC LIMIT 100`);
        return json(res, 200, { requests: rows.map((r) => {
          const d = typeof r.detail_json === "string" ? JSON.parse(r.detail_json || "{}") : (r.detail_json || {});
          return { id: r.id, at: r.at, actor: r.actor, company: r.company, repo: r.repo_name,
            instanceId: r.instance_id, text: d.text || "", screen: d.screen || null, shot: d.shot || null };
        }) });
      } catch { return json(res, 503, { error: "資料庫暫時無法連線" }); }
    }

    /* 截圖檔。檔名只認我們自己產生的格式，路徑組出來之後再確認一次仍在該實例
       的 uploads 底下——檔名是外部輸入，只靠正則擋不夠。 */
    const shotM = /^\/api\/admin\/change-shot\/([a-z0-9_]+)\/([a-z0-9-]+\.(?:png|jpg|webp))$/.exec(p);
    if (shotM) {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      try {
        const inst = await control.getInstance(shotM[1]);
        if (!inst) return json(res, 404, { error: "找不到這個系統" });
        const dir = path.resolve(inst.dir, "uploads");
        const file = path.resolve(dir, shotM[2]);
        if (!file.startsWith(dir + path.sep) || !fs.existsSync(file)) return json(res, 404, { error: "找不到截圖" });
        const ext = path.extname(file).slice(1);
        res.writeHead(200, { "content-type": ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
          "cache-control": "private, max-age=300" });
        return fs.createReadStream(file).pipe(res);
      } catch { return json(res, 500, { error: "讀不到截圖" }); }
    }

    /* 從後台開通一張需求單。狀態由 instance-provision 自己推進——
       兩個人同時按只有一個會贏，那個判斷寫在資料庫的 WHERE 裡。 */
    if (p === "/api/admin/orders/provision" && req.method === "POST") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      const { orderId } = await readBody(req);
      if (!/^o_[a-z0-9_]+$/i.test(String(orderId || ""))) return json(res, 400, { error: "需求單編號不正確" });
      /* 同步等它跑完：開通只是複製檔案與建資料庫，實測幾秒鐘。
         做成背景工作反而要多一套查詢進度的機制，而使用者就站在畫面前面等結果。 */
      try {
        const out = execFileSync(process.execPath,
          [path.join(root, "tools", "instance-provision.mjs"), `--order=${orderId}`],
          { cwd: root, encoding: "utf8", timeout: 300000 });
        actions.record({ actor: id.email, action: "開通需求單", target: orderId, status: 200, visitor: who });
        return json(res, 200, { ok: true, log: String(out).slice(-1200) });
      } catch (error) {
        const msg = String(error.stdout || error.stderr || error.message).slice(-600);
        actions.record({ actor: id.email, action: "開通需求單失敗", target: orderId, status: 500, visitor: who, note: msg.slice(0, 120) });
        return json(res, 500, { error: "開通失敗", log: msg });
      }
    }

    /* 失敗或卡住的單放回可開通狀態。卡在 provisioning 的單沒有人碰得到，
       而卡住的原因常常是外部的（資料庫斷線、磁碟滿），修好之後要能重來。 */
    if (p === "/api/admin/orders/reset" && req.method === "POST") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      const { orderId } = await readBody(req);
      try {
        const ok = await control.resetOrder(String(orderId || ""));
        if (!ok) return json(res, 409, { error: "這張單不是失敗或開通中的狀態" });
        actions.record({ actor: id.email, action: "重設需求單狀態", target: orderId, status: 200, visitor: who });
        return json(res, 200, { ok: true });
      } catch { return json(res, 503, { error: "資料庫暫時無法連線" }); }
    }

    /* 訂單附的截圖。跟客戶實例那邊同一套規則（見 lib/shots.mjs）。 */
    const ordShot = /^\/api\/admin\/order-shot\/([A-Za-z0-9_-]+)\/([a-z0-9-]+\.(?:png|jpg|webp))$/.exec(p);
    if (ordShot) {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      const file = shots.shotPath(path.join(root, "var", "order-shots", ordShot[1]), ordShot[2]);
      if (!file) return json(res, 404, { error: "找不到截圖" });
      res.writeHead(200, { "content-type": shots.MIME[path.extname(file).slice(1)] || "image/jpeg",
        "cache-control": "private, max-age=300" });
      return fs.createReadStream(file).pipe(res);
    }

    /* ── 換裝產線（每套 demo 換一套視覺風格）──────────────
       跑很久，所以只回摘要與最近幾筆，不要把整份狀態檔丟給瀏覽器。 */
    if (p === "/api/admin/restyle/status") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      let st = null;
      try { st = JSON.parse(fs.readFileSync(path.join(root, "docs/_state/restyle.json"), "utf8")); } catch { /* 沒跑過 */ }
      if (!st) return json(res, 200, { started: false });
      /* 狀態檔裡的 running 是「上次結束時寫的」，行程被 kill 掉不會有人更新它。
         真正的答案要看 pid 還在不在。 */
      let alive = false;
      if (st.pid) { try { process.kill(st.pid, 0); alive = true; } catch { alive = false; } }
      const done = (st.done || []).length, failed = (st.failed || []).length;
      const day = new Date().toLocaleDateString("sv");
      const doneToday = (st.daily || {})[day] || 0;
      let quota = 100;
      try { quota = Number(fs.readFileSync(path.join(root, "docs/_state/restyle-quota"), "utf8").trim()) || 100; } catch { /* 用預設 */ }
      return json(res, 200, {
        started: true, running: alive, total: st.total || 0, done, failed,
        doneToday, quota, waiting: Boolean(st.waitingUntilTomorrow),
        workers: st.workers || 0, etaMs: st.etaMs || null,
        startedAt: st.startedAt || null, finishedAt: st.finishedAt || null,
        inFlight: (st.inFlight || []).map((x) => x.repo),
        recentDone: (st.done || []).slice(-6).reverse(),
        recentFailed: (st.failed || []).slice(-6).reverse(),
      });
    }

    if (p === "/api/admin/restyle/power" && req.method === "POST") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      const { action, workers, daily } = await readBody(req);
      /* 配額先落檔再啟動——跑起來之後才改，這一輪不會照新的數字走。 */
      if (daily != null) {
        const q = Math.max(0, Math.min(2000, Number(daily) || 0));
        fs.writeFileSync(path.join(root, "docs/_state/restyle-quota"), `${q}\n`);
      }
      let st = null;
      try { st = JSON.parse(fs.readFileSync(path.join(root, "docs/_state/restyle.json"), "utf8")); } catch { /* 無 */ }
      const alive = st && st.pid && (() => { try { process.kill(st.pid, 0); return true; } catch { return false; } })();

      if (action === "stop") {
        if (!alive) return json(res, 409, { error: "沒有正在跑的換裝" });
        /* SIGTERM 讓它把手上那幾套做完再收工並寫下狀態；SIGKILL 會留下
           改到一半的檔案與對不上的進度。 */
        try { execFileSync("systemctl", ["--user", "stop", "jvdemo-restyle.service"], { timeout: 30000 }); }
        catch { /* 不是用 systemd-run 起的（舊行程）就退回直接送訊號 */
          try { process.kill(st.pid, "SIGTERM"); } catch { /* 已經自己結束了 */ }
        }
        actions.record({ actor: id.email, action: "停止換裝產線", status: 200, visitor: who });
        return json(res, 200, { ok: true });
      }
      if (action === "start") {
        if (alive) return json(res, 409, { error: "換裝已經在跑了" });
        const n = Math.max(1, Math.min(12, Number(workers) || 6));
        /* 用 systemd-run 開成獨立的暫時單元，不要當成 gateway 的子行程。
           caseshow.service 是 KillMode=control-group，只要它重啟一次，
           同一個 cgroup 裡的換裝行程就會一起被收掉——detached + unref 擋不住，
           那只脫離 session 不脫離 cgroup。實測跑到一半就是這樣沒的。 */
        const log = path.join(root, "var", "restyle.log");
        const child = spawnProc("systemd-run", [
          "--user", "--unit=jvdemo-restyle", "--collect",
          `--working-directory=${root}`,
          "bash", "-c",
          `exec ${process.execPath} tools/restyle-demos.mjs --workers=${n} --resume --timeout=1200 >> ${log} 2>&1`,
        ], { cwd: root, detached: true, stdio: "ignore" });
        child.unref();
        actions.record({ actor: id.email, action: "啟動換裝產線", status: 200, visitor: who, detail: `${n} 條線` });
        return json(res, 202, { ok: true });
      }
      return json(res, 400, { error: "action 只能是 start 或 stop" });
    }

    /* ── GitHub 同步管理 ─────────────────────────────────
       站上每個專案都對應一個 GitHub repo，連結早就印在頁面上；repo 不存在
       時訪客點了是 404。這裡讓站主看得到差距並補上。 */
    if (p === "/api/admin/github/status") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      let synced = 0, lastAt = null;
      try {
        const st = JSON.parse(fs.readFileSync(path.join(root, "var", "github-sync.json"), "utf8"));
        /* 這個檔的頂層直接就是 repo → 內容雜湊，沒有外層包裝。 */
        synced = Object.keys(st).length;
        lastAt = fs.statSync(path.join(root, "var", "github-sync.json")).mtime.toISOString();
      } catch { /* 沒同步過就是 0 */ }
      let total = 0;
      try { total = fs.readdirSync(path.join(root, "demos")).filter((d) => d.startsWith("jvision-")).length; } catch { /* 目錄讀不到就回 0 */ }
      return json(res, 200, { total, synced, missing: Math.max(0, total - synced), lastAt,
        running: Boolean(ghSync.child) });
    }

    if (p === "/api/admin/github/sync" && req.method === "POST") {
      const id = adminOk();
      if (!id) return json(res, 403, { error: "限管理者" });
      if (ghSync.child) return json(res, 409, { error: "同步正在進行中" });
      /* 背景跑並 unref：一次補幾十個 repo 要好幾分鐘，讓瀏覽器掛在那裡等
         一定會逾時，而中途斷線不該讓同步半途而廢。 */
      const logPath = path.join(root, "var", "github-sync.log");
      const out = fs.openSync(logPath, "a");
      const child = spawnProc(process.execPath, [path.join(root, "tools", "github-sync.mjs"), "--all"],
        { cwd: root, detached: true, stdio: ["ignore", out, out] });
      child.unref();
      ghSync.child = child;
      ghSync.startedAt = Date.now();
      child.on("exit", (code) => { ghSync.child = null; ghSync.lastCode = code; });
      actions.record({ actor: id.email, action: "手動觸發 GitHub 同步", status: 200, visitor: who });
      return json(res, 202, { ok: true });
    }

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
    /* 後端要知道這次用量該記在誰頭上。身分由這裡驗過再用標頭帶過去，
       後端不自己解 cookie——驗證邏輯只該有一份，而且簽章密鑰不必外流到
       另一個行程。前端送來的同名標頭一律覆蓋掉，不然誰都能冒名。 */
    const actorId = visitor.read(req);
    const up = http.request(
      { host: "127.0.0.1", port, method: req.method, path: req.url,
        headers: { ...req.headers, host: `127.0.0.1:${port}`,
          "x-jv-actor": (actorId && actorId.email) || "" } },
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
