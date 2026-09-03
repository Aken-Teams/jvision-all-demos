#!/usr/bin/env node
/**
 * lib/instance-refs.mjs 的測試。不碰資料庫、不碰正式實例。
 *
 * 這一支守的是兩件事：
 * 一、**檔名消毒**。上傳的檔名是使用者控制的字串，少擋一種寫法就是一條寫到
 *     實例目錄外面的路。這種洞不會有任何症狀，直到有人去找它。
 * 二、**提示詞的量**。參考資料是要塞進 codex 提示詞的，而那份提示詞已經有
 *     四五十 KB。CSV 沒有裁就是把整份資料倒進去，然後每一次修改都逾時。
 *
 *   node tools/test-instance-refs.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as refs from "./lib/instance-refs.mjs";

let pass = 0, fail = 0;
const t = (n, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✔" : "✘"} ${n}`
    + (ok ? "" : `\n    得到 ${JSON.stringify(got)}\n    預期 ${JSON.stringify(want)}`));
  ok ? (pass += 1) : (fail += 1);
};

const tmps = [];
const mk = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), "jvref-")); tmps.push(d); return d; };
const d = mk();

/* ── 檔名 ─────────────────────────────────────────── */
t("擋路徑穿越", refs.safeName("../../../etc/passwd.md"), "passwd.md");
/* POSIX 上反斜線不是路徑分隔字元，basename 拿到整串，消毒後變成 ".._.._win.md"，
   點開頭於是被整個拒絕。拒絕比默默改名安全：改名會讓一個奇怪的檔名安靜地存進去。 */
t("擋反斜線（整個拒絕）", refs.safeName("..\\..\\win.md"), null);
t("擋沒有副檔名", refs.safeName("passwd"), null);
t("擋不收的型別", refs.safeName("x.exe"), null);
t("擋點開頭", refs.safeName(".env.md"), null);
t("擋空字串", refs.safeName(""), null);

/* ── 存取 ─────────────────────────────────────────── */
t("存一份 md", refs.save(d, "plan.md", "# 我們的規劃\n用「承辦人」不要用「負責人」").ok, true);
t("空檔擋掉", refs.save(d, "x.md", "   ").ok, false);
t("太大擋掉", refs.save(d, "big.md", "x".repeat(refs.MAX_BYTES + 1)).ok, false);

refs.save(d, "data.csv",
  `承辦人,金額,狀態\n${Array.from({ length: 40 }, (_, i) => `林${i},${i * 1000},已歸檔`).join("\n")}`);
const l = refs.list(d);
t("列出兩份", l.map((x) => x.name), ["data.csv", "plan.md"]);
t("種類判對", l.map((x) => x.kind), ["資料樣本", "規劃／說明文件"]);

/* ── 提示詞 ───────────────────────────────────────── */
const blk = refs.promptBlock(d);
t("帶到 md 的內容", blk.includes("用「承辦人」不要用「負責人」"), true);
/* CSV 整份倒進去的話，提示詞會被一份幾千列的資料吃掉。 */
t("CSV 只帶前 12 列", (blk.match(/林\d+,/g) || []).length, 12);
t("CSV 有說明總列數", blk.includes("共 40 列"), true);
t("有講清楚要優先於模板", blk.includes("優先於我們模板裡的假資料"), true);

t("刪得掉", refs.remove(d, "plan.md"), true);
t("刪不存在的回 false", refs.remove(d, "nope.md"), false);
t("沒有檔案時回空字串（呼叫端不必判斷）", refs.promptBlock(mk()), "");

tmps.forEach((x) => { try { fs.rmSync(x, { recursive: true, force: true }); } catch { /* 清不掉不影響 */ } });
console.log(`\n${pass} 過、${fail} 失敗`);
process.exit(fail ? 1 : 0);
