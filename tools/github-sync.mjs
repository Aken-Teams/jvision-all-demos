#!/usr/bin/env node
/**
 * 把每個專案同步成 JVision-pj 底下獨立的 GitHub repo。
 *
 * 目錄裡每個專案的 githubUrl 早已指向 github.com/JVision-pj/<repo>——連結存在
 * 但 repo 不存在，訪客點了是 404。這支把它們補齊：不存在就建立、內容變了就推。
 *
 *   node tools/github-sync.mjs --repo=<name>       只同步一個（先拿它驗證）
 *   node tools/github-sync.mjs --all [--limit=N]   全部（可分批）
 *   node tools/github-sync.mjs --dry-run --all     只列出會做什麼
 *
 * 設計重點：
 * - 冪等且可續跑。1,500 個 repo 的批次一定會被中斷（限流、斷線、手動停），
 *   進度記在 var/github-sync.json（內容雜湊），重跑會跳過已同步且未變的。
 * - 建 repo 走 API（一個專案一次呼叫），推內容走 SSH——內容若也走 API，
 *   每個 repo 兩個檔就要 ~4,500 次呼叫，貼著 5,000/hr 的限流上限。
 * - 尊重限流：每次 API 回應都看 x-ratelimit-remaining，低於 100 就睡到重置。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const has = (k) => args.includes(`--${k}`);
const val = (k, d) => {
  const hit = args.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const ORG = val("org", "JVision-pj");
const DRY = has("dry-run");
const LIMIT = Number(val("limit", 0)) || 0;
const ONLY = val("repo", null);
const STATE_FILE = path.join(ROOT, "var", "github-sync.json");

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    const m = /^(?:GITHUB_TOKEN|GH_TOKEN)=(.+)$/m.exec(fs.readFileSync(path.join(ROOT, ".env"), "utf8"));
    return m?.[1]?.trim().replace(/^["']|["']$/g, "") || null;
  } catch { return null; }
}
const TOKEN = token();
if (!TOKEN && !DRY) {
  console.error("");
  console.error("✖ 找不到 GitHub 憑證。建立 repo 一定要走 API，SSH 只能推內容。");
  console.error("  需要一把對 JVision-pj 組織有效的 token：");
  console.error("    fine-grained PAT → Resource owner 選 JVision-pj，");
  console.error("      勾 Administration: Read and write（建 repo）與 Contents: Read and write");
  console.error("    或 classic PAT → 勾 repo 範圍（帳號需為組織成員且可建 repo）");
  console.error("  然後：在 .env 補上 GITHUB_TOKEN=<token>");
  process.exit(3);
}

async function api(pathname, options = {}) {
  const res = await fetch(`https://api.github.com${pathname}`, {
    ...options,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${TOKEN}`,
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  /* 限流剩額低就睡到重置。1,500 次建立呼叫離 5,000/hr 不遠，寧可慢不可斷。 */
  const remaining = Number(res.headers.get("x-ratelimit-remaining") || 999);
  if (remaining < 100) {
    const reset = Number(res.headers.get("x-ratelimit-reset") || 0) * 1000;
    const waitMs = Math.max(0, reset - Date.now()) + 5000;
    console.log(`  …限流剩 ${remaining}，睡 ${Math.ceil(waitMs / 60000)} 分鐘`);
    await new Promise((r) => setTimeout(r, waitMs));
  }
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  return { status: res.status, data };
}

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "projects-index.json"), "utf8"));
let projects = catalog.projects.filter((p) => p.repoName && fs.existsSync(path.join(ROOT, "demos", p.repoName, "index.html")));
if (ONLY) projects = projects.filter((p) => p.repoName === ONLY);
if (!projects.length) { console.error(ONLY ? `✖ 找不到 ${ONLY}` : "✖ 沒有可同步的專案"); process.exit(2); }

let state = {};
try { state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { /* 首次執行 */ }
function saveState() {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  const tmp = STATE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  fs.renameSync(tmp, STATE_FILE);
}

/* 內容雜湊：demo 目錄裡所有檔案。變了才推，沒變就跳過——續跑的關鍵。 */
function hashOf(repo) {
  const dir = path.join(ROOT, "demos", repo);
  const h = crypto.createHash("sha256");
  for (const f of fs.readdirSync(dir).sort()) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isFile()) { h.update(f); h.update(fs.readFileSync(fp)); }
  }
  return h.digest("hex").slice(0, 16);
}

const SITE = "https://jvdemo.jvision-ai.com";
let created = 0, pushed = 0, skipped = 0, failed = 0;
const todo = LIMIT ? projects.slice(0, LIMIT) : projects;
console.log(`共 ${projects.length} 個專案${LIMIT ? `，本批 ${todo.length}` : ""}${DRY ? "（dry-run）" : ""}`);

for (const [i, p] of todo.entries()) {
  const repo = p.repoName;
  const hash = hashOf(repo);
  const st = state[repo] || {};
  if (st.hash === hash && st.created) { skipped += 1; continue; }
  if (DRY) {
    console.log(`  ${st.created ? "推更新" : "建立+推"}  ${repo}`);
    continue;
  }
  try {
    /* 1. 確保 repo 存在 */
    if (!st.created) {
      const chk = await api(`/repos/${ORG}/${repo}`);
      if (chk.status === 404) {
        const mk = await api(`/orgs/${ORG}/repos`, {
          method: "POST",
          body: JSON.stringify({
            name: repo,
            description: `${p.title}｜${p.category || ""}．JVision 系統 Demo`.slice(0, 140),
            homepage: `${SITE}${p.demoUrl || ""}`,
            has_issues: false, has_projects: false, has_wiki: false,
          }),
        });
        if (mk.status !== 201) throw new Error(`建立失敗 ${mk.status}：${mk.data?.message || ""}`);
        created += 1;
      } else if (chk.status !== 200) {
        throw new Error(`查詢失敗 ${chk.status}：${chk.data?.message || ""}`);
      }
      st.created = true;
    }
    /* 2. 推內容（SSH）。每次都重建暫存 git，force push 單一 commit——
          這些 repo 是展示鏡像不是開發庫，鏡像語意下歷史沒有意義，
          單 commit 讓 1,500 個 repo 的行為完全一致。 */
    const tmp = fs.mkdtempSync("/tmp/ghsync-");
    try {
      const src = path.join(ROOT, "demos", repo);
      for (const f of fs.readdirSync(src)) {
        if (fs.statSync(path.join(src, f)).isFile()) fs.copyFileSync(path.join(src, f), path.join(tmp, f));
      }
      const g = (...a) => execFileSync("git", a, { cwd: tmp, stdio: "pipe", timeout: 120000,
        env: { ...process.env, GIT_SSH_COMMAND: "ssh -o ConnectTimeout=20 -o ServerAliveInterval=15 -o ServerAliveCountMax=4" } });
      g("init", "-q", "-b", "main");
      g("config", "user.email", "bot@jvision.local");
      g("config", "user.name", "JVision Sync");
      g("add", "-A");
      g("commit", "-q", "-m", `${p.title}（同步自 jvdemo）`);
      g("push", "-q", "--force", `git@github.com:${ORG}/${repo}.git`, "main");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    st.hash = hash;
    st.at = new Date().toISOString();
    state[repo] = st;
    pushed += 1;
    if (pushed % 20 === 0) { saveState(); console.log(`  進度 ${i + 1}/${todo.length}（建立 ${created}、推送 ${pushed}）`); }
  } catch (e) {
    failed += 1;
    console.error(`  ✖ ${repo}：${String(e.message).split("\n")[0].slice(0, 100)}`);
    state[repo] = { ...st, error: String(e.message).slice(0, 120) };
    if (failed >= 10 && pushed === 0) { console.error("連續失敗過多，中止——多半是憑證或權限問題"); break; }
  }
}
saveState();
console.log(`\n完成：建立 ${created}、推送 ${pushed}、未變跳過 ${skipped}、失敗 ${failed}`);
process.exit(failed && !pushed ? 1 : 0);
