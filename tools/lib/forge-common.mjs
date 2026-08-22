/**
 * topic-scout / demo-forge / demo-publish 的共用基礎層。
 * 慣例對齊 tools/ 既有腳本：ESM、path.resolve(import.meta.dirname, ".."),
 * 寫回 JSON 一律 2 空格縮排 + 尾端換行、並更新 generatedAt。
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const CATALOG_PATH = path.join(ROOT, "projects-index.json");
export const DETAILS_DIR = path.join(ROOT, "content", "details");
export const DEMOS_DIR = path.join(ROOT, "demos");
export const MANIFEST_PATH = path.join(ROOT, "docs", "DEMO_FORGE_MANIFEST.json");
export const CANDIDATES_PATH = path.join(ROOT, "docs", "TOPIC_SCOUT_CANDIDATES.json");

/* ── 退出碼（三支腳本共用） ─────────────────────────────── */
export const EXIT = {
  OK: 0,
  BAD_INPUT: 1,     // 參數錯誤 / 前置條件不足
  CODEX_FAILED: 2,  // codex 非零退出、逾時、輸出空
  BAD_OUTPUT: 3,    // codex 有回應但無法解析／驗不過
  PARTIAL: 4,       // 跑完但成果不足（仍會寫檔）
};

/* ── 參數 ───────────────────────────────────────────────── */
export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (const token of argv) {
    if (!token.startsWith("--")) { args._.push(token); continue; }
    const body = token.slice(2);
    const eq = body.indexOf("=");
    if (eq === -1) args[body] = true;
    else args[body.slice(0, eq)] = body.slice(eq + 1);
  }
  return args;
}

export const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
export const list = (value) => String(value || "").split(",").map((s) => s.trim()).filter(Boolean);

/* ── 輸出 ───────────────────────────────────────────────── */
export function makeLogger({ quiet = false } = {}) {
  return {
    info: (...a) => { if (!quiet) console.log(...a); },
    step: (...a) => { if (!quiet) console.log("\n" + a.join(" ")); },
    warn: (...a) => console.warn("  ⚠", ...a),
    error: (...a) => console.error("  ✖", ...a),
  };
}

/* ── 目錄檔 ─────────────────────────────────────────────── */
export function loadCatalog() {
  return JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
}

export function saveCatalog(catalog) {
  catalog.generatedAt = new Date().toISOString();
  fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

/* ── 系統類型分類器 ─────────────────────────────────────── */
/** 以 node:vm 載入瀏覽器端的 shared/system-content.js（手法照 build-detail-content.mjs）。 */
export function loadClassifier() {
  const source = fs.readFileSync(path.join(ROOT, "shared", "system-content.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  const JV = sandbox.window.JVSystemContent;
  if (!JV || typeof JV.classify !== "function") throw new Error("shared/system-content.js 未匯出 JVSystemContent.classify");
  return JV;
}

/**
 * 各 systemType 的既有專案數，由少到多排序。
 * 注意 classify() 吃「整個 project 物件」，不是分開的字串。
 */
export function coverageByType(projects, JV) {
  const counts = Object.fromEntries(Object.keys(JV.TYPES).map((t) => [t, 0]));
  const titles = Object.fromEntries(Object.keys(JV.TYPES).map((t) => [t, []]));
  for (const project of projects) {
    const type = JV.classify(project);
    if (counts[type] === undefined) continue;
    counts[type] += 1;
    titles[type].push(project.title);
  }
  const rows = Object.entries(counts)
    .map(([type, count]) => ({ type, count, label: JV.TYPES[type].label, titles: titles[type] }))
    .sort((a, b) => a.count - b.count);
  const values = rows.map((r) => r.count).sort((a, b) => a - b);
  const median = values[Math.floor(values.length / 2)];
  return { rows, median };
}

/* ── manifest ───────────────────────────────────────────── */
export function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return { generatedAt: null, entries: [] };
  try { return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")); }
  catch { return { generatedAt: null, entries: [] }; }
}

export function saveManifest(manifest) {
  manifest.generatedAt = new Date().toISOString();
  writeJson(MANIFEST_PATH, manifest);
}

export function upsertEntry(manifest, entry) {
  const index = manifest.entries.findIndex((e) => e.repoName === entry.repoName);
  const now = new Date().toISOString();
  if (index === -1) manifest.entries.push({ ...entry, createdAt: now, updatedAt: now });
  else manifest.entries[index] = { ...manifest.entries[index], ...entry, updatedAt: now };
  return manifest;
}

/* ── git 越界護欄 ───────────────────────────────────────── */
export function gitStatus() {
  try {
    return execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" })
      .split("\n").filter(Boolean)
      .map((line) => ({ code: line.slice(0, 2), file: line.slice(3).replace(/^"|"$/g, "") }));
  } catch { return []; }
}

/**
 * 比對前後快照，找出白名單外的變動。
 * @returns {{trackedViolations:string[], untrackedExtras:string[]}}
 */
export function diffGuard(before, allowPrefixes) {
  const beforeKeys = new Set(before.map((e) => e.code + e.file));
  const after = gitStatus();
  const allowed = (file) => allowPrefixes.some((p) => file === p || file.startsWith(p));
  const trackedViolations = [];
  const untrackedExtras = [];
  for (const entry of after) {
    if (beforeKeys.has(entry.code + entry.file)) continue;
    if (allowed(entry.file)) continue;
    if (entry.code === "??") untrackedExtras.push(entry.file);
    else trackedViolations.push(entry.file);
  }
  return { trackedViolations, untrackedExtras };
}

/** 還原被越界修改的已追蹤檔。 */
export function gitRestore(files) {
  if (!files.length) return;
  try { execFileSync("git", ["checkout", "--", ...files], { cwd: ROOT }); } catch { /* 還原失敗交由上層報錯 */ }
}

/* ── 其他 ───────────────────────────────────────────────── */
export const SLUG_RE = /^[a-z][a-z0-9-]{3,40}$/;
export const repoNameOf = (slug) => `jvision-${slug}`;

export function nextProjectId(projects) {
  return Math.max(0, ...projects.map((p) => Number(p.id) || 0)) + 1;
}

/** demos/ 底下實際存在的目錄，供 slug 撞名檢查（比只看 catalog 更嚴）。 */
export function existingRepoDirs() {
  try { return new Set(fs.readdirSync(DEMOS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)); }
  catch { return new Set(); }
}
