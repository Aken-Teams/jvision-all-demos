/**
 * 動作紀錄：站上發生的每一件事都寫這裡，管理後台讀它。
 *
 * 與 usage-log 的分工：usage-log 是「訪客看了哪些 demo」的彙總統計，
 * 只收 GET 的頁面瀏覽；這裡收的是**動作**——誰在什麼時候做了什麼，
 * 包含後台登入、Agent 的每一個開發階段、上架、失敗。兩者的保存期限與
 * 讀取方式都不同，混在同一個檔裡會讓彙總統計被大量 agent 事件稀釋。
 *
 * IP 政策（2026-08-28 依站主指示變更）：記錄訪客來訪 IP。紀錄檔在已
 * gitignore 的 var/，不進版控——AGENTS.md 禁的是把位址寫進專案文件與 commit，
 * 執行期資料不在此限。雜湊訪客碼保留：它跨欄位聚合仍然好用。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const SALT = crypto.randomBytes(16).toString("hex");
const MAX_LINES = 200_000;

let file = null;
let stream = null;

export function open(root) {
  const dir = path.join(root, "var");
  fs.mkdirSync(dir, { recursive: true });
  file = path.join(dir, "actions.jsonl");
  rotateIfHuge();
  stream = fs.createWriteStream(file, { flags: "a" });
  return file;
}

/* 這個檔會一直長。超過上限就把舊的砍掉只留後半——後台看的是近期動作，
   而無限成長的 jsonl 會讓每次讀取都變慢。 */
function rotateIfHuge() {
  try {
    if (!fs.existsSync(file)) return;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    if (lines.length <= MAX_LINES) return;
    fs.writeFileSync(file, lines.slice(-Math.floor(MAX_LINES / 2)).join("\n"));
  } catch { /* 輪替失敗不影響記錄 */ }
}

export const visitorOf = (ip) =>
  crypto.createHash("sha256").update(SALT + String(ip || "")).digest("hex").slice(0, 8);

/**
 * 訪客的真實 IP。對外流量經 Cloudflare 隧道進來，socket 位址永遠是
 * 127.0.0.1——真實位址在 CF-Connecting-IP；區網直連才用 socket 位址。
 * X-Forwarded-For 只信第一段（後段可被客戶端偽造附加）。
 */
export function ipOf(req) {
  const cf = req.headers?.["cf-connecting-ip"];
  if (cf) return String(cf).trim();
  const xff = req.headers?.["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return String(req.socket?.remoteAddress || "").replace(/^::ffff:/, "");
}

/**
 * 寫一筆動作。永遠不可讓記錄失敗影響到服務。
 * @param {{actor:string,action:string,target?:string,status?:string|number,note?:string,ms?:number,visitor?:string,device?:string}} entry
 */
export function record(entry) {
  try {
    const line = JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n";
    if (stream) stream.write(line);
    else if (file) fs.appendFileSync(file, line);
  } catch { /* 記錄失敗不能影響服務 */ }
}

/** 給 CLI 用：不經 open() 也能寫。 */
export function recordTo(root, entry) {
  const dir = path.join(root, "var");
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, "actions.jsonl"),
    JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
}

/** 讀回近期動作。後台要的是「最近發生什麼」，所以從檔尾往前取。 */
export function read({ root, limit = 300, actor = null, action = null, since = null } = {}) {
  const target = file || path.join(root, "var", "actions.jsonl");
  if (!fs.existsSync(target)) return { available: false, rows: [], note: "尚無動作紀錄。" };
  const sinceMs = since ? Date.parse(since) : 0;
  const rows = [];
  const lines = fs.readFileSync(target, "utf8").split("\n");
  /* 檔案不保證按時間排序：補入的歷史紀錄、以及多個程序同時 append，都會讓
     時間跳來跳去。所以不能靠「掃到比 since 舊就 break」，也不能直接把檔尾
     當成最新——要多掃一些再自己排。掃描量設為要求筆數的 6 倍並至少 5000 行，
     足以涵蓋交錯，又不必為了看 300 筆而讀完 20 萬行。 */
  const scan = Math.max(5000, limit * 6);
  const stop = Math.max(0, lines.length - scan);
  for (let i = lines.length - 1; i >= stop; i -= 1) {
    if (!lines[i]) continue;
    try {
      const r = JSON.parse(lines[i]);
      if (actor && r.actor !== actor) continue;
      if (action && r.action !== action) continue;
      if (sinceMs && Date.parse(r.at) < sinceMs) continue;
      rows.push(r);
    } catch { /* 略過壞行 */ }
  }
  rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  rows.length = Math.min(rows.length, limit);
  const counts = {};
  for (const r of rows) counts[r.actor] = (counts[r.actor] || 0) + 1;
  return { available: true, rows, counts, total: rows.length };
}
