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
    return { source: path.relative(root, file), ready: Boolean(conf.password && conf.secret) };
  } catch {
    conf = null;
    return { source: path.relative(root, file), ready: false };
  }
}

export const ready = () => Boolean(conf?.password && conf?.secret);

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

export function setCookie(req, res) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS })).toString("base64url");
  appendCookie(res, `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly${secureFlag(req)}; SameSite=Lax; Max-Age=${TTL_MS / 1000}`);
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
