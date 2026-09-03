/**
 * 一個實例實際上由哪些檔案組成。
 *
 * ── 為什麼要有 ────────────────────────────────────────
 * 「程式碼」那一頁以前只抓 public/index.html 一個檔，於是看起來像「這套系統
 * 就是一個 HTML」。但實例本來就不只那一個：畫面旁邊有把它接到資料庫的執行時、
 * 有修改助理、有資料表定義，還有客戶自己丟進來的參考資料。
 * 只給一個檔，使用者不知道其他東西存不存在，也就不知道能改什麼、不能改什麼。
 *
 * ── 為什麼要標註每個檔的角色 ──────────────────────────
 * 光列檔名沒有用——`live.js` 三個字說不出它是什麼。這裡每一項都帶一句話說明
 * 它在做什麼、能不能改，因為使用者真正要判斷的是「我可以叫助理動哪一個」。
 *
 * ── 邊界 ──────────────────────────────────────────────
 * 只走實例目錄底下，只列讀得成文字的。上傳的截圖不列（那是對話的附件，
 * 不是這套系統的一部分），node_modules 之類的也不會有——實例目錄裡沒有那種東西。
 */
import fs from "node:fs";
import path from "node:path";

/* 讀得成文字的才列。二進位檔列出來只會給一個打不開的項目。 */
const TEXT = new Set([".html", ".js", ".mjs", ".css", ".json", ".md", ".txt", ".csv", ".tsv", ".svg"]);

/* 單檔顯示上限。超過就只給前面這一段——瀏覽器把 2MB 的字串塞進 <pre> 會卡住。 */
export const MAX_VIEW = 512 * 1024;

/* 這一份是實例的骨架，每一個檔的角色都是固定的，所以直接寫死說明。
   讓程式去猜「這個 js 在做什麼」只會猜錯，而猜錯的說明比沒有說明糟。 */
const ROLE = {
  "public/index.html": { t: "畫面本體", d: "整套系統的畫面與邏輯都在這裡。助理改的就是這一個檔。", edit: true },
  "public/_jv/live.js": { t: "資料執行時", d: "把畫面上的表格接到你的資料庫，新增、修改、刪除都靠它。" },
  "public/_jv/assist.js": { t: "修改助理", d: "系統右下角那顆機器人，讓你在系統裡直接說要改什麼。" },
  "public/_jv/tour.js": { t: "首次導覽", d: "第一次打開時的引導。" },
  "public/_jv/tour.json": { t: "導覽文案", d: "導覽要講的內容。" },
  "public/_jv/schema.json": { t: "資料表定義", d: "有哪些資料表、哪些欄位、什麼型別。" },
  "README.md": { t: "說明", d: "這套系統怎麼跑起來。" },
};

/* 目錄本身的說明。使用者問的是「這個資料夾裝什麼」，不是「裡面有幾個檔」。 */
const DIR_NOTE = {
  public: "會被瀏覽器載入的東西。交付出去之後，這個資料夾就是網站根目錄。",
  "public/_jv": "平台注入的執行時。交付到客戶自己的環境時會一起帶走，不需要連回我們。",
  refs: "你自己丟進來的規劃文件與資料樣本。助理每次修改都會拿它當依據。",
};

function walk(root, rel, out, depth) {
  if (depth > 4) return;
  const abs = path.join(root, rel);
  let entries;
  try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch { return; }
  entries
    .filter((e) => !e.name.startsWith("."))
    .sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : (a.isDirectory() ? -1 : 1)))
    .forEach((e) => {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        /* uploads 是對話的附件、versions 是歷史快照（「紀錄」那一頁在看它），
           兩者都不是「這套系統由哪些檔案組成」的答案。versions 尤其吵：
           改十次就多十份 60~90KB 的 HTML，會把真正的骨架淹掉。 */
        if (r === "uploads" || r === "versions") return;
        out.push({ path: r, dir: true, note: DIR_NOTE[r] || null });
        walk(root, r, out, depth + 1);
        return;
      }
      if (!TEXT.has(path.extname(e.name).toLowerCase())) return;
      let bytes = 0;
      try { bytes = fs.statSync(path.join(root, r)).size; } catch { return; }
      const role = ROLE[r];
      out.push({
        path: r, dir: false, bytes,
        title: role ? role.t : null,
        note: role ? role.d : null,
        editable: Boolean(role && role.edit),
      });
    });
}

/** 這個實例有哪些檔案。回的是扁平清單，前端自己用 path 縮排。 */
export function list(instDir) {
  const out = [];
  walk(instDir, "", out, 0);
  return out;
}

/**
 * 讀一個檔。
 *
 * 路徑是外部輸入，所以除了副檔名白名單，還要確認解析之後真的落在實例目錄
 * 底下——只擋 ".." 這種字串不夠，符號連結與各種編碼都繞得過去。
 */
export function read(instDir, rel) {
  const p = String(rel || "");
  if (!p || p.length > 300) return null;
  if (!TEXT.has(path.extname(p).toLowerCase())) return null;
  const base = path.resolve(instDir);
  const file = path.resolve(base, p);
  if (!file.startsWith(base + path.sep)) return null;
  let st;
  try { st = fs.statSync(file); } catch { return null; }
  if (!st.isFile()) return null;
  const body = fs.readFileSync(file, "utf8");
  return body.length > MAX_VIEW
    ? { text: `${body.slice(0, MAX_VIEW)}\n\n…（檔案還沒完，太長了先顯示到這裡）`, bytes: st.size, truncated: true }
    : { text: body, bytes: st.size, truncated: false };
}
