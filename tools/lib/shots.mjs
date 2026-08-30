/**
 * 使用者上傳的截圖存檔。
 *
 * 只認影像，而且副檔名走白名單而不是照 base64 前綴決定——讓前綴自己決定的話，
 * 送個 image/svg+xml 進來就成了可執行內容。
 */
import fs from "node:fs";
import path from "node:path";

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX = 4 * 1024 * 1024;

/** 存進 dir，回 {name, bytes}；不是合法影像或太大就回 null。 */
export function saveShot(dir, dataUrl) {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (!buf.length || buf.length > MAX) return null;
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${EXT[m[1]]}`;
  fs.writeFileSync(path.join(dir, name), buf);
  return { name, bytes: buf.length };
}

/**
 * 讀回一張截圖的絕對路徑。檔名是外部輸入，所以除了格式限制，
 * 路徑組出來之後還要確認仍在指定目錄底下——只靠正則擋不夠。
 */
export function shotPath(dir, name) {
  if (!/^[a-z0-9-]+\.(png|jpg|webp)$/.test(String(name || ""))) return null;
  const base = path.resolve(dir);
  const file = path.resolve(base, name);
  if (!file.startsWith(base + path.sep) || !fs.existsSync(file)) return null;
  return file;
}

export const MIME = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
