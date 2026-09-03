#!/usr/bin/env node
/**
 * 檢查（並修好）「資料庫的欄位」與「畫面上的 <th>」對不上的實例。
 *
 * 為什麼會對不上：addColumn／renameColumn 以前只動資料庫。而 jv-live 是拿
 * 資料庫的 label 去比對畫面上的 <th>（見 shared/jv-live.js 的 findTable），
 * 兩邊一不一致，整張表就從「原生接管」掉回退路面板——畫面看起來還在，
 * 但那張漂亮的表已經接不到資料了。新的路徑走 lib/instance-head.mjs 會兩邊
 * 一起改，這一支是回頭把已經歪掉的補正。
 *
 * 誰是對的：**資料庫**。那是使用者叫助理改的結果，畫面才是沒跟上的那一邊。
 *
 *   node tools/instance-head-sync.mjs             只檢查，不動任何檔案
 *   node tools/instance-head-sync.mjs --apply     真的改
 *   node tools/instance-head-sync.mjs --instance=<id> --apply
 */
import fs from "node:fs";
import path from "node:path";
import { EXIT, parseArgs, makeLogger } from "./lib/forge-common.mjs";
import { q, close } from "./lib/mysql.mjs";
import { tableRanges, locate } from "./lib/instance-head.mjs";

const args = parseArgs();
const log = makeLogger({ quiet: Boolean(args.quiet) });
const APPLY = Boolean(args.apply);

const textOf = (frag) => String(frag)
  .replace(/<[^>]*>/g, "")
  .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#0?39;/g, "'")
  .replace(/\s+/g, " ").trim();

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function thsIn(html, range) {
  const seg = html.slice(range.start, range.end);
  const out = [];
  const re = /<th\b[^>]*>([\s\S]*?)<\/th>/gi;
  let m;
  while ((m = re.exec(seg))) {
    const openEnd = m[0].indexOf(">") + 1;
    out.push({
      end: range.start + re.lastIndex,
      innerStart: range.start + m.index + openEnd,
      innerEnd: range.start + re.lastIndex - "</th>".length,
      openTag: m[0].slice(0, openEnd),
      text: textOf(m[1]),
    });
  }
  return out;
}

/**
 * 找出「最像這張表」的表頭段落。
 *
 * 不能只找完全相同的——會歪掉的正是那些不相同的。所以用對齊分數：
 * 同一個位置的 label 相同就加一分，取分數最高的那個窗格。
 * 門檻訂在「至少對上一半、而且至少兩欄」：低於這個就寧可不動，
 * 改錯一張表比留著一張沒接上的表糟得多。
 */
function bestWindow(html, want) {
  let best = null;
  for (const range of tableRanges(html)) {
    const solid = thsIn(html, range).filter((t) => t.text !== "");
    if (!solid.length) continue;
    const maxOff = Math.max(0, solid.length - 1);
    for (let off = 0; off <= maxOff; off += 1) {
      const win = solid.slice(off, off + want.length);
      if (!win.length) continue;
      let score = 0;
      for (let k = 0; k < win.length; k += 1) if (win[k].text === want[k]) score += 1;
      /* 尾端還有沒被比到的欄位（例如「操作」）不扣分，但窗格不夠長要記下來，
         那代表畫面上少了幾欄、得補。 */
      if (!best || score > best.score) best = { score, win, need: want.length - win.length, solid, off };
    }
  }
  if (!best) return null;
  const cmp = Math.min(want.length, best.win.length);
  if (best.score < Math.max(2, Math.ceil(cmp / 2))) return null;
  return best;
}

function planFor(html, want) {
  if (locate(html, want)) return { ok: true, already: true, edits: [] };
  const b = bestWindow(html, want);
  if (!b) return { ok: false, why: "畫面上找不到夠像的表頭（可能這張表是用表單或卡片呈現的）" };

  const edits = [];
  const notes = [];
  for (let k = 0; k < b.win.length && k < want.length; k += 1) {
    if (b.win[k].text === want[k]) continue;
    edits.push({ at: b.win[k].innerStart, to: b.win[k].innerEnd, text: esc(want[k]) });
    notes.push(`改名「${b.win[k].text}」→「${want[k]}」`);
  }
  if (b.need > 0) {
    const last = b.win[b.win.length - 1];
    const openTag = last.openTag.replace(/\s+id="[^"]*"/i, "");
    const add = want.slice(want.length - b.need);
    edits.push({ at: last.end, to: last.end, text: add.map((l) => openTag + esc(l) + "</th>").join("") });
    notes.push(`補欄位「${add.join("、")}」`);
  }
  return { ok: true, edits, notes };
}

function applyEdits(html, edits) {
  /* 由後往前套，前面的位置才不會被前一次的長度變化推掉。 */
  return [...edits].sort((a, b) => b.at - a.at)
    .reduce((h, e) => h.slice(0, e.at) + e.text + h.slice(e.to), html);
}

async function main() {
  const where = args.instance ? "AND id = ?" : "";
  const rows = await q(
    `SELECT id, db_name, repo_name, dir FROM instances WHERE state <> 'archived' ${where} ORDER BY created_at`,
    args.instance ? [String(args.instance)] : []);

  let broken = 0, fixed = 0, skipped = 0;
  for (const inst of rows) {
    const page = path.join(inst.dir, "public", "index.html");
    if (!fs.existsSync(page)) continue;
    let cols;
    try {
      cols = await q(`SELECT table_name, label, ord FROM \`${inst.db_name}\`.jv_columns ORDER BY table_name, ord`);
    } catch { continue; }

    const byTable = {};
    for (const c of cols) (byTable[c.table_name] ||= []).push(c.label);

    let html = fs.readFileSync(page, "utf8");
    const before = html;
    const lines = [];
    for (const [table, want] of Object.entries(byTable)) {
      if (locate(html, want)) continue;
      broken += 1;
      const plan = planFor(html, want);
      if (!plan.ok) { lines.push(`  ${table}　✖ ${plan.why}`); skipped += 1; continue; }
      html = applyEdits(html, plan.edits);
      /* 套完再驗一次：對得上才算修好。這一步很重要——對齊分數高不代表
         jv-live 就會認，中間夾一個裝飾欄就可能還是接不上。 */
      if (!locate(html, want)) {
        html = before;
        lines.push(`  ${table}　✖ 補正之後仍然對不上，沒有動它`);
        skipped += 1;
        continue;
      }
      lines.push(`  ${table}　✔ ${plan.notes.join("；")}`);
      fixed += 1;
    }
    if (!lines.length) continue;
    log.step(`${inst.repo_name}（${inst.id}）`);
    lines.forEach((l) => log.info(l));
    if (APPLY && html !== before) {
      fs.writeFileSync(`${page}.tmp`, html);
      fs.renameSync(`${page}.tmp`, page);
    }
  }

  log.step(APPLY
    ? `對不上的 ${broken} 張表：修好 ${fixed}、跳過 ${skipped}`
    : `對不上的 ${broken} 張表：可修 ${fixed}、無法自動修 ${skipped}（加 --apply 才會真的改）`);
}

main()
  .catch((e) => { log.error(e.message); process.exitCode = EXIT.BAD_INPUT; })
  .finally(() => close());
