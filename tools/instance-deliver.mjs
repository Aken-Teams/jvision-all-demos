#!/usr/bin/env node
/**
 * 把一個客戶的系統打包成他自己的 GitHub repo。
 *
 * 交付的是「可以自己跑起來的東西」，不是原始碼快照：包含畫面、後端、
 * 資料表定義、Docker 設定與 CI。客戶 clone 下來 `docker compose up -d` 就能用，
 * 我們的主機關掉也不影響他。
 *
 * 交付版與站台版的差異刻意保留在樣板裡（tools/templates/deliver/）：
 *   - 連線資訊全部走環境變數，程式碼裡沒有任何密碼
 *   - 只有一個資料庫，不做多租戶
 *   - 身分驗證交給他自己的登入或反向代理（X-Forwarded-User）
 *
 * 兩種交付方式：
 *   預設      直接推上 main。第一次交付、或客戶不在意歷史時用這個。
 *   --pr      推成一條分支並開 PR。客戶已經在用那個 repo、想先看過再合併時用——
 *             直接覆蓋 main 會把他自己的修改蓋掉。
 *
 *   node tools/instance-deliver.mjs --instance=<實例編號> [--repo=<名稱>] [--pr] [--public] [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { ROOT, EXIT, parseArgs, makeLogger } from "./lib/forge-common.mjs";
import * as control from "./lib/control-db.mjs";
import { close } from "./lib/mysql.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const DRY = Boolean(args["dry-run"]);
/* 客戶的系統預設**私有**：那是他的營運資料結構，不該預設攤在外面。
   要公開得明講 --public。 */
const PRIVATE = !args.public;
/* 開 PR 而不是直接覆蓋 main。 */
const AS_PR = Boolean(args.pr);
const TEMPLATE = path.join(ROOT, "tools", "templates", "deliver");
const TOKEN = process.env.GITHUB_TOKEN || readEnvToken();
const OWNER = args.owner || process.env.GITHUB_DELIVER_OWNER || "JVision-pj";

function readEnvToken() {
  try {
    const m = fs.readFileSync(path.join(ROOT, ".env"), "utf8").match(/^GITHUB_TOKEN=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, e.name), to = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(from, to);
    else fs.copyFileSync(from, to);
  }
}

/** README 要寫給「拿到 repo 的人」看，不是寫給我們自己看。 */
function readme(inst, schema) {
  const tables = schema.tables.map((t) => `| ${t.name} | ${t.columns.length} | ${t.columns.map((c) => c.label).slice(0, 6).join("、")}${t.columns.length > 6 ? "…" : ""} |`).join("\n");
  return `# ${schema.title || inst.repo_name.replace(/^jvision-/, "")}

這是你的系統，完整的一套：畫面、後端、資料庫結構都在這個 repo 裡。
跑在你自己的機器上，不依賴我們的主機。

## 跑起來

\`\`\`bash
cp .env.example .env      # 改掉裡面的兩組密碼
docker compose up -d
\`\`\`

打開 http://localhost:8080 就是你的系統。

第一次啟動會自動建表並灌入範例資料。想從空的開始，把 \`.env\` 的 \`SEED\` 設成 \`0\`。

## 資料表

| 表 | 欄位數 | 欄位 |
|---|---|---|
${tables}

資料存在 docker 的具名磁碟區裡，\`docker compose down\` **不會**清掉。
真的要清空是 \`docker compose down -v\`。

## 改東西

- **加欄位、改欄位名稱**：直接用畫面右下角的助理，改完立刻生效。
- **改畫面**：\`public/index.html\` 是單一檔案，改完重新整理就看得到。
- **改資料結構**：\`schema.json\` 是建表的依據；已經建好的表不會因為改它而變動，
  要調整既有的表請直接下 SQL。

## 備份

\`\`\`bash
docker compose exec db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DB" > backup.sql
\`\`\`

## 這個 repo 有什麼

| 檔案 | 作用 |
|---|---|
| \`public/\` | 畫面（單一 HTML ＋ 執行時腳本） |
| \`server.mjs\` | 後端：送畫面、提供資料 API |
| \`instance-db.mjs\` | 資料層：建表、CRUD、稽核紀錄 |
| \`schema.json\` | 資料表定義 |
| \`docker-compose.yml\` | 一行把系統與資料庫都跑起來 |
| \`.github/workflows/ci.yml\` | 每次推送都實際跑一遍，確認系統起得來、資料存得住 |

---
由 JVision 交付．${new Date().toISOString().slice(0, 10)}
`;
}

async function api(pathname, init = {}) {
  const r = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: { authorization: `Bearer ${TOKEN}`, accept: "application/vnd.github+json",
      "user-agent": "jvision-deliver", ...(init.headers || {}) },
  });
  let data = null;
  try { data = await r.json(); } catch { /* 204 沒有 body */ }
  return { status: r.status, data };
}

async function main() {
  const instanceId = args.instance;
  if (!instanceId) {
    log.error("用法：node tools/instance-deliver.mjs --instance=<實例編號> [--repo=名稱] [--public]");
    process.exit(EXIT.BAD_INPUT);
  }
  const inst = await control.getInstance(instanceId);
  if (!inst) { log.error(`找不到實例 ${instanceId}`); process.exit(EXIT.BAD_INPUT); }
  const pub = path.join(inst.dir, "public");
  if (!fs.existsSync(pub)) { log.error(`實例目錄不完整：${pub}`); process.exit(EXIT.BAD_INPUT); }

  const schemaPath = path.join(ROOT, "content", "schema", `${inst.repo_name}.json`);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const repo = String(args.repo || `${inst.repo_name.replace(/^jvision-/, "")}-${inst.id.slice(-6)}`)
    .toLowerCase().replace(/[^a-z0-9._-]/g, "-").slice(0, 90);

  log.step(`交付 ${inst.repo_name} → ${OWNER}/${repo}`);

  /* ── 組出交付內容 ─────────────────────────────────── */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jv-deliver-"));
  try {
    copyTree(TEMPLATE, tmp);
    copyTree(pub, path.join(tmp, "public"));
    /* 資料層直接沿用站台那一份，不另外維護一份交付專用的——
       兩份遲早會分岔，而分岔的那天沒有人會發現。 */
    fs.copyFileSync(path.join(ROOT, "tools", "lib", "instance-db.mjs"), path.join(tmp, "instance-db.mjs"));
    /* 它 import 的是 ./mysql.mjs，交付版對應到 db.mjs（從環境變數讀連線）。 */
    const dbLayer = fs.readFileSync(path.join(tmp, "instance-db.mjs"), "utf8")
      .replace('from "./mysql.mjs"', 'from "./db.mjs"');
    fs.writeFileSync(path.join(tmp, "instance-db.mjs"), dbLayer);
    fs.writeFileSync(path.join(tmp, "schema.json"), JSON.stringify(schema, null, 2) + "\n");
    fs.writeFileSync(path.join(tmp, "README.md"), readme(inst, schema));

    const files = [];
    (function walk(d, rel = "") {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(d, e.name), path.join(rel, e.name));
        else files.push(path.join(rel, e.name));
      }
    })(tmp);
    log.info(`  打包 ${files.length} 個檔案`);

    if (DRY) {
      log.info(`  將建立 ${OWNER}/${repo}（${PRIVATE ? "私有" : "公開"}）`);
      files.slice(0, 12).forEach((f) => log.info(`    ${f}`));
      if (files.length > 12) log.info(`    …另外 ${files.length - 12} 個`);
      return;
    }
    if (!TOKEN) { log.error("找不到 GITHUB_TOKEN（放在 .env 或環境變數）"); process.exit(EXIT.BAD_INPUT); }

    /* ── 建 repo ─────────────────────────────────────── */
    const chk = await api(`/repos/${OWNER}/${repo}`);
    if (chk.status === 404) {
      const mk = await api(`/orgs/${OWNER}/repos`, { method: "POST", body: JSON.stringify({
        name: repo, private: PRIVATE,
        description: `${schema.title || inst.repo_name}｜由 JVision 交付`.slice(0, 140),
        has_issues: true, has_projects: false, has_wiki: false,
      }) });
      if (mk.status !== 201) throw new Error(`建立 repo 失敗 ${mk.status}：${mk.data?.message || ""}`);
      log.info(`  已建立 ${OWNER}/${repo}`);
    } else if (chk.status !== 200) {
      throw new Error(`查詢 repo 失敗 ${chk.status}：${chk.data?.message || ""}`);
    } else {
      log.info("  repo 已存在，推新版本上去");
    }

    /* ── 推內容 ──────────────────────────────────────
       走 HTTPS 而不是 SSH：systemd unit 內的 22 埠出流量實測會無限期懸掛。
       憑證用 GIT_CONFIG_* 傳，放在網址或 argv 裡的話 ps 與錯誤訊息都看得到。 */
    const basic = Buffer.from(`x-access-token:${TOKEN}`).toString("base64");
    const g = (...a) => execFileSync("git", a, { cwd: tmp, stdio: "pipe", timeout: 180000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
        GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}` } });
    const branch = AS_PR ? `update-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36).slice(-4)}` : "main";
    g("init", "-q", "-b", branch);
    g("config", "user.email", "deliver@jvision.local");
    g("config", "user.name", "JVision Deliver");
    g("add", "-A");
    g("commit", "-q", "-m", `交付 ${schema.title || inst.repo_name}`);
    /* PR 模式也用 force：這個分支是這次交付專用的，不會有別人的東西在上面。
       main 則只有非 PR 模式才會被覆蓋。 */
    let ciSkipped = false;
    try {
      g("push", "-q", "--force", `https://github.com/${OWNER}/${repo}.git`, branch);
    } catch (error) {
      /* GitHub 不讓沒有 workflow 權限的 token 推 .github/workflows/。
         少一個 CI 檔不該讓整份交付失敗——其餘的東西客戶照樣跑得起來，
         那個檔另外給他自己放。 */
      /* 三個都串起來看。execFileSync 失敗時 error.stdout 常常是「空的 Buffer」，
         而空 Buffer 在 JS 裡是 truthy——用 || 串會永遠選到它，真正的訊息在
         stderr 裡卻永遠讀不到，於是這個 catch 形同虛設。 */
      const msg = [error.stdout, error.stderr, error.message].map((x) => String(x || "")).join("\n");
      if (!/workflow\` scope|workflows/.test(msg)) throw error;
      log.warn("  token 沒有 workflow 權限，這次不含 CI 設定檔");
      fs.rmSync(path.join(tmp, ".github"), { recursive: true, force: true });
      fs.writeFileSync(path.join(tmp, "CI-說明.md"),
        "# CI 沒有一起交付\n\n" +
        "交付用的 token 沒有 workflow 權限，GitHub 因此拒絕建立 .github/workflows/。\n" +
        "系統本身完全不受影響，`docker compose up -d` 照常可用。\n\n" +
        "要補上自動測試的話，向我們索取 ci.yml 放到 .github/workflows/ 即可。\n");
      g("add", "-A");
      g("commit", "-q", "--amend", "--no-edit");
      g("push", "-q", "--force", `https://github.com/${OWNER}/${repo}.git`, branch);
      ciSkipped = true;
    }

    let prUrl = null;
    if (AS_PR) {
      /* repo 剛建立時預設分支可能還沒有任何 commit，PR 會開不成——
         那種情況直接把這條分支設成預設分支，客戶一樣看得到內容。 */
      const info = await api(`/repos/${OWNER}/${repo}`);
      const base = info.data?.default_branch || "main";
      if (base === branch) {
        log.info("  這是第一次交付，內容已經在預設分支上，不需要 PR");
      } else {
        const pr = await api(`/repos/${OWNER}/${repo}/pulls`, { method: "POST", body: JSON.stringify({
          title: `更新 ${schema.title || inst.repo_name}`,
          head: branch, base,
          body: "這是你在 JVision 上對這套系統所做的修改。\n\n合併前可以先看 diff；不合併也不影響你正在跑的版本。",
        }) });
        if (pr.status === 201) { prUrl = pr.data.html_url; log.info(`  已開 PR：${prUrl}`); }
        else log.warn(`  PR 開不成（${pr.status}）：${pr.data?.message || ""}——分支已經推上去了，可以自己開`);
      }
    }

    const url = prUrl || `https://github.com/${OWNER}/${repo}`;
    await control.setInstanceState(inst.id, inst.state, { repo_url: url });
    await control.recordEvent({ kind: "instance.delivered", customerId: inst.customer_id,
      instanceId: inst.id, actor: null, detail: { repo: `${OWNER}/${repo}`, url } });
    log.step(`已交付：${url}`);
    if (ciSkipped) log.info("  （不含 CI 設定檔，原因見 repo 裡的 CI-說明.md）");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main()
  .catch((e) => { log.error(e.message); process.exitCode = EXIT.BAD_INPUT; })
  .finally(() => close());
