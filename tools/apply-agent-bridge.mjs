/**
 * 把 agent bridge 注入 demo(Phase 3)。冪等:已注入的跳過,重跑安全。
 *
 *   node tools/apply-agent-bridge.mjs <repo...>   指定幾套
 *   node tools/apply-agent-bridge.mjs --all       全站
 *   node tools/apply-agent-bridge.mjs --remove --all   全部移除(反悔用)
 *
 * 注入的只有一行 <script src="/shared/jv-agent-bridge.js" defer>:
 * bridge 平常完全沉默,只在報告溯源連結(#go=n&hl=詞)或 postMessage 時動作。
 * 注:GitHub 獨立 repo 副本(github-sync)不含 shared/,該情境下腳本 404 但
 * demo 本體不受影響;主要體驗都在站上,可接受。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
// BRIDGE_VER:bridge 有新能力時遞增並重跑 --all,打破使用者端的舊快取
const BRIDGE_VER = "2";
const TAG = `<script src="/shared/jv-agent-bridge.js?v=${BRIDGE_VER}" defer></script>`;
const MARK = "jv-agent-bridge.js";

const args = process.argv.slice(2);
const remove = args.includes("--remove");
const repos = args.includes("--all")
  ? fs.readdirSync(path.join(ROOT, "demos")).filter((r) => fs.existsSync(path.join(ROOT, "demos", r, "index.html")))
  : args.filter((a) => !a.startsWith("--"));

if (!repos.length) {
  console.log("用法:node tools/apply-agent-bridge.mjs <repo...> 或 --all(--remove 移除)");
  process.exit(1);
}

let done = 0, skipped = 0, missing = 0;
for (const repo of repos) {
  const p = path.join(ROOT, "demos", repo, "index.html");
  if (!fs.existsSync(p)) { missing += 1; continue; }
  let html = fs.readFileSync(p, "utf8");
  if (remove) {
    if (!html.includes(MARK)) { skipped += 1; continue; }
    html = html.replace(new RegExp(`[ \\t]*<script[^>]*${MARK}[^>]*></script>\\n?`), "");
    // 原子寫入:背景抽取器可能正用瀏覽器讀同一批檔,不能讓它讀到半寫檔
    fs.writeFileSync(p + ".tmp", html);
    fs.renameSync(p + ".tmp", p);
    done += 1;
    continue;
  }
  if (html.includes(TAG)) { skipped += 1; continue; }
  if (html.includes(MARK)) {
    // 已注入舊版本:原地升級標籤(換版本參數,打破瀏覽器快取)
    html = html.replace(/<script[^>]*jv-agent-bridge\.js[^>]*><\/script>/, TAG);
    fs.writeFileSync(p + ".tmp", html);
    fs.renameSync(p + ".tmp", p);
    done += 1;
    continue;
  }
  // 插在 </body> 前;沒有 </body> 的(極簡舊頁)插在 </html> 前;都沒有就附加檔尾
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${TAG}\n</body>`);
  else if (/<\/html>/i.test(html)) html = html.replace(/<\/html>/i, `${TAG}\n</html>`);
  else html = html + "\n" + TAG + "\n";
  fs.writeFileSync(p, html);
  done += 1;
}
console.log(`${remove ? "移除" : "注入"} ${done} 套、跳過 ${skipped} 套(已處理)、缺 index ${missing} 套`);
