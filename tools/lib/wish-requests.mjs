/**
 * 許願池的「做成 Demo」申請。
 *
 * 存在 var/（已 gitignore）而不是 docs/_state/：這些是訪客自己打的需求文字，
 * 可能帶著公司名、流程細節，甚至具名登入者的信箱。那種東西不該進版控。
 *
 * 狀態流轉：
 *   pending   剛送出，等管理者決定
 *   queued    已排入產線，輪到就做
 *   building  agent 正在做
 *   published 已上架
 *   rejected  管理者婉拒
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const FILE = (root) => path.join(root, "var", "wish-requests.json");
export const STATES = ["pending", "queued", "building", "published", "rejected"];

function load(root) {
  try { return JSON.parse(fs.readFileSync(FILE(root), "utf8")); }
  catch { return { requests: [] }; }
}

/* 先寫暫存檔再 rename。訪客送出與管理者操作可能同時發生，直接覆寫時若中途
   出錯，整份申請就毀了。 */
function save(root, data) {
  const dir = path.join(root, "var");
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${FILE(root)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, FILE(root));
}

/** 訪客送出一筆申請。回傳建立的紀錄。 */
export function create(root, { need, who, visitor, analysis }) {
  const text = String(need || "").trim().slice(0, 2000);
  if (text.length < 8) return { ok: false, error: "請多描述一點，至少 8 個字" };

  const data = load(root);
  /* 同一個訪客短時間內重複送同一段文字，多半是連點兩下而不是真的想要兩套。 */
  const dup = data.requests.find((r) => r.visitor === visitor && r.need === text
    && Date.now() - Date.parse(r.createdAt) < 10 * 60 * 1000);
  if (dup) return { ok: true, duplicate: true, request: dup };

  const today = data.requests.filter((r) => r.visitor === visitor
    && Date.now() - Date.parse(r.createdAt) < 24 * 60 * 60 * 1000);
  if (today.length >= 5) return { ok: false, error: "今天的申請次數已達上限（5 次），明天再試" };

  const request = {
    id: `w_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`,
    need: text,
    who: who || "訪客",
    visitor: visitor || null,
    analysis: analysis ? String(analysis).slice(0, 600) : null,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    topic: null,
    repoName: null,
    note: "",
  };
  data.requests.push(request);
  save(root, data);
  return { ok: true, request };
}

/* 上架狀態用推導而不是等人來寫。要靠 agent 上架後回頭改申請紀錄的話，
   就得讓產線知道「這一套是從許願來的」——那是不必要的耦合，而且任何一條
   沒走到的路徑（建置失敗、人工上架）都會讓狀態永遠停在「已排入」。
   直接對 projects-index 查一次，是什麼就是什麼。 */
function derive(root, rows) {
  let published = new Set();
  try {
    published = new Set(JSON.parse(fs.readFileSync(path.join(root, "projects-index.json"), "utf8"))
      .projects.map((p) => p.repoName));
  } catch { /* 讀不到就維持原狀態 */ }
  for (const r of rows) {
    if (r.repoName && published.has(r.repoName) && r.status !== "published") {
      r.status = "published";
    }
  }
  return rows;
}

export function list(root, { status = null, limit = 200 } = {}) {
  const data = load(root);
  derive(root, data.requests);
  let rows = [...data.requests].reverse();
  if (status) rows = rows.filter((r) => r.status === status);
  const counts = {};
  for (const r of data.requests) counts[r.status] = (counts[r.status] || 0) + 1;
  return { total: data.requests.length, counts, rows: rows.slice(0, limit) };
}

export function get(root, id) {
  return load(root).requests.find((r) => r.id === id) || null;
}

export function update(root, id, patch) {
  const data = load(root);
  const r = data.requests.find((x) => x.id === id);
  if (!r) return { ok: false, error: "找不到這筆申請" };
  Object.assign(r, patch, { updatedAt: new Date().toISOString() });
  save(root, data);
  return { ok: true, request: r };
}
