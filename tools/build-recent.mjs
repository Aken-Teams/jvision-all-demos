#!/usr/bin/env node
/**
 * 產生首頁要用的「最近新增」資料。
 *
 * 上架時間只有 DEMO_FORGE_MANIFEST 有（967 筆都有 publishedAt），projects-index
 * 本身沒有日期欄位。所以以 manifest 為時間來源，再回 projects-index 取實際上架的
 * 標題與網址——manifest 裡也有做壞、被排除的項目，那些不該出現在首頁。
 *
 *   node tools/build-recent.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

const catalog = read("projects-index.json");
const published = new Map(catalog.projects.map((p) => [p.repoName, p]));

let entries = [];
try { entries = read("docs/DEMO_FORGE_MANIFEST.json").entries || []; } catch { /* 還沒有就當空的 */ }

const rows = entries
  .filter((e) => e.publishedAt && published.has(e.repoName))
  .map((e) => {
    const p = published.get(e.repoName);
    return {
      repoName: e.repoName,
      title: p.title,
      category: p.category || e.category,
      demoUrl: p.demoUrl,
      at: e.publishedAt,
    };
  })
  .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

/* 「今天」用本地日期而不是 UTC。使用者看到的是台灣時間的今天，
   用 UTC 算的話早上八點前會顯示成昨天的數字。 */
const localDay = (d) => new Date(d).toLocaleDateString("sv");
const today = localDay(Date.now());
const since = (days) => Date.now() - days * 86400000;

const out = {
  generatedAt: new Date().toISOString(),
  total: catalog.projects.length,
  addedToday: rows.filter((r) => localDay(r.at) === today).length,
  added7d: rows.filter((r) => Date.parse(r.at) >= since(7)).length,
  added30d: rows.filter((r) => Date.parse(r.at) >= since(30)).length,
  /* 首頁只放得下十來筆，多給幾筆讓前端可以依版面寬度決定顯示幾筆 */
  recent: rows.slice(0, 16),
};

const file = path.join(ROOT, "content", "recent-projects.json");
fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
console.log(`content/recent-projects.json　站上 ${out.total}　今日 +${out.addedToday}　七日 +${out.added7d}　三十日 +${out.added30d}`);
if (out.recent[0]) console.log(`  最新：${out.recent[0].title}（${out.recent[0].at.slice(0, 16).replace("T", " ")}）`);
