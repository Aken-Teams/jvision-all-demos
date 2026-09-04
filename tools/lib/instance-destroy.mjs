/**
 * 把一個實例拆乾淨。
 *
 * ── 為什麼要獨立成一支 ────────────────────────────────
 * 一個實例最多散落在十一個地方，其中三個不在我們的機器上（Cloudflare 的 DNS、
 * Vercel 的專案、GitHub 的 repo）。原本的 `destroyInstance()` 只處理兩項——
 * 它本來是給測試用的，不是為使用者的「刪除」寫的。照原樣接上去的結果會是：
 * 主資料庫沒了，但 Vercel 上那個站還活著、還對外公開、環境變數裡還握著完整的
 * MySQL 帳密。**那比不做刪除更糟**：使用者以為刪掉了。
 *
 * ── 順序：先外面、後自己 ──────────────────────────────
 * 外部資源先拆。因為「這個實例的 DNS 叫什麼、Vercel 專案叫什麼」是從
 * `instances` 那一列推出來的——先把那一列刪掉，就再也找不到要清什麼了。
 * 反過來（先刪外部、我們這列還在）最壞只是重跑一次，是可以收拾的。
 *
 * ── 部分失敗怎麼辦 ────────────────────────────────────
 * 每一項各自回報成敗，任何一項失敗都不會讓後面停下來——一項清不掉不是留著
 * 其他十項的理由。全部跑完之後，只要**外部**還有殘留就不刪 `instances` 那一列，
 * 而是把狀態留在 deleting 並照實說哪一項沒清掉。留著那一列是為了還能再試一次；
 * 刪掉它才是真的收不回來。
 */
import fs from "node:fs";
import path from "node:path";
import { q, dropDatabase } from "./mysql.mjs";
import * as control from "./control-db.mjs";
import * as dns from "./instance-dns.mjs";

const env = (k) => {
  if (process.env[k]) return process.env[k];
  try {
    const m = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8").match(new RegExp(`^${k}=(.+)$`, "m"));
    return m ? m[1].trim() : null;
  } catch { return null; }
};

/* Vercel 專案名與公開資料庫名都是從實例推出來的，推法必須跟部署時一模一樣，
   不然刪的會是別人的東西——或什麼都刪不到。 */
export const vercelProject = (inst) => `jv-${String(inst.repo_name).replace(/^jvision-/, "").replace(/[^a-z0-9-]/g, "-")}`;
export const pubDbName = (inst) => `${inst.db_name}_pub`;

const ghRepo = (url) => {
  const m = /github\.com\/([^/]+)\/([^/\s]+)/.exec(String(url || ""));
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, "") } : null;
};

async function dbExists(name) {
  const r = await q("SELECT SCHEMA_NAME n FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?", [name]);
  return r.length > 0;
}

function dirSize(dir) {
  let bytes = 0; let files = 0;
  const walk = (d) => {
    let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else { files += 1; try { bytes += fs.statSync(p).size; } catch { /* 讀不到就不計 */ } }
    }
  };
  walk(dir);
  return { bytes, files };
}

/**
 * 現在這個實例實際上占用了哪些東西。
 *
 * 給確認視窗用。刻意逐項去問真實狀態而不是照資料庫欄位猜——欄位只記著
 * 「將來會叫什麼名字」，DNS 上有沒有那一筆、Vercel 上有沒有那個專案，
 * 要問了才知道。讓使用者在按下去之前看到的是事實。
 */
export async function plan(inst) {
  const out = { local: [], external: [], unknown: [] };

  const dir = dirSize(inst.dir);
  out.local.push({ id: "files", label: "這套系統的檔案", detail: `${dir.files} 個檔、${(dir.bytes / 1024).toFixed(0)} KB（含歷次版本與上傳的圖）` });
  out.local.push({ id: "db", label: "資料庫", detail: inst.db_name });

  const [ev] = await q("SELECT COUNT(*) n FROM events WHERE instance_id = ?", [inst.id]);
  const [cs] = await q("SELECT COUNT(*) n FROM chat_sessions WHERE instance_id = ?", [inst.id]);
  const [cm] = await q(`SELECT COUNT(*) n FROM chat_messages m
    JOIN chat_sessions s ON s.id = m.session_id WHERE s.instance_id = ?`, [inst.id]);
  out.local.push({ id: "chat", label: "對話紀錄", detail: `${cs.n} 段對話、${cm.n} 則訊息` });
  out.local.push({ id: "events", label: "事件紀錄", detail: `${ev.n} 筆（開通、修改、佈署…）` });

  /* 公開副本只有部署過 Vercel 才會有。 */
  const pub = pubDbName(inst);
  if (await dbExists(pub)) out.external.push({ id: "pubdb", label: "公開版的資料庫副本", detail: pub });

  try {
    const rec = await dns.find(inst.host);
    if (rec) out.external.push({ id: "dns", label: "已佈署的網址", detail: `https://${inst.host}/`, warn: true });
  } catch { out.unknown.push({ id: "dns", label: "佈署狀態", detail: "Cloudflare 問不到，刪除時會再試一次" }); }

  const token = env("VERCEL_TOKEN");
  if (token) {
    const name = vercelProject(inst);
    try {
      const r = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(name)}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
      if (r.ok) out.external.push({ id: "vercel", label: "Vercel 上的公開站", detail: name, warn: true });
    } catch { out.unknown.push({ id: "vercel", label: "Vercel 專案", detail: "問不到，刪除時會再試一次" }); }
  }

  const gh = ghRepo(inst.repo_url);
  if (gh) out.external.push({ id: "github", label: "GitHub repo", detail: `${gh.owner}/${gh.repo}`, warn: true, github: true });

  return out;
}

/* 每一步都包成「做不成也要往下走」，並回報自己的結果。 */
async function step(id, label, fn) {
  try { const note = await fn(); return { id, label, ok: true, note: note || null }; }
  catch (e) { return { id, label, ok: false, why: String(e && e.message ? e.message : e).slice(0, 160) }; }
}

/**
 * 真的拆掉。回 { steps, done, leftover }。
 *
 * leftover 只算**外部**的殘留——我們自己機器上的東西下次一定清得掉，
 * 外面的清不掉才需要留著那一列好再試一次。
 */
export async function destroy(inst, { onStep } = {}) {
  const steps = [];
  const push = async (id, label, fn) => {
    const r = await step(id, label, fn);
    steps.push(r);
    if (onStep) { try { onStep(r); } catch { /* 回報失敗不影響刪除 */ } }
    return r;
  };

  /* 先標記，讓還在看這個實例的人知道它正在被拆。 */
  await control.setInstanceState(inst.id, "deleting", {}).catch(() => {});

  // ── 外部 ────────────────────────────────────────────
  await push("dns", "把佈署的網址下線", async () => {
    const r = await dns.unpublish(inst.host);
    return r.removed ? `已移除 ${inst.host}` : "本來就沒有佈署";
  });

  const vt = env("VERCEL_TOKEN");
  await push("vercel", "刪掉 Vercel 上的公開站", async () => {
    if (!vt) return "沒有設定 Vercel 憑證，跳過";
    const name = vercelProject(inst);
    const r = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(name)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${vt}` }, signal: AbortSignal.timeout(30000) });
    if (r.status === 404) return "本來就沒有";
    if (!r.ok) throw new Error(`Vercel 回 ${r.status}`);
    return `已刪除 ${name}（含環境變數裡的資料庫帳密）`;
  });

  await push("pubdb", "刪掉公開版的資料庫副本", async () => {
    const pub = pubDbName(inst);
    if (!(await dbExists(pub))) return "本來就沒有";
    await dropDatabase(pub);
    return `已刪除 ${pub}`;
  });

  const gh = ghRepo(inst.repo_url);
  await push("github", "刪掉 GitHub repo", async () => {
    if (!gh) return "沒有交付過";
    const t = env("GITHUB_TOKEN");
    if (!t) throw new Error("沒有設定 GitHub 憑證");
    const r = await fetch(`https://api.github.com/repos/${gh.owner}/${gh.repo}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(30000) });
    if (r.status === 404) return "本來就沒有";
    if (r.status !== 204) throw new Error(`GitHub 回 ${r.status}`);
    return `已刪除 ${gh.owner}/${gh.repo}`;
  });

  const leftover = steps.filter((s) => !s.ok).map((s) => s.label);

  // ── 我們自己的 ──────────────────────────────────────
  await push("files", "刪掉這套系統的檔案", async () => {
    /* 只准刪 var/instances 底下的東西。dir 是資料庫欄位，不是常數——
       它要是哪天被寫成別的路徑，這一行就會遞迴刪掉不該刪的地方。 */
    const base = path.resolve(process.cwd(), "var", "instances");
    const target = path.resolve(inst.dir);
    if (!target.startsWith(base + path.sep)) throw new Error(`目錄不在 var/instances 底下：${inst.dir}`);
    if (!fs.existsSync(target)) return "本來就沒有";
    fs.rmSync(target, { recursive: true, force: true });
    return "已刪除";
  });

  await push("chat", "刪掉對話紀錄", async () => {
    await q(`DELETE m FROM chat_messages m JOIN chat_sessions s ON s.id = m.session_id
             WHERE s.instance_id = ?`, [inst.id]);
    await q("DELETE FROM chat_sessions WHERE instance_id = ?", [inst.id]);
    return "已刪除";
  });

  await push("events", "刪掉事件紀錄", async () => {
    await q("DELETE FROM events WHERE instance_id = ?", [inst.id]);
    return "已刪除";
  });

  await push("db", "刪掉資料庫", async () => {
    await dropDatabase(inst.db_name);
    return `已刪除 ${inst.db_name}`;
  });

  /* 外部還有殘留就留著那一列。刪掉它等於失去「還有什麼沒清」的線索，
     而那些東西正是最不該留下的（公開的站、還在解析的網址）。 */
  if (leftover.length) {
    return { steps, done: false, leftover };
  }

  await push("row", "移除這套系統的登錄", async () => {
    await q("DELETE FROM instances WHERE id = ?", [inst.id]);
    return "已移除";
  });
  return { steps, done: true, leftover: [] };
}

/**
 * 封存：可逆的下線。
 *
 * 「刪除」按下去就回不來了，而多數時候使用者要的其實是「先讓它不要在那裡」。
 * 封存把對外的網址收掉、從清單上移走，但資料庫、檔案、對話全部留著——
 * 改變主意的成本是按一下，而不是重做一套系統。
 */
export async function archive(inst) {
  const steps = [];
  steps.push(await step("dns", "把佈署的網址下線", async () => {
    const r = await dns.unpublish(inst.host);
    return r.removed ? `已移除 ${inst.host}` : "本來就沒有佈署";
  }));
  await control.setInstanceState(inst.id, "archived", { archived_at: new Date().toISOString().slice(0, 19).replace("T", " ") });
  return { steps };
}

/** 取消封存。網址不自動放回去——那是「佈署」那顆按鈕的事，要他自己決定。 */
export async function unarchive(inst) {
  await control.setInstanceState(inst.id, "live", { archived_at: null });
  return { ok: true };
}
