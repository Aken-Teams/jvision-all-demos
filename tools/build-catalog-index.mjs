#!/usr/bin/env node
/**
 * 產生目錄頁用的精簡索引。
 *
 * projects-index.json 是完整的專案資料，每筆都帶著詳細頁才用得到的東西——
 * customerWorkflow 一個欄位就佔了 21%。目錄頁只是列表與搜尋，用不到那些，
 * 卻每個訪客都要下載一次（實測傳輸 429 KB，是那一頁最大的單一資源）。
 *
 * 保留的欄位是 app.js 真的會讀的那幾個，其餘丟掉。
 *
 *   node tools/build-catalog-index.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "projects-index.json"), "utf8"));

/* 這份清單要跟 app.js 對齊。日後 app.js 多讀一個欄位卻忘了加進來，
   症狀會是「目錄頁少了某個資訊」而不是壞掉，很難察覺——所以下面附了對照方式。 */
const KEEP = [
  "id", "title", "category", "industry", "demoUrl", "repoName", "description",
  "status", "sourceGroup", "primaryUser", "operationalMetrics", "dailyUse",
  "businessSituation", "catalogSequence", "contentDepth", "localPath",
  "tags", "featured", "notes",
];

const projects = catalog.projects.map((p) => {
  const o = {};
  for (const k of KEEP) if (p[k] !== undefined) o[k] = p[k];
  return o;
});

const out = { generatedAt: new Date().toISOString(), total: projects.length, slim: true, projects };
const file = path.join(ROOT, "content", "catalog-index.json");
fs.writeFileSync(file, JSON.stringify(out) + "\n");   // 不縮排：這個檔只給程式讀

const before = fs.statSync(path.join(ROOT, "projects-index.json")).size;
const after = fs.statSync(file).size;
console.log(`content/catalog-index.json　${projects.length} 筆　${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024 / 1024).toFixed(2)} MB（省 ${((1 - after / before) * 100).toFixed(0)}%）`);

/* 檢查有沒有欄位漏掉：app.js 讀得到、但這裡沒保留的。 */
try {
  const js = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
  const used = new Set([...js.matchAll(/\bproject\.([a-zA-Z]+)/g)].map((m) => m[1]));
  const missing = [...used].filter((k) => !KEEP.includes(k)
    && catalog.projects.some((p) => p[k] !== undefined));
  if (missing.length) console.log(`  ⚠ app.js 有讀但未保留的欄位：${missing.join("、")}`);
} catch { /* 讀不到就跳過這項檢查 */ }
