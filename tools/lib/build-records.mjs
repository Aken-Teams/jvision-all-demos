/**
 * 把「一套 demo 是怎麼生出來的」拼成一筆紀錄，給後台的生成紀錄頁用。
 *
 * 資料散在三個地方，各自只有一半的故事：
 *   DEMO_FORGE_MANIFEST.json  題目、指派的樣式、codex 耗時、各關檢查結果
 *   agent-cycles.jsonl        上架當下站上有幾套（成長軌跡）
 *   agent-logs/<repo>.log     完整過程：建置輸出、驗收數字、修了什麼、上架
 *
 * log 只有目前這支 agent 跑過的才有（早期批次產線沒有逐套留檔），所以
 * hasLog 要誠實標出來，不要讓人以為紀錄不見了。
 */
import fs from "node:fs";
import path from "node:path";

const LOG_DIR = (root) => path.join(root, "docs", "_state", "agent-logs");

/** 從建置 log 裡把關鍵事實抽出來，不必讓前端讀整份。 */
export function summarizeLog(text) {
  const out = { verifyRuns: [], fixed: null, overflowBefore: null, published: false, sizeKB: null, warnings: [] };
  for (const line of text.split("\n")) {
    const v = line.match(/^(OK|XX)\s+(\S+)\s+(.*)$/);
    if (v) {
      const m = Object.fromEntries([...v[3].matchAll(/(\w+)=([^\s]+)/g)].map((x) => [x[1], x[2]]));
      out.verifyRuns.push({ pass: v[1] === "OK", ...m });
      if (v[1] === "XX" && m.overflow && m.overflow !== "none" && !out.overflowBefore) out.overflowBefore = m.overflow;
      continue;
    }
    const f = line.match(/✓\s+\S+\s+\+(\d+) → \+(\d+)/);
    if (f) { out.fixed = { from: Number(f[1]), to: Number(f[2]) }; continue; }
    const s = line.match(/已產出（([\d.]+) KB）/);
    if (s) { out.sizeKB = Number(s[1]); continue; }
    if (line.includes("將新增 1 筆到目錄")) out.published = true;
    if (line.includes("⚠")) out.warnings.push(line.trim().replace(/^⚠\s*/, "").slice(0, 100));
  }
  return out;
}

/** 列出生成紀錄，新的在前。 */
export function list({ root, limit = 200, state = null, q = null } = {}) {
  let manifest = { entries: [] };
  try { manifest = JSON.parse(fs.readFileSync(path.join(root, "docs", "DEMO_FORGE_MANIFEST.json"), "utf8")); }
  catch { return { available: false, rows: [], note: "找不到 DEMO_FORGE_MANIFEST.json" }; }

  const cycles = new Map();
  try {
    for (const line of fs.readFileSync(path.join(root, "docs", "_state", "agent-cycles.jsonl"), "utf8").split("\n")) {
      if (!line) continue;
      try { const c = JSON.parse(line); cycles.set(c.tag, c); } catch { /* 略過壞行 */ }
    }
  } catch { /* 沒有就沒有 */ }

  let logs = new Set();
  try { logs = new Set(fs.readdirSync(LOG_DIR(root)).map((f) => f.replace(/\.log$/, ""))); } catch { /* 沒有目錄 */ }

  let rows = manifest.entries.map((e) => {
    const c = cycles.get(e.repoName);
    return {
      repoName: e.repoName,
      title: e.title,
      category: e.category,
      systemType: e.systemType,
      state: e.state,
      chartLib: e.assigned?.chartLib || null,
      accent: e.assigned?.accent || null,
      createdAt: e.createdAt || null,
      publishedAt: e.publishedAt || e.updatedAt || null,
      publishedId: e.publishedId ?? null,
      attempts: e.attempts ?? null,
      codexMs: e.codex?.durationMs ?? null,
      staticPass: e.checks?.static?.pass ?? null,
      browserPass: e.checks?.browser?.pass ?? null,
      failReason: e.failReason || null,
      siteAfter: c?.after ?? null,
      hasLog: logs.has(e.repoName),
    };
  });

  if (state) rows = rows.filter((r) => r.state === state);
  if (q) {
    const needle = String(q);
    rows = rows.filter((r) => [r.title, r.repoName, r.category, r.systemType].filter(Boolean).join(" ").includes(needle));
  }

  /* 依建立時間新到舊。沒有時間的（早期匯入）排最後，而不是散在中間。 */
  rows.sort((a, b) => {
    const ta = Date.parse(a.createdAt || "") || 0;
    const tb = Date.parse(b.createdAt || "") || 0;
    return tb - ta;
  });

  const total = rows.length;
  return { available: true, total, rows: rows.slice(0, limit), withLog: logs.size };
}

/** 讀單一套的完整建置 log。 */
export function readLog({ root, repo }) {
  if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(String(repo))) return { ok: false, error: "repo 名稱不合法" };
  const file = path.join(LOG_DIR(root), `${repo}.log`);
  /* 一定要確認解析後的路徑仍在 log 目錄裡。repo 名稱雖然已經過格式檢查，
     但把「路徑安全」建立在字串規則上是脆弱的，多一道實際比對才穩。 */
  if (!file.startsWith(LOG_DIR(root) + path.sep)) return { ok: false, error: "路徑不合法" };
  if (!fs.existsSync(file)) return { ok: false, error: "這一套沒有留下建置紀錄（早期批次產線未逐套留檔）" };
  const text = fs.readFileSync(file, "utf8");
  return { ok: true, repo, text, summary: summarizeLog(text) };
}
