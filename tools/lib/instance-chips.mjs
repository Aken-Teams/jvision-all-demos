/**
 * 對話框上方那幾顆建議句。
 *
 * ── 為什麼要從這套系統自己長出來 ──────────────────────
 * 原本是寫死的三句（「加一個備註欄位」「把『編號』改叫『承辦人』」「改一下配色」），
 * 每一套系統看到的都一樣。問題不只是重複：
 *
 * 一、寫死的示範會是**錯的**。「把『編號』改叫『承辦人』」放在飯店房價系統上
 *     沒有意義；而如果那套系統根本沒有「編號」這個欄位，這句話連按都按不得。
 * 二、建議句的真正作用是告訴使用者「你可以用這種顆粒度講話」。用他畫面上
 *     真的存在的欄位名、畫面名去講，他才會相信「原來這樣講就行」。
 *     用一個他沒見過的名詞，效果剛好相反——他會以為要先學某種語法。
 *
 * ── 為什麼不叫 AI 產 ──────────────────────────────────
 * 這幾顆要在工作台一打開就出現。叫模型產要等好幾秒，而且每次不一樣——
 * 使用者剛看到的那句，重新整理就消失了。改成從結構直接算：同一套系統永遠
 * 得到同一組建議，成本是零。
 *
 * ── 挑選原則 ──────────────────────────────────────────
 * 每一句都要帶至少一個「他畫面上看得到的字」，而且要短。
 * 順序是刻意的：先講最可能有用的（樣板欄位還沒換掉、缺備註），
 * 最後才放通用的那句配色。
 */

/* 模板預設的那組欄位。整組都在就表示這張表還沒被換成真正要管的東西。 */
const TEMPLATE_COLS = ["編號", "項目", "負責人", "期限", "階段"];

/* 幾乎每套系統都會想加、而模板通常沒有的欄位。 */
const HANDY = ["備註", "建立時間", "負責人"];

const clean = (x) => String(x || "").replace(/\s+/g, " ").trim();

/**
 * 這個字串拿去當建議句安全嗎。
 *
 * 型錄裡有不少 demo 是用 JS 樣板字串把畫面拼出來的，所以抽出來的「標題」
 * 有時候會是程式碼碎片——實測 jvision-attendance 的 h3 抽到 `'+esc(m.t)+'`，
 * 而那句話會原封不動變成一顆建議按鈕。使用者看到那個只會覺得系統壞了。
 *
 * 判斷方式是找出「人寫的標題不會有」的字元：引號、加號、反引號、大括號、
 * $、以及 xxx( 這種函式呼叫的形狀。寧可漏掉幾個能用的素材，也不要放一句
 * 明顯是程式碼的話出去。
 */
const usable = (x) => {
  const s = clean(x);
  if (!s || s.length > 14) return false;
  if (/['"`+${}]|\)|\w\(/.test(s)) return false;
  return true;
};

/** 這張表看起來像模板預設的嗎。 */
const isTemplate = (cols) => TEMPLATE_COLS.every((g) => cols.includes(g));

/**
 * 產生建議句。
 *
 * o 是 page-outline 的結果（要 screens、tables、headings、charts）。
 * 回最多 max 句，順序即優先順序。素材不夠時會退到通用句，但至少會有一句
 * 帶著這套系統自己的字——除非連畫面名與欄位名都讀不到。
 */
export function chips(o, max = 4) {
  const out = [];
  const add = (t) => {
    const s = clean(t);
    if (s && out.indexOf(s) < 0 && out.length < max) out.push(s);
  };

  const tables = (o?.tables || []).map((t) => t.map(clean).filter(usable)).filter((t) => t.length);
  const screens = (o?.screens || []).map(clean).filter(usable);
  /* h2/h3 是區段標題（「收益駕駛艙」「送件完整度」），比 h1 那句標語好用。 */
  const sections = (o?.headings || []).filter((h) => h.level >= 2 && h.level <= 3)
    .map((h) => clean(h.text)).filter(usable);

  /* 一、還留著模板欄位的表最該先處理——那是拿出去會被看到的東西。 */
  const tpl = tables.find(isTemplate);
  if (tpl) add("把「編號／項目／負責人…」那張表改成真正要管的欄位");

  /* 二、缺一個常用欄位。表名用第一欄——那一欄通常就是這張表在管的東西
     （「房型 / 實體庫存」「承辦人」），比 table_2 這種代號好認。
     只有一張表的話不必指名，說「那張表」反而囉唆。 */
  const real = tables.filter((t) => !isTemplate(t));
  const target = real.find((t) => HANDY.some((h) => !t.includes(h)));
  if (target) {
    const want = HANDY.find((h) => !target.includes(h));
    add(real.length > 1 ? `在「${target[0]}」那張表加一個${want}欄位` : `加一個${want}欄位`);
  }

  /* 三、改欄位名。挑一個有意義的欄位，不要挑第一欄——第一欄常常是編號或
     主鍵，改它的名字沒什麼道理。不寫「改叫什麼」，那是他要決定的事。 */
  const named = real.find((t) => t.length >= 2);
  if (named) {
    const col = named.slice(1).find((c) => c.length >= 2 && c.length <= 8) || named[1];
    add(`把「${col}」這個欄位改個名字`);
  }

  /* 四、畫面。用第二個畫面而不是第一個：第一個通常是總覽／儀表板，
     改它比較像大工程；第二個往後才是實際在做事的那幾頁。 */
  const screen = screens[1] || screens[0] || sections[1] || sections[0];
  if (screen) add(`在「${screen}」多一個欄位`);

  /* 五、圖表。已經有圖表庫的話，加一張是很輕的要求；沒有的話講「統計圖」
     比講「圖表」具體。 */
  if (screens[0] || sections[0]) {
    add((o?.charts || []).length
      ? `在「${screens[0] || sections[0]}」加一張趨勢圖`
      : `加一張統計圖看${screens[0] || sections[0]}的趨勢`);
  }

  /* 六、最後才是通用那句。它永遠適用，所以永遠排最後——排前面的話，
     一組建議看起來就會像跟這套系統無關。 */
  add("改一下配色，我想要更沉穩一點");
  return out;
}
