/**
 * 用 Google 帳號登入後台（OpenID Connect 授權碼流程）。
 *
 * 換到 session 之後就與密碼登入共用同一組 cookie，後台其他地方不必分辨
 * 使用者是怎麼進來的。
 *
 * 安全上最關鍵的一件事是**白名單**：沒有白名單的話，任何一個 Google 帳號
 * 都能登入你的後台——OAuth 只證明「這個人是某個 Google 使用者」，不代表
 * 「這個人可以管理這個站」。白名單放在 var/admin.json（已 gitignore）。
 */
import crypto from "node:crypto";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/* state 與 nonce 存在記憶體就好：它們的壽命只有一次跳轉往返，而且重啟服務時
   本來就該讓進行到一半的登入失效。10 分鐘沒用掉就清掉。 */
const pending = new Map();
const TTL_MS = 10 * 60 * 1000;

function sweep() {
  const now = Date.now();
  for (const [k, v] of pending) if (now - v.at > TTL_MS) pending.delete(k);
}

export function configured(conf) {
  return Boolean(conf?.google?.clientId && conf?.google?.clientSecret);
}

/** 允許登入的信箱。沒設或設成空陣列時一律拒絕——寧可沒人進得來，也不要誰都進得來。 */
export function allowed(conf, email) {
  const list = (conf?.google?.allowedEmails || []).map((e) => String(e).trim().toLowerCase());
  if (!list.length) return false;
  return list.includes(String(email || "").trim().toLowerCase());
}

/** 這次請求對外的網址前綴。經 Cloudflare 進來時 host 是對外網域、proto 是 https。 */
export function originOf(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim()
    || (req.socket?.encrypted ? "https" : "http");
  const host = req.headers.host || "localhost";
  return `${proto}://${host}`;
}

export const redirectUri = (req) => `${originOf(req)}/api/admin/google/callback`;

/** 產生授權網址，並把 state / nonce 記下來等回呼比對。 */
export function startUrl(conf, req, next, purpose = "admin") {
  sweep();
  const state = crypto.randomBytes(16).toString("base64url");
  const nonce = crypto.randomBytes(16).toString("base64url");
  /* purpose 決定回呼後發哪一種身分。不記在 state 裡而是記在伺服器端，
     是因為 state 會出現在網址上——放在網址上的東西使用者就能改。 */
  pending.set(state, { nonce, purpose, at: Date.now(), next: next || "/", redirect: redirectUri(req) });
  const q = new URLSearchParams({
    client_id: conf.google.clientId,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    state, nonce,
    prompt: "select_account",
  });
  return `${AUTH_URL}?${q}`;
}

export function takePending(state) {
  sweep();
  const rec = pending.get(state);
  if (rec) pending.delete(state);   // state 只能用一次
  return rec || null;
}

/**
 * 拿授權碼換 id_token 並取出信箱。
 *
 * 這裡沒有自己驗 id_token 的簽章：token 是我們用 client secret 走 HTTPS 直接向
 * Google 的 token endpoint 換來的，Google 的文件明文說明這種情況下不需要再驗簽
 * （簽章驗證是為了「從別處收到 token」的場景）。所以只解出 payload 讀 email。
 */
export async function exchange(conf, code, rec) {
  const body = new URLSearchParams({
    code,
    client_id: conf.google.clientId,
    client_secret: conf.google.clientSecret,
    redirect_uri: rec.redirect,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || `Google 回應 ${res.status}`);
  if (!data.id_token) throw new Error("Google 沒有回傳 id_token");

  const part = String(data.id_token).split(".")[1];
  if (!part) throw new Error("id_token 格式不正確");
  const claims = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

  if (claims.nonce !== rec.nonce) throw new Error("nonce 不符，可能是重放攻擊");
  if (claims.aud !== conf.google.clientId) throw new Error("aud 不符");
  if (!["accounts.google.com", "https://accounts.google.com"].includes(claims.iss)) throw new Error("iss 不符");
  if (claims.email_verified === false) throw new Error("這個 Google 帳號的信箱尚未驗證");

  return { email: claims.email, name: claims.name || claims.email };
}
