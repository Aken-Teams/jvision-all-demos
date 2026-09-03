/**
 * 進站身分：訪客或 Google 具名使用者。
 *
 * 與後台的 jv_admin 完全分開，這點很重要——用 Google 登入只證明「你是誰」，
 * 不代表你能管理這個站。後台仍然只認 var/admin.json 的白名單。
 *
 * 訪客身分是刻意放行的：這是對外的展示站，把潛在客戶擋在門外就本末倒置了。
 * 登入的意義在於「願意具名的人，我們知道他看了什麼」，而不是收費牆。
 */
import crypto from "node:crypto";

/**
 * 追加一個 Set-Cookie，而不是覆蓋。
 *
 * Set-Cookie 是少數可以重複出現的標頭，而 res.setHeader 的語意是「設定」——
 * 連續發兩個 cookie 時，第二個會把第一個整個蓋掉。實測 Google 回呼裡先發訪客
 * 身分、再發後台身分（信箱在白名單時），訪客 cookie 就這樣消失了，於是登入
 * 成功卻進不了站，被進站閘門踢回入口頁，變成無限循環。
 */
export function appendCookie(res, value) {
  const prev = res.getHeader("Set-Cookie");
  if (!prev) res.setHeader("Set-Cookie", [value]);
  else res.setHeader("Set-Cookie", (Array.isArray(prev) ? prev : [prev]).concat(value));
}

const COOKIE = "jv_visitor";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;   // 30 天，展示站不需要每天重登

let secret = null;
export function init(s) { secret = s; }

const sign = (v) => crypto.createHmac("sha256", secret || "").update(v).digest("base64url");

const cookies = (req) => Object.fromEntries(
  String(req.headers.cookie || "").split(";").map((x) => x.trim().split(/=(.*)/s)).filter((x) => x[0]),
);

/** 這個身分算不算數。全站已改為只接受 Google 具名登入，訪客身分不再放行。
    舊的訪客 cookie 還在瀏覽器裡，所以不能只看「有沒有 cookie」——要看 kind。 */
export const isNamed = (id) => Boolean(id && id.kind === "google");

/** 讀出目前的進站身分；沒有或驗不過回 null。 */
export function read(req) {
  if (!secret) return null;
  const token = cookies(req)[COOKIE] || "";
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    return claims.exp > Date.now() ? claims : null;
  } catch { return null; }
}

/* Secure 只在真的走 HTTPS 時才加：瀏覽器會拒絕在 http:// 上設定 Secure cookie，
   區網用 http://192.168.x.x:3000 進來會變成「選了身分卻一直被退回入口頁」。 */
const secureFlag = (req) =>
  String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https" ? "; Secure" : "";

export function issue(req, res, identity) {
  const payload = Buffer.from(JSON.stringify({ ...identity, exp: Date.now() + TTL_MS })).toString("base64url");
  appendCookie(res, `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly${secureFlag(req)}; SameSite=Lax; Max-Age=${TTL_MS / 1000}`);
}

/**
 * 跨子網域的登入交接票。
 *
 * ── 為什麼需要 ────────────────────────────────────────
 * 客戶系統住在 c-xxx.jvision-ai.com，登入 cookie 卻是 host-only（只認發出它的
 * 那個主機名）。所以在主站登入完，走到子網域時等於沒登入，又被送去登入——
 * 無限重導。而且 Google OAuth 的 redirect_uri 不接受萬用字元，子網域根本
 * 沒辦法自己跑一次登入。
 *
 * ── 為什麼不直接把 cookie 放寬成 Domain=.jvision-ai.com ────
 * 那樣主站的登入 cookie 會**跟著送到每一個客戶子網域**。客戶系統的 HTML 是
 * 可以被助理改的，等於把主站身分擺在客戶內容旁邊——一個網域出事，全部一起
 * 出事。省下的只是這幾十行，換掉的是整條信任邊界，不划算。
 *
 * ── 這張票的形狀 ──────────────────────────────────────
 * 登入在主站完成（OAuth 設定完全不用動），主站簽一張只活 90 秒的票送回子網域，
 * 子網域驗完發**自己的** host-only cookie。之後兩邊各管各的 cookie，誰也拿不到誰的。
 *
 * 票綁死目標主機名：對 A 系統簽的票拿去 B 系統會驗不過，撿到網址也換不到
 * 別套系統的身分。90 秒是「跳一次轉址」綽綽有餘、但來不及被轉貼利用的長度。
 * 真正的權限仍然每次都查（memberRole），票只證明「你是誰」。
 */
const HANDOFF_MS = 90 * 1000;

export function handoff(identity, host) {
  if (!secret || !identity || !host) return null;
  const body = Buffer.from(JSON.stringify({
    kind: "google", email: identity.email, name: identity.name,
    host: String(host).toLowerCase(), exp: Date.now() + HANDOFF_MS,
  })).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** 驗票。給的主機名要跟票上的一致，否則不算數。 */
export function readHandoff(token, host) {
  if (!secret) return null;
  const [body, sig] = String(token || "").split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const c = JSON.parse(Buffer.from(body, "base64url").toString());
    if (c.exp <= Date.now()) return null;
    if (c.host !== String(host || "").toLowerCase()) return null;
    return { kind: "google", email: c.email, name: c.name };
  } catch { return null; }
}

export function clear(req, res) {
  appendCookie(res, `${COOKIE}=; Path=/; HttpOnly${secureFlag(req)}; SameSite=Lax; Max-Age=0`);
}

/* 入口頁自己、身分相關的 API、以及靜態資源要放行。資源不放行的話入口頁
   自己的樣式與圖也會被擋，畫面直接壞掉；而擋住資源本來也擋不到任何東西
   ——內容在 HTML 裡，不在 css 裡。 */
/* json 不在資產豁免裡。完整目錄與每套規格都是 .json——整類放行等於爬蟲
   不用登入就能把整站資料抱走（實測 2.9MB 的 projects-index 匿名可下載）。
   登入後的頁面帶著 cookie 抓 json 照樣通行，被擋的只有匿名者。 */
const ASSET = /\.(css|js|mjs|map|svg|png|jpe?g|webp|gif|ico|woff2?|txt)$/i;
// login-preview 是「新版前導動畫」的預覽頁,本質是登入頁的候選版,登入前就要看得到
const OPEN_PATHS = new Set(["/welcome", "/welcome.html", "/login-preview", "/login-preview.html", "/favicon.svg", "/robots.txt",
  /* 入口頁登入前要顯示站上總數，只開這一個彙總檔——裡面沒有任何單一專案的完整內容 */
  "/content/recent-projects.json"]);

/* 匿名瀏覽已關閉：進站一律要用 Google 帳號登入。
   原本有一份 BROWSE 白名單（首頁、目錄、專案頁、demo、catalog-index.json…），
   讓沒登入的人也看得到型錄；現在整份移除。

   還開著的只剩「登入本身需要的東西」，就是下面 needsGate 的四個例外：
   入口頁與它要用的那幾個檔、身分 API、後台（走自己的 jv_admin）、靜態資源。
   少了任何一項，入口頁自己就畫不出來或送不出去，結果是誰都進不來——
   關閉匿名瀏覽最容易踩的就是這個。

   代價：搜尋引擎爬不到型錄了。首頁 <title> 那句「N 個 AI 產業系統」
   之後只有登入過的人看得到，爬蟲看到的是入口頁。 */

export function needsGate(pathname) {
  if (OPEN_PATHS.has(pathname)) return false;              // 入口頁與它要用的那幾個檔
  if (pathname.startsWith("/api/")) return false;          // API 各自有自己的權限判斷
  if (pathname.startsWith("/admin")) return false;         // 後台走 jv_admin，不經進站閘門
  if (ASSET.test(pathname)) return false;
  return true;
}

/** 寫進動作紀錄用的顯示名稱。 */
export const labelOf = (id) => (id?.kind === "google" ? (id.email || "google 使用者") : "訪客");
