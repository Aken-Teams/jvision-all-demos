/**
 * 產線題目佇列的讀寫。
 *
 * agent-loop 取題是 `accepted.shift()`，所以「排在最前面」就等於「下一個做」。
 * 後台的新增預設插在最後、可以指定插到最前——站主臨時想先做某一題時，
 * 那才是他要的行為。
 *
 * 所有寫入都走 tmp→rename：產線可能正好在讀這個檔，讀到半個檔會讓補題整批失敗。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./forge-common.mjs";

const FILE = path.join(ROOT, "docs", "_state", "agent-queue.json");
const SLUG_RE = /^[a-z][a-z0-9-]{2,60}$/;

function load() {
  try {
    const d = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (!Array.isArray(d.accepted)) d.accepted = [];
    return d;
  } catch {
    return { generatedAt: null, accepted: [], rejected: [] };
  }
}

function save(d) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2) + "\n");
  fs.renameSync(tmp, FILE);
}

/** 只回後台要顯示的欄位。整包丟出去有 360KB，而畫面上用得到的不到十分之一。 */
export function list(limit = 200) {
  const d = load();
  return {
    total: d.accepted.length,
    generatedAt: d.generatedAt || null,
    items: d.accepted.slice(0, limit).map((x, i) => ({
      i, slug: x.slug, title: x.title, category: x.category,
      systemType: x.systemType || null,
      description: (x.description || "").slice(0, 200),
      addedBy: x.addedBy || null,
    })),
  };
}

export function add({ slug, title, category, description, systemType }, actor, { first = false } = {}) {
  const d = load();
  const s = String(slug || "").trim().toLowerCase();
  if (!SLUG_RE.test(s)) {
    throw Object.assign(new Error("代號只能用小寫英文、數字與連字號，3～60 字"), { status: 400 });
  }
  if (d.accepted.some((x) => x.slug === s)) {
    throw Object.assign(new Error("這個代號已經在佇列裡"), { status: 409 });
  }
  if (fs.existsSync(path.join(ROOT, "demos", `jvision-${s}`))) {
    throw Object.assign(new Error("站上已經有這個代號的專案"), { status: 409 });
  }
  const t = String(title || "").trim().slice(0, 60);
  const c = String(category || "").trim().slice(0, 20);
  if (!t || !c) throw Object.assign(new Error("題目與產業都要填"), { status: 400 });
  const item = { slug: s, title: t, givenTitle: t, category: c,
    systemType: String(systemType || "").trim().slice(0, 40) || null,
    description: String(description || "").trim().slice(0, 800),
    addedBy: actor || null, addedAt: new Date().toISOString() };
  if (first) d.accepted.unshift(item); else d.accepted.push(item);
  save(d);
  return list();
}

export function update(slug, patch, actor) {
  const d = load();
  const it = d.accepted.find((x) => x.slug === slug);
  if (!it) throw Object.assign(new Error("佇列裡沒有這一題"), { status: 404 });
  if (patch.title != null) { it.title = String(patch.title).trim().slice(0, 60); it.givenTitle = it.title; }
  if (patch.category != null) it.category = String(patch.category).trim().slice(0, 20);
  if (patch.description != null) it.description = String(patch.description).trim().slice(0, 800);
  if (patch.systemType != null) it.systemType = String(patch.systemType).trim().slice(0, 40) || null;
  it.editedBy = actor || null;
  it.editedAt = new Date().toISOString();
  save(d);
  return list();
}

export function remove(slug) {
  const d = load();
  const n = d.accepted.length;
  d.accepted = d.accepted.filter((x) => x.slug !== slug);
  if (d.accepted.length === n) throw Object.assign(new Error("佇列裡沒有這一題"), { status: 404 });
  save(d);
  return list();
}

/** 插到最前面＝下一個就做它。 */
export function promote(slug) {
  const d = load();
  const i = d.accepted.findIndex((x) => x.slug === slug);
  if (i < 0) throw Object.assign(new Error("佇列裡沒有這一題"), { status: 404 });
  d.accepted.unshift(d.accepted.splice(i, 1)[0]);
  save(d);
  return list();
}
