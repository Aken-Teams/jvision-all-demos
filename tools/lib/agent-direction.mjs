/**
 * 產線的生成方向設定。
 *
 * 站主在後台改的東西要能真的影響下一批題目，所以這個檔是 agent-loop 補題時
 * 讀的參數來源，而不是一份「說明用」的設定。
 *
 * 只放三件會影響出題的事：每日產量、指定產業、自由文字方向。
 * 缺口分配（讓站上長得均衡）是 topic-scout 的預設行為；這裡指定產業或方向時
 * 是刻意覆蓋它——有時要的就是「這一批全做某個領域」。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./forge-common.mjs";

const FILE = path.join(ROOT, "docs", "_state", "agent-direction.json");
/* 每日產量沿用既有的 agent-quota。看門狗也讀那個檔，兩邊各存一份的話
   改了一邊就會不一致，而不一致的後果是看門狗每天固定亂重啟一次。 */
const QUOTA = path.join(ROOT, "docs", "_state", "agent-quota");

const DEFAULTS = { categories: [], focus: "", updatedAt: null, updatedBy: null };

export function read() {
  let d = { ...DEFAULTS };
  try { d = { ...d, ...JSON.parse(fs.readFileSync(FILE, "utf8")) }; } catch { /* 沒設過就是預設 */ }
  let quota = 120;
  try { quota = Number(fs.readFileSync(QUOTA, "utf8").trim()) || 120; } catch { /* 讀不到用預設 */ }
  return { ...d, dailyQuota: quota };
}

export function write({ categories, focus, dailyQuota }, actor) {
  const cur = read();
  const next = {
    categories: Array.isArray(categories)
      ? categories.map((c) => String(c).trim().slice(0, 20)).filter(Boolean).slice(0, 12)
      : cur.categories,
    focus: focus == null ? cur.focus : String(focus).trim().slice(0, 500),
    updatedAt: new Date().toISOString(),
    updatedBy: actor || null,
  };
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  /* 先寫暫存再改名。產線可能正好在讀它，讀到半個檔會讓補題整批失敗。 */
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2) + "\n");
  fs.renameSync(tmp, FILE);

  if (dailyQuota != null) {
    const n = Math.max(0, Math.min(500, Number(dailyQuota) || 0));
    fs.writeFileSync(QUOTA, `${n}\n`);
  }
  return read();
}

/** 給 agent-loop 用：把設定轉成 topic-scout 的參數。沒設就回空字串。 */
export function scoutArgs() {
  const d = read();
  const out = [];
  if (d.categories.length) out.push(`--categories=${d.categories.join(",")}`);
  if (d.focus) out.push(`--focus=${d.focus}`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  /* agent-loop 用 shell 呼叫，所以印出來就好——它會直接展開成參數。 */
  process.stdout.write(scoutArgs().map((a) => JSON.stringify(a)).join(" "));
}
