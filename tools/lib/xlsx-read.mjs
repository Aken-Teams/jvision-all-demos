/**
 * 極簡 xlsx 讀取器（零 npm 依賴）。
 * xlsx 本質是 zip + XML；用系統 unzip 解到暫存目錄後解析 sharedStrings 與 worksheet。
 * 注意：這份檔案的元素帶 x: 命名空間前綴（<x:row>/<x:c>/<x:t>），正則需相容有無前綴兩種。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const decode = (s) => String(s)
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&amp;/g, "&");

const colIndex = (ref) => {
  const letters = (ref.match(/^[A-Z]+/) || ["A"])[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

export function openWorkbook(file) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xlsx-"));
  execFileSync("unzip", ["-o", "-q", path.resolve(file), "-d", dir]);

  const ssPath = path.join(dir, "xl", "sharedStrings.xml");
  const shared = fs.existsSync(ssPath)
    ? [...fs.readFileSync(ssPath, "utf8").matchAll(/<(?:x:)?si>([\s\S]*?)<\/(?:x:)?si>/g)]
        .map((m) => decode([...m[1].matchAll(/<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/g)].map((t) => t[1]).join("")))
    : [];

  const wb = fs.readFileSync(path.join(dir, "xl", "workbook.xml"), "utf8");
  const names = [...wb.matchAll(/<(?:x:)?sheet[^>]*name="([^"]+)"/g)].map((m) => decode(m[1]));

  const readSheet = (n) => {
    const file = path.join(dir, "xl", "worksheets", `sheet${n}.xml`);
    if (!fs.existsSync(file)) return [];
    const xml = fs.readFileSync(file, "utf8");
    const rows = [];
    for (const rm of xml.matchAll(/<(?:x:)?row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/(?:x:)?row>/g)) {
      const cells = [];
      for (const cm of rm[2].matchAll(/<(?:x:)?c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:x:)?c>)/g)) {
        const attrs = cm[2] || "", body = cm[3] || "";
        let value = "";
        if (/t="inlineStr"/.test(attrs)) {
          value = decode([...body.matchAll(/<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/g)].map((t) => t[1]).join(""));
        } else {
          const vm = body.match(/<(?:x:)?v>([\s\S]*?)<\/(?:x:)?v>/);
          if (vm) value = /t="s"/.test(attrs) ? (shared[+vm[1]] ?? "") : decode(vm[1]);
        }
        cells[colIndex(cm[1])] = value;
      }
      rows[+rm[1] - 1] = cells;
    }
    return rows.map((r) => r || []);
  };

  const cleanup = () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* 暫存清不掉不影響 */ } };
  return { names, readSheet, cleanup };
}

/** 找出欄位最多的那一列當標頭，回傳 {header, rows} 物件陣列。 */
export function toObjects(rows) {
  const filled = rows.filter((r) => r.some((c) => String(c || "").trim()));
  let hi = 0;
  filled.forEach((r, i) => { if (r.filter(Boolean).length > filled[hi].filter(Boolean).length) hi = i; });
  const header = filled[hi];
  return filled.slice(hi + 1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""]).filter(([h]) => h)));
}
