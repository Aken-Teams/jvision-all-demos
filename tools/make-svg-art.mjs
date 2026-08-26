#!/usr/bin/env node
/**
 * 用 codex 產生 SVG 插畫。
 *
 * codex 不會產生照片——它是寫程式的 agent，輸出是文字。但 SVG 本身就是文字，
 * 所以「畫一張向量插畫」正好落在它能做的事情裡，而且產出可縮放、自足、
 * 沒有版權問題，跟這個站「每個檔案自足」的前提一致。
 *
 *   node tools/make-svg-art.mjs <prompt檔> <輸出.svg>
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, EXIT, parseArgs, num, makeLogger } from "./lib/forge-common.mjs";
import { runCodexWithRetry } from "./lib/codex-run.mjs";

const args = parseArgs();
const log = makeLogger({});
const [promptFile, outFile] = args._;
if (!promptFile || !outFile) {
  log.error("用法：node tools/make-svg-art.mjs <prompt檔> <輸出.svg>");
  process.exit(EXIT.BAD_INPUT);
}

const r = await runCodexWithRetry({
  prompt: fs.readFileSync(promptFile, "utf8"),
  cwd: ROOT,
  sandbox: "read-only",
  schemaPath: path.join(ROOT, "tools", "schemas", "svg-art.schema.json"),
  timeoutMs: num(args.timeout, 900) * 1000,
  model: args.model,
  onLog: () => process.stderr.write("."),
}, { retries: 2 });
process.stderr.write("\n");

if (!r.ok) { log.error(`codex 失敗：${r.error}`); process.exit(EXIT.CODEX_FAILED); }
const svg = String(r.json?.svg || "").trim();
if (!svg.startsWith("<svg") || !svg.endsWith("</svg>")) {
  log.error("回傳的不是完整的 <svg>…</svg>");
  process.exit(EXIT.BAD_OUTPUT);
}
/* 這張圖會被直接嵌進頁面，所以外部引用與腳本一律擋下——插畫沒有理由需要它們。 */
for (const [re, why] of [[/<script/i, "含 <script>"], [/xlink:href|href\s*=\s*["']https?:/i, "引用外部資源"],
                         [/<image/i, "嵌入點陣圖"], [/<foreignObject/i, "含 foreignObject"]]) {
  if (re.test(svg)) { log.error(`不安全的輸出：${why}`); process.exit(EXIT.BAD_OUTPUT); }
}

fs.writeFileSync(outFile, svg + "\n");
log.step(`已寫入 ${path.relative(ROOT, outFile)}（${(svg.length / 1024).toFixed(1)} KB）`);
if (r.json?.notes) log.info(`  ${r.json.notes}`);
