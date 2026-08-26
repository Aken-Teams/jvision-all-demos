#!/usr/bin/env node
/**
 * 把本站專案在 JVision-pj 底下的 repo 預設分支統一成 main。
 *
 * 背景：同步工具把內容推上 main，但 414 個舊 repo 的預設分支是 master——
 * 訪客打開看到的還是舊內容。這支只處理「main 已存在」的（同步推過才有 main），
 * 還沒推到的會 422，留給下一輪。冪等，可重跑。
 *
 *   node tools/github-fix-default-branch.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
const ROOT = path.resolve(import.meta.dirname, "..");
const DRY = process.argv.includes("--dry-run");
const m = /^GITHUB_TOKEN=(.+)$/m.exec(fs.readFileSync(path.join(ROOT, ".env"), "utf8"));
const TOKEN = process.env.GITHUB_TOKEN || m?.[1]?.trim();
if (!TOKEN) { console.error("✖ 沒有 GITHUB_TOKEN"); process.exit(3); }
const mine = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, "projects-index.json"), "utf8")).projects.map((p) => p.repoName));
async function api(p, o = {}) {
  const r = await fetch(`https://api.github.com${p}`, { ...o, headers: { accept: "application/vnd.github+json",
    authorization: `Bearer ${TOKEN}`, "x-github-api-version": "2022-11-28", "content-type": "application/json" },
    signal: AbortSignal.timeout(30000) });
  const remaining = Number(r.headers.get("x-ratelimit-remaining") || 999);
  if (remaining < 100) await new Promise((s2) => setTimeout(s2, Math.max(0, Number(r.headers.get("x-ratelimit-reset") || 0) * 1000 - Date.now()) + 5000));
  return { status: r.status, data: await r.json().catch(() => ({})) };
}
let fixed = 0, waiting = 0, failed = 0, page = 1;
for (;;) {
  const r = await api(`/orgs/JVision-pj/repos?per_page=100&page=${page}`);
  if (r.status !== 200 || !r.data.length) break;
  for (const x of r.data) {
    if (!mine.has(x.name) || x.default_branch === "main") continue;
    if (DRY) { fixed += 1; continue; }
    const fix = await api(`/repos/JVision-pj/${x.name}`, { method: "PATCH", body: JSON.stringify({ default_branch: "main" }) });
    if (fix.status === 200) fixed += 1;
    else if (fix.status === 422) waiting += 1;   // main 還沒被推上去，下一輪再補
    else { failed += 1; console.error(`  ✖ ${x.name}：${fix.status} ${fix.data?.message || ""}`); }
  }
  page += 1;
}
console.log(`完成：扳正 ${fixed}、main 尚未推上（待下一輪）${waiting}、失敗 ${failed}`);
