/**
 * 讓畫面上的 <th> 跟資料庫登記的欄位保持一致。
 *
 * ── 為什麼需要這一支 ──────────────────────────────────
 * jv-live 認表格的方式是「拿資料庫的 label 去比對畫面上 <th> 的文字，
 * 要求連續且完全相同」（見 shared/jv-live.js 的 findTable）。
 *
 * 所以 addColumn／renameColumn 只動資料庫是不夠的——那會讓兩邊對不上，
 * 於是整張表從「原生接管」掉回退路面板，而助理還回了一句「好的，已改好」。
 * 實測三個實例都中了這一招：seal-authorization 的資料庫寫著「承辦人」，
 * 畫面上的 <th> 還是「用印案件號」，那張表因此接不上資料。
 *
 * instance-db.mjs 原本的註解說「runtime 靠 label 比對表頭，所以改 label
 * 就是改他看到的東西」——那句話是反的：正因為是拿 label 去比對表頭，
 * 只改 label 就是讓兩邊不一致。
 *
 * ── 為什麼是字串處理不是 DOM ──────────────────────────
 * 這個專案刻意只有 mysql2 一個相依，沒有 HTML parser。而這裡要做的事很窄：
 * 找到某一張表的表頭、改一個字或多插一欄。下面的掃描刻意模仿 jv-live 的
 * 語意（含把巢狀表格的 th 一起算進去——querySelectorAll("th") 本來就會），
 * 兩邊看到的東西才會是同一份。
 *
 * ── 為什麼不用動 <td> ────────────────────────────────
 * jv-live 的 render() 第一件事就是 ctx.tbody.innerHTML = ""，資料列整個
 * 重畫。demo 裡那些靜態列只是接上之前的樣子，不必跟著改。
 */
import fs from "node:fs";
import path from "node:path";

const pageOf = (dir) => path.join(dir, "public", "index.html");

/** 跟 textContent 對齊：去標籤、解實體、壓空白。 */
function textOf(frag) {
  return String(frag)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 每一張最外層 <table> 的位置。
 *
 * 用深度計數而不是 /<table[\s\S]*?<\/table>/：非貪婪的那種寫法碰到巢狀表格
 * 會在內層的 </table> 就收掉，外層剩下半截。demo 裡版面用的巢狀表格不多，
 * 但錯一次就是把表頭插到別張表裡。
 */
export function tableRanges(html) {
  const out = [];
  const re = /<(\/?)table\b[^>]*>/gi;
  let m, depth = 0, start = -1;
  while ((m = re.exec(html))) {
    if (m[1]) {
      depth -= 1;
      if (depth <= 0) { if (start >= 0) out.push({ start, end: re.lastIndex }); depth = 0; start = -1; }
    } else {
      if (depth === 0) start = m.index;
      depth += 1;
    }
  }
  return out;
}

/** 一個 table 區間裡的每一個 <th>：外層位置、內容位置、純文字。 */
function thsIn(html, range) {
  const seg = html.slice(range.start, range.end);
  const out = [];
  const re = /<th\b[^>]*>([\s\S]*?)<\/th>/gi;
  let m;
  while ((m = re.exec(seg))) {
    const whole = m[0];
    const openEnd = whole.indexOf(">") + 1;
    out.push({
      start: range.start + m.index,
      end: range.start + re.lastIndex,
      innerStart: range.start + m.index + openEnd,
      innerEnd: range.start + re.lastIndex - "</th>".length,
      openTag: whole.slice(0, openEnd),
      text: textOf(m[1]),
    });
  }
  return out;
}

/**
 * 在一張表的表頭裡找出「連續且完全等於 want」的那一段。
 *
 * 這段邏輯必須跟 jv-live 的 findTable 一模一樣，包含「空白表頭視為裝飾欄、
 * 比對時跳過」——不然這裡認為改對了，runtime 卻還是接不上。
 */
function findRun(ths, want) {
  const solid = ths.filter((t) => t.text !== "");
  if (solid.length < want.length) return null;
  for (let off = 0; off + want.length <= solid.length; off += 1) {
    let same = true;
    for (let k = 0; k < want.length; k += 1) {
      if (solid[off + k].text !== want[k]) { same = false; break; }
    }
    if (same) return solid.slice(off, off + want.length);
  }
  return null;
}

/**
 * 在整份 HTML 裡找出**每一處**對應 labels 的表頭。
 *
 * 為什麼是「每一處」而不是第一處：這些 demo 有不少是用 JS 字串建畫面的
 * （實測 crm 那套三張表全都寫在 <script> 裡），所以同一組表頭可能同時
 * 出現在腳本樣板與靜態標記兩個地方。只改第一處，兩份就會漂移，而
 * jv-live 綁到的是「當下在 DOM 裡的那一份」——有可能正是沒改到的那一份。
 */
export function locateAll(html, labels) {
  const out = [];
  for (const range of tableRanges(html)) {
    const run = findRun(thsIn(html, range), labels);
    if (run) out.push({ range, run });
  }
  return out;
}

/** 只要第一處。用來回答「接不接得上」這種是非題。 */
export function locate(html, labels) {
  return locateAll(html, labels)[0] || null;
}

/** 由後往前套，前面的位置才不會被前一次的長度變化推掉。 */
function applyEdits(html, edits) {
  return [...edits].sort((a, b) => b.at - a.at)
    .reduce((h, e) => h.slice(0, e.at) + e.text + h.slice(e.to), html);
}

function readPage(dir) {
  const page = pageOf(dir);
  if (!fs.existsSync(page)) return null;
  return fs.readFileSync(page, "utf8");
}

function writePage(dir, html) {
  const page = pageOf(dir);
  const tmp = `${page}.tmp`;
  fs.writeFileSync(tmp, html);
  fs.renameSync(tmp, page);
}

/**
 * 把畫面上的某一個表頭改名。
 *
 * @param dir           實例目錄
 * @param labelsBefore  這張表**改名前**在資料庫裡的完整 label 順序
 * @param oldLabel      要改的那一個
 * @param newLabel      改成什麼
 * @returns {{ok:boolean, why?:string}}
 */
export function renameHeader(dir, labelsBefore, oldLabel, newLabel) {
  const html = readPage(dir);
  if (html === null) return { ok: false, why: "找不到 index.html" };

  const at = labelsBefore.indexOf(oldLabel);
  if (at < 0) return { ok: false, why: "資料庫的欄位順序裡沒有這個名稱" };

  const hits = locateAll(html, labelsBefore);
  /* 找不到不算失敗：這張表本來就可能不是用 <table> 呈現的（表單、卡片），
     那種情況畫面上沒有表頭要改，資料庫改完就結束了。 */
  if (!hits.length) return { ok: false, why: "畫面上沒有對應這張表的表頭" };

  const edits = hits.map((h) => {
    const th = h.run[at];
    return { at: th.innerStart, to: th.innerEnd, text: esc(newLabel) };
  });
  writePage(dir, applyEdits(html, edits));
  return { ok: true, places: hits.length };
}

/**
 * 在畫面上補一欄表頭。
 *
 * 插在「那一段的最後一欄之後」而不是整列的最尾端：jv-live 要求那一段是
 * **連續**的，尾端如果還有「操作」之類的裝飾欄，插到最後會把連續性打斷。
 *
 * @param labelsBefore  這張表**加欄位前**在資料庫裡的完整 label 順序
 */
export function addHeader(dir, labelsBefore, newLabel) {
  const html = readPage(dir);
  if (html === null) return { ok: false, why: "找不到 index.html" };
  if (!labelsBefore.length) return { ok: false, why: "這張表還沒有任何欄位" };

  const hits = locateAll(html, labelsBefore);
  if (!hits.length) return { ok: false, why: "畫面上沒有對應這張表的表頭" };

  const edits = hits.map((h) => {
    const last = h.run[h.run.length - 1];
    /* 沿用最後一欄的開頭標籤，class 與對齊才會跟旁邊一致。
       但 id 這種「這一欄專屬」的屬性不該複製過來。 */
    const openTag = last.openTag.replace(/\s+id="[^"]*"/i, "");
    return { at: last.end, to: last.end, text: openTag + esc(newLabel) + "</th>" };
  });
  writePage(dir, applyEdits(html, edits));
  return { ok: true, places: hits.length };
}

/**
 * 檢查一張表現在接不接得上——給修復腳本與驗收用。
 * @returns {"bound"|"unbound"|"no-table"}
 */
export function checkBound(dir, labels) {
  const html = readPage(dir);
  if (html === null) return "no-table";
  return locate(html, labels) ? "bound" : "unbound";
}
