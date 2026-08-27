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

export function clear(req, res) {
  appendCookie(res, `${COOKIE}=; Path=/; HttpOnly${secureFlag(req)}; SameSite=Lax; Max-Age=0`);
}

/* 入口頁自己、身分相關的 API、以及靜態資源要放行。資源不放行的話入口頁
   自己的樣式與圖也會被擋，畫面直接壞掉；而擋住資源本來也擋不到任何東西
   ——內容在 HTML 裡，不在 css 裡。 */
const ASSET = /\.(css|js|mjs|map|svg|png|jpe?g|webp|gif|ico|woff2?|txt|json)$/i;
// login-preview 是「新版前導動畫」的預覽頁,本質是登入頁的候選版,登入前就要看得到
const OPEN_PATHS = new Set(["/welcome", "/welcome.html", "/login-preview", "/login-preview.html", "/favicon.svg", "/robots.txt"]);

export function needsGate(pathname) {
  if (OPEN_PATHS.has(pathname)) return false;
  if (pathname.startsWith("/api/")) return false;          // API 各自有自己的權限判斷
  if (pathname.startsWith("/admin")) return false;         // 後台走 jv_admin，不經進站閘門
  if (ASSET.test(pathname)) return false;
  return true;
}

/** 寫進動作紀錄用的顯示名稱。 */
export const labelOf = (id) => (id?.kind === "google" ? (id.email || "google 使用者") : "訪客");
