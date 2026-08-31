/**
 * 客戶系統的版本。每一次成功的修改都留一份可以回去的樣子。
 *
 * 原本只有 index.prev.html 一層，而且是「交換」——說第二次「還原」會回到
 * 剛才那一版，等於只有一個來回。客戶改了五次之後想回到第二次的樣子，
 * 那個做法什麼也給不了他。
 *
 * 存整份 HTML 而不是差異：一份 50–70KB，留 30 版也才 2MB，
 * 而「拿回某一版」變成單純的複製檔案，不需要任何重組邏輯——
 * 客戶按下還原的那一刻，最不需要的就是一段可能會出錯的還原程式。
 *
 *   versions/index.json   依時間排（舊 → 新）
 *   versions/<版本編號>.html
 */
import fs from "node:fs";
import path from "node:path";

/* 留 30 版。第一版（原始的樣子）永遠不刪——那是唯一一個「回到什麼都還沒改」
   的入口，被輪替掉的話客戶就再也回不去了。 */
const KEEP = 30;

const dirOf = (dir) => path.join(dir, "versions");
const indexOf_ = (dir) => path.join(dirOf(dir), "index.json");
const fileOf = (dir, id) => path.join(dirOf(dir), `${id}.html`);
const pageOf = (dir) => path.join(dir, "public", "index.html");

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** 寫檔一律先寫 .tmp 再改名：寫到一半被讀到的話，拿到的是半個檔案。 */
function writeAtomic(file, body) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, body);
  fs.renameSync(tmp, file);
}

export function list(dir) {
  try { return JSON.parse(fs.readFileSync(indexOf_(dir), "utf8")); }
  catch { return []; }   // 還沒有任何版本，或索引壞了——兩種都當作沒有
}

function save(dir, entries) {
  fs.mkdirSync(dirOf(dir), { recursive: true });
  writeAtomic(indexOf_(dir), JSON.stringify(entries, null, 1));
}

/**
 * 把目前的 index.html 存成一個版本。
 *
 * note 是給客戶看的一句話，直接用他自己說的那句——「把統計數字放大」
 * 比「版本 7」有用得多，那正是 v0 最好的地方：看得懂自己叫它做了什麼。
 */
export function record(dir, { note, action = "edit", displayName } = {}) {
  const page = pageOf(dir);
  if (!fs.existsSync(page)) return null;
  const body = fs.readFileSync(page);
  const entries = list(dir);

  /* 內容跟最新那一版一模一樣就不要再存。還原之後緊接著又存一份，
     清單上會出現兩個看起來一樣的項目，而客戶分不出差別。 */
  const last = entries[entries.length - 1];
  if (last && fs.existsSync(fileOf(dir, last.id)) && fs.readFileSync(fileOf(dir, last.id)).equals(body)) {
    return last.id;
  }

  const id = newId();
  fs.mkdirSync(dirOf(dir), { recursive: true });
  writeAtomic(fileOf(dir, id), body);
  /* 連同當時的系統名稱一起記。名稱存在資料庫、畫面存在檔案，
     只還原檔案的話兩邊會對不起來——資料庫說它叫 A、HTML 裡寫的是 B，
     之後改名就再也找不到要替換的字串。 */
  entries.push({ id, at: new Date().toISOString().slice(0, 19).replace("T", " "),
    note: String(note || "").slice(0, 200), action, bytes: body.length,
    /* 沒指定就沿用上一版。只有改名那一支需要真的給值，其他呼叫端
       （改程式、改畫面）不該為了「別把名字弄掉」而記得傳這個參數
       ——那種要靠每個人記得的規則，遲早會有一個地方漏掉。 */
    displayName: displayName === undefined ? (last ? last.displayName ?? null : null) : displayName });

  /* 超過上限就往前刪，但永遠留著第一版。 */
  while (entries.length > KEEP) {
    const drop = entries.splice(1, 1)[0];
    try { fs.unlinkSync(fileOf(dir, drop.id)); } catch { /* 檔案先被刪過也無妨 */ }
  }
  save(dir, entries);
  return id;
}

/**
 * 第一次修改之前先把「原始的樣子」留下來。
 *
 * 沒有這一版的話，客戶改了一次就再也回不到他當初複製過來的樣子——
 * 而那正是他最可能想回去的地方。
 */
export function ensureBaseline(dir, displayName) {
  if (list(dir).length) return null;
  return record(dir, { note: "剛複製過來的原始樣子", action: "baseline", displayName });
}

/**
 * 回到某一版。
 *
 * 還原本身也記成一個新版本，而不是把後面的歷史刪掉——「還原了之後又想回去」
 * 是很常見的事，砍掉歷史的話那一步就走不回來了。
 */
export function restore(dir, id) {
  const src = fileOf(dir, id);
  if (!fs.existsSync(src)) return { ok: false, why: "找不到這個版本" };
  const entries = list(dir);
  const hit = entries.find((e) => e.id === id);
  if (!hit) return { ok: false, why: "找不到這個版本" };

  const body = fs.readFileSync(src);
  if (fs.existsSync(pageOf(dir)) && fs.readFileSync(pageOf(dir)).equals(body)) {
    return { ok: false, why: "現在就是這一版" };
  }
  writeAtomic(pageOf(dir), body);
  const newVersion = record(dir, { note: `還原到「${hit.note || hit.id}」`, action: "restore",
    displayName: hit.displayName });
  /* 把那一版當時的系統名稱一起交出去，呼叫端要拿去同步資料庫。 */
  return { ok: true, id: newVersion, from: id, displayName: hit.displayName };
}

/** 上一版是哪一個。助理說「還原」時用——他要的是「回到我剛才改壞之前」。 */
export function previous(dir) {
  const entries = list(dir);
  return entries.length >= 2 ? entries[entries.length - 2].id : null;
}

/** 某一版的內容。工作台要拿去做「先看看那一版長什麼樣」。 */
export function read(dir, id) {
  const f = fileOf(dir, id);
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
}
