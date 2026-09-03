/**
 * 從一份 index.html 抽出一份「這個畫面長什麼樣」的摘要。
 *
 * ── 為什麼需要 ────────────────────────────────────────
 * 決定「這句話要做什麼動作」的那個模型（instance-chat.decide）以前只拿到
 * 兩樣東西：資料表清單、最近六句對話。**它從來沒看過那個網頁。**
 * 所以它不可能考慮版面、RWD、或「這件事該做多大」——它手上沒有那份資訊。
 * 使用者說「AI 很弱」，弱的其實是它被餵的東西。
 *
 * ── 為什麼是這種抽法 ──────────────────────────────────
 * 直接把 60KB 的 HTML 丟進去不行：那個呼叫有 90 秒上限，而且大部分是
 * 樣式與腳本，訊號被雜訊淹掉。
 *
 * 也不能靠固定的骨架去解析。實測過：seal-authorization 用
 * <section class="page" data-page="N">，crm 那套連一個 data-i 都沒有，
 * 三張表全寫在 <script> 的字串裡。**每一套的骨架都不一樣**，因為它們是
 * 不同時間由產線生成的。所以這裡只抽「不管骨架長怎樣都存在」的東西：
 * 標題、表格表頭、表單控制項、按鈕文字、圖表、CSS 斷點。
 *
 * 產出刻意壓成幾百個字。它要回答的是「這套系統大概是什麼形狀」，
 * 不是「逐字重現」——真正要動手改的那一步本來就會拿到完整的 HTML。
 */
import { tableRanges } from "./instance-head.mjs";

const strip = (s) => String(s)
  .replace(/<[^>]*>/g, "")
  .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#0?39;/g, "'")
  .replace(/\s+/g, " ").trim();

const uniq = (a) => [...new Set(a.filter(Boolean))];

/**
 * 從 <script> 的樣板字串裡撈標籤，代價是會撈到還沒代入的佔位符
 * （實測 crm 那套的區塊標題撈出 "${MODS[i][2]}"）。那不是畫面上的字，
 * 放進摘要只會讓模型以為畫面上真的寫著那串程式碼。
 */
const real = (t) => t && !/\$\{|<%|\{\{/.test(t);

/**
 * 準備要抽文字的來源。
 *
 * 只挖掉 <style>，**不挖 <script>**：實測 crm 那套整個畫面都是 JS 用字串
 * 建出來的，挖掉腳本就只剩一片空白，摘要會變成一句錯的「只有一個畫面」。
 * <h1>…</h1>、<button>…</button> 這些標籤形狀夠特別，出現在 JS 字串裡
 * 也還是畫面上的東西。
 *
 * 圖示字型的連字要拿掉——material symbols 的 <span>ink_pen</span> 會跟旁邊
 * 的字黏成「ink_pen提出申請」，那不是任何人在畫面上看到的字。
 */
function textSource(html) {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<(span|i)\b[^>]*class="[^"]*material-symbols[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, "");
}

export function outline(html) {
  const src = String(html || "");
  /* 表格要從**完整的原始碼**找：不少 demo 的畫面是 JS 用字串建出來的，
     挖掉 <script> 就會漏掉它們自己一半的表。 */
  const tables = tableRanges(src).map((r) => {
    const seg = src.slice(r.start, r.end);
    const th = [...seg.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => strip(m[1])).filter(Boolean);
    return th;
  }).filter((t) => t.length);

  const vis = textSource(src);

  const headings = [];
  for (const m of vis.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const t = strip(m[2]);
    if (real(t)) headings.push({ level: Number(m[1]), text: t.slice(0, 40) });
  }

  /* 畫面切換的線索。三種標法都見過，取聯集而不是挑一種。 */
  const screens = uniq([
    ...[...src.matchAll(/data-(?:i|page|tab|view)="[^"]*"[^>]*aria-label="([^"]+)"/gi)].map((m) => m[1]),
    ...[...src.matchAll(/aria-label="([^"]+)"[^>]*data-(?:i|page|tab|view)="[^"]*"/gi)].map((m) => m[1]),
  ]).slice(0, 12);
  const screenCount = uniq([...src.matchAll(/data-(?:i|page|tab|view)="(\d+)"/gi)].map((m) => m[1])).length;

  const fields = [...vis.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)].map((m) => {
    const attrs = m[2];
    const ph = /placeholder="([^"]+)"/i.exec(attrs);
    const nm = /(?:aria-label|name|id)="([^"]+)"/i.exec(attrs);
    const ty = /type="([^"]+)"/i.exec(attrs);
    const label = ph ? ph[1] : (nm ? nm[1] : null);
    return { tag: m[1].toLowerCase(), type: ty ? ty[1] : null, label: real(label) ? label : null };
  });

  const buttons = uniq([...vis.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)]
    .map((m) => strip(m[1])).filter((t) => real(t) && t.length <= 14)).slice(0, 16);

  const charts = uniq([
    ...(/echarts/i.test(src) ? ["ECharts"] : []),
    ...(/chart\.js|new\s+Chart\s*\(/i.test(src) ? ["Chart.js"] : []),
    ...(/<canvas\b/i.test(src) ? ["canvas"] : []),
    ...(/<svg\b/i.test(src) ? ["SVG"] : []),
  ]);

  /* RWD。兩種寫法都要看：手寫的 @media，以及 Tailwind 的響應式前綴。 */
  const breakpoints = uniq([...src.matchAll(/@media\s*\(?\s*(?:max|min)-width\s*:\s*(\d+)px/gi)]
    .map((m) => `${m[1]}px`));
  const tw = uniq([...src.matchAll(/\b(sm|md|lg|xl|2xl):/g)].map((m) => m[1]));

  const cdns = uniq([...src.matchAll(/src="(https:\/\/[^"]+)"/gi)]
    .map((m) => { try { return new URL(m[1]).hostname; } catch { return null; } }));

  return {
    bytes: Buffer.byteLength(src),
    screens, screenCount: Math.max(screenCount, screens.length),
    headings: headings.slice(0, 24),
    tables,
    fields,
    buttons,
    charts,
    breakpoints,
    tailwindBreakpoints: tw,
    cdns,
  };
}

/** 壓成給 prompt 用的文字。目標是「幾百個字說清楚形狀」。 */
export function toText(o) {
  const L = [];
  L.push(`整份頁面 ${(o.bytes / 1024).toFixed(0)}KB，單一 index.html。`);

  if (o.screenCount > 1) {
    L.push(`共 ${o.screenCount} 個畫面${o.screens.length ? `：${o.screens.join("、")}` : ""}。`);
  } else if (o.tables.length > 1 || o.headings.length > 3) {
    /* 找不到 data-i／data-page 不代表只有一個畫面——有些 demo 的切換是用
       JS 自己管的。內容明顯不只一屏時要照實說「看不出來」，
       不可以斷言「只有一個畫面」：那會讓模型以為改一處就涵蓋全部。 */
    L.push("看不出畫面切換的標記（這一套的切換可能是 JS 自己管的），改動前要自己確認影響範圍。");
  } else {
    L.push("只有一個畫面。");
  }

  const h1 = o.headings.filter((h) => h.level === 1).map((h) => h.text);
  const h23 = o.headings.filter((h) => h.level > 1).map((h) => h.text);
  if (h1.length) L.push(`主標題：${h1.join("、")}`);
  if (h23.length) L.push(`區塊：${h23.slice(0, 14).join("、")}${h23.length > 14 ? "…" : ""}`);

  if (o.tables.length) {
    L.push(`表格 ${o.tables.length} 張：`);
    o.tables.slice(0, 6).forEach((t, i) => L.push(`  ${i + 1}. ${t.join(" ｜ ")}`));
    if (o.tables.length > 6) L.push(`  （另有 ${o.tables.length - 6} 張）`);
  } else {
    L.push("沒有 <table>——這套是用表單／卡片呈現資料的。");
  }

  if (o.fields.length) {
    const kinds = {};
    for (const f of o.fields) {
      const k = f.tag === "input" ? (f.type || "text") : f.tag;
      kinds[k] = (kinds[k] || 0) + 1;
    }
    L.push(`輸入控制項 ${o.fields.length} 個（${Object.entries(kinds).map(([k, n]) => `${k}×${n}`).join("、")}）。`);
    const named = o.fields.map((f) => f.label).filter(Boolean).slice(0, 12);
    if (named.length) L.push(`  欄位：${named.join("、")}`);
  }

  if (o.buttons.length) L.push(`按鈕：${o.buttons.join("、")}`);
  if (o.charts.length) L.push(`圖表：${o.charts.join("、")}`);

  /* RWD 是使用者抱怨最多的一項——他要的是「改了之後手機上也還是對的」。
     所以這裡不只說有沒有，還要說斷點在哪，模型才知道要照顧哪幾段。 */
  if (o.breakpoints.length) L.push(`RWD：CSS 斷點 ${o.breakpoints.join("、")}。`);
  else if (o.tailwindBreakpoints.length) L.push(`RWD：Tailwind 響應式前綴 ${o.tailwindBreakpoints.join("、")}。`);
  else L.push("⚠️ RWD：這份頁面沒有任何斷點，窄螢幕會直接壞掉。");

  if (o.cdns.length) L.push(`外部資源：${o.cdns.join("、")}`);
  return L.join("\n");
}

/** 一步到位。 */
export const describe = (html) => toText(outline(html));
