/**
 * 靜態閘：不需要瀏覽器就能抓到的問題。
 * demo-forge 建置後立即跑一次；demo-verify --static-only 也用同一份，
 * 確保兩邊判準一致。
 *
 * 抓得到：檔案大小、6 個畫面、深連結、反模式、內嵌語法、圖表庫、stage 對應。
 * 抓不到：畫面是否真的互異、三種寬度是否跑版、圖表是否空白 —— 那要瀏覽器。
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT, DEMOS_DIR, DETAILS_DIR } from "./forge-common.mjs";

const GLOBAL_CLASH = /\b(?:var|let|const|function)\s+(top|name|location|status|open|close|parent|self|length)\b/;

export function staticGate(repoName) {
  const file = path.join(DEMOS_DIR, repoName, "index.html");
  const issues = [];
  if (!fs.existsSync(file)) return { pass: false, issues: ["index.html 未產出"], summary: "缺檔" };

  const html = fs.readFileSync(file, "utf8");
  const size = Buffer.byteLength(html);
  if (size < 12000 || size > 90000) issues.push(`檔案大小 ${(size / 1024).toFixed(1)}KB 超出 12–90KB`);

  const screens = new Set([...html.matchAll(/data-i="(\d+)"/g)].map((m) => m[1]));
  if (screens.size < 6) issues.push(`只找到 ${screens.size} 個 data-i 畫面（需 6）`);
  if (!/hashchange/.test(html)) issues.push("缺少 hashchange 深連結");
  if (!/\.\.\/\.\.\/favicon\.svg/.test(html)) issues.push("favicon 未用 ../../favicon.svg");
  if (/setInterval\s*\(/.test(html)) issues.push("使用了 setInterval（硬性規則禁止）");
  if (/href="\.\.\/\.\.\/shared/.test(html)) issues.push("引用了 shared/（違反單檔自足）");

  const localScripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !s.startsWith("http"));
  if (localScripts.length) issues.push(`引用本地腳本：${localScripts.join(", ")}`);
  if (GLOBAL_CLASH.test(html)) issues.push("宣告了會與瀏覽器全域衝突的識別字");

  const lib = /echarts/.test(html) ? "echarts" : /new Chart\(/.test(html) ? "chartjs" : /ApexCharts/.test(html) ? "apexcharts" : null;
  if (!lib) issues.push("找不到任何圖表庫");

  // 內嵌 script 語法（在 process 內做，不落暫存檔）
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!m[1].trim()) continue;
    try { new vm.Script(m[1]); }
    catch (error) { issues.push(`內嵌 script 語法錯誤：${String(error.message).slice(0, 80)}`); break; }
  }

  // details 的 6 個 stage 必須對到 v0..v5
  const detailPath = path.join(DETAILS_DIR, `${repoName}.json`);
  let stages = 0;
  if (fs.existsSync(detailPath)) {
    const D = JSON.parse(fs.readFileSync(detailPath, "utf8"));
    const demos = (D.flow?.stages || []).map((s) => s.demo);
    stages = demos.length;
    if (demos.length !== 6) issues.push(`details 的 stages 有 ${demos.length} 個（需 6）`);
    if (new Set(demos).size !== demos.length) issues.push("details 的 stage 對到重複畫面");
  } else issues.push("缺少 content/details JSON");

  return {
    pass: issues.length === 0,
    issues,
    summary: `${(size / 1024).toFixed(0)}KB screens=${screens.size} stages=${stages} lib=${lib || "none"}`,
  };
}
