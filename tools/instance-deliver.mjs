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
import * as nextBundle from "./lib/nextjs-bundle.mjs";

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

/**
 * 分支名消毒。這個字串會進 git 指令、也會進網址，而它來自使用者。
 *
 * 只收 git 真的允許、而且不會被當成選項或路徑跳脫的形狀：英數與 . _ - /，
 * 不能以 - 開頭（會被 git 當參數）、不能有 ..（refspec 不合法也容易出事）、
 * 不能以 / 開頭或結尾。判不出來就回 null，呼叫端退回預設分支。
 */
function branchName(v) {
  const b = String(v || "").trim();
  if (!b) return null;
  if (b.length > 100) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9._\/-]*$/.test(b)) return null;
  if (b.includes("..") || b.endsWith("/") || b.endsWith(".lock")) return null;
  return b;
}

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
/* 產生三份規格文件要的來源資料。
   內容取自這套系統原本的專案規格（content/details），但標題用客戶自己取的名字——
   他看到的封面應該是他的系統，不是我們的展示品編號。
   讀不到就回 null，交付照樣進行，只是少那三份檔。 */
function specSource(inst, schema) {
  try {
    const dp = path.join(ROOT, "content", "details", `${inst.repo_name}.json`);
    const d = JSON.parse(fs.readFileSync(dp, "utf8"));
    return { d: { ...d, repoName: inst.repo_name, title: inst.display_name || d.title || inst.repo_name }, schema };
  } catch { return null; }
}

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
    /* 交付的內容跟 Vercel 部署共用同一支產生器。兩邊各寫一份的話，
       改了畫面的處理方式只會記得改一邊，而另一邊要等客戶回報才會發現。
       差別只在外殼：Vercel 那邊是雲端函式，這邊是他自己的 Docker。 */
    nextBundle.build(pub, tmp, {
      target: "docker",
      schema,
      spec: specSource(inst, schema),
      sharedDir: path.join(ROOT, "shared"),
      libFiles: [
        /* 資料層直接沿用站台那一份，不另外維護一份交付專用的——
           兩份遲早會分岔，而分岔的那天沒有人會發現。
           它 import 的是 ./mysql.mjs，交付樣板的 db.mjs 就是那一份的對應物
           （從環境變數讀連線，程式碼裡沒有密碼）。 */
        { name: "mysql.mjs", from: path.join(TEMPLATE, "db.mjs") },
        { name: "instance-db.mjs", from: path.join(ROOT, "tools", "lib", "instance-db.mjs") },
      ],
    });
    /* Docker、compose、CI 這些外殼在 build 之後才蓋上去——反過來的話
       樣板裡的檔會把 Next 產生的同名檔覆蓋掉。 */
    copyTree(TEMPLATE, tmp);
    fs.rmSync(path.join(tmp, "db.mjs"), { force: true });   // 已經以 lib/mysql.mjs 的身分放好了
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
    const g = (...a) => execFileSync("git", a, { cwd: tmp, stdio: "pipe", encoding: "utf8", timeout: 180000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_CONFIG_COUNT: "1",
        GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
        GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${basic}` } });
    const remote = `https://github.com/${OWNER}/${repo}.git`;
    /* 推到哪一條分支由呼叫端決定。
       這裡本來只有兩個寫死的選擇（更新→main、開 PR→固定的審核分支），而
       「開 PR」這個名字把工具的能力講小了也講歪了：它實際做的是「把這一版
       推到一條分支」，開不開 PR 是 GitHub 那邊的事，而且需要 token 有
       pull requests 權限——沒有的時候整顆按鈕就變成謊話。

       改成推到指定分支，要不要開 PR 讓使用者自己在 GitHub 上決定（推完會給
       compare 連結，按下去表單就填好了）。分支不存在就是建一條新的，
       這也讓「同時有好幾條在進行」變成可能。 */
    const branch = branchName(args.branch) || (AS_PR ? "jvision-update" : "main");

    g("init", "-q");
    g("config", "user.email", "deliver@jvision.local");
    g("config", "user.name", "JVision Deliver");

    /* ── 接上遠端已經有的歷史 ────────────────────────────
       這裡以前是 `git init -b <分支>` 直接 commit，也就是**每次交付都造出一個
       全新的孤兒 commit**。後果有兩個：

       一、`main` 被 force push 蓋掉之後，前一版在 GitHub 上就沒了——客戶自己
           在 repo 上加的東西一起消失，而且不會有任何提示。
       二、開 PR 根本開不出有意義的東西。實測 main 與 update 分支各自都是
           「父 commit 數 = 0」的根 commit，compare 回 404、沒有共同祖先，
           GitHub 給不出 diff。「先看 diff 再決定要不要合」這件事從來沒成立過。

       改成先把遠端抓下來接在上面：交付就是在既有歷史上多一個 commit，
       開 PR 也才比得出「這次改了哪些檔」。repo 是空的（第一次交付）就照舊
       開新歷史。 */
    let based = false;
    try {
      g("remote", "add", "origin", remote);
      /* 只抓一層。歷史再長也不需要——要的只是「接得上」這件事。 */
      /* 一定要先試著接在**目標分支**上，而不是永遠接預設分支。
         那條分支已經有前幾次推上去的東西，接 main 的話這次的 commit 就不是
         它的後代，push 會被擋成 non-fast-forward（實測：同一條分支推第二次
         必定失敗）。這裡本來寫成 `AS_PR ? branch : "HEAD"`——判斷用的是
         「有沒有帶 --pr」而不是「要推到哪」，網頁流程不帶 --pr，於是推到
         任何非預設分支的第二次都會壞掉。

         分支還不存在（第一次推）才退回接預設分支，那時候是從正式版長出
         一條新的，正是想要的行為。 */
      try { g("fetch", "-q", "--depth", "1", "origin", branch); }
      catch { g("fetch", "-q", "--depth", "1", "origin", "HEAD"); }
      /* 不能用 git checkout：交付內容在 git init 之前就 build 到這個目錄裡了，
         checkout 會說「未追蹤的檔案將被覆蓋」而拒絕動作（實測踩過，失敗被
         catch 接住之後就悄悄退回 force push，等於整段修正沒有生效）。

         改成只搬指標、不碰工作目錄：
           update-ref    把分支指到遠端那一版
           symbolic-ref  HEAD 指到這條分支
           reset（mixed）索引載入成遠端那一版，工作目錄維持我們 build 出來的
         接著 add -A 算出來的就是「相對於遠端的差異」，而且遠端有、這次沒有
         產生的檔會被標成刪除，不會殘留。 */
      g("update-ref", `refs/heads/${branch}`, "FETCH_HEAD");
      g("symbolic-ref", "HEAD", `refs/heads/${branch}`);
      g("reset", "-q");
      based = true;
      log.info("  接上遠端既有的歷史");
    } catch {
      /* repo 剛建立、還沒有任何 commit 時 fetch 會失敗，那是正常的。 */
      g("checkout", "-q", "-b", branch);
      log.info("  這個 repo 還是空的，建立第一版");
    }

    g("add", "-A");
    /* 內容跟上一版一模一樣時 commit 會失敗（沒有東西可提交）。那不是錯誤，
       是「這次沒有任何改動」——照樣往下走，push 是 no-op，PR 會是空的。 */
    let changed = true;
    try {
      g("commit", "-q", "-m", `交付 ${schema.title || inst.repo_name}`);
    } catch (error) {
      const m = [error.stdout, error.stderr].map((x) => String(x || "")).join("\n");
      if (!/nothing to commit|working tree clean/.test(m)) throw error;
      changed = false;
      log.info("  跟上一版一模一樣，沒有東西要交付");
    }
    if (based && !changed && AS_PR) {
      log.step("這次沒有任何改動，不開 PR");
      return;
    }
    /* PR 模式也用 force：這個分支是這次交付專用的，不會有別人的東西在上面。
       main 則只有非 PR 模式才會被覆蓋。 */
    let ciSkipped = false;
    try {
      /* 接得上遠端歷史就不用 force——force 的存在本來就是為了掩蓋
         「新歷史跟舊歷史無關」這件事。接不上（第一次交付）才需要。 */
      g("push", "-q", ...(based ? [] : ["--force"]), remote, branch);
    } catch (error) {
      /* GitHub 不讓沒有 workflow 權限的 token 推 .github/workflows/。
         少一個 CI 檔不該讓整份交付失敗——其餘的東西客戶照樣跑得起來，
         那個檔另外給他自己放。 */
      /* 三個都串起來看，不要用 || 挑一個。
         execFileSync 沒設 encoding 時 stdout/stderr 是 Buffer，而「空的 Buffer」
         在 JS 裡是 truthy——用 || 串會永遠選到空的那個，真正的訊息在 stderr 卻
         永遠讀不到，整個 catch 形同虛設（實測踩過，查了半天）。
         上面已經補上 encoding: "utf8" 之後它們是字串、空字串是 falsy，但這裡
         仍然串起來：來源萬一再變回 Buffer，這段不該又悄悄失效。 */
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
      /* 拿掉 .github 之後可能跟遠端完全一樣——第二次以後的交付一定會這樣：
         上一次已經把 .github 拿掉、CI-說明.md 也推上去了，所以這次唯一的
         「改動」就是又被塞回來的 .github，刪掉它就什麼都不剩。
         那時 --amend 會變成空提交，git 直接拒絕，整個交付以「沒有成功」收場，
         而使用者其實什麼問題都沒有——他只是沒改東西。 */
      let empty = false;
      try {
        g("commit", "-q", "--amend", "--no-edit");
      } catch (e2) {
        const m2 = [e2.stdout, e2.stderr].map((x) => String(x || "")).join("\n");
        if (!/空提交|empty commit|nothing to commit/.test(m2)) throw e2;
        empty = true;
      }
      if (empty && based) {
        /* 這次沒有任何要送出去的東西。把剛才那個 commit 丟掉，遠端維持原樣。 */
        g("reset", "-q", "--hard", "FETCH_HEAD");
        const same = `https://github.com/${OWNER}/${repo}`;
        await control.setInstanceState(inst.id, inst.state, { repo_url: same });
        /* 網址要印出來：呼叫端是從標準輸出撈 github 連結的，沒有印的話
           畫面會拿不到 repo 網址，看起來像交付失敗。 */
        log.info(`  推到分支：${branch}`);
        log.step(`沒有東西要更新，GitHub 上已經是最新的：${same}`);
        return;
      }
      g("push", "-q", ...(based ? [] : ["--force"]), remote, branch);
      ciSkipped = true;
    }

    /* 推到非預設分支時，一律給 compare 連結。
       那一頁按下去就是開 PR 的表單，base 與 head 都填好了——不需要我們有
       pull requests 權限，也不需要一顆叫「開 PR」但其實開不成的按鈕。
       要不要開、什麼時候開，交給使用者在 GitHub 上決定。 */
    const info = await api(`/repos/${OWNER}/${repo}`);
    const base = info.data?.default_branch || "main";
    let compareUrl = null;
    if (base !== branch) {
      compareUrl = `https://github.com/${OWNER}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(branch)}?expand=1`;
    }

    /* --pr 只留給命令列用。網頁上已經改成「選分支推上去」，不再走這條。 */
    let prUrl = null;
    if (AS_PR && compareUrl) {
      const pr = await api(`/repos/${OWNER}/${repo}/pulls`, { method: "POST", body: JSON.stringify({
        title: `更新 ${schema.title || inst.repo_name}`,
        head: branch, base,
        body: "這是你在 JVision 上對這套系統所做的修改。\n\n合併前可以先看 diff；不合併也不影響你正在跑的版本。",
      }) });
      if (pr.status === 201) { prUrl = pr.data.html_url; log.info(`  已開 PR：${prUrl}`); }
      else log.warn(`  PR 沒開成（${pr.status}）：${pr.data?.message || ""}——分支已經推上去了`);
    }

    /* repo_url 一律存 repo 本身。以前 PR 模式會把它覆蓋成 PR 網址，於是
       「這套系統交付到哪」永遠指向某一次的 PR，PR 合併關掉之後那個連結就
       變成一個歷史頁面。PR 網址只在這一次的回應裡給。 */
    const repoUrl = `https://github.com/${OWNER}/${repo}`;
    const url = prUrl || repoUrl;
    await control.setInstanceState(inst.id, inst.state, { repo_url: repoUrl });
    await control.recordEvent({ kind: "instance.delivered", customerId: inst.customer_id,
      instanceId: inst.id, actor: null, detail: { repo: `${OWNER}/${repo}`, url, repoUrl } });
    log.info(`  推到分支：${branch}`);
    if (compareUrl) log.info(`  要開 PR 的話：${compareUrl}`);
    log.step(`已交付：${url}`);
    if (ciSkipped) log.info("  （不含 CI 設定檔，原因見 repo 裡的 CI-說明.md）");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main()
  .catch((e) => { log.error(e.message); process.exitCode = EXIT.BAD_INPUT; })
  .finally(() => close());
