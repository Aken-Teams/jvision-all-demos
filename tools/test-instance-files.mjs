#!/usr/bin/env node
/**
 * lib/instance-files.mjs 的測試。全部在暫存目錄裡跑。
 *
 * 這一支守的是路徑邊界。read() 接的是使用者從網址帶進來的字串，
 * 而它做的事是「照這個字串讀檔」——擋漏一種寫法就是把整台機器的檔案
 * 開給前端。這種洞不會有任何症狀，直到有人去找它。
 *
 *   node tools/test-instance-files.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as files from "./lib/instance-files.mjs";

let pass = 0, fail = 0;
const t = (n, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✔" : "✘"} ${n}`
    + (ok ? "" : `\n    得到 ${JSON.stringify(got)}\n    預期 ${JSON.stringify(want)}`));
  ok ? (pass += 1) : (fail += 1);
};

const d = fs.mkdtempSync(path.join(os.tmpdir(), "jvfiles-"));
fs.mkdirSync(path.join(d, "public", "_jv"), { recursive: true });
fs.mkdirSync(path.join(d, "uploads"), { recursive: true });
fs.mkdirSync(path.join(d, "versions"), { recursive: true });
fs.mkdirSync(path.join(d, "refs"), { recursive: true });
fs.writeFileSync(path.join(d, "public", "index.html"), "<h1>hi</h1>");
fs.writeFileSync(path.join(d, "public", "_jv", "live.js"), "// live");
fs.writeFileSync(path.join(d, "public", "_jv", "logo.png"), "binary");
fs.writeFileSync(path.join(d, "uploads", "shot.jpg"), "img");
fs.writeFileSync(path.join(d, "versions", "v1.html"), "<old>");
fs.writeFileSync(path.join(d, "README.md"), "# 說明");

const l = files.list(d);
const paths = l.map((x) => x.path);
t("列出骨架", paths, ["public", "public/_jv", "public/_jv/live.js", "public/index.html", "refs", "README.md"]);
/* uploads 是對話附件、versions 是歷史快照——改十次就多十份 60~90KB 的 HTML，
   放進「這套系統由哪些檔案組成」只會把真正的骨架淹掉。 */
t("不列 uploads", paths.some((x) => x.startsWith("uploads")), false);
t("不列 versions", paths.some((x) => x.startsWith("versions")), false);
t("不列二進位檔", paths.some((x) => x.endsWith(".png")), false);
t("目錄有標註用途", l.find((x) => x.path === "public").note.length > 0, true);
t("檔案有標註角色", l.find((x) => x.path === "public/index.html").title, "畫面本體");
t("只有畫面本體可改", l.filter((x) => x.editable).map((x) => x.path), ["public/index.html"]);

/* ── 路徑邊界 ─────────────────────────────────────── */
t("讀得到正常檔", files.read(d, "public/index.html").text, "<h1>hi</h1>");
t("擋路徑穿越", files.read(d, "../../../etc/passwd"), null);
t("擋混合穿越", files.read(d, "public/../../../etc/passwd"), null);
t("擋絕對路徑", files.read(d, "/etc/passwd"), null);
t("擋不在白名單的副檔名", files.read(d, "uploads/shot.jpg"), null);
t("擋目錄", files.read(d, "public"), null);
t("擋不存在的", files.read(d, "public/nope.html"), null);
t("擋空字串", files.read(d, ""), null);
t("擋超長路徑", files.read(d, "a/".repeat(200) + "x.html"), null);

/* 太長的檔要截斷。整份 2MB 塞進 <pre> 會讓瀏覽器卡住。 */
fs.writeFileSync(path.join(d, "public", "big.html"), "x".repeat(files.MAX_VIEW + 1000));
const big = files.read(d, "public/big.html");
t("太長的檔會截斷", big.truncated, true);
t("  但仍回報真實大小", big.bytes > files.MAX_VIEW, true);

fs.rmSync(d, { recursive: true, force: true });
console.log(`\n${pass} 過、${fail} 失敗`);
process.exit(fail ? 1 : 0);
