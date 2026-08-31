#!/usr/bin/env node
/**
 * 推分支並開／更新 PR。內文由當下的 repo 狀態算出來，不是手寫的。
 *
 *   node tools/open-pr.mjs                 推分支 → 開或更新 PR
 *   node tools/open-pr.mjs --dry-run       只印出將送出的內容
 *   node tools/open-pr.mjs --no-push       不推，只更新 PR 內文
 *
 * 憑證：依序找 GITHUB_TOKEN / GH_TOKEN 環境變數，再找 .env。推送與開 PR 都要用。
 * 沒有憑證時仍然會把分支推上去，並印出手動開 PR 的網址——推分支走 SSH，
 * 不需要 token；開 PR 是 REST API，git 協定本身沒有這個功能，一定要憑證。
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const NO_PUSH = args.has("--no-push");

/* maxBuffer 要放大。預設 1MB，而 git show <ref>:projects-index.json 光是
   463 套的舊版就有 1.4MB——超過就靜默截斷，JSON.parse 失敗，PR 內文只會少
   一行「之前幾套」而不會報錯，很難發現。 */
const git = (...a) =>
  execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }).trim();

/* ── 憑證 ───────────────────────────────────────────────── */
function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  try {
    const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    const m = /^(?:GITHUB_TOKEN|GH_TOKEN)=(.+)$/m.exec(env);
    const v = m?.[1]?.trim().replace(/^["']|["']$/g, "");
    return v || null;
  } catch { return null; }
}

/* ── 這個 repo 的座標 ───────────────────────────────────── */
function repoSlug() {
  for (const remote of ["target", "origin"]) {
    try {
      const url = git("remote", "get-url", remote);
      const m = /github\.com[:/]([^/]+)\/([^/.]+)/.exec(url);
      if (m) return { owner: m[1], repo: m[2], remote };
    } catch { /* 沒有這個 remote */ }
  }
  throw new Error("找不到 GitHub remote");
}

const { owner, repo, remote } = repoSlug();
const head = git("rev-parse", "--abbrev-ref", "HEAD");
const base = process.env.JV_PR_BASE || "main";
if (head === base) { console.error(`目前在 ${base} 上，不開 PR`); process.exit(2); }

/* ── 內文由現況算出來 ───────────────────────────────────── */
function countAt(ref) {
  try { return JSON.parse(git("show", `${ref}:projects-index.json`)).projects.length; }
  catch { return null; }
}

function buildBody() {
  const now = JSON.parse(fs.readFileSync(path.join(ROOT, "projects-index.json"), "utf8"));
  const before = countAt(`${remote}/${base}`) ?? countAt(`origin/${base}`) ?? countAt(base);
  const commits = git("log", "--oneline", "--no-merges", `${base}..HEAD`).split("\n").filter(Boolean);

  let manifest = { entries: [] };
  try { manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "DEMO_FORGE_MANIFEST.json"), "utf8")); } catch { /* 沒有就算了 */ }
  const state = {};
  for (const e of manifest.entries || []) state[e.state] = (state[e.state] || 0) + 1;

  let daily = {};
  try { daily = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "_state", "agent-daily.json"), "utf8")); } catch { /* 尚未有紀錄 */ }
  const days = Object.entries(daily).sort();

  const byCategory = {};
  for (const p of now.projects) byCategory[p.category] = (byCategory[p.category] || 0) + 1;
  const topCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return [
    "## 摘要",
    "",
    before != null
      ? `站上系統數 **${before} → ${now.projects.length}**（本分支新增 ${now.projects.length - before} 套）。`
      : `站上系統數 **${now.projects.length}**。`,
    "",
    `本分支共 ${commits.length} 個 commit。`,
    "",
    "## 目前的建置狀態",
    "",
    "| 狀態 | 套數 |",
    "|---|---|",
    ...Object.entries(state).map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## 產業分佈（前 8 名）",
    "",
    "| 產業 | 套數 |",
    "|---|---|",
    ...topCats.map(([k, v]) => `| ${k} | ${v} |`),
    "",
    ...(days.length ? [
      "## Agent 每日產出",
      "",
      "| 日期 | 套數 |",
      "|---|---|",
      ...days.map(([d, n]) => `| ${d} | ${n} |`),
      "",
    ] : []),
    "## 本分支的 commit",
    "",
    ...commits.map((c) => `- ${c}`),
    "",
    "---",
    "",
    `<sub>由 \`tools/open-pr.mjs\` 依當下 repo 狀態產生於 ${new Date().toISOString()}</sub>`,
  ].join("\n");
}

const title = `站上系統數更新至 ${JSON.parse(fs.readFileSync(path.join(ROOT, "projects-index.json"), "utf8")).projects.length} 套`;
const body = buildBody();

if (DRY) {
  console.log(`── 將建立／更新 PR ──\n  ${owner}/${repo}　${head} → ${base}\n  標題：${title}\n`);
  console.log(body);
  process.exit(0);
}

/* ── 推分支 ─────────────────────────────────────────────── */
if (!NO_PUSH) {
  console.log(`推送 ${head} → ${remote}`);
  try {
    /* 用哪種認證，要看 remote 實際是什麼協定，不能寫死。
       這裡原本一律配 SSH，但 origin 是 https://github.com/...，
       GIT_SSH_COMMAND 根本不會被用到，git 於是去要帳號密碼而失敗：
         fatal: could not read Username for 'https://github.com'
       症狀看起來像認證問題，其實是配錯了對象。

       HTTPS：憑證用 GIT_CONFIG_* 傳（照抄 github-sync.mjs）。放在網址或 argv
       裡的話會出現在 ps 與錯誤訊息中。
       （註解原本說「token 是 JVision-pj 專用的，推 Aken-Teams 會 403」——
        那已經過期了，現在這顆 token 對 Aken-Teams 有 admin。）

       SSH：必須把 gnome-keyring 的 SSH 代理關掉。這裡曾經每天失敗，症狀是
       「git push 無限期懸掛」，實測卡過一小時三十八分。原因不是網路：
       systemd user unit 的環境帶著 SSH_AUTH_SOCK=/run/user/1000/keyring/ssh，
       ssh 會先去問 gnome-keyring 代理，而那個代理在沒有桌面介面可以解鎖時
       就無限等下去。IdentityAgent=none 直接讀金鑰則瞬間成功——金鑰沒有密碼，
       本來就不需要代理。BatchMode 保證缺金鑰時直接失敗而不是卡在提示。

       逾時仍然保留當最後一道保險：推不上去就下次再推，絕不可以把產線整條卡住。 */
    const url = execFileSync("git", ["remote", "get-url", remote], { cwd: ROOT, encoding: "utf8" }).trim();
    const sshKey = path.join(os.homedir(), ".ssh", "id_ed25519");

    const httpsEnv = () => {
      const tok = token();
      if (!tok) return null;
      /* 憑證用 GIT_CONFIG_* 傳（照抄 github-sync.mjs）。放在網址或 argv 裡的話
         會出現在 ps 與錯誤訊息中。 */
      const basic = Buffer.from(`x-access-token:${tok}`).toString("base64");
      return { ...process.env, GIT_TERMINAL_PROMPT: "0",
        GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
        GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}` };
    };

    const sshEnv = () => {
      /* 必須把 gnome-keyring 的 SSH 代理關掉。這裡曾經每天失敗，症狀是
         「git push 無限期懸掛」，實測卡過一小時三十八分。原因不是網路：
         systemd user unit 的環境帶著 SSH_AUTH_SOCK=/run/user/1000/keyring/ssh，
         ssh 會先去問 gnome-keyring 代理，而那個代理在沒有桌面介面可以解鎖時
         就無限等下去。IdentityAgent=none 直接讀金鑰則瞬間成功——金鑰沒有密碼，
         本來就不需要代理。BatchMode 保證缺金鑰時直接失敗而不是卡在提示。 */
      const e = { ...process.env, GIT_TERMINAL_PROMPT: "0",
        GIT_SSH_COMMAND: ["ssh", "-o ConnectTimeout=20", "-o ServerAliveInterval=15",
          "-o ServerAliveCountMax=4", "-o BatchMode=yes", "-o IdentityAgent=none", "-o IdentitiesOnly=yes",
          ...(fs.existsSync(sshKey) ? [`-i ${sshKey}`] : [])].join(" ") };
      delete e.SSH_AUTH_SOCK;
      return e;
    };

    /* 兩條路都試。原本只配 SSH，但 origin 是 https://... 時 GIT_SSH_COMMAND
       根本不會被用到，git 於是去要帳號密碼：
         fatal: could not read Username for 'https://github.com'
       看起來像認證問題，其實是配錯了對象。

       而 HTTPS 也不保證能用：這顆 PAT 的 API /repos 回 push:true，實際推卻是
       403——那個欄位反映的是**使用者**對 repo 的權限，不是 token 被授予的權限
       （fine-grained PAT 少了 Contents: write）。API 說可以、實際不行，
       所以不能只憑它判斷，得真的推推看。 */
    const ssh = url.replace(/^https:\/\/github\.com\//, "git@github.com:").replace(/\.git$|$/, ".git");
    const attempts = /^https?:\/\//.test(url)
      ? [["HTTPS", url, httpsEnv()], ["SSH", ssh, sshEnv()]]
      : [["SSH", url, sshEnv()]];

    let pushed = false;
    let lastWhy = "";
    for (const [how, target, env] of attempts) {
      if (!env) continue;
      try {
        execFileSync("git", ["push", "-u", target, head], {
          cwd: ROOT, stdio: "inherit", timeout: 10 * 60 * 1000, env,
        });
        console.log(`  （走 ${how}）`);
        pushed = true;
        break;
      } catch (e) {
        lastWhy = e.signal === "SIGTERM" ? "逾時" : String(e.message).split("\n")[0].slice(0, 80);
        console.error(`  ${how} 推不上去：${lastWhy}`);
      }
    }
    if (!pushed) throw new Error(lastWhy || "推送失敗");
  } catch (error) {
    const why = error.signal === "SIGTERM" ? "逾時（超過 10 分鐘）" : String(error.message).split("\n")[0].slice(0, 80);
    console.error(`✖ 推送失敗：${why}　PR 內容不會反映最新 commit`);
    process.exit(1);
  }
}

/* ── 開或更新 PR ────────────────────────────────────────── */
const TOKEN = token();
const compareUrl = `https://github.com/${owner}/${repo}/compare/${base}...${head}?expand=1`;
if (!TOKEN) {
  console.error("");
  console.error("✖ 找不到 GitHub 憑證，無法自動開 PR。");
  console.error("  推分支走 SSH 不需要憑證，但開 PR 是 REST API，git 協定沒有這個功能。");
  console.error("  設定方式（擇一）：");
  console.error("    1. 在 .env 寫 GITHUB_TOKEN=<你的 PAT>（需要 Contents 與 Pull requests 的寫入權限）");
  console.error("    2. export GITHUB_TOKEN=<你的 PAT> 後再執行");
  console.error("");
  console.error(`  分支已經推上去了，手動開 PR：${compareUrl}`);
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
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    /* 403 幾乎都是 token 少了某一項權限。GitHub 會在 x-accepted-github-permissions
       裡直接寫出「這個端點需要什麼」——把它印出來，比丟一句「未知錯誤」讓人
       翻半天有用得多。 */
    const need = res.headers.get("x-accepted-github-permissions");
    const err = new Error(`GitHub ${res.status}：${data.message || "未知錯誤"}`);
    if (res.status === 403 && need) err.needs = need;
    throw err;
  }
  return data;
}

/* 已經有 PR 就更新內文，不再開第二個——這支工具每天都會被叫到，
   每次開一個新 PR 會很快變成一串重複的 PR。 */
const existing = await api(`/repos/${owner}/${repo}/pulls?head=${owner}:${head}&state=open`);
if (existing.length) {
  const pr = existing[0];
  await api(`/repos/${owner}/${repo}/pulls/${pr.number}`, {
    method: "PATCH", body: JSON.stringify({ title, body }),
  });
  console.log(`已更新既有 PR #${pr.number}：${pr.html_url}`);
} else {
  try {
    const pr = await api(`/repos/${owner}/${repo}/pulls`, {
      method: "POST", body: JSON.stringify({ title, head, base, body }),
    });
    console.log(`已建立 PR #${pr.number}：${pr.html_url}`);
  } catch (error) {
    if (!error.needs) throw error;
    /* 分支已經推上去了，只是開不了 PR。這時候最有用的不是報錯，是給一個
       點下去就能手動開 PR 的網址——內容都算好了，人只要按送出。 */
    console.error(`✖ 開 PR 失敗：${error.message}`);
    console.error(`  這個端點需要：${error.needs}（token 目前不足）`);
    console.error(`  分支已推送成功，手動開 PR：${compareUrl}`);
    process.exit(1);
  }
}
