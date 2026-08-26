#!/usr/bin/env node
/**
 * 把 JVision-pj 底下屬於本站專案的私有 repo 翻成公開。
 *
 * 為什麼需要這支：全量同步啟動時用的是還不會翻公開的舊版程式，途中修了工具
 * 但行程已載入舊碼——與其中斷重跑六小時，不如跑完後補這一刀。冪等，可重跑。
 *
 *   node tools/github-publicize.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DRY = process.argv.includes("--dry-run");
const m = /^(?:GITHUB_TOKEN|GH_TOKEN)=(.+)$/m.exec(fs.readFileSync(path.join(ROOT, ".env"), "utf8"));
const TOKEN = process.env.GITHUB_TOKEN || m?.[1]?.trim();
if (!TOKEN) { console.error("✖ 沒有 GITHUB_TOKEN"); process.exit(3); }

const mine = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, "projects-index.json"), "utf8"))
  .projects.map((p) => p.repoName));

async function api(pathname, options = {}) {
  const res = await fetch(`https://api.github.com${pathname}`, {
    ...options,
    headers: { accept: "application/vnd.github+json", authorization: `Bearer ${TOKEN}`,
      "x-github-api-version": "2022-11-28", "content-type": "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  const remaining = Number(res.headers.get("x-ratelimit-remaining") || 999);
  if (remaining < 100) {
    const reset = Number(res.headers.get("x-ratelimit-reset") || 0) * 1000;
    await new Promise((r) => setTimeout(r, Math.max(0, reset - Date.now()) + 5000));
  }
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

/* 用列表而不是逐一 GET：1,500 次查詢 vs 每頁 100 筆的 16 次。type=private
   只回私有的，要翻的目標一次到齊。 */
let flipped = 0, skippedForeign = 0, failed = 0, page = 1;
for (;;) {
  const r = await api(`/orgs/JVision-pj/repos?type=private&per_page=100&page=${page}`);
  if (r.status !== 200) { console.error(`✖ 列表失敗 ${r.status}：${r.data?.message}`); process.exit(1); }
  if (!r.data.length) break;
  for (const repo of r.data) {
    if (!mine.has(repo.name)) { skippedForeign += 1; continue; }   // 不是本站的專案不動
    if (DRY) { console.log(`  將翻公開：${repo.name}`); flipped += 1; continue; }
    const fix = await api(`/repos/JVision-pj/${repo.name}`, { method: "PATCH", body: JSON.stringify({ private: false }) });
    if (fix.status === 200) { flipped += 1; }
    else { failed += 1; console.error(`  ✖ ${repo.name}：${fix.status} ${fix.data?.message || ""}`); }
  }
  page += 1;
}
console.log(`完成：翻公開 ${flipped}、非本站專案略過 ${skippedForeign}、失敗 ${failed}`);
