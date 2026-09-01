/**
 * 後台認證。與 api/admin/_auth.js 用同一套契約（cookie jv_admin、
 * payload.簽章、HMAC-SHA256），這樣本機 gateway 與 Vercel 端點行為一致，
 * 同一個前端不必分兩種寫法。
 *
 * 密碼與簽章金鑰放在 var/admin.json（已 gitignore）。AGENTS.md 明文禁止
 * 把密碼寫進專案文件或 commit，所以這個檔不進 repo，也不寫進 systemd unit
 * ——unit 檔是純文字且會被一起備份。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { appendCookie } from "./visitor-auth.mjs";

const COOKIE = "jv_admin";
const TTL_MS = 8 * 60 * 60 * 1000;

let conf = null;

export function load(root) {
  const file = path.join(root, "var", "admin.json");
  if (process.env.JV_ADMIN_PASSWORD) {
    conf = { password: process.env.JV_ADMIN_PASSWORD, secret: process.env.JV_SESSION_SECRET || crypto.randomBytes(32).toString("hex") };
    return { source: "環境變數", ready: true };
  }
  try {
    conf = JSON.parse(fs.readFileSync(file, "utf8"));
    CONF_FILE = file;
    return { source: path.relative(root, file), ready: Boolean(conf.password && conf.secret) };
  } catch {
    conf = null;
    return { source: path.relative(root, file), ready: false };
  }
}

export const ready = () => Boolean(conf?.password && conf?.secret);

/* ── 管理者白名單 ──────────────────────────────────────
   進得了後台的信箱清單。放在 var/admin.json 的 google.allowedEmails，
   跟 clientSecret 與 session secret 同一個檔，所以那個檔是 0600 且不進版控。

   從網頁改這份名單有一個必須擋住的失敗模式：把自己或最後一個人移除掉，
   之後就再也沒有人進得來，而修復方式是登入主機手改檔案。所以下面兩條規則
   不是「防呆」而是硬性限制。 */
let CONF_FILE = null;

export function listAdmins() {
  return (conf?.google?.allowedEmails || []).map((e) => String(e).trim().toLowerCase()).filter(Boolean);
}

function writeConf(next) {
  if (!CONF_FILE) throw Object.assign(new Error("設定來自環境變數，不能從網頁改"), { status: 400 });
  /* 先寫暫存再改名，而且暫存檔一出生就是 0600——先建立再 chmod 的話，
     中間那一瞬間是 0644，而這個檔裡有 clientSecret 與 session secret。 */
  const tmp = `${CONF_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(tmp, CONF_FILE);
  conf = next;
}

export function addAdmin(email) {
  const clean = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean) || clean.length > 190) {
    throw Object.assign(new Error("這不是有效的信箱"), { status: 400 });
  }
  const cur = listAdmins();
  if (cur.includes(clean)) return cur;
  const next = { ...conf, google: { ...(conf.google || {}), allowedEmails: [...cur, clean] } };
  writeConf(next);
  return listAdmins();
}

export function removeAdmin(email, actor) {
  const clean = String(email || "").trim().toLowerCase();
  const cur = listAdmins();
  if (!cur.includes(clean)) return cur;
  /* 移除自己＝把自己鎖在門外。這件事沒有「你確定嗎」可以救，
     因為按下去之後連回來取消的權限都沒了。 */
  if (!actor) {
    /* 認不出操作者就不准移除。舊的 cookie 沒有 email 欄位，這時無法判斷
       他是不是正在移除自己——寧可要求重新登入，也不要冒鎖死後台的風險。 */
    throw Object.assign(new Error("認不出你是哪一個管理者，請重新登入後再操作"), { status: 400 });
  }
  if (clean === String(actor).trim().toLowerCase()) {
    throw Object.assign(new Error("不能移除自己"), { status: 400 });
  }
  /* 名單空了就是誰都進不來，只能登入主機手改檔案。 */
  if (cur.length <= 1) {
    throw Object.assign(new Error("這是最後一個管理者，移除之後就沒有人進得來了"), { status: 400 });
  }
  const next = { ...conf, google: { ...(conf.google || {}), allowedEmails: cur.filter((e) => e !== clean) } };
  writeConf(next);
  return listAdmins();
}

/** 交出設定給其他登入方式用（例如 Google）。回傳的是同一個物件，不要改它。 */
export const conf_ = () => conf;
export { conf_ as conf };

const sign = (value) => crypto.createHmac("sha256", conf.secret).update(value).digest("base64url");

const cookies = (req) => Object.fromEntries(
  String(req.headers.cookie || "").split(";").map((x) => x.trim().split(/=(.*)/s)).filter((x) => x[0]),
);

/* 密碼比對走定長雜湊再 timingSafeEqual。直接比字串會因為提早結束而洩漏
   長度與前綴資訊；timingSafeEqual 又要求兩邊等長，所以先各自雜湊。 */
export function passwordMatches(input) {
  if (!ready()) return false;
  const a = crypto.createHash("sha256").update(String(input)).digest();
  const b = crypto.createHash("sha256").update(String(conf.password)).digest();
  return crypto.timingSafeEqual(a, b);
}

export function verify(req) {
  if (!ready()) return false;
  const token = cookies(req)[COOKIE] || "";
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now(); }
  catch { return false; }
}

/* Secure 只在真的走 HTTPS 時才加。瀏覽器會拒絕在 http:// 上設定 Secure
   cookie，區網用 http://192.168.x.x:3000 進來就會「登入成功但下一個請求
   仍未登入」。對外經 Cloudflare 進來時 x-forwarded-proto 會是 https。 */
const secureFlag = (req) =>
  String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https" ? "; Secure" : "";

/* email 要記進去。原本只存 exp，所以後端完全不知道是哪一個管理者在操作——
   動作紀錄只能寫「管理者」，而「不能移除自己」這道防線更是無從判斷。
   密碼登入認不出人（passwordLogin 目前是關的），那時 email 就是 null。 */
export function setCookie(req, res, email) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS,
    email: email ? String(email).trim().toLowerCase().slice(0, 190) : null })).toString("base64url");
  appendCookie(res, `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly${secureFlag(req)}; SameSite=Lax; Max-Age=${TTL_MS / 1000}`);
}

/** 目前登入的是哪一個管理者。舊的 cookie 沒有這個欄位，回 null。 */
export function currentEmail(req) {
  if (!verify(req)) return null;
  try {
    const token = cookies(req)[COOKIE] || "";
    return JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString()).email || null;
  } catch { return null; }
}

export function clearCookie(req, res) {
  appendCookie(res, `${COOKIE}=; Path=/; HttpOnly${secureFlag(req)}; SameSite=Lax; Max-Age=0`);
}

/* 站台是公開網域，單一共用密碼擋得住路過的人，擋不住有心的暴力嘗試。
   所以同一個來源連續失敗就拉長等待，讓每秒幾千次的嘗試變成不可行。 */
const fails = new Map();
const FORGET_MS = 15 * 60 * 1000;

export function throttle(key) {
  const rec = fails.get(key);
  if (!rec) return 0;
  /* until 為 0 代表「失敗過但還沒到罰站門檻」。原本這裡寫 Date.now() > rec.until，
     0 永遠小於現在，於是每查一次就把紀錄刪掉，次數永遠累積不到 3——限流形同不存在
     （實測連錯五次全部照常回 401）。改成只有真的罰站到期、或很久沒再失敗，才忘記。 */
  if (rec.until && Date.now() >= rec.until) { fails.delete(key); return 0; }
  if (!rec.until && Date.now() - rec.last > FORGET_MS) { fails.delete(key); return 0; }
  return rec.until ? Math.ceil((rec.until - Date.now()) / 1000) : 0;
}

export function noteFail(key) {
  const rec = fails.get(key) || { n: 0, until: 0, last: 0 };
  rec.n += 1;
  rec.last = Date.now();
  if (rec.n >= 3) rec.until = Date.now() + Math.min(300, 2 ** (rec.n - 2)) * 1000;
  fails.set(key, rec);
}
export const noteSuccess = (key) => fails.delete(key);
