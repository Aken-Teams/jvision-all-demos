/**
 * 子網域的開關：c-xxx.jvision-ai.com 什麼時候存在。
 *
 * ── 為什麼這件事要獨立出來 ────────────────────────────
 * 這段程式以前長在開通流程裡（instance-provision.mjs），意思是**開通的當下
 * 子網域就上線了**。使用者根本還沒決定要不要對外，網址已經在公開的 DNS 上
 * 查得到——他會覺得「我沒有要佈署，你已經幫我佈署了」。那是一種很合理的驚嚇：
 * 上線與否應該是他按下去的那一刻決定的，不是系統替他決定的。
 *
 * 所以現在的規則只有一條：**按下「佈署」才建 DNS，取消佈署就刪掉。**
 * 沒按過的實例，路徑式入口（/-/i/<id>/）照樣進得去——那條路要登入、要在
 * 白名單裡，不是公開的東西。子網域才是「對外」的那一步。
 *
 * ── 為什麼不用萬用 DNS ────────────────────────────────
 * *.jvision-ai.com 會把整個公司網域的任何子網域都指到這條 tunnel，www、app、
 * npm 這些真正的服務只要哪天記錄出問題就會被接管。逐筆建立的成本，只是部署
 * 時多打一次 API。
 *
 * ── 憑證從哪來 ────────────────────────────────────────
 * 用 cloudflared 登入時留下的 ~/.cloudflared/cert.pem。它裡面就帶著一組限定在
 * 這個 zone 的 apiToken，不必再另外發一把、也不必多一個環境變數要維護。
 * 讀不到就當作「不能改 DNS」——部署會失敗並說清楚原因，而不是默默假裝成功。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/* tunnel 編號。與 ~/.cloudflared/jvdemo.yml 裡的同一條，改那個檔要一起改。 */
export const TUNNEL_ID = "1909ee29-c8dd-499b-bad0-d1cdf5b8151e";
const TARGET = `${TUNNEL_ID}.cfargotunnel.com`;
const API = "https://api.cloudflare.com/client/v4";

let cached = null;
/** 從 cert.pem 取出 zone 與 token。失敗回 null，呼叫端自己決定怎麼講。 */
function creds() {
  if (cached !== null) return cached || null;
  try {
    const pem = fs.readFileSync(path.join(os.homedir(), ".cloudflared", "cert.pem"), "utf8");
    const b64 = pem.replace(/-----[A-Z ]*-----/g, "").replace(/\s/g, "");
    const j = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    cached = j.zoneID && j.apiToken ? { zone: j.zoneID, token: j.apiToken } : false;
  } catch { cached = false; }
  return cached || null;
}

async function call(p, init = {}) {
  const c = creds();
  if (!c) throw new Error("找不到 Cloudflare 憑證（~/.cloudflared/cert.pem）");
  const r = await fetch(`${API}/zones/${c.zone}${p}`, {
    ...init,
    headers: { Authorization: `Bearer ${c.token}`, "content-type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(20000),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.success) {
    const why = (j.errors || []).map((e) => e.message).join("；") || `HTTP ${r.status}`;
    throw new Error(why);
  }
  return j.result;
}

/* 只准動 c- 開頭的。這個 zone 裡還有公司的信箱、vpn、app、npm——
   一個算錯的主機名就能把它們刪掉，所以每一條進出的路徑都要再確認一次。 */
function guard(host) {
  const h = String(host || "").trim().toLowerCase();
  if (!/^c-[a-z0-9-]+\.jvision-ai\.com$/.test(h)) throw new Error(`不是實例子網域：${host}`);
  return h;
}

/** 這個主機名現在在不在 DNS 上。回記錄本身或 null。 */
export async function find(host) {
  const h = guard(host);
  const rows = await call(`/dns_records?type=CNAME&name=${encodeURIComponent(h)}`);
  return rows[0] || null;
}

/** 讓這個子網域上線。已經在了就直接回，重按部署不會出事。 */
export async function publish(host) {
  const h = guard(host);
  const has = await find(h);
  if (has) return { host: h, id: has.id, created: false };
  const rec = await call("/dns_records", {
    method: "POST",
    body: JSON.stringify({ type: "CNAME", name: h, content: TARGET, proxied: true, ttl: 1 }),
  });
  return { host: h, id: rec.id, created: true };
}

/** 讓這個子網域下線。本來就不在也算成功——目的是「不要存在」。 */
export async function unpublish(host) {
  const h = guard(host);
  const has = await find(h);
  if (!has) return { host: h, removed: false };
  await call(`/dns_records/${has.id}`, { method: "DELETE" });
  return { host: h, removed: true };
}
