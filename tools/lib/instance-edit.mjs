/**
 * 讓客戶用講的改自己系統的「行為」——加按鈕、改流程、改計算方式、改版面。
 *
 * 前三種動作（加欄位、改欄位名、改系統名）都是改結構化的資料，錯了也還原得回來。
 * 改程式碼不一樣：它可以把整套系統改壞，而客戶手上沒有其他工具可以救。
 * 所以這裡的護欄比那三種嚴格得多，而且每次都留一份可以還原的版本。
 *
 * 動的永遠是 var/instances/<id>/public/index.html——原始 demo 是目錄展示品，
 * 唯讀。
 *
 * 改法有兩段：先請模型只回「把這一段換成那一段」，套不進去才退回整份重寫。
 * 取代區塊是主要路徑，理由是正確性不是速度——整份重寫時，模型有機會在
 * 你沒看的地方打錯字（實測過一次：做對了「把字放大」，同時把一行不相干的
 * 跳脫函式從 &gt; 打成 &gt，五道護欄全過，頁面照常顯示）。
 * 沒被 find 命中的地方一個位元組都不會變，那一類壞法就發生不了。
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./forge-common.mjs";
import { runCodex, runCodexWithRetry } from "./codex-run.mjs";
import * as outline from "./page-outline.mjs";
import { applyEdits } from "./instance-patch.mjs";
import * as versions from "./instance-versions.mjs";

const EDIT_SCHEMA = path.join(ROOT, "tools", "schemas", "instance-edit.schema.json");
const PLAN_SCHEMA = path.join(ROOT, "tools", "schemas", "instance-plan.schema.json");
/* 計畫那一步要快——使用者盯著畫面等，超過三分鐘他會以為當掉了。
   而且它做的事很窄（看一遍、列幾條），本來就不該久。 */
const PLAN_TIMEOUT_MS = 180000;

/* auto＝先試取代區塊、套不進去才整份重寫（預設）。
   另外兩個值是給量測與緊急處置用的：取代區塊哪天出問題，
   設 JV_EDIT_MODE=rewrite 就能不改程式直接切回舊路徑。 */
const MODE = ["auto", "patch", "rewrite"].includes(process.env.JV_EDIT_MODE)
  ? process.env.JV_EDIT_MODE : "auto";

const MARK_OPEN = "<!-- jv-live:start -->";
const MARK_CLOSE = "<!-- jv-live:end -->";

/**
 * 每一張表的表頭簽章。表頭是資料綁定的身分證——runtime 是靠 <th> 的文字
 * 認出哪張表對應哪個資料表的，改了那張表就再也接不上。
 *
 * 回傳集合而不是排序後串起來的單一字串：原本是把整串拿去比「完全相等」，
 * 於是「新增一張表」跟「把既有表頭改壞」被判成同一件事。使用者說
 * 「增加一個後臺管理」必然帶新表格，就必然被退回——那是他撞到的那個失敗。
 */
function headerSignatures(html) {
  const out = new Set();
  for (const t of html.match(/<table[\s\S]*?<\/table>/gi) || []) {
    const ths = t.match(/<th\b[^>]*>([\s\S]*?)<\/th>/gi) || [];
    if (!ths.length) continue;
    out.add(ths.map((x) => x.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()).join("|"));
  }
  return out;
}

/** 舊的每一張表都必須還在。新增是可以的，消失（改名或刪掉）不行。 */
function missingTables(before, after) {
  const has = headerSignatures(after);
  return [...headerSignatures(before)].filter((sig) => !has.has(sig));
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

function rewritePrompt(instruction, html, hasImage, plan) {
  return `你要依使用者的要求，改這一套系統的程式與畫面。

## 使用者要的
${instruction}
${hasImage ? "\n使用者另外附了一張截圖，那是他指的位置或想要的樣子。以截圖為準——\n文字描述位置常常會失真，圖上圈的地方才是他真正要改的。\n" : ""}${planBlock(plan)}

## 不可以動的東西（動了這次修改就會被退回）
1. **既有**表格的 <th> 文字一個字都不能改，也不能增減那張表的 <th> 數量或順序，
   更不可以把整張表拿掉。那些欄位名稱是這套系統與它的資料庫對應的依據，
   動了資料就接不上。使用者要的就是改欄位名稱時請不要動——那件事系統有
   另外的方式處理。

   **新增表格是可以的，而且鼓勵。** 需要新的清單、明細、後台管理頁的時候，
   直接加一張新的 <table>，表頭自己取這個領域看得懂的名字（不要用
   「編號／項目／負責人／期限／階段」這種通用字）。我會依你新加的表頭
   自動建好對應的資料表，那張表一樣存得住資料。
2. \`${MARK_OPEN}\` 與 \`${MARK_CLOSE}\` 之間的兩行 script 標籤必須原封不動保留。
   那是系統的執行時與修改助理；拿掉的話使用者就再也沒有辦法修改這套系統了。
3. 畫面（data-i）的數量不可以變少。
4. 不可以引用任何本地檔案（不要出現 <script src="./...">），圖表庫維持原本的 CDN。
5. 不可以使用 setInterval。

## 要做到的事
- 範圍就是上面盤點出來的那幾件事（沒有盤點的話就是使用者那句話）。
  範圍以外的地方不要順手重構、不要順手整理。
- 改完的頁面要能直接跑，不能有 JavaScript 錯誤。
- 保持原本的視覺風格，除非使用者要求的就是改外觀。

## 輸出方式
把改好的**完整 index.html** 從 <!doctype html> 到 </html> 一次輸出，
不要只給片段、不要輸出解釋、不要用差異格式。

以下是目前的 index.html：

${html}`;
}

/* 取代區塊用的說明。跟整份重寫共用同一套「不可以動的東西」，
   差別在輸出：只要那幾段要換的原文與新內容。 */
function patchPrompt(instruction, html, hasImage, plan) {
  return `你要依使用者的要求，改這一套系統的程式與畫面。

## 使用者要的
${instruction}
${hasImage ? "\n使用者另外附了一張截圖，那是他指的位置或想要的樣子。以截圖為準——\n文字描述位置常常會失真，圖上圈的地方才是他真正要改的。\n" : ""}${planBlock(plan)}

## 怎麼回答
不要重寫整份檔案。只要告訴我「把哪一段換成什麼」，我會自己套進去。

每一處給一組 find / replace：
- find 必須是檔案裡**逐字元完全相同**的一段原文，包含空白與縮排。
  不可以憑印象重打，要從下面的檔案內容裡整段複製。
- find 必須在整份檔案中**只出現一次**。如果那段文字很短、可能重複，
  就往前後多帶幾行一起當成 find，讓它變成唯一的。
- replace 是要換上去的新內容。要刪掉那一段就給空字串。
- 沒有要改的地方就不要放進來。只回真正需要動的那幾處。

## 不可以動的東西（動了這次修改就會被退回）
1. **既有**表格的 <th> 文字一個字都不能改，也不能增減那張表的 <th> 數量或順序，
   更不可以把整張表拿掉。那些欄位名稱是這套系統與它的資料庫對應的依據，
   動了資料就接不上。使用者要的就是改欄位名稱時請不要動——那件事系統有
   另外的方式處理。

   **新增表格是可以的，而且鼓勵。** 需要新的清單、明細、後台管理頁的時候，
   直接加一張新的 <table>，表頭自己取這個領域看得懂的名字（不要用
   「編號／項目／負責人／期限／階段」這種通用字）。我會依你新加的表頭
   自動建好對應的資料表，那張表一樣存得住資料。
2. \`${MARK_OPEN}\` 與 \`${MARK_CLOSE}\` 之間的那幾行 script 標籤必須原封不動。
   那是系統的執行時與修改助理；拿掉的話使用者就再也沒有辦法修改這套系統了。
3. 畫面（data-i）的數量不可以變少。
4. 不可以引用任何本地檔案（不要出現 <script src="./...">），圖表庫維持原本的 CDN。
5. 不可以使用 setInterval。
6. 範圍就是上面盤點出來的那幾件事（沒有盤點的話就是使用者那句話）。
   範圍以外不要順手重排、重新縮排或整理其他地方的程式碼——
   那些改動看起來無害，但每一次都是一次打錯字的機會。

以下是目前的 index.html：

${html}`;
}

/**
 * 改完之後，畫面上多了哪些字。
 *
 * 用途是在右邊的預覽裡指出「改的就是這裡」。以前改完只是畫面突然多了東西，
 * 使用者得自己去找——而他根本不知道要找什麼。
 *
 * 為什麼是「文字」而不是選擇器或行號：文字是唯一在 HTML 原始碼與渲染後的
 * DOM 兩邊都成立的座標。行號渲染完就沒了；選擇器要模型自己編，編錯了就是
 * 指到不相干的地方，而指錯比不指更糟。
 *
 * 刻意不挖掉 <script>：不少 demo 的畫面是 JS 用字串建出來的，挖了就找不到
 * 它們新增的東西。標籤之間的文字這個形狀夠窄，JS 的識別字不會長這樣；
 * 排除含大括號的片段則是為了濾掉還沒代入的樣板佔位符。
 */
function newTexts(before, after) {
  const visible = (html) => {
    const out = new Set();
    for (const m of String(html).matchAll(/>([^<>{}]{2,40})</g)) {
      const t = m[1].replace(/\s+/g, " ").trim();
      /* 純數字、純標點的片段當不了錨點——畫面上到處都是。 */
      if (t && !/^[\d\s.,:%+\-/／、。]+$/.test(t)) out.add(t);
    }
    return out;
  };
  const had = visible(before);
  return [...visible(after)].filter((t) => !had.has(t)).slice(0, 8);
}

/**
 * 給計畫那一步看的原始碼。
 *
 * ⚠️ 這一段存在的理由，寫下來免得有人又把它改回「叫模型自己去讀檔」：
 * **codex 在這台機器上讀不到任何檔案。** 它的沙箱起不來——
 *   bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted
 * 於是它跑的每一個 shell 指令都失敗，實際上是純文字進出、沒有工具能力。
 * 實測要它抄出 public/index.html 裡的一段字，它回的是「讀不到」。
 *
 * 所以「完整原始碼在 public/index.html，需要細節時自己去讀」這種寫法是空的：
 * 模型看起來照做了，實際上手上什麼都沒有，只能靠摘要猜。
 * 「已經有一顆頭像了卻又造第二顆」就是這樣來的——它沒看過那顆。
 *
 * 動手改那一步一直沒事，是因為它本來就把整份 HTML 嵌在提示詞裡。
 *
 * 折掉 <style> 的內容：67.5KB → 45.4KB，而樣式規則對「畫面上已經有什麼」
 * 幫助有限，斷點清單摘要裡本來就有。
 * <script> 不折——有些 demo 的畫面整個是 JS 用字串建的（實測 crm 那套三張表
 * 都在 <script> 裡），折掉就等於把半個畫面藏起來。
 */
function markupFor(html) {
  return String(html).replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "<style>/* 樣式省略 */</style>");
}

/**
 * 先想一份計畫，再動手。
 *
 * 為什麼多這一步：
 * 一、**使用者看得到它在想什麼。** 以前這裡是一個三分鐘的黑盒子，畫面上只有
 *     「改寫中…已經 N 秒」。不是前端偷懶，是後端真的只知道這麼多。
 * 二、**計畫會回頭約束執行。** 底下的 patch/rewrite 提示詞會帶上這份計畫，
 *     模型於是不只做「使用者那句話的字面」，而是做它自己盤點出來的那幾件事
 *     ——「只加了一欄，其他都沒顧到」正是少了這一步。
 *
 * 給的是畫面摘要而不是整份 HTML：這一步要快。真的要看細節時，
 * codex 的工作目錄就是實例目錄，它自己讀得到 public/index.html。
 *
 * 想不出來不算失敗。計畫是加分項，不該因為它讓整次修改做不成。
 */
async function makePlan(before, instruction, { dir, model, imagePath, onProgress }) {
  const prompt = `使用者要改他自己的一套系統。你先不要動手，只要說明你打算怎麼做。

## 使用者說
${instruction}
${imagePath ? "\n他附了一張截圖，那是他指的位置或想要的樣子。以截圖為準。\n" : ""}
## 這套系統的畫面現在長這樣
${outline.describe(before)}

## 你要做的
盤點「要把這件事做對，實際上得動哪幾個地方」，然後列成步驟。

### 第一件事：先找畫面上有沒有現成的
動手加新東西之前，**先確認這件事是不是已經有地方在做了**。
底下附了完整的原始碼，去裡面找有沒有既有的頭像、選單、彈出層、篩選器、
狀態標籤、統計卡。**不要只看 class 名稱**——實際踩過的那次，畫面左下角那顆
頭像是 \`<div class="rail-foot">YL</div>\`，名字裡完全沒有 avatar 字樣。
要看的是「這個元素在畫面上做什麼」，不是它叫什麼。

有的話就**改它、擴充它**，不要在旁邊另外做一個。
實際發生過：使用者說「加上點頭像看到個人資訊的小選單」，畫面左下角本來就有
一個使用者頭像，結果在右上角又長出第二個——兩個頭像、兩套選單，
那不是把事情做對，那是把畫面弄亂。

### 再來：這件事的影響範圍
判斷範圍時照著上面那份摘要問自己：
- 這件事在**別的畫面**上也要跟著改嗎？
- **表單**那一側要不要跟著加輸入框？只改表格的話，使用者根本沒有地方填那個值。
- 會不會把某個**斷點**下的版面擠壞？摘要裡列了這份頁面實際有的斷點。
- 有沒有相關的**統計卡、圖表、篩選器**要一起動？

使用者沒明講但你認為該做的，就寫進步驟並在 why 說明理由——他要的是
「這件事被做對了」，不是「他那句話的字面被執行了」。
但也不要順手重構或改動跟這件事無關的地方。

如果你發現畫面上已經有現成的東西可以擴充，第一個步驟就要寫「擴充既有的○○」，
並在 why 裡說明它在哪裡——這樣執行的時候才不會又長出第二個。

## 目前的完整原始碼
（<style> 的內容省略了，只是為了讓這一步快一點。真正動手改的那一步會拿到
含完整 CSS 的檔案，所以「這個位置在某個斷點下會不會被裁掉」那種細節不用在
這裡擔心，也不必列成風險——你只要說清楚「要動哪幾個地方」。）
\`\`\`html
${markupFor(before)}
\`\`\`

只輸出 JSON。`;

  const r = await runCodex({
    prompt, cwd: dir, sandbox: "read-only", schemaPath: PLAN_SCHEMA,
    timeoutMs: PLAN_TIMEOUT_MS, model,
    images: imagePath ? [imagePath] : undefined,
    jsonEvents: true,
    onEvent: makeOnEvent(onProgress),
  });
  const j = r.json;
  if (!j || !Array.isArray(j.steps) || !j.steps.length) return null;
  return {
    understanding: String(j.understanding || "").slice(0, 200),
    steps: j.steps.slice(0, 8).map((x) => ({
      title: String(x.title || "").slice(0, 50),
      why: String(x.why || "").slice(0, 100),
    })).filter((x) => x.title),
    risks: (Array.isArray(j.risks) ? j.risks : []).slice(0, 3).map((x) => String(x).slice(0, 100)),
  };
}

/** 計畫寫進執行用的提示詞。沒有計畫時回空字串，行為就跟以前一樣。 */
function planBlock(plan) {
  if (!plan) return "";
  return `\n## 你自己剛才盤點出來的做法\n${plan.understanding ? `${plan.understanding}\n` : ""}`
    + plan.steps.map((s, i) => `${i + 1}. ${s.title}${s.why ? `（${s.why}）` : ""}`).join("\n")
    + "\n\n把這幾件事一次做完。這是你自己盤點的範圍，不是額外的要求。\n"
    + "做完之後在 steps_done 列出真的做完的編號，沒做的放進 steps_skipped 並說明原因。\n"
    + "**不要把沒做的列成做完的**——使用者是靠這份清單決定要不要再說一次。\n";
}

/**
 * 把 codex 的事件轉成一行「它現在在做什麼」。
 *
 * 為什麼是事件而不是 stdout 原文：不加 --json 的話，stdout 只有最後那一包
 * 結果（我們還用 -o 另外寫檔了），中間過程一個字都拿不到——「思考中…」
 * 之所以看不到在想什麼，根本原因在這裡，不是前端沒顯示。
 *
 * 加了 --json 之後，item.completed 裡的 agent_message 就是模型自己在敘述
 * 「我先讀取 public/index.html，再…」，那正是要給使用者看的東西。
 *
 * 事件型別會隨 codex 版本增加，所以這裡不列舉白名單：認得的就翻成人話，
 * 認不得但帶著文字的就照原文顯示，其餘安靜略過。
 */
function eventLine(ev) {
  if (!ev || typeof ev !== "object") return null;
  const item = ev.item;
  if (!item) return null;

  /* 推理摘要。內容長這樣：
       **Assessing file access limitations**
       （有時後面還跟著一兩段說明，偶爾一次送兩三個標題）
     只取第一行的粗體標題——那一行就是完整的一句「它現在在做什麼」，
     後面的說明放進一個 200px 寬的狀態列只會被截斷。 */
  if (item.type === "reasoning") {
    const first = String(item.text || "").split("\n").map((x) => x.trim()).filter(Boolean)[0];
    if (!first) return null;
    return first.replace(/\*\*/g, "").replace(/^#+\s*/, "").trim() || null;
  }

  if (item.type === "command_execution" && item.command) {
    return `執行 ${String(item.command).replace(/\s+/g, " ").trim()}`;
  }
  if (item.type === "file_change") return "改寫檔案";

  /* agent_message 在有 output-schema 的時候就是最後那包 JSON，
     不是「在想什麼」——底下 makeOnEvent 的長度上限會把它擋掉，
     但這裡先明確排除，免得短的 JSON 漏進去。 */
  if (item.type === "agent_message") return null;

  if (typeof item.text === "string" && item.text.trim()) return item.text.trim();
  return null;
}

function makeOnEvent(onProgress) {
  if (!onProgress) return undefined;
  return (ev) => {
    const line = eventLine(ev);
    /* 太長的多半是模型把整段結果複述一次，那不是「在做什麼」。 */
    if (line && line.length <= 300) onProgress({ k: "log", line: line.slice(0, 200) });
  };
}

/**
 * 請模型只回「把這一段換成那一段」，然後套進去。
 *
 * 回 { ok, text, applied, note } 或 { ok:false, why }。失敗不是災難——
 * 呼叫端會退回整份重寫，客戶不會遇到「這次不能改」。
 */
async function tryPatch(before, instruction, { dir, timeoutMs, model, imagePath, plan, onProgress }) {
  const r = await runCodexWithRetry({
    prompt: patchPrompt(instruction, before, Boolean(imagePath), plan),
    cwd: dir,
    sandbox: "read-only",
    schemaPath: EDIT_SCHEMA,
    timeoutMs,
    model,
    images: imagePath ? [imagePath] : undefined,
    jsonEvents: true,
    onEvent: makeOnEvent(onProgress),
  }, { retries: 0 });
  if (!r.ok) return { ok: false, why: String(r.error || "").slice(0, 80) || "沒有回應" };
  if (!r.json || !Array.isArray(r.json.edits)) return { ok: false, why: "回的格式不對" };

  const applied = applyEdits(before, r.json.edits);
  if (!applied.ok) return { ok: false, why: applied.why };
  return { ok: true, text: applied.text, applied: applied.applied, note: r.json.note || "",
    stepsDone: Array.isArray(r.json.steps_done) ? r.json.steps_done : null,
    stepsSkipped: Array.isArray(r.json.steps_skipped) ? r.json.steps_skipped : [] };
}

/** 整份重寫。取代區塊套不進去時的退路。 */
async function tryRewrite(before, instruction, { dir, timeoutMs, model, imagePath, plan, onProgress }) {
  const r = await runCodexWithRetry({
    prompt: rewritePrompt(instruction, before, Boolean(imagePath), plan),
    cwd: dir,
    sandbox: "read-only",
    timeoutMs,
    model,
    images: imagePath ? [imagePath] : undefined,
    jsonEvents: true,
    onEvent: makeOnEvent(onProgress),
  }, { retries: 0 });
  if (!r.ok) {
    /* 原本一律回「逾時」，但實際上失敗六秒就結束了——那句話把我自己也騙了一輪。
       把真正的原因帶出來，才查得到是什麼壞了。 */
    const detail = String(r.error || "").slice(0, 80);
    return { ok: false, why: detail ? `改不成：${detail}` : "改的時候逾時了，請再說一次或把要求拆小一點" };
  }
  const after = extractHtml(r.text);
  if (!after) return { ok: false, why: "沒有產出完整的頁面" };
  return { ok: true, text: after };
}

/**
 * 改一次。回 { ok, why, how, versionId }。
 *
 * how 是這次走的是哪條路（patch / rewrite），只為了讓我們量得出退回全文重寫
 * 的比例——那個數字要是一直很高，就代表取代區塊的說明還沒寫對。
 *
 * 失敗一律還原成原本的檔案——半改的頁面比沒改更糟，客戶會看到一個
 * 似是而非的畫面而不知道發生什麼事。
 */
export async function editPage(dir, instruction,
  { timeoutMs = 900000, model, imagePath, displayName, mode, onProgress } = {}) {
  const file = path.join(dir, "public", "index.html");
  if (!fs.existsSync(file)) return { ok: false, why: "找不到這套系統的畫面檔" };
  const before = fs.readFileSync(file, "utf8");

  /* 進度回報一律吞例外。呼叫端傳進來的是它自己的狀態更新，
     那件事失敗不該讓一次正在進行的修改整個掛掉。 */
  const emit = (e) => { try { onProgress && onProgress(e); } catch { /* 回報失敗不影響修改 */ } };
  const stage = (id, st, note) => emit({ k: "stage", id, s: st, note: note || null });

  /* 第一次修改之前，先把他複製過來的原始樣子留成第一版。
     少了這一步，客戶改一次就再也回不到最初——而那是他最想回去的地方。 */
  versions.ensureBaseline(dir, displayName ?? null);

  stage("plan", "doing");
  const plan = await makePlan(before, instruction, { dir, model, imagePath, onProgress });
  if (plan) { emit({ k: "plan", ...plan }); stage("plan", "ok"); }
  /* 想不出計畫就照舊直接改。以前本來就沒有這一步，少了它只是少一份說明。 */
  else stage("plan", "skip", "這次沒能先盤點，直接改");

  stage("edit", "doing");
  const opts = { dir, timeoutMs, model, imagePath, plan, onProgress };
  const use = mode || MODE;
  let how = use === "rewrite" ? "rewrite" : "patch";
  let note = "";
  let result = how === "rewrite"
    ? await tryRewrite(before, instruction, opts)
    : await tryPatch(before, instruction, opts);

  if (!result.ok && how === "patch" && use !== "patch") {
    /* 套不進去就整份重寫。取代區塊失敗的原因多半是它把原文記錯了一兩個字，
       那時候整份重寫仍然做得出正確的結果——不該讓客戶因為我們的內部策略
       而收到一句「這次不能改」。 */
    how = "rewrite";
    result = await tryRewrite(before, instruction, opts);
  }
  if (!result.ok) { stage("edit", "fail", result.why); return { ok: false, why: result.why, how, plan }; }
  note = result.note || "";

  const after = result.text;
  if (after === before) {
    stage("edit", "fail", "看起來沒有需要改的地方");
    return { ok: false, why: "看起來沒有需要改的地方", how, plan };
  }
  /* 逐步回報。取代區塊那條路會回「做完哪幾步」，整份重寫那條沒有 schema，
     所以拿不到——那時候誠實標成「不確定」，不要一律當成做完了。
     使用者是靠這份清單決定要不要再說一次，謊報比不報更糟。 */
  if (plan) {
    const done = new Set(result.stepsDone || []);
    const skipped = new Map((result.stepsSkipped || []).map((x) => [x.step, x.why]));
    emit({
      k: "steps",
      /* why 要一起帶回去。這份清單會蓋掉前端原本那份，漏掉 why 的話
         「為什麼要做這一步」在改完之後就消失了——而那正是使用者最想留著的
         那半句話。 */
      steps: plan.steps.map((x, i) => ({
        title: x.title,
        why: x.why,
        s: result.stepsDone ? (done.has(i + 1) ? "ok" : (skipped.has(i + 1) ? "skip" : "unknown")) : "unknown",
        note: skipped.get(i + 1) || null,
      })),
    });
  }
  stage("edit", "ok");

  /* ── 檢查 ─────────────────────────────────────────
     這幾道護欄本來就在，只是以前只有「過或不過」一個結果。逐項回報出來，
     使用者才看得到「它到底幫我確認了什麼」——那正是他要的 checklist，
     而且是真的檢查，不是為了好看列出來的項目。 */
  stage("check", "doing");
  const checks = [];
  const revert = (why) => {
    fs.writeFileSync(file, before);
    stage("check", "fail", why);
    return { ok: false, why, how, plan, checks };
  };
  const check = (id, t, pass, why) => {
    checks.push({ id, t, s: pass ? "ok" : "fail" });
    emit({ k: "check", id, t, s: pass ? "ok" : "fail" });
    return pass ? null : revert(why);
  };

  fs.writeFileSync(file, after);

  const gone = missingTables(before, after);
  let bad = check("tables", "既有表格的欄位沒被動到", !gone.length,
    gone.length ? `這個改法會讓「${gone[0].split("|").slice(0, 3).join("、")}…」那張表接不上（欄位名稱被改掉或整張表被拿掉）` : "");
  if (bad) return bad;

  bad = check("runtime", "修改助理還在", after.includes(MARK_OPEN) && after.includes(MARK_CLOSE),
    "這個改法會把修改助理拿掉，那樣你就沒辦法再改它了");
  if (bad) return bad;

  bad = check("screens", "畫面沒有變少", screens(after) >= screens(before),
    "這個改法會讓畫面變少");
  if (bad) return bad;

  /* 本地腳本只允許 ./_jv/ 底下那幾支——那正是實例的執行時與修改助理，
     必須在。這條規則原本是從 demo 的規則抄來的（demo 要單檔自足），
     直接套到實例上會把每一次修改都擋掉，因為那幾行本來就在檔案裡。 */
  const badLocal = (after.match(/<script[^>]+src=["']\.[^"']*["']/gi) || [])
    .filter((tag) => !/["']\.\/_jv\//.test(tag));
  bad = check("local", "沒有引用本地檔案", !badLocal.length,
    "這個改法引用了本地檔案，交付出去會壞掉");
  if (bad) return bad;

  bad = check("interval", "沒有用 setInterval", !/setInterval\s*\(/.test(after),
    "這個改法用了 setInterval，那會讓頁面一直在背景跑");
  if (bad) return bad;

  stage("check", "ok");

  /* 過了所有護欄才記成版本。中途被退回的東西不該出現在他的版本清單上，
     那些頁面從來沒有真的存在過。 */
  const versionId = versions.record(dir, { note: note || String(instruction).slice(0, 200), action: "edit" });
  /* before／after 交出去給呼叫端比對新增了哪些表格，好把資料層補上。
     這一支刻意只碰檔案不碰資料庫——建表要連資料庫，混進來的話這裡就再也
     不能單獨測試了。 */
  return { ok: true, bytes: Buffer.byteLength(after), versionId, how,
    applied: result.applied || null, before, after, plan, checks,
    highlights: newTexts(before, after) };
}

/**
 * 還原成上一版。
 *
 * 原本是拿 index.prev.html 跟現在的檔案交換，所以只有一個來回；
 * 現在往版本清單裡退一格，而且退這件事本身也會記成新版本，
 * 所以「還原了之後又想回去」走得回來。
 */
export function undo(dir) {
  const id = versions.previous(dir);
  if (!id) return false;
  return versions.restore(dir, id).ok;
}
