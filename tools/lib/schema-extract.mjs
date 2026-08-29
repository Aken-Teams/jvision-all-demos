/**
 * 從 demo 的 index.html 抽出「可綁定的資料表」。純函式，不碰檔案系統，好測。
 *
 * 為什麼來源是 HTML 而不是 content/details 的 records：實測 1,420 套裡有
 * 1,340 套的 records.columns 完全相同（編號/項目/負責人/期限/階段）——那是
 * detail-template.mjs 寫死的樣板。抽樣比對後只有 17% 與畫面上的表格相符。
 * 客戶買的是畫面上那張表，所以真正的 schema 只能從 HTML 抽。
 */

const strip = (s) => String(s).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** 從 HTML 片段的屬性抓值（用於 id/class/data-i）。 */
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? m[1] : null;
}

/**
 * 產生穩定的 CSS selector。優先序：#id → 唯一的 table.class → 所在畫面內的第 n 張表。
 * 之所以要 selector，是因為 runtime 之後要靠它在客戶的實例裡找到同一張表接手。
 */
function selectorFor(html, tableTag, indexInDoc, screenIndex) {
  const id = attr(tableTag, "id");
  if (id) return `#${id}`;
  const cls = (attr(tableTag, "class") || "").trim().split(/\s+/).filter(Boolean);
  for (const c of cls) {
    const occurrences = (html.match(new RegExp(`<table[^>]*\\bclass="[^"]*\\b${c}\\b`, "g")) || []).length;
    if (occurrences === 1) return `table.${c}`;
  }
  if (screenIndex != null) return `[data-i="${screenIndex}"] table:nth-of-type(${indexInDoc.inScreen})`;
  return `table:nth-of-type(${indexInDoc.inDoc})`;
}

/** 值的型別推斷。只用樣本，推不出來就 text——寧可保守，欄位型別錯了比沒型別更難救。 */
export function inferType(values) {
  const v = values.map((x) => String(x ?? "").trim()).filter(Boolean);
  if (!v.length) return "text";
  const all = (re) => v.every((x) => re.test(x));
  if (all(/^-?\d+$/)) return "int";
  if (all(/^-?\d+(\.\d+)?\s*%$/)) return "percent";
  if (all(/^[$NT￥,\s]*-?\d[\d,]*(\.\d+)?$/)) return "number";
  if (all(/^\d{4}[-/]\d{1,2}([-/]\d{1,2})?$/) || all(/^D[+-]\d+$/)) return "date";
  const uniq = new Set(v);
  if (uniq.size <= 5 && v.length >= 4 && uniq.size < v.length) return "enum";
  return "text";
}

/**
 * 抽出一份 HTML 裡所有「像資料表」的表格。
 * @returns {Array<{selector, caption, labels:string[], sample:string[][], types:string[], rendered:boolean}>}
 */
export function extractTables(html) {
  const out = [];
  let inDoc = 0;
  const screenCounter = new Map();

  for (const m of html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/g)) {
    const block = m[0];
    const tag = block.slice(0, block.indexOf(">") + 1);
    inDoc += 1;

    const labels = [...block.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((x) => strip(x[1])).filter(Boolean);
    if (labels.length < 3) continue;

    // 這張表落在哪個畫面（data-i="N"）——selector 要用，runtime 也要知道綁在第幾頁
    let screenIndex = null;
    const before = html.slice(0, m.index);
    const lastScreen = [...before.matchAll(/data-i\s*=\s*"(\d+)"/g)].pop();
    if (lastScreen) screenIndex = Number(lastScreen[1]);
    const inScreen = (screenCounter.get(screenIndex) || 0) + 1;
    screenCounter.set(screenIndex, inScreen);

    // 靜態資料列：抓 <tbody> 裡欄位數相符、且不含樣板變數的列
    const sample = [];
    for (const r of block.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => strip(x[1]));
      if (cells.length !== labels.length) continue;
      if (cells.some((c) => /\$\{|<%|\{\{/.test(c))) continue; // 樣板字串不是資料
      sample.push(cells);
      if (sample.length >= 6) break;
    }

    const capM = block.match(/<caption[^>]*>([\s\S]*?)<\/caption>/);
    out.push({
      selector: selectorFor(html, tag, { inDoc, inScreen }, screenIndex),
      screen: screenIndex,
      caption: capM ? strip(capM[1]) : null,
      labels,
      sample,
      types: labels.map((_, i) => inferType(sample.map((row) => row[i]))),
      rendered: sample.length === 0, // 空的代表資料是 JS 畫上去的
    });
  }
  return out;
}

/**
 * 從內嵌 script 找出物件字面量陣列——JS 渲染的表格，真資料在這裡。
 * 用括號配對取完整範圍再求值；求值失敗（含函式呼叫、樣板字串）就跳過。
 */
export function dataArrays(html) {
  const js = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
  const out = [];
  for (let i = 0; i < js.length; i += 1) {
    if (js[i] !== "[") continue;
    let j = i + 1;
    while (j < js.length && /\s/.test(js[j])) j += 1;
    if (js[j] !== "{") continue;
    let depth = 0, end = -1;
    for (let k = i; k < js.length && k < i + 20000; k += 1) {
      if (js[k] === "[") depth += 1;
      else if (js[k] === "]") { depth -= 1; if (depth === 0) { end = k; break; } }
    }
    if (end < 0) continue;
    try {
      const v = new Function(`return (${js.slice(i, end + 1)})`)();
      if (Array.isArray(v) && v.length >= 3 && v.every((x) => x && typeof x === "object" && !Array.isArray(x))) out.push(v);
    } catch { /* 不是純資料就不要 */ }
    i = end;
  }
  return out;
}

/** 幫 JS 渲染的表格找回真資料：欄位數與表頭最接近的那個陣列。 */
export function matchArray(arrays, labelCount) {
  let best = null, bestScore = Infinity;
  for (const a of arrays) {
    const score = Math.abs(Object.keys(a[0]).length - labelCount);
    if (score < bestScore) { bestScore = score; best = a; }
  }
  return bestScore <= 3 ? best : null;
}
