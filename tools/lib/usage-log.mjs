/**
 * 使用狀況記錄：誰在什麼時候開了哪個 demo。
 *
 * 掛在 tools/dev.mjs 的 gateway 上，所以區網任何一台機器連進來都會被記到，
 * 不需要在 1011 個 demo 裡各埋一段追蹤碼。
 *
 * IP 政策（2026-08-28 依站主指示變更）：一併記錄來訪 IP（真實位址取法見
 * action-log 的 ipOf——經 Cloudflare 進來要讀 CF-Connecting-IP）。紀錄檔在
 * 已 gitignore 的 var/，不進版控。雜湊訪客碼保留用於彙總統計。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ipOf } from "./action-log.mjs";

const SALT = crypto.randomBytes(16).toString("hex");
const IGNORE = /\.(css|js|mjs|json|svg|png|jpe?g|webp|gif|ico|woff2?|map|txt)$/i;

let logPath = null;
let stream = null;

/** @param {string} root 專案根目錄 */
export function open(root) {
  const dir = path.join(root, "var");
  fs.mkdirSync(dir, { recursive: true });
  logPath = path.join(dir, "usage.jsonl");
  stream = fs.createWriteStream(logPath, { flags: "a" });
  return logPath;
}

const visitorOf = (ip) =>
  crypto.createHash("sha256").update(SALT + String(ip || "")).digest("hex").slice(0, 8);

/** 只認 demo 頁與站上主要頁面，靜態資源全部略過。 */
function classify(pathname) {
  const demo = pathname.match(/^\/demos\/([^/]+)\/?$/) || pathname.match(/^\/demos\/([^/]+)\/index\.html$/);
  if (demo) return { kind: "demo", target: demo[1] };
  if (IGNORE.test(pathname)) return null;
  const page = pathname === "/" ? "index" : pathname.replace(/^\//, "").replace(/\.html$/, "");
  if (page.includes("/")) return null;
  return { kind: "page", target: page || "index" };
}

/** 由 gateway 對每個請求呼叫一次。永遠不可讓記錄失敗影響到頁面回應。 */
export function record(req, statusCode) {
  try {
    if (!stream || req.method !== "GET") return;
    const pathname = decodeURIComponent(String(req.url || "/").split("?")[0]);
    const hit = classify(pathname);
    if (!hit) return;
    const ua = String(req.headers["user-agent"] || "");
    stream.write(JSON.stringify({
      at: new Date().toISOString(),
      kind: hit.kind,
      target: hit.target,
      status: statusCode,
      visitor: visitorOf(req.socket?.remoteAddress),
      ip: ipOf(req),
      device: /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop",
      referer: (req.headers.referer || "").replace(/^https?:\/\/[^/]+/, "") || null,
    }) + "\n");
  } catch { /* 記錄失敗不能影響服務 */ }
}

/** 讀回並彙總。回傳結構直接餵給管理頁，前端不做計算。 */
export function summarize({ root, days = 14, top = 20 } = {}) {
  const file = logPath || path.join(root, "var", "usage.jsonl");
  if (!fs.existsSync(file)) {
    return { available: false, note: "尚無使用紀錄。請以 npm run dev 啟動，經 gateway 造訪過的頁面才會被記錄。" };
  }
  const since = Date.now() - days * 86400000;
  const rows = [];
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line) continue;
    try {
      const r = JSON.parse(line);
      if (Date.parse(r.at) >= since) rows.push(r);
    } catch { /* 略過壞行 */ }
  }

  const demos = new Map();
  const pages = new Map();
  const byDay = new Map();
  const byHour = new Array(24).fill(0);
  const visitors = new Set();
  const device = { mobile: 0, desktop: 0 };

  for (const r of rows) {
    visitors.add(r.visitor);
    device[r.device] = (device[r.device] || 0) + 1;
    byHour[new Date(r.at).getHours()] += 1;
    const day = r.at.slice(0, 10);
    const d = byDay.get(day) || { date: day, views: 0, visitors: new Set() };
    d.views += 1;
    d.visitors.add(r.visitor);
    byDay.set(day, d);

    const bucket = r.kind === "demo" ? demos : pages;
    const b = bucket.get(r.target) || { target: r.target, views: 0, visitors: new Set(), last: r.at };
    b.views += 1;
    b.visitors.add(r.visitor);
    if (r.at > b.last) b.last = r.at;
    bucket.set(r.target, b);
  }

  const flat = (m) => [...m.values()]
    .map((b) => ({ target: b.target, views: b.views, visitors: b.visitors.size, last: b.last }))
    .sort((a, b) => b.views - a.views);

  return {
    available: true,
    generatedAt: new Date().toISOString(),
    windowDays: days,
    totals: {
      views: rows.length,
      visitors: visitors.size,
      demoViews: rows.filter((r) => r.kind === "demo").length,
      distinctDemos: demos.size,
      device,
    },
    byDay: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ date: d.date, views: d.views, visitors: d.visitors.size })),
    byHour,
    topDemos: flat(demos).slice(0, top),
    topPages: flat(pages).slice(0, top),
    recent: rows.slice(-40).reverse(),
  };
}
