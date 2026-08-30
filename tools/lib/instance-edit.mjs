/**
 * 讓客戶用講的改自己系統的「行為」——加按鈕、改流程、改計算方式、改版面。
 *
 * 前三種動作（加欄位、改欄位名、改系統名）都是改結構化的資料，錯了也還原得回來。
 * 改程式碼不一樣：它可以把整套系統改壞，而客戶手上沒有其他工具可以救。
 * 所以這裡的護欄比那三種嚴格得多，而且每次都留一份可以還原的版本。
 *
 * 動的永遠是 var/instances/<id>/public/index.html——原始 demo 是目錄展示品，
 * 唯讀。
 */
import fs from "node:fs";
import path from "node:path";
import { runCodexWithRetry } from "./codex-run.mjs";

const MARK_OPEN = "<!-- jv-live:start -->";
const MARK_CLOSE = "<!-- jv-live:end -->";

/** 表頭是資料綁定的身分證，改了那張表就再也接不上。 */
function headerFingerprint(html) {
  const out = [];
  for (const t of html.match(/<table[\s\S]*?<\/table>/gi) || []) {
    const ths = t.match(/<th\b[^>]*>([\s\S]*?)<\/th>/gi) || [];
    out.push(ths.map((x) => x.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()).join("|"));
  }
  return out.sort().join("¶");
}

const screens = (html) => new Set([...html.matchAll(/data-i=["']?(\d+)/g)].map((m) => m[1])).size;

function extractHtml(text) {
  let body = String(text || "").trim();
  const fenced = body.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced) body = fenced[1].trim();
  const a = body.search(/<!doctype html/i);
  const b = body.toLowerCase().lastIndexOf("</html>");
  return a >= 0 && b > a ? body.slice(a, b + 7) : null;
}

function prompt(instruction, html) {
  return `你要依使用者的要求，改這一套系統的程式與畫面。

## 使用者要的
${instruction}

## 不可以動的東西（動了這次修改就會被退回）
1. 所有 <table> 的 <th> 文字一個字都不能改，也不能增減 <th> 的數量或順序。
   那些欄位名稱是這套系統與它的資料庫對應的依據，改了資料就接不上。
   如果使用者要的就是改欄位名稱，請不要動——那件事系統有另外的方式處理。
2. \`${MARK_OPEN}\` 與 \`${MARK_CLOSE}\` 之間的兩行 script 標籤必須原封不動保留。
   那是系統的執行時與修改助理；拿掉的話使用者就再也沒有辦法修改這套系統了。
3. 畫面（data-i）的數量不可以變少。
4. 不可以引用任何本地檔案（不要出現 <script src="./...">），圖表庫維持原本的 CDN。
5. 不可以使用 setInterval。

## 要做到的事
- 只做使用者要求的那件事，不要順手重構或改動其他地方。
- 改完的頁面要能直接跑，不能有 JavaScript 錯誤。
- 保持原本的視覺風格，除非使用者要求的就是改外觀。

## 輸出方式
把改好的**完整 index.html** 從 <!doctype html> 到 </html> 一次輸出，
不要只給片段、不要輸出解釋、不要用差異格式。

以下是目前的 index.html：

${html}`;
}

/**
 * 改一次。回 { ok, why }。
 *
 * 失敗一律還原成原本的檔案——半改的頁面比沒改更糟，客戶會看到一個
 * 似是而非的畫面而不知道發生什麼事。
 */
export async function editPage(dir, instruction, { timeoutMs = 900000, model } = {}) {
  const file = path.join(dir, "public", "index.html");
  if (!fs.existsSync(file)) return { ok: false, why: "找不到這套系統的畫面檔" };
  const before = fs.readFileSync(file, "utf8");

  /* 每次改之前留一份。客戶說「改壞了、還原」時要有東西可以還原，
     而且只留最近一次——留一整串版本要有介面讓他挑，那是另一件事。 */
  fs.writeFileSync(path.join(dir, "public", "index.prev.html"), before);

  const r = await runCodexWithRetry({
    prompt: prompt(instruction, before),
    cwd: dir,
    sandbox: "read-only",
    timeoutMs,
    model,
  }, { retries: 0 });
  if (!r.ok) return { ok: false, why: "改的時候逾時了，請再說一次或把要求拆小一點" };

  const after = extractHtml(r.text);
  if (!after) return { ok: false, why: "沒有產出完整的頁面" };
  if (after === before) return { ok: false, why: "看起來沒有需要改的地方" };

  const revert = (why) => { fs.writeFileSync(file, before); return { ok: false, why }; };
  fs.writeFileSync(file, after);

  if (headerFingerprint(after) !== headerFingerprint(before)) return revert("這個改法會動到資料表的欄位名稱，那樣資料會接不上");
  if (!after.includes(MARK_OPEN) || !after.includes(MARK_CLOSE)) return revert("這個改法會把修改助理拿掉，那樣你就沒辦法再改它了");
  if (screens(after) < screens(before)) return revert("這個改法會讓畫面變少");
  /* 本地腳本只允許 ./_jv/ 底下那兩支——那正是實例的執行時與修改助理，
     必須在。這條規則原本是從 demo 的規則抄來的（demo 要單檔自足），
     直接套到實例上會把每一次修改都擋掉，因為那兩行本來就在檔案裡。 */
  const badLocal = (after.match(/<script[^>]+src=["']\.[^"']*["']/gi) || [])
    .filter((tag) => !/["']\.\/_jv\//.test(tag));
  if (badLocal.length) return revert("這個改法引用了本地檔案，交付出去會壞掉");
  if (/setInterval\s*\(/.test(after)) return revert("這個改法用了 setInterval，那會讓頁面一直在背景跑");

  return { ok: true, bytes: Buffer.byteLength(after) };
}

/** 還原成上一次修改前的樣子。 */
export function undo(dir) {
  const file = path.join(dir, "public", "index.html");
  const prev = path.join(dir, "public", "index.prev.html");
  if (!fs.existsSync(prev)) return false;
  const cur = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, fs.readFileSync(prev, "utf8"));
  /* 交換而不是刪掉：再說一次「還原」就會回到剛才那版，等於一個來回的復原。 */
  fs.writeFileSync(prev, cur);
  return true;
}
