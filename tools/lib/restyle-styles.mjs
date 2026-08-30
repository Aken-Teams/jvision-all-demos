/**
 * 每套 demo 分到一組**不重複**的視覺風格。
 *
 * 做法是幾個彼此正交的軸，各自獨立取值再組合。用 repo 名稱的雜湊決定，
 * 所以同一套永遠拿到同一組風格——重跑、續跑、事後對照都是同一個答案，
 * 不會今天橘色明天綠色。
 *
 * 軸線刻意挑「看得出差別」的：版面骨架與色調一眼就分得出來，圓角和密度
 * 決定第二眼的氣質。只換顏色的話，1,900 套看起來還是同一套系統。
 */

/* 色票要成對給：主色與它搭得起來的輔色。隨機湊會出現螢光綠配磚紅那種組合。 */
export const PALETTES = [
  { name: "靛藍商務", blue: "#1e40af", accent: "#3b82f6", ink: "#0f172a", bg: "#f5f8fc" },
  { name: "深海青", blue: "#0e7490", accent: "#06b6d4", ink: "#083344", bg: "#f0fdff" },
  { name: "森綠", blue: "#15803d", accent: "#22c55e", ink: "#052e16", bg: "#f3fdf6" },
  { name: "琥珀工業", blue: "#b45309", accent: "#f59e0b", ink: "#1c1917", bg: "#fffbf3" },
  { name: "磚紅", blue: "#b91c1c", accent: "#ef4444", ink: "#1c1917", bg: "#fef7f6" },
  { name: "紫晶", blue: "#6d28d9", accent: "#8b5cf6", ink: "#1e1b4b", bg: "#faf7ff" },
  { name: "石墨", blue: "#334155", accent: "#64748b", ink: "#0f172a", bg: "#f6f7f9" },
  { name: "玫瑰", blue: "#be185d", accent: "#ec4899", ink: "#1f1420", bg: "#fff5f9" },
  { name: "松石", blue: "#0f766e", accent: "#14b8a6", ink: "#042f2e", bg: "#f2fdfb" },
  { name: "夜藍深色", blue: "#60a5fa", accent: "#93c5fd", ink: "#e2e8f0", bg: "#0f172a", dark: true },
  { name: "碳黑深色", blue: "#a3e635", accent: "#bef264", ink: "#e7e5e4", bg: "#18181b", dark: true },
  { name: "普魯士藍", blue: "#1d4ed8", accent: "#60a5fa", ink: "#111827", bg: "#f8fafc" },
  { name: "橄欖", blue: "#4d7c0f", accent: "#84cc16", ink: "#1a2e05", bg: "#f8fdf0" },
  { name: "陶土", blue: "#9a3412", accent: "#fb923c", ink: "#1c1917", bg: "#fffaf5" },
  { name: "靛紫深色", blue: "#a78bfa", accent: "#c4b5fd", ink: "#ede9fe", bg: "#1e1b4b", dark: true },
  { name: "冰灰藍", blue: "#0369a1", accent: "#38bdf8", ink: "#0c2637", bg: "#f4f9fd" },
];

export const LAYOUTS = [
  { key: "rail-left", desc: "左側 76–88px 圖示軌 + 主區，標題列薄" },
  { key: "sidebar-wide", desc: "左側 200–240px 含文字的側欄，分組標題" },
  { key: "top-tabs", desc: "頂部分頁列，無側欄，內容全寬" },
  { key: "split-master-detail", desc: "左清單右詳情兩欄，左欄可捲動" },
  { key: "dashboard-grid", desc: "上方 KPI 卡片列 + 下方不等寬網格" },
  { key: "console-dense", desc: "資訊密度高的監控台，細列高、多欄位" },
  { key: "docked-bottom", desc: "主區 + 底部固定資訊列（狀態／進度）" },
  { key: "card-stream", desc: "以卡片流為主，表格放在卡片內" },
];

export const SHAPES = [
  { key: "sharp", desc: "直角（radius 0–2px），邊框明確" },
  { key: "soft", desc: "圓角 8–12px，陰影柔和" },
  { key: "pill", desc: "圓角 14–18px，按鈕做成膠囊" },
];

export const DENSITY = [
  { key: "compact", desc: "列高 30–34px，字級 12.5–13px" },
  { key: "regular", desc: "列高 38–42px，字級 13.5–14px" },
  { key: "airy", desc: "列高 46–52px，字級 14.5–15px，留白大" },
];

export const TYPO = [
  { key: "geometric", desc: "標題重（800–900）、字距略緊" },
  { key: "editorial", desc: "標題細（600）、字距寬、小標用全大寫英文" },
  { key: "mono-accent", desc: "數字與代號用等寬字，標題一般字重" },
];

export const CHROME = [
  { key: "flat", desc: "無陰影，只用 1px 線分隔" },
  { key: "elevated", desc: "卡片有明顯陰影，層次分明" },
  { key: "outlined", desc: "粗邊框（1.5–2px），無陰影" },
  { key: "tinted", desc: "卡片帶主色 4–8% 底色" },
];

/* FNV-1a。要的是穩定與分散，不是密碼強度。 */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * 給一個 repo 名稱，回它的風格。
 *
 * 每個軸用**不同的位元段**取值，否則各軸會同步變化——那樣只會得到
 * 幾種固定搭配，而不是 16×8×3×3×3×4 = 13,824 種組合。
 */
export function styleFor(repoName) {
  const h = hash(repoName);
  const pick = (arr, shift) => arr[(h >>> shift) % arr.length];
  return {
    palette: pick(PALETTES, 0),
    layout: pick(LAYOUTS, 5),
    shape: pick(SHAPES, 9),
    density: pick(DENSITY, 12),
    typo: pick(TYPO, 15),
    chrome: pick(CHROME, 18),
  };
}

/** 給 codex 看的一段話。寫成人看得懂的句子，比一堆鍵值對更容易被照做。 */
export function styleBrief(repoName) {
  const s = styleFor(repoName);
  return [
    `色調：${s.palette.name}（主色 ${s.palette.blue}、輔色 ${s.palette.accent}、`
      + `文字 ${s.palette.ink}、底 ${s.palette.bg}${s.palette.dark ? "，深色介面" : ""}）`,
    `版面：${s.layout.desc}`,
    `形狀：${s.shape.desc}`,
    `密度：${s.density.desc}`,
    `字體表現：${s.typo.desc}`,
    `層次：${s.chrome.desc}`,
  ].join("\n");
}

export const COMBINATIONS = PALETTES.length * LAYOUTS.length * SHAPES.length
  * DENSITY.length * TYPO.length * CHROME.length;
