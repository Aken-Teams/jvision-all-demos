/**
 * 計價與額度。
 *
 * ── 一句話 ────────────────────────────────────────────
 * 資料庫存的永遠是原始 token 數。倍率只在「要跟人收多少錢」的時候乘上去，
 * 而且是在用量發生的當下就算好、釘在那一筆上。
 *
 * ── 為什麼倍率要有生效日，不是一個可以就地改掉的欄位 ──
 * 老闆哪天說「改成 ×2」，那是**從今天開始**改成 ×2，不是把上個月已經算好的
 * 帳全部改寫。如果倍率只是一個欄位、金額每次讀的時候現算，改一次倍率會讓
 * 所有歷史帳目一起變動——已經跟客戶對過的數字隔天長不一樣，那是災難。
 *
 * 所以兩道保險：
 *   1. billing_rates 是一份有生效日的歷史，只新增不修改；
 *   2. 每一筆 token_usage 在寫進去時就把當時的倍率與金額釘在自己身上。
 * 切點因此是自動的：改倍率之後寫進來的才用新的。
 *
 * ── 金額怎麼算 ────────────────────────────────────────
 *   金額 = 計費 token ÷ 1,000,000 × 每百萬單價 × 倍率
 * 一律用這個公式，不看各家 API 回報的成本——那個欄位有一半是 null
 * （codex 的事件不含模型與單價），混著用會出現一個沒辦法解釋的數字。
 * 統一用 token 算，畫面上就寫得出「每百萬 US$3.00 × 5 倍」。
 * 原始的 cost 欄位還留著，當作對帳用的參考值。
 */
import { q } from "./mysql.mjs";

const DDL = [
  `CREATE TABLE IF NOT EXISTS billing_rates (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     effective_from DATETIME NOT NULL,
     multiplier DECIMAL(6,2) NOT NULL DEFAULT 5.00,
     usd_per_mtok DECIMAL(10,4) NOT NULL DEFAULT 3.0000,
     default_quota_usd DECIMAL(10,2) NOT NULL DEFAULT 20.00,
     note VARCHAR(200),
     created_at DATETIME NOT NULL,
     created_by VARCHAR(190),
     INDEX idx_from (effective_from)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  /* 個人額度。沒有列就用當時設定的預設值——不預先幫每個人建一列，
     那樣改預設值時還要回頭掃一遍所有人。 */
  `CREATE TABLE IF NOT EXISTS user_quotas (
     email VARCHAR(190) PRIMARY KEY,
     limit_usd DECIMAL(10,2) NOT NULL,
     note VARCHAR(200),
     updated_at DATETIME NOT NULL,
     updated_by VARCHAR(190)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  /* 加額度的申請。使用者只能提出想要多少，最後給多少是管理者決定的
     ——所以「想要」與「核給」是兩個欄位，不是同一個。 */
  `CREATE TABLE IF NOT EXISTS quota_requests (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     actor VARCHAR(190) NOT NULL,
     want_usd DECIMAL(10,2) NOT NULL,
     reason VARCHAR(500),
     state VARCHAR(12) NOT NULL DEFAULT 'pending',
     granted_usd DECIMAL(10,2) NULL,
     decided_by VARCHAR(190),
     decided_at DATETIME,
     decided_note VARCHAR(300),
     created_at DATETIME NOT NULL,
     INDEX idx_state (state, created_at),
     INDEX idx_actor (actor, created_at)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

/* 後來才加的欄位。已經有了會丟 ER_DUP_FIELDNAME，忽略掉就是冪等的。 */
const COLS = [
  "ALTER TABLE token_usage ADD COLUMN bill_multiplier DECIMAL(6,2)",
  "ALTER TABLE token_usage ADD COLUMN bill_rate DECIMAL(10,4)",
  "ALTER TABLE token_usage ADD COLUMN bill_usd DECIMAL(12,6)",
];

const FALLBACK = { multiplier: 5, usdPerMtok: 3, defaultQuotaUsd: 20 };

let ready = null;
export function ensureSchema() {
  if (!ready) ready = (async () => {
    for (const ddl of DDL) await q(ddl);
    for (const c of COLS) {
      try { await q(c); } catch (e) { if (e.code !== "ER_DUP_FIELDNAME") throw e; }
    }
    /* 第一次跑：把預設值寫成第一筆生效紀錄，生效日往前推，
       這樣既有的用量也有一個可以套用的倍率。 */
    const [n] = await q("SELECT COUNT(*) c FROM billing_rates");
    if (!Number(n.c)) {
      await q(`INSERT INTO billing_rates
          (effective_from, multiplier, usd_per_mtok, default_quota_usd, note, created_at, created_by)
        VALUES ('2000-01-01 00:00:00', ?, ?, ?, '開站預設', NOW(), 'system')`,
      [FALLBACK.multiplier, FALLBACK.usdPerMtok, FALLBACK.defaultQuotaUsd]);
    }
    /* 舊資料補算一次。以後寫進來的在當下就會帶著金額。 */
    await backfill();
  })();
  return ready;
}

const BILLABLE = "tok_in + tok_out + tok_cache_write";

/** 目前生效的那一份設定。 */
export async function currentRate() {
  await ensureSchema();
  const [r] = await q(
    `SELECT * FROM billing_rates WHERE effective_from <= NOW()
      ORDER BY effective_from DESC, id DESC LIMIT 1`);
  if (!r) return { ...FALLBACK, id: null, effectiveFrom: null };
  return {
    id: r.id,
    multiplier: Number(r.multiplier),
    usdPerMtok: Number(r.usd_per_mtok),
    defaultQuotaUsd: Number(r.default_quota_usd),
    effectiveFrom: r.effective_from,
    note: r.note || "",
  };
}

/** 倍率的完整歷史。切點看得到，才知道某一筆帳是用哪一份算的。 */
export async function rateHistory(limit = 30) {
  await ensureSchema();
  return q(`SELECT id, effective_from, multiplier, usd_per_mtok, default_quota_usd,
                   note, created_at, created_by
              FROM billing_rates ORDER BY effective_from DESC, id DESC LIMIT ?`, [Number(limit) || 30]);
}

/**
 * 換一份設定。**只新增,不改舊的**——舊的那一份就是舊帳的依據。
 * 生效日可以往後填（先公告再生效），但不能往前：往前填等於偷偷改寫已經
 * 發生的帳，而那些帳早就釘在各自的 token_usage 上了，改了也對不起來。
 */
export async function setRate({ multiplier, usdPerMtok, defaultQuotaUsd, effectiveFrom, note, actor }) {
  await ensureSchema();
  const cur = await currentRate();
  const m = Number(multiplier);
  const r = Number(usdPerMtok);
  const dq = Number(defaultQuotaUsd);
  if (!(m > 0) || m > 100) throw Object.assign(new Error("倍率要在 0 與 100 之間"), { status: 400 });
  if (!(r > 0) || r > 1000) throw Object.assign(new Error("每百萬 token 單價不合理"), { status: 400 });
  if (!(dq >= 0) || dq > 100000) throw Object.assign(new Error("預設額度不合理"), { status: 400 });

  const from = effectiveFrom ? new Date(effectiveFrom) : new Date();
  if (Number.isNaN(from.getTime())) throw Object.assign(new Error("生效時間看不懂"), { status: 400 });
  if (from.getTime() < Date.now() - 60000) {
    throw Object.assign(new Error("生效時間不能往前填——那會改寫已經算過的帳"), { status: 400 });
  }
  await q(`INSERT INTO billing_rates
      (effective_from, multiplier, usd_per_mtok, default_quota_usd, note, created_at, created_by)
    VALUES (?,?,?,?,?,NOW(),?)`,
  [from, m, r, dq, String(note || "").slice(0, 200) || null, String(actor || "").slice(0, 190) || null]);
  return { before: cur, after: await currentRate() };
}

/** 這麼多 token 要收多少錢。四捨五入到小數第 6 位再存，顯示時才進到分。 */
export function amountFor(tokens, rate) {
  const n = Math.max(0, Number(tokens) || 0);
  const usd = (n / 1000000) * rate.usdPerMtok * rate.multiplier;
  return Math.round(usd * 1000000) / 1000000;
}

/**
 * 補算沒有金額的舊資料。用「那一筆發生當下生效的那一份設定」，
 * 不是現在這一份——不然開站以來的帳會全部套上今天的倍率。
 */
async function backfill() {
  const [n] = await q(`SELECT COUNT(*) c FROM token_usage WHERE bill_usd IS NULL`);
  if (!Number(n.c)) return 0;
  const rates = await q(`SELECT effective_from, multiplier, usd_per_mtok
                           FROM billing_rates ORDER BY effective_from`);
  const rows = await q(`SELECT id, at, ${BILLABLE} tk FROM token_usage WHERE bill_usd IS NULL`);
  for (const row of rows) {
    let use = rates[0];
    for (const r of rates) if (new Date(r.effective_from) <= new Date(row.at)) use = r;
    const rate = { multiplier: Number(use.multiplier), usdPerMtok: Number(use.usd_per_mtok) };
    await q("UPDATE token_usage SET bill_multiplier=?, bill_rate=?, bill_usd=? WHERE id=?",
      [rate.multiplier, rate.usdPerMtok, amountFor(row.tk, rate), row.id]);
  }
  return rows.length;
}

/** 這個人的額度。沒有自己的設定就用當時的預設值。 */
export async function quotaFor(email) {
  await ensureSchema();
  const rate = await currentRate();
  const [own] = await q("SELECT limit_usd, note, updated_at, updated_by FROM user_quotas WHERE email=?", [email]);
  const [used] = await q("SELECT COALESCE(SUM(bill_usd),0) u FROM token_usage WHERE actor=?", [email]);
  const limit = own ? Number(own.limit_usd) : rate.defaultQuotaUsd;
  const spent = Math.round((Number(used.u) || 0) * 100) / 100;
  const [pending] = await q(
    `SELECT id, want_usd, reason, created_at FROM quota_requests
      WHERE actor=? AND state='pending' ORDER BY id DESC LIMIT 1`, [email]);
  const [last] = await q(
    `SELECT id, want_usd, state, granted_usd, decided_at, decided_note FROM quota_requests
      WHERE actor=? AND state<>'pending' ORDER BY id DESC LIMIT 1`, [email]);
  return {
    limit, spent,
    left: Math.round((limit - spent) * 100) / 100,
    custom: !!own,
    multiplier: rate.multiplier,
    usdPerMtok: rate.usdPerMtok,
    pending: pending || null,
    last: last || null,
  };
}

/** 額度還夠不夠再跑一次。不夠就擋下來——不擋的話這個數字只是裝飾。 */
export async function checkQuota(email) {
  try {
    const qta = await quotaFor(email);
    if (qta.left > 0) return { ok: true, quota: qta };
    return { ok: false, quota: qta,
      error: `你的額度用完了（上限 US$${qta.limit.toFixed(2)}，已用 US$${qta.spent.toFixed(2)}）。到「個人設定 › 目前用量」可以提出調高額度的申請。` };
  } catch {
    /* 額度查不到就放行。查不到是我們這邊的問題，不該變成使用者不能工作。 */
    return { ok: true, quota: null };
  }
}

/** 管理者直接設某個人的額度。 */
export async function setQuota(email, limitUsd, { note, actor } = {}) {
  await ensureSchema();
  const clean = String(email || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) throw Object.assign(new Error("這不是有效的信箱"), { status: 400 });
  const n = Number(limitUsd);
  if (!(n >= 0) || n > 100000) throw Object.assign(new Error("額度不合理"), { status: 400 });
  await q(`INSERT INTO user_quotas(email, limit_usd, note, updated_at, updated_by)
           VALUES(?,?,?,NOW(),?)
           ON DUPLICATE KEY UPDATE limit_usd=VALUES(limit_usd), note=VALUES(note),
                                   updated_at=VALUES(updated_at), updated_by=VALUES(updated_by)`,
  [clean, n, String(note || "").slice(0, 200) || null, String(actor || "").slice(0, 190) || null]);
  return quotaFor(clean);
}

/** 改回用預設值。 */
export async function clearQuota(email) {
  await ensureSchema();
  await q("DELETE FROM user_quotas WHERE email=?", [String(email || "").toLowerCase()]);
  return quotaFor(String(email || "").toLowerCase());
}

/** 使用者提出申請。一次只能有一筆待審——重複送只是讓管理者看到三份一樣的。 */
export async function requestQuota(email, wantUsd, reason) {
  await ensureSchema();
  const n = Number(wantUsd);
  if (!(n > 0) || n > 100000) throw Object.assign(new Error("想要的額度不合理"), { status: 400 });
  const [dup] = await q("SELECT id FROM quota_requests WHERE actor=? AND state='pending'", [email]);
  if (dup) throw Object.assign(new Error("你已經有一筆申請在等審核了"), { status: 409 });
  await q(`INSERT INTO quota_requests(actor, want_usd, reason, state, created_at)
           VALUES(?,?,?,'pending',NOW())`,
  [email, n, String(reason || "").slice(0, 500) || null]);
  return quotaFor(email);
}

export async function listRequests(state = "pending", limit = 100) {
  await ensureSchema();
  const where = state === "all" ? "" : "WHERE r.state = ?";
  const args = state === "all" ? [] : [state];
  return q(`SELECT r.*, COALESCE(uq.limit_usd, br.default_quota_usd) AS current_limit,
                   COALESCE(u.spent, 0) AS spent
              FROM quota_requests r
              LEFT JOIN user_quotas uq ON uq.email = r.actor
              LEFT JOIN (SELECT actor, SUM(bill_usd) spent FROM token_usage GROUP BY actor) u
                     ON u.actor = r.actor
              CROSS JOIN (SELECT default_quota_usd FROM billing_rates
                           WHERE effective_from <= NOW()
                           ORDER BY effective_from DESC, id DESC LIMIT 1) br
              ${where}
             ORDER BY r.state='pending' DESC, r.id DESC LIMIT ${Number(limit) || 100}`, args);
}

/**
 * 審核。核准要填「實際給多少」而不是照抄申請的數字——他要 30、評估後給 25
 * 是常態，畫面上也是這樣填的。最終以這個數字為準。
 */
export async function decideRequest(id, { approve, grantedUsd, note, actor }) {
  await ensureSchema();
  const [r] = await q("SELECT * FROM quota_requests WHERE id=?", [Number(id)]);
  if (!r) throw Object.assign(new Error("找不到這筆申請"), { status: 404 });
  if (r.state !== "pending") throw Object.assign(new Error("這筆已經審過了"), { status: 409 });

  if (!approve) {
    await q(`UPDATE quota_requests SET state='rejected', decided_by=?, decided_at=NOW(),
                    decided_note=? WHERE id=?`,
    [String(actor || "").slice(0, 190) || null, String(note || "").slice(0, 300) || null, r.id]);
    return { state: "rejected", actor: r.actor };
  }
  const give = Number(grantedUsd != null ? grantedUsd : r.want_usd);
  if (!(give >= 0) || give > 100000) throw Object.assign(new Error("核給的額度不合理"), { status: 400 });
  await setQuota(r.actor, give, { note: `申請 #${r.id} 核准`, actor });
  await q(`UPDATE quota_requests SET state='approved', granted_usd=?, decided_by=?,
                  decided_at=NOW(), decided_note=? WHERE id=?`,
  [give, String(actor || "").slice(0, 190) || null, String(note || "").slice(0, 300) || null, r.id]);
  return { state: "approved", granted: give, actor: r.actor };
}

/** 後台的人員清單：有用量的、有自訂額度的，都要在上面。 */
export async function listPeople(limit = 200) {
  await ensureSchema();
  const rate = await currentRate();
  const rows = await q(
    `SELECT x.email,
            COALESCE(u.spent, 0) spent, COALESCE(u.calls, 0) calls, u.last_at,
            uq.limit_usd, uq.updated_at AS quota_at, uq.updated_by AS quota_by
       FROM (SELECT actor AS email FROM token_usage GROUP BY actor
             UNION SELECT email FROM user_quotas) x
       LEFT JOIN (SELECT actor, SUM(bill_usd) spent, COUNT(*) calls, MAX(at) last_at
                    FROM token_usage GROUP BY actor) u ON u.actor = x.email
       LEFT JOIN user_quotas uq ON uq.email = x.email
      ORDER BY spent DESC LIMIT ${Number(limit) || 200}`);
  return rows.map((r) => {
    const limit2 = r.limit_usd == null ? rate.defaultQuotaUsd : Number(r.limit_usd);
    const spent = Math.round((Number(r.spent) || 0) * 100) / 100;
    return {
      email: r.email, spent, calls: Number(r.calls) || 0, lastAt: r.last_at,
      limit: limit2, left: Math.round((limit2 - spent) * 100) / 100,
      custom: r.limit_usd != null, quotaAt: r.quota_at, quotaBy: r.quota_by,
    };
  });
}
