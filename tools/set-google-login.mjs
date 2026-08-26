#!/usr/bin/env node
/**
 * 把 Google OAuth 憑證寫進 var/admin.json。
 *
 * 用腳本而不是手改 JSON：那個檔同時放著後台密碼與簽章金鑰，手改時一個逗號
 * 打錯整個檔就解析失敗，後台會變成「密碼未設定、誰都進不去」。
 *
 *   node tools/set-google-login.mjs --id=<用戶端ID> --secret=<用戶端密鑰>
 *   node tools/set-google-login.mjs --allow=a@x.com,b@y.com     只改白名單
 *   node tools/set-google-login.mjs --show                      看目前設定（密鑰遮蔽）
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const FILE = path.join(ROOT, "var", "admin.json");
const arg = (k) => {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : null;
};
const has = (k) => process.argv.slice(2).includes(`--${k}`);

let conf;
try { conf = JSON.parse(fs.readFileSync(FILE, "utf8")); }
catch (e) { console.error(`✖ 讀不到 ${path.relative(ROOT, FILE)}：${e.message}`); process.exit(1); }
conf.google = conf.google || { clientId: "", clientSecret: "", allowedEmails: [] };

const mask = (v) => (v ? `${String(v).slice(0, 8)}…（${String(v).length} 字元）` : "（未設定）");
if (has("show")) {
  console.log(`用戶端 ID    ${conf.google.clientId || "（未設定）"}`);
  console.log(`用戶端密鑰   ${mask(conf.google.clientSecret)}`);
  console.log(`允許的信箱   ${(conf.google.allowedEmails || []).join("、") || "（空 —— 一律拒絕）"}`);
  process.exit(0);
}

const id = arg("id");
const secret = arg("secret");
const allow = arg("allow");
if (!id && !secret && !allow) {
  console.error("用法：node tools/set-google-login.mjs --id=<用戶端ID> --secret=<用戶端密鑰> [--allow=a@x.com,b@y.com]");
  process.exit(2);
}

if (id) {
  /* Google 的用戶端 ID 一定是這個形狀。貼錯（例如貼成專案編號或 API 金鑰）
     時要當場擋下來，不然要等到按了登入被 Google 退回才知道。 */
  if (!/\.apps\.googleusercontent\.com$/.test(id)) {
    console.error("✖ 用戶端 ID 看起來不對，正確的會以 .apps.googleusercontent.com 結尾");
    process.exit(2);
  }
  conf.google.clientId = id.trim();
}
if (secret) {
  if (secret.trim().length < 10) { console.error("✖ 用戶端密鑰太短，可能貼錯了"); process.exit(2); }
  conf.google.clientSecret = secret.trim();
}
if (allow) {
  const list = allow.split(",").map((x) => x.trim()).filter(Boolean);
  const bad = list.filter((x) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x));
  if (bad.length) { console.error(`✖ 這些不像信箱：${bad.join("、")}`); process.exit(2); }
  conf.google.allowedEmails = list;
}

/* 先寫暫存檔再換過去。直接覆寫時若中途出錯，這個檔會半殘，
   而它壞掉等於後台密碼與簽章金鑰一起消失。 */
const tmp = `${FILE}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(conf, null, 2) + "\n", { mode: 0o600 });
fs.renameSync(tmp, FILE);
fs.chmodSync(FILE, 0o600);

console.log("已寫入 var/admin.json（權限 600，不進版控）");
console.log(`  用戶端 ID    ${conf.google.clientId || "（未設定）"}`);
console.log(`  用戶端密鑰   ${mask(conf.google.clientSecret)}`);
console.log(`  允許的信箱   ${(conf.google.allowedEmails || []).join("、") || "（空 —— 一律拒絕）"}`);
const ready = conf.google.clientId && conf.google.clientSecret;
console.log(ready
  ? "\n接著執行：systemctl --user restart caseshow\n重啟後入口頁就會出現「使用 Google 帳號登入」。"
  : "\n用戶端 ID 與密鑰都填好之後，Google 登入才會啟用。");
