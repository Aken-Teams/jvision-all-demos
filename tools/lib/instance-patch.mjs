/**
 * 把模型回的「取代這一段」逐一套進檔案裡。
 *
 * 為什麼不讓它整份重寫：實測過一次「把統計數字放大」，它確實做對了
 * （font-size 25px→29px、加了底色），但同時把一行完全不相干的跳脫函式
 * 從 &gt; 打成了 &gt——沒有 console 錯誤、頁面照常顯示，只有資料裡帶 >
 * 的時候會壞，要用一陣子才發現，而且發現時不會聯想到是那次「把字放大」。
 *
 * 五道護欄（表頭指紋、live 標記、畫面數、本地腳本、setInterval）檢查得到
 * 結構性的破壞，檢查不到這種語意層的錯字。取代區塊則從根本上讓它發生不了：
 * 沒有被 find 命中的地方，一個位元組都不會變。
 *
 * 順帶的好處是快：輸出從 50KB 掉到 1KB 以內，而生成是逐字序列的，
 * 輸出量才是時間的主要來源。
 */

/** 一次最多改幾處。改超過這個數量通常代表它在重寫而不是在修改。 */
const MAX_EDITS = 24;

function count(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) { n += 1; i = haystack.indexOf(needle, i + needle.length); }
  return n;
}

/**
 * 套用一批取代。回 { ok, text, applied, why }。
 *
 * 只要有一處對不上就整批不套用。半套的頁面比沒改更糟——客戶會看到一個
 * 似是而非的畫面，而且沒有任何東西告訴他「只做到一半」。
 */
export function applyEdits(source, edits) {
  if (!Array.isArray(edits) || !edits.length) return { ok: false, why: "沒有給任何要改的地方" };
  if (edits.length > MAX_EDITS) return { ok: false, why: `一次要改 ${edits.length} 處，太多了` };

  let text = source;
  let applied = 0;

  for (let i = 0; i < edits.length; i += 1) {
    const find = String(edits[i]?.find ?? "");
    const replace = String(edits[i]?.replace ?? "");
    if (!find) return { ok: false, why: `第 ${i + 1} 處沒有指定要取代什麼` };
    if (find === replace) continue;   // 沒有差別的就跳過，不算失敗

    /* 逐處對「目前的內容」檢查，而不是一開始那份。前面的取代可能已經改動了
       後面要找的那段文字，拿原文檢查會通過、實際套用時卻找不到。 */
    const hits = count(text, find);
    /* 零次代表它記錯了或自己編了一段原文；多次代表指涉不明確，
       套下去會改到不該改的地方。兩種都不能猜，只能整批退回。 */
    if (hits === 0) return { ok: false, why: `第 ${i + 1} 處在檔案裡找不到（模型記錯了原文）` };
    if (hits > 1) return { ok: false, why: `第 ${i + 1} 處在檔案裡出現 ${hits} 次，分不出要改哪一個` };

    const at = text.indexOf(find);
    text = text.slice(0, at) + replace + text.slice(at + find.length);
    applied += 1;
  }

  if (!applied) return { ok: false, why: "這些取代跟原本的內容一模一樣" };
  return { ok: true, text, applied };
}

/**
 * 換掉整份檔案裡唯一那個 <style> 區塊的內容。
 *
 * 換裝的主要工作就是這一塊（實測 10 套：每套都只有一個 <style>，
 * 9–18KB、佔全檔 24–35%）。要模型把它整段逐字元複製回來當 find，
 * 是在要求它抄寫一萬多個字元不出錯——第一次 A/B 就是敗在
 * 「第 1 處在檔案裡找不到（模型記錯了原文）」。
 *
 * 所以這一塊不走 find/replace：模型只給新的 CSS，邊界由這裡自己找。
 * 抄寫的風險整個消失，而且它連 <th> 的文字都不會經手。
 */
export function replaceStyleBlock(html, css) {
  const m = /<style\b[^>]*>[\s\S]*?<\/style>/i.exec(html);
  if (!m) return { ok: false, why: "這份檔案裡沒有 <style> 區塊" };
  const open = m[0].slice(0, m[0].indexOf(">") + 1);
  return { ok: true, text: html.slice(0, m.index) + open + "\n" + css + "\n</style>" + html.slice(m.index + m[0].length) };
}
