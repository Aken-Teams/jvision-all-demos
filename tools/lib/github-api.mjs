/**
 * GitHub 唯讀查詢。目前只有「這個 repo 上有哪些分支」。
 *
 * 為什麼獨立一支：交付腳本（instance-deliver.mjs）是命令列工具，底部直接
 * 跑 main()，閘道不能 import 它——但閘道也要問 GitHub 同樣的問題。與其在
 * dev.mjs 裡再抄一份 fetch 與 token 讀取，不如把這一小塊抽出來共用。
 *
 * 憑證與交付腳本同一把：環境變數優先，其次 .env。讀不到就當作「查不到」，
 * 不要讓整個交付頁掛掉——分支清單只是方便，沒有它照樣可以自己打名字。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./forge-common.mjs";

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env"), "utf8").match(/^GITHUB_TOKEN=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

async function api(pathname) {
  const t = token();
  if (!t) throw new Error("找不到 GITHUB_TOKEN");
  const r = await fetch(`https://api.github.com${pathname}`, {
    headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}

/**
 * 分支清單與預設分支。
 *
 * 預設分支要一起回：畫面上要標出「這條是正式版」，而那件事不能寫死成 main
 * ——repo 是客戶的，他改得動預設分支。
 */
export async function branches(owner, repo) {
  const name = String(repo).replace(/\.git$/, "");
  const [list, info] = await Promise.all([
    api(`/repos/${owner}/${name}/branches?per_page=100`),
    api(`/repos/${owner}/${name}`),
  ]);
  return {
    base: info.default_branch || null,
    branches: list.map((b) => b.name).sort((a, b) => a.localeCompare(b)),
  };
}
